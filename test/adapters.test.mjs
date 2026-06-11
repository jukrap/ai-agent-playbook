import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
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
  }, { maxChars: 5000, env: {} });

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
  }, { maxChars: 5000, env: {} });

  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PostCompact');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Current adapter signal/);
  await cleanup(target);
});

test('context hooks stay silent when .ai-playbook is missing or event is unsupported', async () => {
  const target = await tempRepo();
  assert.equal(await runCodexHook({ hook_event_name: 'SessionStart', cwd: target }, { env: {} }), '');
  assert.equal(await runClaudeCodeHook({ hook_event_name: 'PostToolUse', cwd: target }, { env: {} }), '');
  await cleanup(target);
});

test('lifecycle reminder hooks require explicit opt-in', async () => {
  const target = await bootstrappedRepo();
  const input = {
    hook_event_name: 'UserPromptSubmit',
    cwd: target,
    prompt: '커밋하고 push 전에 확인해줘'
  };

  assert.equal(await runCodexHook(input, { env: {} }), '');

  const output = await runCodexHook(input, {
    env: { AI_PLAYBOOK_HOOK_EVENTS: 'UserPromptSubmit' },
    maxChars: 5000
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Git guardrail/);
  assert.doesNotMatch(parsed.hookSpecificOutput.additionalContext, /Current adapter signal/);
  await cleanup(target);
});

test('lifecycle reminder hooks stay quiet for unrelated prompts and missing playbooks', async () => {
  const target = await bootstrappedRepo();
  const env = { AI_PLAYBOOK_HOOK_EVENTS: 'UserPromptSubmit,PostToolUse' };

  assert.equal(await runCodexHook({
    hook_event_name: 'UserPromptSubmit',
    cwd: target,
    prompt: '간단히 코드 설명만 해줘'
  }, { env }), '');

  const missing = await tempRepo();
  assert.equal(await runCodexHook({
    hook_event_name: 'UserPromptSubmit',
    cwd: missing,
    prompt: 'commit 준비해줘'
  }, { env }), '');
  await cleanup(target);
  await cleanup(missing);
});

test('lifecycle reminder hooks accept legacy ai-playbook during transition', async () => {
  const target = await legacyRepo();
  const output = await runCodexHook({
    hook_event_name: 'UserPromptSubmit',
    cwd: target,
    prompt: '커밋 전에 상태 확인해줘'
  }, {
    env: { AI_PLAYBOOK_HOOK_EVENTS: 'UserPromptSubmit' },
    maxChars: 5000
  });

  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Git guardrail/);
  await cleanup(target);
});

test('PostToolUse reminder matches edit-like payload paths without writing files', async () => {
  const target = await bootstrappedRepo('ai playbook-후크-');
  const before = await listRelativeFiles(target);
  const output = await runClaudeCodeHook({
    hook_event_name: 'PostToolUse',
    cwd: target,
    tool_name: 'functions.apply_patch',
    tool_input: {
      patch: '*** Begin Patch\n*** Update File: adapters/codex/README.md\n@@\n-old\n+new\n*** Update File: skills/project/project-bootstrap/SKILL.md\n@@\n-old\n+new\n*** End Patch\n'
    }
  }, {
    env: { AI_PLAYBOOK_HOOK_EVENTS: 'PostToolUse' },
    maxChars: 5000
  });

  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Adapter reminder/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /Skill reminder/);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('PostToolUse reminder stays quiet for non-edit tools or edit payloads without paths', async () => {
  const target = await bootstrappedRepo();
  const env = { AI_PLAYBOOK_HOOK_EVENTS: 'PostToolUse' };

  assert.equal(await runCodexHook({
    hook_event_name: 'PostToolUse',
    cwd: target,
    tool_name: 'read_file',
    tool_input: { path: 'adapters/codex/README.md' }
  }, { env }), '');

  assert.equal(await runCodexHook({
    hook_event_name: 'PostToolUse',
    cwd: target,
    tool_name: 'functions.apply_patch',
    tool_input: { patch: '*** Begin Patch\n*** End Patch\n' }
  }, { env }), '');
  await cleanup(target);
});

test('Stop reminder is opt-in, no-write, and quiet without playbook context', async () => {
  const target = await bootstrappedRepo('stop reminder-한글-');
  const before = await listRelativeFiles(target);

  assert.equal(await runCodexHook({
    hook_event_name: 'Stop',
    cwd: target
  }, { env: {} }), '');

  const output = await runClaudeCodeHook({
    hook_event_name: 'Stop',
    cwd: target
  }, {
    env: { AI_PLAYBOOK_HOOK_EVENTS: 'Stop' },
    maxChars: 5000
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'Stop');
  assert.match(parsed.hookSpecificOutput.additionalContext, /Session ending/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /doctor/);
  assert.deepEqual(await listRelativeFiles(target), before);

  const missing = await tempRepo('stop missing-한글-');
  assert.equal(await runCodexHook({
    hook_event_name: 'Stop',
    cwd: missing
  }, { env: { AI_PLAYBOOK_HOOK_EVENTS: 'Stop' } }), '');

  await cleanup(target);
  await cleanup(missing);
});

async function bootstrappedRepo(prefix = '.ai-playbook-test-') {
  const target = await tempRepo(prefix);
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nCurrent adapter signal\n');
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

async function tempRepo(prefix = '.ai-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function legacyRepo() {
  const target = await tempRepo('legacy ai playbook-hook-');
  const files = {
    'START_HERE.md': '# Start\n\nStart signal\n',
    'CURRENT.md': '# Current\n\nCurrent adapter signal\n',
    'SKILLS.md': '# Skills\n\nSkill signal\n',
    'GIT.md': '# Git\n\nGit signal\n'
  };
  for (const [file, content] of Object.entries(files)) {
    const destination = path.join(target, 'ai-playbook', file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  return target;
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
