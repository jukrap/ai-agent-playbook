import test from 'node:test';
import assert from 'node:assert/strict';
import { getForgeCapabilities, planForgeSync } from '../src/forge/index.mjs';

async function loadApply() {
  try {
    return await import('../src/forge/apply.mjs');
  } catch {
    return {};
  }
}

async function loadGithub() {
  try {
    return await import('../src/forge/providers/github.mjs');
  } catch {
    return {};
  }
}

async function loadGitea() {
  try {
    return await import('../src/forge/providers/gitea.mjs');
  } catch {
    return {};
  }
}

function scriptedTransport(steps = []) {
  const calls = [];
  let cursor = 0;
  return {
    calls,
    async request(request) {
      calls.push(structuredClone(request));
      const step = steps[cursor++];
      if (step === undefined) throw new Error(`Unexpected request ${request.method} ${request.path}`);
      if (typeof step === 'function') return step(request, cursor - 1);
      if (step instanceof Error) throw step;
      return structuredClone(step);
    }
  };
}

const repository = { owner: 'example', name: 'playbook' };

test('forge apply preview and write policy gates never call transport', async () => {
  const { applyForgePlan } = await loadApply();
  assert.equal(typeof applyForgePlan, 'function');

  const transport = scriptedTransport();
  const plan = {
    ok: true,
    operations: [{
      id: 'label:aapb:ready',
      action: 'ensure',
      resource: 'label',
      payload: { name: 'aapb:ready', color: '1f883d' }
    }]
  };

  const preview = await applyForgePlan({
    plan,
    provider: 'github',
    repository,
    transport,
    profile: 'deliver',
    apply: false
  });
  assert.equal(preview.ok, true);
  assert.deepEqual(preview.mode, { apply: false, writes: false });
  assert.equal(preview.results[0].status, 'planned');

  const observed = await applyForgePlan({
    plan,
    provider: 'github',
    repository,
    transport,
    profile: 'observe',
    apply: true
  });
  assert.equal(observed.ok, false);
  assert.equal(observed.conflicts.some((item) => item.id === 'forge.apply.profile-denied'), true);

  const unknown = await applyForgePlan({
    plan,
    provider: 'unknown',
    repository,
    transport,
    profile: 'deliver',
    apply: true
  });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.conflicts.some((item) => item.id === 'forge.apply.provider-unsafe'), true);

  const readOnly = await applyForgePlan({
    plan,
    provider: 'github',
    repository,
    transport,
    profile: 'deliver',
    remoteReadOnly: true,
    apply: true
  });
  assert.equal(readOnly.ok, false);
  assert.equal(readOnly.conflicts.some((item) => item.id === 'forge.apply.remote-denied'), true);

  const coordinate = await applyForgePlan({
    plan: {
      ok: true,
      operations: [{
        id: 'pr',
        action: 'ensure',
        resource: 'draft-pull-request',
        payload: { head: 'aapb/task', base: 'main', title: 'Task' }
      }]
    },
    provider: 'github',
    repository,
    transport,
    profile: 'coordinate',
    apply: true
  });
  assert.equal(coordinate.ok, false);
  assert.equal(coordinate.conflicts.some((item) => item.id === 'forge.apply.profile-resource-denied'), true);
  assert.equal(transport.calls.length, 0);
});

test('GitHub label ensure follows pagination and reuses an existing asset without overwriting it', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `existing-${index}`,
    color: 'ffffff'
  }));
  const transport = scriptedTransport([
    { status: 200, data: firstPage, headers: { link: '<next>; rel="next"' } },
    { status: 200, data: [{ id: 501, name: 'aapb:ready', color: '000000' }], headers: {} }
  ]);
  const provider = createGithubProvider({ transport, repository });
  const result = await provider.ensureLabel({
    name: 'aapb:ready',
    color: '1f883d',
    description: 'managed'
  });

  assert.equal(result.status, 'reused');
  assert.equal(result.resource.id, 501);
  assert.equal(transport.calls.length, 2);
  assert.deepEqual(transport.calls.map((call) => call.query.page), [1, 2]);
  assert.equal(transport.calls.every((call) => call.method === 'GET'), true);
  assert.equal(transport.calls[0].path, '/repos/example/playbook/labels');
  assert.equal(transport.calls[0].headers['x-github-api-version'], '2026-03-10');
});

