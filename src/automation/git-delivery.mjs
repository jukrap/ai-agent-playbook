import { existsSync } from 'node:fs';
import { lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const PROTECTED_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'release']);
const GIT_OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i;
const EXECUTABLE_LOCAL_CONFIG = '^(alias\\.|commit\\.gpgsign$|core\\.(askpass|attributesfile|fsmonitor|hookspath|sshcommand)$|credential\\.|diff\\..*\\.textconv$|filter\\..*\\.(clean|process|smudge)$|gpg\\.|http\\.|include(if)?\\.|remote\\..*\\.(receivepack|uploadpack)$|submodule\\..*\\.update$|url\\..*\\.(insteadof|pushinsteadof)$)';

export function buildTaskBranch(options) {
  const prefix = normalizeBranchPrefix(options.prefix ?? 'aapb/');
  const taskId = branchSlug(options.taskId ?? 'task').slice(0, 50) || 'task';
  const title = branchSlug(options.title ?? 'task').slice(0, 70) || 'task';
  return `${prefix}${taskId}-${title}`.slice(0, 120).replace(/[./-]+$/g, '');
}

export function buildDeliveryBranch(options) {
  const namespace = typeof options.planId === 'string' && options.planId.trim()
    ? options.planId.trim()
    : typeof options.runId === 'string' && options.runId.trim()
      ? options.runId.trim()
      : typeof options.taskId === 'string' && options.taskId.trim()
        ? options.taskId.trim()
        : 'plan';
  const deliveryGroup = typeof options.deliveryGroup === 'string' && options.deliveryGroup.trim()
    ? options.deliveryGroup.trim()
    : null;
  return buildTaskBranch({
    prefix: options.prefix,
    taskId: deliveryGroup ? `${namespace}-${deliveryGroup}` : `${namespace}-${options.taskId ?? 'task'}`,
    title: deliveryGroup ? 'delivery' : options.title
  });
}

export async function detectBaseBranch(options) {
  const remote = options.remote ?? 'origin';
  if (!isSafeGitName(remote)) throw new Error('Remote name is unsafe.');
  const runner = deadlineRunner(options.runner ?? runGit, options.deadlineAt, options.signal);
  const target = path.resolve(options.target);
  const remoteHead = await runner(gitCall(target, ['symbolic-ref', '--quiet', '--short', `refs/remotes/${remote}/HEAD`]));
  if (remoteHead.exitCode === 0) {
    const value = String(remoteHead.stdout).trim();
    const prefix = `${remote}/`;
    if (value.startsWith(prefix) && isSafeGitName(value.slice(prefix.length))) return value.slice(prefix.length);
  }
  const current = await runner(gitCall(target, ['branch', '--show-current']));
  const branch = String(current.stdout ?? '').trim();
  if (current.exitCode === 0 && isSafeGitName(branch)) return branch;
  return 'main';
}

