import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('bootstrap dry-run does not write files', async () => {
  const target = await tempRepo();
  const io = capture(target);
  const code = await runCli(['bootstrap', '.', '--with-skills', '--with-git', '--dry-run'], io);

  assert.equal(code, 0);
  assert.match(io.out(), /copy README\.md/);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), false);
  await cleanup(target);
});

test('bootstrap writes playbook and root policies without overwriting', async () => {
  const target = await tempRepo();
  const io = capture(target);

  assert.equal(await runCli(['bootstrap', '.', '--with-skills', '--with-git', '--local-only'], io), 0);
  assert.equal(existsSync(path.join(target, 'ai-playbook', 'CURRENT.md')), true);
  assert.equal(existsSync(path.join(target, 'AGENTS.md')), true);
  assert.equal(existsSync(path.join(target, 'SKILLS.md')), true);
  assert.equal(existsSync(path.join(target, 'GIT.md')), true);

  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.match(gitignore, /^ai-playbook\/$/m);

  const second = capture(target);
  assert.equal(await runCli(['bootstrap', '.'], second), 2);
  assert.match(second.err(), /Conflicts:/);
  await cleanup(target);
});

test('doctor reports missing and bootstrapped project state', async () => {
  const target = await tempRepo();
  const missing = capture(target);
  assert.equal(await runCli(['doctor', '.'], missing), 1);
  assert.match(missing.out(), /\[FAIL\] ai-playbook directory/);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.'], checked), 0);
  assert.match(checked.out(), /\[PASS\] ai-playbook\/CURRENT.md/);
  await cleanup(target);
});

test('guides sync restores missing guides without overwriting local guide edits', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const customGuide = path.join(target, 'ai-playbook', 'guides', 'runtime-harness.md');
  const missingGuide = path.join(target, 'ai-playbook', 'guides', 'harness-migration.md');
  await writeFile(customGuide, '# Local guide edit\n');
  await rm(missingGuide, { force: true });

  const sync = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.'], sync), 0);
  assert.match(sync.out(), /keep guides\\runtime-harness\.md|keep guides\/runtime-harness\.md/);
  assert.match(await readFile(customGuide, 'utf8'), /Local guide edit/);
  assert.match(await readFile(missingGuide, 'utf8'), /Harness Migration/);
  await cleanup(target);
});

test('plan and worklog scaffold commands create dated files', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  assert.equal(await runCli(['plan', 'new', '.', '--title', 'Runtime Harness', '--date', '2026-06-07'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Runtime Harness', '--date', '2026-06-07'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  await stat(path.join(target, 'ai-playbook', 'plans', '2026-06-07-runtime-harness.md'));
  await stat(path.join(target, 'ai-playbook', 'worklogs', '2026-06', '2026-06-07-runtime-harness.md'));
  await stat(path.join(target, 'ai-playbook', 'worklogs', 'summaries', '2026-06.md'));
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

async function tempRepo() {
  return mkdtemp(path.join(os.tmpdir(), 'ai-playbook-test-'));
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}
