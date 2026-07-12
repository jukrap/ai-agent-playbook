import test from 'node:test';
import assert from 'node:assert/strict';

async function loadDetection() {
  try {
    return await import('../src/forge/detect.mjs');
  } catch {
    return {};
  }
}

async function loadCapabilities() {
  try {
    return await import('../src/forge/capabilities.mjs');
  } catch {
    return {};
  }
}

async function loadTransport() {
  try {
    return await import('../src/forge/transport.mjs');
  } catch {
    return {};
  }
}

async function loadPlans() {
  try {
    return await import('../src/forge/plan.mjs');
  } catch {
    return {};
  }
}

async function loadForge() {
  try {
    return await import('../src/forge/index.mjs');
  } catch {
    return {};
  }
}

test('forge provider detection recognizes GitHub and repository coordinates', async () => {
  const { detectForgeProvider } = await loadDetection();
  assert.equal(typeof detectForgeProvider, 'function');

  const https = detectForgeProvider({
    remoteUrl: 'https://github.com/example/project.git'
  });
  const ssh = detectForgeProvider({
    remoteUrl: 'git@github.com:example/project.git'
  });

  assert.equal(https.provider, 'github');
  assert.equal(https.source, 'remote');
  assert.deepEqual(https.repository, {
    host: 'github.com',
    owner: 'example',
    name: 'project',
    slug: 'example/project',
    remoteUrl: 'https://github.com/example/project.git'
  });
  assert.deepEqual(ssh.repository, {
    host: 'github.com',
    owner: 'example',
    name: 'project',
    slug: 'example/project',
    remoteUrl: 'git@github.com:example/project.git'
  });
});

test('forge provider detection supports Gitea, explicit overrides, and unknown hosts', async () => {
  const { detectForgeProvider } = await loadDetection();
  assert.equal(typeof detectForgeProvider, 'function');

  assert.equal(detectForgeProvider({
    remoteUrl: 'https://gitea.com/example/project.git'
  }).provider, 'gitea');

  const explicit = detectForgeProvider({
    remoteUrl: 'ssh://git@code.example.test/example/project.git',
    provider: 'gitea'
  });
  assert.equal(explicit.provider, 'gitea');
  assert.equal(explicit.source, 'explicit');
  assert.equal(explicit.repository.slug, 'example/project');

  const unknown = detectForgeProvider({
    remoteUrl: 'https://code.example.test/example/project.git'
  });
  assert.equal(unknown.provider, 'unknown');
  assert.equal(unknown.warnings.some((warning) => warning.id === 'forge.provider.unknown'), true);
});

test('self-hosted Gitea hostname heuristics remain candidates until explicitly trusted', async () => {
  const { detectForgeProvider } = await loadDetection();
  const candidate = detectForgeProvider({
    remoteUrl: 'https://gitea.internal.example/team/project.git'
  });

  assert.equal(candidate.provider, 'unknown');
  assert.equal(candidate.candidateProvider, 'gitea');
  assert.equal(candidate.source, 'remote-candidate');
  assert.equal(candidate.warnings.some((warning) => warning.id === 'forge.provider.gitea-candidate'), true);
});

test('explicit Gitea API base preserves port and strips the instance subpath from repository coordinates', async () => {
  const { detectForgeProvider } = await loadDetection();
  const detected = detectForgeProvider({
    remoteUrl: 'https://code.example.test:3443/gitea/team/project.git',
    apiBaseUrl: 'https://code.example.test:3443/gitea/api/v1'
  });

  assert.equal(detected.provider, 'gitea');
  assert.equal(detected.source, 'api-base');
  assert.equal(detected.repository.host, 'code.example.test:3443');
  assert.equal(detected.repository.owner, 'team');
  assert.equal(detected.repository.name, 'project');
  assert.equal(detected.repository.apiBaseUrl, 'https://code.example.test:3443/gitea/api/v1');
});

test('forge detection rejects a cross-host API base before credentials can be selected', async () => {
  const { detectForgeProvider } = await loadDetection();
  const detected = detectForgeProvider({
    remoteUrl: 'https://trusted.example/team/project.git',
    provider: 'gitea',
    apiBaseUrl: 'https://evil.example/api/v1'
  });

  assert.equal(detected.provider, 'gitea');
  assert.equal(detected.repository.apiBaseUrl, undefined);
  assert.equal(detected.conflicts.some((conflict) => conflict.id === 'forge.api-base.host-mismatch'), true);
});

