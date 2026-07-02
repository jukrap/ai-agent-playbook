import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('rules check --json reports matching project rules without writing files', async () => {
  const target = await tempRepo('rules check-공백-한글-');
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await mkdir(path.join(target, '.github', 'instructions'), { recursive: true });
  await mkdir(path.join(target, 'src', '기능 모듈'), { recursive: true });
  await writeFile(path.join(target, 'AGENTS.md'), '# Root rule that should not be re-injected\n');
  await writeFile(path.join(target, 'src', '기능 모듈', 'example.ts'), 'export const value = 1;\n');
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'typescript.md'), [
    '---',
    'globs:',
    '  - src/**/*.ts',
    '---',
    '# TypeScript rule',
    '',
    'Use the local TypeScript conventions.'
  ].join('\n'));
  await writeFile(path.join(target, '.github', 'instructions', 'always.md'), [
    '---',
    'alwaysApply: true',
    '---',
    '# Always rule',
    '',
    'Apply this rule for every file.'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['rules', 'check', '.', '--path', 'src/기능 모듈/example.ts', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.path, 'src/기능 모듈/example.ts');
  assert.equal(report.summary.total >= 2, true);
  assert.equal(report.summary.applies, 2);
  assert.equal(report.rules.some((rule) => rule.path === '.ai-playbook/rules/typescript.md' && rule.applies && rule.reason === 'glob'), true);
  assert.equal(report.rules.some((rule) => rule.path === '.github/instructions/always.md' && rule.applies && rule.reason === 'alwaysApply'), true);
  assert.equal(report.rules.some((rule) => rule.path === 'AGENTS.md'), false);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('rules check --json reports malformed rule frontmatter as warning without failing', async () => {
  const target = await tempRepo('rules malformed-한글-');
  await mkdir(path.join(target, '.cursor', 'rules'), { recursive: true });
  await writeFile(path.join(target, '.cursor', 'rules', 'broken.md'), [
    '---',
    'globs: [',
    '---',
    '# Broken rule'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['rules', 'check', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.warnings.some((warning) => warning.id === 'rules.frontmatter'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('diagnostics check --json reports local verification command candidates without running them', async () => {
  const target = await tempRepo('diagnostics check-공백-한글-');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      check: 'node --check src/index.mjs',
      test: 'node --test',
      lint: 'eslint .'
    }
  }, null, 2));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['diagnostics', 'check', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.commands, 3);
  assert.equal(report.commands.some((command) => command.command === 'npm run check' && command.source === 'package.json'), true);
  assert.equal(report.commands.some((command) => command.command === 'npm test' && command.source === 'package.json'), true);
  assert.equal(report.checks.some((check) => check.id === 'diagnostics.commands' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('diagnostics check --json prefers the detected package manager without writing files', async () => {
  const target = await tempRepo('diagnostics pnpm-공백-한글-');
  await writeFile(path.join(target, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      lint: 'eslint .',
      typecheck: 'tsc -b --pretty false',
      build: 'tsc -b && vite build'
    }
  }, null, 2));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['diagnostics', 'check', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.deepEqual(report.packageManager, {
    name: 'pnpm',
    lockfile: 'pnpm-lock.yaml'
  });
  assert.deepEqual(report.commands.map((command) => command.command), [
    'pnpm lint',
    'pnpm typecheck',
    'pnpm build'
  ]);
  assert.equal(report.checks.some((check) => check.id === 'diagnostics.package-manager' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('diagnostics check --json warns when no verification command candidates are found', async () => {
  const target = await tempRepo('diagnostics empty-한글-');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['diagnostics', 'check', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.commands, 0);
  assert.equal(report.checks.some((check) => check.id === 'diagnostics.commands' && check.level === 'warn'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('qa tui-check --json reports CJK width and overflow without writing files', async () => {
  const target = await tempRepo('tui check-공백-한글-');
  const captureFile = path.join(target, 'terminal capture-한글.txt');
  await writeFile(captureFile, [
    'status',
    '한글AB',
    'wide 한글한글'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['qa', 'tui-check', captureFile, '--cols', '8', '--json'], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.command, 'qa.tui-check');
  assert.equal(report.expectedColumns, 8);
  assert.equal(report.maxWidth > 8, true);
  assert.equal(report.overflowLines.some((line) => line.line === 3), true);
  assert.equal(report.wideCharColumns.length > 0, true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator check --json aggregates read-only operator signals for a path', async () => {
  const target = await tempRepo('operator check-공백-한글-');
  const setup = capture(target);
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], setup), 0);
  await adaptPlaybook(target);
  await writeFile(path.join(target, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      lint: 'eslint .',
      typecheck: 'tsc -b --pretty false'
    }
  }, null, 2));
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await mkdir(path.join(target, 'src', '기능 모듈'), { recursive: true });
  await writeFile(path.join(target, 'src', '기능 모듈', 'example.tsx'), 'export function Example() { return null; }\n');
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'react.md'), [
    '---',
    'globs:',
    '  - src/**/*.tsx',
    '---',
    '# React rule'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'check', '.', '--path', 'src/기능 모듈/example.tsx', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.path, 'src/기능 모듈/example.tsx');
  assert.equal(report.summary.sections, 4);
  assert.equal(report.summary.fail, 0);
  assert.equal(report.sections.doctor.ok, true);
  assert.equal(report.sections.guides.summary.missing, 0);
  assert.equal(report.sections.diagnostics.packageManager.name, 'pnpm');
  assert.deepEqual(report.sections.diagnostics.commands.map((command) => command.command), [
    'pnpm lint',
    'pnpm typecheck'
  ]);
  assert.equal(report.sections.rules.summary.applies, 1);
  assert.equal(report.checks.some((check) => check.id === 'operator.rules' && check.level === 'pass'), true);
  assert.deepEqual(report.checks.find((check) => check.id === 'operator.doctor').paths, []);
  assert.deepEqual(report.checks.find((check) => check.id === 'operator.diagnostics').paths, []);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator check --json reports stale guides as a warning without failing or writing files', async () => {
  const target = await tempRepo('operator stale-한글-');
  const setup = capture(target);
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], setup), 0);
  await adaptPlaybook(target);
  await writeFile(path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md'), '# locally changed guide\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'check', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.sections.guides.summary.stale, 1);
  assert.equal(report.checks.some((check) => check.id === 'operator.guides' && check.level === 'warn'), true);
  assert.equal(report.summary.warn > 0, true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator check --json fails when the playbook is missing but still stays read-only', async () => {
  const target = await tempRepo('operator missing-한글-');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      test: 'node --test'
    }
  }, null, 2));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'check', '.', '--json'], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.sections.doctor.ok, false);
  assert.equal(report.checks.some((check) => check.id === 'operator.doctor' && check.level === 'fail'), true);
  assert.equal(report.sections.diagnostics.commands.some((command) => command.command === 'npm test'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator search --json finds source, playbook, rules, and worklog matches without writing files', async () => {
  const target = await tempRepo('operator search-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, 'src', '기능 모듈'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'worklogs', '2026-06'), { recursive: true });
  await writeFile(path.join(target, 'src', '기능 모듈', 'auth-flow.ts'), 'export const authFlow = "token refresh";\n');
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAuth flow uses token refresh.\n');
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'auth.md'), [
    '---',
    'globs:',
    '  - src/**/*.ts',
    '---',
    '# Auth rule',
    '',
    'Use token refresh checks.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'worklogs', '2026-06', '2026-06-13-auth.md'), '# Auth worklog\n\nToken refresh was reviewed.\n');
  await mkdir(path.join(target, 'node_modules', 'ignored'), { recursive: true });
  await writeFile(path.join(target, 'node_modules', 'ignored', 'auth.txt'), 'token refresh ignored\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'operator',
    'search',
    '.',
    '--query',
    'token refresh',
    '--path',
    'src/기능 모듈/auth-flow.ts',
    '--max-results',
    '10',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.query, 'token refresh');
  assert.equal(report.path, 'src/기능 모듈/auth-flow.ts');
  assert.equal(report.summary.matches >= 4, true);
  assert.equal(report.results.some((result) => result.path === 'src/기능 모듈/auth-flow.ts' && result.category === 'source'), true);
  assert.equal(report.results.some((result) => result.path === '.ai-playbook/CURRENT.md' && result.category === 'playbook'), true);
  assert.equal(report.results.some((result) => result.path === '.ai-playbook/rules/auth.md' && result.category === 'rules'), true);
  assert.equal(report.results.some((result) => result.category === 'worklogs'), true);
  assert.equal(report.results.some((result) => result.path.includes('node_modules')), false);
  assert.equal(report.results.every((result) => result.snippets.length > 0), true);
  assert.equal(report.related.rules.summary.applies, 1);
  assert.equal(report.related.diagnostics.summary.commands >= 0, true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator search --json reports no matches without failing or writing files', async () => {
  const target = await tempRepo('operator search empty-한글-');
  await writeFile(path.join(target, 'README.md'), '# Empty fixture\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'search', '.', '--query', 'does-not-exist', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.matches, 0);
  assert.deepEqual(report.results, []);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator research --json correlates local evidence across source tests playbook and rules without writing files', async () => {
  const target = await tempRepo('operator research-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, 'src', 'features', '인증'), { recursive: true });
  await mkdir(path.join(target, 'test'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'worklogs', '2026-06'), { recursive: true });
  await mkdir(path.join(target, 'node_modules', 'ignored'), { recursive: true });
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      test: 'node --test',
      check: 'node --check src/features/인증/auth-flow.mjs'
    }
  }, null, 2));
  await writeFile(path.join(target, 'src', 'features', '인증', 'auth-flow.mjs'), [
    'export function refreshToken(session) {',
    '  if (!session?.token) return "missing token";',
    '  return `token refresh for ${session.token}`;',
    '}'
  ].join('\n'));
  await writeFile(path.join(target, 'test', 'auth-flow.test.mjs'), [
    'import { refreshToken } from "../src/features/인증/auth-flow.mjs";',
    'test("token refresh keeps an authenticated session alive", () => {',
    '  refreshToken({ token: "abc" });',
    '});'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAuth flow uses token refresh for session continuity.\n');
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'auth.md'), [
    '---',
    'globs:',
    '  - src/features/인증/**/*.mjs',
    '---',
    '# Auth rule',
    '',
    'Token refresh changes require test evidence.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'context', 'auth.md'), [
    '---',
    'globs:',
    '  - src/features/인증/**/*.mjs',
    '---',
    '# Auth context',
    '',
    'The auth flow depends on token refresh.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'worklogs', '2026-06', '2026-06-13-auth.md'), '# Auth worklog\n\nToken refresh risk was reviewed.\n');
  await writeFile(path.join(target, 'node_modules', 'ignored', 'auth.txt'), 'token refresh ignored\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'operator',
    'research',
    '.',
    '--query',
    'token refresh auth flow',
    '--path',
    'src/features/인증/auth-flow.mjs',
    '--max-results',
    '50',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.query, 'token refresh auth flow');
  assert.equal(report.path, 'src/features/인증/auth-flow.mjs');
  assert.deepEqual(report.mode, {
    localOnly: true,
    network: false,
    writes: false
  });
  assert.equal(report.summary.evidence >= 5, true);
  assert.equal(report.summary.returned >= 5, true);
  assert.equal(report.axes.some((axis) => axis.id === 'query'), true);
  assert.equal(report.evidence.some((item) => item.path === 'src/features/인증/auth-flow.mjs' && item.category === 'source'), true);
  assert.equal(report.evidence.some((item) => item.path === 'test/auth-flow.test.mjs' && item.category === 'tests'), true);
  assert.equal(report.evidence.some((item) => item.path === '.ai-playbook/CURRENT.md' && item.category === 'playbook'), true);
  assert.equal(report.evidence.some((item) => item.path === '.ai-playbook/rules/auth.md' && item.category === 'rules'), true);
  assert.equal(report.evidence.some((item) => item.category === 'worklogs'), true);
  assert.equal(report.evidence.some((item) => item.path.includes('node_modules')), false);
  assert.equal(report.related.rules.summary.applies, 1);
  assert.equal(report.related.context.summary.matchingContextFiles, 2);
  assert.equal(report.related.diagnostics.summary.commands, 2);
  assert.equal(report.related.map.summary.sourceFiles >= 1, true);
  assert.equal(report.reportMarkdown.includes('## Evidence'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator research --json returns gaps and next steps for no local evidence without writing files', async () => {
  const target = await tempRepo('operator research empty-한글-');
  await writeFile(path.join(target, 'README.md'), '# Empty fixture\n');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      test: 'node --test'
    }
  }, null, 2));
  await mkdir(path.join(target, 'test'), { recursive: true });
  await writeFile(path.join(target, 'test', 'unrelated.test.mjs'), 'test("unrelated", () => {});\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'research', '.', '--query', 'does-not-exist', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.evidence, 0);
  assert.deepEqual(report.evidence, []);
  assert.equal(report.gaps.some((gap) => gap.id === 'research.no-local-evidence'), true);
  assert.equal(report.nextSteps.some((step) => step.id === 'research.refine-query'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator preflight --json collects advisory signals and a portable no-write snapshot', async () => {
  const target = await tempRepo('operator preflight-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, 'src', 'features', '결제'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'contracts', 'active'), { recursive: true });
  await writeFile(path.join(target, 'src', 'features', '결제', 'Payment Panel.tsx'), [
    'export function PaymentPanel() {',
    '  return "payment cancel";',
    '}'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nPayment cancel work is active.\n');
  await writeFile(path.join(target, '.ai-playbook', 'context', 'payments.md'), [
    '---',
    'globs: ["src/features/결제/**/*.tsx"]',
    '---',
    '# Payment context',
    '',
    'Payment cancel changes affect settlement state.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'payments.md'), [
    '---',
    'globs:',
    '  - src/features/결제/**/*.tsx',
    '---',
    '# Payment rule',
    '',
    'Payment cancel changes require contract evidence.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'contracts', 'active', 'payment-cancel.md'), [
    '---',
    'id: payment-cancel',
    'status: active',
    'appliesTo:',
    '  - src/features/결제/**/*.tsx',
    'freshness: 2026-06-14',
    '---',
    '# Payment Cancel Contract',
    '',
    '## Required evidence',
    '',
    '- test payment cancel behavior.'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'operator',
    'preflight',
    '.',
    '--intent',
    'payment cancel contract',
    '--path',
    'src\\features\\결제\\Payment Panel.tsx',
    '--max-results',
    '10',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.intent, 'payment cancel contract');
  assert.equal(report.path, 'src/features/결제/Payment Panel.tsx');
  assert.equal(report.summary.candidates >= 4, true);
  assert.equal(report.candidates.some((item) => item.path === 'src/features/결제/Payment Panel.tsx' && item.category === 'source'), true);
  assert.equal(report.candidates.some((item) => item.path === '.ai-playbook/CURRENT.md' && item.category === 'playbook'), true);
  assert.equal(report.candidates.some((item) => item.path === '.ai-playbook/rules/payments.md' && item.category === 'rules'), true);
  assert.equal(report.signals.rules.summary.applies, 1);
  assert.equal(report.signals.context.summary.matchingContextFiles >= 2, true);
  assert.equal(report.signals.contracts.summary.matches, 1);
  assert.equal(report.snapshot.intentTerms.includes('payment'), true);
  assert.equal(report.snapshot.scanRange.totalFiles >= before.length, true);
  assert.equal(report.snapshot.files.some((file) => file.path === 'src/features/결제/Payment Panel.tsx'), true);
  assert.equal(report.snapshot.files.every((file) => !path.isAbsolute(file.path) && !file.path.includes('\\')), true);
  assert.equal(report.snapshot.files.every((file) => /^[a-f0-9]{64}$/.test(file.hash)), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator preflight --json works without a path and stays read-only', async () => {
  const target = await tempRepo('operator preflight no path-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nSmoke test evidence gate.\n');
  await writeFile(path.join(target, 'README.md'), '# Smoke test\n\nEvidence gate smoke test.\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'operator',
    'preflight',
    '.',
    '--intent',
    'evidence gate smoke test',
    '--max-results',
    '5',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal('path' in report, false);
  assert.equal(report.candidates.some((item) => item.path === '.ai-playbook/CURRENT.md'), true);
  assert.equal(report.snapshot.intentTerms.includes('evidence'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator delta --json compares a preflight snapshot without writing files', async () => {
  const target = await tempRepo('operator delta-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, 'src', 'features', '검색'), { recursive: true });
  await mkdir(path.join(target, 'docs'), { recursive: true });
  await writeFile(path.join(target, 'src', 'features', '검색', 'SearchPanel.tsx'), 'export const searchPanel = "search intent";\n');
  await writeFile(path.join(target, 'src', 'features', '검색', 'old.ts'), 'export const oldSearch = true;\n');

  const preflight = capture(target);
  assert.equal(await runCli([
    'operator',
    'preflight',
    '.',
    '--intent',
    'search panel',
    '--path',
    'src/features/검색/SearchPanel.tsx',
    '--json'
  ], preflight), 0);
  const beforePath = path.join(target, 'preflight snapshot.json');
  await writeFile(beforePath, preflight.out());

  await writeFile(path.join(target, 'src', 'features', '검색', 'SearchPanel.tsx'), 'export const searchPanel = "search intent changed";\n');
  await rm(path.join(target, 'src', 'features', '검색', 'old.ts'));
  await writeFile(path.join(target, 'docs', 'unrelated.md'), '# Out of scope\n');
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nPlaybook changed after preflight.\n');
  const beforeDelta = await listRelativeFiles(target);

  const delta = capture(target);
  assert.equal(await runCli([
    'operator',
    'delta',
    '.',
    '--before',
    beforePath,
    '--json'
  ], delta), 0);
  const report = JSON.parse(delta.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.before.intent, 'search panel');
  assert.equal(report.summary.modified >= 1, true);
  assert.equal(report.summary.deleted >= 1, true);
  assert.equal(report.summary.added >= 1, true);
  assert.equal(report.changes.modified.some((item) => item.path === 'src/features/검색/SearchPanel.tsx'), true);
  assert.equal(report.changes.deleted.some((item) => item.path === 'src/features/검색/old.ts'), true);
  assert.equal(report.changes.added.some((item) => item.path === 'docs/unrelated.md'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'operator.delta.intent-outside-change'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'operator.delta.playbook-change'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeDelta);
  await cleanup(target);
});

test('operator delta rejects malformed and unsafe preflight snapshots without writing files', async () => {
  const target = await tempRepo('operator delta unsafe-한글-');
  await writeFile(path.join(target, 'README.md'), '# fixture\n');

  const malformedPath = path.join(target, 'malformed.json');
  await writeFile(malformedPath, '{not-json');
  const malformedBefore = await listRelativeFiles(target);
  const malformed = capture(target);
  assert.equal(await runCli(['operator', 'delta', '.', '--before', malformedPath, '--json'], malformed), 1);
  const malformedReport = JSON.parse(malformed.out());
  assert.equal(malformedReport.conflicts.some((conflict) => conflict.id === 'operator.delta.snapshot-malformed'), true);
  assert.deepEqual(await listRelativeFiles(target), malformedBefore);

  const unsafePath = path.join(target, 'unsafe.json');
  await writeFile(unsafePath, JSON.stringify({
    schemaVersion: '1',
    target,
    intent: 'unsafe',
    snapshot: {
      files: [
        { path: '../outside.txt', hash: '0'.repeat(64), size: 1, mtimeMs: 1 },
        { path: path.join(target, 'README.md'), hash: '0'.repeat(64), size: 1, mtimeMs: 1 }
      ]
    }
  }));
  const unsafeBefore = await listRelativeFiles(target);
  const unsafe = capture(target);
  assert.equal(await runCli(['operator', 'delta', '.', '--before', unsafePath, '--json'], unsafe), 1);
  const unsafeReport = JSON.parse(unsafe.out());
  assert.equal(unsafeReport.conflicts.some((conflict) => conflict.id === 'operator.delta.snapshot-path-invalid'), true);
  assert.deepEqual(await listRelativeFiles(target), unsafeBefore);
  await cleanup(target);
});

test('operator context --json previews path-scoped playbook context without writing files', async () => {
  const target = await tempRepo('operator context-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, 'src', 'features', '결제'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'maps'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'runbooks'), { recursive: true });
  await writeFile(path.join(target, 'src', 'features', '결제', 'PaymentPanel.tsx'), 'export function PaymentPanel() { return null; }\n');
  await writeFile(path.join(target, '.ai-playbook', 'context', 'frontend.md'), [
    '---',
    'globs:',
    '  - src/features/**/*.tsx',
    '---',
    '# Frontend context',
    '',
    'PaymentPanel uses route-level state.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'context', 'backend.md'), [
    '---',
    'globs:',
    '  - server/**/*.ts',
    '---',
    '# Backend context'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'react.md'), [
    '---',
    'globs: ["src/features/**/*.tsx"]',
    '---',
    '# React rule'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'maps', 'repo-map.md'), [
    '# Repo Map',
    '',
    'The payment feature lives in `src/features/결제/PaymentPanel.tsx`.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'runbooks', 'payment.md'), [
    '# Payment runbook',
    '',
    'PaymentPanel manual smoke checks live here.'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'operator',
    'context',
    '.',
    '--path',
    'src/features/결제/PaymentPanel.tsx',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.path, 'src/features/결제/PaymentPanel.tsx');
  assert.equal(report.summary.coreSources, 4);
  assert.equal(report.summary.matchingContextFiles, 2);
  assert.equal(report.summary.docMap, 1);
  assert.equal(report.docMap.path, '.ai-playbook/maps/doc-map.md');
  assert.equal(report.contexts.some((item) => item.path === '.ai-playbook/context/root.md' && item.applies && item.reason === 'alwaysApply'), true);
  assert.equal(report.contexts.some((item) => item.path === '.ai-playbook/context/frontend.md' && item.applies && item.reason === 'glob'), true);
  assert.equal(report.contexts.some((item) => item.path === '.ai-playbook/context/backend.md' && !item.applies), true);
  assert.equal(report.rules.summary.applies, 1);
  assert.equal(report.related.some((item) => item.path === '.ai-playbook/maps/repo-map.md' && item.category === 'maps'), true);
  assert.equal(report.related.some((item) => item.path === '.ai-playbook/runbooks/payment.md' && item.category === 'runbooks'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator analyze --json combines read-only context rules diagnostics map and optional tool signals', async () => {
  const target = await tempRepo('operator analyze-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, 'src', 'features', '검색'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'rules'), { recursive: true });
  await writeFile(path.join(target, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      check: 'tsc --noEmit',
      'ast-grep': 'ast-grep scan'
    },
    devDependencies: {
      typescript: 'latest'
    }
  }, null, 2));
  await writeFile(path.join(target, 'tsconfig.json'), '{}\n');
  await writeFile(path.join(target, 'sgconfig.yml'), 'ruleDirs: []\n');
  await writeFile(path.join(target, 'src', 'features', '검색', 'SearchPanel.tsx'), 'export function SearchPanel() { return null; }\n');
  await writeFile(path.join(target, '.ai-playbook', 'context', 'frontend.md'), [
    '---',
    'globs:',
    '  - src/features/**/*.tsx',
    '---',
    '# Frontend context',
    '',
    'SearchPanel is a visible UI surface.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'rules', 'react.md'), [
    '---',
    'globs: ["src/features/**/*.tsx"]',
    '---',
    '# React rule'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'operator',
    'analyze',
    '.',
    '--path',
    'src/features/검색/SearchPanel.tsx',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.path, 'src/features/검색/SearchPanel.tsx');
  assert.equal(report.summary.ruleMatches, 1);
  assert.equal(report.summary.contextMatches, 2);
  assert.equal(report.diagnostics.packageManager.name, 'pnpm');
  assert.equal(report.map.stack.languages.some((language) => language.extension === '.tsx'), true);
  assert.equal(report.rules.matches.some((rule) => rule.path === '.ai-playbook/rules/react.md'), true);
  assert.equal(report.context.matches.some((item) => item.path === '.ai-playbook/context/frontend.md'), true);
  assert.equal(report.context.matches.some((item) => item.path === '.ai-playbook/context/root.md'), true);
  assert.equal(report.optionalTools.some((tool) => tool.id === 'ast-grep' && tool.status === 'detected'), true);
  assert.equal(report.optionalTools.some((tool) => tool.id === 'lsp' && tool.status === 'project-signals'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator analyze --json reports missing optional analysis tools without failing or writing files', async () => {
  const target = await tempRepo('operator analyze minimal-한글-');
  await writeFile(path.join(target, 'README.md'), '# Minimal fixture\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'analyze', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.optionalToolSignals, 0);
  assert.equal(report.optionalTools.some((tool) => tool.id === 'ast-grep' && tool.status === 'not-detected'), true);
  assert.equal(report.optionalTools.some((tool) => tool.id === 'lsp' && tool.status === 'not-detected'), true);
  assert.equal(report.optionalTools.some((tool) => tool.id === 'comment-checker' && tool.status === 'manual'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator map --json reports stack architecture quality and concerns without writing files', async () => {
  const target = await tempRepo('operator map-공백-한글-');
  await mkdir(path.join(target, 'src', 'app'), { recursive: true });
  await mkdir(path.join(target, 'src', 'features', '검색'), { recursive: true });
  await mkdir(path.join(target, 'tests'), { recursive: true });
  await mkdir(path.join(target, '.github', 'workflows'), { recursive: true });
  await mkdir(path.join(target, 'node_modules', 'ignored'), { recursive: true });
  await writeFile(path.join(target, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: {
      check: 'tsc --noEmit',
      test: 'vitest run'
    },
    dependencies: {
      '@vitejs/plugin-react': 'latest',
      react: 'latest',
      vite: 'latest'
    },
    devDependencies: {
      vitest: 'latest',
      typescript: 'latest'
    }
  }, null, 2));
  await writeFile(path.join(target, 'tsconfig.json'), '{}\n');
  await writeFile(path.join(target, 'vitest.config.ts'), 'export default {};\n');
  await writeFile(path.join(target, '.github', 'workflows', 'validate.yml'), 'name: validate\n');
  await writeFile(path.join(target, 'src', 'app', 'main.tsx'), 'import React from "react";\n');
  await writeFile(path.join(target, 'src', 'features', '검색', 'SearchPanel.tsx'), [
    'export function SearchPanel() {',
    '  // TODO: remove debug log',
    '  console.log("debug");',
    '  return <div dangerouslySetInnerHTML={{ __html: "" }} />;',
    '}'
  ].join('\n'));
  await writeFile(path.join(target, 'tests', 'SearchPanel.test.tsx'), 'test("search", () => {});\n');
  await writeFile(path.join(target, 'node_modules', 'ignored', 'Hidden.test.ts'), 'test("ignored", () => {});\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'map', '.', '--json'], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.target, target);
  assert.equal(report.summary.sourceFiles >= 2, true);
  assert.equal(report.stack.packageManager.name, 'pnpm');
  assert.equal(report.stack.frameworks.some((framework) => framework.name === 'react'), true);
  assert.equal(report.stack.languages.some((language) => language.extension === '.tsx'), true);
  assert.equal(report.architecture.entrypoints.some((entry) => entry.path === 'src/app/main.tsx'), true);
  assert.equal(report.architecture.moduleBoundaries.some((boundary) => boundary.path === 'src/features'), true);
  assert.equal(report.quality.testFiles.count, 1);
  assert.equal(report.quality.configs.some((config) => config.path === 'vitest.config.ts'), true);
  assert.equal(report.quality.commands.some((command) => command.command === 'pnpm test'), true);
  assert.equal(report.concerns.todos.count, 1);
  assert.equal(report.concerns.debugArtifacts.count, 1);
  assert.equal(report.concerns.securitySignals.count, 1);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator audit --json reports playbook drift without writing files', async () => {
  const target = await tempRepo('operator audit-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, '.ai-playbook', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'maps'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'runbooks'), { recursive: true });
  await mkdir(path.join(target, 'ai-playbook'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'maps', 'broken.md'), [
    '# Broken references',
    '',
    '[missing](../runbooks/missing.md)'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'maps', 'duplicate-a.md'), '# Same\n\nDuplicate signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'runbooks', 'duplicate-b.md'), '# Same\n\nDuplicate signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'context', 'orphan.md'), [
    '---',
    'globs:',
    '  - src/missing/**/*.ts',
    '---',
    '# Orphan context'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'audit', '.', '--json'], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.target, target);
  assert.equal(report.summary.findings >= 4, true);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.broken-link' && finding.level === 'fail'), true);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.orphan-context' && finding.level === 'warn'), true);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.duplicate-content' && finding.level === 'warn'), true);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.legacy-playbook' && finding.level === 'warn'), true);
  assert.equal(report.sections.links.broken, 1);
  assert.equal(report.sections.context.orphaned, 1);
  assert.equal(report.sections.duplicates.groups, 1);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator audit --json includes memory drift for context doc-map and contract paths', async () => {
  const target = await tempRepo('operator audit memory drift-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await adaptPlaybook(target);
  await mkdir(path.join(target, '.ai-playbook', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'maps'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'contracts', 'active'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'context', 'orphan.md'), [
    '---',
    'globs:',
    '  - src/missing/**/*.ts',
    '---',
    '# Orphan context'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'maps', 'doc-map.md'), [
    '# Documentation Map',
    '',
    '- [Missing runbook](../runbooks/missing.md)'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'contracts', 'active', 'missing-path.md'), [
    '---',
    'id: missing-path',
    'status: active',
    'appliesTo:',
    '  - src/contracts/missing.ts',
    '---',
    '# Missing Path Contract',
    '',
    '## Required evidence',
    '',
    '- Confirm missing path.'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli(['operator', 'audit', '.', '--json'], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.sections.memoryDrift.contextOrphans, 1);
  assert.equal(report.sections.memoryDrift.missingDocMapTargets, 1);
  assert.equal(report.sections.memoryDrift.contractAppliesToMissing, 1);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.orphan-context'), true);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.doc-map-target-missing'), true);
  assert.equal(report.findings.some((finding) => finding.id === 'operator.audit.contract-applies-to-missing'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator gc previews and removes only obsolete unmodified managed files', async () => {
  const target = await tempRepo('operator gc-공백-한글-');
  await mkdir(path.join(target, '.ai-playbook', 'guides'), { recursive: true });
  const obsoletePath = '.ai-playbook/guides/obsolete.md';
  const editedPath = '.ai-playbook/guides/edited-obsolete.md';
  const currentPath = '.ai-playbook/guides/runtime-harness.md';
  const obsoleteContent = '# Obsolete\n';
  const editedOriginal = '# Edited original\n';
  const currentContent = await readFile(path.join(repoRoot, 'templates', 'project-playbook', 'guides', 'runtime-harness.md'), 'utf8');
  await writeFile(path.join(target, ...obsoletePath.split('/')), obsoleteContent);
  await writeFile(path.join(target, ...editedPath.split('/')), `${editedOriginal}local edit\n`);
  await writeFile(path.join(target, ...currentPath.split('/')), currentContent);
  await writeFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), JSON.stringify({
    schemaVersion: '1',
    source: 'ai-agent-playbook',
    playbookDir: '.ai-playbook',
    localOnly: true,
    installedAtUtc: '2026-06-13T00:00:00.000Z',
    updatedAtUtc: '2026-06-13T00:00:00.000Z',
    files: [
      {
        path: obsoletePath,
        kind: 'guide',
        source: 'templates/project-playbook/guides/obsolete.md',
        sourceHash: hashText(obsoleteContent),
        targetHash: hashText(obsoleteContent)
      },
      {
        path: editedPath,
        kind: 'guide',
        source: 'templates/project-playbook/guides/edited-obsolete.md',
        sourceHash: hashText(editedOriginal),
        targetHash: hashText(editedOriginal)
      },
      {
        path: currentPath,
        kind: 'guide',
        source: 'templates/project-playbook/guides/runtime-harness.md',
        sourceHash: hashText(currentContent),
        targetHash: hashText(currentContent)
      }
    ]
  }, null, 2));
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['operator', 'gc', '.', '--json'], preview), 1);
  const previewReport = JSON.parse(preview.out());

  assert.equal(previewReport.schemaVersion, '1');
  assert.equal(previewReport.ok, false);
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.summary.removable, 1);
  assert.equal(previewReport.operations.some((operation) => operation.id === 'operator.gc.remove-obsolete-managed-file' && operation.paths.includes(obsoletePath)), true);
  assert.equal(previewReport.conflicts.some((conflict) => conflict.id === 'operator.gc.modified-obsolete-managed-file' && conflict.paths.includes(editedPath)), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['operator', 'gc', '.', '--apply', '--json'], applied), 1);
  const appliedReport = JSON.parse(applied.out());
  const after = await listRelativeFiles(target);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));

  assert.equal(appliedReport.applied, true);
  assert.equal(after.includes(obsoletePath), false);
  assert.equal(after.includes(editedPath), true);
  assert.equal(after.includes(currentPath), true);
  assert.equal(manifest.files.some((file) => file.path === obsoletePath), false);
  assert.equal(manifest.files.some((file) => file.path === editedPath), true);
  assert.equal(manifest.files.some((file) => file.path === currentPath), true);
  await cleanup(target);
});

test('operator gc rejects non-portable manifest paths before removal', async () => {
  const target = await tempRepo('operator gc traversal-공백-한글-');
  await mkdir(path.join(target, '.ai-playbook', 'guides'), { recursive: true });
  const actualPath = '.ai-playbook/guides/obsolete.md';
  const manifestPath = '.ai-playbook/../.ai-playbook/guides/obsolete.md';
  const obsoleteContent = '# Obsolete\n';
  await writeFile(path.join(target, ...actualPath.split('/')), obsoleteContent);
  await writeFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), JSON.stringify({
    schemaVersion: '1',
    source: 'ai-agent-playbook',
    playbookDir: '.ai-playbook',
    localOnly: true,
    installedAtUtc: '2026-06-13T00:00:00.000Z',
    updatedAtUtc: '2026-06-13T00:00:00.000Z',
    files: [
      {
        path: manifestPath,
        kind: 'guide',
        source: 'templates/project-playbook/guides/obsolete.md',
        sourceHash: hashText(obsoleteContent),
        targetHash: hashText(obsoleteContent)
      }
    ]
  }, null, 2));
  const before = await listRelativeFiles(target);

  const applied = capture(target);
  assert.equal(await runCli(['operator', 'gc', '.', '--apply', '--json'], applied), 1);
  const report = JSON.parse(applied.out());

  assert.equal(report.applied, false);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'operator.gc.manifest-invalid'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  assert.equal(existsSync(path.join(target, ...actualPath.split('/'))), true);
  await cleanup(target);
});

test('qa image-diff --json compares PNG images without writing files', async () => {
  const target = await tempRepo('qa image diff-공백-한글-');
  const reference = path.join(target, 'reference.png');
  const same = path.join(target, 'same.png');
  const different = path.join(target, 'different.png');
  const mismatch = path.join(target, 'mismatch.png');
  await writePng(reference, 2, 2, [
    [255, 0, 0, 255], [255, 0, 0, 255],
    [255, 0, 0, 255], [255, 0, 0, 255]
  ]);
  await writePng(same, 2, 2, [
    [255, 0, 0, 255], [255, 0, 0, 255],
    [255, 0, 0, 255], [255, 0, 0, 255]
  ]);
  await writePng(different, 2, 2, [
    [255, 0, 0, 255], [0, 0, 255, 255],
    [255, 0, 0, 255], [0, 0, 255, 255]
  ]);
  await writePng(mismatch, 1, 1, [[255, 0, 0, 255]]);
  const before = await listRelativeFiles(target);

  const identical = capture(target);
  assert.equal(await runCli(['qa', 'image-diff', reference, same, '--json'], identical), 0);
  const identicalReport = JSON.parse(identical.out());
  assert.equal(identicalReport.schemaVersion, '1');
  assert.equal(identicalReport.ok, true);
  assert.equal(identicalReport.summary.changedPixels, 0);
  assert.equal(identicalReport.summary.diffRatio, 0);
  assert.equal(identicalReport.summary.similarityScore, 1);

  const changed = capture(target);
  assert.equal(await runCli(['qa', 'image-diff', reference, different, '--threshold', '0', '--json'], changed), 1);
  const changedReport = JSON.parse(changed.out());
  assert.equal(changedReport.ok, false);
  assert.equal(changedReport.summary.changedPixels, 2);
  assert.equal(changedReport.hotspots.length > 0, true);

  const mismatched = capture(target);
  assert.equal(await runCli(['qa', 'image-diff', reference, mismatch, '--json'], mismatched), 1);
  const mismatchedReport = JSON.parse(mismatched.out());
  assert.equal(mismatchedReport.conflicts.some((conflict) => conflict.id === 'qa.image-diff.dimension-mismatch'), true);
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

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function writePng(file, width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;
  let pixelIndex = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      const pixel = pixels[pixelIndex] ?? [0, 0, 0, 255];
      pixelIndex += 1;
      raw[offset] = pixel[0];
      raw[offset + 1] = pixel[1];
      raw[offset + 2] = pixel[2];
      raw[offset + 3] = pixel[3];
      offset += 4;
    }
  }
  const chunks = [
    pngChunk('IHDR', Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ];
  await writeFile(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]));
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc32(crcInput))]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function tempRepo(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function adaptPlaybook(target) {
  await writeFile(path.join(target, '.ai-playbook', 'START_HERE.md'), [
    '# Start Here',
    '',
    '## Current objective',
    '',
    '- No active implementation task.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), [
    '# Current State',
    '',
    '## Baseline',
    '',
    '- Product shape: test fixture.',
    '- Verification commands: fixture-defined.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-playbook', 'questions.md'), [
    '# Questions',
    '',
    '| Status | Question |',
    '| --- | --- |',
    '| Closed | Fixture has no open questions. |'
  ].join('\n'));
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
  if (existsSync(target)) {
    await rm(target, { recursive: true, force: true });
  }
}
