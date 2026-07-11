import test from 'node:test';
import assert from 'node:assert/strict';
import { applyForgePlan, getForgeCapabilities, planForgeSync } from '../src/forge/index.mjs';

test('approved plan sync creates one parent issue and child issue relationships', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'release-054',
    planTitle: 'Release 0.5.4',
    tasks: [
      { id: 'task-one', title: 'One', status: 'ready', acceptanceCriteria: ['One works'] },
      { id: 'task-two', title: 'Two', status: 'planned', acceptanceCriteria: ['Two works'] }
    ]
  });
  assert.equal(plan.operations.filter((operation) => operation.resource === 'issue').length, 3);
  assert.equal(plan.operations.filter((operation) => operation.resource === 'sub-issue').length, 2);
  assert.equal(plan.operations[0].payload.marker, '<!-- aapb:plan:release-054 -->');
  assert.deepEqual(plan.operations[0].payload.labels, []);
});

test('approved GitHub plan sync schedules each child issue for project field synchronization', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    planId: 'release-project',
    planTitle: 'Release project',
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
  assert.equal(operation.taskId, 'project-task');
  assert.deepEqual(operation.payload, {
    projectTitle: 'Release project',
    issueMarker: '<!-- aapb:task:project-task -->',
    taskId: 'project-task',
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
    tasks: [{ id: 'korean-task', title: '상태 원장 구현', status: 'ready', acceptanceCriteria: ['재개 검증 통과'] }]
  });

  const parent = plan.operations.find((operation) => operation.id === 'plan:release-ko:issue');
  const child = plan.operations.find((operation) => operation.id === 'task:korean-task:issue');
  assert.equal(parent.payload.acceptanceHeading, '수용 기준');
  assert.equal(child.payload.acceptanceHeading, '수용 기준');
  assert.equal(child.payload.marker, '<!-- aapb:task:korean-task -->');
});

test('linked forge tasks update only managed coordination state on the existing issue', () => {
  const plan = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
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
  assert.deepEqual(operation.payload.labels, ['aapb:running']);
  assert.equal(operation.payload.state, 'open');
  assert.equal('title' in operation.payload, false);
  assert.equal('marker' in operation.payload, false);
  assert.equal('acceptanceCriteria' in operation.payload, false);
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