test('forge provider detection treats a missing remote as a normal local-only result', async () => {
  const { detectForgeProvider } = await loadDetection();
  assert.equal(typeof detectForgeProvider, 'function');

  assert.deepEqual(detectForgeProvider(), {
    provider: 'none',
    source: 'none',
    repository: null,
    warnings: [{
      id: 'forge.remote.missing',
      message: 'No Git remote URL is configured; forge features are running in local-only mode.'
    }],
    conflicts: []
  });
});

test('forge provider detection does not expose credentials from remote URLs', async () => {
  const { detectForgeProvider } = await loadDetection();
  assert.equal(typeof detectForgeProvider, 'function');

  const detected = detectForgeProvider({
    remoteUrl: 'https://user:secret@github.com/example/project.git'
  });

  assert.equal(detected.provider, 'github');
  assert.equal(detected.repository.remoteUrl, 'https://github.com/example/project.git');
  assert.doesNotMatch(JSON.stringify(detected), /user|secret/);

  const queryCredential = detectForgeProvider({
    remoteUrl: 'https://github.com/example/project.git?access_token=secret#private'
  });
  assert.equal(queryCredential.repository.remoteUrl, 'https://github.com/example/project.git');
  assert.doesNotMatch(JSON.stringify(queryCredential), /access_token|secret|private/);
});

test('forge capability matrix exposes the shared GitHub and Gitea core', async () => {
  const { getForgeCapabilities } = await loadCapabilities();
  assert.equal(typeof getForgeCapabilities, 'function');

  for (const provider of ['github', 'gitea']) {
    const capabilities = getForgeCapabilities(provider);
    assert.equal(capabilities.issues, 'supported');
    assert.equal(capabilities.labels, 'supported');
    assert.equal(capabilities.milestones, 'supported');
    assert.equal(capabilities.pullRequests, 'supported');
    assert.equal(capabilities.actions, 'supported');
  }
});

test('forge capability matrix reports provider-specific native, fallback, and preview support', async () => {
  const { getForgeCapabilities } = await loadCapabilities();
  assert.equal(typeof getForgeCapabilities, 'function');

  const github = getForgeCapabilities('github');
  assert.deepEqual({
    subIssues: github.subIssues,
    projects: github.projects,
    views: github.views,
    discussions: github.discussions,
    agentTask: github.agentTask
  }, {
    subIssues: 'supported',
    projects: 'supported',
    views: 'supported',
    discussions: 'supported',
    agentTask: 'preview'
  });

  const gitea = getForgeCapabilities('gitea');
  assert.deepEqual({
    subIssues: gitea.subIssues,
    projects: gitea.projects,
    views: gitea.views,
    discussions: gitea.discussions,
    agentTask: gitea.agentTask
  }, {
    subIssues: 'fallback',
    projects: 'fallback',
    views: 'fallback',
    discussions: 'fallback',
    agentTask: 'unsupported'
  });
});

test('effective GitHub capabilities distinguish missing read-only and writable project scopes', async () => {
  const { getEffectiveForgeCapabilities } = await loadForge();
  const missing = getEffectiveForgeCapabilities('github', {
    auth: { status: 'authenticated', scopes: ['repo'] }
  });
  const readOnly = getEffectiveForgeCapabilities('github', {
    auth: { status: 'authenticated', scopes: ['repo', 'read:project'] }
  });
  const writable = getEffectiveForgeCapabilities('github', {
    auth: { status: 'authenticated', scopes: ['repo', 'project'] }
  });

  assert.equal(missing.projects, 'unavailable');
  assert.equal(missing.views, 'unavailable');
  assert.equal(readOnly.projects, 'read-only');
  assert.equal(readOnly.views, 'read-only');
  assert.equal(writable.projects, 'supported');
  assert.equal(writable.views, 'supported');
});

