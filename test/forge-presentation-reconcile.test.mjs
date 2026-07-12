import assert from 'node:assert/strict';
import test from 'node:test';

import { applyForgePlan, planForgePresentationReconcile } from '../src/forge/index.mjs';

const repository = { owner: 'example', name: 'writer' };

test('presentation reconcile reuses one survivor per group and supersedes redundant task issues without deletion', () => {
  const plan = planForgePresentationReconcile({
    provider: 'github',
    planId: 'electron-overhaul',
    milestoneTitle: 'Electron 전환 및 제품 전면 개선',
    coordination: coordination(),
    tasks: tasks(),
    remoteIssues: remoteIssues()
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.mode.requiresAllowSupersede, true);
  assert.deepEqual(
    plan.operations.filter((operation) => operation.resource === 'issue' && operation.action === 'update' && operation.groupId && !operation.requiresApproval)
      .map((operation) => operation.payload.issueNumber),
    [2, 6, 8, 12]
  );
  assert.equal(plan.operations.filter((operation) => operation.resource === 'sub-issue' && operation.action === 'remove').length, 9);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'issue' && operation.payload.state === 'closed').length, 9);
  const closeIndex = plan.operations.findIndex((operation) => operation.id === 'group:desktop-foundation:supersede:3');
  const commentIndex = plan.operations.findIndex((operation) => operation.id === 'group:desktop-foundation:comment:3');
  const unlinkIndex = plan.operations.findIndex((operation) => operation.id === 'group:desktop-foundation:unlink:3');
  const projectRemovalIndex = plan.operations.findIndex((operation) => operation.id === 'group:desktop-foundation:project-item-remove:3');
  assert.equal(closeIndex < commentIndex && commentIndex < projectRemovalIndex && projectRemovalIndex < unlinkIndex, true);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'project-item' && operation.action === 'remove').length, 9);
  assert.equal(plan.operations.some((operation) => operation.action === 'delete'), false);
  assert.equal(plan.summary.groups, 4);
  assert.equal(plan.summary.superseded, 9);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'issue').every((operation) => operation.payload.preserveNonManagedLabels === true), true);
  const parent = plan.operations.find((operation) => operation.id === 'plan:electron-overhaul:issue');
  assert.match(parent.payload.body, /aapb:managed:start/);
  assert.match(parent.payload.body, /aapb:managed:end/);
});

test('forge apply requires an explicit supersede approval before any remote mutation', async () => {
  let requests = 0;
  const result = await applyForgePlan({
    apply: true,
    profile: 'deliver',
    provider: 'github',
    repository,
    transport: { async request() { requests += 1; return { status: 500, data: {} }; } },
    plan: {
      ok: true,
      mode: { requiresAllowSupersede: true },
      operations: [{
        id: 'group:desktop:supersede:old-task',
        action: 'update',
        resource: 'issue',
        requiresApproval: 'supersede',
        payload: { issueNumber: 3, state: 'closed', expectedUpdatedAt: '2026-07-11T00:00:00Z' }
      }]
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'forge.apply.supersede-approval-required'), true);
  assert.equal(requests, 0);
});

test('presentation reconcile is idempotent with closed legacy task issues still returned by state=all', () => {
  const issues = [
    remoteIssues()[0],
    ...coordination().groups.map((group, index) => ({
      id: 202 + index,
      number: [2, 6, 8, 12][index],
      title: group.title,
      body: `<!-- aapb:group:${group.id} -->\nReviewed body`,
      parentIssueNumbers: [1],
      state: 'open',
      updatedAt: `2026-07-12T00:0${index}:00Z`
    })),
    ...remoteIssues().slice(1).filter((issue) => ![2, 6, 8, 12].includes(issue.number)).map((issue) => ({
      ...issue,
      state: 'closed',
      parentIssueNumbers: undefined
    }))
  ];

  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', coordination: coordination(), tasks: tasks(), remoteIssues: issues
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.summary.superseded, 0);
  assert.deepEqual(plan.operations.filter((operation) => operation.groupId).map((operation) => operation.payload.issueNumber), [2, 6, 8, 12]);
  assert.equal(plan.operations.some((operation) => operation.resource === 'sub-issue'), false);
});

