import test from 'node:test';
import assert from 'node:assert/strict';
import { applyForgePlan, getForgeCapabilities, planForgeSync } from '../src/forge/index.mjs';

function groupedCoordination(overrides = {}) {
  return {
    issueMode: 'delivery-group',
    projectMode: 'preferred',
    maxChildIssues: 6,
    program: {
      title: 'Electron 전환 및 제품 전면 개선',
      summary: '기존 웹 앱을 안전한 데스크톱 제품으로 전환합니다.',
      scope: ['Electron 셸', '작가 작업공간'],
      nonGoals: ['이번 단계의 자동 배포'],
      successCriteria: ['네 개 delivery group의 검증 완료']
    },
    groups: [{
      id: 'desktop-foundation',
      title: 'Electron 데스크톱 기반 구축',
      summary: '안전한 데스크톱 실행 기반과 저장 흐름을 만듭니다.',
      taskIds: ['task-one', 'task-two'],
      rollback: '웹 실행 경로를 유지합니다.'
    }],
    ...overrides
  };
}

test('approved plan sync represents detailed tasks as one rich delivery-group issue', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'release-054',
    planTitle: 'Release 0.5.4',
    milestoneTitle: '0.5.4',
    language: 'ko',
    coordination: groupedCoordination(),
    tasks: [
      {
        id: 'task-one',
        title: '보안 셸 구현',
        status: 'ready',
        acceptanceCriteria: [{ id: 'criterion-one', text: '격리된 preload만 노출' }],
        dependsOn: [],
        verificationCommands: [{ id: 'verify-one', argv: ['npm', 'test'] }],
        paths: ['src/main/**']
      },
      {
        id: 'task-two',
        title: '저장 복구 구현',
        status: 'planned',
        acceptanceCriteria: [{ id: 'criterion-two', text: '중단된 저장을 복구' }],
        dependsOn: ['task-one'],
        verificationCommands: [{ id: 'verify-two', argv: ['npm', 'run', 'check'] }],
        paths: ['src/storage/**']
      }
    ]
  });

  const issues = plan.operations.filter((operation) => operation.resource === 'issue');
  const milestone = plan.operations.find((operation) => operation.resource === 'milestone');
  const parent = issues.find((operation) => operation.id === 'plan:release-054:issue');
  const group = issues.find((operation) => operation.id === 'group:desktop-foundation:issue');
  assert.equal(plan.ok, true);
  assert.match(milestone.payload.description, /## 목적[\s\S]*## 완료 정의[\s\S]*## 현재 gate/);
  assert.match(milestone.payload.description, /0\/2 작업 완료/);
  assert.equal(issues.length, 2);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'sub-issue').length, 1);
  assert.equal(parent.payload.marker, '<!-- aapb:plan:release-054 -->');
  assert.deepEqual(parent.payload.labels, []);
  assert.match(parent.payload.body, /## 목표/);
  assert.match(parent.payload.body, /Electron 셸/);
  assert.match(parent.payload.body, /네 개 delivery group의 검증 완료/);
  assert.match(parent.payload.body, /Electron 데스크톱 기반 구축/);
  assert.equal(group.payload.marker, '<!-- aapb:group:desktop-foundation -->');
  assert.deepEqual(group.payload.labels, ['status:ready']);
  assert.deepEqual(group.payload.taskIds, ['task-one', 'task-two']);
  assert.match(group.payload.body, /보안 셸 구현/);
  assert.match(group.payload.body, /저장 복구 구현/);
  assert.match(group.payload.body, /격리된 preload만 노출/);
  assert.match(group.payload.body, /task-one/);
  assert.match(group.payload.body, /npm test/);
  assert.match(group.payload.body, /src\/storage\/\*\*/);
  assert.deepEqual(plan.summary.artifacts, {
    parentIssues: 1,
    groupIssues: 1,
    taskIssues: 0,
    subIssueLinks: 1,
    projectItems: 1
  });
  assert.equal(plan.summary.presentationFindings, 0);
});

