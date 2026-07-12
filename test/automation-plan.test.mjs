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
  assert.equal(manifest.coordination.issueMode, 'delivery-group');
  assert.equal(manifest.coordination.groups.length, 2);
  assert.deepEqual(manifest.coordination.groups.flatMap((group) => group.taskIds), manifest.tasks.map((task) => task.id));

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
  assert.equal(manifest.coordination.program.title, 'Forge 자동화 도입');

  await rm(target, { recursive: true, force: true });
});

test('automation plan validation rejects duplicate ids cycles and unsafe verification argv', () => {
  const manifest = validManifest();
  manifest.tasks.push({ ...manifest.tasks[0] });
  manifest.tasks[0].dependsOn = ['task-002'];
  manifest.tasks[1].dependsOn = ['task-001'];
  manifest.tasks[1].verificationCommands = [{ id: 'verify-2', argv: ['npm test && echo injected'], evidencePaths: ['../../secret.png'] }];
  manifest.tasks[1].paths = ['../../outside'];

  const checked = validateAutomationPlan(manifest);

  assert.equal(checked.ok, false);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.task.duplicate-id'), true);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.task.cycle'), true);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.verification.unsafe-argv'), true);
  assert.equal(checked.conflicts.some((conflict) => conflict.id === 'plan.verification.unsafe-evidence-path'), true);
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

test('automation readiness remains compatible when optional forge coordination is absent', () => {
  const checked = validateAutomationPlan(validManifest());

  assert.equal(checked.ready, true);
  assert.equal(checked.automationReady, true);
  assert.equal(checked.forgeReady, false);
  assert.equal(checked.presentationFindings.some((finding) => finding.id === 'plan.coordination.missing'), true);
});

test('delivery-group coordination validates a complete human-facing issue contract', () => {
  const manifest = validManifest();
  manifest.coordination = validCoordination();

  const checked = validateAutomationPlan(manifest);

  assert.equal(checked.ok, true);
  assert.equal(checked.automationReady, true);
  assert.equal(checked.forgeReady, true);
  assert.deepEqual(checked.presentationFindings, []);
});

test('delivery-group coordination defaults to six child issues and requires complete unique task mapping', () => {
  const manifest = validManifest();
  manifest.tasks = Array.from({ length: 7 }, (_, index) => ({
    ...manifest.tasks[0],
    id: `task-${String(index + 1).padStart(3, '0')}`,
    acceptanceCriteria: [{ id: `criterion-${String(index + 1).padStart(3, '0')}`, text: 'Complete.' }],
    verificationCommands: [{ id: `verify-${String(index + 1).padStart(3, '0')}`, argv: ['npm', 'test'] }]
  }));
  manifest.coordination = {
    ...validCoordination(),
    groups: manifest.tasks.map((task, index) => ({
      id: `group-${index + 1}`,
      title: `Group ${index + 1}`,
      summary: 'Reviewable outcome.',
      taskIds: index === 1 ? [manifest.tasks[0].id] : [task.id],
      rollback: 'Revert the delivery branch.'
    }))
  };

  const checked = validateAutomationPlan(manifest);

  assert.equal(checked.automationReady, true);
  assert.equal(checked.forgeReady, false);
  assert.equal(checked.presentationFindings.some((finding) => finding.id === 'plan.coordination.groups-limit'), true);
  assert.equal(checked.presentationFindings.some((finding) => finding.id === 'plan.coordination.task-duplicate'), true);
  assert.equal(checked.presentationFindings.some((finding) => finding.id === 'plan.coordination.task-missing'), true);
});

test('coordination enums bounds and reviewable content are validated without breaking local automation', () => {
  const manifest = validManifest();
  manifest.coordination = {
    issueMode: 'everything',
    projectMode: 'required',
    titleStyle: 'headline',
    maxChildIssues: 0,
    program: {
      title: '',
      summary: '',
      scope: [],
      nonGoals: [],
      successCriteria: []
    },
    groups: [{ id: '../unsafe', title: '', summary: '', taskIds: [], rollback: '' }]
  };

  const checked = validateAutomationPlan(manifest);

  assert.equal(checked.ok, true);
  assert.equal(checked.automationReady, true);
  assert.equal(checked.forgeReady, false);
  for (const id of [
    'plan.coordination.issue-mode',
    'plan.coordination.project-mode',
    'plan.coordination.title-style',
    'plan.coordination.max-child-issues',
    'plan.coordination.program-incomplete',
    'plan.coordination.group-invalid'
  ]) {
    assert.equal(checked.presentationFindings.some((finding) => finding.id === id), true, id);
  }
});

