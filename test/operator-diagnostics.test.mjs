import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
  if (existsSync(target)) {
    await rm(target, { recursive: true, force: true });
  }
}
