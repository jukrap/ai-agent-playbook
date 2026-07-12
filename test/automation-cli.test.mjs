import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';
import { forgeCoordinationStages, forgeLinksFromCoordination, forgeProgramFromCoordination, forgeTasksFromApprovedPlan, parseArgs, runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const execFileAsync = promisify(execFile);

test('plan new automation creates and validates the workflow.plan.v2 sidecar', async (t) => {
  const target = await fixture(t);
  const created = capture(target);
  assert.equal(await runCli(['plan', 'new', '.', '--automation', '--title', 'Forge Loop', '--date', '2026-07-11'], created), 0);
  const planDir = path.join(target, '.ai-agent-playbook', 'workflows', 'plans');
  const manifestName = (await readdir(planDir)).find((name) => name.endsWith('.plan.json'));
  assert.ok(manifestName);
  const manifestFile = path.join(planDir, manifestName);

  const draft = capture(target);
  assert.equal(await runCli(['plan', 'validate', '.', '--plan', manifestFile, '--json'], draft), 1);
  assert.equal(JSON.parse(draft.out()).ready, false);

  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.approval = { status: 'approved', approvedAt: '2026-07-11T00:00:00.000Z' };
  for (const [index, task] of manifest.tasks.entries()) {
    task.acceptanceCriteria = [{ id: `criterion-${index + 1}`, text: 'The task is complete.' }];
    task.verificationCommands = [{ id: `verify-${index + 1}`, argv: ['node', '--version'] }];
    task.paths = [`src/task-${index + 1}.mjs`];
  }
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const approved = capture(target);
  assert.equal(await runCli(['plan', 'validate', '.', '--plan', manifestFile, '--json'], approved), 0);
  assert.equal(JSON.parse(approved.out()).ready, true);
});

test('automation lifecycle commands persist status and kill switches', async (t) => {
  const target = await fixture(t);
  const manifestFile = path.join(target, 'plan.json');
  await writeFile(manifestFile, `${JSON.stringify(validPlan(), null, 2)}\n`);
  const started = capture(target);
  assert.equal(await runCli(['automation', 'start', '.', '--plan', manifestFile, '--run-id', 'cli-run', '--no-remote', '--json'], started), 0);
  assert.equal(JSON.parse(started.out()).state.runStatus, 'planned');

  const paused = capture(target);
  assert.equal(await runCli(['automation', 'pause', '.', '--run-id', 'cli-run', '--reason', 'operator', '--json'], paused), 0);
  assert.equal(JSON.parse(paused.out()).state.runStatus, 'paused');
  const resumed = capture(target);
  assert.equal(await runCli(['automation', 'resume', '.', '--run-id', 'cli-run', '--json'], resumed), 0);
  assert.equal(JSON.parse(resumed.out()).state.runStatus, 'running');
  const stopped = capture(target);
  assert.equal(await runCli(['automation', 'stop', '.', '--run-id', 'cli-run', '--json'], stopped), 0);
  assert.equal(JSON.parse(stopped.out()).state.runStatus, 'cancelled');

  const status = capture(target);
  assert.equal(await runCli(['automation', 'status', '.', '--run-id', 'cli-run', '--json'], status), 0);
  assert.equal(JSON.parse(status.out()).state.runStatus, 'cancelled');
});

test('forge reconcile apply writes a reviewed pre-claim requirement update to the run ledger', async (t) => {
  const target = await fixture(t);
  const plan = validPlan();
  plan.tasks[0].source = {
    kind: 'forge-issue',
    source: 'forge',
    trust: 'untrusted-data',
    promptPolicy: 'data-only',
    provider: 'github',
    repository: 'example/playbook',
    issueNumber: 77,
    labels: ['aapb:ready'],
    snapshot: {
      title: 'CLI task',
      body: '- [ ] CLI works.',
      acceptanceCriteria: ['CLI works.'],
      updatedAt: '2026-07-11T00:00:00.000Z'
    }
  };
  const manifestFile = path.join(target, 'reconcile-plan.json');
  await writeFile(manifestFile, `${JSON.stringify(plan, null, 2)}\n`);
  const started = capture(target);
  assert.equal(await runCli(['automation', 'start', '.', '--plan', manifestFile, '--run-id', 'reconcile-cli-run', '--no-remote', '--json'], started), 0);

  const localTaskFile = path.join(target, 'local-task.json');
  const remoteIssueFile = path.join(target, 'remote-issue.json');
  await writeFile(localTaskFile, `${JSON.stringify({ id: 'cli-task', status: 'ready', remoteSnapshot: plan.tasks[0].source.snapshot })}\n`);
  await writeFile(remoteIssueFile, `${JSON.stringify({
    number: 77,
    title: 'CLI reconciled',
    body: '- [ ] reconciled CLI criterion',
    acceptanceCriteria: ['reconciled CLI criterion'],
    updatedAt: '2026-07-11T01:00:00.000Z'
  })}\n`);
  const reconciled = capture(target);
  assert.equal(await runCli([
    'forge', 'reconcile', '.',
    '--local-task', localTaskFile,
    '--remote-issue', remoteIssueFile,
    '--run-id', 'reconcile-cli-run',
    '--apply',
    '--json'
  ], reconciled), 0);
  const result = JSON.parse(reconciled.out());
  assert.equal(result.applied, true);
  assert.equal(result.state.tasks[0].title, 'Forge issue #77: CLI reconciled');
});

test('forge status and bootstrap are local-only previews when no remote exists', async (t) => {
  const target = await fixture(t);
  const status = capture(target);
  assert.equal(await runCli(['forge', 'status', '.', '--no-remote', '--json'], status), 0);
  const report = JSON.parse(status.out());
  assert.equal(report.mode.remote, 'local-only');
  assert.equal(report.mode.writes, false);

  const bootstrap = capture(target);
  assert.equal(await runCli(['forge', 'bootstrap', '.', '--provider', 'github', '--milestone', '0.5.4', '--project-title', 'Delivery', '--json'], bootstrap), 0);
  const plan = JSON.parse(bootstrap.out());
  assert.equal(plan.mode.apply, false);
  assert.equal(plan.operations.some((operation) => operation.resource === 'label'), true);
});

test('forge status human output includes server auth permission and verified-write facts', async (t) => {
  const target = await fixture(t);
  const status = capture(target);
  assert.equal(await runCli(['forge', 'status', '.', '--no-remote'], status), 0);
  assert.match(status.out(), /Server:/);
  assert.match(status.out(), /Auth:/);
  assert.match(status.out(), /Repository permission:/);
  assert.match(status.out(), /Writes: policy=false, verified=false/);
  assert.match(status.out(), /Capabilities:/);
});

test('forge bootstrap preview resolves an auto provider from the configured Git remote', async (t) => {
  const target = await fixture(t);
  await execFileAsync('git', ['init'], { cwd: target, windowsHide: true });
  await execFileAsync('git', ['remote', 'add', 'origin', 'https://github.com/example/aapb-preview.git'], { cwd: target, windowsHide: true });

  const bootstrap = capture(target);
  assert.equal(await runCli(['forge', 'bootstrap', '.', '--milestone', '0.5.4', '--json'], bootstrap), 0);
  const plan = JSON.parse(bootstrap.out());
  assert.equal(plan.provider, 'github');
  assert.equal(plan.operations.some((operation) => operation.resource === 'label'), true);
});

test('forge sync apply rejects a draft plan before any forge transport call', async (t) => {
  const target = await fixture(t);
  let requests = 0;
  const server = createServer((_request, response) => {
    requests += 1;
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'transport must not be called' }));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await writeFile(path.join(target, '.ai-agent-playbook', 'config.json'), `${JSON.stringify({
    forge: {
      provider: 'gitea',
      apiBaseUrl: `http://127.0.0.1:${port}/api/v1`
    }
  })}\n`);
  const draft = validPlan();
  draft.approval = { status: 'draft', approvedAt: null };
  const planFile = path.join(target, 'draft-plan.json');
  await writeFile(planFile, `${JSON.stringify(draft, null, 2)}\n`);

  const output = capture(target);
  assert.equal(await runCli(['forge', 'sync', '.', '--plan', planFile, '--apply', '--json'], output), 1);
  const result = JSON.parse(output.out());
  assert.equal(result.applied, false);
  assert.equal(result.operations.length, 0);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'automation.plan.not-approved'), true);
  assert.equal(requests, 0);
});

test('forge bootstrap preview uses configured Korean language for Project view names', async (t) => {
  const target = await fixture(t);
  await writeFile(path.join(target, '.ai-agent-playbook', 'config.json'), `${JSON.stringify({ forge: { language: 'ko' } })}\n`);
  const output = capture(target);
  assert.equal(await runCli([
    'forge', 'bootstrap', '.', '--provider', 'github', '--project-title', '제품 개선', '--json'
  ], output), 0);
  const plan = JSON.parse(output.out());
  assert.deepEqual(
    plan.operations.filter((operation) => operation.resource === 'view').map((operation) => operation.payload.name),
    ['전체', '보드', '로드맵', '주의 필요']
  );
});

test('forge sync blocks approved plans without reviewed coordination metadata', async (t) => {
  const target = await fixture(t);
  const planFile = path.join(target, 'local-only-plan.json');
  await writeFile(planFile, `${JSON.stringify(validPlan(), null, 2)}\n`);

  const output = capture(target);
  assert.equal(await runCli([
    'forge', 'sync', '.', '--plan', planFile, '--provider', 'github', '--no-remote', '--json'
  ], output), 1);
  const result = JSON.parse(output.out());
  assert.equal(result.operations.length, 0);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'forge.coordination.required'), true);
});

test('forge sync forwards complete task contracts and coordination groups to the preview planner', async (t) => {
  const target = await fixture(t);
  const plan = validPlan();
  plan.coordination = {
    issueMode: 'delivery-group',
    projectMode: 'preferred',
    titleStyle: 'noun-phrase',
    maxChildIssues: 6,
    program: {
      title: 'CLI 협업 구조 개선',
      summary: '사람이 검토할 수 있는 원격 작업 구조를 만듭니다.',
      scope: ['delivery group 이슈'],
      nonGoals: ['자동 merge'],
      successCriteria: ['CLI task 검증 통과']
    },
    groups: [{
      id: 'cli',
      title: 'CLI 전달 단위 구축',
      summary: 'CLI 변경을 하나의 검토 단위로 표현합니다.',
      taskIds: ['cli-task'],
      rollback: 'CLI delivery branch를 되돌립니다.'
    }]
  };
  const planFile = path.join(target, 'coordinated-plan.json');
  await writeFile(planFile, `${JSON.stringify(plan, null, 2)}\n`);

  const output = capture(target);
  assert.equal(await runCli([
    'forge', 'sync', '.', '--plan', planFile, '--provider', 'github', '--no-remote', '--json'
  ], output), 0);
  const result = JSON.parse(output.out());
  const group = result.operations.find((operation) => operation.id === 'group:cli:issue');
  assert.ok(group);
  assert.match(group.payload.body, /node --version/);
  assert.match(group.payload.body, /src\/cli-task\.mjs/);
  assert.equal(result.summary.artifacts.groupIssues, 1);
});

test('forge bootstrap uses Gitea OpenAPI capabilities instead of the static provider matrix', async (t) => {
  const target = await fixture(t);
  const server = createServer((request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    if (request.url === '/gitea/api/v1/version') return send(200, { version: '1.26.4' });
    if (request.url === '/gitea/swagger.v1.json') {
      return send(200, {
        info: { title: 'Gitea API', version: '1.26.4' },
        paths: { '/repos/{owner}/{repo}/milestones': { get: {}, post: {} } }
      });
    }
    if (request.url === '/gitea/api/v1/user') return send(200, { login: 'operator' });
    if (request.url === '/gitea/api/v1/repos/owner/repo') {
      return send(200, { permissions: { pull: true, push: true, admin: false } });
    }
    return send(404, { message: 'not found' });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const previousToken = process.env.GITEA_TOKEN;
  process.env.GITEA_TOKEN = 'local-test-token';
  t.after(() => {
    if (previousToken === undefined) delete process.env.GITEA_TOKEN;
    else process.env.GITEA_TOKEN = previousToken;
  });

  await writeFile(path.join(target, '.ai-agent-playbook', 'config.json'), `${JSON.stringify({
    forge: {
      provider: 'gitea',
      apiBaseUrl: `http://127.0.0.1:${port}/gitea/api/v1`
    }
  })}\n`);
  await execFileAsync('git', ['init'], { cwd: target, windowsHide: true });
  await execFileAsync('git', ['remote', 'add', 'origin', `http://127.0.0.1:${port}/gitea/owner/repo.git`], { cwd: target, windowsHide: true });

  const output = capture(target);
  assert.equal(await runCli(['forge', 'bootstrap', '.', '--milestone', '0.5.4', '--project-title', 'Delivery', '--json'], output), 0);
  const plan = JSON.parse(output.out());
  assert.equal(plan.operations.some((operation) => operation.resource === 'milestone'), true);
  assert.equal(plan.operations.some((operation) => operation.resource === 'label'), false);
  assert.equal(plan.operations.some((operation) => operation.resource === 'milestone-label-filter'), false);
  assert.equal(plan.warnings.some((warning) => warning.capability === 'labels' && warning.state === 'unavailable'), true);
});

