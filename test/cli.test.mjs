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
  const code = await runCli(['bootstrap', '.', '--dry-run'], io);

  assert.equal(code, 0);
  assert.match(io.out(), /copy README\.md/);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), false);
  await cleanup(target);
});

test('bootstrap writes playbook and thin root agent bootstrap without overwriting', async () => {
  const target = await tempRepo();
  const io = capture(target);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], io), 0);
  assert.equal(existsSync(path.join(target, 'ai-playbook', 'CURRENT.md')), true);
  assert.equal(existsSync(path.join(target, 'ai-playbook', 'SKILLS.md')), true);
  assert.equal(existsSync(path.join(target, 'ai-playbook', 'GIT.md')), true);
  assert.equal(existsSync(path.join(target, 'AGENTS.md')), true);
  assert.equal(existsSync(path.join(target, 'SKILLS.md')), false);
  assert.equal(existsSync(path.join(target, 'GIT.md')), false);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /ai-playbook\//);

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
  assert.match(checked.out(), /\[PASS\] root AGENTS bootstrap/);
  assert.match(checked.out(), /\[PASS\] root AGENTS reading order/);
  assert.match(checked.out(), /\[WARN\] playbook adaptation/);
  await cleanup(target);
});

test('doctor --json reports stable schema and strict warning behavior', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  const missing = capture(target);

  assert.equal(await runCli(['doctor', '.', '--json'], missing), 1);
  const missingReport = JSON.parse(missing.out());
  assert.equal(missingReport.schemaVersion, '1');
  assert.equal(missingReport.strict, false);
  assert.equal(missingReport.summary.fail > 0, true);
  assert.equal(missingReport.checks.some((check) => check.id === 'playbook.directory' && check.category === 'setup'), true);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const defaultCheck = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], defaultCheck), 0);
  const defaultReport = JSON.parse(defaultCheck.out());
  assert.equal(defaultReport.ok, true);
  assert.equal(defaultReport.checks.some((check) => check.id === 'playbook.adaptation' && check.level === 'warn'), true);

  const strictCheck = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json', '--strict'], strictCheck), 1);
  const strictReport = JSON.parse(strictCheck.out());
  assert.equal(strictReport.strict, true);
  assert.equal(strictReport.ok, false);
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

test('guides sync --check reports missing guides without writing files', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const missingGuide = path.join(target, 'ai-playbook', 'guides', 'harness-migration.md');
  await rm(missingGuide, { force: true });

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], check), 1);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.summary.missing, 1);
  assert.equal(report.guides.some((guide) => guide.path === 'ai-playbook/guides/harness-migration.md' && guide.status === 'missing'), true);
  assert.equal(existsSync(missingGuide), false);
  await cleanup(target);
});

test('context --json builds compact hook context without root AGENTS', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  await writeFile(path.join(target, 'ai-playbook', 'START_HERE.md'), '# Start\n\nStart signal\n');
  await writeFile(path.join(target, 'ai-playbook', 'CURRENT.md'), '# Current\n\nCurrent signal\n');
  await writeFile(path.join(target, 'ai-playbook', 'SKILLS.md'), '# Skills\n\nSkill signal\n');
  await writeFile(path.join(target, 'ai-playbook', 'GIT.md'), '# Git\n\nGit signal\n');
  await writeFile(path.join(target, 'AGENTS.md'), '# Root\n\nRoot agent marker\n');

  const context = capture(target);
  assert.equal(await runCli(['context', '.', '--json', '--max-chars', '5000'], context), 0);
  const report = JSON.parse(context.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.deepEqual(report.sources.map((source) => source.path), [
    'ai-playbook/START_HERE.md',
    'ai-playbook/CURRENT.md',
    'ai-playbook/SKILLS.md',
    'ai-playbook/GIT.md'
  ]);
  assert.match(report.additionalContext, /Start signal/);
  assert.match(report.additionalContext, /Current signal/);
  assert.match(report.additionalContext, /Skill signal/);
  assert.match(report.additionalContext, /Git signal/);
  assert.doesNotMatch(report.additionalContext, /Root agent marker/);
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

async function tempRepo(prefix = 'ai-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}
