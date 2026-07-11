import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAutomationPlan,
  validateAutomationPlan
} from '../src/automation/plan-manifest.mjs';

test('automation plan writes a human document and workflow.plan.v2 sidecar', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-plan-v2-'));
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });

  const result = await createAutomationPlan({
    target,
    title: 'Forge 자동화 도입',
    date: '2026-07-11'
  });

  assert.equal(result.ok, true);
  assert.equal(result.applied, true);
  assert.equal(result.files.length, 2);
  assert.equal(existsSync(result.markdownFile), true);
  assert.equal(existsSync(result.manifestFile), true);
  const markdown = await readFile(result.markdownFile, 'utf8');
  const manifest = JSON.parse(await readFile(result.manifestFile, 'utf8'));
  assert.match(markdown, /workflow\.plan\.v2/);
  assert.equal(manifest.schemaVersion, '2');
  assert.equal(manifest.kind, 'workflow.plan.v2');
  assert.equal(manifest.approval.status, 'draft');
  assert.equal(manifest.tasks.length, 2);
  assert.deepEqual(manifest.tasks[1].dependsOn, [manifest.tasks[0].id]);
  assert.equal(manifest.tasks.every((task) => Number.isInteger(task.priority)), true);
  assert.equal(manifest.tasks.every((task) => typeof task.remoteEligible === 'boolean'), true);

  const checked = validateAutomationPlan(manifest);
  assert.equal(checked.ok, true);
  assert.equal(checked.ready, false);
  assert.equal(checked.warnings.some((warning) => warning.id === 'plan.not-approved'), true);

  await rm(target, { recursive: true, force: true });
});

test('automation plan localizes the human draft while keeping machine identifiers stable', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-plan-language-'));
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });

  const result = await createAutomationPlan({
    target,
    title: 'Forge 자동화 도입',
    date: '2026-07-11',
    language: 'ko'
  });

  const markdown = await readFile(result.markdownFile, 'utf8');
  const manifest = JSON.parse(await readFile(result.manifestFile, 'utf8'));
  assert.match(markdown, /## 목표/);
  assert.match(markdown, /상태: 초안/);
  assert.equal(manifest.tasks[0].title, '첫 구현 단위');
  assert.equal(manifest.tasks[1].title, '검증 및 정리');
  assert.equal(manifest.kind, 'workflow.plan.v2');
  assert.equal(manifest.approval.status, 'draft');

  await rm(target, { recursive: true, force: true });
});

test('automation plan validation rejects duplicate ids cycles and unsafe verification argv', () => {
  const manifest = validManifest();
  manifest.tasks.push({ ...manifest.tasks[0] });
  manifest.tasks[0].dependsOn = ['task-002'];
  manifest.tasks[1].dependsOn = ['task-001'];
  manifest.tasks[1].verificationCommands = [{ id: 'verify-2', argv: ['npm test && echo injected'] }];
  manifest.tasks[1].paths = ['../../outside'];

  const checked = validateAutomationPlan(manifest);

  assert.equal(checked.ok, false);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.task.duplicate-id'), true);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.task.cycle'), true);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.verification.unsafe-argv'), true);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.task.path-unsafe'), true);
});

test('automation plan file validation reports readiness only for an approved complete graph', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-plan-check-'));
  const file = path.join(target, 'approved.plan.json');
  await writeFile(file, `${JSON.stringify(validManifest(), null, 2)}\n`);

  const checked = await validateAutomationPlan(file);

  assert.equal(checked.ok, true);
  assert.equal(checked.ready, true);
  assert.equal(checked.summary.tasks, 2);
  assert.equal(checked.summary.criteria, 2);
  assert.equal(checked.summary.verificationCommands, 2);
  await rm(target, { recursive: true, force: true });
});

function validManifest() {
  return {
    schemaVersion: '2',
    kind: 'workflow.plan.v2',
    planId: 'forge-automation',
    title: 'Forge automation',
    language: 'ko',
    approval: { status: 'approved', approvedAt: '2026-07-11T00:00:00.000Z' },
    tasks: [
      {
        id: 'task-001',
        title: 'Implement state engine',
        dependsOn: [],
        priority: 100,
        risk: 'medium',
        acceptanceCriteria: [{ id: 'criterion-001', text: 'State can resume after a crash.' }],
        verificationCommands: [{ id: 'verify-001', argv: ['npm', 'test'] }],
        deliveryGroup: 'state-engine',
        remoteEligible: true
      },
      {
        id: 'task-002',
        title: 'Verify delivery',
        dependsOn: ['task-001'],
        priority: 50,
        risk: 'low',
        acceptanceCriteria: [{ id: 'criterion-002', text: 'All checks pass.' }],
        verificationCommands: [{ id: 'verify-002', argv: ['npm', 'run', 'check'] }],
        deliveryGroup: 'delivery',
        remoteEligible: false
      }
    ]
  };
}
