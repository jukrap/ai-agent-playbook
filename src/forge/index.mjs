import { detectForgeProvider } from './detect.mjs';
import { getEffectiveForgeCapabilities } from './capabilities.mjs';

export { detectForgeProvider } from './detect.mjs';
export { getForgeCapabilities, getEffectiveForgeCapabilities } from './capabilities.mjs';
export { createCommandTransport, retryWithBackoff } from './transport.mjs';
export { createFetchForgeTransport, createDefaultForgeTransport, probeGiteaCapabilities } from './http-transport.mjs';
export { planForgeBootstrap, planForgeSync } from './plan.mjs';
export { queryReadyForgeIssues, queryManagedForgeIssues, queryReviewedForgePullRequests, inspectForgeIssue, collectReadyForgeTasks, forgeIssueToAutomationTask, mergeForgeQueueIntoPlan } from './queue.mjs';
export { applyForgePlan, previewForgePlan, reconcileForgeTask } from './apply.mjs';
export { planForgePresentationReconcile } from './reconcile.mjs';
export { createGithubProvider } from './providers/github.mjs';
export { createGiteaProvider } from './providers/gitea.mjs';

const SCHEMA_VERSION = '2';
const PROFILES = new Set(['off', 'observe', 'coordinate', 'deliver', 'release']);
const WRITE_PROFILES = new Set(['coordinate', 'deliver', 'release']);

/**
 * Build a provider-neutral forge status report without performing remote I/O.
 * Tool discovery results can be injected by a CLI or doctor command.
 *
 * @param {{
 *   remoteUrl?: string | null,
 *   provider?: string | null,
 *   apiBaseUrl?: string | null,
 *   profile?: string | null,
 *   remoteReadOnly?: boolean,
 *   noRemote?: boolean,
 *   offline?: boolean,
 *   tooling?: object,
 *   auth?: object,
 *   permissions?: object,
 *   server?: object,
 *   probe?: object,
 *   requireCapabilityProbe?: boolean,
 *   warnings?: object[],
 *   conflicts?: object[],
 *   requestedCapabilities?: string[]
 * }} [options]
 */
