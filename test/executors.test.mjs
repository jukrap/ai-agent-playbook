import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildWorkerEnvironment,
  executeWorker,
  inspectExecutors,
  selectExecutor
} from '../src/automation/executors.mjs';

test('executor inspection refuses ambiguous auto selection and never auto-selects preview adapters', async () => {
  const inspected = await inspectExecutors({
    which: async (name) => ({ codex: 'C:/bin/codex.exe', claude: 'C:/bin/claude.exe', gh: 'C:/bin/gh.exe' })[name] ?? null,
    activeAdapter: null,
    credentialStatus: { codex: true, claude: true }
  });

  assert.equal(inspected.available.codex, true);
  assert.equal(inspected.available.claude, true);
  assert.equal(inspected.available['github-agent-task'], false);
  const selected = selectExecutor({ provider: 'auto', inspected });
  assert.equal(selected.ok, false);
  assert.equal(selected.reason, 'ambiguous');
  assert.deepEqual(selected.candidates, ['codex', 'claude']);

  const explicitPreview = selectExecutor({ provider: 'github-agent-task', inspected, enableGithubAgentTask: true });
  assert.equal(explicitPreview.ok, true);
  assert.equal(explicitPreview.provider, 'github-agent-task');
});

test('active adapter and explicit command selection are deterministic', async () => {
  const inspected = await inspectExecutors({
    which: async (name) => (['codex', 'claude'].includes(name) ? name : null),
    activeAdapter: 'claude',
    credentialStatus: { codex: true, claude: true }
  });
  assert.equal(selectExecutor({ provider: 'auto', inspected }).provider, 'claude');
  assert.equal(selectExecutor({ provider: 'command', inspected, command: ['worker', '--json'] }).provider, 'command');
  assert.equal(selectExecutor({ provider: 'command', inspected, command: ['worker && bad'] }).ok, false);
});

test('worker environment isolates user homes and strips forge and Git credentials', () => {
  const isolatedHome = path.join(os.tmpdir(), 'aapb-isolated-test-home');
  const env = buildWorkerEnvironment({
    PATH: 'C:/bin',
    SystemRoot: 'C:/Windows',
    HOME: 'C:/Users/test',
    GH_TOKEN: 'secret-gh',
    GITHUB_TOKEN: 'secret-actions',
    GITEA_TOKEN: 'secret-gitea',
    API_KEY: 'secret-api',
    GIT_ASKPASS: 'credential-helper',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'remote.origin.pushurl',
    GIT_CONFIG_VALUE_0: 'https://token@example.invalid/repo'
  }, { home: isolatedHome });

  assert.equal(env.PATH, 'C:/bin');
  assert.equal(env.HOME, path.resolve(isolatedHome));
  assert.notEqual(env.HOME, 'C:/Users/test');
  assert.equal(env.USERPROFILE, path.resolve(isolatedHome));
  assert.equal(env.APPDATA.startsWith(path.resolve(isolatedHome)), true);
  assert.equal(env.GH_TOKEN, undefined);
  assert.equal(env.GITHUB_TOKEN, undefined);
  assert.equal(env.GITEA_TOKEN, undefined);
  assert.equal(env.API_KEY, undefined);
  assert.equal(env.GIT_ASKPASS, undefined);
  assert.equal(env.GIT_CONFIG_COUNT, '2');
  assert.equal(env.GIT_CONFIG_KEY_0, 'credential.helper');
  assert.equal(env.GIT_CONFIG_VALUE_0, '');
  assert.equal(env.GIT_CONFIG_KEY_1, 'remote.origin.pushurl');
  assert.equal(env.GIT_CONFIG_VALUE_1, 'https://127.0.0.1.invalid/aapb-worker-push-disabled');
  assert.doesNotMatch(JSON.stringify(env), /secret-|token@example/);
  assert.equal(env.GIT_TERMINAL_PROMPT, '0');
  assert.equal(env.GCM_INTERACTIVE, 'Never');
  assert.equal(env.GIT_CONFIG_NOSYSTEM, '1');
  assert.equal(env.GIT_CONFIG_GLOBAL, process.platform === 'win32' ? 'NUL' : '/dev/null');
});