test('GitHub issue updates enforce updatedAt and send untrusted text only as JSON payload', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const mismatchTransport = scriptedTransport([{
    status: 200,
    data: { number: 7, title: 'remote', body: '', state: 'open', labels: [], updated_at: '2026-07-11T01:00:00Z' }
  }]);
  const mismatchProvider = createGithubProvider({ transport: mismatchTransport, repository });
  await assert.rejects(
    mismatchProvider.updateIssue({
      issueNumber: 7,
      expectedUpdatedAt: '2026-07-11T00:00:00Z',
      title: 'unsafe; gh api --method DELETE',
      body: '$(Remove-Item -Recurse C:\\)'
    }),
    (error) => error?.code === 'forge.issue.updated-at-conflict' && error?.details?.issueNumber === 7
  );
  assert.equal(mismatchTransport.calls.length, 1);

  const transport = scriptedTransport([
    { status: 200, data: { number: 7, title: 'old', body: '', state: 'open', labels: [], updated_at: '2026-07-11T01:00:00Z' } },
    (request) => ({ status: 200, data: { number: 7, ...request.body, updated_at: '2026-07-11T01:01:00Z' } })
  ]);
  const provider = createGithubProvider({ transport, repository });
  const result = await provider.updateIssue({
    issueNumber: 7,
    expectedUpdatedAt: '2026-07-11T01:00:00Z',
    title: 'unsafe; gh api --method DELETE',
    body: '$(Remove-Item -Recurse C:\\)',
    state: 'open'
  });
  assert.equal(result.status, 'updated');
  assert.equal(transport.calls[1].method, 'PATCH');
  assert.equal(transport.calls[1].path, '/repos/example/playbook/issues/7');
  assert.equal(transport.calls[1].body.title, 'unsafe; gh api --method DELETE');
  assert.equal(transport.calls[1].body.body, '$(Remove-Item -Recurse C:\\)');
  assert.equal('command' in transport.calls[1], false);
});

test('GitHub issue update reuses an already-converged result after an ambiguous prior response', async () => {
  const { createGithubProvider } = await loadGithub();
  const transport = scriptedTransport([{
    status: 200,
    data: {
      number: 7,
      title: 'Already synchronized',
      body: 'Stable body',
      state: 'closed',
      labels: [],
      updated_at: '2026-07-11T01:01:00Z'
    }
  }]);
  const provider = createGithubProvider({ transport, repository });

  const result = await provider.updateIssue({
    issueNumber: 7,
    expectedUpdatedAt: '2026-07-11T01:00:00Z',
    title: 'Already synchronized',
    body: 'Stable body',
    state: 'closed'
  });

  assert.equal(result.status, 'reused');
  assert.equal(transport.calls.length, 1);
});

test('GitHub requirement updates require a CAS snapshot while marker discovery preserves remote authority', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const deniedTransport = scriptedTransport();
  const deniedProvider = createGithubProvider({ transport: deniedTransport, repository });
  await assert.rejects(
    deniedProvider.updateIssue({
      issueNumber: 19,
      title: 'Local title without a remote baseline',
      acceptanceCriteria: ['Local criterion']
    }),
    (error) => error?.code === 'forge.issue.requirements-cas-required' && error?.details?.issueNumber === 19
  );
  assert.equal(deniedTransport.calls.length, 0);

  const marker = '<!-- aapb:task:remote-owned -->';
  const existing = {
    number: 19,
    title: 'Remote title',
    body: `${marker}\n\nRemote requirements`,
    state: 'closed',
    labels: [{ name: 'aapb:paused' }, { name: 'customer-owned' }],
    updated_at: '2026-07-11T04:00:00.000Z'
  };
  const preserveTransport = scriptedTransport([{
    status: 200,
    data: [existing],
    headers: {}
  }]);
  const preserveProvider = createGithubProvider({ transport: preserveTransport, repository });
  await assert.rejects(() => preserveProvider.ensureIssue({
    marker,
    title: 'Local plan title',
    body: 'Local plan requirements',
    state: 'open',
    labels: ['aapb:ready'],
    acceptanceCriteria: ['Local criterion']
  }), (error) => error?.code === 'forge.issue.reconcile-required' && error?.details?.issueNumber === 19);
  assert.equal(preserveTransport.calls.length, 1);
  assert.equal(preserveTransport.calls[0].method, 'GET');

  const updateTransport = scriptedTransport([
    { status: 200, data: [existing], headers: {} },
    { status: 200, data: existing, headers: {} },
    (request) => ({
      status: 200,
      data: { ...existing, ...request.body, updated_at: '2026-07-11T04:01:00.000Z' }
    })
  ]);
  const updateProvider = createGithubProvider({ transport: updateTransport, repository });
  const updated = await updateProvider.ensureIssue({
    marker,
    expectedUpdatedAt: existing.updated_at,
    title: 'Reconciled title',
    body: 'Reconciled requirements',
    state: 'open',
    acceptanceCriteria: ['Reconciled criterion']
  });
  assert.equal(updated.status, 'updated');
  assert.equal(updateTransport.calls[2].method, 'PATCH');
  assert.equal(updateTransport.calls[2].body.title, 'Reconciled title');
  assert.match(updateTransport.calls[2].body.body, /Reconciled requirements/);
  assert.match(updateTransport.calls[2].body.body, /Reconciled criterion/);
});