test('forge bootstrap apply uses the same explicit remote that was previewed', async (t) => {
  const target = await fixture(t);
  const server = createServer((request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/gitea/api/v1/version') return send(200, { version: '1.26.4' });
    if (url.pathname === '/gitea/swagger.v1.json') {
      return send(200, {
        info: { title: 'Gitea API', version: '1.26.4' },
        paths: { '/repos/{owner}/{repo}/labels': { get: {}, post: {} } }
      });
    }
    if (url.pathname === '/gitea/api/v1/user') return send(200, { login: 'operator' });
    if (url.pathname === '/gitea/api/v1/repos/owner/repo') {
      return send(200, { permissions: { pull: true, push: true, admin: false } });
    }
    if (url.pathname === '/gitea/api/v1/repos/owner/repo/labels' && request.method === 'GET') return send(200, []);
    if (url.pathname === '/gitea/api/v1/repos/owner/repo/labels' && request.method === 'POST') return send(201, { id: 1, name: 'managed' });
    return send(404, { message: 'not found' });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const previousToken = process.env.GITEA_TOKEN;
  process.env.GITEA_TOKEN = 'local-explicit-remote-token';
  t.after(() => {
    if (previousToken === undefined) delete process.env.GITEA_TOKEN;
    else process.env.GITEA_TOKEN = previousToken;
  });

  await writeFile(path.join(target, '.ai-agent-playbook', 'config.json'), `${JSON.stringify({
    forge: {
      provider: 'gitea',
      remote: 'origin',
      apiBaseUrl: `http://127.0.0.1:${port}/gitea/api/v1`
    },
    executor: { provider: 'command', command: ['node', '--version'] }
  })}\n`);
  await execFileAsync('git', ['init'], { cwd: target, windowsHide: true });
  await execFileAsync('git', ['remote', 'add', 'origin', 'https://github.com/wrong/repository.git'], { cwd: target, windowsHide: true });
  await execFileAsync('git', ['remote', 'add', 'automation', `http://127.0.0.1:${port}/gitea/owner/repo.git`], { cwd: target, windowsHide: true });

  const output = capture(target);
  assert.equal(await runCli([
    'forge', 'bootstrap', '.',
    '--provider', 'gitea',
    '--remote', 'automation',
    '--apply',
    '--json'
  ], output), 0);
  const result = JSON.parse(output.out());
  assert.equal(result.ok, true);
  assert.equal(result.summary.applied > 0, true);
});

