import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { inspectForgeStatus } from '../forge/index.mjs';
import { createFetchForgeTransport, probeGiteaCapabilities } from '../forge/http-transport.mjs';
import { inspectExecutors, selectExecutor } from './executors.mjs';
import { deriveAutomationPolicy } from './policy.mjs';

const execFileAsync = promisify(execFile);

export async function automationDoctor(options) {
  const config = options.config ?? {};
  const which = options.which ?? findExecutable;
  const runCommand = options.runCommand ?? executeCommand;
  const policy = deriveAutomationPolicy({
    configuredProfile: config.automation?.profile ?? 'deliver',
    requestedProfile: options.profile,
    noRemote: options.noRemote,
    remoteReadOnly: options.remoteReadOnly,
    noGit: options.noGit,
    offline: options.offline,
    instruction: options.instruction
  });
  if (config.forge?.sync === 'off') {
    policy.remote.read = false;
    policy.remote.write = false;
    policy.git.push = false;
  } else if (['observe', 'remote-to-local'].includes(config.forge?.sync)) {
    policy.remote.write = false;
    policy.git.push = false;
  }
  const warnings = [];
  const conflicts = [];

  const toolPaths = {
    git: await which('git'),
    gh: await which('gh'),
    tea: await which('tea'),
    schtasks: await which('schtasks.exe'),
    systemctl: await which('systemctl')
  };
  const tooling = {
    git: await toolVersion('git', toolPaths.git, runCommand),
    gh: await toolVersion('gh', toolPaths.gh, runCommand),
    tea: await toolVersion('tea', toolPaths.tea, runCommand)
  };
  const gitRequired = Boolean(policy.git.branch || policy.git.commit || policy.git.push);
  if (!toolPaths.git && gitRequired) conflicts.push(issue('git.tool.missing', 'Git is required for the effective repository automation policy.'));
  if (tooling.git.version && versionLessThan(tooling.git.version, '2.39.0') && gitRequired) {
    conflicts.push(issue('git.version.unsupported', `Git ${tooling.git.version} is below the supported minimum 2.39.0.`));
  }

  const remoteName = config.forge?.remote ?? 'origin';
  let remoteUrl = null;
  if (toolPaths.git) {
    const remote = await runCommand(commandCall('git', ['remote', 'get-url', remoteName], options.target));
    if (remote.exitCode === 0) remoteUrl = String(remote.stdout).trim();
  }
  const initialForge = inspectForgeStatus({
    remoteUrl,
    provider: config.forge?.provider ?? 'auto',
    apiBaseUrl: config.forge?.apiBaseUrl,
    profile: policy.profile,
    remoteReadOnly: !policy.remote.write,
    noRemote: !policy.remote.read,
    offline: !policy.network,
    tooling
  });
  const forgeInspection = {
    auth: { status: 'not-checked', authenticated: null, source: null, principal: null, scopes: [] },
    permissions: { repositoryRead: null, repositoryWrite: null, projects: 'unknown', evidence: [] },
    server: {
      product: ['github', 'gitea'].includes(initialForge.provider) ? initialForge.provider : null,
      host: initialForge.repository?.host ?? null,
      version: null,
      apiVersion: initialForge.provider === 'github' ? '2026-03-10' : null,
      status: 'not-checked'
    },
    probe: { status: 'not-run', checkedAt: null, evidence: [] },
    warnings: [],
    conflicts: []
  };

  if (initialForge.provider === 'github' && policy.remote.read && toolPaths.gh && initialForge.repository) {
    const auth = await runCommand(commandCall('gh', ['auth', 'status', '--hostname', initialForge.repository.host], options.target));
    tooling.gh.authenticated = auth.exitCode === 0;
    tooling.gh.scopes = parseGhScopes(`${auth.stdout ?? ''}\n${auth.stderr ?? ''}`);
    forgeInspection.auth = {
      status: auth.exitCode === 0 ? 'authenticated' : 'unauthenticated',
      authenticated: auth.exitCode === 0,
      source: 'gh',
      principal: null,
      scopes: tooling.gh.scopes
    };
    forgeInspection.probe.evidence.push({
      id: 'github.auth',
      kind: 'authentication',
      status: auth.exitCode === 0 ? 'pass' : 'fail',
      source: 'gh auth status'
    });
    if (auth.exitCode !== 0) {
      forgeInspection.permissions.repositoryRead = false;
      forgeInspection.permissions.repositoryWrite = false;
      forgeInspection.warnings.push(issue('forge.auth.github-missing', 'GitHub CLI is not authenticated for the detected host.'));
    } else {
      const endpoint = `repos/${encodeURIComponent(initialForge.repository.owner)}/${encodeURIComponent(initialForge.repository.name)}`;
      const repository = await runCommand(commandCall('gh', [
        'api',
        '--hostname', initialForge.repository.host,
        endpoint,
        '--method', 'GET',
        '--header', 'X-GitHub-Api-Version:2026-03-10'
      ], options.target));
      const repositoryData = repository.exitCode === 0 ? parseJsonObject(repository.stdout) : null;
      const repositoryPermissions = repositoryData?.permissions && typeof repositoryData.permissions === 'object'
        ? repositoryData.permissions
        : null;
      forgeInspection.permissions.repositoryRead = repositoryData !== null;
      forgeInspection.permissions.repositoryWrite = Boolean(
        repositoryPermissions?.admin || repositoryPermissions?.maintain || repositoryPermissions?.push
      );
      forgeInspection.permissions.evidence.push({
        id: 'github.repository-permissions',
        source: 'repository API',
        status: repositoryData ? 'verified' : 'unavailable'
      });
      forgeInspection.server.status = repositoryData ? 'reachable' : 'unverified';
      forgeInspection.probe.status = repositoryData ? 'verified' : 'degraded';
      forgeInspection.probe.evidence.push({
        id: 'github.repository',
        kind: 'repository',
        status: repositoryData ? 'pass' : 'fail',
        source: endpoint
      });
      if (!repositoryData) {
        forgeInspection.warnings.push(issue('forge.permission.github-unverified', 'GitHub repository permissions could not be verified; remote writes are disabled.'));
      } else if (!forgeInspection.permissions.repositoryWrite) {
        forgeInspection.warnings.push(issue('forge.permission.github-read-only', 'The authenticated GitHub principal does not have verified repository write permission.'));
      }
    }
    if (tooling.gh.scopes.includes('project')) {
      forgeInspection.permissions.projects = 'read-write';
    } else if (tooling.gh.scopes.includes('read:project')) {
      forgeInspection.permissions.projects = 'read-only';
    } else {
      forgeInspection.permissions.projects = 'unavailable';
      forgeInspection.warnings.push(issue('forge.scope.projects-missing', 'GitHub Projects access is unavailable; Issues and Milestones remain usable without changing auth scopes.'));
    }
    if (tooling.gh.version && versionLessThan(tooling.gh.version, '2.80.0')) {
      forgeInspection.conflicts.push(issue('forge.tool.gh-version-unsupported', `GitHub CLI ${tooling.gh.version} is below the supported minimum 2.80.0.`));
    }
  }
  if (initialForge.provider === 'github' && policy.remote.read && !toolPaths.gh && initialForge.repository) {
    forgeInspection.warnings.push(issue('forge.tool.gh-missing', 'GitHub CLI is unavailable, so authentication and repository permissions could not be verified.'));
  }
  if (initialForge.provider === 'gitea' && policy.remote.read && !toolPaths.tea) {
    forgeInspection.warnings.push(issue('forge.tool.tea-missing', 'tea is not installed; Gitea REST transport or explicit credentials are required for remote operations.'));
  } else if (initialForge.provider === 'gitea' && tooling.tea.version && versionLessThan(tooling.tea.version, '0.14.2')) {
    forgeInspection.warnings.push(issue('forge.tool.tea-version-unsupported', `tea ${tooling.tea.version} is below the verified minimum 0.14.2; the REST transport remains available.`));
  }

  if (initialForge.provider === 'gitea' && policy.remote.read && initialForge.repository) {
    const baseUrl = initialForge.repository.apiBaseUrl ?? `https://${initialForge.repository.host}/api/v1`;
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    const env = options.env ?? process.env;
    try {
      const anonymousTransport = createFetchForgeTransport({
        provider: 'gitea',
        baseUrl,
        anonymous: true,
        fetchImpl,
        sleep: options.sleep,
        now: options.now,
        timeoutMs: options.timeoutMs
      });
      const probed = await probeGiteaCapabilities({ transport: anonymousTransport });
      forgeInspection.server = {
        product: 'gitea',
        host: initialForge.repository.host,
        version: probed.version,
        apiVersion: 'v1',
        status: probed.confirmed ? 'reachable' : 'unverified'
      };
      forgeInspection.probe = {
        status: probed.confirmed && probed.openapiAvailable ? 'verified' : 'degraded',
        checkedAt: new Date(options.now?.() ?? Date.now()).toISOString(),
        evidence: probed.evidence,
        capabilities: probed.capabilities
      };
      if (!probed.confirmed || !probed.openapiAvailable) {
        forgeInspection.permissions.repositoryRead = false;
        forgeInspection.permissions.repositoryWrite = false;
        forgeInspection.conflicts.push(issue('forge.gitea.probe-unverified', 'Gitea identity and OpenAPI capabilities must be verified before remote writes.'));
      } else {
        const token = nonEmpty(env.GITEA_TOKEN) ?? nonEmpty(env.AAPB_FORGE_TOKEN);
        if (!token) {
          forgeInspection.auth = { status: 'unauthenticated', authenticated: false, source: null, principal: null, scopes: [] };
          forgeInspection.permissions.repositoryRead = false;
          forgeInspection.permissions.repositoryWrite = false;
          forgeInspection.warnings.push(issue('forge.auth.gitea-missing', 'Gitea authentication is unavailable; provide a host-appropriate GITEA_TOKEN for remote operations.'));
        } else {
          const authenticatedTransport = createFetchForgeTransport({
            provider: 'gitea',
            baseUrl,
            token,
            fetchImpl,
            sleep: options.sleep,
            now: options.now,
            timeoutMs: options.timeoutMs
          });
          try {
            const userResponse = await authenticatedTransport.request({ method: 'GET', path: '/user', headers: {} });
            const principal = typeof userResponse.data?.login === 'string' ? userResponse.data.login : null;
            forgeInspection.auth = {
              status: 'authenticated',
              authenticated: true,
              source: 'environment',
              principal,
              scopes: []
            };
          } catch (error) {
            forgeInspection.auth = { status: 'unauthenticated', authenticated: false, source: 'environment', principal: null, scopes: [] };
            forgeInspection.permissions.repositoryRead = false;
            forgeInspection.permissions.repositoryWrite = false;
            forgeInspection.warnings.push(issue('forge.auth.gitea-invalid', `Gitea authentication could not be verified: ${redact(String(error?.message ?? error))}`));
          }
          if (forgeInspection.auth.authenticated) {
            try {
              const repositoryResponse = await authenticatedTransport.request({
                method: 'GET',
                path: `/repos/${encodeURIComponent(initialForge.repository.owner)}/${encodeURIComponent(initialForge.repository.name)}`,
                headers: {}
              });
              const repositoryPermissions = repositoryResponse.data?.permissions && typeof repositoryResponse.data.permissions === 'object'
                ? repositoryResponse.data.permissions
                : {};
              forgeInspection.permissions.repositoryRead = true;
              forgeInspection.permissions.repositoryWrite = Boolean(repositoryPermissions.admin || repositoryPermissions.push);
              forgeInspection.permissions.evidence.push({
                id: 'gitea.repository-permissions',
                source: 'repository API',
                status: forgeInspection.permissions.repositoryWrite ? 'write' : 'read-only'
              });
              if (!forgeInspection.permissions.repositoryWrite) {
                forgeInspection.warnings.push(issue('forge.permission.gitea-read-only', 'The authenticated Gitea principal does not have verified repository write permission.'));
              }
            } catch (error) {
              forgeInspection.permissions.repositoryRead = false;
              forgeInspection.permissions.repositoryWrite = false;
              forgeInspection.warnings.push(issue('forge.permission.gitea-unverified', `Gitea repository permissions could not be verified: ${redact(String(error?.message ?? error))}`));
            }
          }
        }
      }
    } catch (error) {
      forgeInspection.permissions.repositoryRead = false;
      forgeInspection.permissions.repositoryWrite = false;
      forgeInspection.probe.status = 'failed';
      forgeInspection.conflicts.push(issue('forge.gitea.probe-failed', `Gitea inspection failed: ${redact(String(error?.message ?? error))}`));
    }
  }

  const forge = inspectForgeStatus({
    remoteUrl,
    provider: config.forge?.provider ?? 'auto',
    apiBaseUrl: config.forge?.apiBaseUrl,
    profile: policy.profile,
    remoteReadOnly: !policy.remote.write,
    noRemote: !policy.remote.read,
    offline: !policy.network,
    tooling,
    auth: forgeInspection.auth,
    permissions: forgeInspection.permissions,
    server: forgeInspection.server,
    probe: forgeInspection.probe,
    warnings: forgeInspection.warnings,
    conflicts: forgeInspection.conflicts
  });
  warnings.push(...forge.warnings);
  conflicts.push(...forge.conflicts);

  const inspected = await inspectExecutors({
    which,
    env: options.env ?? process.env,
    activeAdapter: options.activeAdapter ?? process.env.AI_AGENT_PLAYBOOK_ACTIVE_ADAPTER,
    githubAgentTaskAvailable: Boolean(options.enableGithubAgentTask)
  });
  const selection = selectExecutor({
    provider: config.executor?.provider ?? 'auto',
    command: config.executor?.command,
    inspected,
    enableGithubAgentTask: Boolean(options.enableGithubAgentTask)
  });
  if (!selection.ok) {
    const selectionReason = 'reason' in selection ? selection.reason : 'unknown';
    const candidates = 'candidates' in selection && Array.isArray(selection.candidates) ? selection.candidates : [];
    conflicts.push(issue(
      selectionReason === 'ambiguous' ? 'executor.selection.ambiguous' : 'executor.selection.unavailable',
      selectionReason === 'ambiguous'
        ? `Multiple executors are available (${candidates.join(', ')}); configure executor.provider or an active adapter.`
        : `Executor selection failed: ${selectionReason}.`
    ));
  }

  let dirty = null;
  if (toolPaths.git) {
    const status = await runCommand(commandCall('git', ['status', '--porcelain=v1'], options.target));
    if (status.exitCode === 0) dirty = Boolean(String(status.stdout ?? '').trim());
  }
  const unattendedMode = config.git?.unattendedWorkspace ?? 'isolated-checkout';
  const unattendedSafe = unattendedMode === 'isolated-checkout' || dirty !== true;
  if (dirty === true && unattendedMode !== 'isolated-checkout') {
    conflicts.push(issue('git.unattended.dirty-base', `A dirty user checkout cannot be used as the unattended ${unattendedMode} workspace.`));
  }

  const schedulerModes = [
    {
      id: 'windows-task',
      available: Boolean(toolPaths.schtasks),
      status: toolPaths.schtasks ? 'ready' : process.platform === 'win32' ? 'missing-tool' : 'different-platform'
    },
    {
      id: 'systemd-user',
      available: Boolean(toolPaths.systemctl),
      status: toolPaths.systemctl ? 'ready' : process.platform === 'win32' ? 'different-platform' : 'missing-tool'
    },
    {
      id: 'github-actions',
      available: forge.provider === 'github' && Boolean(forge.repository),
      status: forge.provider === 'github' && forge.repository ? 'ready' : 'provider-unavailable'
    },
    {
      id: 'gitea-actions',
      available: forge.provider === 'gitea' && Boolean(forge.repository),
      status: forge.provider === 'gitea' && forge.repository ? 'ready' : 'provider-unavailable'
    }
  ];

  return {
    schemaVersion: '2',
    kind: 'automation.doctor.v2',
    ok: conflicts.length === 0,
    target: options.target,
    policy,
    forge,
    executor: {
      inspected,
      selection
    },
    git: {
      required: gitRequired,
      tool: tooling.git,
      userCheckout: { dirty },
      unattended: { mode: unattendedMode, safe: unattendedSafe }
    },
    scheduler: {
      supported: ['windows-task', 'systemd-user', 'github-actions', 'gitea-actions'],
      previewFirst: true,
      modes: schedulerModes
    },
    warnings: deduplicate(warnings),
    conflicts: deduplicate(conflicts)
  };
}