test('optional presentation reconcile artifacts require reviewable issue and draft PR contracts', () => {
  const manifest = validManifest();
  manifest.coordination = validCoordination();
  manifest.coordination.reconcile = {
    supportingIssues: [{
      id: 'automation-baseline',
      number: 15,
      title: 'AAPB 자동화 기준선 구축',
      summary: '시연 자동화의 실제 완료 범위와 남은 gate를 정리합니다.',
      completedScope: ['Windows CI와 승인 계획 준비'],
      remainingGates: ['기준선 PR merge 승인']
    }],
    pullRequests: [{
      number: 16,
      title: 'feat(writer): 로컬 writer MVP 기준선',
      summary: '로컬 writer MVP 기준선을 검토합니다.',
      actualChanges: ['로컬 프로젝트와 원고 편집 흐름'],
      verification: ['pnpm test: writer 테스트 파일 0개'],
      evidenceGaps: ['실제 화면 이미지 미첨부'],
      risks: ['Electron 구현 미포함'],
      rollback: ['draft PR을 닫고 branch를 보존'],
      remainingWork: ['네 delivery group의 Electron 구현']
    }]
  };

  assert.equal(validateAutomationPlan(manifest).forgeReady, true);

  manifest.coordination.reconcile.supportingIssues[0].title = '기준선을 구축한다';
  manifest.coordination.reconcile.pullRequests[0].evidenceGaps = [];
  const rejected = validateAutomationPlan(manifest);
  assert.equal(rejected.forgeReady, false);
  assert.equal(rejected.presentationFindings.some((finding) => finding.id === 'plan.coordination.title-sentence'), true);
  assert.equal(rejected.presentationFindings.some((finding) => finding.id === 'plan.coordination.reconcile-pr-invalid'), true);
});

test('parent-only and task issue modes do not require delivery groups', () => {
  for (const issueMode of ['parent-only', 'task']) {
    const manifest = validManifest();
    manifest.coordination = { ...validCoordination(), issueMode, groups: [] };

    const checked = validateAutomationPlan(manifest);

    assert.equal(checked.forgeReady, true, issueMode);
  }
});

test('Korean noun-phrase public titles reject declarative sentence endings', () => {
  const manifest = validManifest();
  manifest.coordination = validCoordination();
  manifest.coordination.program.title = '제품 기반을 구축한다';
  manifest.coordination.groups[0].title = '상태 엔진이 완성된다';
  manifest.coordination.groups[1].title = '검증 기준이다';

  const checked = validateAutomationPlan(manifest);

  assert.equal(checked.automationReady, true);
  assert.equal(checked.forgeReady, false);
  assert.equal(
    checked.presentationFindings.filter((finding) => finding.id === 'plan.coordination.title-sentence').length,
    3
  );
});

test('forge presentation rejects placeholder-length program and group content', () => {
  const manifest = validManifest();
  manifest.coordination = validCoordination();
  manifest.coordination.program.summary = 'x';
  manifest.coordination.program.scope = ['x'];
  manifest.coordination.groups[0].summary = 'x';
  manifest.coordination.groups[0].rollback = 'x';
  const result = validateAutomationPlan(manifest);
  assert.equal(result.forgeReady, false);
  assert.ok(result.presentationFindings.some((finding) => finding.id === 'plan.coordination.program-incomplete'));
  assert.ok(result.presentationFindings.some((finding) => finding.id === 'plan.coordination.group-invalid'));
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

function validCoordination() {
  return {
    issueMode: 'delivery-group',
    projectMode: 'preferred',
    titleStyle: 'noun-phrase',
    maxChildIssues: 6,
    program: {
      title: 'Forge 협업 자동화',
      summary: '사람이 검토할 수 있는 협업 구조를 제공합니다.',
      scope: ['실행 task와 원격 이슈 분리'],
      nonGoals: ['자동 merge'],
      successCriteria: ['원격 이슈가 delivery group 단위로 생성됨']
    },
    groups: [
      {
        id: 'state-engine',
        title: '상태 엔진 구현',
        summary: '재개 가능한 상태 엔진을 제공합니다.',
        taskIds: ['task-001'],
        rollback: '상태 엔진 변경을 되돌립니다.'
      },
      {
        id: 'delivery',
        title: '전달 검증',
        summary: '전달 전 검증을 완료합니다.',
        taskIds: ['task-002'],
        rollback: '전달 변경을 되돌립니다.'
      }
    ]
  };
}