test('unknown capability fallback values fail closed before forge inspection', async (t) => {
  const target = await fixture(t);
  const output = capture(target);
  assert.equal(await runCli([
    'forge', 'bootstrap', '.',
    '--allow-capability-fallback', 'projects,projectz',
    '--json'
  ], output), 1);
  assert.match(output.err(), /Unsupported capability fallback: projectz/);
});

test('automation schedule stays preview-only without apply', async (t) => {
  const target = await fixture(t);
  const output = capture(target);
  assert.equal(await runCli(['automation', 'schedule', '.', '--platform', 'github-actions', '--json'], output), 0);
  const result = JSON.parse(output.out());
  assert.equal(result.applied, false);
  assert.equal(existsSync(path.join(target, '.github', 'workflows', 'aapb-automation.yml')), false);
});

test('schedule serializes natural-language remote denial and apply=false stays preview-only', async (t) => {
  const target = await fixture(t);
  const denied = capture(target);
  assert.equal(await runCli([
    'automation', 'schedule', '.',
    '--platform', 'systemd-user',
    '--instruction', '이번 작업은 GitHub 동기화 금지',
    '--json'
  ], denied), 0);
  const deniedPlan = JSON.parse(denied.out());
  assert.match(deniedPlan.files[0].content, /--no-remote/);

  const falseApply = capture(target);
  assert.equal(await runCli([
    'automation', 'schedule', '.',
    '--platform', 'github-actions',
    '--apply=false',
    '--no-git',
    '--json'
  ], falseApply), 0);
  const preview = JSON.parse(falseApply.out());
  assert.equal(preview.applied, false);
  assert.match(preview.content, /automation tick .*--no-git/);
  assert.equal(existsSync(path.join(target, '.github', 'workflows', 'aapb-automation.yml')), false);
});