function versionLessThan(actual, minimum) {
  const left = String(actual).split('.').map((part) => Number(part));
  const right = String(minimum).split('.').map((part) => Number(part));
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = Number.isInteger(left[index]) ? left[index] : 0;
    const b = Number.isInteger(right[index]) ? right[index] : 0;
    if (a !== b) return a < b;
  }
  return false;
}

async function toolVersion(command, executable, runCommand) {
  if (!executable) return { command, available: false, version: null };
  const result = await runCommand(commandCall(command, ['--version']));
  return {
    command,
    available: true,
    version: result.exitCode === 0 ? parseVersion(result.stdout) : null
  };
}

function parseVersion(value) {
  return String(value ?? '').match(/\b\d+\.\d+(?:\.\d+)?\b/)?.[0] ?? null;
}

function parseGhScopes(value) {
  const match = String(value).match(/Token scopes:\s*(.+)/i);
  if (!match) return [];
  return [...new Set(match[1].split(',').map((scope) => scope.replace(/[\s'".]/g, '')).filter(Boolean))];
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(String(value ?? ''));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function commandCall(command, args, cwd) {
  return { command, args, cwd, shell: false };
}

async function findExecutable(name) {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  try {
    const result = await execFileAsync(locator, [name], { windowsHide: true, timeout: 5000 });
    return String(result.stdout).split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

async function executeCommand(call) {
  try {
    const result = await execFileAsync(call.command, call.args, {
      cwd: call.cwd,
      windowsHide: true,
      timeout: 10_000,
      maxBuffer: 1024 * 1024
    });
    return { exitCode: 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  } catch (error) {
    return {
      exitCode: Number.isInteger(error.code) ? error.code : 1,
      stdout: error.stdout ?? '',
      stderr: redact(String(error.stderr ?? error.message ?? ''))
    };
  }
}

function issue(id, message) {
  return { id, message, paths: [] };
}

function deduplicate(items) {
  const byId = new Map();
  for (const item of items) byId.set(`${item.id}:${item.message}`, item);
  return [...byId.values()];
}

function redact(value) {
  return String(value)
    .replace(/\b(token|secret|password|api[_-]?key)\s*[:=]\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/(https?:\/\/)[^/@\s]+@/gi, '$1[REDACTED]@');
}