export async function prepareCurrentCheckout(options) {
  const hooksPath = await mkdtemp(path.join(os.tmpdir(), 'aapb-controller-hooks-'));
  try {
    return await prepareCurrentCheckoutGuarded(options, hooksPath);
  } finally {
    await rm(hooksPath, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function prepareCurrentCheckoutGuarded(options, hooksPath) {
  const target = path.resolve(options.target);
  const branch = options.branch;
  const remote = options.remote ?? 'origin';
  const baseRunner = deadlineRunner(options.runner ?? runGit, options.deadlineAt, options.signal);
  const runner = (call) => baseRunner({ ...call, hooksPath });
  if (!isAutomationBranch(branch)) return gitFailure('git.branch.unsafe', 'Interactive checkout requires an aapb/ task branch.');
  if (!isSafeGitName(remote)) return gitFailure('git.remote.unsafe', 'Remote name is unsafe.');
  const root = await runner(gitCall(target, ['rev-parse', '--show-toplevel']));
  if (root.exitCode !== 0) return gitFailure('git.repository.missing', root.stderr || 'Target is not a Git repository.');
  const executableConfig = await inspectExecutableLocalConfig({ workspace: target, runner, hooksPath: null });
  if (!executableConfig.ok) return executableConfig;
  const remoteResult = await runner(gitCall(target, ['remote', 'get-url', remote]));
  const rawRemoteUrl = remoteResult.exitCode === 0 ? String(remoteResult.stdout).trim() : null;
  if (rawRemoteUrl && hasEmbeddedHttpCredentials(rawRemoteUrl)) {
    return gitFailure('git.remote.credentials-embedded', 'Interactive automation refuses a remote URL that exposes credentials to the worker.');
  }
  const remoteUrl = rawRemoteUrl ? credentialFreeRemoteUrl(rawRemoteUrl) : null;
  if (rawRemoteUrl && !remoteUrl) return gitFailure('git.remote.url-unsafe', 'Remote URL is not safe for an automation worker.');
  if (Object.hasOwn(options, 'expectedRemoteUrl') && canonicalRemoteUrl(remoteUrl) !== canonicalRemoteUrl(options.expectedRemoteUrl)) {
    return gitFailure('git.remote.changed', 'The interactive checkout remote changed after its trusted workspace checkpoint was recorded.');
  }
  const configuredPushUrls = await runner(gitCall(target, ['config', '--get-all', `remote.${remote}.pushurl`]));
  if (configuredPushUrls.exitCode === 0 && String(configuredPushUrls.stdout ?? '').trim()) {
    return gitFailure('git.remote.push-url-configured', 'Interactive automation refuses a configured push URL that would be visible to the worker.');
  }
  if (![0, 1].includes(configuredPushUrls.exitCode)) {
    return gitFailure('git.remote.push-url-inspect-failed', configuredPushUrls.stderr || 'Could not inspect the interactive checkout push URL.');
  }
  const dirty = await runner(gitCall(target, ['status', '--porcelain=v1', '-z', '--untracked-files=all']));
  if (dirty.exitCode !== 0) return gitFailure('git.workspace.inspect-failed', dirty.stderr || 'Could not inspect the interactive checkout.');
  const dirtyPaths = parsePorcelainPaths(dirty.stdout);
  const protectedPaths = (Array.isArray(options.protectedPaths) ? options.protectedPaths : []).map(normalizeOwnedPath).filter(Boolean);
  const overlapping = dirtyPaths.filter((changed) => protectedPaths.some((owned) => changed === owned || changed.startsWith(`${owned}/`) || owned.startsWith(`${changed}/`)));
  if (overlapping.length > 0) {
    return {
      ...gitFailure('git.workspace.dirty-owned', 'Interactive automation refuses pre-existing changes inside task-owned paths so user edits cannot be committed as worker output.'),
      paths: overlapping
    };
  }
  const current = await runner(gitCall(target, ['branch', '--show-current']));
  const currentBranch = String(current.stdout ?? '').trim();
  if (current.exitCode === 0 && currentBranch === branch) {
    const identity = await inspectCheckoutIdentity({ workspace: target, branch, runner });
    if (!identity.ok) return identity;
    const expected = verifyPreparedHead(identity.head, options.expectedHead);
    if (!expected.ok) return expected;
    const preexisting = await resolvePreexistingChanges({
      workspace: target,
      paths: dirtyPaths,
      expected: Object.hasOwn(options, 'expectedPreexistingChanges') ? options.expectedPreexistingChanges : undefined,
      runner,
      hooksPath
    });
    if (!preexisting.ok) return preexisting;
    return { schemaVersion: '2', kind: 'automation.current-checkout.v2', ok: true, workspace: target, branch, baselineHead: identity.head, remoteUrl, preexistingChanges: preexisting.changes, reused: true, operations: [], conflicts: [] };
  }
  const branchCheck = await runner(gitCall(target, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]));
  const switchArgs = branchCheck.exitCode === 0 ? ['switch', branch] : ['switch', '-c', branch];
  const switched = await runner(gitCall(target, switchArgs));
  if (switched.exitCode !== 0) return gitFailure('git.branch.failed', switched.stderr || 'Could not select the interactive task branch.');
  const identity = await inspectCheckoutIdentity({ workspace: target, branch, runner });
  if (!identity.ok) return identity;
  const expected = verifyPreparedHead(identity.head, options.expectedHead);
  if (!expected.ok) return expected;
  const preexisting = await resolvePreexistingChanges({
    workspace: target,
    paths: dirtyPaths,
    expected: Object.hasOwn(options, 'expectedPreexistingChanges') ? options.expectedPreexistingChanges : undefined,
    runner,
    hooksPath
  });
  if (!preexisting.ok) return preexisting;
  return {
    schemaVersion: '2',
    kind: 'automation.current-checkout.v2',
    ok: true,
    workspace: target,
    branch,
    baselineHead: identity.head,
    remoteUrl,
    preexistingChanges: preexisting.changes,
    reused: branchCheck.exitCode === 0,
    operations: [branchCheck.exitCode === 0 ? 'reuse-branch' : 'create-branch'],
    conflicts: []
  };
}

function branchSlug(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/\.{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function prepareManagedCheckout(options) {
  const hooksPath = await mkdtemp(path.join(os.tmpdir(), 'aapb-controller-hooks-'));
  try {
    return await prepareManagedCheckoutGuarded(options, hooksPath);
  } finally {
    await rm(hooksPath, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function prepareManagedCheckoutGuarded(options, hooksPath) {
  const {
    target,
    remote = 'origin',
    branch,
    baseBranch = 'main',
    cacheRoot = defaultCacheRoot(),
    networkAllowed = true,
    runner: suppliedRunner = runGit
  } = options;
  const baseRunner = deadlineRunner(suppliedRunner, options.deadlineAt, options.signal);
  const runner = (call) => baseRunner({ ...call, hooksPath });
  const resolvedTarget = path.resolve(target);
  if (!isAutomationBranch(branch)) return gitFailure('git.branch.unsafe', 'Managed checkout requires an aapb/ task branch.');
  if (!isSafeGitName(remote) || !isSafeGitName(baseBranch)) return gitFailure('git.name.unsafe', 'Remote or base branch is unsafe.');

  const rootCheck = await runner(gitCall(resolvedTarget, ['rev-parse', '--show-toplevel']));
  if (rootCheck.exitCode !== 0) return gitFailure('git.repository.missing', rootCheck.stderr || 'Target is not a Git repository.');
  const remoteResult = await runner(gitCall(resolvedTarget, ['remote', 'get-url', remote]));
  if (remoteResult.exitCode !== 0 && !options.allowMissingRemote) return gitFailure('git.remote.missing', remoteResult.stderr || `Remote ${remote} is not configured.`);
  const rawRemoteUrl = remoteResult.exitCode === 0 ? String(remoteResult.stdout).trim() : null;
  const remoteUrl = networkAllowed && rawRemoteUrl ? credentialFreeRemoteUrl(rawRemoteUrl) : null;
  if (networkAllowed && rawRemoteUrl && !remoteUrl) return gitFailure('git.remote.url-unsafe', 'Remote URL is not safe for a managed checkout.');
  if (networkAllowed && Object.hasOwn(options, 'expectedRemoteUrl') && canonicalRemoteUrl(remoteUrl) !== canonicalRemoteUrl(options.expectedRemoteUrl)) {
    return gitFailure('git.remote.changed', 'The repository remote changed after its trusted managed-workspace checkpoint was recorded.');
  }
  let remoteCredential = null;
  if (remoteUrl && typeof options.selectCredential === 'function') {
    let selectedCredential;
    try {
      selectedCredential = options.selectCredential(remoteUrl);
    } catch {
      return gitFailure('git.remote.credential-selection-failed', 'Could not select a controller credential for the managed checkout.');
    }
    remoteCredential = normalizeControllerCredential(selectedCredential);
    if (selectedCredential && !remoteCredential) {
      return gitFailure('git.remote.credential-invalid', 'Selected controller credential is invalid.');
    }
  }
  const remoteEnvironment = remoteUrl
    ? buildControllerNetworkEnvironment(remoteUrl, remoteCredential, 'read')
    : { ok: true, env: undefined };
  if (!remoteEnvironment.ok) return gitFailure(remoteEnvironment.id, remoteEnvironment.message);
  const cacheKey = createHash('sha256')
    .update(`${remote}\0${remoteUrl ?? resolvedTarget}\0${branch}\0${String(options.isolationKey ?? 'default')}`)
    .digest('hex')
    .slice(0, 20);
  const workspace = path.join(path.resolve(cacheRoot), cacheKey);
  await mkdir(path.dirname(workspace), { recursive: true });

  const operations = [];
  if (!existsSync(workspace)) {
    const cloned = await runner(gitCall(path.dirname(workspace), ['clone', '--no-checkout', '--origin', remote, resolvedTarget, workspace]));
    if (cloned.exitCode !== 0) return gitFailure('git.clone.failed', cloned.stderr || 'Could not create managed checkout.');
    operations.push('clone');
  }
  const executableConfig = await inspectExecutableLocalConfig({ workspace, runner, hooksPath: null });
  if (!executableConfig.ok) return executableConfig;
  if (remoteUrl) {
    const setUrl = await runner(gitCall(workspace, ['remote', 'set-url', remote, remoteUrl]));
    if (setUrl.exitCode !== 0) return gitFailure('git.remote.update-failed', setUrl.stderr || 'Could not configure managed checkout remote.');
    const clearedPushUrl = await runner(gitCall(workspace, ['config', '--unset-all', `remote.${remote}.pushurl`]));
    if (![0, 1, 5].includes(clearedPushUrl.exitCode)) return gitFailure('git.push-url.clear-failed', clearedPushUrl.stderr || 'Could not remove the managed checkout push URL.');
    if (clearedPushUrl.exitCode === 0) operations.push('clear-push-url');
    const clearedHelper = await runner(gitCall(workspace, ['config', '--unset-all', 'credential.helper']));
    if (![0, 1, 5].includes(clearedHelper.exitCode)) return gitFailure('git.credential-helper.clear-failed', clearedHelper.stderr || 'Could not remove the managed checkout credential helper.');
    if (clearedHelper.exitCode === 0) operations.push('clear-credential-helper');
    const fetched = await runner({ ...gitCall(workspace, ['fetch', remote, baseBranch]), env: remoteEnvironment.env });
    if (fetched.exitCode !== 0) return gitFailure('git.fetch.failed', redactGitOutput(fetched.stderr || 'Could not fetch the base branch.', remoteCredential));
  }
  let remoteBranchExists = false;
  if (remoteUrl) {
    const remoteBranch = await runner({ ...gitCall(workspace, ['ls-remote', '--exit-code', '--heads', remote, `refs/heads/${branch}`]), env: remoteEnvironment.env });
    if (remoteBranch.exitCode === 0) {
      remoteBranchExists = true;
      const fetchedBranch = await runner({ ...gitCall(workspace, ['fetch', remote, `refs/heads/${branch}:refs/remotes/${remote}/${branch}`]), env: remoteEnvironment.env });
      if (fetchedBranch.exitCode !== 0) return gitFailure('git.branch-fetch.failed', redactGitOutput(fetchedBranch.stderr || 'Could not fetch the existing remote task branch.', remoteCredential));
      operations.push('fetch-task-branch');
    } else if (remoteBranch.exitCode !== 2) {
      return gitFailure('git.branch-inspect.failed', redactGitOutput(remoteBranch.stderr || 'Could not inspect the remote task branch.', remoteCredential));
    }
  }
  const branchCheck = await runner(gitCall(workspace, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]));
  const localBranchExists = branchCheck.exitCode === 0;
  const switchArgs = localBranchExists
    ? ['switch', branch]
    : ['switch', '-c', branch, remoteBranchExists ? `${remote}/${branch}` : remoteUrl ? `${remote}/${baseBranch}` : baseBranch];
  const switched = await runner(gitCall(workspace, switchArgs));
  if (switched.exitCode !== 0) return gitFailure('git.branch.failed', switched.stderr || 'Could not select the task branch.');
  operations.push(localBranchExists ? 'reuse-branch' : remoteBranchExists ? 'reuse-remote-branch' : 'create-branch');
  if (localBranchExists && remoteBranchExists) {
    const fastForwarded = await runner(gitCall(workspace, ['merge', '--ff-only', `${remote}/${branch}`]));
    if (fastForwarded.exitCode !== 0) return gitFailure('git.branch-diverged', fastForwarded.stderr || 'The managed task branch cannot be fast-forwarded from its remote counterpart.');
    operations.push('fast-forward-branch');
  }
  const identity = await inspectCheckoutIdentity({ workspace, branch, runner });
  if (!identity.ok) return identity;
  const expected = verifyPreparedHead(identity.head, options.expectedHead);
  if (!expected.ok) return expected;

  return {
    schemaVersion: '2',
    kind: 'automation.managed-checkout.v2',
    ok: true,
    workspace,
    branch,
    baseBranch,
    baselineHead: identity.head,
    remote,
    remoteUrl: remoteUrl ? redactRemoteUrl(remoteUrl) : null,
    operations,
    conflicts: []
  };
}

export async function deliverGitChanges(options) {
  if (options.noGit) return { schemaVersion: '2', kind: 'automation.git-delivery.v2', ok: true, skipped: true, reason: 'no-git', operations: [], conflicts: [] };
  const hooksPath = await mkdtemp(path.join(os.tmpdir(), 'aapb-controller-hooks-'));
  try {
    return await deliverGitChangesGuarded(options, hooksPath);
  } finally {
    await rm(hooksPath, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function deliverGitChangesGuarded(options, hooksPath) {
  const {
    workspace,
    branch,
    remote = 'origin',
    allowedPaths = [],
    commitMessage,
    autoCommit = true,
    autoPush = true,
    credential = null,
    expectedRemoteUrl = null,
    baselineHead = null,
    resumeCommitHead = null,
    onCommitted,
    runner: suppliedRunner = runGit
  } = options;
  const runner = deadlineRunner(suppliedRunner, options.deadlineAt, options.signal);
  const hasExpectedRemoteCheckpoint = Object.hasOwn(options, 'expectedRemoteUrl');
  if (!isAutomationBranch(branch) || PROTECTED_BRANCHES.has(branch)) {
    return gitFailure('git.branch.protected', 'Git delivery is restricted to aapb/ task branches.');
  }
  if (!isSafeGitName(remote)) return gitFailure('git.remote.unsafe', 'Remote name is unsafe.');
  if (!normalizeGitOid(baselineHead)) return gitFailure('git.head.baseline-missing', 'Git delivery requires the baseline HEAD recorded when the controller prepared the task workspace.');
  if (resumeCommitHead !== null && !normalizeGitOid(resumeCommitHead)) {
    return gitFailure('git.head.checkpoint-invalid', 'The committed delivery checkpoint does not contain a valid commit OID.');
  }
  if (resumeCommitHead && !existsSync(path.resolve(workspace))) {
    return gitFailure('git.workspace.missing', 'The external managed checkout recorded by the committed delivery checkpoint no longer exists; restore that checkout or recover the commit from reviewed evidence before retrying.');
  }
  const normalizedCredential = normalizeControllerCredential(credential);
  if (credential && !normalizedCredential) return gitFailure('git.credential.invalid', 'Controller Git credential is invalid.');
  const normalizedAllowed = allowedPaths.map(normalizeOwnedPath);
  if (normalizedAllowed.some((value) => !value)) return gitFailure('git.path.unsafe', 'Allowed paths must be portable project-relative paths.');
  if (autoCommit && !isSafeCommitMessage(commitMessage)) return gitFailure('git.commit-message.invalid', 'Commit message must be a non-empty single line without credentials.');

  if (autoPush && !autoCommit) return gitFailure('git.delivery.invalid-mode', 'Automatic push requires controller-owned commit creation.');
  const expectedDeliveryHead = normalizeGitOid(resumeCommitHead) ?? normalizeGitOid(baselineHead);
  const identity = await inspectCheckoutIdentity({ workspace, branch, runner, hooksPath });
  if (!identity.ok) return identity;
  if (identity.head !== expectedDeliveryHead) {
    return gitFailure(
      'git.head.changed',
      resumeCommitHead
        ? 'The committed task checkout no longer points at the controller-recorded commit; refusing recovery.'
        : 'The worker changed HEAD before controller delivery; worker-created commits and history rewrites are not accepted.'
    );
  }
  if (resumeCommitHead) {
    const ancestry = await runner(guardGitCall(workspace, ['merge-base', '--is-ancestor', normalizeGitOid(baselineHead), normalizeGitOid(resumeCommitHead)], hooksPath));
    if (ancestry.exitCode !== 0) {
      return gitFailure('git.head.checkpoint-diverged', 'The controller-recorded commit is not descended from the prepared workspace baseline.');
    }
  }
  const riskyConfig = await inspectExecutableLocalConfig({ workspace, runner, hooksPath });
  if (!riskyConfig.ok) return riskyConfig;
  const status = await runner(guardGitCall(workspace, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], hooksPath));
  if (status.exitCode !== 0) return gitFailure('git.status.failed', status.stderr || 'Could not inspect Git changes.');
  let changedPaths = parsePorcelainPaths(status.stdout);
  const preexisting = await unchangedPreexistingPaths({
    workspace,
    snapshots: options.preexistingChanges,
    runner,
    hooksPath
  });
  if (!preexisting.ok) return preexisting;
  changedPaths = changedPaths.filter((changed) => !preexisting.unchanged.has(changed));
  const unowned = changedPaths.filter((changed) => !normalizedAllowed.some((allowed) => changed === allowed || changed.startsWith(`${allowed}/`)));
  if (unowned.length) {
    return {
      ...gitFailure('git.change.unowned', `Refusing to stage changes outside the task ownership set: ${unowned.join(', ')}.`),
      changedPaths,
      unowned
    };
  }
  const secretScan = await inspectChangedFilesForSecrets({
    workspace,
    changedPaths,
    sensitiveValues: options.sensitiveValues
  });
  if (!secretScan.ok) return secretScan;
  if (resumeCommitHead && changedPaths.length > 0) {
    return gitFailure('git.resume.dirty', 'A committed delivery checkpoint can be resumed only from its unchanged controller-recorded checkout.');
  }
  const filterRisk = await inspectPathFilterRisk({ workspace, changedPaths, runner, hooksPath });
  if (!filterRisk.ok) return filterRisk;
  let pushEnvironment;
  if (autoPush) {
    const pushRemote = await runner(guardGitCall(workspace, ['remote', 'get-url', '--push', remote], hooksPath));
    if (pushRemote.exitCode !== 0) return gitFailure('git.push-url.missing', pushRemote.stderr || `Remote ${remote} does not have a push URL.`);
    const pushUrl = String(pushRemote.stdout ?? '').trim();
    if (!pushUrl) return gitFailure('git.push-url.missing', `Remote ${remote} does not have a push URL.`);
    if (hasEmbeddedHttpCredentials(pushUrl)) {
      return gitFailure('git.push-url.credentials-embedded', 'Refusing a push URL that contains embedded credentials.');
    }
    if (!isSupportedPushUrl(pushUrl)) return gitFailure('git.push-url.unsafe', 'Push URL must use HTTPS or SSH without shell-style remote helpers.');
    if (hasExpectedRemoteCheckpoint && canonicalRemoteUrl(pushUrl) !== canonicalRemoteUrl(expectedRemoteUrl)) {
      return gitFailure('git.push-url.changed', 'The worker-visible Git remote changed after the controller prepared the checkout; refusing to send credentials or push.');
    }
    if (normalizedCredential && !expectedRemoteUrl) {
      return gitFailure('git.push-url.unverified', 'A controller credential requires a trusted expected remote URL.');
    }
    const preparedEnvironment = buildControllerNetworkEnvironment(pushUrl, normalizedCredential, 'push');
    if (!preparedEnvironment.ok) return gitFailure(preparedEnvironment.id, preparedEnvironment.message);
    pushEnvironment = preparedEnvironment.env;
  }

  const operations = [];
  if (changedPaths.length === 0) {
    if (!autoPush) {
      return {
        schemaVersion: '2',
        kind: 'automation.git-delivery.v2',
        ok: true,
        skipped: true,
        reason: 'no-changes',
        branch,
        baselineHead: normalizeGitOid(baselineHead),
        commitHead: identity.head,
        operations,
        changedPaths,
        conflicts: []
      };
    }
    const pushed = await runner({ ...guardGitCall(workspace, ['push', '--set-upstream', remote, branch], hooksPath), env: pushEnvironment });
    if (pushed.exitCode !== 0) return gitFailure('git.push.failed', redactGitOutput(pushed.stderr || 'Could not push the existing task commit.', normalizedCredential));
    operations.push('push');
    return {
      schemaVersion: '2',
      kind: 'automation.git-delivery.v2',
      ok: true,
      skipped: false,
      reason: 'existing-commit-pushed',
      branch,
      baselineHead: normalizeGitOid(baselineHead),
      commitHead: identity.head,
      changedPaths,
      operations,
      conflicts: []
    };
  }
  const staged = await runner(guardGitCall(workspace, ['add', '--', ...changedPaths], hooksPath));
  if (staged.exitCode !== 0) return gitFailure('git.stage.failed', staged.stderr || 'Could not explicitly stage task files.');
  operations.push('stage');
  if (autoCommit) {
    const commitIdentity = normalizeCommitIdentity(options.commitIdentity);
    const committed = await runner(guardGitCall(workspace, [
      '-c', `user.name=${commitIdentity.name}`,
      '-c', `user.email=${commitIdentity.email}`,
      'commit', '--only', '-m', commitMessage, '--', ...changedPaths
    ], hooksPath));
    if (committed.exitCode !== 0) return gitFailure('git.commit.failed', committed.stderr || 'Could not commit task files.');
    operations.push('commit');
    const committedIdentity = await inspectCheckoutIdentity({ workspace, branch, runner, hooksPath });
    if (!committedIdentity.ok) return committedIdentity;
    const ancestry = await runner(guardGitCall(workspace, ['merge-base', '--is-ancestor', normalizeGitOid(baselineHead), committedIdentity.head], hooksPath));
    if (ancestry.exitCode !== 0) return gitFailure('git.commit.diverged', 'The controller-created commit is not descended from the prepared workspace baseline.');
    identity.head = committedIdentity.head;
    if (typeof onCommitted === 'function') {
      try {
        await onCommitted({
          branch,
          baselineHead: normalizeGitOid(baselineHead),
          commitHead: committedIdentity.head,
          changedPaths: [...changedPaths],
          operations: [...operations]
        });
      } catch (error) {
        return gitFailure('git.commit-checkpoint.failed', `The commit was created but its delivery checkpoint failed: ${redactGitOutput(error?.message ?? error, normalizedCredential)}`);
      }
    }
  }
  if (autoPush) {
    const pushed = await runner({ ...guardGitCall(workspace, ['push', '--set-upstream', remote, branch], hooksPath), env: pushEnvironment });
    if (pushed.exitCode !== 0) return gitFailure('git.push.failed', redactGitOutput(pushed.stderr || 'Could not push the task branch.', normalizedCredential));
    operations.push('push');
  }
  return {
    schemaVersion: '2',
    kind: 'automation.git-delivery.v2',
    ok: true,
    skipped: false,
    branch,
    baselineHead: normalizeGitOid(baselineHead),
    commitHead: identity.head,
    changedPaths,
    operations,
    conflicts: []
  };
}

async function inspectCheckoutIdentity({ workspace, branch, runner, hooksPath = null }) {
  const current = await runner(hooksPath
    ? guardGitCall(workspace, ['branch', '--show-current'], hooksPath)
    : gitCall(workspace, ['branch', '--show-current']));
  if (current.exitCode !== 0) return gitFailure('git.branch.inspect-failed', current.stderr || 'Could not inspect the current task branch.');
  if (String(current.stdout ?? '').trim() !== branch) {
    return gitFailure('git.branch.changed', 'The task checkout is no longer on the controller-selected aapb/ branch.');
  }
  const head = await runner(hooksPath
    ? guardGitCall(workspace, ['rev-parse', '--verify', 'HEAD'], hooksPath)
    : gitCall(workspace, ['rev-parse', '--verify', 'HEAD']));
  const oid = normalizeGitOid(head.stdout);
  if (head.exitCode !== 0 || !oid) return gitFailure('git.head.inspect-failed', head.stderr || 'Could not inspect a valid task HEAD OID.');
  return { ok: true, head: oid };
}

function verifyPreparedHead(actualHead, expectedHead) {
  if (expectedHead === null || expectedHead === undefined) return { ok: true };
  const normalized = normalizeGitOid(expectedHead);
  if (!normalized) return gitFailure('git.head.checkpoint-invalid', 'The stored workspace checkpoint does not contain a valid baseline HEAD OID.');
  if (actualHead !== normalized) {
    return gitFailure('git.head.changed', 'The task branch HEAD changed after the controller recorded its pre-worker baseline; explicit recovery is required.');
  }
  return { ok: true };
}

async function inspectExecutableLocalConfig({ workspace, runner, hooksPath }) {
  const result = await runner(guardGitCall(workspace, [
    'config',
    '--no-includes',
    '--show-origin',
    '--show-scope',
    '--name-only',
    '--get-regexp',
    EXECUTABLE_LOCAL_CONFIG
  ], hooksPath));
  if (result.exitCode === 1 || (result.exitCode === 0 && !String(result.stdout ?? '').trim())) return { ok: true };
  if (result.exitCode !== 0) return gitFailure('git.config.inspect-failed', result.stderr || 'Could not inspect local Git execution-capable configuration.');
  const keys = String(result.stdout)
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((line) => {
      const [scope, , ...keyParts] = line.split('\t');
      if (keyParts.length === 0) return { scope: 'local', key: line };
      return { scope, key: keyParts.join('\t') };
    })
    .filter((entry) => ['local', 'worktree'].includes(entry.scope))
    .map((entry) => `${entry.scope}:${entry.key}`)
    .slice(0, 20);
  if (keys.length === 0) return { ok: true };
  return gitFailure('git.config.execution-risk', `Refusing local Git configuration that can execute commands or redirect authenticated transport: ${keys.join(', ')}.`);
}

async function inspectPathFilterRisk({ workspace, changedPaths, runner, hooksPath }) {
  if (changedPaths.length === 0) return { ok: true };
  const result = await runner(guardGitCall(workspace, ['check-attr', '-z', 'filter', '--', ...changedPaths], hooksPath));
  if (result.exitCode !== 0) return gitFailure('git.attributes.inspect-failed', result.stderr || 'Could not inspect Git clean-filter attributes for changed paths.');
  const entries = String(result.stdout ?? '').split('\0');
  for (let index = 0; index + 2 < entries.length; index += 3) {
    const value = entries[index + 2];
    if (value && !['unspecified', 'unset'].includes(value)) {
      return gitFailure('git.attributes.filter-risk', `Refusing changed path ${entries[index]} because a Git clean filter could execute outside the controller review boundary.`);
    }
  }
  return { ok: true };
}

export function selectControllerGitCredential(options = {}) {
  const env = options.env ?? process.env;
  if (options.provider === 'github') {
    return firstValidCredential('x-access-token', [env.GH_TOKEN, env.GITHUB_TOKEN]);
  }
  if (options.provider === 'gitea') {
    return firstValidCredential('oauth2', [env.GITEA_TOKEN, env.AAPB_FORGE_TOKEN]);
  }
  return null;
}

function parsePorcelainPaths(output) {
  if (!output) return [];
  const entries = String(output).split('\0').filter(Boolean);
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    const rawPath = entry.slice(3);
    const normalized = normalizeOwnedPath(rawPath);
    if (normalized) paths.push(normalized);
    if ((status.includes('R') || status.includes('C')) && entries[index + 1]) {
      const originalPath = normalizeOwnedPath(entries[index + 1]);
      if (originalPath) paths.push(originalPath);
      index += 1;
    }
  }
  return [...new Set(paths)];
}

async function fingerprintPreexistingChanges({ workspace, paths, runner, hooksPath }) {
  const normalized = [...new Set((Array.isArray(paths) ? paths : []).map(normalizeOwnedPath).filter(Boolean))];
  if (normalized.length > 500) return gitFailure('git.workspace.dirty-limit', 'Interactive automation supports at most 500 pre-existing changed paths.');
  const changes = [];
  for (const changedPath of normalized) {
    const fingerprint = await fingerprintWorkspacePath({ workspace, changedPath, runner, hooksPath });
    if (!fingerprint.ok) return fingerprint;
    changes.push({ path: changedPath, fingerprint: fingerprint.value });
  }
  return { ok: true, changes };
}

async function resolvePreexistingChanges({ workspace, paths, expected, runner, hooksPath }) {
  if (expected === undefined) {
    return fingerprintPreexistingChanges({ workspace, paths, runner, hooksPath });
  }
  const verified = await unchangedPreexistingPaths({ workspace, snapshots: expected, runner, hooksPath });
  if (!verified.ok) return verified;
  const currentPaths = new Set((Array.isArray(paths) ? paths : []).map(normalizeOwnedPath).filter(Boolean));
  const unexpected = [...currentPaths].filter((changedPath) => !verified.unchanged.has(changedPath));
  if (unexpected.length > 0 || verified.unchanged.size !== currentPaths.size) {
    return {
      ...gitFailure('git.preexisting-change-set.modified', 'The set of pre-existing user changes differs from the trusted workspace checkpoint; refusing to reset the retry trust boundary.'),
      paths: unexpected
    };
  }
  return { ok: true, changes: structuredClone(expected) };
}

async function unchangedPreexistingPaths({ workspace, snapshots, runner, hooksPath }) {
  if (snapshots === undefined || snapshots === null) return { ok: true, unchanged: new Set() };
  if (!Array.isArray(snapshots) || snapshots.length > 500) return gitFailure('git.workspace.checkpoint-invalid', 'Pre-existing change checkpoint is invalid.');
  const unchanged = new Set();
  for (const snapshot of snapshots) {
    const changedPath = normalizeOwnedPath(snapshot?.path);
    if (!changedPath || !/^[0-9a-f]{64}$/.test(snapshot?.fingerprint ?? '')) {
      return gitFailure('git.workspace.checkpoint-invalid', 'Pre-existing change checkpoint is invalid.');
    }
    const current = await fingerprintWorkspacePath({ workspace, changedPath, runner, hooksPath });
    if (!current.ok) return current;
    if (current.value !== snapshot.fingerprint) {
      return gitFailure('git.preexisting-change.modified', `A pre-existing user change at ${changedPath} changed during automation; refusing to stage or deliver.`);
    }
    unchanged.add(changedPath);
  }
  return { ok: true, unchanged };
}

async function fingerprintWorkspacePath({ workspace, changedPath, runner, hooksPath }) {
  const call = (args) => hooksPath
    ? guardGitCall(workspace, args, hooksPath)
    : gitCall(workspace, args);
  const status = await runner(call(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', changedPath]));
  if (status.exitCode !== 0) return gitFailure('git.workspace.fingerprint-failed', status.stderr || `Could not fingerprint ${changedPath}.`);
  const working = await runner(call(['hash-object', '--no-filters', '--', changedPath]));
  const index = await runner(call(['rev-parse', '--verify', `:${changedPath}`]));
  const workingValue = working.exitCode === 0 ? String(working.stdout).trim() : 'missing';
  const indexValue = index.exitCode === 0 ? String(index.stdout).trim() : 'missing';
  return {
    ok: true,
    value: createHash('sha256')
      .update(`${String(status.stdout ?? '')}\0${workingValue}\0${indexValue}`)
      .digest('hex')
  };
}

async function inspectChangedFilesForSecrets({ workspace, changedPaths, sensitiveValues }) {
  const secrets = [...new Set((Array.isArray(sensitiveValues) ? sensitiveValues : [])
    .filter((value) => typeof value === 'string' && value.length >= 8 && !/[\0\r\n]/u.test(value)))];
  if (secrets.length === 0 || changedPaths.length === 0) return { ok: true };
  const root = await realpath(path.resolve(workspace)).catch(() => path.resolve(workspace));
  let totalBytes = 0;
  for (const changedPath of changedPaths) {
    const candidate = path.resolve(workspace, changedPath);
    const relative = path.relative(root, candidate);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      return gitFailure('git.secret-scan.path-unsafe', 'Secret egress scan encountered a path outside the task workspace.');
    }
    let stats;
    try {
      stats = await lstat(candidate);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      return gitFailure('git.secret-scan.failed', `Could not inspect changed path ${changedPath} for credential egress.`);
    }
    let content;
    if (stats.isSymbolicLink()) {
      content = Buffer.from(await readlink(candidate), 'utf8');
    } else if (stats.isFile()) {
      if (stats.size > 10 * 1024 * 1024) return gitFailure('git.secret-scan.size-limit', `Changed path ${changedPath} exceeds the 10 MiB credential scan limit.`);
      const resolved = await realpath(candidate);
      const resolvedRelative = path.relative(root, resolved);
      if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) {
        return gitFailure('git.secret-scan.path-unsafe', `Changed path ${changedPath} resolves outside the task workspace.`);
      }
      content = await readFile(candidate);
    } else {
      return gitFailure('git.secret-scan.type-unsafe', `Changed path ${changedPath} is not a regular file or symbolic link.`);
    }
    totalBytes += content.byteLength;
    if (totalBytes > 25 * 1024 * 1024) return gitFailure('git.secret-scan.size-limit', 'Changed files exceed the 25 MiB credential scan budget.');
    if (secrets.some((secret) => content.includes(Buffer.from(secret, 'utf8')))) {
      return gitFailure('git.secret-egress.detected', `A controller-projected credential value was found in changed path ${changedPath}; delivery is blocked.`);
    }
  }
  return { ok: true };
}

function normalizeOwnedPath(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || normalized.split('/').some((part) => !part || part === '..' || part === '.')) return null;
  return normalized;
}

function normalizeGitOid(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return GIT_OID.test(normalized) ? normalized : null;
}

function isSafeCommitMessage(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 300 && !/[\0\r\n]/.test(value) && !/\b(token|secret|password|api[_-]?key)\s*[:=]/i.test(value);
}

function isAutomationBranch(branch) {
  return typeof branch === 'string' &&
    branch.startsWith('aapb/') &&
    !branch.includes('..') &&
    !branch.includes('@{') &&
    !/[\0-\x20~^:?*\[\\]/u.test(branch) &&
    !/[./]$/u.test(branch);
}

function normalizeBranchPrefix(value) {
  const normalized = String(value).replace(/\\/g, '/').replace(/[^A-Za-z0-9._/-]+/g, '-').replace(/\.{2,}/g, '-');
  return `${normalized.replace(/^\/+|\/+$/g, '') || 'aapb'}/`;
}

function isSafeGitName(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) && !value.includes('..');
}

function defaultCacheRoot() {
  const base = process.env.LOCALAPPDATA || process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'ai-agent-playbook', 'checkouts');
}

function gitCall(cwd, args) {
  return { command: 'git', args, cwd, shell: false };
}

function guardGitCall(cwd, args, hooksPath) {
  return { ...gitCall(cwd, args), hooksPath };
}

function runGit(call) {
  return new Promise((resolve) => {
    if (call.signal?.aborted) {
      resolve({ exitCode: 1, stdout: '', stderr: 'Git command was cancelled before process start.' });
      return;
    }
    /** @type {NodeJS.ProcessEnv} */
    const env = controllerGitEnvironment(process.env, call.env, call.hooksPath);
    const child = spawn(call.command, call.args, {
      cwd: call.cwd,
      env,
      shell: false,
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let forceTimer = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (forceTimer) clearTimeout(forceTimer);
      call.signal?.removeEventListener?.('abort', abort);
      resolve(result);
    };
    const terminate = (reason) => {
      if (settled) return;
      stderr = `${stderr}${reason}`;
      terminateGitProcessTree(child);
      forceTimer ??= setTimeout(() => {
        if (settled) return;
        try {
          if (process.platform === 'win32') child.kill('SIGKILL');
          else process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }, 2000);
      forceTimer.unref?.();
    };
    const timeoutMs = Number(call.timeoutMs);
    const timer = Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => {
          terminate('Git command exceeded the remaining tick deadline.');
        }, timeoutMs)
      : null;
    timer?.unref?.();
    const abort = () => terminate('Git command was cancelled by the controller.');
    call.signal?.addEventListener?.('abort', abort, { once: true });
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => finish({ exitCode: 1, stdout, stderr: `${stderr}${error.message}` }));
    child.on('close', (code) => finish({ exitCode: code ?? 1, stdout, stderr }));
  });
}

function terminateGitProcessTree(child) {
  if (!Number.isInteger(child.pid) || child.pid <= 0) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
      shell: false,
      windowsHide: true,
      stdio: 'ignore'
    });
    killer.on('error', () => child.kill());
    return;
  }
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

function deadlineRunner(runner, deadlineAt, signal) {
  return async (call) => {
    if (signal?.aborted) return { exitCode: 1, stdout: '', stderr: 'Git command was not started because the controller cancelled the operation.' };
    if (!Number.isFinite(deadlineAt)) return runner(call);
    const timeoutMs = Math.floor(Number(deadlineAt) - Date.now());
    if (timeoutMs <= 0) {
      return { exitCode: 1, stdout: '', stderr: 'Git command was not started because the tick deadline was exhausted.' };
    }
    return runner({ ...call, timeoutMs, signal });
  };
}

function controllerGitEnvironment(source, overrides = {}, hooksPath) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const [key, value] of Object.entries(source ?? {})) {
    if (value === undefined || isSensitiveControllerEnvironmentKey(key) || key.startsWith('GIT_CONFIG_')) continue;
    env[key] = String(value);
  }
  /** @type {Record<string, string>} */
  const supplied = { ...(overrides ?? {}) };
  const entries = [];
  const count = Number(supplied.GIT_CONFIG_COUNT ?? 0);
  if (Number.isInteger(count) && count >= 0 && count <= 100) {
    for (let index = 0; index < count; index += 1) {
      const key = supplied[`GIT_CONFIG_KEY_${index}`];
      const value = supplied[`GIT_CONFIG_VALUE_${index}`];
      if (typeof key === 'string' && value !== undefined) entries.push([key, String(value)]);
      delete supplied[`GIT_CONFIG_KEY_${index}`];
      delete supplied[`GIT_CONFIG_VALUE_${index}`];
    }
  }
  delete supplied.GIT_CONFIG_COUNT;
  Object.assign(env, supplied);
  const guardedEntries = [
    ['credential.helper', ''],
    ['core.askPass', ''],
    ['core.fsmonitor', 'false'],
    ...(hooksPath ? [['core.hooksPath', hooksPath]] : []),
    ...entries.filter(([key]) => !['credential.helper', 'core.askpass', 'core.fsmonitor', 'core.hookspath'].includes(key.toLowerCase()))
  ];
  env.GIT_CONFIG_COUNT = String(guardedEntries.length);
  guardedEntries.forEach(([key, value], index) => {
    env[`GIT_CONFIG_KEY_${index}`] = key;
    env[`GIT_CONFIG_VALUE_${index}`] = value;
  });
  env.GIT_TERMINAL_PROMPT = '0';
  env.GCM_INTERACTIVE = 'Never';
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_SYSTEM = process.platform === 'win32' ? 'NUL' : '/dev/null';
  env.GIT_CONFIG_GLOBAL = process.platform === 'win32' ? 'NUL' : '/dev/null';
  return env;
}

function normalizeCommitIdentity(value) {
  const name = typeof value?.name === 'string' && /^[^\0\r\n<>]{1,100}$/.test(value.name.trim())
    ? value.name.trim()
    : 'AI Agent Playbook';
  const email = typeof value?.email === 'string' && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+$/.test(value.email.trim())
    ? value.email.trim()
    : 'aapb-controller@localhost.invalid';
  return { name, email };
}

function isSensitiveControllerEnvironmentKey(key) {
  return /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|AUTHORIZATION)$/i.test(key) ||
    /^(?:GH_TOKEN|GITHUB_TOKEN|GITEA_TOKEN|AAPB_FORGE_TOKEN|GIT_ASKPASS|SSH_ASKPASS|GCM_INTERACTIVE)$/i.test(key);
}