export function inspectForgeStatus(options = {}) {
  const detection = detectForgeProvider({
    remoteUrl: options.remoteUrl,
    provider: options.provider,
    apiBaseUrl: options.apiBaseUrl
  });
  const profile = normalizeProfile(options.profile);
  const auth = normalizeAuth(options.auth);
  const probe = normalizeProbe(options.probe);
  const capabilities = getEffectiveForgeCapabilities(detection.provider, {
    auth,
    probe: options.probe,
    requireProbe: options.requireCapabilityProbe
  });
  const warnings = [
    ...detection.warnings,
    ...normalizeIssues(options.warnings),
    ...requestedCapabilityWarnings(capabilities, options.requestedCapabilities)
  ];
  const conflicts = [...detection.conflicts, ...normalizeIssues(options.conflicts)];

  if (!PROFILES.has(profile)) {
    conflicts.push({
      id: 'forge.profile.invalid',
      message: `Unsupported forge permission profile: ${profile}.`
    });
  }

  const hasRepository = Boolean(detection.repository);
  const knownProvider = detection.provider === 'github' || detection.provider === 'gitea';
  const remoteDisabled = Boolean(options.offline || options.noRemote || profile === 'off');
  const wantsWrites = WRITE_PROFILES.has(profile) && !options.remoteReadOnly && !remoteDisabled;
  const policyWrites = wantsWrites && hasRepository && knownProvider && conflicts.length === 0;
  const permissions = normalizePermissions(options.permissions);
  const verifiedWrites = policyWrites && auth.authenticated === true && permissions.repositoryWrite === true;

  if (wantsWrites && hasRepository && !knownProvider) {
    conflicts.push({
      id: 'forge.provider.write-unsafe',
      message: 'Remote writes are disabled until the forge provider is identified explicitly.'
    });
  }

  if (remoteDisabled && hasRepository) {
    warnings.push({
      id: 'forge.remote.disabled',
      message: 'Remote forge access is disabled by the effective policy.'
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.status',
    ok: conflicts.length === 0,
    mode: {
      profile,
      remote: remoteMode({
        hasRepository,
        remoteDisabled,
        writes: verifiedWrites
      }),
      policyWrites,
      verifiedWrites,
      writes: verifiedWrites
    },
    provider: detection.provider,
    providerSource: detection.source,
    candidateProvider: detection.candidateProvider ?? null,
    repository: detection.repository,
    server: normalizeServer(options.server, detection),
    auth,
    permissions,
    probe,
    tooling: normalizeTooling(options.tooling),
    capabilities,
    warnings,
    conflicts
  };
}

export { inspectForgeStatus as inspectForge };

function remoteMode({ hasRepository, remoteDisabled, writes }) {
  if (!hasRepository) return 'local-only';
  if (remoteDisabled) return 'disabled';
  return writes ? 'read-write' : 'read-only';
}

function normalizeTooling(tooling) {
  const value = tooling && typeof tooling === 'object' ? tooling : {};
  return {
    git: normalizeTool('git', value.git),
    gh: normalizeTool('gh', value.gh),
    tea: normalizeTool('tea', value.tea)
  };
}

function normalizeTool(command, value) {
  if (typeof value === 'boolean') {
    return { command, available: value, version: null };
  }
  if (!value || typeof value !== 'object') {
    return { command, available: null, version: null };
  }
  const normalized = {
    command,
    available: typeof value.available === 'boolean' ? value.available : null,
    version: typeof value.version === 'string' && value.version.trim() ? value.version.trim() : null
  };
  if (typeof value.authenticated === 'boolean') normalized.authenticated = value.authenticated;
  if (Array.isArray(value.scopes)) {
    normalized.scopes = [...new Set(value.scopes.filter((scope) => typeof scope === 'string' && scope.trim()).map((scope) => scope.trim()))];
  }
  return normalized;
}

function requestedCapabilityWarnings(capabilities, requested) {
  if (!Array.isArray(requested)) return [];
  const warnings = [];
  const capabilityIds = [...new Set(requested
    .filter((capability) => typeof capability === 'string' && capability.trim())
    .map((capability) => capability.trim()))]
    .sort((left, right) => left.localeCompare(right));
  for (const capability of capabilityIds) {
    const state = capabilities[capability] ?? 'unsupported';
    if (state === 'supported') continue;
    warnings.push({
      id: 'forge.capability.degraded',
      capability,
      state,
      message: `${capability} is ${state} for the detected provider; inspect the operation plan before applying remote changes.`
    });
  }
  return warnings;
}

function normalizeProfile(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim().toLowerCase()
    : 'deliver';
}

function normalizeAuth(value) {
  const auth = value && typeof value === 'object' ? value : {};
  return {
    status: typeof auth.status === 'string' ? auth.status : 'not-checked',
    authenticated: typeof auth.authenticated === 'boolean' ? auth.authenticated : null,
    source: typeof auth.source === 'string' ? auth.source : null,
    principal: typeof auth.principal === 'string' ? auth.principal : null,
    scopes: Array.isArray(auth.scopes) ? [...new Set(auth.scopes.filter((scope) => typeof scope === 'string' && scope.trim()).map((scope) => scope.trim()))] : []
  };
}

function normalizePermissions(value) {
  const permissions = value && typeof value === 'object' ? value : {};
  return {
    repositoryRead: typeof permissions.repositoryRead === 'boolean' ? permissions.repositoryRead : null,
    repositoryWrite: typeof permissions.repositoryWrite === 'boolean' ? permissions.repositoryWrite : null,
    projects: typeof permissions.projects === 'string' ? permissions.projects : 'unknown',
    evidence: Array.isArray(permissions.evidence) ? structuredClone(permissions.evidence) : []
  };
}

function normalizeServer(value, detection) {
  const server = value && typeof value === 'object' ? value : {};
  return {
    product: typeof server.product === 'string' ? server.product : detection.provider === 'none' ? null : detection.provider,
    host: typeof server.host === 'string' ? server.host : detection.repository?.host ?? null,
    version: typeof server.version === 'string' ? server.version : null,
    apiVersion: typeof server.apiVersion === 'string' ? server.apiVersion : null,
    status: typeof server.status === 'string' ? server.status : 'not-checked'
  };
}

function normalizeProbe(value) {
  const probe = value && typeof value === 'object' ? value : {};
  return {
    status: typeof probe.status === 'string' ? probe.status : 'not-run',
    checkedAt: typeof probe.checkedAt === 'string' ? probe.checkedAt : null,
    evidence: Array.isArray(probe.evidence) ? structuredClone(probe.evidence) : []
  };
}

function normalizeIssues(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').map((item) => structuredClone(item)) : [];
}