test('presentation reconcile closes an open unlinked issue recovered from a supersede marker without unlinking it again', () => {
  const reviewed = coordination();
  const issues = [
    remoteIssues()[0],
    ...reviewed.groups.map((group, index) => ({
      id: 202 + index,
      number: [2, 6, 8, 12][index],
      title: group.title,
      body: `<!-- aapb:group:${group.id} -->\nReviewed body`,
      parentIssueNumbers: [1],
      state: 'open',
      updatedAt: `2026-07-12T00:0${index}:00Z`
    })),
    {
      ...remoteIssues()[2],
      parentIssueNumbers: undefined,
      supersedeRecovery: {
        planId: 'electron-overhaul',
        groupId: 'desktop-foundation',
        marker: '<!-- aapb:superseded:electron-overhaul:desktop-foundation:3 -->'
      }
    }
  ];

  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', coordination: reviewed, tasks: tasks(), remoteIssues: issues
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.summary.superseded, 1);
  const projectRemovalIndex = plan.operations.findIndex((operation) => operation.id === 'group:desktop-foundation:project-item-remove:3');
  const closeIndex = plan.operations.findIndex((operation) => operation.id === 'group:desktop-foundation:supersede:3');
  assert.equal(projectRemovalIndex < closeIndex, true);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:supersede:3'), true);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:comment:3'), false);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:unlink:3'), false);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:project-item-remove:3'), true);
});

test('presentation reconcile finishes marker and unlink cleanup for a closed issue that is still attached to the parent', () => {
  const reviewed = coordination();
  const issues = [
    remoteIssues()[0],
    ...reviewed.groups.map((group, index) => ({
      id: 202 + index,
      number: [2, 6, 8, 12][index],
      title: group.title,
      body: `<!-- aapb:group:${group.id} -->\nReviewed body`,
      parentIssueNumbers: [1],
      state: 'open',
      updatedAt: `2026-07-12T00:0${index}:00Z`
    })),
    { ...remoteIssues()[2], state: 'closed' }
  ];

  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', coordination: reviewed, tasks: tasks(), remoteIssues: issues
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.summary.superseded, 1);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:supersede:3'), false);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:comment:3'), true);
  assert.equal(plan.operations.some((operation) => operation.id === 'group:desktop-foundation:unlink:3'), true);
});

test('presentation reconcile fails closed when managed task markers are duplicated', () => {
  const reviewed = coordination();
  const issues = [...remoteIssues(), { ...remoteIssues()[2], id: 999, number: 99, title: 'Duplicate marker' }];

  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', coordination: reviewed, tasks: tasks(), remoteIssues: issues
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.reconcile.task-marker-duplicate'), true);
  assert.equal(plan.operations.length, 0);
});

test('Gitea presentation reconcile requires an explicit plan ownership marker', () => {
  const base = {
    provider: 'gitea',
    planId: 'electron-overhaul',
    coordination: { ...coordination(), groups: [coordination().groups[0]] },
    tasks: tasks().slice(0, 4)
  };
  const parent = remoteIssues()[0];
  const unowned = { ...remoteIssues()[1], parentIssueNumbers: undefined };
  const rejected = planForgePresentationReconcile({ ...base, remoteIssues: [parent, unowned] });
  assert.equal(rejected.ok, false);

  const owned = { ...unowned, body: `${unowned.body}\n<!-- aapb:plan-owner:electron-overhaul -->` };
  const accepted = planForgePresentationReconcile({ ...base, remoteIssues: [parent, owned] });
  assert.equal(accepted.ok, true);
});