test('forge capability matrix disables remote features for unknown and missing providers', async () => {
  const { getForgeCapabilities } = await loadCapabilities();
  assert.equal(typeof getForgeCapabilities, 'function');

  for (const provider of ['unknown', 'none']) {
    const capabilities = getForgeCapabilities(provider);
    assert.equal(Object.values(capabilities).every((state) => state === 'unsupported'), true);
  }
});

test('command transport preserves array arguments and always disables the shell', async () => {
  const { createCommandTransport } = await loadTransport();
  assert.equal(typeof createCommandTransport, 'function');

  const calls = [];
  const transport = createCommandTransport({
    runner: async (command, args, options) => {
      calls.push({ command, args, options });
      return { code: 0, stdout: '{"ok":true}\n', stderr: '' };
    }
  });
  const untrusted = 'repos/example/project; Remove-Item -Recurse C:\\';
  const result = await transport.run('gh', ['api', untrusted], {
    cwd: 'C:\\workspace with space',
    env: { SAFE: '1' }
  });

  assert.equal(result.ok, true);
  assert.equal(result.stdout, '{"ok":true}\n');
  assert.deepEqual(calls, [{
    command: 'gh',
    args: ['api', untrusted],
    options: {
      cwd: 'C:\\workspace with space',
      env: { SAFE: '1' },
      shell: false
    }
  }]);
});

test('command transport rejects shell strings instead of parsing them', async () => {
  const { createCommandTransport } = await loadTransport();
  assert.equal(typeof createCommandTransport, 'function');

  let calls = 0;
  const transport = createCommandTransport({
    runner: async () => {
      calls += 1;
      return { code: 0, stdout: '', stderr: '' };
    }
  });

  await assert.rejects(
    transport.run('gh', 'api repos/example/project'),
    /Command arguments must be an array of strings/
  );
  assert.equal(calls, 0);
});

test('retry helper honors Retry-After and succeeds within three total attempts', async () => {
  const { retryWithBackoff } = await loadTransport();
  assert.equal(typeof retryWithBackoff, 'function');

  let attempts = 0;
  const sleeps = [];
  const result = await retryWithBackoff(async () => {
    attempts += 1;
    if (attempts < 3) {
      const error = new Error('rate limited');
      error.statusCode = 429;
      error.headers = { 'Retry-After': attempts === 1 ? '2' : '1' };
      throw error;
    }
    return 'done';
  }, {
    maxAttempts: 3,
    sleep: async (milliseconds) => { sleeps.push(milliseconds); }
  });

  assert.equal(result, 'done');
  assert.equal(attempts, 3);
  assert.deepEqual(sleeps, [2000, 1000]);
});

test('retry helper caps excessive Retry-After delays', async () => {
  const { retryWithBackoff } = await loadTransport();
  assert.equal(typeof retryWithBackoff, 'function');

  let attempts = 0;
  const sleeps = [];
  const result = await retryWithBackoff(async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('rate limited for too long');
      error.statusCode = 429;
      error.headers = { 'retry-after': '9999' };
      throw error;
    }
    return 'done';
  }, {
    maxAttempts: 2,
    sleep: async (milliseconds) => { sleeps.push(milliseconds); }
  });

  assert.equal(result, 'done');
  assert.deepEqual(sleeps, [30_000]);
});

test('retry helper stops at the attempt limit and does not retry permanent errors', async () => {
  const { retryWithBackoff } = await loadTransport();
  assert.equal(typeof retryWithBackoff, 'function');

  let transientAttempts = 0;
  const sleeps = [];
  await assert.rejects(retryWithBackoff(async () => {
    transientAttempts += 1;
    const error = new Error('service unavailable');
    error.statusCode = 503;
    throw error;
  }, {
    maxAttempts: 3,
    baseDelayMs: 25,
    sleep: async (milliseconds) => { sleeps.push(milliseconds); }
  }), /service unavailable/);
  assert.equal(transientAttempts, 3);
  assert.deepEqual(sleeps, [25, 50]);

  let permanentAttempts = 0;
  await assert.rejects(retryWithBackoff(async () => {
    permanentAttempts += 1;
    const error = new Error('bad request');
    error.statusCode = 400;
    throw error;
  }, {
    sleep: async () => { throw new Error('must not sleep'); }
  }), /bad request/);
  assert.equal(permanentAttempts, 1);
});

