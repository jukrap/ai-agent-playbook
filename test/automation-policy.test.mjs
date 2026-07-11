import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveAutomationPolicy } from '../src/automation/policy.mjs';

test('request policy can narrow configured authority but never expand it', () => {
  const narrowed = deriveAutomationPolicy({
    configuredProfile: 'deliver',
    requestedProfile: 'release',
    remoteReadOnly: true
  });
  assert.equal(narrowed.profile, 'observe');
  assert.equal(narrowed.remote.read, true);
  assert.equal(narrowed.remote.write, false);
  assert.equal(narrowed.git.commit, true);
  assert.equal(narrowed.git.push, false);
  assert.equal(narrowed.automation.execute, true);
  assert.equal(narrowed.reasons.some((reason) => reason.id === 'policy.expansion-ignored'), true);

  const offCannotExpand = deriveAutomationPolicy({ configuredProfile: 'off', requestedProfile: 'deliver' });
  assert.equal(offCannotExpand.profile, 'off');
  assert.equal(offCannotExpand.remote.read, false);
  assert.equal(offCannotExpand.git.commit, false);
  assert.equal(offCannotExpand.automation.execute, false);

  const requestedObserve = deriveAutomationPolicy({ configuredProfile: 'deliver', requestedProfile: 'observe' });
  assert.equal(requestedObserve.automation.execute, false);
});

test('explicit CLI kill switches compose safely', () => {
  const policy = deriveAutomationPolicy({
    configuredProfile: 'release',
    noRemote: true,
    noGit: true,
    offline: true
  });
  assert.equal(policy.remote.read, false);
  assert.equal(policy.remote.write, false);
  assert.equal(policy.git.branch, false);
  assert.equal(policy.git.commit, false);
  assert.equal(policy.git.push, false);
  assert.equal(policy.network, false);
  assert.equal(policy.destructive.delete, false);
  assert.equal(policy.destructive.forcePush, false);
});

test('clear Korean and English opt-out instructions disable remote work only for the request', () => {
  for (const instruction of [
    '이번 작업에서는 GitHub 원격 작업을 하지 마.',
    '이번 작업에서는 GitHub에 올리지 않겠다.',
    '이번에는 Gitea 동기화를 하지 않겠습니다.',
    'Gitea 동기화 금지. 로컬에서만 진행해.',
    '이번에는 로컬에서만 진행해.',
    '이번 변경은 local에만 보관하겠습니다.',
    'opt out of remote forge operations for this run',
    'do not push or update GitHub this time',
    'do not publish this change',
    'keep this local for now'
  ]) {
    const policy = deriveAutomationPolicy({ configuredProfile: 'deliver', instruction });
    assert.equal(policy.remote.write, false, instruction);
    assert.equal(policy.git.push, false, instruction);
    assert.equal(policy.git.commit, true, instruction);
    assert.equal(policy.reasons.some((reason) => reason.id === 'policy.instruction.remote-deny'), true);
  }
});

test('ordinary discussion of remote risk does not accidentally opt out', () => {
  for (const instruction of [
    'GitHub 원격 작업 금지 기능을 문서화하고 테스트해 주세요.',
    'GitHub에 올리지 않도록 하는 기능을 문서화해 주세요.'
  ]) {
    const policy = deriveAutomationPolicy({ configuredProfile: 'deliver', instruction });
    assert.equal(policy.remote.write, true, instruction);
    assert.equal(policy.git.push, true, instruction);
  }
});