function normalizeControllerCredential(value) {
  if (!value || typeof value !== 'object') return null;
  const username = typeof value.username === 'string' ? value.username : '';
  const token = typeof value.token === 'string' ? value.token : '';
  if (!/^[A-Za-z0-9._@+-]{1,128}$/.test(username) || !/^\S{1,4096}$/.test(token) || /[\0\r\n]/.test(token)) return null;
  return { username, token };
}

function firstValidCredential(username, candidates) {
  for (const token of candidates) {
    const credential = normalizeControllerCredential({ username, token });
    if (credential) return credential;
  }
  return null;
}

function buildControllerNetworkEnvironment(remoteUrl, credential, operation) {
  let parsed;
  try {
    parsed = new URL(remoteUrl);
  } catch {
    return { ok: true, env: nonInteractiveGitEnvironment() };
  }
  if (!credential) return { ok: true, env: nonInteractiveGitEnvironment() };
  if (parsed.protocol !== 'https:') {
    return parsed.protocol === 'http:'
      ? {
          ok: false,
          id: operation === 'read' ? 'git.remote-url.insecure' : 'git.push-url.insecure',
          message: `A controller token can only be used with an HTTPS ${operation === 'read' ? 'remote' : 'push'} URL.`
        }
      : { ok: true, env: nonInteractiveGitEnvironment() };
  }
  parsed.username = '';
  parsed.password = '';
  const scopedUrl = parsed.toString();
  const encoded = Buffer.from(`${credential.username}:${credential.token}`, 'utf8').toString('base64');
  return {
    ok: true,
    env: {
      ...nonInteractiveGitEnvironment(),
      GIT_CONFIG_COUNT: '2',
      GIT_CONFIG_KEY_0: 'credential.helper',
      GIT_CONFIG_VALUE_0: '',
      GIT_CONFIG_KEY_1: `http.${scopedUrl}.extraheader`,
      GIT_CONFIG_VALUE_1: `Authorization: Basic ${encoded}`
    }
  };
}

