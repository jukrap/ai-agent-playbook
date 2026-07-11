import { execFile, spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const SAFE_ENV_KEYS = new Set([
  'PATH', 'Path',
  'SystemRoot', 'SYSTEMROOT', 'COMSPEC', 'ComSpec', 'PATHEXT',
  'TMP', 'TEMP', 'TMPDIR', 'LANG', 'LANGUAGE', 'TERM',
  'PROGRAMDATA'
]);
const LOCAL_PROVIDERS = ['codex', 'claude'];
const MAX_EVIDENCE_CHARS = 64 * 1024;

export async function inspectExecutors(options = {}) {
  const which = options.which ?? findExecutable;
  const env = options.env ?? process.env;
  const paths = {
    codex: await which('codex'),
    claude: await which('claude'),
    gh: await which('gh')
  };
  const activeAdapter = LOCAL_PROVIDERS.includes(options.activeAdapter) ? options.activeAdapter : null;
  const credentialStatus = options.credentialStatus ?? {
    codex: Boolean(nonEmpty(env.OPENAI_API_KEY) || codexAuthFile(env)),
    claude: Boolean(nonEmpty(env.ANTHROPIC_API_KEY) || nonEmpty(env.ANTHROPIC_AUTH_TOKEN))
  };
  return {
    ok: true,
    activeAdapter,
    paths,
    available: {
      codex: Boolean(paths.codex && credentialStatus.codex),
      claude: Boolean(paths.claude && credentialStatus.claude),
      command: false,
      'github-agent-task': Boolean(paths.gh && options.githubAgentTaskAvailable)
    },
    credentials: {
      codex: credentialStatus.codex ? 'isolatable' : 'missing-isolated-credential',
      claude: credentialStatus.claude ? 'isolatable' : 'missing-isolated-credential'
    }
  };
}

export function selectExecutor(options) {
  const {
    provider = 'auto',
    inspected,
    command,
    enableGithubAgentTask = false
  } = options;
  if (!inspected) return selectionFailure('not-inspected');
  if (provider === 'command') {
    return isSafeCommand(command)
      ? { ok: true, provider, command: [...command] }
      : selectionFailure('invalid-command');
  }
  if (provider === 'github-agent-task') {
    return enableGithubAgentTask && inspected.paths?.gh
      ? { ok: true, provider, executable: inspected.paths.gh }
      : selectionFailure('preview-disabled');
  }
  if (provider !== 'auto') {
    return inspected.available?.[provider]
      ? { ok: true, provider, executable: inspected.paths?.[provider] ?? provider }
      : selectionFailure('unavailable');
  }

  if (inspected.activeAdapter && inspected.available?.[inspected.activeAdapter]) {
    return {
      ok: true,
      provider: inspected.activeAdapter,
      executable: inspected.paths?.[inspected.activeAdapter] ?? inspected.activeAdapter,
      selectedBy: 'active-adapter'
    };
  }
  const candidates = LOCAL_PROVIDERS.filter((candidate) => inspected.available?.[candidate]);
  if (candidates.length === 1) {
    return {
      ok: true,
      provider: candidates[0],
      executable: inspected.paths?.[candidates[0]] ?? candidates[0],
      selectedBy: 'only-candidate'
    };
  }
  if (candidates.length > 1) return selectionFailure('ambiguous', { candidates });
  return selectionFailure('unavailable', { candidates: [] });
}

export function buildWorkerEnvironment(source = process.env, options = {}) {
  const env = {};
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (SAFE_ENV_KEYS.has(key) || key.startsWith('LC_')) env[key] = String(value);
  }
  const workerHome = path.resolve(options.home ?? path.join(os.tmpdir(), 'aapb-worker-isolated'));
  env.HOME = workerHome;
  env.USERPROFILE = workerHome;
  env.HOMEDRIVE = path.parse(workerHome).root.replace(/[\\/]$/u, '');
  env.HOMEPATH = workerHome.slice(path.parse(workerHome).root.length - 1);
  env.APPDATA = path.join(workerHome, 'AppData', 'Roaming');
  env.LOCALAPPDATA = path.join(workerHome, 'AppData', 'Local');
  env.XDG_CONFIG_HOME = path.join(workerHome, '.config');
  env.XDG_CACHE_HOME = path.join(workerHome, '.cache');
  if (options.provider === 'codex') {
    copyCredentialEnvironment(source, env, ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_ORG_ID', 'OPENAI_PROJECT_ID']);
    env.CODEX_HOME = path.join(workerHome, '.codex');
  } else if (options.provider === 'claude') {
    copyCredentialEnvironment(source, env, ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL']);
  } else if (options.provider === 'github-agent-task') {
    copyCredentialEnvironment(source, env, ['GH_TOKEN', 'GITHUB_TOKEN']);
    env.GH_CONFIG_DIR = path.join(workerHome, '.config', 'gh');
  }
  env.GIT_TERMINAL_PROMPT = '0';
  env.GCM_INTERACTIVE = 'Never';
  env.GIT_OPTIONAL_LOCKS = '0';
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_SYSTEM = process.platform === 'win32' ? 'NUL' : '/dev/null';
  env.GIT_CONFIG_GLOBAL = process.platform === 'win32' ? 'NUL' : '/dev/null';
  env.GIT_CONFIG_COUNT = '2';
  env.GIT_CONFIG_KEY_0 = 'credential.helper';
  env.GIT_CONFIG_VALUE_0 = '';
  env.GIT_CONFIG_KEY_1 = `remote.${safeGitRemote(options.remote)}.pushurl`;
  env.GIT_CONFIG_VALUE_1 = 'https://127.0.0.1.invalid/aapb-worker-push-disabled';
  return env;
}

export async function collectWorkerCredentialSecrets(source = process.env, provider = 'auto') {
  const secrets = new Set();
  const add = (value) => {
    const normalized = nonEmpty(value);
    if (normalized && normalized.length >= 8 && !/[\0\r\n]/u.test(normalized)) secrets.add(normalized);
  };
  if (provider === 'codex' || provider === 'auto') add(source.OPENAI_API_KEY);
  if (provider === 'claude' || provider === 'auto') {
    add(source.ANTHROPIC_API_KEY);
    add(source.ANTHROPIC_AUTH_TOKEN);
  }
  if (provider === 'github-agent-task') {
    add(source.GH_TOKEN);
    add(source.GITHUB_TOKEN);
  }
  if ((provider === 'codex' || provider === 'auto') && !nonEmpty(source.OPENAI_API_KEY)) {
    const authFile = codexAuthFile(source);
    if (authFile) {
      try {
        const auth = JSON.parse(await readFile(authFile, 'utf8'));
        collectSecretFields(auth, '', add);
      } catch {
        // Executor readiness/projection reports malformed auth independently.
      }
    }
  }
  return [...secrets];
}

function collectSecretFields(value, key, add, depth = 0) {
  if (depth > 12 || value === null || value === undefined) return;
  if (typeof value === 'string') {
    if (/(?:token|secret|api[-_]?key|authorization)/i.test(key)) add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectSecretFields(item, key, add, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) collectSecretFields(child, childKey, add, depth + 1);
  }
}

export async function executeWorker(options) {
  const {
    provider,
    command,
    executable,
    cwd,
    prompt,
    env = process.env,
    timeoutMs = 30 * 60 * 1000,
    runProcess = runChildProcess
  } = options;
  const invocation = buildInvocation({ provider, command, executable });
  if (!invocation.ok) {
    return { ok: false, exitCode: null, stdout: '', stderr: invocation.reason, invocation };
  }
  const projectedSecrets = [
    ...await collectWorkerCredentialSecrets(env, provider),
    ...(Array.isArray(options.redactValues) ? options.redactValues : [])
  ];
  const workerHome = await mkdtemp(path.join(os.tmpdir(), 'aapb-worker-home-'));
  try {
    await prepareWorkerCredentialProjection({ provider, source: env, workerHome });
    const call = {
      command: invocation.command,
      args: invocation.args,
      cwd,
      env: buildWorkerEnvironment(env, { remote: options.gitRemote, provider, home: workerHome }),
      input: String(prompt ?? ''),
      timeoutMs,
      signal: options.signal,
      shell: false
    };
    let result;
    try {
      result = await runProcess(call);
    } catch (error) {
      result = { exitCode: 1, stdout: '', stderr: error?.message ?? String(error) };
    }
    return {
      ok: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: boundEvidence(redactSecrets(result.stdout ?? '', projectedSecrets)),
      stderr: boundEvidence(redactSecrets(result.stderr ?? '', projectedSecrets)),
      invocation: {
        provider,
        command: invocation.command,
        args: invocation.args,
        shell: false
      }
    };
  } finally {
    await rm(workerHome, { recursive: true, force: true }).catch(() => undefined);
  }
}

function safeGitRemote(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) && !value.includes('..')
    ? value
    : 'origin';
}

function buildInvocation(options) {
  const { provider, command, executable } = options;
  if (provider === 'command') {
    if (!isSafeCommand(command)) return { ok: false, reason: 'Invalid command argv.' };
    return { ok: true, command: command[0], args: command.slice(1) };
  }
  if (provider === 'codex') {
    return {
      ok: true,
      command: executable ?? 'codex',
      args: ['exec', '--json', '--sandbox', 'workspace-write', '--skip-git-repo-check', '-']
    };
  }
  if (provider === 'claude') {
    return {
      ok: true,
      command: executable ?? 'claude',
      args: [
        '--bare',
        '--print',
        '--output-format', 'json',
        '--no-session-persistence',
        '--permission-mode', 'acceptEdits',
        '--allowedTools', 'Read,Glob,Grep,Edit,Write',
        '--disallowedTools', 'Bash'
      ]
    };
  }
  if (provider === 'github-agent-task') {
    return { ok: true, command: executable ?? 'gh', args: ['agent-task', 'create', '--prompt-file', '-'] };
  }
  return { ok: false, reason: `Unsupported executor provider: ${provider}.` };
}

function isSafeCommand(command) {
  return Array.isArray(command) && command.length > 0 && command.every((part, index) => (
    typeof part === 'string' &&
    part.length > 0 &&
    !/[\0\r\n]/.test(part) &&
    (index > 0 || (/^[A-Za-z0-9][A-Za-z0-9._+:/\\-]*$/.test(part) && !part.includes('..')))
  ));
}

async function findExecutable(name) {
  const command = process.platform === 'win32' ? 'where.exe' : 'which';
  try {
    const result = await execFileAsync(command, [name], { windowsHide: true, timeout: 5000 });
    return String(result.stdout).split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

function runChildProcess(call) {
  return new Promise((resolve) => {
    if (call.signal?.aborted) {
      resolve({ exitCode: 1, stdout: '', stderr: 'Worker execution was cancelled before process start.' });
      return;
    }
    const child = spawn(call.command, call.args, {
      cwd: call.cwd,
      env: call.env,
      shell: false,
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let forceTimer = null;
    const terminate = (reason) => {
      if (settled) return;
      stderr = appendBounded(stderr, `\n${reason}`);
      void terminateProcessTree(child).finally(() => {
        if (!settled) child.kill('SIGKILL');
      });
      forceTimer ??= setTimeout(() => {
        if (settled) return;
        try {
          if (process.platform === 'win32') child.kill('SIGKILL');
          else process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }, 2000);
      forceTimer.unref?.();
    };
    const timeoutMs = Number(call.timeoutMs);
    const timer = setTimeout(
      () => terminate('Worker process tree exceeded the remaining tick deadline.'),
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 1
    );
    timer.unref?.();
    const abort = () => terminate('Worker process tree was cancelled by the controller.');
    call.signal?.addEventListener?.('abort', abort, { once: true });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout = appendBounded(stdout, chunk); });
    child.stderr.on('data', (chunk) => { stderr = appendBounded(stderr, chunk); });
    child.on('error', (error) => {
      finish({ exitCode: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on('close', (code) => {
      finish({ exitCode: code ?? 1, stdout, stderr });
    });
    child.stdin.end(call.input);

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (forceTimer) clearTimeout(forceTimer);
      call.signal?.removeEventListener?.('abort', abort);
      resolve(result);
    }
  });
}

async function terminateProcessTree(child) {
  if (!Number.isInteger(child.pid) || child.pid <= 0) return;
  if (process.platform === 'win32') {
    try {
      await execFileAsync('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
        windowsHide: true,
        timeout: 5000
      });
    } catch {
      child.kill();
    }
    return;
  }
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

function appendBounded(current, chunk) {
  const next = `${current}${chunk}`;
  return next.length > MAX_EVIDENCE_CHARS ? next.slice(-MAX_EVIDENCE_CHARS) : next;
}

function boundEvidence(value) {
  const text = String(value);
  return text.length > MAX_EVIDENCE_CHARS ? text.slice(-MAX_EVIDENCE_CHARS) : text;
}

function redactSecrets(value, exactValues = []) {
  let redacted = String(value);
  for (const secret of exactValues) redacted = redacted.split(secret).join('[REDACTED]');
  return redacted
    .replace(/\b(token|secret|password|api[_-]?key)\s*[:=]\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/\b(?:ghp|github_pat|glpat)-?[A-Za-z0-9_]{8,}\b/g, '[REDACTED]')
    .replace(/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@/g, 'https://[REDACTED]@');
}

async function prepareWorkerCredentialProjection(options) {
  await Promise.all([
    mkdir(path.join(options.workerHome, 'AppData', 'Roaming'), { recursive: true }),
    mkdir(path.join(options.workerHome, 'AppData', 'Local'), { recursive: true }),
    mkdir(path.join(options.workerHome, '.config'), { recursive: true }),
    mkdir(path.join(options.workerHome, '.cache'), { recursive: true })
  ]);
  if (options.provider !== 'codex' || nonEmpty(options.source.OPENAI_API_KEY)) return;
  const authFile = codexAuthFile(options.source);
  if (!authFile) return;
  const codexHome = path.join(options.workerHome, '.codex');
  await mkdir(codexHome, { recursive: true });
  await copyFile(authFile, path.join(codexHome, 'auth.json'));
}

function codexAuthFile(env) {
  const configured = nonEmpty(env.CODEX_HOME);
  const userHome = nonEmpty(env.USERPROFILE) ?? nonEmpty(env.HOME);
  const candidate = configured
    ? path.join(configured, 'auth.json')
    : userHome
      ? path.join(userHome, '.codex', 'auth.json')
      : null;
  return candidate && existsSync(candidate) ? candidate : null;
}

function copyCredentialEnvironment(source, target, keys) {
  for (const key of keys) {
    const value = nonEmpty(source[key]);
    if (value && !/[\0\r\n]/u.test(value)) target[key] = value;
  }
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function selectionFailure(reason, extra = {}) {
  return { ok: false, provider: null, reason, ...extra };
}