test('forge bootstrap plan is deterministic and idempotently declares managed labels', async () => {
  const { planForgeBootstrap } = await loadPlans();
  assert.equal(typeof planForgeBootstrap, 'function');

  const options = {
    provider: 'github',
    milestoneTitle: '0.5.5',
    projectTitle: 'AI Agent Playbook 0.5.5'
  };
  const first = planForgeBootstrap(options);
  const second = planForgeBootstrap({ ...options });

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, '1');
  assert.equal(first.kind, 'forge.bootstrap-plan');
  assert.equal(first.ok, true);
  assert.deepEqual(first.mode, { writes: false, apply: false });
  assert.deepEqual(first.operations
    .filter((operation) => operation.resource === 'label')
    .map((operation) => operation.payload.name), [
    'status:ready'
  ]);
  assert.equal(first.operations.some((operation) => operation.resource === 'milestone'), true);
  assert.match(first.operations.find((operation) => operation.resource === 'milestone').payload.description, /Completion definition/);
  assert.equal(first.operations.some((operation) => operation.resource === 'project'), true);
  assert.deepEqual(first.operations
    .filter((operation) => operation.resource === 'view')
    .map((operation) => operation.payload.name), ['Queue', 'Board', 'Roadmap', 'Blocked']);
  assert.deepEqual(first.operations
    .filter((operation) => operation.resource === 'view')
    .map((operation) => operation.payload.filter), ['aapb-status:Ready', '-is:closed', '-is:closed', 'aapb-status:Blocked']);
  assert.equal(new Set(first.operations.map((operation) => operation.idempotencyKey)).size, first.operations.length);
});

test('GitHub bootstrap localizes human-facing Project view names for Korean repositories', async () => {
  const { planForgeBootstrap } = await loadPlans();
  const plan = planForgeBootstrap({
    provider: 'github',
    projectTitle: '제품 개선',
    language: 'ko'
  });

  assert.deepEqual(
    plan.operations.filter((operation) => operation.resource === 'view').map((operation) => operation.payload.name),
    ['전체', '보드', '로드맵', '주의 필요']
  );
  assert.deepEqual(
    plan.operations.filter((operation) => operation.resource === 'view').map((operation) => operation.payload.filter),
    ['-is:closed', '-is:closed', '-is:closed', 'aapb-status:Blocked']
  );
});

