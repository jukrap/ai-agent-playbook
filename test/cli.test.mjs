import { mkdir, mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from 'node:fs/promises';
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
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  await cleanup(target);
});

test('bootstrap writes playbook and thin root agent bootstrap without overwriting', async () => {
  const target = await tempRepo();
  const io = capture(target);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], io), 0);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'SKILLS.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'GIT.md')), true);
  assert.equal(existsSync(path.join(target, 'AGENTS.md')), true);
  assert.equal(existsSync(path.join(target, 'SKILLS.md')), false);
  assert.equal(existsSync(path.join(target, 'GIT.md')), false);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /\.ai-playbook\//);

  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.ai-playbook\/$/m);

  const second = capture(target);
  assert.equal(await runCli(['bootstrap', '.'], second), 2);
  assert.match(second.err(), /Conflicts:/);
  await cleanup(target);
});

test('bootstrap conflict preflight refuses existing AGENTS without partial writes', async () => {
  const target = await tempRepo('bootstrap conflict-한글-');
  await writeFile(path.join(target, 'AGENTS.md'), '# Existing policy\n');
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], checked), 2);
  assert.match(checked.err(), /Conflicts:/);
  assert.match(checked.err(), /AGENTS\.md/);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('doctor reports missing and bootstrapped project state', async () => {
  const target = await tempRepo();
  const missing = capture(target);
  assert.equal(await runCli(['doctor', '.'], missing), 1);
  assert.match(missing.out(), /\[FAIL\] \.ai-playbook directory/);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.'], checked), 0);
  assert.match(checked.out(), /\[PASS\] .ai-playbook\/CURRENT.md/);
  assert.match(checked.out(), /\[PASS\] root AGENTS bootstrap/);
  assert.match(checked.out(), /\[PASS\] root AGENTS reading order/);
  assert.match(checked.out(), /\[WARN\] playbook adaptation/);
  await cleanup(target);
});

test('legacy ai-playbook layout remains readable when the dot playbook is absent', async () => {
  const target = await tempRepo('legacy ai playbook-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy context signal');
  await writeFile(path.join(target, '.gitignore'), 'ai-playbook/\n');
  await writeFile(path.join(target, 'AGENTS.md'), [
    '# Root',
    '',
    'Read ai-playbook/START_HERE.md, ai-playbook/CURRENT.md, ai-playbook/SKILLS.md, and ai-playbook/GIT.md.'
  ].join('\n'));

  const doctor = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], doctor), 0);
  const doctorReport = JSON.parse(doctor.out());
  assert.equal(doctorReport.ok, true);
  assert.equal(doctorReport.checks.some((check) => check.id === 'playbook.directory' && check.paths.includes('ai-playbook/')), true);
  assert.equal(doctorReport.checks.some((check) => check.id === 'playbook.file.current.md' && check.paths.includes('ai-playbook/CURRENT.md')), true);

  const context = capture(target);
  assert.equal(await runCli(['context', '.', '--json', '--max-chars', '5000'], context), 0);
  const contextReport = JSON.parse(context.out());
  assert.equal(contextReport.ok, true);
  assert.deepEqual(contextReport.sources.map((source) => source.path), [
    'ai-playbook/START_HERE.md',
    'ai-playbook/CURRENT.md',
    'ai-playbook/SKILLS.md',
    'ai-playbook/GIT.md'
  ]);
  assert.match(contextReport.additionalContext, /Legacy context signal/);
  await cleanup(target);
});