test('task-time group updates preserve user-authored body regions', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'group-update',
    planTitle: 'Group update',
    coordination: {
      issueMode: 'delivery-group',
      projectMode: 'preferred',
      program: { title: 'Group update', summary: 'Update a group.', scope: ['Group'], nonGoals: ['Merge'], successCriteria: ['Verified'] },
      groups: [{ id: 'delivery', title: 'Delivery', summary: 'Update delivery.', taskIds: ['one'], rollback: 'Revert.', issueNumber: 2, expectedUpdatedAt: '2026-07-11T00:00:00Z' }]
    },
    tasks: [{ id: 'one', title: 'One', status: 'running', acceptanceCriteria: ['One works'] }]
  });

  const group = plan.operations.find((operation) => operation.id === 'group:delivery:issue');
  assert.equal(group.payload.preserveManagedBody, true);
  assert.equal(group.payload.preserveNonManagedLabels, true);
  assert.match(group.payload.body, /aapb:managed:start/);
  assert.match(group.payload.body, /aapb:managed:end/);
  assert.match(group.payload.body, /aapb:plan-owner:group-update/);
});

test('public issue technical details redact credentials from verification argv', () => {
  const token = `ghp_${'1234567890abcdef'}`;
  const apiKey = `sk-${'1234567890abcdef'}`;
  const generic = 'generic-credential-value';
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'credential-redaction',
    planTitle: 'Credential redaction',
    language: 'en',
    coordination: {
      ...groupedCoordination(),
      program: { ...groupedCoordination().program, title: 'Credential redaction' },
      groups: [{
        id: 'redaction',
        title: 'Credential redaction',
        summary: 'Keep verification details reviewable without publishing credentials.',
        taskIds: ['redaction-task'],
        rollback: 'Revert the redaction change.'
      }]
    },
    tasks: [{
      id: 'redaction-task',
      title: 'Credential redaction',
      status: 'ready',
      acceptanceCriteria: ['Credentials are absent'],
      verificationCommands: [{
        id: 'verify',
        argv: [
          'tool', '--token', token, `--api-key=${apiKey}`, `GH_TOKEN=${generic}`,
          `Authorization: Bearer ${generic}`, `X-Api-Key: ${generic}`, `Basic ${generic}`,
          'https://user:password@example.test/repo.git'
        ]
      }]
    }]
  });

  const body = plan.operations.find((operation) => operation.id === 'group:redaction:issue').payload.body;
  assert.equal(body.includes(token), false);
  assert.equal(body.includes(apiKey), false);
  assert.equal(body.includes(generic), false);
  assert.doesNotMatch(body, /user:password/);
  assert.match(body, /\[REDACTED\]/);
});

test('approved GitHub plan sync schedules each delivery group for project field synchronization', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'release-project',
    planTitle: 'Release project',
    coordination: {
      ...groupedCoordination(),
      program: { ...groupedCoordination().program, title: 'Release project' },
      groups: [{
        id: 'project-group',
        title: 'Project delivery',
        summary: 'Deliver project changes.',
        taskIds: ['project-task'],
        rollback: 'Revert the delivery branch.'
      }]
    },
    tasks: [{
      id: 'project-task',
      title: 'Project task',
      status: 'running',
      priority: 750,
      risk: 'high',
      acceptanceCriteria: ['Project task works']
    }]
  });

  const operation = plan.operations.find((candidate) => candidate.resource === 'project-item');
  assert.ok(operation);
  assert.equal(operation.groupId, 'project-group');
  assert.deepEqual(operation.payload, {
    projectTitle: 'Release project',
    issueMarker: '<!-- aapb:group:project-group -->',
    groupId: 'project-group',
    phase: 'project-group',
    status: 'running',
    priority: 750,
    risk: 'high',
    progress: 25
  });
});

