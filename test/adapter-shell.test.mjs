import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runClaudeCodeAdapterShell } from '../adapters/claude-code/package.mjs';
import { runCodexAdapterShell } from '../adapters/codex/package.mjs';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('Codex adapter shell renders config without writing files', async () => {
  const target = await tempRepo('adapter shell config-공백-한글-');
  const before = await listRelativeFiles(target);
  const io = capture(target);

  assert.equal(await runCodexAdapterShell(['config', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.adapter, 'codex');
  assert.match(report.hookCommand, /adapters[/\\]codex[/\\]hook\.mjs/);
  assert.doesNotMatch(JSON.stringify(report.config), /<path-to-ai-agent-playbook>/);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('Claude Code adapter shell check passes on a bootstrapped target', async () => {
  const target = await bootstrappedRepo('adapter shell check-한글-');
  const before = await listRelativeFiles(target);
  const io = capture(target);

  assert.equal(await runClaudeCodeAdapterShell(['check', '.', '--json', '--max-chars', '5000'], io), 0);
  const report = JSON.parse(io.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.adapter, 'claude-code');
  assert.equal(report.summary.fail, 0);
  assert.equal(report.checks.some((check) => check.id === 'hook.stop-silent-by-default' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('Codex adapter shell hook reads stdin payload and emits hook JSON', async () => {
  const target = await bootstrappedRepo('adapter shell hook-한글-');
  const before = await listRelativeFiles(target);
  const io = capture(target, {
    readStdin: () => JSON.stringify({ hook_event_name: 'SessionStart', cwd: target })
  });

  assert.equal(await runCodexAdapterShell(['hook', '--max-chars', '5000'], io), 0);
  const parsed = JSON.parse(io.out());
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Adapter shell signal/);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('adapter shell rejects unknown commands', async () => {
  const target = await tempRepo('adapter shell unknown-한글-');
  const io = capture(target);

  assert.equal(await runCodexAdapterShell(['unknown'], io), 1);
  assert.match(io.err(), /Unknown adapter shell command: unknown/);
  await cleanup(target);
});

async function bootstrappedRepo(prefix) {
  const target = await tempRepo(prefix);
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter shell signal\n');
  return target;
}

function capture(cwd, overrides = {}) {
  let stdout = '';
  let stderr = '';
  return {
    cwd,
    repoRoot,
    env: overrides.env ?? {},
    readStdin: overrides.readStdin,
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    out: () => stdout,
    err: () => stderr
  };
}

async function tempRepo(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function listRelativeFiles(root) {
  const files = [];
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