test('GitHub and Gitea plan-only apply require reconcile when a marker child issue requirements differ', async () => {
  const { applyForgePlan } = await loadApply();
  assert.equal(typeof applyForgePlan, 'function');

  const marker = '<!-- aapb:task:remote-owned -->';
  const existing = {
    number: 27,
    title: 'Remote-edited title',
    body: `${marker}\n\nRemote-edited acceptance criteria`,
    state: 'closed',
    labels: [{ name: 'aapb:paused' }, { name: 'customer-owned' }],
    updated_at: '2026-07-11T05:00:00.000Z'
  };
  for (const provider of ['github', 'gitea']) {
    const transport = scriptedTransport([{ status: 200, data: [existing], headers: {} }]);
    const plan = planForgeSync({
      provider,
      capabilities: getForgeCapabilities(provider),
      tasks: [{
        id: 'remote-owned',
        title: 'Plan title',
        status: 'planned',
        acceptanceCriteria: ['Plan criterion']
      }]
    });

    const result = await applyForgePlan({
      plan,
      provider,
      repository,
      transport,
      profile: 'deliver',
      apply: true
    });

    assert.equal(result.ok, false, provider);
    assert.equal(result.results[0].status, 'failed', provider);
    assert.equal(result.results[0].error.code, 'forge.issue.reconcile-required', provider);
    assert.equal(transport.calls.length, 1, provider);
    assert.equal(transport.calls.some((call) => call.method === 'PATCH'), false, provider);
  }
});

test('linked issue status updates preserve non-managed user labels', async () => {
  const { createGithubProvider } = await loadGithub();
  const current = {
    number: 17,
    title: 'User-owned title',
    body: 'User-owned body',
    state: 'open',
    labels: [{ name: 'bug' }, { name: 'aapb:ready' }, { name: 'aapb:paused' }, { name: 'customer-visible' }],
    updated_at: '2026-07-11T06:00:00.000Z'
  };
  const transport = scriptedTransport([
    { status: 200, data: current },
    (request) => ({ status: 200, data: { ...current, ...request.body, updated_at: '2026-07-11T06:01:00.000Z' } })
  ]);
  const provider = createGithubProvider({ transport, repository });

  const result = await provider.updateIssue({
    issueNumber: 17,
    expectedUpdatedAt: current.updated_at,
    labels: ['aapb:running'],
    preserveNonManagedLabels: true,
    state: 'open'
  });

  assert.equal(result.status, 'updated');
  assert.deepEqual(transport.calls[1].body, {
    state: 'open',
    labels: ['bug', 'customer-visible', 'aapb:running']
  });
  assert.equal('title' in transport.calls[1].body, false);
  assert.equal('body' in transport.calls[1].body, false);
});

test('GitHub milestone and marker issue ensure operations are idempotent across reruns', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  let milestone;
  let issue;
  const transport = scriptedTransport([
    { status: 200, data: [], headers: {} },
    (request) => {
      milestone = { number: 3, ...request.body };
      return { status: 201, data: milestone };
    },
    () => ({ status: 200, data: [milestone], headers: {} }),
    { status: 200, data: [], headers: {} },
    (request) => {
      issue = { number: 9, state: 'open', labels: [], ...request.body };
      return { status: 201, data: issue };
    },
    () => ({ status: 200, data: [issue], headers: {} }),
    () => ({ status: 200, data: issue })
  ]);
  const provider = createGithubProvider({ transport, repository });
  assert.equal((await provider.ensureMilestone({ title: '0.5.4' })).status, 'created');
  assert.equal((await provider.ensureMilestone({ title: '0.5.4' })).status, 'reused');

  const payload = {
    marker: '<!-- aapb:task:task-9 -->',
    taskId: 'task-9',
    title: 'Task 9',
    acceptanceHeading: '수용 기준',
    acceptanceCriteria: ['verification passes']
  };
  assert.equal((await provider.ensureIssue(payload)).status, 'created');
  assert.equal((await provider.ensureIssue(payload)).status, 'reused');
  assert.match(issue.body, /## 수용 기준/);
  assert.equal(transport.calls.filter((call) => call.method === 'POST').length, 2);
  assert.equal(issue.body.includes('<!-- aapb:acceptance:start -->'), true);
});