function nonInteractiveGitEnvironment() {
  return { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' };
}

function hasEmbeddedHttpCredentials(value) {
  try {
    const parsed = new URL(value);
    const httpUserInfo = ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.username);
    return httpUserInfo || Boolean(parsed.password) || [...parsed.searchParams.keys()].some(isCredentialQueryKey);
  } catch {
    return false;
  }
}

function isSupportedPushUrl(value) {
  try {
    const parsed = new URL(value);
    return ['https:', 'ssh:'].includes(parsed.protocol) && !parsed.username.includes('\n') && !parsed.password;
  } catch {
    return /^(?:[^@\s]+@)?[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?:[^\s]+$/.test(String(value)) && !String(value).startsWith('ext::');
  }
}

function canonicalRemoteUrl(value) {
  const sanitized = credentialFreeRemoteUrl(String(value ?? '').trim());
  if (!sanitized) return null;
  try {
    const parsed = new URL(sanitized);
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return sanitized;
  }
}

function credentialFreeRemoteUrl(value) {
  try {
    const parsed = new URL(value);
    const isHttp = ['http:', 'https:'].includes(parsed.protocol);
    const credentialQueryKeys = [...parsed.searchParams.keys()].filter(isCredentialQueryKey);
    if (!isHttp && !parsed.password && credentialQueryKeys.length === 0) return value;
    if (isHttp) parsed.username = '';
    parsed.password = '';
    for (const key of credentialQueryKeys) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return /^https?:\/\//i.test(value) ? null : value;
  }
}

function isCredentialQueryKey(value) {
  return /^(?:token|access[_-]?token|private[_-]?token|oauth2?[_-]?token|auth(?:orization)?|password|secret|api[_-]?key)$/i.test(value);
}

function redactGitOutput(value, credential) {
  let redacted = String(value)
    .replace(/Authorization\s*:\s*(?:Basic|Bearer)\s+[^\s]+/gi, 'Authorization: [REDACTED]')
    .replace(/(https?:\/\/)[^/@\s]+@/gi, '$1[REDACTED]@');
  if (!credential) return redacted;
  const encoded = Buffer.from(`${credential.username}:${credential.token}`, 'utf8').toString('base64');
  redacted = redacted.split(credential.token).join('[REDACTED]');
  return redacted.split(encoded).join('[REDACTED]');
}

function gitFailure(id, message) {
  return {
    schemaVersion: '2',
    kind: 'automation.git-delivery.v2',
    ok: false,
    operations: [],
    conflicts: [{ id, message, paths: [] }]
  };
}

function redactRemoteUrl(value) {
  return String(value).replace(/(https?:\/\/)[^/@\s]+@/i, '$1[REDACTED]@');
}
