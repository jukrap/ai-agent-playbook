import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeliveryBranch,
  buildTaskBranch,
  detectBaseBranch,
  deliverGitChanges,
  prepareCurrentCheckout,
  prepareManagedCheckout,
  selectControllerGitCredential
} from '../src/automation/git-delivery.mjs';

const BASELINE_HEAD = '1'.repeat(40);
const CONTROLLER_COMMIT_HEAD = '2'.repeat(40);

function createCheckoutIdentityTracker(head = BASELINE_HEAD) {
  const branches = new Map();
  return (call) => {
    const invocation = call.args.join(' ');
    if (call.args[0] === 'switch') {
      branches.set(call.cwd, call.args[1] === '-c' ? call.args[2] : call.args[1]);
      return { exitCode: 0, stdout: '', stderr: '' };
    }
    if (invocation === 'branch --show-current' && branches.has(call.cwd)) {
      return { exitCode: 0, stdout: `${branches.get(call.cwd)}\n`, stderr: '' };
    }
    if (invocation === 'rev-parse --verify HEAD') return { exitCode: 0, stdout: `${head}\n`, stderr: '' };
    return null;
  };
}

function deliveryGuardResult(call, calls, branch) {
  const invocation = call.args.join(' ');
  if (invocation === 'branch --show-current') return { exitCode: 0, stdout: `${branch}\n`, stderr: '' };
  if (invocation === 'rev-parse --verify HEAD') {
    const committed = calls.some((candidate) => candidate !== call && candidate.args.includes('commit'));
    return { exitCode: 0, stdout: `${committed ? CONTROLLER_COMMIT_HEAD : BASELINE_HEAD}\n`, stderr: '' };
  }
  if (call.args[0] === 'config' && call.args.includes('--get-regexp')) return { exitCode: 1, stdout: '', stderr: '' };
  if (call.args[0] === 'check-attr') return { exitCode: 0, stdout: '', stderr: '' };
  return null;
}

test('base branch detection prefers remote HEAD and falls back to current branch', async () => {
  const remote = await detectBaseBranch({
    target: 'C:/repo',
    runner: async () => ({ exitCode: 0, stdout: 'origin/trunk\n', stderr: '' })
  });
  assert.equal(remote, 'trunk');
  const calls = [];
  const current = await detectBaseBranch({
    target: 'C:/repo',
    runner: async (call) => {
      calls.push(call);
      return calls.length === 1
        ? { exitCode: 1, stdout: '', stderr: '' }
        : { exitCode: 0, stdout: 'develop\n', stderr: '' };
    }
  });
  assert.equal(current, 'develop');
});

test('interactive checkout creates a task branch without cleaning unrelated changes', async () => {
  const calls = [];
  const identity = createCheckoutIdentityTracker();
  const result = await prepareCurrentCheckout({
    target: 'C:/repo',
    branch: 'aapb/task-one',
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: call.args[0] === 'branch' ? 'feature/current\n' : '', stderr: '' };
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.workspace, path.resolve('C:/repo'));
  assert.equal(calls.some((call) => call.args.join(' ') === 'switch -c aapb/task-one'), true);
  assert.equal(calls.some((call) => ['reset', 'clean', 'checkout'].includes(call.args[0]) || call.args.includes('--force')), false);
});

