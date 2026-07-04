import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('context status parses frontmatter and matches Windows spaced non-ASCII paths without writing files', async () => {
  const target = await tempRepo('context status-공백-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook', 'memory', 'context'), { recursive: true });
  await mkdir(path.join(target, '.ai-agent-playbook', 'memory', 'maps'), { recursive: true });
  await mkdir(path.join(target, 'src', '기능 모듈'), { recursive: true });
  await writeFile(path.join(target, 'src', '기능 모듈', 'Payment Panel.tsx'), 'export function PaymentPanel() { return null; }\n');
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'context', 'root.md'), [
    '---',
    'id: root',
    'alwaysApply: true',
    'freshness: 2026-06-14',
    'priority: high',
    '---',
    '# Root Context'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'context', 'frontend.md'), [
    '---',
    'id: frontend',
    'globs: ["src/**/*.tsx"]',
    'freshness: 2026-06-14',
    'priority: high',
    '---',
    '# Frontend Context',
    '',
    '## When to read',
    'Visible UI changes.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'context', 'backend.md'), [
    '---',
    'id: backend',
    'globs:',
    '  - server/**/*.ts',
    'priority: low',
    '---',
    '# Backend Context'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'maps', 'doc-map.md'), '# Documentation Map\n\nRead CURRENT.md before worklogs.\n');
  const before = await listRelativeFiles(target);

  const io = capture(target);
  assert.equal(await runCli([
    'context',
    'status',
    '.',
    '--path',
    'src\\기능 모듈\\Payment Panel.tsx',
    '--json'
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.path, 'src/기능 모듈/Payment Panel.tsx');
  assert.equal(report.summary.total, 3);
  assert.equal(report.summary.applies, 2);
  assert.equal(report.contexts.some((item) => item.id === 'root' && item.applies && item.reason === 'alwaysApply'), true);
  assert.equal(report.contexts.some((item) => item.id === 'frontend' && item.applies && item.reason === 'glob'), true);
  assert.equal(report.contexts.some((item) => item.id === 'backend' && !item.applies), true);
  assert.equal(report.docMap.path, '.ai-agent-playbook/memory/maps/doc-map.md');
  assert.deepEqual(await listRelativeFiles(target), before);

  const listed = capture(target);
  assert.equal(await runCli(['context', 'list', '.', '--json'], listed), 0);
  const listReport = JSON.parse(listed.out());
  assert.equal(listReport.schemaVersion, '1');
  assert.equal(listReport.ok, true);
  assert.equal(listReport.summary.total, 3);
  assert.equal(listReport.contexts.some((item) => item.id === 'frontend' && item.priority === 'high'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('context init previews and creates context root and doc-map templates', async () => {
  const target = await tempRepo('context init-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['context', 'init', '.', '--dry-run', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.operations.some((operation) => operation.path === '.ai-agent-playbook/memory/context/root.md'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['context', 'init', '.', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  assert.equal(appliedReport.applied, true);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'context', 'root.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'context', '_registry.json')), true);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'maps', 'doc-map.md')), true);
  await cleanup(target);
});