test('worker projects only the selected model credential into an isolated adapter home', () => {
  const home = path.join(os.tmpdir(), 'aapb-model-home');
  const codex = buildWorkerEnvironment({
    HOME: 'C:/Users/real',
    APPDATA: 'C:/Users/real/AppData/Roaming',
    XDG_CONFIG_HOME: 'C:/Users/real/.config',
    OPENAI_API_KEY: 'sk-proj-model-only-123456789',
    GH_TOKEN: 'github-must-not-pass',
    GITEA_TOKEN: 'gitea-must-not-pass'
  }, { provider: 'codex', home });
  assert.equal(codex.OPENAI_API_KEY, 'sk-proj-model-only-123456789');
  assert.equal(codex.CODEX_HOME, path.join(path.resolve(home), '.codex'));
  assert.doesNotMatch(JSON.stringify(codex), /C:\\Users\\real|github-must-not-pass|gitea-must-not-pass/);
});

test('worker execution uses argv without a shell and returns bounded redacted evidence', async () => {
  const calls = [];
  const result = await executeWorker({
    provider: 'command',
    command: ['worker-cli', '--json'],
    cwd: 'C:/workspace',
    prompt: 'Implement task-001.',
    env: { PATH: 'C:/bin', GH_TOKEN: 'top-secret' },
    runProcess: async (call) => {
      calls.push(call);
      return { exitCode: 0, stdout: 'done token=abc123', stderr: '' };
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'worker-cli');
  assert.deepEqual(calls[0].args, ['--json']);
  assert.equal(calls[0].shell, false);
  assert.equal(calls[0].input, 'Implement task-001.');
  assert.equal(calls[0].env.GH_TOKEN, undefined);
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.stdout, /abc123/);
  assert.match(result.stdout, /\[REDACTED\]/);
});

test('Codex receives only a temporary auth projection and Claude runs in bare mode', async (t) => {
  const realHome = await mkdtemp(path.join(os.tmpdir(), 'aapb-real-model-home-'));
  t.after(() => rm(realHome, { recursive: true, force: true }));
  await mkdir(path.join(realHome, '.codex'), { recursive: true });
  await writeFile(path.join(realHome, '.codex', 'auth.json'), '{"fake":"model-auth"}\n');
  let projectedHome;
  const codex = await executeWorker({
    provider: 'codex',
    executable: 'codex',
    cwd: realHome,
    prompt: 'bounded task',
    env: { PATH: 'C:/bin', HOME: realHome, USERPROFILE: realHome, GH_TOKEN: 'do-not-copy' },
    runProcess: async (call) => {
      projectedHome = call.env.CODEX_HOME;
      assert.notEqual(call.env.HOME, realHome);
      assert.equal(existsSync(path.join(projectedHome, 'auth.json')), true);
      assert.equal(call.env.GH_TOKEN, undefined);
      return { exitCode: 0, stdout: 'ok', stderr: '' };
    }
  });
  assert.equal(codex.ok, true);
  assert.equal(existsSync(path.dirname(projectedHome)), false);

  const claudeCalls = [];
  const claude = await executeWorker({
    provider: 'claude',
    executable: 'claude',
    cwd: realHome,
    prompt: 'bounded task',
    env: { PATH: 'C:/bin', HOME: realHome, ANTHROPIC_API_KEY: 'sk-ant-model-only-123456789' },
    runProcess: async (call) => { claudeCalls.push(call); return { exitCode: 0, stdout: `raw ${call.env.ANTHROPIC_API_KEY}`, stderr: '' }; }
  });
  assert.equal(claude.ok, true);
  assert.deepEqual(claudeCalls[0].args, [
    '--bare',
    '--print',
    '--output-format', 'json',
    '--no-session-persistence',
    '--permission-mode', 'acceptEdits',
    '--allowedTools', 'Read,Glob,Grep,Edit,Write',
    '--disallowedTools', 'Bash'
  ]);
  assert.equal(claudeCalls[0].env.ANTHROPIC_API_KEY, 'sk-ant-model-only-123456789');
  assert.doesNotMatch(claude.stdout, /sk-ant-model-only/);
  assert.match(claude.stdout, /\[REDACTED\]/);
  assert.notEqual(claudeCalls[0].env.HOME, realHome);
});
