import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { automationStatus, startAutomation, tickAutomation } from '../src/automation/controller.mjs';
import { createRunStore } from '../src/automation/run-store.mjs';
import { recordRun, runStatus, summarizeRun } from '../src/harness/runs-ledger.mjs';

test('automation status reads a schema v1 run ledger without changing its files', async (t) => {
  const target = await fixtureTarget(t);
  const runRoot = await createLegacyLedgerRun(target, 'legacy-ledger');
  const before = await fileSnapshot(runRoot);

  const status = await automationStatus({ target, runId: 'legacy-ledger' });

  assert.equal(status.ok, true);
  assert.equal(status.state.runStatus, 'running');
  assert.equal(status.state.compatibility.source, 'run-v1');
  assert.equal(status.state.compatibility.readOnly, true);
  assert.deepEqual(status.state.progress.criteria, { passed: 1, total: 2, percent: 50 });
  assert.equal(status.state.legacy.events, 2);
  assert.deepEqual(await fileSnapshot(runRoot), before);
});

test('automation status reads a schema v1 workflow run manifest and markdown criteria read-only', async (t) => {
  const target = await fixtureTarget(t);
  const runRoot = await createLegacyWorkflowRun(target, 'legacy-workflow');
  const before = await fileSnapshot(runRoot);

  const status = await automationStatus({ target, runId: 'legacy-workflow' });

  assert.equal(status.ok, true);
  assert.equal(status.state.runStatus, 'running');
  assert.equal(status.state.compatibility.source, 'workflow-run-v1');
  assert.equal(status.state.legacy.recipeId, 'deployment-release');
  assert.deepEqual(status.state.progress.criteria, { passed: 1, total: 2, percent: 50 });
  assert.deepEqual(await fileSnapshot(runRoot), before);
});

test('legacy runs reject automation mutation and cannot be overwritten by start or tick', async (t) => {
  const target = await fixtureTarget(t);
  const runRoot = await createLegacyLedgerRun(target, 'legacy-protected');
  const before = await fileSnapshot(runRoot);
  const store = createRunStore(runRoot);

  await assert.rejects(() => store.acquireLease({ ownerId: 'controller-test' }), /legacy run is read-only/i);
  const started = await startAutomation({ target, runId: 'legacy-protected', plan: approvedPlan() });
  assert.equal(started.ok, false);
  assert.equal(started.conflicts.some((item) => item.id === 'automation.run.legacy-read-only'), true);
  const ticked = await tickAutomation({ target, runId: 'legacy-protected' });
  assert.equal(ticked.skipped, true);
  assert.equal(ticked.reason, 'legacy-read-only');

  assert.equal(existsSync(path.join(runRoot, 'state.json')), false);
  assert.equal(existsSync(path.join(runRoot, 'tasks.json')), false);
  assert.equal(existsSync(path.join(runRoot, 'lease.json')), false);
  assert.deepEqual(await fileSnapshot(runRoot), before);
});

test('legacy run commands read v2 through the common store and cannot corrupt its ledger or summary', async (t) => {
  const target = await fixtureTarget(t);
  const runId = 'v2-command-guard';
  const started = await startAutomation({ target, runId, plan: approvedPlan(), noRemote: true });
  assert.equal(started.ok, true);
  const runRoot = path.join(target, '.ai-agent-playbook', 'workflows', 'runs', runId);
  const ledgerPath = path.join(runRoot, 'ledger.jsonl');
  const summaryPath = path.join(runRoot, 'summary.md');
  const ledgerBefore = await readFile(ledgerPath, 'utf8');
  const summaryBefore = await readFile(summaryPath, 'utf8');

  const recorded = await recordRun({
    target,
    runId,
    type: 'note',
    status: 'info',
    message: 'This legacy event must not enter a v2 ledger.'
  });
  assert.equal(recorded.ok, false);
  assert.equal(recorded.conflicts.some((item) => item.id === 'run.record.automation-v2'), true);
  assert.equal(await readFile(ledgerPath, 'utf8'), ledgerBefore);

  const status = await runStatus({ target, runId });
  assert.equal(status.ok, true);
  assert.equal(status.schemaVersion, '2');
  assert.equal(status.automation.runStatus, 'planned');
  assert.equal(status.summary.events, 0);

  const summarized = await summarizeRun({ target, runId, force: true });
  assert.equal(summarized.ok, false);
  assert.equal(summarized.conflicts.some((item) => item.id === 'run.summarize.automation-v2'), true);
  assert.equal(await readFile(summaryPath, 'utf8'), summaryBefore);
});