test('run commands create append-only evidence ledger and summarize without unsafe paths', async () => {
  const target = await tempRepo('run ledger-공백-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['run', 'start', '.', '--title', 'Auth Flow', '--dry-run', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.runId, 'auth-flow');
  assert.deepEqual(await listRelativeFiles(target), before);

  const started = capture(target);
  assert.equal(await runCli(['run', 'start', '.', '--title', 'Auth Flow', '--json'], started), 0);
  const startedReport = JSON.parse(started.out());
  assert.equal(startedReport.applied, true);
  assert.equal(startedReport.runId, 'auth-flow');
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'workflows', 'runs', 'auth-flow', 'ledger.jsonl')), true);

  const recorded = capture(target);
  assert.equal(await runCli([
    'run',
    'record',
    '.',
    '--run-id',
    'auth-flow',
    '--type',
    'evidence',
    '--message',
    'Auth flow test passed',
    '--status',
    'pass',
    '--evidence',
    '.ai-agent-playbook/workflows/runs/auth-flow/evidence/auth.txt',
    '--json'
  ], recorded), 0);
  const ledger = await readFile(path.join(target, '.ai-agent-playbook', 'workflows', 'runs', 'auth-flow', 'ledger.jsonl'), 'utf8');
  const events = ledger.trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(events.some((event) => event.type === 'evidence' && event.status === 'pass'), true);

  const criterion = capture(target);
  assert.equal(await runCli([
    'run',
    'record',
    '.',
    '--run-id',
    'auth-flow',
    '--type',
    'criterion',
    '--message',
    'Auth criterion passed',
    '--status',
    'pass',
    '--json'
  ], criterion), 0);

  const rejected = capture(target);
  assert.equal(await runCli([
    'run',
    'record',
    '.',
    '--run-id',
    'auth-flow',
    '--type',
    'note',
    '--message',
    'C:\\Users\\home\\secret.txt',
    '--json'
  ], rejected), 1);
  const rejectedReport = JSON.parse(rejected.out());
  assert.equal(rejectedReport.conflicts.some((conflict) => conflict.id === 'run.record.unsafe-message'), true);

  const status = capture(target);
  assert.equal(await runCli(['run', 'status', '.', '--run-id', 'auth-flow', '--json'], status), 0);
  const statusReport = JSON.parse(status.out());
  assert.equal(statusReport.summary.events, 3);
  assert.equal(statusReport.summary.criteria, 1);
  assert.equal(statusReport.summary.openCriteria, 0);
  assert.equal(statusReport.summary.evidence, 1);
  assert.equal(statusReport.summary.cleanup, 0);
  assert.equal(statusReport.criteria.some((item) => item.source === 'ledger' && item.message === 'Auth criterion passed'), true);

  const summarizePreview = capture(target);
  const summaryBefore = await readFile(path.join(target, '.ai-agent-playbook', 'workflows', 'runs', 'auth-flow', 'summary.md'), 'utf8');
  assert.equal(await runCli(['run', 'summarize', '.', '--run-id', 'auth-flow', '--dry-run', '--json'], summarizePreview), 0);
  assert.equal(await readFile(path.join(target, '.ai-agent-playbook', 'workflows', 'runs', 'auth-flow', 'summary.md'), 'utf8'), summaryBefore);

  const summarized = capture(target);
  assert.equal(await runCli(['run', 'summarize', '.', '--run-id', 'auth-flow', '--json'], summarized), 0);
  assert.match(await readFile(path.join(target, '.ai-agent-playbook', 'workflows', 'runs', 'auth-flow', 'summary.md'), 'utf8'), /Auth flow test passed/);
  assert.match(await readFile(path.join(target, '.ai-agent-playbook', 'workflows', 'runs', 'auth-flow', 'summary.md'), 'utf8'), /Auth criterion passed/);
  await cleanup(target);
});