test('presentation reconcile previews milestone, Project views, supporting issue, draft PR, and every reviewable Project item', () => {
  const reviewed = coordination();
  reviewed.projectMode = 'preferred';
  reviewed.reconcile = {
    supportingIssues: [{
      id: 'automation-baseline', number: 15, title: 'AAPB 자동화 기준선 구축',
      summary: '시연 기준선의 실제 결과를 구분합니다.',
      completedScope: ['승인 계획과 Windows CI 준비'],
      remainingGates: ['draft PR merge 승인']
    }],
    pullRequests: [{
      number: 16, title: 'feat(writer): 로컬 writer MVP 기준선',
      summary: 'Electron 구현 전 로컬 writer MVP 기준선입니다.',
      actualChanges: ['프로젝트와 원고 편집 흐름'],
      verification: ['pnpm test: writer 테스트 파일 0개'],
      evidenceGaps: ['실제 화면 이미지 미첨부'],
      risks: ['98개 파일의 큰 검토 범위'],
      rollback: ['draft PR을 닫고 branch를 보존'],
      remainingWork: ['Electron 구현 미포함']
    }]
  };
  const issues = [...remoteIssues(), {
    id: 115, number: 15, title: 'AAPB 자동화 기준선을 구축한다',
    body: '<!-- aapb:task:lw-001 -->\n기존 기준선', state: 'open',
    updatedAt: '2026-07-11T14:31:55Z', parentIssueNumbers: [1]
  }];
  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', milestoneTitle: 'Electron 전환 및 제품 전면 개선',
    projectTitle: 'Electron 전환 및 제품 전면 개선', language: 'ko', coordination: reviewed,
    tasks: tasks(), remoteIssues: issues,
    remotePullRequests: [{
      number: 16, title: 'feat(writer): 기존 제목', body: '기존 PR 본문', draft: true,
      head: 'aapb/lw-001-automation-baseline', base: 'main', nodeId: 'PR_16',
      updatedAt: '2026-07-11T14:29:21Z'
    }]
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.operations.some((operation) => operation.resource === 'milestone'), true);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'view').length, 4);
  assert.equal(plan.operations.find((operation) => operation.id === 'view:전체').payload.role, 'all');
  assert.equal(plan.operations.some((operation) => operation.id === 'supporting:automation-baseline:issue'), true);
  assert.equal(plan.operations.some((operation) => operation.id === 'pull-request:16'), true);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'project-item' && operation.action === 'ensure').length, 7);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'project-item' && operation.action === 'remove').length, 9);
  assert.match(plan.operations.find((operation) => operation.id === 'pull-request:16').payload.body, /Electron 구현 미포함/);
  assert.deepEqual(plan.summary.artifacts, {
    issuesUpdated: 6,
    issuesClosed: 9,
    projects: 1,
    views: 4,
    labels: 1,
    milestones: 1,
    pullRequests: 1,
    projectItems: 7,
    projectItemsRemoved: 9
  });
});

test('preferred GitHub Projects capability blocks reconcile before remote writes and provides browser-auth remediation', async () => {
  const plan = planForgePresentationReconcile({
    provider: 'github',
    planId: 'electron-overhaul',
    milestoneTitle: 'Electron 전환 및 제품 전면 개선',
    coordination: { ...coordination(), projectMode: 'preferred' },
    tasks: tasks(),
    remoteIssues: remoteIssues(),
    capabilities: { issues: 'supported', milestones: 'supported', projects: 'unavailable', views: 'unavailable' }
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.operations.length, 0);
  assert.equal(plan.summary.operations, 0);
  assert.ok(plan.summary.plannedOperations > 0);
  assert.equal(plan.summary.artifacts.projects, 1);
  assert.equal(plan.summary.artifacts.views, 4);
  assert.equal(plan.summary.artifacts.projectItems, 5);
  const blocker = plan.conflicts.find((conflict) => conflict.id === 'forge.scope.projects-missing');
  assert.deepEqual(blocker.remediations.map((item) => item.argv), [
    ['gh', 'auth', 'refresh', '-s', 'project'],
    ['aapb', 'forge', 'status', '.']
  ]);

  let writes = 0;
  const result = await applyForgePlan({
    apply: true, profile: 'deliver', provider: 'github', repository,
    transport: { async request() { writes += 1; return { status: 500, data: {} }; } },
    plan
  });
  assert.equal(result.ok, false);
  assert.equal(writes, 0);
});

test('preferred GitHub Views capability also blocks every write unless fallback is explicit', () => {
  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', coordination: { ...coordination(), projectMode: 'preferred' },
    tasks: tasks(), remoteIssues: remoteIssues(),
    capabilities: { issues: 'supported', milestones: 'supported', projects: 'supported', views: 'unavailable' }
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.operations.length, 0);
  assert.deepEqual(plan.conflicts.find((conflict) => conflict.id === 'forge.scope.projects-missing').unavailableFeatures, ['views']);
});

test('supporting issue cannot reuse the roadmap or a delivery-group survivor number', () => {
  const reviewed = coordination();
  reviewed.reconcile = {
    supportingIssues: [{
      id: 'collision', number: 2, title: '지원 기준선 정리', summary: '충돌 fixture입니다.',
      completedScope: ['완료 범위'], remainingGates: ['남은 gate']
    }]
  };
  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', coordination: reviewed,
    tasks: tasks(), remoteIssues: remoteIssues()
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.operations.length, 0);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.reconcile.issue-role-conflict'), true);
});