test('forge issue content follows the detected working language while markers remain stable', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    language: 'auto',
    planId: 'release-ko',
    planTitle: '릴리스 자동화',
    coordination: {
      ...groupedCoordination(),
      program: { ...groupedCoordination().program, title: '릴리스 자동화' },
      groups: [{
        id: 'korean-group',
        title: '상태 원장 구현',
        summary: '상태 원장을 구현합니다.',
        taskIds: ['korean-task'],
        rollback: '기존 원장을 유지합니다.'
      }]
    },
    tasks: [{ id: 'korean-task', title: '상태 원장 구현', status: 'ready', acceptanceCriteria: ['재개 검증 통과'] }]
  });

  const parent = plan.operations.find((operation) => operation.id === 'plan:release-ko:issue');
  const child = plan.operations.find((operation) => operation.id === 'group:korean-group:issue');
  assert.equal(parent.payload.acceptanceHeading, '수용 기준');
  assert.equal(child.payload.acceptanceHeading, '수용 기준');
  assert.equal(child.payload.marker, '<!-- aapb:group:korean-group -->');
});

test('legacy task-per-issue representation is available only when explicitly requested', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    coordination: { issueMode: 'task' },
    tasks: [{
      id: 'linked-task',
      title: 'Locally normalized title',
      status: 'running',
      issueNumber: 77,
      expectedUpdatedAt: '2026-07-11T06:00:00.000Z',
      acceptanceCriteria: ['Local verification still applies']
    }]
  });

  const operation = plan.operations[0];
  assert.equal(operation.action, 'update');
  assert.equal(operation.payload.issueNumber, 77);
  assert.equal(operation.payload.expectedUpdatedAt, '2026-07-11T06:00:00.000Z');
  assert.equal(operation.payload.preserveNonManagedLabels, true);
  assert.deepEqual(operation.payload.labels, []);
  assert.equal(operation.payload.state, 'open');
  assert.equal('title' in operation.payload, false);
  assert.equal('marker' in operation.payload, false);
  assert.equal('acceptanceCriteria' in operation.payload, false);
});

test('missing coordination does not silently recreate one issue per task', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    tasks: [{ id: 'task-one', title: 'One', status: 'ready' }]
  });

  assert.equal(plan.ok, false);
  assert.deepEqual(plan.operations, []);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.coordination.required'), true);
});

test('planned groups have no ready label and Gitea fallback uses minimal status labels', () => {
  const tasks = [{ id: 'task-one', title: 'One', status: 'planned' }];
  const coordination = {
    ...groupedCoordination(),
    groups: [{ id: 'only-group', title: 'Only group', summary: 'One group.', taskIds: ['task-one'], rollback: 'Revert.' }]
  };
  const github = planForgeSync({ provider: 'github', capabilities: getForgeCapabilities('github'), planId: 'github-plan', planTitle: 'GitHub plan', coordination, tasks });
  const gitea = planForgeSync({
    provider: 'gitea',
    capabilities: getForgeCapabilities('gitea'),
    planId: 'gitea-plan',
    planTitle: 'Gitea plan',
    coordination,
    tasks: [{ ...tasks[0], status: 'blocked' }]
  });

  assert.deepEqual(github.operations.find((operation) => operation.id === 'group:only-group:issue').payload.labels, []);
  assert.deepEqual(gitea.operations.find((operation) => operation.id === 'group:only-group:issue').payload.labels, ['status:blocked']);
});

test('explicit GitHub milestone fallback uses minimal status labels when Projects are unavailable', () => {
  const capabilities = { ...getForgeCapabilities('github'), projects: 'unavailable', views: 'unavailable' };
  const coordination = {
    ...groupedCoordination(),
    projectMode: 'milestone',
    groups: [{ id: 'fallback-group', title: 'Fallback group', summary: 'Fallback status.', taskIds: ['fallback-task'], rollback: 'Revert.' }]
  };
  const plan = planForgeSync({
    provider: 'github',
    capabilities,
    planId: 'fallback-plan',
    planTitle: 'Fallback plan',
    coordination,
    tasks: [{ id: 'fallback-task', title: 'Fallback task', status: 'blocked' }]
  });

  assert.equal(plan.ok, true);
  assert.deepEqual(plan.operations.find((operation) => operation.id === 'group:fallback-group:issue').payload.labels, ['status:blocked']);
  assert.equal(plan.operations.some((operation) => operation.resource === 'project-item'), false);
});

