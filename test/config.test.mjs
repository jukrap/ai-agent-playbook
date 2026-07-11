import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { previewHarnessConfig } from '../src/harness.mjs';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('config preview resolves explicit user target local and environment precedence without writing files', async () => {
  const target = await tempRepo('config precedence-공백-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  const userConfig = path.join(target, 'user-config.json');
  await writeJson(userConfig, {
    context: { maxChars: 7000 },
    workflow: { defaultRecipe: 'legacy-change' },
    runtime: { indexMaxFiles: 5 }
  });
  await writeJson(path.join(target, '.ai-agent-playbook', 'config.json'), {
    context: { maxChars: 9000 },
    runtime: { indexMaxFiles: 30 }
  });
  await writeJson(path.join(target, '.ai-agent-playbook', 'config.local.json'), {
    workflow: { defaultRecipe: 'security-audit' },
    runtime: { cacheDir: '.ai-agent-playbook/runtime/cache/custom' },
    mcp: { enableWriteTools: true }
  });

  const before = await listRelativeFiles(target);
  const report = await previewHarnessConfig({
    target,
    userConfigPath: userConfig,
    env: {
      AI_AGENT_PLAYBOOK_CONTEXT_MAX_CHARS: '11000',
      AI_AGENT_PLAYBOOK_ENABLE_WRITE_TOOLS: 'false'
    }
  });

  assert.equal(report.ok, true);
  assert.equal(report.mode.writes, false);
  assert.equal(report.mode.readsUserConfig, true);
  assert.equal(report.config.context.maxChars, 11000);
  assert.equal(report.config.workflow.defaultRecipe, 'security-audit');
  assert.equal(report.config.runtime.cacheDir, '.ai-agent-playbook/runtime/cache/custom');
  assert.equal(report.config.runtime.indexMaxFiles, 30);
  assert.equal(report.config.mcp.enableWriteTools, false);
  assert.equal(report.sourceMap['context.maxChars'], 'environment');
  assert.equal(report.sourceMap['workflow.defaultRecipe'], 'target-local');
  assert.equal(report.sourceMap['runtime.indexMaxFiles'], 'target');
  assert.equal(report.sourceMap['runtime.cacheDir'], 'target-local');
  assert.equal(report.sourceMap['mcp.enableWriteTools'], 'environment');
  assert.equal(report.sources.some((source) => source.id === 'user' && source.status === 'applied'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('config preview falls back safely when config files are missing', async () => {
  const target = await tempRepo('config missing-한글-');
  const report = await previewHarnessConfig({ target, env: {} });

  assert.equal(report.ok, true);
  assert.equal(report.config.context.maxChars, 12000);
  assert.equal(report.config.runtime.cacheDir, '.ai-agent-playbook/runtime/cache');
  assert.deepEqual(report.config.automation, {
    profile: 'deliver',
    killSwitch: false,
    queue: {
      readyLabel: 'aapb:ready',
      pauseLabel: 'aapb:paused',
      maxParallel: 1
    },
    budget: {
      tickMinutes: 30,
      maxAttempts: 3,
      maxStalled: 3,
      maxWallMinutes: 480
    }
  });
  assert.deepEqual(report.config.forge, {
    provider: 'auto',
    remote: 'origin',
    apiBaseUrl: null,
    sync: 'hybrid',
    language: 'auto',
    autoBootstrap: true
  });
  assert.deepEqual(report.config.git, {
    strategy: 'branch',
    unattendedWorkspace: 'isolated-checkout',
    branchPrefix: 'aapb/',
    autoCommit: true,
    autoPush: true,
    allowForcePush: false
  });
  assert.deepEqual(report.config.executor, {
    provider: 'auto',
    command: null
  });
  assert.equal(report.mode.readsUserConfig, false);
  assert.equal(report.sources.some((source) => source.id === 'user' && source.status === 'skipped'), true);
  assert.equal(report.sources.some((source) => source.id === 'target' && source.status === 'missing'), true);
  await cleanup(target);
});

test('config preview accepts forge automation git and executor overrides', async () => {
  const target = await tempRepo('config automation-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  await writeJson(path.join(target, '.ai-agent-playbook', 'config.json'), {
    automation: {
      profile: 'coordinate',
      queue: { maxParallel: 2 },
      budget: { maxWallMinutes: 120 }
    },
    forge: { provider: 'gitea', remote: 'upstream', autoBootstrap: false },
    git: { autoPush: false },
    executor: { provider: 'command', command: ['agent-cli', '--json'] }
  });

  const report = await previewHarnessConfig({ target, env: {} });

  assert.equal(report.ok, true);
  assert.equal(report.config.automation.profile, 'coordinate');
  assert.equal(report.config.automation.queue.maxParallel, 2);
  assert.equal(report.config.automation.queue.readyLabel, 'aapb:ready');
  assert.equal(report.config.automation.budget.maxWallMinutes, 120);
  assert.equal(report.config.forge.provider, 'gitea');
  assert.equal(report.config.forge.remote, 'upstream');
  assert.equal(report.config.forge.autoBootstrap, false);
  assert.equal(report.config.git.autoPush, false);
  assert.deepEqual(report.config.executor.command, ['agent-cli', '--json']);
  await cleanup(target);
});

test('config preview accepts a credential-free Gitea API base and rejects unsafe API URLs', async () => {
  const target = await tempRepo('config forge api base-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  await writeJson(path.join(target, '.ai-agent-playbook', 'config.json'), {
    forge: { apiBaseUrl: 'https://code.example.test:3443/gitea/api/v1/' }
  });

  const valid = await previewHarnessConfig({ target, env: {} });
  assert.equal(valid.ok, true);
  assert.equal(valid.config.forge.apiBaseUrl, 'https://code.example.test:3443/gitea/api/v1');

  await writeJson(path.join(target, '.ai-agent-playbook', 'config.json'), {
    forge: { apiBaseUrl: 'https://token@code.example.test/api/v1' }
  });
  const unsafe = await previewHarnessConfig({ target, env: {} });
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.conflicts.some((conflict) => conflict.id === 'config.value.invalid'), true);
  await cleanup(target);
});

test('config preview rejects command executor without argv and automatic force push', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-config-unsafe-'));
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  await writeFile(path.join(target, '.ai-agent-playbook', 'config.json'), JSON.stringify({
    git: { allowForcePush: true },
    executor: { provider: 'command', command: null }
  }));
  const result = await previewHarnessConfig({ target, env: {} });
  assert.equal(result.ok, false);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'config.git.force-push-forbidden'), true);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'config.executor.command-missing'), true);
  await rm(target, { recursive: true, force: true });
});