test('marker comment and draft PR ensure operations update or reuse existing remote resources', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const marker = '<!-- aapb:status:task-1 -->';
  const transport = scriptedTransport([
    { status: 200, data: [
      { id: 90, body: `quoted marker, not owned: ${marker}` },
      { id: 91, body: `${marker}\nold` }
    ], headers: {} },
    { status: 200, data: { id: 91, body: `${marker}\nnew` } },
    { status: 200, data: [{
      number: 12,
      title: 'Task 1',
      body: marker,
      state: 'open',
      draft: true,
      head: { ref: 'aapb/task-1' },
      base: { ref: 'main' }
    }], headers: {} }
  ]);
  const provider = createGithubProvider({ transport, repository });
  const comment = await provider.upsertMarkerComment({
    issueNumber: 7,
    marker,
    body: `${marker}\nnew`
  });
  const pull = await provider.ensureDraftPullRequest({
    head: 'aapb/task-1',
    base: 'main',
    title: 'Task 1',
    marker,
    body: marker
  });

  assert.equal(comment.status, 'updated');
  assert.equal(transport.calls[1].path, '/repos/example/playbook/issues/comments/91');
  assert.equal(pull.status, 'reused');
  assert.equal(pull.resource.number, 12);
  assert.equal(transport.calls.length, 3);
});

test('GitHub draft PR ensure creates one PR and reuses it on an idempotent rerun', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const created = {
    number: 22,
    title: 'Task 2',
    body: '<!-- aapb:delivery:task-2:pr -->\n\nbody',
    state: 'open',
    draft: true,
    head: { ref: 'aapb/task-2' },
    base: { ref: 'main' }
  };
  const transport = scriptedTransport([
    { status: 200, data: [], headers: {} },
    { status: 201, data: created },
    { status: 200, data: [created], headers: {} }
  ]);
  const provider = createGithubProvider({ transport, repository });
  const payload = { head: 'aapb/task-2', base: 'main', title: 'Task 2', marker: '<!-- aapb:delivery:task-2:pr -->', body: '<!-- aapb:delivery:task-2:pr -->\n\nbody' };
  assert.equal((await provider.ensureDraftPullRequest(payload)).status, 'created');
  assert.equal((await provider.ensureDraftPullRequest(payload)).status, 'reused');
  assert.equal(transport.calls.filter((call) => call.method === 'POST').length, 1);
  assert.equal(transport.calls[1].body.draft, true);
});

test('Gitea draft PR delivery uses the documented WIP title convention idempotently', async () => {
  const { createGiteaProvider } = await loadGitea();
  const marker = '<!-- aapb:delivery:task-gitea:pr -->';
  const created = {
    number: 31,
    title: 'WIP: Gitea task',
    body: `${marker}\n\nreview before merge`,
    state: 'open',
    head: { ref: 'aapb/task-gitea' },
    base: { ref: 'main' }
  };
  const transport = scriptedTransport([
    { status: 200, data: [], headers: {} },
    { status: 201, data: created, headers: {} },
    { status: 200, data: [created], headers: {} }
  ]);
  const provider = createGiteaProvider({
    repository,
    transport
  });
  const payload = {
    head: 'aapb/task-gitea',
    base: 'main',
    title: 'Gitea task',
    marker,
    body: `${marker}\n\nreview before merge`
  };

  const first = await provider.ensureDraftPullRequest(payload);
  const second = await provider.ensureDraftPullRequest(payload);

  assert.equal(first.status, 'created');
  assert.equal(second.status, 'reused');
  assert.match(first.fallback, /WIP title convention/i);
  assert.equal(transport.calls[1].body.title, 'WIP: Gitea task');
  assert.equal('draft' in transport.calls[1].body, false);
});