test('Gitea bootstrap plan degrades project and view automation to milestone-label filters', async () => {
  const { planForgeBootstrap } = await loadPlans();
  assert.equal(typeof planForgeBootstrap, 'function');

  const plan = planForgeBootstrap({
    provider: 'gitea',
    milestoneTitle: '0.5.4',
    projectTitle: 'AI Agent Playbook 0.5.4'
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.operations.some((operation) => operation.resource === 'project'), false);
  assert.equal(plan.operations.some((operation) => operation.resource === 'view'), false);
  assert.deepEqual(plan.operations
    .filter((operation) => operation.resource === 'label')
    .map((operation) => operation.payload.name), [
    'status:ready',
    'status:in-progress',
    'status:paused',
    'status:blocked',
    'status:review'
  ]);
  assert.equal(plan.operations.some((operation) => (
    operation.resource === 'milestone-label-filter' &&
    operation.mode === 'fallback'
  )), true);
  assert.equal(plan.warnings.some((warning) => (
    warning.id === 'forge.capability.degraded' &&
    warning.capability === 'projects' &&
    warning.state === 'fallback'
  )), true);
  assert.equal(plan.warnings.some((warning) => (
    warning.id === 'forge.capability.degraded' &&
    warning.capability === 'views' &&
    warning.state === 'fallback'
  )), true);
});

test('GitHub bootstrap creates fallback status labels only after milestone fallback is explicit', async () => {
  const { planForgeBootstrap } = await loadPlans();
  const { getForgeCapabilities } = await loadCapabilities();
  const capabilities = { ...getForgeCapabilities('github'), projects: 'unavailable', views: 'unavailable' };

  const paused = planForgeBootstrap({ provider: 'github', capabilities, projectMode: 'preferred', projectTitle: 'Product' });
  const fallback = planForgeBootstrap({ provider: 'github', capabilities, projectMode: 'milestone', projectTitle: 'Product' });

  assert.deepEqual(paused.operations.filter((operation) => operation.resource === 'label').map((operation) => operation.payload.name), ['status:ready']);
  assert.deepEqual(fallback.operations.filter((operation) => operation.resource === 'label').map((operation) => operation.payload.name), [
    'status:ready', 'status:in-progress', 'status:paused', 'status:blocked', 'status:review'
  ]);
  assert.equal(fallback.operations.some((operation) => operation.resource === 'milestone-label-filter'), true);
});

test('forge sync plan is deterministic, task-scoped, and keeps untrusted text as structured payload', async () => {
  const { planForgeSync } = await loadPlans();
  assert.equal(typeof planForgeSync, 'function');

  const tasks = [
    { id: 'task-2', title: 'Review; gh api --method DELETE', status: 'review' },
    { id: 'task-1', title: 'Build forge adapter', status: 'ready', issueNumber: 42 }
  ];
  const coordination = { issueMode: 'task' };
  const first = planForgeSync({ provider: 'github', milestoneTitle: '0.5.4', coordination, tasks });
  const second = planForgeSync({ provider: 'github', milestoneTitle: '0.5.4', coordination, tasks: [...tasks].reverse() });

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, '1');
  assert.equal(first.kind, 'forge.sync-plan');
  assert.equal(first.ok, true);
  assert.deepEqual(first.operations.map((operation) => operation.taskId), ['task-1', 'task-2']);
  assert.deepEqual(first.operations.map((operation) => operation.payload.labels), [
    ['status:ready'],
    []
  ]);
  assert.equal(first.operations[0].action, 'update');
  assert.equal(first.operations[1].action, 'ensure');
  assert.equal(first.operations[1].payload.title, 'Review; gh api --method DELETE');
  assert.equal(first.operations.every((operation) => !('command' in operation)), true);
  assert.equal(new Set(first.operations.map((operation) => operation.idempotencyKey)).size, first.operations.length);
});

test('forge plans warn when requested provider capabilities are not native', async () => {
  const { planForgeSync } = await loadPlans();
  assert.equal(typeof planForgeSync, 'function');

  const plan = planForgeSync({
    provider: 'gitea',
    tasks: [],
    requestedCapabilities: ['agentTask', 'discussions']
  });

  assert.equal(plan.ok, true);
  assert.deepEqual(plan.warnings.map((warning) => ({
    capability: warning.capability,
    state: warning.state
  })), [
    { capability: 'agentTask', state: 'unsupported' },
    { capability: 'discussions', state: 'fallback' }
  ]);
});

test('forge sync plan reports duplicate or unsafe stable task identifiers as conflicts', async () => {
  const { planForgeSync } = await loadPlans();
  assert.equal(typeof planForgeSync, 'function');

  const plan = planForgeSync({
    provider: 'github',
    tasks: [
      { id: 'duplicate', title: 'First', status: 'ready' },
      { id: 'duplicate', title: 'Second', status: 'running' },
      { id: 'unsafe -->', title: 'Unsafe marker', status: 'ready' }
    ]
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.task.duplicate-id'), true);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.task.invalid-id'), true);
  assert.deepEqual(plan.operations, []);
});