test('grouped coordination rejects sentence-style Korean titles and excessive child issues', () => {
  const tasks = Array.from({ length: 7 }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `작업 ${index + 1}`,
    status: 'planned'
  }));
  const coordination = groupedCoordination({
    maxChildIssues: 6,
    program: { ...groupedCoordination().program, title: 'Electron 제품을 전환한다' },
    groups: tasks.map((task, index) => ({
      id: `group-${index + 1}`,
      title: `그룹 ${index + 1}`,
      summary: `그룹 ${index + 1} 요약`,
      taskIds: [task.id],
      rollback: '기존 상태 복구'
    }))
  });
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    language: 'ko',
    planId: 'presentation-check',
    coordination,
    tasks
  });

  assert.equal(plan.ok, false);
  assert.deepEqual(plan.operations, []);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.coordination.too-many-groups'), true);
  assert.equal(plan.presentationFindings.some((finding) => finding.id === 'forge.presentation.korean-title-sentence-ending'), true);
  assert.equal(plan.summary.presentationFindings, 1);
});

test('parent-only mode keeps detailed tasks local while publishing one program issue', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'parent-only-plan',
    language: 'ko',
    coordination: { ...groupedCoordination(), issueMode: 'parent-only', groups: [] },
    tasks: [{ id: 'local-task', title: '로컬 세부 작업', status: 'planned' }]
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'issue').length, 1);
  assert.equal(plan.operations.some((operation) => operation.resource === 'sub-issue'), false);
  assert.match(plan.operations[0].payload.body, /로컬 세부 작업/);
  assert.equal(plan.summary.artifacts.taskIssues, 0);
  assert.equal(plan.summary.artifacts.groupIssues, 0);
});

test('GitHub sub-issue relation is idempotent and Gitea uses zero-write fallback', async () => {
  const issues = [
    { id: 10, number: 1, body: '<!-- aapb:plan:release-054 -->\nParent' },
    { id: 20, number: 2, body: '<!-- aapb:task:task-one -->\nChild' }
  ];
  const relations = [];
  const calls = [];
  const transport = {
    async request(request) {
      calls.push(request);
      if (request.path === '/repos/owner/repo/issues' && request.method === 'GET') return { status: 200, data: issues, headers: {} };
      if (request.path === '/repos/owner/repo/issues/1/sub_issues' && request.method === 'GET') {
        return { status: 200, data: relations.map((id) => issues.find((issue) => issue.id === id)), headers: {} };
      }
      if (request.path === '/repos/owner/repo/issues/1/sub_issues' && request.method === 'POST') {
        relations.push(request.body.sub_issue_id);
        return { status: 201, data: issues[1], headers: {} };
      }
      throw new Error(`Unexpected ${request.method} ${request.path}`);
    }
  };
  const plan = {
    ok: true,
    provider: 'github',
    operations: [{
      id: 'relation',
      action: 'ensure',
      resource: 'sub-issue',
      payload: {
        parentMarker: '<!-- aapb:plan:release-054 -->',
        childMarker: '<!-- aapb:task:task-one -->'
      }
    }],
    warnings: [],
    conflicts: []
  };
  const first = await applyForgePlan({ plan, provider: 'github', repository: { owner: 'owner', name: 'repo' }, transport, profile: 'deliver', apply: true });
  const second = await applyForgePlan({ plan, provider: 'github', repository: { owner: 'owner', name: 'repo' }, transport, profile: 'deliver', apply: true });
  assert.equal(first.results[0].status, 'created');
  assert.equal(second.results[0].status, 'reused');
  assert.deepEqual(relations, [20]);

  let giteaCalls = 0;
  const gitea = await applyForgePlan({
    plan: { ...plan, provider: 'gitea' },
    provider: 'gitea',
    repository: { owner: 'owner', name: 'repo' },
    transport: { request: async () => { giteaCalls += 1; return { status: 500 }; } },
    profile: 'deliver',
    apply: true
  });
  assert.equal(gitea.results[0].status, 'fallback');
  assert.equal(giteaCalls, 0);
});