test('GitHub project item sync adds one child issue and idempotently updates managed fields', async () => {
  const { applyForgePlan } = await loadApply();
  const projectTitle = 'Forge delivery';
  const issue = {
    id: 901,
    node_id: 'I_task_1',
    number: 31,
    title: 'Task 1',
    body: '<!-- aapb:task:task-1 -->\nTask 1',
    state: 'open',
    labels: []
  };
  const project = { id: 'P_delivery', number: 7, title: projectTitle };
  const restFields = [
    { id: 101, name: 'AAPB Task ID', data_type: 'text' },
    { id: 102, name: 'AAPB Priority', data_type: 'single_select' },
    { id: 103, name: 'AAPB Risk', data_type: 'single_select' },
    { id: 104, name: 'AAPB Progress', data_type: 'number' }
  ];
  const graphFields = [
    {
      __typename: 'ProjectV2SingleSelectField',
      id: 'F_status',
      name: 'Status',
      options: [
        { id: 'O_todo', name: 'Todo' },
        { id: 'O_progress', name: 'In Progress' },
        { id: 'O_done', name: 'Done' }
      ]
    },
    { __typename: 'ProjectV2Field', id: 'F_task', name: 'AAPB Task ID', dataType: 'TEXT' },
    {
      __typename: 'ProjectV2SingleSelectField',
      id: 'F_priority',
      name: 'AAPB Priority',
      options: [
        { id: 'O_p0', name: 'P0' },
        { id: 'O_p1', name: 'P1' },
        { id: 'O_p2', name: 'P2' },
        { id: 'O_p3', name: 'P3' }
      ]
    },
    {
      __typename: 'ProjectV2SingleSelectField',
      id: 'F_risk',
      name: 'AAPB Risk',
      options: [
        { id: 'O_low', name: 'low' },
        { id: 'O_medium', name: 'medium' },
        { id: 'O_high', name: 'high' }
      ]
    },
    { __typename: 'ProjectV2Field', id: 'F_progress', name: 'AAPB Progress', dataType: 'NUMBER' }
  ];
  const state = { items: [], values: new Map() };
  const calls = [];
  const fieldById = new Map(graphFields.map((field) => [field.id, field]));
  const transport = {
    calls,
    async request(request) {
      calls.push(structuredClone(request));
      if (request.path === '/repos/example/playbook/issues' && request.method === 'GET') {
        return { status: 200, data: [issue], headers: {} };
      }
      if (request.path === '/orgs/example/projectsV2/7/fields' && request.method === 'GET') {
        return { status: 200, data: restFields, headers: {} };
      }
      if (request.path === '/graphql') {
        const operation = request.body.operationName;
        if (operation === 'AapbProjectContext') {
          return {
            status: 200,
            data: {
              data: {
                repository: {
                  id: 'R_repo',
                  owner: {
                    __typename: 'Organization',
                    id: 'O_owner',
                    login: 'example',
                    databaseId: 41,
                    projectsV2: {
                      nodes: [project],
                      pageInfo: { hasNextPage: false, endCursor: null }
                    }
                  }
                }
              }
            }
          };
        }
        if (operation === 'AapbProjectViews') {
          return {
            status: 200,
            data: { data: { node: { views: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } }
          };
        }
        if (operation === 'AapbProjectFields') {
          return {
            status: 200,
            data: { data: { node: { fields: { nodes: graphFields, pageInfo: { hasNextPage: false, endCursor: null } } } } }
          };
        }
        if (operation === 'AapbProjectItems') {
          return {
            status: 200,
            data: {
              data: {
                node: {
                  items: {
                    nodes: state.items.map((item) => ({
                      ...item,
                      fieldValues: {
                        nodes: [...state.values.entries()].map(([fieldId, value]) => {
                          const field = fieldById.get(fieldId);
                          if ('text' in value) return { __typename: 'ProjectV2ItemFieldTextValue', text: value.text, field };
                          if ('number' in value) return { __typename: 'ProjectV2ItemFieldNumberValue', number: value.number, field };
                          const option = field.options.find((candidate) => candidate.id === value.singleSelectOptionId);
                          return {
                            __typename: 'ProjectV2ItemFieldSingleSelectValue',
                            optionId: option.id,
                            name: option.name,
                            field
                          };
                        })
                      }
                    })),
                    pageInfo: { hasNextPage: false, endCursor: null }
                  }
                }
              }
            }
          };
        }
        if (operation === 'AapbAddProjectItem') {
          const item = { id: 'PVTI_task_1', content: { id: issue.node_id, number: issue.number } };
          state.items.push(item);
          return { status: 200, data: { data: { addProjectV2ItemById: { item } } } };
        }
        if (operation === 'AapbUpdateProjectItemFieldValue') {
          state.values.set(request.body.variables.fieldId, structuredClone(request.body.variables.value));
          return {
            status: 200,
            data: { data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: request.body.variables.itemId } } } }
          };
        }
      }
      throw new Error(`Unexpected ${request.method} ${request.path} ${request.body?.operationName ?? ''}`);
    }
  };
  const plan = {
    ok: true,
    provider: 'github',
    operations: [{
      id: 'task:task-1:project-item',
      action: 'ensure',
      resource: 'project-item',
      payload: {
        projectTitle,
        issueMarker: '<!-- aapb:task:task-1 -->',
        taskId: 'task-1',
        status: 'running',
        priority: 750,
        risk: 'high',
        progress: 25
      }
    }]
  };

  const first = await applyForgePlan({ apply: true, profile: 'deliver', provider: 'github', repository, transport, plan });
  const second = await applyForgePlan({ apply: true, profile: 'deliver', provider: 'github', repository, transport, plan });

  assert.equal(first.ok, true);
  assert.equal(first.results[0].status, 'created');
  assert.equal(second.ok, true);
  assert.equal(second.results[0].status, 'reused');
  assert.equal(calls.filter((call) => call.body?.operationName === 'AapbAddProjectItem').length, 1);
  assert.equal(calls.filter((call) => call.body?.operationName === 'AapbUpdateProjectItemFieldValue').length, 5);
  assert.equal(state.values.get('F_status').singleSelectOptionId, 'O_progress');
  assert.equal(state.values.get('F_task').text, 'task-1');
  assert.equal(state.values.get('F_priority').singleSelectOptionId, 'O_p1');
  assert.equal(state.values.get('F_risk').singleSelectOptionId, 'O_high');
  assert.equal(state.values.get('F_progress').number, 25);
  assert.equal(calls.filter((call) => call.path === '/graphql').every((call) => !call.body.query.includes('task-1')), true);
});