test('forge sync plan rejects unknown task states instead of silently dropping status labels', async () => {
  const { planForgeSync } = await loadPlans();
  assert.equal(typeof planForgeSync, 'function');

  const plan = planForgeSync({
    provider: 'github',
    tasks: [{ id: 'task-1', title: 'Unknown state', status: 'teleported' }]
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.conflicts.some((conflict) => conflict.id === 'forge.task.invalid-status'), true);
  assert.deepEqual(plan.operations, []);
});

test('forge status has a stable local-only shape when no remote is configured', async () => {
  const { inspectForgeStatus } = await loadForge();
  assert.equal(typeof inspectForgeStatus, 'function');

  const report = inspectForgeStatus();

  assert.deepEqual(Object.keys(report), [
    'schemaVersion',
    'kind',
    'ok',
    'mode',
    'provider',
    'providerSource',
    'candidateProvider',
    'repository',
    'server',
    'auth',
    'permissions',
    'probe',
    'tooling',
    'capabilities',
    'warnings',
    'conflicts'
  ]);
  assert.equal(report.schemaVersion, '2');
  assert.equal(report.kind, 'forge.status');
  assert.equal(report.ok, true);
  assert.deepEqual(report.mode, {
    profile: 'deliver',
    remote: 'local-only',
    policyWrites: false,
    verifiedWrites: false,
    writes: false
  });
  assert.equal(report.provider, 'none');
  assert.equal(report.repository, null);
  assert.deepEqual(report.tooling, {
    git: { command: 'git', available: null, version: null },
    gh: { command: 'gh', available: null, version: null },
    tea: { command: 'tea', available: null, version: null }
  });
  assert.equal(report.capabilities.issues, 'unsupported');
  assert.equal(report.warnings.some((warning) => warning.id === 'forge.remote.missing'), true);
  assert.deepEqual(report.conflicts, []);
});

test('forge status allows known-provider delivery and reports supplied tooling facts', async () => {
  const { inspectForgeStatus } = await loadForge();
  assert.equal(typeof inspectForgeStatus, 'function');

  const report = inspectForgeStatus({
    remoteUrl: 'git@github.com:example/project.git',
    profile: 'deliver',
    tooling: {
      git: { available: true, version: '2.45.1' },
      gh: {
        available: true,
        version: '2.96.0',
        authenticated: true,
        scopes: ['repo', 'read:project'],
        token: 'must-not-be-reported'
      }
    },
    auth: { status: 'authenticated', authenticated: true, source: 'gh', scopes: ['repo', 'read:project'] },
    permissions: { repositoryRead: true, repositoryWrite: true, projects: 'read-only' },
    probe: { status: 'verified', evidence: [{ id: 'github.repository', status: 'pass' }] }
  });

  assert.equal(report.ok, true);
  assert.deepEqual(report.mode, {
    profile: 'deliver',
    remote: 'read-write',
    policyWrites: true,
    verifiedWrites: true,
    writes: true
  });
  assert.equal(report.provider, 'github');
  assert.equal(report.repository.slug, 'example/project');
  assert.equal(report.tooling.git.version, '2.45.1');
  assert.equal(report.tooling.gh.authenticated, true);
  assert.deepEqual(report.tooling.gh.scopes, ['repo', 'read:project']);
  assert.equal('token' in report.tooling.gh, false);
  assert.doesNotMatch(JSON.stringify(report), /must-not-be-reported/);
  assert.equal(report.capabilities.projects, 'read-only');
});

test('forge status blocks writes for unknown providers but permits explicit read-only Gitea inspection', async () => {
  const { inspectForgeStatus } = await loadForge();
  assert.equal(typeof inspectForgeStatus, 'function');

  const unknown = inspectForgeStatus({
    remoteUrl: 'https://code.example.test/example/project.git',
    profile: 'deliver'
  });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.mode.writes, false);
  assert.equal(unknown.conflicts.some((conflict) => conflict.id === 'forge.provider.write-unsafe'), true);

  const gitea = inspectForgeStatus({
    remoteUrl: 'https://code.example.test/example/project.git',
    provider: 'gitea',
    profile: 'deliver',
    remoteReadOnly: true,
    requestedCapabilities: ['projects']
  });
  assert.equal(gitea.ok, true);
  assert.equal(gitea.provider, 'gitea');
  assert.deepEqual(gitea.mode, {
    profile: 'deliver',
    remote: 'read-only',
    policyWrites: false,
    verifiedWrites: false,
    writes: false
  });
  assert.equal(gitea.warnings.some((warning) => (
    warning.id === 'forge.capability.degraded' && warning.capability === 'projects'
  )), true);
});

test('forge index exposes detection, capabilities, transport, and operation planning contracts', async () => {
  const forge = await loadForge();
  assert.equal(typeof forge.detectForgeProvider, 'function');
  assert.equal(typeof forge.getForgeCapabilities, 'function');
  assert.equal(typeof forge.createCommandTransport, 'function');
  assert.equal(typeof forge.retryWithBackoff, 'function');
  assert.equal(typeof forge.planForgeBootstrap, 'function');
  assert.equal(typeof forge.planForgeSync, 'function');
});