test('forge mutation boolean parsing treats apply=false as preview and rejects invalid values', async (t) => {
  const target = await fixture(t);
  const previewOutput = capture(target);
  assert.equal(await runCli([
    'forge', 'bootstrap', '.',
    '--provider', 'github',
    '--apply=false',
    '--json'
  ], previewOutput), 0);
  const preview = JSON.parse(previewOutput.out());
  assert.equal(preview.mode.apply, false);

  const invalid = capture(target);
  assert.equal(await runCli([
    'forge', 'bootstrap', '.',
    '--provider', 'github',
    '--apply=maybe',
    '--json'
  ], invalid), 1);
  assert.match(invalid.err(), /--apply expects true or false/);
});

test('approve-review inline false cannot authorize a high-risk review', () => {
  assert.equal(parseArgs(['--approve-review=false']).flags['approve-review'], false);
  assert.equal(parseArgs(['--approve-review=true']).flags['approve-review'], true);
  assert.throws(() => parseArgs(['--approve-review=maybe']), /--approve-review expects true or false/);
});

test('automation start resumes only incomplete forge coordination stages', () => {
  assert.deepEqual(forgeCoordinationStages({ bootstrap: true, sync: false, links: false }, true), {
    bootstrap: false,
    sync: true
  });
  assert.deepEqual(forgeCoordinationStages({ bootstrap: false, sync: true, links: true }, true), {
    bootstrap: true,
    sync: false
  });
  assert.deepEqual(forgeCoordinationStages({ bootstrap: true, sync: true, links: false }, true), {
    bootstrap: false,
    sync: true
  });
  assert.deepEqual(forgeCoordinationStages({}, false), {
    bootstrap: false,
    sync: true
  });
});