test('write commands keep using legacy ai-playbook when the dot playbook is absent', async () => {
  const target = await tempRepo('legacy ai playbook-write-공백-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy write signal');

  assert.equal(await runCli(['guides', 'sync', '.'], capture(target)), 0);
  assert.equal(existsSync(path.join(target, 'ai-playbook', 'guides', 'runtime-harness.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);

  assert.equal(await runCli(['plan', 'new', '.', '--title', 'Legacy Path', '--date', '2026-06-08'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Legacy Path', '--date', '2026-06-08'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  await stat(path.join(target, 'ai-playbook', 'plans', '2026-06-08-legacy-path.md'));
  await stat(path.join(target, 'ai-playbook', 'worklogs', '2026-06', '2026-06-08-legacy-path.md'));
  await stat(path.join(target, 'ai-playbook', 'worklogs', 'summaries', '2026-06.md'));
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
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

test('doctor --json warns when a worklog month has no summary without writing files', async () => {
  const target = await tempRepo('ai playbook-worklog-공백-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-05-03'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  const warning = report.checks.find((check) => check.id === 'worklog-summary.missing.2026-05');
  assert.equal(warning.level, 'warn');
  assert.equal(warning.category, 'freshness');
  assert.deepEqual(warning.paths, [
    '.ai-playbook/worklogs/2026-05/',
    '.ai-playbook/worklogs/summaries/2026-05.md'
  ]);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('doctor --json warns when a worklog summary is older than an entry', async () => {
  const target = await tempRepo('ai playbook-worklog-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-06-04'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  const worklog = path.join(target, '.ai-playbook', 'worklogs', '2026-06', '2026-06-04-freshness-check.md');
  const summary = path.join(target, '.ai-playbook', 'worklogs', 'summaries', '2026-06.md');
  await utimes(summary, new Date('2026-06-04T00:00:00Z'), new Date('2026-06-04T00:00:00Z'));
  await utimes(worklog, new Date('2026-06-05T00:00:00Z'), new Date('2026-06-05T00:00:00Z'));
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  const warning = report.checks.find((check) => check.id === 'worklog-summary.stale.2026-06');
  assert.equal(warning.level, 'warn');
  assert.equal(warning.category, 'freshness');
  assert.deepEqual(warning.paths, [
    '.ai-playbook/worklogs/2026-06/2026-06-04-freshness-check.md',
    '.ai-playbook/worklogs/summaries/2026-06.md'
  ]);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('doctor --json passes worklog summary freshness when the summary is newest', async () => {
  const target = await tempRepo('ai playbook-worklog-fresh-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-07-04'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-07'], capture(target)), 0);

  const worklog = path.join(target, '.ai-playbook', 'worklogs', '2026-07', '2026-07-04-freshness-check.md');
  const summary = path.join(target, '.ai-playbook', 'worklogs', 'summaries', '2026-07.md');
  await utimes(worklog, new Date('2026-07-04T00:00:00Z'), new Date('2026-07-04T00:00:00Z'));
  await utimes(summary, new Date('2026-07-05T00:00:00Z'), new Date('2026-07-05T00:00:00Z'));

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.checks.some((check) => check.id === 'worklog-summary.missing.2026-07'), false);
  assert.equal(report.checks.some((check) => check.id === 'worklog-summary.stale.2026-07'), false);
  assert.equal(report.checks.some((check) => check.id === 'worklog-summary.fresh.2026-07' && check.level === 'pass'), true);
  await cleanup(target);
});

test('doctor --reminder --json reports a small no-write reminder signal', async () => {
  const missing = await tempRepo('ai playbook-reminder-missing-');
  const missingBefore = await listRelativeFiles(missing);
  const missingCheck = capture(missing);
  assert.equal(await runCli(['doctor', '.', '--reminder', '--json'], missingCheck), 0);
  const missingReport = JSON.parse(missingCheck.out());
  assert.equal(missingReport.schemaVersion, '1');
  assert.equal(missingReport.ok, false);
  assert.equal(missingReport.reminders.length, 1);
  assert.equal(missingReport.reminders[0].id, 'reminder.playbook.missing');
  assert.equal(missingReport.reminders[0].level, 'warn');
  assert.deepEqual(missingReport.reminders[0].paths, ['.ai-playbook/']);
  assert.deepEqual(await listRelativeFiles(missing), missingBefore);
  await cleanup(missing);

  const fresh = await tempRepo('ai playbook-reminder-fresh-');
  assert.equal(await runCli(['bootstrap', '.'], capture(fresh)), 0);
  const freshBefore = await listRelativeFiles(fresh);
  const freshCheck = capture(fresh);
  assert.equal(await runCli(['doctor', '.', '--reminder', '--json'], freshCheck), 0);
  const freshReport = JSON.parse(freshCheck.out());
  assert.equal(freshReport.schemaVersion, '1');
  assert.equal(freshReport.ok, true);
  assert.deepEqual(freshReport.reminders, []);
  assert.deepEqual(await listRelativeFiles(fresh), freshBefore);
  await cleanup(fresh);
});

test('doctor --reminder --json includes stale guide and worklog freshness reminders', async () => {
  const target = await tempRepo('ai playbook-reminder-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md'), '# Local guide edit\n');
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-08-04'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--reminder', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.reminders.some((reminder) => reminder.id === 'reminder.guides.stale' && reminder.level === 'warn'), true);
  assert.equal(report.reminders.some((reminder) => reminder.id === 'reminder.worklog-summary.missing.2026-08' && reminder.level === 'warn'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('guides sync restores missing guides without overwriting local guide edits', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const customGuide = path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md');
  const missingGuide = path.join(target, '.ai-playbook', 'guides', 'harness-migration.md');
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
  const target = await tempRepo('ai playbook-guides-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const missingGuide = path.join(target, '.ai-playbook', 'guides', 'harness-migration.md');
  await rm(missingGuide, { force: true });

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], check), 1);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.summary.missing, 1);
  assert.equal(report.summary.stale, 0);
  const guide = report.guides.find((item) => item.path === '.ai-playbook/guides/harness-migration.md');
  assert.equal(guide.status, 'missing');
  assert.match(guide.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal('targetHash' in guide, false);
  assert.equal(existsSync(missingGuide), false);
  assert.deepEqual(await listRelativeFiles(target), before.filter((file) => file !== '.ai-playbook/guides/harness-migration.md'));
  await cleanup(target);
});

test('guides sync --check reports present and stale guides without overwriting local edits', async () => {
  const target = await tempRepo('ai playbook-guides-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const localGuide = path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md');
  await writeFile(localGuide, '# Local guide edit\n');
  const before = await listRelativeFiles(target);

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], check), 0);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.missing, 0);
  assert.equal(report.summary.stale, 1);
  assert.equal(report.guides.every((guide) => ['present', 'stale'].includes(guide.status)), true);

  const stale = report.guides.find((guide) => guide.path === '.ai-playbook/guides/runtime-harness.md');
  assert.equal(stale.status, 'stale');
  assert.match(stale.sourceHash, /^[a-f0-9]{64}$/);
  assert.match(stale.targetHash, /^[a-f0-9]{64}$/);
  assert.notEqual(stale.sourceHash, stale.targetHash);

  const present = report.guides.find((guide) => guide.status === 'present');
  assert.match(present.sourceHash, /^[a-f0-9]{64}$/);
  assert.match(present.targetHash, /^[a-f0-9]{64}$/);
  assert.equal(present.sourceHash, present.targetHash);

  assert.match(await readFile(localGuide, 'utf8'), /Local guide edit/);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('guides sync --check --diff explains stale guide differences without writing files', async () => {
  const target = await tempRepo('ai playbook-guides-diff-공백-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const localGuide = path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md');
  await writeFile(localGuide, '# Local guide edit\n\nTarget-only line\n');
  const before = await listRelativeFiles(target);

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--diff', '--json'], check), 0);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.summary.stale, 1);
  const stale = report.guides.find((guide) => guide.path === '.ai-playbook/guides/runtime-harness.md');
  assert.equal(stale.status, 'stale');
  assert.equal(stale.diff.firstDifferenceLine, 1);
  assert.equal(typeof stale.diff.sourceLine, 'string');
  assert.equal(stale.diff.targetLine, '# Local guide edit');
  assert.equal(stale.diff.sourceLineCount > 0, true);
  assert.equal(stale.diff.targetLineCount, 3);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('context --json builds compact hook context without root AGENTS', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  await writeFile(path.join(target, '.ai-playbook', 'START_HERE.md'), '# Start\n\nStart signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nCurrent signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'SKILLS.md'), '# Skills\n\nSkill signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'GIT.md'), '# Git\n\nGit signal\n');
  await writeFile(path.join(target, 'AGENTS.md'), '# Root\n\nRoot agent marker\n');

  const context = capture(target);
  assert.equal(await runCli(['context', '.', '--json', '--max-chars', '5000'], context), 0);
  const report = JSON.parse(context.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.deepEqual(report.sources.map((source) => source.path), [
    '.ai-playbook/START_HERE.md',
    '.ai-playbook/CURRENT.md',
    '.ai-playbook/SKILLS.md',
    '.ai-playbook/GIT.md'
  ]);
  assert.match(report.additionalContext, /Start signal/);
  assert.match(report.additionalContext, /Current signal/);
  assert.match(report.additionalContext, /Skill signal/);
  assert.match(report.additionalContext, /Git signal/);
  assert.doesNotMatch(report.additionalContext, /Root agent marker/);
  await cleanup(target);
});

test('adapter check reports readiness for Codex and Claude Code without writing files', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter readiness signal\n');
  const before = await listRelativeFiles(target);

  for (const adapter of ['codex', 'claude-code']) {
    const io = capture(target);
    assert.equal(await runCli(['adapter', 'check', '.', '--adapter', adapter, '--json', '--max-chars', '5000'], io), 0);
    const report = JSON.parse(io.out());
    assert.equal(report.schemaVersion, '1');
    assert.equal(report.ok, true);
    assert.equal(report.adapter, adapter);
    assert.equal(report.summary.fail, 0);
    assert.equal(report.checks.some((check) => check.id === 'context.non-empty' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.session-start.json' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.post-compact.json' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.unsupported-event-silent' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.stop-silent-by-default' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.missing-playbook-silent' && check.level === 'pass'), true);
  }

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('adapter config --json renders local hook config without writing files', async () => {
  const target = await tempRepo('adapter config-공백-한글-');
  const before = await listRelativeFiles(target);

  for (const adapter of ['codex', 'claude-code']) {
    const io = capture(target);
    assert.equal(await runCli(['adapter', 'config', '.', '--adapter', adapter, '--json'], io), 0);
    const report = JSON.parse(io.out());
    assert.equal(report.schemaVersion, '1');
    assert.equal(report.ok, true);
    assert.equal(report.target, target);
    assert.equal(report.adapter, adapter);
    assert.match(report.hookCommand, /^node ".+"$/);
    assert.doesNotMatch(report.hookCommand, /<path-to-ai-agent-playbook>/);
    assert.doesNotMatch(JSON.stringify(report.config), /<path-to-ai-agent-playbook>/);
    assert.match(report.hookCommand, new RegExp(adapter === 'codex' ? 'adapters[/\\\\]codex[/\\\\]hook\\.mjs' : 'adapters[/\\\\]claude-code[/\\\\]hook\\.mjs'));
    assert.equal(report.config.hooks.SessionStart[0].hooks[0].command, report.hookCommand);
    assert.equal(report.config.hooks.PostCompact[0].hooks[0].command, report.hookCommand);
    assert.equal(report.warnings.some((warning) => warning.id === 'config.playbook.missing'), true);
  }

  assert.deepEqual(await listRelativeFiles(target), before);

  const unsupported = capture(target);
  assert.equal(await runCli(['adapter', 'config', '.', '--adapter', 'unknown', '--json'], unsupported), 1);
  assert.match(unsupported.err(), /Unsupported adapter: unknown/);
  await cleanup(target);

  const legacyTarget = await tempRepo('adapter config legacy-한글-');
  await mkdir(path.join(legacyTarget, 'ai-playbook'));
  const beforeLegacy = await listRelativeFiles(legacyTarget);
  const legacy = capture(legacyTarget);
  assert.equal(await runCli(['adapter', 'config', '.', '--adapter', 'codex', '--json'], legacy), 0);
  const legacyReport = JSON.parse(legacy.out());
  assert.equal(legacyReport.warnings.some((warning) => warning.id === 'config.playbook.missing'), true);
  assert.deepEqual(await listRelativeFiles(legacyTarget), beforeLegacy);
  await cleanup(legacyTarget);
});

test('adapter check --settings validates rendered settings without writing files', async () => {
  const target = await tempRepo('adapter settings-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter settings signal\n');

  const configIo = capture(target);
  assert.equal(await runCli(['adapter', 'config', '.', '--adapter', 'codex', '--json'], configIo), 0);
  const config = JSON.parse(configIo.out()).config;
  const settingsPath = path.join(target, 'local settings-한글.json');
  await writeFile(settingsPath, `${JSON.stringify(config, null, 2)}\n`);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', settingsPath, '--json', '--max-chars', '5000'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.fail, 0);
  assert.equal(report.checks.some((check) => check.id === 'settings.file' && check.level === 'pass'), true);
  assert.equal(report.checks.some((check) => check.id === 'settings.json' && check.level === 'pass'), true);
  assert.equal(report.checks.some((check) => check.id === 'settings.hook.session-start.command' && check.level === 'pass'), true);
  assert.equal(report.checks.some((check) => check.id === 'settings.hook.post-compact.command' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('adapter check --settings reports missing, malformed, and mismatched settings without writing files', async () => {
  const target = await tempRepo('adapter bad settings-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter settings signal\n');

  const missingPath = path.join(target, 'missing settings.json');
  const beforeMissing = await listRelativeFiles(target);
  const missing = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', missingPath, '--json'], missing), 1);
  const missingReport = JSON.parse(missing.out());
  assert.equal(missingReport.checks.some((check) => check.id === 'settings.file' && check.level === 'fail'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeMissing);

  const malformedPath = path.join(target, 'malformed settings.json');
  await writeFile(malformedPath, '{ not json');
  const beforeMalformed = await listRelativeFiles(target);
  const malformed = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', malformedPath, '--json'], malformed), 1);
  const malformedReport = JSON.parse(malformed.out());
  assert.equal(malformedReport.checks.some((check) => check.id === 'settings.json' && check.level === 'fail'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeMalformed);

  const mismatchPath = path.join(target, 'mismatch settings.json');
  const mismatchConfig = {
    hooks: {
      SessionStart: [{ hooks: [{ type: 'command', command: 'node "C:\\other\\hook.mjs"', timeout: 5 }] }],
      PostCompact: [{ matcher: 'manual|auto', hooks: [{ type: 'command', command: 'node "C:\\other\\hook.mjs"', timeout: 5 }] }]
    }
  };
  await writeFile(mismatchPath, `${JSON.stringify(mismatchConfig, null, 2)}\n`);
  const beforeMismatch = await listRelativeFiles(target);
  const mismatch = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', mismatchPath, '--json'], mismatch), 1);
  const mismatchReport = JSON.parse(mismatch.out());
  assert.equal(mismatchReport.checks.some((check) => check.id === 'settings.hook.session-start.command' && check.level === 'fail'), true);
  assert.equal(mismatchReport.checks.some((check) => check.id === 'settings.hook.post-compact.command' && check.level === 'fail'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeMismatch);
  await cleanup(target);
});

test('adapter check reports missing playbook and rejects unsupported adapters', async () => {
  const target = await tempRepo('ai playbook-누락-');
  const before = await listRelativeFiles(target);

  const missing = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--json'], missing), 1);
  const report = JSON.parse(missing.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.summary.fail > 0, true);
  assert.equal(report.checks.some((check) => check.id === 'playbook.directory' && check.level === 'fail'), true);
  assert.equal(report.checks.some((check) => check.id === 'context.non-empty' && check.level === 'fail'), true);
  assert.equal(report.checks.some((check) => check.id === 'hook.missing-playbook-silent' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const unsupported = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'unknown'], unsupported), 1);
  assert.match(unsupported.err(), /Unsupported adapter: unknown/);
  await cleanup(target);
});

test('plan and worklog scaffold commands create dated files', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  assert.equal(await runCli(['plan', 'new', '.', '--title', 'Runtime Harness', '--date', '2026-06-07'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Runtime Harness', '--date', '2026-06-07'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  await stat(path.join(target, '.ai-playbook', 'plans', '2026-06-07-runtime-harness.md'));
  await stat(path.join(target, '.ai-playbook', 'worklogs', '2026-06', '2026-06-07-runtime-harness.md'));
  await stat(path.join(target, '.ai-playbook', 'worklogs', 'summaries', '2026-06.md'));
  await cleanup(target);
});

test('migrate path previews legacy ai-playbook migration without writing files', async () => {
  const target = await tempRepo('migrate path preview-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy migration signal');
  await writeFile(path.join(target, '.gitignore'), 'docs/plans/\nai-playbook/\n');
  await writeFile(path.join(target, 'AGENTS.md'), [
    '# Root',
    '',
    'Read ai-playbook/START_HERE.md and ai-playbook/CURRENT.md.'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--json'], preview), 0);
  const report = JSON.parse(preview.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.applied, false);
  assert.equal(report.summary.operations > 0, true);
  assert.equal(report.operations.some((operation) => operation.id === 'playbook.move'), true);
  assert.equal(report.operations.some((operation) => operation.id === 'gitignore.add-dot-playbook'), true);
  assert.equal(report.operations.some((operation) => operation.id === 'references.update'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  await cleanup(target);
});

test('migrate path applies legacy ai-playbook migration and updates references', async () => {
  const target = await tempRepo('migrate path apply-공백-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy migration signal');
  await writeFile(path.join(target, '.gitignore'), 'docs/plans/\nai-playbook/\n');
  await writeFile(path.join(target, 'AGENTS.md'), [
    '# Root',
    '',
    'Read ai-playbook/START_HERE.md, ai-playbook/CURRENT.md, ai-playbook/SKILLS.md, and ai-playbook/GIT.md.'
  ].join('\n'));

  const applied = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.ok, true);
  assert.equal(report.applied, true);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /\.ai-playbook\/START_HERE\.md/);
  assert.doesNotMatch(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /(?<!\.)ai-playbook\//);
  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.ai-playbook\/$/m);
  assert.match(gitignore, /^ai-playbook\/$/m);

  const doctor = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], doctor), 0);
  const doctorReport = JSON.parse(doctor.out());
  assert.equal(doctorReport.checks.some((check) => check.id === 'playbook.directory' && check.paths.includes('.ai-playbook/')), true);
  await cleanup(target);
});

test('migrate path preserves committed playbook policy when legacy path is not ignored', async () => {
  const target = await tempRepo('migrate path tracked-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Tracked migration signal');
  await writeFile(path.join(target, '.gitignore'), 'dist/\n');

  const preview = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.operations.some((operation) => operation.id === 'gitignore.add-dot-playbook'), false);

  const applied = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--apply', '--json'], applied), 0);
  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.doesNotMatch(gitignore, /^\.ai-playbook\/$/m);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  await cleanup(target);
});

test('migrate path cleans legacy references when dot playbook already exists', async () => {
  const target = await tempRepo('migrate path dot cleanup-한글-');
  await writePlaybookFixture(target, '.ai-playbook', 'Dot migration signal');
  await writeFile(path.join(target, 'AGENTS.md'), 'Read ai-playbook/START_HERE.md before work.\n');

  const applied = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.ok, true);
  assert.equal(report.applied, true);
  assert.equal(report.warnings.some((warning) => warning.id === 'playbook.already-dot-path'), true);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /\.ai-playbook\/START_HERE\.md/);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), true);
  await cleanup(target);
});

test('migrate path reports conflicts when both playbook paths exist without writing files', async () => {
  const target = await tempRepo('migrate path conflict-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy migration signal');
  await writePlaybookFixture(target, '.ai-playbook', 'Dot migration signal');
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--json'], checked), 1);
  const report = JSON.parse(checked.out());
  assert.equal(report.ok, false);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'playbook.destination-exists'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('bootstrap writes a managed manifest and managed check validates it', async () => {
  const dryRunTarget = await tempRepo('managed dryrun-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only', '--dry-run'], capture(dryRunTarget)), 0);
  assert.equal(existsSync(path.join(dryRunTarget, '.ai-playbook', '.ai-agent-playbook-install.json')), false);
  await cleanup(dryRunTarget);

  const target = await tempRepo('managed bootstrap-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const manifestPath = path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json');
  assert.equal(existsSync(manifestPath), true);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  assert.equal(manifest.schemaVersion, '1');
  assert.equal(manifest.source, 'ai-agent-playbook');
  assert.equal(manifest.playbookDir, '.ai-playbook');
  assert.equal(manifest.localOnly, true);
  assert.equal(manifest.files.some((file) => file.path === 'AGENTS.md'), true);
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/CURRENT.md'), true);
  assert.equal(manifest.files.some((file) => file.path === '.gitignore'), false);
  assert.equal(manifest.files.every((file) => !path.isAbsolute(file.path)), true);

  const checked = capture(target);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.manifestPath, '.ai-playbook/.ai-agent-playbook-install.json');
  assert.equal(report.summary.present, manifest.files.length);
  assert.equal(report.summary.modified, 0);
  assert.equal(report.summary.missing, 0);
  await cleanup(target);
});

test('managed check reports missing, modified, and malformed manifest states without writing files', async () => {
  const missing = await tempRepo('managed missing-한글-');
  const missingBefore = await listRelativeFiles(missing);
  const missingCheck = capture(missing);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], missingCheck), 1);
  const missingReport = JSON.parse(missingCheck.out());
  assert.equal(missingReport.ok, false);
  assert.equal(missingReport.conflicts.some((conflict) => conflict.id === 'managed.manifest.missing'), true);
  assert.deepEqual(await listRelativeFiles(missing), missingBefore);
  await cleanup(missing);

  const malformed = await tempRepo('managed malformed-공백-');
  await mkdir(path.join(malformed, '.ai-playbook'), { recursive: true });
  await writeFile(path.join(malformed, '.ai-playbook', '.ai-agent-playbook-install.json'), '{not-json');
  const malformedBefore = await listRelativeFiles(malformed);
  const malformedCheck = capture(malformed);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], malformedCheck), 1);
  const malformedReport = JSON.parse(malformedCheck.out());
  assert.equal(malformedReport.ok, false);
  assert.equal(malformedReport.conflicts.some((conflict) => conflict.id === 'managed.manifest.malformed'), true);
  assert.deepEqual(await listRelativeFiles(malformed), malformedBefore);
  await cleanup(malformed);

  const modified = await tempRepo('managed modified-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(modified)), 0);
  await writeFile(path.join(modified, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited local project facts.\n');
  await rm(path.join(modified, '.ai-playbook', 'GIT.md'));
  const modifiedBefore = await listRelativeFiles(modified);
  const modifiedCheck = capture(modified);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], modifiedCheck), 1);
  const modifiedReport = JSON.parse(modifiedCheck.out());
  assert.equal(modifiedReport.ok, false);
  assert.equal(modifiedReport.summary.modified, 1);
  assert.equal(modifiedReport.summary.missing, 1);
  assert.equal(modifiedReport.files.some((file) => file.path === '.ai-playbook/CURRENT.md' && file.status === 'modified'), true);
  assert.equal(modifiedReport.files.some((file) => file.path === '.ai-playbook/GIT.md' && file.status === 'missing'), true);
  assert.deepEqual(await listRelativeFiles(modified), modifiedBefore);
  await cleanup(modified);
});

test('guides sync updates managed manifest and check mode stays read-only', async () => {
  const target = await tempRepo('managed guides-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await rm(path.join(target, '.ai-playbook', 'guides', 'harness-migration.md'));
  const beforeCheck = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], checked), 1);
  assert.deepEqual(await listRelativeFiles(target), beforeCheck);

  assert.equal(await runCli(['guides', 'sync', '.'], capture(target)), 0);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));
  const guideEntry = manifest.files.find((file) => file.path === '.ai-playbook/guides/harness-migration.md');
  assert.equal(guideEntry.kind, 'guide');
  assert.match(guideEntry.sourceHash, /^[a-f0-9]{64}$/);
  assert.match(guideEntry.targetHash, /^[a-f0-9]{64}$/);
  await cleanup(target);
});

test('managed adopt previews and records matching existing playbook files only when applied', async () => {
  const target = await tempRepo('managed adopt-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await rm(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'));
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAlready adapted.\n');
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['managed', 'adopt', '.', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.operations.some((operation) => operation.action === 'write-manifest'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['managed', 'adopt', '.', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.applied, true);
  assert.equal(report.summary.adopted > 0, true);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/SKILLS.md'), true);
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/CURRENT.md'), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  await cleanup(target);
});

test('managed uninstall previews removals and preserves modified managed files when applied', async () => {
  const target = await tempRepo('managed uninstall-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited facts to keep.\n');
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['managed', 'uninstall', '.', '--json'], preview), 1);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.conflicts.some((conflict) => conflict.id === 'managed.file.modified'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['managed', 'uninstall', '.', '--apply', '--json'], applied), 1);
  const report = JSON.parse(applied.out());
  assert.equal(report.applied, true);
  assert.equal(existsSync(path.join(target, 'AGENTS.md')), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json')), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'managed.gitignore.manual-cleanup'), true);
  await cleanup(target);
});

test('managed catalog reports kind and status summaries without writing files', async () => {
  const target = await tempRepo('managed catalog-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited facts to keep.\n');
  await rm(path.join(target, '.ai-playbook', 'GIT.md'));
  const before = await listRelativeFiles(target);

  const catalog = capture(target);
  assert.equal(await runCli(['managed', 'catalog', '.', '--json'], catalog), 1);
  const report = JSON.parse(catalog.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.target, target);
  assert.equal(report.manifestPath, '.ai-playbook/.ai-agent-playbook-install.json');
  assert.equal(report.manifest.playbookDir, '.ai-playbook');
  assert.equal(report.summary.total > 0, true);
  assert.equal(report.summary.byKind.playbook > 0, true);
  assert.equal(report.summary.byKind.guide > 0, true);
  assert.equal(report.summary.byKind.bootstrap, 1);
  assert.equal(report.summary.byStatus.modified >= 1, true);
  assert.equal(report.summary.byStatus.missing >= 1, true);
  assert.equal(report.files.some((file) => file.path === '.ai-playbook/CURRENT.md' && file.status === 'modified'), true);
  assert.equal(report.files.some((file) => file.path === '.ai-playbook/GIT.md' && file.status === 'missing'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('managed prune previews and removes only a selected unchanged managed file', async () => {
  const target = await tempRepo('managed prune-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const selected = '.ai-playbook/guides/runtime-harness.md';
  const windowsStyleSelected = '.ai-playbook\\guides\\runtime-harness.md';
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', windowsStyleSelected, '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());

  assert.equal(previewReport.schemaVersion, '1');
  assert.equal(previewReport.ok, true);
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.summary.selected, 1);
  assert.equal(previewReport.summary.removable, 1);
  assert.equal(previewReport.operations.some((operation) => operation.id === 'managed.prune.remove-file' && operation.paths.includes(selected)), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', selected, '--apply', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  const after = await listRelativeFiles(target);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));

  assert.equal(appliedReport.applied, true);
  assert.equal(after.includes(selected), false);
  assert.equal(after.includes('.ai-playbook/CURRENT.md'), true);
  assert.equal(manifest.files.some((file) => file.path === selected), false);
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/CURRENT.md'), true);
  await cleanup(target);
});

test('managed prune refuses unmanaged modified missing and absolute paths without writing files', async () => {
  const target = await tempRepo('managed prune conflict-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited facts to keep.\n');
  await rm(path.join(target, '.ai-playbook', 'GIT.md'));

  const modifiedBefore = await listRelativeFiles(target);
  const modified = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', '.ai-playbook/CURRENT.md', '--json'], modified), 1);
  const modifiedReport = JSON.parse(modified.out());
  assert.equal(modifiedReport.conflicts.some((conflict) => conflict.id === 'managed.prune.file-modified'), true);
  assert.deepEqual(await listRelativeFiles(target), modifiedBefore);

  const missingBefore = await listRelativeFiles(target);
  const missing = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', '.ai-playbook/GIT.md', '--json'], missing), 1);
  const missingReport = JSON.parse(missing.out());
  assert.equal(missingReport.conflicts.some((conflict) => conflict.id === 'managed.prune.file-missing'), true);
  assert.deepEqual(await listRelativeFiles(target), missingBefore);

  const unmanagedBefore = await listRelativeFiles(target);
  const unmanaged = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', '.ai-playbook/not-managed.md', '--json'], unmanaged), 1);
  const unmanagedReport = JSON.parse(unmanaged.out());
  assert.equal(unmanagedReport.conflicts.some((conflict) => conflict.id === 'managed.prune.file-unmanaged'), true);
  assert.deepEqual(await listRelativeFiles(target), unmanagedBefore);

  const absoluteBefore = await listRelativeFiles(target);
  const absolute = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', path.join(target, '.ai-playbook', 'README.md'), '--json'], absolute), 1);
  const absoluteReport = JSON.parse(absolute.out());
  assert.equal(absoluteReport.conflicts.some((conflict) => conflict.id === 'managed.prune.path-invalid'), true);
  assert.deepEqual(await listRelativeFiles(target), absoluteBefore);
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

async function tempRepo(prefix = '.ai-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writePlaybookFixture(target, dirName, currentSignal) {
  const files = {
    'README.md': '# Playbook\n',
    'START_HERE.md': '# Start\n\nStart fixture\n',
    'CURRENT.md': `# Current\n\n${currentSignal}\n`,
    'SKILLS.md': '# Skills\n\nSkill fixture\n',
    'GIT.md': '# Git\n\nGit fixture\n',
    'questions.md': '# Questions\n\n| Status | Question | Decision | Owner | Date |\n| --- | --- | --- | --- | --- |\n',
    'maps/README.md': '# Maps\n',
    'runbooks/README.md': '# Runbooks\n',
    'plans/README.md': '# Plans\n',
    'worklogs/README.md': '# Worklogs\n',
    'worklogs/summaries/README.md': '# Summaries\n'
  };
  for (const [file, content] of Object.entries(files)) {
    const destination = path.join(target, dirName, ...file.split('/'));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
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
