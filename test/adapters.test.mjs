import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runClaudeCodeHook } from '../adapters/claude-code/hook.mjs';
import { runCodexHook } from '../adapters/codex/hook.mjs';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('Codex context hook emits additionalContext for supported events', async () => {
  const target = await bootstrappedRepo();
  const output = await runCodexHook({
    hook_event_name: 'SessionStart',
    cwd: target
  }, { maxChars: 5000 });

  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Current adapter signal/);
  assert.doesNotMatch(parsed.hookSpecificOutput.additionalContext, /Root agent marker/);
  await cleanup(target);
});

test('Claude Code context hook emits additionalContext after compaction', async () => {
  const target = await bootstrappedRepo('ai playbook-테스트-');
  const output = await runClaudeCodeHook({
    hook_event_name: 'PostCompact',
    cwd: target
  }, { maxChars: 5000 });

  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PostCompact');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Current adapter signal/);
  await cleanup(target);
});

test('context hooks stay silent when ai-playbook is missing or event is unsupported', async () => {
  const target = await tempRepo();
  assert.equal(await runCodexHook({ hook_event_name: 'SessionStart', cwd: target }), '');
  assert.equal(await runClaudeCodeHook({ hook_event_name: 'PostToolUse', cwd: target }), '');
  await cleanup(target);
});

async function bootstrappedRepo(prefix = 'ai-playbook-test-') {
  const target = await tempRepo(prefix);
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, 'ai-playbook', 'CURRENT.md'), '# Current\n\nCurrent adapter signal\n');
  await writeFile(path.join(target, 'AGENTS.md'), '# Root\n\nRoot agent marker\n');
  return target;
}

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

async function tempRepo(prefix = 'ai-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}