test('contracts list and check report active pending stale and missing appliesTo without writing files', async () => {
  const target = await tempRepo('contracts-공백-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active'), { recursive: true });
  await mkdir(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'pending'), { recursive: true });
  await mkdir(path.join(target, 'src', 'payments'), { recursive: true });
  await writeFile(path.join(target, 'src', 'payments', 'cancel.ts'), 'export function cancelPayment() {}\n');
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active', 'payment-cancel.md'), [
    '---',
    'id: payment-cancel',
    'status: active',
    'appliesTo:',
    '  - src/payments/cancel.ts',
    '  - src/payments/missing.ts',
    'risk: high',
    'freshness: 2026-01-01',
    '---',
    '# Payment Cancel Contract',
    '',
    '## Purpose',
    'Settlement-safe cancellation.',
    '',
    '## Required evidence',
    ''
  ].join('\n'));
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active', 'payment-glob.md'), [
    '---',
    'id: payment-glob',
    'status: active',
    'appliesTo:',
    '  - src/payments/**/*.ts',
    'risk: medium',
    'freshness: 2026-06-14',
    '---',
    '# Payment Glob Contract',
    '',
    '## Required evidence',
    '',
    '- Run payment contract tests.'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'pending', 'payment-refund.md'), [
    '---',
    'id: payment-refund',
    'status: pending',
    'appliesTo: ["src/payments/cancel.ts"]',
    '---',
    '# Payment Refund Contract'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const listed = capture(target);
  assert.equal(await runCli(['contracts', 'list', '.', '--json'], listed), 0);
  const listReport = JSON.parse(listed.out());
  assert.equal(listReport.summary.active, 2);
  assert.equal(listReport.summary.pending, 1);

  const checked = capture(target);
  assert.equal(await runCli(['contracts', 'check', '.', '--path', 'src/payments/cancel.ts', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.matches, 3);
  assert.equal(report.contracts.some((contract) => contract.id === 'payment-cancel' && contract.status === 'active'), true);
  assert.equal(report.contracts.some((contract) => contract.id === 'payment-glob' && contract.status === 'active'), true);
  assert.equal(report.warnings.filter((warning) => warning.id === 'contracts.applies-to-missing').length, 1);
  assert.equal(report.warnings.some((warning) => warning.id === 'contracts.stale'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'contracts.evidence-missing'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'contracts.pending-match'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('contracts snapshot previews writes hashes and check reports freshness drift', async () => {
  const target = await tempRepo('contracts snapshot-공백-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active'), { recursive: true });
  await mkdir(path.join(target, 'src', 'payments'), { recursive: true });
  await mkdir(path.join(target, 'test', 'payments'), { recursive: true });
  await writeFile(path.join(target, 'src', 'payments', 'cancel.ts'), 'export function cancelPayment() { return "ok"; }\n');
  await writeFile(path.join(target, 'test', 'payments', 'cancel.test.ts'), 'test("cancel", () => {});\n');
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active', 'payment-cancel.md'), [
    '---',
    'id: payment-cancel',
    'status: active',
    'appliesTo:',
    '  - src/payments/cancel.ts',
    'freshness: 2026-06-14',
    '---',
    '# Payment Cancel Contract',
    '',
    '## Required evidence',
    '',
    '- test/payments/cancel.test.ts'
  ].join('\n'));
  const beforePreview = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['contracts', 'snapshot', '.', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.schemaVersion, '1');
  assert.equal(previewReport.ok, true);
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.snapshotPath, '.ai-agent-playbook/memory/contracts/.hashes.json');
  assert.equal(previewReport.summary.entries >= 3, true);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', '.hashes.json')), false);
  assert.deepEqual(await listRelativeFiles(target), beforePreview);

  const applied = capture(target);
  assert.equal(await runCli(['contracts', 'snapshot', '.', '--apply', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  assert.equal(appliedReport.applied, true);
  assert.equal(appliedReport.operations.some((operation) => operation.path === '.ai-agent-playbook/memory/contracts/.hashes.json'), true);
  const snapshot = JSON.parse(await readFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', '.hashes.json'), 'utf8'));
  assert.equal(snapshot.schemaVersion, '1');
  assert.equal(snapshot.entries.every((entry) => !path.isAbsolute(entry.path)), true);
  assert.equal(snapshot.entries.some((entry) => entry.path === 'src/payments/cancel.ts'), true);
  assert.equal(snapshot.entries.some((entry) => entry.path === 'test/payments/cancel.test.ts'), true);

  await writeFile(path.join(target, 'src', 'payments', 'cancel.ts'), 'export function cancelPayment() { return "changed"; }\n');
  await rm(path.join(target, 'test', 'payments', 'cancel.test.ts'));
  const beforeCheck = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['contracts', 'check', '.', '--path', 'src/payments/cancel.ts', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.snapshot.path, '.ai-agent-playbook/memory/contracts/.hashes.json');
  assert.equal(report.warnings.some((warning) => warning.id === 'contracts.snapshot.hash-mismatch' && warning.paths.includes('src/payments/cancel.ts')), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'contracts.snapshot.evidence-missing' && warning.paths.includes('test/payments/cancel.test.ts')), true);
  assert.deepEqual(await listRelativeFiles(target), beforeCheck);
  await cleanup(target);
});

test('contracts snapshot can limit to one contract and stays preview-first', async () => {
  const target = await tempRepo('contracts snapshot one-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active'), { recursive: true });
  await mkdir(path.join(target, 'src'), { recursive: true });
  await writeFile(path.join(target, 'src', 'a.ts'), 'export const a = 1;\n');
  await writeFile(path.join(target, 'src', 'b.ts'), 'export const b = 1;\n');
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active', 'a.md'), [
    '---',
    'id: contract-a',
    'status: active',
    'appliesTo: ["src/a.ts"]',
    '---',
    '# Contract A',
    '',
    '## Required evidence',
    '',
    '- src/a.ts'
  ].join('\n'));
  await writeFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active', 'b.md'), [
    '---',
    'id: contract-b',
    'status: active',
    'appliesTo: ["src/b.ts"]',
    '---',
    '# Contract B',
    '',
    '## Required evidence',
    '',
    '- src/b.ts'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const applied = capture(target);
  assert.equal(await runCli(['contracts', 'snapshot', '.', '--contract', 'contract-a', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.summary.contracts, 1);
  const snapshot = JSON.parse(await readFile(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', '.hashes.json'), 'utf8'));
  assert.equal(snapshot.contracts.includes('contract-a'), true);
  assert.equal(snapshot.contracts.includes('contract-b'), false);
  assert.equal(snapshot.entries.some((entry) => entry.path === 'src/a.ts'), true);
  assert.equal(snapshot.entries.some((entry) => entry.path === 'src/b.ts'), false);
  assert.equal((await listRelativeFiles(target)).filter((file) => !before.includes(file)).length, 1);
  await cleanup(target);
});

test('contracts init previews and creates contract folders without overwriting', async () => {
  const target = await tempRepo('contracts init-한글-');
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['contracts', 'init', '.', '--dry-run', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['contracts', 'init', '.', '--json'], applied), 0);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'README.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'active')), true);
  assert.equal(existsSync(path.join(target, '.ai-agent-playbook', 'memory', 'contracts', 'pending')), true);
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

async function tempRepo(prefix = '.ai-agent-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function listRelativeFiles(root) {
  const files = [];
  await walk(root, root, files);
  files.sort();
  return files;
}

async function walk(root, current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(root, fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath.slice(root.length + 1).split(path.sep).join('/'));
    }
  }
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}