test('classification transfer plans all Project items before any issue label removal', () => {
  const reviewed = { ...coordination(), projectMode: 'preferred' };
  const issues = remoteIssues().map((issue, index) => ({
    ...issue,
    labels: [{ name: `area:area-${index + 1}` }, { name: index === 0 ? 'priority:p0' : 'risk:high' }]
  }));
  const plan = planForgePresentationReconcile({
    provider: 'github', planId: 'electron-overhaul', projectTitle: 'Electron 전환',
    coordination: reviewed, tasks: tasks(), remoteIssues: issues
  });

  assert.equal(plan.ok, true);
  const lastTransfer = Math.max(...plan.operations.map((operation, index) => (
    operation.resource === 'project-item' && operation.action === 'ensure' ? index : -1
  )));
  const firstRemoval = plan.operations.findIndex((operation) => operation.resource === 'issue' && operation.payload?.removeClassificationLabels === true);
  assert.equal(lastTransfer < firstRemoval, true);
  const desktop = plan.operations.find((operation) => operation.id === 'group:desktop-foundation:project-item');
  assert.match(desktop.payload.area, /area-2/);
  assert.match(desktop.payload.area, /area-5/);
  assert.equal(desktop.critical, true);
});

test('critical Project transfer failure prevents later issue classification removal', async () => {
  let issuePatches = 0;
  const result = await applyForgePlan({
    apply: true, profile: 'deliver', provider: 'github', repository,
    transport: {
      async request(request) {
        if (request.path === '/graphql') return { status: 500, data: {} };
        if (request.method === 'PATCH' && /\/issues\//.test(request.path)) issuePatches += 1;
        return { status: 200, data: [] };
      }
    },
    plan: {
      ok: true,
      operations: [{ id: 'project:critical', action: 'ensure', resource: 'project-item', critical: true, payload: { projectTitle: 'P', issueNumber: 2, taskId: 'group' } }, {
        id: 'group:group:issue', action: 'update', resource: 'issue',
        payload: { issueNumber: 2, expectedUpdatedAt: '2026-07-11T00:00:00Z', labels: [], preserveNonManagedLabels: true, removeClassificationLabels: true }
      }]
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.results[1].status, 'skipped');
  assert.equal(result.results[1].reason, 'critical-prerequisite-failed');
  assert.equal(issuePatches, 0);
});

function coordination() {
  return {
    issueMode: 'delivery-group',
    program: {
      title: 'Electron 전환 및 제품 전면 개선',
      summary: '로컬 writer를 안전한 Electron 제품으로 전환합니다.',
      scope: ['Electron 기반', '작가 작업공간'],
      nonGoals: ['자동 merge'],
      successCriteria: ['13개 task의 검증 통과']
    },
    groups: [
      group('desktop-foundation', 'Electron 데스크톱 기반 구축', ['lw-010', 'lw-020', 'lw-030', 'lw-040']),
      group('workspace', '작가 작업공간과 디자인 시스템 재구성', ['lw-050', 'lw-051']),
      group('writer-tools', '검토·보고서·메모리·도우미 통합', ['lw-060', 'lw-070', 'lw-080', 'lw-090']),
      group('release-quality', '품질·패키징·최종 검수', ['lw-100', 'lw-110', 'lw-120'])
    ]
  };
}

function group(id, title, taskIds) {
  return { id, title, summary: `${title} 결과를 검토합니다.`, taskIds, rollback: '관련 delivery branch를 되돌립니다.' };
}

function tasks() {
  return ['010', '020', '030', '040', '050', '051', '060', '070', '080', '090', '100', '110', '120'].map((suffix) => ({
    id: `lw-${suffix}`,
    title: `작업 ${suffix}`,
    status: 'planned',
    acceptanceCriteria: [`작업 ${suffix} 검증 통과`],
    dependsOn: [],
    verificationCommands: [{ id: `verify-${suffix}`, argv: ['pnpm', 'verify'] }],
    paths: ['apps/writer'],
    priority: 100,
    risk: 'medium'
  }));
}

function remoteIssues() {
  return Array.from({ length: 14 }, (_, index) => {
    const number = index + 1;
    const task = number > 1 ? tasks()[number - 2] : null;
    return {
      id: 100 + number,
      number,
      title: task?.title ?? 'Electron 전환 및 제품 전면 개선',
      body: task ? `<!-- aapb:task:${task.id} -->` : '<!-- aapb:plan:electron-overhaul -->',
      ...(task ? { parentIssueNumbers: [1] } : {}),
      state: 'open',
      updatedAt: `2026-07-11T00:${String(number).padStart(2, '0')}:00Z`
    };
  });
}