async function fixtureTarget(t) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-legacy-compat-'));
  await mkdir(path.join(target, '.ai-agent-playbook', 'workflows', 'runs'), { recursive: true });
  t.after(() => rm(target, { recursive: true, force: true }));
  return target;
}

async function createLegacyLedgerRun(target, runId) {
  const runRoot = path.join(target, '.ai-agent-playbook', 'workflows', 'runs', runId);
  await mkdir(path.join(runRoot, 'evidence'), { recursive: true });
  await writeFile(path.join(runRoot, 'brief.md'), `# Legacy run\n\nStarted: 2026-07-10T00:00:00.000Z\n`);
  await writeFile(path.join(runRoot, 'criteria.json'), `${JSON.stringify({
    schemaVersion: '1',
    criteria: [
      { id: 'legacy-pass', status: 'pass', message: 'Legacy check passed.' },
      { id: 'legacy-open', status: 'info', message: 'Legacy check remains open.' }
    ]
  }, null, 2)}\n`);
  await writeFile(path.join(runRoot, 'ledger.jsonl'), [
    JSON.stringify({ schemaVersion: '1', timeUtc: '2026-07-10T00:00:00.000Z', type: 'note', status: 'info', message: 'Run started.' }),
    JSON.stringify({ schemaVersion: '1', timeUtc: '2026-07-10T00:01:00.000Z', type: 'evidence', status: 'pass', message: 'Evidence captured.' }),
    ''
  ].join('\n'));
  await writeFile(path.join(runRoot, 'summary.md'), '# Legacy Run Summary\n\nStatus: active\n');
  return runRoot;
}

async function createLegacyWorkflowRun(target, runId) {
  const runRoot = path.join(target, '.ai-agent-playbook', 'workflows', 'runs', runId);
  await mkdir(runRoot, { recursive: true });
  await writeFile(path.join(runRoot, 'manifest.json'), `${JSON.stringify({
    schemaVersion: '1',
    kind: 'workflow.run',
    runId,
    status: 'active',
    startedAt: '2026-07-10T00:00:00.000Z',
    recipe: { id: 'deployment-release', title: 'Deployment Release' },
    manifest: { verification: ['lint', 'test'] }
  }, null, 2)}\n`);
  await writeFile(path.join(runRoot, 'criteria.md'), [
    '# Deployment Release Criteria',
    '',
    '## Verification',
    '- [x] lint',
    '- [ ] test',
    '',
    '## Stop Conditions',
    '- [ ] unsafe deployment'
  ].join('\n'));
  await writeFile(path.join(runRoot, 'evidence.md'), '# Evidence\n\n- Existing evidence.\n');
  await writeFile(path.join(runRoot, 'handoff.md'), '# Handoff\n\n- Pending.\n');
  return runRoot;
}

async function fileSnapshot(root) {
  const entries = [];
  await walk(root, root, entries);
  entries.sort((left, right) => left.path.localeCompare(right.path));
  return entries;
}

async function walk(root, current, entries) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(root, fullPath, entries);
    } else if (entry.isFile()) {
      entries.push({
        path: path.relative(root, fullPath).split(path.sep).join('/'),
        content: await readFile(fullPath, 'utf8'),
        mtimeMs: (await stat(fullPath)).mtimeMs
      });
    }
  }
}

function approvedPlan() {
  return {
    schemaVersion: '2',
    kind: 'workflow.plan.v2',
    planId: 'replacement-plan',
    title: 'Replacement plan',
    approval: { status: 'approved', approvedAt: '2026-07-11T00:00:00.000Z' },
    tasks: [{
      id: 'replacement-task',
      title: 'Replacement task',
      dependsOn: [],
      priority: 50,
      risk: 'low',
      acceptanceCriteria: [{ id: 'replacement-works', text: 'Replacement works.' }],
      verificationCommands: [{ id: 'replacement-verify', argv: ['node', '--version'] }],
      paths: [],
      deliveryGroup: 'replacement',
      remoteEligible: false
    }]
  };
}