test('group issue coordination links every local task to the shared remote issue', () => {
  const plan = validPlan();
  plan.tasks.push({ ...structuredClone(plan.tasks[0]), id: 'cli-task-two', acceptanceCriteria: [{ id: 'cli-two', text: 'Two works.' }] });
  plan.coordination = {
    issueMode: 'delivery-group',
    groups: [{ id: 'cli', title: 'CLI group', summary: 'CLI group summary.', taskIds: ['cli-task', 'cli-task-two'], rollback: 'Revert.' }]
  };
  const links = forgeLinksFromCoordination({
    sync: {
      results: [{
        operationId: 'group:cli:issue',
        status: 'created',
        resource: { number: 22, title: 'CLI group', body: '<!-- aapb:group:cli -->', labels: [], updated_at: '2026-07-11T00:00:00Z' }
      }]
    }
  }, plan);

  assert.deepEqual(links.map((link) => link.taskId), ['cli-task', 'cli-task-two']);
  assert.equal(links.every((link) => link.issueNumber === 22 && link.groupId === 'cli'), true);
});

test('automation coordination extracts the roadmap issue checkpoint', () => {
  const program = forgeProgramFromCoordination({
    sync: {
      results: [{
        operationId: 'plan:forge-plan:issue',
        status: 'updated',
        resource: { number: 1, title: 'Forge plan', body: 'Roadmap', updated_at: '2026-07-12T00:00:00Z' }
      }]
    }
  }, { planId: 'forge-plan', title: 'Forge plan', coordination: { program: { title: 'Forge plan' } } });

  assert.deepEqual(program, {
    issueNumber: 1,
    title: 'Forge plan',
    body: 'Roadmap',
    updatedAt: '2026-07-12T00:00:00Z'
  });
});

