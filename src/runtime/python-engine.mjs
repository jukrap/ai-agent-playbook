import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_TIMEOUT_MS = 8000;

export async function pythonEngineStatus(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const spawnImpl = options.spawnImpl ?? spawn;
  const candidates = pythonCandidates(repoRoot);
  const deprecations = deprecatedPythonEnvWarnings();
  const checked = [];
  let selected = null;

  for (const candidate of candidates) {
    const probe = await probeCandidate(candidate, repoRoot, spawnImpl);
    checked.push(probe);
    if (!selected && probe.available && probe.engineAvailable) {
      selected = probe;
    }
  }

  return {
    schemaVersion: '1',
    kind: 'runtime.python-status',
    ok: Boolean(selected),
    repoRoot,
    selected,
    summary: {
      candidates: checked.length,
      available: checked.filter((candidate) => candidate.available).length,
      engineAvailable: checked.filter((candidate) => candidate.engineAvailable).length
    },
    candidates: checked,
    warnings: [
      ...deprecations,
      ...(selected ? [] : [{
        id: 'python-engine.unavailable',
        message: 'No Python executable with ai_agent_playbook_engine available.'
      }])
    ]
  };
}

export async function runPythonWritingNaturalness(options) {
  const {
    repoRoot = process.cwd(),
    text,
    lang,
    filePath,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = options;
  const status = await pythonEngineStatus({ repoRoot, spawnImpl: options.spawnImpl });
  if (!status.selected) {
    const unavailable = status.warnings.find((warning) => warning.id === 'python-engine.unavailable') ?? status.warnings[0];
    return {
      ok: false,
      unavailable,
      status
    };
  }

  const candidate = status.selected;
  const input = JSON.stringify({
    schemaVersion: '1',
    task: 'writing-naturalness',
    text,
    lang,
    path: filePath
  });
  const run = await runPython(candidate.command, [
    ...candidate.args,
    '-m',
    'ai_agent_playbook_engine',
    'writing-naturalness',
    '--json'
  ], {
    repoRoot,
    input,
    timeoutMs,
    spawnImpl: options.spawnImpl
  });
  if (!run.ok) {
    return {
      ok: false,
      unavailable: {
        id: 'python-engine.execution-failed',
        message: run.error ?? 'Python engine execution failed.'
      },
      status,
      stderr: run.stderr
    };
  }

  try {
    return {
      ok: true,
      result: JSON.parse(run.stdout),
      status
    };
  } catch (error) {
    return {
      ok: false,
      unavailable: {
        id: 'python-engine.invalid-json',
        message: `Python engine returned invalid JSON: ${error.message}`
      },
      status,
      stdout: run.stdout,
      stderr: run.stderr
    };
  }
}

function pythonCandidates(repoRoot) {
  const candidates = [];
  const add = (id, command, args = []) => {
    if (!command) return;
    const key = `${command}\u0000${args.join('\u0000')}`;
    if (candidates.some((candidate) => candidate.key === key)) return;
    candidates.push({ id, command, args, key });
  };

  const envPython = process.env.AI_AGENT_PLAYBOOK_PYTHON;
  if (envPython) {
    const parsed = splitCommandLine(envPython);
    add('env.AI_AGENT_PLAYBOOK_PYTHON', parsed.command, parsed.args);
  }

  add('venv.windows', path.join(repoRoot, '.venv', 'Scripts', 'python.exe'));
  add('venv.posix', path.join(repoRoot, '.venv', 'bin', 'python'));
  add('python', 'python');
  add('python3', 'python3');
  add('py-3', 'py', ['-3']);

  return candidates
    .filter((candidate) => candidate.id.startsWith('venv.') ? existsSync(candidate.command) : true)
    .map(({ key, ...candidate }) => candidate);
}

async function probeCandidate(candidate, repoRoot, spawnImpl) {
  const code = [
    'import json, sys',
    'payload = {"executable": sys.executable, "version": sys.version.split()[0]}',
    'try:',
    '    import ai_agent_playbook_engine',
    '    payload["engineAvailable"] = True',
    '    payload["engineVersion"] = getattr(ai_agent_playbook_engine, "__version__", "0.0.0")',
    'except Exception as exc:',
    '    payload["engineAvailable"] = False',
    '    payload["engineError"] = str(exc)',
    'print(json.dumps(payload))'
  ].join('\n');
  const result = await runPython(candidate.command, [...candidate.args, '-c', code], {
    repoRoot,
    input: '',
    timeoutMs: 3000,
    spawnImpl
  });
  const base = {
    id: candidate.id,
    command: candidate.command,
    args: candidate.args,
    available: result.ok,
    engineAvailable: false
  };
  if (!result.ok) {
    return {
      ...base,
      error: result.error ?? result.stderr?.trim() ?? 'Python probe failed.'
    };
  }
  try {
    const parsed = JSON.parse(result.stdout);
    return {
      ...base,
      executable: parsed.executable,
      version: parsed.version,
      engineAvailable: Boolean(parsed.engineAvailable),
      engineVersion: parsed.engineVersion,
      engineError: parsed.engineError
    };
  } catch (error) {
    return {
      ...base,
      error: `Python probe returned invalid JSON: ${error.message}`
    };
  }
}

function runPython(command, args, options) {
  const { repoRoot, input, timeoutMs, spawnImpl = spawn } = options;
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl(command, args, {
        cwd: repoRoot,
        env: pythonEnv(repoRoot),
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error) {
      resolve({ ok: false, stdout: '', stderr: '', error: error.message });
      return;
    }
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({
        ok: false,
        stdout,
        stderr,
        error: `Python engine timed out after ${timeoutMs}ms.`
      });
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr, error: error.message });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        stdout,
        stderr,
        error: code === 0 ? null : `Python exited with code ${code}.`
      });
    });
    child.stdin.end(input);
  });
}

function pythonEnv(repoRoot) {
  const pythonPath = path.join(repoRoot, 'engines', 'python');
  const existing = process.env.PYTHONPATH;
  return {
    ...process.env,
    PYTHONPATH: existing ? `${pythonPath}${path.delimiter}${existing}` : pythonPath,
    PYTHONIOENCODING: 'utf-8'
  };
}

function deprecatedPythonEnvWarnings() {
  if (!process.env.AI_PLAYBOOK_PYTHON) return [];
  return [{
    id: 'python-engine.deprecated-env',
    message: 'AI_PLAYBOOK_PYTHON is deprecated and ignored. Use AI_AGENT_PLAYBOOK_PYTHON instead.'
  }];
}

function splitCommandLine(value) {
  const parts = [];
  const pattern = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(value)) !== null) {
    parts.push(match[1] ?? match[2] ?? match[3]);
  }
  return {
    command: parts[0],
    args: parts.slice(1)
  };
}