test('interactive checkout refuses an embedded-credential remote before worker-visible mutation', async () => {
  const calls = [];
  const token = 'interactive-secret-token';
  const result = await prepareCurrentCheckout({
    target: 'C:/repo',
    branch: 'aapb/task-one',
    runner: async (call) => {
      calls.push(call);
      if (call.args.includes('--get-regexp')) return { exitCode: 1, stdout: '', stderr: '' };
      if (call.args[0] === 'remote') return { exitCode: 0, stdout: `https://automation:${token}@example.invalid/owner/repo.git\n`, stderr: '' };
      return { exitCode: 0, stdout: 'C:/repo\n', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.remote.credentials-embedded');
  assert.doesNotMatch(JSON.stringify(result), new RegExp(token));
  assert.equal(calls.some((call) => ['switch', 'add', 'commit', 'push'].includes(call.args[0])), false);
});

test('interactive checkout refuses an explicit push URL before starting a worker', async () => {
  const calls = [];
  const result = await prepareCurrentCheckout({
    target: 'C:/repo',
    branch: 'aapb/task-one',
    runner: async (call) => {
      calls.push(call);
      if (call.args.includes('--get-regexp')) return { exitCode: 1, stdout: '', stderr: '' };
      if (call.args.join(' ') === 'remote get-url origin') return { exitCode: 0, stdout: 'https://example.invalid/owner/repo.git\n', stderr: '' };
      if (call.args[0] === 'config') return { exitCode: 0, stdout: 'https://push.example.invalid/owner/repo.git\n', stderr: '' };
      return { exitCode: 0, stdout: 'C:/repo\n', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.remote.push-url-configured');
  assert.equal(calls.some((call) => call.args[0] === 'switch'), false);
});

test('task branches are portable bounded and namespaced', () => {
  assert.equal(buildTaskBranch({ taskId: 'TASK 001', title: '한글 Feature / unsafe..name' }), 'aapb/task-001-한글-feature-unsafe-name');
  assert.equal(buildTaskBranch({ taskId: '../main', title: 'x' }).startsWith('aapb/'), true);
  assert.equal(buildTaskBranch({ taskId: '../main', title: 'x' }).includes('..'), false);
  assert.equal(buildTaskBranch({ taskId: 'task', title: 'x'.repeat(300) }).length <= 120, true);
  assert.equal(buildDeliveryBranch({ planId: 'plan-one', taskId: 'task-1', title: '첫 작업', deliveryGroup: 'state-engine' }), 'aapb/plan-one-state-engine-delivery');
  assert.equal(buildDeliveryBranch({ planId: 'plan-one', taskId: 'task-2', title: '둘째 작업', deliveryGroup: 'state-engine' }), 'aapb/plan-one-state-engine-delivery');
  assert.notEqual(buildDeliveryBranch({ planId: 'plan-two', taskId: 'task-2', title: '둘째 작업', deliveryGroup: 'state-engine' }), 'aapb/plan-one-state-engine-delivery');
});

test('unattended checkout clones into cache without switching or cleaning the dirty user checkout', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-user-checkout-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-managed-cache-'));
  const calls = [];
  const identity = createCheckoutIdentityTracker();
  const runner = async (call) => {
    calls.push(call);
    const identityResult = identity(call);
    if (identityResult) return identityResult;
    if (call.args.join(' ') === 'remote get-url origin') return { exitCode: 0, stdout: 'https://example.invalid/owner/repo.git\n', stderr: '' };
    if (call.args.join(' ') === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
    if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
    if (call.args[0] === 'ls-remote') return { exitCode: 2, stdout: '', stderr: '' };
    if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
    return { exitCode: 0, stdout: '', stderr: '' };
  };

  const result = await prepareManagedCheckout({
    target,
    remote: 'origin',
    branch: 'aapb/task-001-state-engine',
    baseBranch: 'main',
    cacheRoot,
    runner
  });

  assert.equal(result.ok, true);
  assert.equal(result.workspace.startsWith(cacheRoot), true);
  assert.equal(calls.some((call) => call.args.join(' ') === 'config --unset-all remote.origin.pushurl'), true);
  assert.equal(calls.some((call) => call.args.join(' ') === 'config --unset-all credential.helper'), true);
  assert.equal(calls.some((call) => call.cwd === target && ['switch', 'checkout', 'reset', 'clean'].includes(call.args[0])), false);
  assert.equal(calls.some((call) => call.args.includes('--force')), false);
  assert.equal(calls.every((call) => call.shell === false), true);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('different task branches use separate managed checkouts to avoid cross-run branch races', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-managed-isolation-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-managed-isolation-cache-'));
  const identity = createCheckoutIdentityTracker();
  const runner = async (call) => {
    const identityResult = identity(call);
    if (identityResult) return identityResult;
    if (call.args.join(' ') === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
    if (call.args.join(' ') === 'remote get-url origin') return { exitCode: 0, stdout: 'https://example.invalid/owner/repo.git\n', stderr: '' };
    if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
    if (call.args[0] === 'ls-remote') return { exitCode: 2, stdout: '', stderr: '' };
    if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
    return { exitCode: 0, stdout: '', stderr: '' };
  };

  const first = await prepareManagedCheckout({ target, branch: 'aapb/task-one', baseBranch: 'main', cacheRoot, runner });
  const second = await prepareManagedCheckout({ target, branch: 'aapb/task-two', baseBranch: 'main', cacheRoot, runner });
  const isolated = await prepareManagedCheckout({
    target,
    branch: 'aapb/task-one',
    baseBranch: 'main',
    cacheRoot,
    isolationKey: 'second-run',
    runner
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(isolated.ok, true);
  assert.notEqual(first.workspace, second.workspace);
  assert.notEqual(first.workspace, isolated.workspace);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('fresh managed checkout reuses an existing remote task branch as its tracking base', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-remote-branch-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-remote-branch-cache-'));
  const branch = 'aapb/task-001-state-engine';
  const calls = [];
  const identity = createCheckoutIdentityTracker();
  const result = await prepareManagedCheckout({
    target,
    branch,
    baseBranch: 'main',
    cacheRoot,
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      const invocation = call.args.join(' ');
      if (invocation === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (invocation === 'remote get-url origin') return { exitCode: 0, stdout: 'https://example.invalid/owner/repo.git\n', stderr: '' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args[0] === 'ls-remote') return { exitCode: 0, stdout: 'abc123\trefs/heads/aapb/task-001-state-engine\n', stderr: '' };
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(calls.some((call) => call.args.join(' ') === `ls-remote --exit-code --heads origin refs/heads/${branch}`), true);
  assert.equal(calls.some((call) => call.args.join(' ') === `fetch origin refs/heads/${branch}:refs/remotes/origin/${branch}`), true);
  assert.equal(calls.some((call) => call.args.join(' ') === `switch -c ${branch} origin/${branch}`), true);
  assert.equal(calls.some((call) => ['reset', 'clean'].includes(call.args[0]) || call.args.includes('--force')), false);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('managed checkout strips embedded credentials before storing the fetch URL', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-credential-url-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-credential-url-cache-'));
  const token = 'embedded-secret-token';
  const queryToken = 'query-secret-token';
  const calls = [];
  const identity = createCheckoutIdentityTracker();
  const result = await prepareManagedCheckout({
    target,
    branch: 'aapb/task-credential-safety',
    baseBranch: 'main',
    cacheRoot,
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      if (call.args.join(' ') === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (call.args.join(' ') === 'remote get-url origin') return { exitCode: 0, stdout: `https://automation:${token}@example.invalid/owner/repo.git?token=${queryToken}\n`, stderr: '' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args[0] === 'ls-remote') return { exitCode: 2, stdout: '', stderr: '' };
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  const setUrl = calls.find((call) => call.args[0] === 'remote' && call.args[1] === 'set-url');
  assert.equal(result.ok, true);
  assert.deepEqual(setUrl.args, ['remote', 'set-url', 'origin', 'https://example.invalid/owner/repo.git']);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(`${token}|${queryToken}`));
  assert.equal(calls.slice(1).every((call) => !JSON.stringify(call.args).includes(token) && !JSON.stringify(call.args).includes(queryToken)), true);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('managed checkout injects controller credentials only into private remote read calls', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-private-read-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-private-read-cache-'));
  const branch = 'aapb/task-private-read';
  const token = 'github_pat_private_read_123456789';
  const encodedCredential = Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64');
  const calls = [];
  const inspectedUrls = [];
  const identity = createCheckoutIdentityTracker();
  const result = await prepareManagedCheckout({
    target,
    branch,
    baseBranch: 'main',
    cacheRoot,
    selectCredential: (remoteUrl) => {
      inspectedUrls.push(remoteUrl);
      return { username: 'x-access-token', token };
    },
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      const invocation = call.args.join(' ');
      if (invocation === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (invocation === 'remote get-url origin') return { exitCode: 0, stdout: 'https://legacy:embedded-secret@github.com/owner/repo.git?token=old-query-secret\n', stderr: '' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args.includes('--get-regexp')) return { exitCode: 1, stdout: '', stderr: '' };
      if (call.args[0] === 'config') return { exitCode: 5, stdout: '', stderr: '' };
      if (call.args[0] === 'ls-remote') return { exitCode: 0, stdout: `abc123\trefs/heads/${branch}\n`, stderr: '' };
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  const remoteReads = calls.filter((call) => call.args[0] === 'fetch' || call.args[0] === 'ls-remote');
  assert.equal(result.ok, true);
  assert.deepEqual(inspectedUrls, ['https://github.com/owner/repo.git']);
  assert.equal(remoteReads.length, 3);
  assert.equal(remoteReads.every((call) => call.env?.GIT_CONFIG_VALUE_1 === `Authorization: Basic ${encodedCredential}`), true);
  assert.equal(calls.filter((call) => !remoteReads.includes(call)).every((call) => call.env === undefined), true);
  assert.equal(calls.every((call) => !JSON.stringify(call.args).includes(token)), true);
  assert.equal(calls.every((call) => !JSON.stringify(call.args).includes('embedded-secret') && !JSON.stringify(call.args).includes('old-query-secret')), true);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(`${token}|${encodedCredential}|embedded-secret|old-query-secret`));
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('managed checkout redacts controller credentials from private fetch failures', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-private-read-failure-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-private-read-failure-cache-'));
  const token = 'gitea-private-read-token-123456789';
  const encodedCredential = Buffer.from(`oauth2:${token}`, 'utf8').toString('base64');
  const result = await prepareManagedCheckout({
    target,
    branch: 'aapb/task-private-read-failure',
    baseBranch: 'main',
    cacheRoot,
    selectCredential: () => ({ username: 'oauth2', token }),
    runner: async (call) => {
      if (call.args.join(' ') === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (call.args.join(' ') === 'remote get-url origin') return { exitCode: 0, stdout: 'https://gitea.example/owner/repo.git\n', stderr: '' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args.includes('--get-regexp')) return { exitCode: 1, stdout: '', stderr: '' };
      if (call.args[0] === 'config') return { exitCode: 5, stdout: '', stderr: '' };
      if (call.args[0] === 'fetch') return { exitCode: 1, stdout: '', stderr: `Authorization: Basic ${encodedCredential} ${token}` };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.fetch.failed');
  assert.doesNotMatch(JSON.stringify(result), new RegExp(`${token}|${encodedCredential}`));
  assert.match(result.conflicts[0].message, /\[REDACTED\]/);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('existing managed task branch only fast-forwards from its remote counterpart', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-existing-branch-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-existing-branch-cache-'));
  const branch = 'aapb/task-002-forge-sync';
  const calls = [];
  const identity = createCheckoutIdentityTracker();
  const result = await prepareManagedCheckout({
    target,
    branch,
    baseBranch: 'main',
    cacheRoot,
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      const invocation = call.args.join(' ');
      if (invocation === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (invocation === 'remote get-url origin') return { exitCode: 0, stdout: 'https://example.invalid/owner/repo.git\n', stderr: '' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args[0] === 'ls-remote') return { exitCode: 0, stdout: `abc123\trefs/heads/${branch}\n`, stderr: '' };
      if (call.args[0] === 'show-ref') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(calls.some((call) => call.args.join(' ') === `switch ${branch}`), true);
  assert.equal(calls.some((call) => call.args.join(' ') === `merge --ff-only origin/${branch}`), true);
  assert.equal(calls.some((call) => ['reset', 'rebase'].includes(call.args[0]) || call.args.includes('--force')), false);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('unattended checkout can stay local when no remote is configured', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-local-checkout-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-local-cache-'));
  const calls = [];
  const identity = createCheckoutIdentityTracker();
  const result = await prepareManagedCheckout({
    target,
    branch: 'aapb/local-task',
    baseBranch: 'main',
    cacheRoot,
    allowMissingRemote: true,
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      if (call.args.join(' ') === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (call.args[0] === 'remote' && call.args[1] === 'get-url') return { exitCode: 2, stdout: '', stderr: 'missing' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.remoteUrl, null);
  assert.equal(calls.some((call) => call.args[0] === 'fetch'), false);
  assert.equal(calls.some((call) => call.args.join(' ') === 'switch -c aapb/local-task main'), true);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('managed checkout never contacts or exposes a configured remote when network delivery is denied', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-network-denied-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-network-denied-cache-'));
  const calls = [];
  let credentialSelections = 0;
  const identity = createCheckoutIdentityTracker();
  const result = await prepareManagedCheckout({
    target,
    branch: 'aapb/network-denied',
    baseBranch: 'main',
    cacheRoot,
    networkAllowed: false,
    allowMissingRemote: true,
    selectCredential: () => { credentialSelections += 1; return { username: 'x-access-token', token: 'must-not-be-read' }; },
    runner: async (call) => {
      calls.push(call);
      const identityResult = identity(call);
      if (identityResult) return identityResult;
      if (call.args.join(' ') === 'remote get-url origin') {
        return { exitCode: 0, stdout: 'https://github.com/example/private.git\n', stderr: '' };
      }
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.remoteUrl, null);
  assert.equal(credentialSelections, 0);
  assert.equal(calls.some((call) => ['fetch', 'ls-remote'].includes(call.args[0])), false);
  assert.equal(calls.some((call) => call.args.join(' ') === 'remote set-url origin https://github.com/example/private.git'), false);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('managed checkout records the selected task branch baseline HEAD', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-baseline-source-'));
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-baseline-cache-'));
  const branch = 'aapb/baseline-task';
  const result = await prepareManagedCheckout({
    target,
    branch,
    baseBranch: 'main',
    cacheRoot,
    allowMissingRemote: true,
    runner: async (call) => {
      const invocation = call.args.join(' ');
      if (invocation === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: `${target}\n`, stderr: '' };
      if (invocation === 'remote get-url origin') return { exitCode: 2, stdout: '', stderr: 'missing' };
      if (call.args[0] === 'clone') await mkdir(call.args.at(-1), { recursive: true });
      if (call.args[0] === 'show-ref') return { exitCode: 1, stdout: '', stderr: '' };
      if (invocation === 'branch --show-current') return { exitCode: 0, stdout: `${branch}\n`, stderr: '' };
      if (invocation === 'rev-parse --verify HEAD') return { exitCode: 0, stdout: `${BASELINE_HEAD}\n`, stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.baselineHead, BASELINE_HEAD);
  await rm(target, { recursive: true, force: true });
  await rm(cacheRoot, { recursive: true, force: true });
});

test('controller refuses delivery after the worker switches away from the task branch', async () => {
  const calls = [];
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch: 'aapb/task-branch-guard',
    baselineHead: BASELINE_HEAD,
    allowedPaths: ['src/change.mjs'],
    commitMessage: 'feat(automation): branch guard',
    autoPush: false,
    runner: async (call) => {
      calls.push(call);
      if (call.args.join(' ') === 'branch --show-current') return { exitCode: 0, stdout: 'worker-branch\n', stderr: '' };
      if (call.args.join(' ') === 'rev-parse --verify HEAD') return { exitCode: 0, stdout: `${BASELINE_HEAD}\n`, stderr: '' };
      if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/change.mjs\0', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.branch.changed');
  assert.equal(calls.some((call) => ['status', 'add', 'commit', 'push'].includes(call.args[0])), false);
});

test('controller refuses a worker-created commit even when Git status is clean', async () => {
  const calls = [];
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch: 'aapb/task-head-guard',
    baselineHead: BASELINE_HEAD,
    allowedPaths: ['src/change.mjs'],
    commitMessage: 'feat(automation): head guard',
    autoPush: false,
    runner: async (call) => {
      calls.push(call);
      if (call.args.join(' ') === 'branch --show-current') return { exitCode: 0, stdout: 'aapb/task-head-guard\n', stderr: '' };
      if (call.args.join(' ') === 'rev-parse --verify HEAD') return { exitCode: 0, stdout: `${CONTROLLER_COMMIT_HEAD}\n`, stderr: '' };
      if (call.args[0] === 'status') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.head.changed');
  assert.equal(calls.some((call) => ['status', 'add', 'commit', 'push'].includes(call.args[0])), false);
});

test('controller fails closed when worker-local Git config can execute commands', async () => {
  const calls = [];
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch: 'aapb/task-config-guard',
    baselineHead: BASELINE_HEAD,
    allowedPaths: ['src/change.mjs'],
    commitMessage: 'feat(automation): config guard',
    autoPush: false,
    runner: async (call) => {
      calls.push(call);
      if (call.args.join(' ') === 'branch --show-current') return { exitCode: 0, stdout: 'aapb/task-config-guard\n', stderr: '' };
      if (call.args.join(' ') === 'rev-parse --verify HEAD') return { exitCode: 0, stdout: `${BASELINE_HEAD}\n`, stderr: '' };
      if (call.args[0] === 'config' && call.args.includes('--get-regexp')) return { exitCode: 0, stdout: 'worktree\tfile:.git/config.worktree\tcore.askpass\n', stderr: '' };
      if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/change.mjs\0', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.config.execution-risk');
  assert.equal(calls.some((call) => ['status', 'add', 'commit', 'push'].includes(call.args[0])), false);
});

test('committed delivery resume fails explicitly when its external checkout disappeared', async () => {
  const missingWorkspace = path.join(os.tmpdir(), `aapb-missing-checkout-${Date.now()}`);
  const calls = [];
  const result = await deliverGitChanges({
    workspace: missingWorkspace,
    branch: 'aapb/task-resume',
    baselineHead: BASELINE_HEAD,
    resumeCommitHead: CONTROLLER_COMMIT_HEAD,
    allowedPaths: ['src/change.mjs'],
    commitMessage: 'feat(automation): resume',
    runner: async (call) => {
      calls.push(call);
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.workspace.missing');
  assert.equal(calls.length, 0);
});

test('controller explicitly stages allowed paths and pushes without force', async () => {
  const calls = [];
  const branch = 'aapb/task-001-state-engine';
  const runner = async (call) => {
    calls.push(call);
    const guardResult = deliveryGuardResult(call, calls, branch);
    if (guardResult) return guardResult;
    if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/a.mjs\0?? test/a.test.mjs\0', stderr: '' };
    if (call.args.join(' ') === 'remote get-url --push origin') return { exitCode: 0, stdout: 'https://example.invalid/owner/repo.git\n', stderr: '' };
    return { exitCode: 0, stdout: '', stderr: '' };
  };
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    remote: 'origin',
    allowedPaths: ['src/a.mjs', 'test/a.test.mjs'],
    commitMessage: 'feat(automation): 재개 가능한 상태 엔진 추가',
    runner
  });

  assert.equal(result.ok, true);
  const add = calls.find((call) => call.args[0] === 'add');
  assert.deepEqual(add.args, ['add', '--', 'src/a.mjs', 'test/a.test.mjs']);
  const push = calls.find((call) => call.args[0] === 'push');
  assert.deepEqual(push.args, ['push', '--set-upstream', 'origin', 'aapb/task-001-state-engine']);
  assert.equal(calls.some((call) => call.args.includes('--force') || call.args.includes('-f')), false);
});

test('controller injects HTTPS token only into the push environment and redacts failures', async () => {
  const token = 'github_pat_controller_only_123456789';
  const encodedCredential = Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64');
  const calls = [];
  const branch = 'aapb/task-003-secure-push';
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    remote: 'origin',
    allowedPaths: ['src/secure.mjs'],
    commitMessage: 'feat(automation): controller 전용 push 인증 추가',
    credential: { username: 'x-access-token', token },
    expectedRemoteUrl: 'https://github.example/owner/repo.git',
    runner: async (call) => {
      calls.push(call);
      const guardResult = deliveryGuardResult(call, calls, branch);
      if (guardResult) return guardResult;
      if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/secure.mjs\0', stderr: '' };
      if (call.args.join(' ') === 'remote get-url --push origin') return { exitCode: 0, stdout: 'https://github.example/owner/repo.git\n', stderr: '' };
      if (call.args[0] === 'push') return { exitCode: 1, stdout: '', stderr: `Authorization: Basic ${encodedCredential} ${token}` };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  const push = calls.find((call) => call.args[0] === 'push');
  assert.ok(push);
  assert.deepEqual(push.args, ['push', '--set-upstream', 'origin', 'aapb/task-003-secure-push']);
  assert.equal(push.env.GIT_TERMINAL_PROMPT, '0');
  assert.equal(push.env.GIT_CONFIG_VALUE_0, '');
  assert.equal(push.env.GIT_CONFIG_VALUE_1, `Authorization: Basic ${encodedCredential}`);
  assert.equal(calls.filter((call) => call !== push).every((call) => call.env === undefined), true);
  assert.equal(calls.every((call) => !JSON.stringify(call.args).includes(token)), true);
  assert.equal(calls.every((call) => !JSON.stringify(call.args).includes(encodedCredential)), true);
  assert.equal(result.ok, false);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(`${token}|${encodedCredential}`));
  assert.match(result.conflicts[0].message, /\[REDACTED\]/);
});

test('controller does not inject an HTTPS token into an SSH push', async () => {
  const token = 'github_pat_not_for_ssh_123456789';
  const calls = [];
  const branch = 'aapb/task-004-ssh-push';
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    remote: 'origin',
    allowedPaths: ['src/ssh.mjs'],
    commitMessage: 'feat(automation): SSH 전달 경계 확인',
    credential: { username: 'x-access-token', token },
    expectedRemoteUrl: 'git@example.invalid:owner/repo.git',
    runner: async (call) => {
      calls.push(call);
      const guardResult = deliveryGuardResult(call, calls, branch);
      if (guardResult) return guardResult;
      if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/ssh.mjs\0', stderr: '' };
      if (call.args.join(' ') === 'remote get-url --push origin') return { exitCode: 0, stdout: 'git@example.invalid:owner/repo.git\n', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  const push = calls.find((call) => call.args[0] === 'push');
  assert.equal(result.ok, true);
  assert.deepEqual(push.env, { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' });
  assert.doesNotMatch(JSON.stringify(push), new RegExp(token));
});

test('controller refuses a worker-modified push URL before attaching credentials', async () => {
  const token = 'github_pat_must_not_reach_attacker_123456789';
  const calls = [];
  const branch = 'aapb/remote-tamper';
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    remote: 'origin',
    allowedPaths: ['src/change.mjs'],
    commitMessage: 'feat(automation): remote tamper 경계',
    credential: { username: 'x-access-token', token },
    expectedRemoteUrl: 'https://github.com/owner/repo.git',
    runner: async (call) => {
      calls.push(call);
      const guardResult = deliveryGuardResult(call, calls, branch);
      if (guardResult) return guardResult;
      if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/change.mjs\0', stderr: '' };
      if (call.args.join(' ') === 'remote get-url --push origin') return { exitCode: 0, stdout: 'https://attacker.example/repo.git\n', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.push-url.changed');
  assert.equal(calls.some((call) => call.args[0] === 'push'), false);
  assert.doesNotMatch(JSON.stringify(calls), new RegExp(token));
});

test('controller treats an explicitly checkpointed missing remote as immutable during delivery', async () => {
  const calls = [];
  const branch = 'aapb/remote-added-after-checkpoint';
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    remote: 'origin',
    allowedPaths: ['src/change.mjs'],
    commitMessage: 'feat(automation): missing remote checkpoint',
    expectedRemoteUrl: null,
    runner: async (call) => {
      calls.push(call);
      const guardResult = deliveryGuardResult(call, calls, branch);
      if (guardResult) return guardResult;
      if (call.args[0] === 'status') return { exitCode: 0, stdout: ' M src/change.mjs\0', stderr: '' };
      if (call.args.join(' ') === 'remote get-url --push origin') {
        return { exitCode: 0, stdout: 'https://attacker.example/repo.git\n', stderr: '' };
      }
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.push-url.changed');
  assert.equal(calls.some((call) => call.args[0] === 'push'), false);
});

test('controller credential selection follows provider-specific token precedence', () => {
  const github = selectControllerGitCredential({
    provider: 'github',
    env: { GH_TOKEN: 'gh-primary', GITHUB_TOKEN: 'gh-secondary', GITEA_TOKEN: 'gitea' }
  });
  assert.deepEqual(github, { username: 'x-access-token', token: 'gh-primary' });
  const gitea = selectControllerGitCredential({
    provider: 'gitea',
    env: { GITEA_TOKEN: 'gitea-primary', AAPB_FORGE_TOKEN: 'gitea-secondary' }
  });
  assert.deepEqual(gitea, { username: 'oauth2', token: 'gitea-primary' });
  assert.deepEqual(selectControllerGitCredential({ provider: 'github', env: { GH_TOKEN: '', GITHUB_TOKEN: 'gh-fallback' } }), { username: 'x-access-token', token: 'gh-fallback' });
  assert.equal(selectControllerGitCredential({ provider: 'github', env: { GH_TOKEN: 'bad\ntoken' } }), null);
});

test('controller blocks unowned changes protected branches and no-git policy without mutation', async () => {
  const calls = [];
  const branch = 'aapb/task-001';
  const runner = async (call) => {
    calls.push(call);
    const guardResult = deliveryGuardResult(call, calls, branch);
    if (guardResult) return guardResult;
    return { exitCode: 0, stdout: ' M src/a.mjs\0 M .env\0', stderr: '' };
  };
  const unowned = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    allowedPaths: ['src/a.mjs'],
    commitMessage: 'feat: 안전 전달',
    runner
  });
  assert.equal(unowned.ok, false);
  assert.equal(unowned.conflicts[0].id, 'git.change.unowned');
  assert.equal(calls.some((call) => call.args[0] === 'add'), false);

  const protectedCalls = [];
  const protectedResult = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch: 'main',
    allowedPaths: [],
    commitMessage: 'feat: 금지',
    runner: async (call) => { protectedCalls.push(call); return { exitCode: 0, stdout: '', stderr: '' }; }
  });
  assert.equal(protectedResult.ok, false);
  assert.equal(protectedCalls.length, 0);

  const noGitCalls = [];
  const noGit = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch: 'aapb/task-001',
    noGit: true,
    runner: async (call) => { noGitCalls.push(call); return { exitCode: 0, stdout: '', stderr: '' }; }
  });
  assert.equal(noGit.ok, true);
  assert.equal(noGit.skipped, true);
  assert.equal(noGitCalls.length, 0);
});

test('controller validates and explicitly stages both paths of a porcelain rename', async () => {
  const calls = [];
  const branch = 'aapb/task-rename';
  const result = await deliverGitChanges({
    workspace: 'C:/managed/repo',
    branch,
    baselineHead: BASELINE_HEAD,
    allowedPaths: ['src/new.mjs'],
    commitMessage: 'refactor: 파일 이름 정리',
    autoPush: false,
    runner: async (call) => {
      calls.push(call);
      const guardResult = deliveryGuardResult(call, calls, branch);
      if (guardResult) return guardResult;
      if (call.args[0] === 'status') {
        return { exitCode: 0, stdout: 'R  src/new.mjs\0private/old.mjs\0', stderr: '' };
      }
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.change.unowned');
  assert.deepEqual(result.changedPaths, ['src/new.mjs', 'private/old.mjs']);
  assert.equal(calls.some((call) => call.args[0] === 'add'), false);
});

test('interactive delivery preserves unrelated staged and unstaged user work and commits only owned paths with controller identity', async (t) => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-interactive-index-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  const git = (args) => execFileSync('git', args, { cwd: target, encoding: 'utf8' }).trim();
  git(['init']);
  await writeFile(path.join(target, 'task.txt'), 'base task\n');
  await writeFile(path.join(target, 'user.txt'), 'base user\n');
  await writeFile(path.join(target, 'user-unstaged.txt'), 'base unstaged user\n');
  git(['add', 'task.txt', 'user.txt', 'user-unstaged.txt']);
  git(['-c', 'user.name=Base', '-c', 'user.email=base@example.invalid', 'commit', '-m', 'base']);
  git(['switch', '-c', 'aapb/index-safety']);
  await writeFile(path.join(target, 'user.txt'), 'user staged work\n');
  git(['add', 'user.txt']);
  await writeFile(path.join(target, 'user-unstaged.txt'), 'user unstaged work\n');

  const prepared = await prepareCurrentCheckout({
    target,
    branch: 'aapb/index-safety',
    protectedPaths: ['task.txt']
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.preexistingChanges.some((change) => change.path === 'user.txt'), true);
  assert.equal(prepared.preexistingChanges.some((change) => change.path === 'user-unstaged.txt'), true);

  await writeFile(path.join(target, 'task.txt'), 'controller task work\n');
  const delivered = await deliverGitChanges({
    workspace: target,
    branch: 'aapb/index-safety',
    baselineHead: prepared.baselineHead,
    allowedPaths: ['task.txt'],
    preexistingChanges: prepared.preexistingChanges,
    commitMessage: 'feat(automation): owned path only',
    autoPush: false
  });
  assert.equal(delivered.ok, true);
  assert.deepEqual(git(['show', '--name-only', '--pretty=format:', 'HEAD']).split(/\r?\n/).filter(Boolean), ['task.txt']);
  assert.equal(git(['diff', '--cached', '--name-only']), 'user.txt');
  assert.equal(git(['diff', '--name-only']), 'user-unstaged.txt');
  assert.equal(git(['show', '-s', '--format=%ae', 'HEAD']), 'aapb-controller@localhost.invalid');
});

test('controller blocks exact model credential egress before staging changed files', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-secret-egress-'));
  const target = path.join(root, 'repository');
  const workspace = path.join(root, 'workspace-link');
  await mkdir(target);
  await symlink(target, workspace, process.platform === 'win32' ? 'junction' : 'dir');
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = (args) => execFileSync('git', args, { cwd: target, encoding: 'utf8' }).trim();
  git(['init']);
  await writeFile(path.join(target, 'task.txt'), 'base\n');
  git(['add', 'task.txt']);
  git(['-c', 'user.name=Base', '-c', 'user.email=base@example.invalid', 'commit', '-m', 'base']);
  git(['switch', '-c', 'aapb/secret-egress']);
  const baselineHead = git(['rev-parse', 'HEAD']);
  const secret = 'sk-proj-controller-only-123456789';
  await writeFile(path.join(target, 'task.txt'), `accidental ${secret}\n`);
  const delivered = await deliverGitChanges({
    workspace,
    branch: 'aapb/secret-egress',
    baselineHead,
    allowedPaths: ['task.txt'],
    sensitiveValues: [secret],
    commitMessage: 'feat(automation): must not commit secret',
    autoPush: false
  });
  assert.equal(delivered.ok, false);
  assert.equal(delivered.conflicts[0].id, 'git.secret-egress.detected');
  assert.doesNotMatch(JSON.stringify(delivered), new RegExp(secret));
  assert.equal(git(['diff', '--cached', '--name-only']), '');
});

test('interactive retry rejects a remote URL changed after the trusted workspace checkpoint', async (t) => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-remote-checkpoint-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  const git = (args) => execFileSync('git', args, { cwd: target, encoding: 'utf8' }).trim();
  git(['init']);
  await writeFile(path.join(target, 'task.txt'), 'base\n');
  git(['add', 'task.txt']);
  git(['-c', 'user.name=Base', '-c', 'user.email=base@example.invalid', 'commit', '-m', 'base']);
  git(['switch', '-c', 'aapb/remote-checkpoint']);
  git(['remote', 'add', 'origin', 'https://github.com/example/repo.git']);
  const prepared = await prepareCurrentCheckout({ target, branch: 'aapb/remote-checkpoint', protectedPaths: ['task.txt'] });
  assert.equal(prepared.ok, true);
  git(['remote', 'set-url', 'origin', 'https://attacker.example/repo.git']);
  const retry = await prepareCurrentCheckout({
    target,
    branch: 'aapb/remote-checkpoint',
    protectedPaths: ['task.txt'],
    expectedHead: prepared.baselineHead,
    expectedRemoteUrl: prepared.remoteUrl
  });
  assert.equal(retry.ok, false);
  assert.equal(retry.conflicts[0].id, 'git.remote.changed');
});

test('interactive retry rejects a new unrelated path outside the trusted dirty checkpoint', async (t) => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-dirty-checkpoint-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  const git = (args) => execFileSync('git', args, { cwd: target, encoding: 'utf8' }).trim();
  git(['init']);
  await writeFile(path.join(target, 'task.txt'), 'base\n');
  git(['add', 'task.txt']);
  git(['-c', 'user.name=Base', '-c', 'user.email=base@example.invalid', 'commit', '-m', 'base']);
  git(['switch', '-c', 'aapb/dirty-checkpoint']);
  const prepared = await prepareCurrentCheckout({
    target,
    branch: 'aapb/dirty-checkpoint',
    protectedPaths: ['task.txt']
  });
  assert.equal(prepared.ok, true);
  assert.deepEqual(prepared.preexistingChanges, []);

  await writeFile(path.join(target, 'worker-unrelated.txt'), 'must not become trusted\n');
  const retry = await prepareCurrentCheckout({
    target,
    branch: 'aapb/dirty-checkpoint',
    protectedPaths: ['task.txt'],
    expectedHead: prepared.baselineHead,
    expectedRemoteUrl: prepared.remoteUrl,
    expectedPreexistingChanges: prepared.preexistingChanges
  });
  assert.equal(retry.ok, false);
  assert.equal(retry.conflicts[0].id, 'git.preexisting-change-set.modified');
  assert.deepEqual(retry.paths, ['worker-unrelated.txt']);
});

test('interactive retry rejects a remote added after a trusted missing-remote checkpoint', async () => {
  const calls = [];
  const result = await prepareCurrentCheckout({
    target: 'C:/repo',
    branch: 'aapb/missing-remote-checkpoint',
    protectedPaths: ['task.txt'],
    expectedRemoteUrl: null,
    runner: async (call) => {
      calls.push(call);
      const invocation = call.args.join(' ');
      if (invocation === 'rev-parse --show-toplevel') return { exitCode: 0, stdout: 'C:/repo\n', stderr: '' };
      if (call.args[0] === 'config' && call.args.includes('--get-regexp')) return { exitCode: 1, stdout: '', stderr: '' };
      if (invocation === 'remote get-url origin') return { exitCode: 0, stdout: 'https://attacker.example/repo.git\n', stderr: '' };
      if (call.args[0] === 'config' && call.args.includes('--get-all')) return { exitCode: 1, stdout: '', stderr: '' };
      if (call.args[0] === 'status') return { exitCode: 0, stdout: '', stderr: '' };
      if (invocation === 'branch --show-current') return { exitCode: 0, stdout: 'aapb/missing-remote-checkpoint\n', stderr: '' };
      if (invocation === 'rev-parse --verify HEAD') return { exitCode: 0, stdout: `${BASELINE_HEAD}\n`, stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts[0].id, 'git.remote.changed');
  assert.equal(calls.some((call) => ['switch', 'add', 'commit', 'push'].includes(call.args[0])), false);
});