test('GitHub project bootstrap ensures managed fields and four views idempotently through public APIs', async () => {
  const { applyForgePlan } = await loadApply();
  assert.equal(typeof applyForgePlan, 'function');

  const projectTitle = 'Project " } mutation { unsafe';
  const state = { project: null, fields: [], views: [] };
  const calls = [];
  const transport = {
    calls,
    async request(request) {
      calls.push(structuredClone(request));
      if (request.path === '/graphql') {
        if (request.body.operationName === 'AapbProjectContext') {
          return {
            status: 200,
            data: {
              data: {
                repository: {
                  id: 'R_repo',
                  owner: {
                    __typename: 'Organization',
                    id: 'O_owner',
                    login: 'example',
                    databaseId: 41,
                    projectsV2: {
                      nodes: state.project ? [state.project] : [],
                      pageInfo: { hasNextPage: false, endCursor: null }
                    }
                  }
                }
              }
            }
          };
        }
        if (request.body.operationName === 'AapbCreateProject') {
          state.project = { id: 'P_project', number: 7, title: request.body.variables.title };
          return { status: 200, data: { data: { createProjectV2: { projectV2: state.project } } } };
        }
        if (request.body.operationName === 'AapbProjectViews') {
          return {
            status: 200,
            data: {
              data: {
                node: {
                  views: {
                    nodes: state.views,
                    pageInfo: { hasNextPage: false, endCursor: null }
                  }
                }
              }
            }
          };
        }
      }
      if (request.path === '/orgs/example/projectsV2/7/fields' && request.method === 'GET') {
        return { status: 200, data: state.fields, headers: {} };
      }
      if (request.path === '/orgs/example/projectsV2/7/fields' && request.method === 'POST') {
        const field = { id: 100 + state.fields.length, ...request.body };
        state.fields.push(field);
        return { status: 201, data: field };
      }
      if (request.path === '/orgs/example/projectsV2/7/views' && request.method === 'POST') {
        const view = { id: 200 + state.views.length, number: state.views.length + 1, ...request.body };
        state.views.push(view);
        return { status: 201, data: { value: view } };
      }
      throw new Error(`Unexpected request ${request.method} ${request.path}`);
    }
  };
  const plan = {
    ok: true,
    operations: [
      { id: 'project', action: 'ensure', resource: 'project', payload: { title: projectTitle } },
      ...[
        ['Queue', 'table', 'label:aapb:ready'],
        ['Board', 'board', '-is:closed'],
        ['Roadmap', 'roadmap', '-is:closed'],
        ['Blocked', 'table', 'label:aapb:blocked']
      ].map(([name, layout, filter]) => ({
        id: `view:${name}`,
        action: 'ensure',
        resource: 'view',
        payload: { projectTitle, name, layout, filter }
      }))
    ]
  };

  const first = await applyForgePlan({
    apply: true,
    profile: 'deliver',
    provider: 'github',
    repository,
    transport,
    plan
  });
  const second = await applyForgePlan({
    apply: true,
    profile: 'deliver',
    provider: 'github',
    repository,
    transport,
    plan
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(state.fields.map((field) => field.name), [
    'AAPB Task ID',
    'AAPB Priority',
    'AAPB Risk',
    'AAPB Progress'
  ]);
  assert.deepEqual(state.views.map((view) => view.name), ['Queue', 'Board', 'Roadmap', 'Blocked']);
  assert.equal(calls.filter((call) => call.body?.operationName === 'AapbCreateProject').length, 1);
  assert.equal(calls.filter((call) => call.method === 'POST' && call.path.endsWith('/fields')).length, 4);
  assert.equal(calls.filter((call) => call.method === 'POST' && call.path.endsWith('/views')).length, 4);
  const graphQlCalls = calls.filter((call) => call.path === '/graphql');
  assert.equal(graphQlCalls.every((call) => !call.body.query.includes(projectTitle)), true);
  assert.equal(graphQlCalls.some((call) => call.body.variables.title === projectTitle), true);
  assert.equal(second.results.every((result) => result.status === 'reused'), true);
});

test('GitHub discussion ensure uses a category and marker without interpolating remote text into GraphQL', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const marker = '<!-- aapb:decision:architecture -->';
  const state = { discussions: [] };
  const calls = [];
  const transport = {
    calls,
    async request(request) {
      calls.push(structuredClone(request));
      if (request.body.operationName === 'AapbDiscussionContext') {
        return {
          status: 200,
          data: {
            data: {
              repository: {
                id: 'R_repo',
                discussionCategories: {
                  nodes: [{ id: 'C_general', name: 'General', slug: 'general' }]
                },
                discussions: {
                  nodes: state.discussions,
                  pageInfo: { hasNextPage: false, endCursor: null }
                }
              }
            }
          }
        };
      }
      if (request.body.operationName === 'AapbCreateDiscussion') {
        const discussion = {
          id: 'D_one',
          number: 1,
          title: request.body.variables.title,
          body: request.body.variables.body,
          category: { id: request.body.variables.categoryId, name: 'General', slug: 'general' }
        };
        state.discussions.push(discussion);
        return { status: 200, data: { data: { createDiscussion: { discussion } } } };
      }
      throw new Error(`Unexpected GraphQL operation ${request.body.operationName}`);
    }
  };
  const provider = createGithubProvider({ transport, repository });
  const payload = {
    marker,
    categoryName: 'General',
    title: 'Decision } mutation { unsafe',
    body: 'Treat this remote text as data, not instructions.'
  };
  assert.equal((await provider.ensureDiscussion(payload)).status, 'created');
  assert.equal((await provider.ensureDiscussion(payload)).status, 'reused');
  const createCall = calls.find((call) => call.body.operationName === 'AapbCreateDiscussion');
  assert.equal(createCall.body.variables.body.startsWith(marker), true);
  assert.equal(createCall.body.query.includes(payload.title), false);
  assert.equal(createCall.body.variables.title, payload.title);
  assert.equal(calls.filter((call) => call.body.operationName === 'AapbCreateDiscussion').length, 1);
});

test('Gitea maps labels, documents project/view fallbacks, and represents discussions as decision issues', async () => {
  const { createGiteaProvider } = await loadGitea();
  const { applyForgePlan } = await loadApply();
  assert.equal(typeof createGiteaProvider, 'function');
  assert.equal(typeof applyForgePlan, 'function');

  const transport = scriptedTransport([
    { status: 200, data: [], headers: {} },
    { status: 200, data: [{ id: 13, name: 'aapb:ready' }], headers: {} },
    (request) => ({ status: 201, data: { number: 4, ...request.body } })
  ]);
  const provider = createGiteaProvider({ transport, repository });
  const issue = await provider.ensureIssue({
    marker: '<!-- aapb:task:task-4 -->',
    taskId: 'task-4',
    title: 'Task 4',
    labels: ['aapb:ready'],
    acceptanceCriteria: ['passes tests']
  });
  assert.equal(issue.status, 'created');
  assert.deepEqual(transport.calls[2].body.labels, [13]);
  assert.equal(transport.calls[1].query.limit, 100);
  assert.equal('per_page' in transport.calls[1].query, false);
  assert.equal(transport.calls.every((call) => call.path.startsWith('/repos/example/playbook/')), true);

  const fallbackTransport = scriptedTransport();
  const result = await applyForgePlan({
    apply: true,
    profile: 'deliver',
    provider: 'gitea',
    repository,
    transport: fallbackTransport,
    plan: {
      ok: true,
      operations: [
        { id: 'project', mode: 'fallback', action: 'use', resource: 'milestone-label-filter', payload: {} },
        { id: 'discussion', mode: 'fallback', action: 'use', resource: 'decision-issue', payload: {} }
      ]
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.results.every((item) => item.status === 'fallback'), true);
  assert.equal(result.warnings.every((item) => item.id === 'forge.apply.documented-fallback'), true);
  assert.equal(fallbackTransport.calls.length, 0);

  const decisionTransport = scriptedTransport([
    { status: 200, data: [], headers: {} },
    (request) => ({ status: 201, data: { number: 8, ...request.body } })
  ]);
  const nativeFallback = await applyForgePlan({
    apply: true,
    profile: 'deliver',
    provider: 'gitea',
    repository,
    transport: decisionTransport,
    plan: {
      ok: true,
      operations: [
        { id: 'project-native', action: 'ensure', resource: 'project', payload: { title: 'Project' } },
        { id: 'view-native', action: 'ensure', resource: 'view', payload: { projectTitle: 'Project', name: 'Queue' } },
        { id: 'discussion-native', action: 'ensure', resource: 'discussion', payload: { title: 'Decision', body: 'Approved direction' } }
      ]
    }
  });
  assert.equal(nativeFallback.ok, true);
  assert.deepEqual(nativeFallback.results.map((item) => item.status), ['fallback', 'fallback', 'created']);
  assert.equal(decisionTransport.calls.length, 2);
  assert.equal(decisionTransport.calls[1].path, '/repos/example/playbook/issues');
  assert.match(decisionTransport.calls[1].body.body, /<!-- aapb:discussion:/);
  assert.match(decisionTransport.calls[1].body.body, /Approved direction/);
});

test('forge apply returns structured redacted failures without leaking credentials', async () => {
  const { applyForgePlan } = await loadApply();
  assert.equal(typeof applyForgePlan, 'function');

  const secret = 'ghp_abcdefghijklmnopqrstuvwxyz123456';
  const transport = scriptedTransport([new Error(`request failed token=${secret} password=hunter2`)]);
  const result = await applyForgePlan({
    apply: true,
    profile: 'deliver',
    provider: 'github',
    repository,
    transport,
    plan: {
      ok: true,
      operations: [{ id: 'label', action: 'ensure', resource: 'label', payload: { name: 'aapb:ready' } }]
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.results[0].status, 'failed');
  assert.equal(result.results[0].error.code, 'forge.request.failed');
  assert.doesNotMatch(JSON.stringify(result), /ghp_|hunter2|abcdefghijklmnopqrstuvwxyz123456/);
  assert.match(result.results[0].error.message, /\[REDACTED\]/);
});

test('task-dependent forge mutations stop after the authoritative issue CAS fails', async () => {
  const { applyForgePlan } = await loadApply();
  const planned = planForgeSync({
    provider: 'github',
    capabilities: getForgeCapabilities('github'),
    projectTitle: 'CAS project',
    tasks: [{
      id: 'cas-task',
      title: 'CAS task',
      status: 'completed',
      issueNumber: 7,
      expectedUpdatedAt: '2026-07-11T00:00:00.000Z',
      acceptanceCriteria: ['CAS task works']
    }]
  });
  const plan = {
    ...planned,
    operations: planned.operations.filter((operation) => operation.id?.startsWith('task:cas-task:') && ['issue', 'project-item'].includes(operation.resource))
  };
  const transport = scriptedTransport([{
    status: 200,
    data: {
      number: 7,
      title: 'User edited title',
      body: 'User edited requirements',
      labels: [{ name: 'aapb:paused' }],
      updated_at: '2026-07-11T01:00:00.000Z'
    },
    headers: {}
  }]);
  const result = await applyForgePlan({
    plan,
    provider: 'github',
    repository,
    transport,
    profile: 'deliver',
    apply: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.results[0].status, 'failed');
  assert.equal(result.results[1].status, 'skipped');
  assert.equal(result.results[1].reason, 'authoritative-issue-operation-failed');
  assert.equal(transport.calls.length, 1);
});

test('provider adapters reject repository path traversal before any remote request', async () => {
  const { createGithubProvider } = await loadGithub();
  assert.equal(typeof createGithubProvider, 'function');

  const transport = scriptedTransport();
  assert.throws(
    () => createGithubProvider({ transport, repository: { owner: 'example', name: '../private' } }),
    /safe path components/
  );
  assert.equal(transport.calls.length, 0);
});

test('reconcile pauses active work when remote requirements changed and syncs pre-run changes', async () => {
  const { reconcileForgeTask } = await loadApply();
  assert.equal(typeof reconcileForgeTask, 'function');

  const baseline = {
    title: 'Task 1',
    body: 'Original body',
    acceptanceCriteria: ['first'],
    updatedAt: '2026-07-11T00:00:00Z'
  };
  const remoteIssue = {
    title: 'Task 1 revised',
    body: 'Original body',
    acceptanceCriteria: ['first', 'second'],
    updatedAt: '2026-07-11T01:00:00Z'
  };

  const active = reconcileForgeTask({
    localTask: { id: 'task-1', status: 'running', remoteSnapshot: baseline },
    remoteIssue
  });
  assert.equal(active.ok, false);
  assert.equal(active.action, 'pause');
  assert.equal(active.state, 'paused:needs-reconcile');
  assert.deepEqual(active.changed, ['acceptanceCriteria', 'title']);

  const ready = reconcileForgeTask({
    localTask: { id: 'task-1', status: 'ready', remoteSnapshot: baseline },
    remoteIssue
  });
  assert.equal(ready.ok, true);
  assert.equal(ready.action, 'sync-from-remote');
  assert.equal(ready.state, 'ready');
  assert.equal(ready.remote.title, 'Task 1 revised');
  assert.equal(ready.remote.source, 'forge');
  assert.equal(ready.remote.trust, 'untrusted-data');
});
