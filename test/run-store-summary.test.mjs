import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunStore } from '../src/automation/run-store.mjs';

test('derived summary and handoff follow the append-only ledger state', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-summary-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createRunStore(path.join(root, 'summary-run'));
  await store.initialize({ plan: plan(), runId: 'summary-run' });
  for (const event of [
    { type: 'run.started' },
    { type: 'task.claimed', taskId: 'summary-task' },
    { type: 'task.started', taskId: 'summary-task' },
    { type: 'task.verifying', taskId: 'summary-task' },
    { type: 'criterion.passed', taskId: 'summary-task', criterionId: 'summary-works' },
    {
      type: 'task.delivery-recorded',
      taskId: 'summary-task',
      delivery: {
        status: 'succeeded',
        attemptNumber: 1,
        workspace: path.join(root, 'managed-checkout'),
        branch: 'aapb/summary-delivery',
        baseBranch: 'main',
        remoteUrl: null,
        skipped: false,
        reason: null,
        operations: ['commit']
      }
    },
    { type: 'task.review-requested', taskId: 'summary-task' },
    { type: 'task.completed', taskId: 'summary-task' }
  ]) await store.appendEvent(event);
  const summary = await readFile(path.join(root, 'summary-run', 'summary.md'), 'utf8');
  const handoff = await readFile(path.join(root, 'summary-run', 'handoff.md'), 'utf8');
  assert.match(summary, /Status: completed/);
  assert.match(summary, /Tasks: 1\/1/);
  assert.match(summary, /Criteria: 1\/1/);
  assert.match(handoff, /- Completed\./);
  assert.match(handoff, /aapb\/summary-delivery/);
  assert.match(handoff, /managed-checkout/);
});

test('remote synchronization state is controller-owned and fenced', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-remote-state-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createRunStore(path.join(root, 'remote-run'));
  await store.initialize({ plan: plan(), runId: 'remote-run' });
  const acquired = await store.acquireLease({ ownerId: 'controller-a' });
  const credentials = { ownerId: 'controller-a', fencingToken: acquired.lease.fencingToken };
  const updated = await store.updateRemote({
    provider: 'github',
    tasks: { 'summary-task': { issueNumber: 42, updatedAt: '2026-07-11T00:00:00Z' } }
  }, credentials);
  assert.equal(updated.provider, 'github');
  assert.equal((await store.readRemote()).tasks['summary-task'].issueNumber, 42);
  await assert.rejects(() => store.updateRemote({ provider: 'gitea' }, { ownerId: 'controller-b', fencingToken: 999 }), /stale fencing/i);
  await store.releaseLease(credentials);
});

function plan() {
  return {
    schemaVersion: '2',
    kind: 'workflow.plan.v2',
    planId: 'summary-plan',
    title: 'Summary plan',
    approval: { status: 'approved', approvedAt: '2026-07-11T00:00:00.000Z' },
    tasks: [{
      id: 'summary-task',
      title: 'Summary task',
      dependsOn: [],
      priority: 50,
      risk: 'low',
      acceptanceCriteria: [{ id: 'summary-works', text: 'Summary works.' }],
      verificationCommands: [{ id: 'summary-verify', argv: ['node', '--version'] }],
      deliveryGroup: 'summary',
      remoteEligible: false,
      paths: []
    }]
  };
}