test('config preview rejects unsafe forge environment overrides', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-config-env-'));
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  const result = await previewHarnessConfig({
    target,
    env: {
      AI_AGENT_PLAYBOOK_FORGE_REMOTE: '--upload-pack=malicious',
      AI_AGENT_PLAYBOOK_FORGE_LANGUAGE: 'ko\nINJECTED=1'
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.conflicts.filter((conflict) => conflict.id === 'config.env.invalid').length, 2);
  await rm(target, { recursive: true, force: true });
});

test('config preview reports malformed config and unsafe runtime paths', async () => {
  const malformedTarget = await tempRepo('config malformed-한글-');
  await mkdir(path.join(malformedTarget, '.ai-agent-playbook'), { recursive: true });
  await writeFile(path.join(malformedTarget, '.ai-agent-playbook', 'config.json'), '{broken json\n');

  const malformed = await previewHarnessConfig({ target: malformedTarget, env: {} });
  assert.equal(malformed.ok, false);
  assert.equal(malformed.conflicts.some((conflict) => conflict.id === 'config.source.malformed-json'), true);
  await cleanup(malformedTarget);

  const unsafeTarget = await tempRepo('config unsafe-한글-');
  await mkdir(path.join(unsafeTarget, '.ai-agent-playbook'), { recursive: true });
  await writeJson(path.join(unsafeTarget, '.ai-agent-playbook', 'config.local.json'), {
    runtime: { cacheDir: '../outside' }
  });

  const unsafe = await previewHarnessConfig({ target: unsafeTarget, env: {} });
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.conflicts.some((conflict) => conflict.id === 'config.path.unsafe'), true);
  await cleanup(unsafeTarget);
});

test('config preview CLI reports resolved config without creating files', async () => {
  const target = await tempRepo('config cli-공백-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  const userConfig = path.join(target, 'user-config.json');
  await writeJson(userConfig, {
    context: { maxChars: 8000 }
  });
  await writeJson(path.join(target, '.ai-agent-playbook', 'config.json'), {
    context: { maxChars: 9000 }
  });
  const before = await listRelativeFiles(target);
  const io = capture(target);

  assert.equal(await runCli(['config', 'preview', '.', '--user-config', 'user-config.json', '--json'], io), 0);
  const report = JSON.parse(io.out());
  assert.equal(report.kind, 'core.config-preview');
  assert.equal(report.config.context.maxChars, 9000);
  assert.equal(report.sourceMap['context.maxChars'], 'target');
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

function capture(cwd) {
  let stdout = '';
  let stderr = '';
  return {
    cwd,
    repoRoot,
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    out: () => stdout,
    err: () => stderr
  };
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function tempRepo(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function listRelativeFiles(root) {
  const files = [];
  if (!existsSync(root)) return files;
  await walk(root, '');
  files.sort();
  return files;

  async function walk(current, rel) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, entryRel);
      } else if (entry.isFile()) {
        files.push(entryRel);
      }
    }
  }
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}