test('automation start derives initial forge group readiness from reducer state', () => {
  const plan = validPlan();
  const state = { tasks: plan.tasks.map((task, index) => ({ ...task, status: index === 0 ? 'ready' : 'planned', criteria: task.acceptanceCriteria })) };
  const tasks = forgeTasksFromApprovedPlan(plan, state);
  assert.deepEqual(tasks.map((task) => task.status), ['ready']);
});

test('space-separated false cannot authorize supersede operations', () => {
  const parsed = parseArgs(['forge', 'reconcile', '.', '--allow-supersede', 'false']);
  assert.equal(parsed.flags['allow-supersede'], false);
  assert.deepEqual(parsed.positionals, ['forge', 'reconcile', '.']);
});

async function fixture(t) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-cli-v2-'));
  await mkdir(path.join(target, '.ai-agent-playbook'), { recursive: true });
  t.after(() => rm(target, { recursive: true, force: true }));
  return target;
}

function validPlan() {
  return {
    schemaVersion: '2',
    kind: 'workflow.plan.v2',
    planId: 'cli-plan',
    title: 'CLI plan',
    approval: { status: 'approved', approvedAt: '2026-07-11T00:00:00.000Z' },
    tasks: [{
      id: 'cli-task',
      title: 'CLI task',
      dependsOn: [],
      priority: 50,
      risk: 'low',
      acceptanceCriteria: [{ id: 'cli-works', text: 'CLI works.' }],
      verificationCommands: [{ id: 'verify-cli', argv: ['node', '--version'] }],
      paths: ['src/cli-task.mjs'],
      deliveryGroup: 'cli',
      remoteEligible: false
    }]
  };
}

function capture(cwd) {
  let stdout = '';
  let stderr = '';
  return {
    cwd,
    repoRoot,
    stdout: { write(value) { stdout += value; } },
    stderr: { write(value) { stderr += value; } },
    out: () => stdout,
    err: () => stderr
  };
}
