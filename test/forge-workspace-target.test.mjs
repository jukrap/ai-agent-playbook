import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { renameSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { promisify } from 'node:util';
import { runCli } from '../src/cli.mjs';
import { createWorkspaceConfig, projectGitEnvironment } from '../src/workspace.mjs';
import { inside, treeSnapshot } from '../src/fs-safety.mjs';

async function tempRoot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-forge-target-'));
  t.after(async () => {
    assert.equal(path.dirname(root), os.tmpdir());
    assert.match(path.basename(root), /^aapb-forge-target-/);
    await rm(root, { recursive: true, force: true });
  });
  return root;
}

function git(root, args) {
  return childProcess.execFileSync('git', ['-C', root, ...args], { env: projectGitEnvironment(), encoding: 'utf8', windowsHide: true });
}

async function put(root, relative, body) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

async function cli(root, command, flags = []) {
  let output = '', error = '';
  const code = await runCli(['forge', command, ...flags, '--json'], {
    cwd: root, stdout: { write: (text) => { output += text; } }, stderr: { write: (text) => { error += text; } }
  });
  assert.equal(error, '');
  return { code, value: JSON.parse(output) };
}

function forbidRemoteCalls(t) {
  let calls = 0;
  const originalToken = process.env.GH_TOKEN;
  process.env.GH_TOKEN = 'fixture-token-no-network';
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Unexpected remote request in local Forge test.'); });
  t.after(() => {
    if (originalToken === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = originalToken;
    assert.equal(calls, 0, 'Remote transport must remain unused.');
  });
}

async function workspace(t, { parentGit = true, separateGitDir = false } = {}) {
  const root = await tempRoot(t);
  if (parentGit) {
    git(root, ['init', '--quiet']);
    git(root, ['remote', 'add', 'origin', 'https://github.com/example/ancestor.git']);
    git(root, ['remote', 'add', 'upstream', 'https://github.com/example/ancestor-upstream.git']);
  }
  const members = Array.from({ length: 12 }, (_, index) => ({
    id: index === 0 ? 'plain' : index === 1 ? 'own' : `repo-${index + 1}`,
    path: `members/member-${index + 1}`, role: 'fixture member'
  }));
  for (const member of members) await mkdir(path.join(root, member.path, 'src/deep'), { recursive: true });
  await put(root, '.ai-agent-playbook/workspace.json', JSON.stringify(createWorkspaceConfig(members)) + '\n');
  await put(root, '.ai-agent-playbook/CURRENT.md', '# Shared fixture records\n');
  const plain = path.join(root, members[0].path), own = path.join(root, members[1].path);
  git(own, ['init', '--quiet', ...(separateGitDir ? ['--separate-git-dir', path.join(root, 'member-git-storage')] : [])]);
  git(own, ['remote', 'add', 'origin', 'https://github.com/example/member.git']);
  git(own, ['remote', 'add', 'upstream', 'https://github.com/example/member-upstream.git']);
  return { root, plain, own };
}

test('twelve-member workspace status suppresses inherited remotes for explicit and inferred plain members', async (t) => {
  const { root, plain } = await workspace(t), before = await treeSnapshot(root);
  for (const [target, selection] of [[root, ['--repo', 'plain']], [plain, []], [path.join(plain, 'src/deep'), []]]) {
    for (const remote of [[], ['--remote', 'upstream'], ['--provider', 'github', '--remote', 'origin']]) {
      const result = await cli(target, 'status', [...selection, ...remote]);
      assert.equal(result.code, 0, JSON.stringify(result.value));
      assert.equal(result.value.repository, null);
      assert.equal(result.value.mode.remote, 'local-only');
      assert.equal(result.value.mode.policyWrites, false);
      assert.ok(result.value.warnings.some((warning) => warning.id === 'forge.workspace.git-root-mismatch'));
    }
  }
  assert.deepEqual(await treeSnapshot(root), before);
});

test('all Forge apply routes reject ancestor bindings before remote access, including explicit remote/provider', async (t) => {
  forbidRemoteCalls(t);
  const { root, plain } = await workspace(t);
  await put(plain, 'plan.json', JSON.stringify({ provider: 'github', operations: [] }));
  const before = await treeSnapshot(root);
  for (const command of ['bootstrap', 'sync', 'reconcile']) {
    for (const [target, selection] of [[root, ['--repo', 'plain']], [path.join(plain, 'src/deep'), []]]) {
      const result = await cli(target, command, [...selection, '--apply', '--provider', 'github', '--remote', 'upstream',
        ...(command === 'bootstrap' ? ['--milestone', 'Fixture milestone'] : ['--plan', 'plan.json'])]);
      assert.equal(result.code, 1);
      assert.match(result.value.message, /own Git worktree root.*ancestor remote access is disabled/);
    }
  }
  assert.deepEqual(await treeSnapshot(root), before);
});

test('owned member remotes respect explicit names without falling back to origin or ancestor remotes', async (t) => {
  forbidRemoteCalls(t);
  const { root, own } = await workspace(t), before = await treeSnapshot(root);
  for (const [target, selection] of [[root, ['--repo', 'own']], [path.join(own, 'src/deep'), []]]) {
    const origin = await cli(target, 'status', selection);
    assert.equal(origin.code, 0);
    assert.equal(origin.value.repository.slug, 'example/member');
    const upstream = await cli(target, 'status', [...selection, '--remote', 'upstream']);
    assert.equal(upstream.code, 0);
    assert.equal(upstream.value.repository.slug, 'example/member-upstream');
    for (const remote of ['missing', 'https://github.com/example/not-a-remote-name.git', '-h']) {
      const missing = await cli(target, 'status', [...selection, '--remote', remote]);
      assert.equal(missing.value.repository, null);
    }
  }
  const preview = await cli(root, 'bootstrap', ['--repo', 'own', '--remote', 'upstream', '--milestone', 'Fixture milestone', '--apply', '--dry-run']);
  assert.equal(preview.code, 0);
  assert.equal(preview.value.mode.writes, false);
  assert.equal(preview.value.summary.applied, 0);
  assert.deepEqual(await treeSnapshot(root), before);
});

test('workspace root and unknown IDs cannot bypass repository selection', async (t) => {
  const { root } = await workspace(t);
  for (const command of ['status', 'bootstrap']) {
    const ambiguous = await cli(root, command);
    assert.equal(ambiguous.code, 1);
    assert.match(ambiguous.value.message, /Select one repository/);
    const unknown = await cli(root, command, ['--repo', 'unknown']);
    assert.equal(unknown.code, 1);
    assert.match(unknown.value.message, /Unknown repository ID/);
  }
});

test('Git-independent workspace records still permit local Forge diagnostics', async (t) => {
  forbidRemoteCalls(t);
  const { root } = await workspace(t, { parentGit: false });
  const result = await cli(root, 'status', ['--repo', 'plain']);
  assert.equal(result.code, 0);
  assert.equal(result.value.repository, null);
  assert.equal(result.value.mode.remote, 'local-only');
  assert.ok(result.value.warnings.some((warning) => warning.id === 'forge.workspace.git-root-unverified'));
  const apply = await cli(root, 'bootstrap', ['--repo', 'plain', '--provider', 'github', '--apply']);
  assert.equal(apply.code, 1);
  assert.match(apply.value.message, /own Git worktree root/);
});

test('standalone repository subfolders retain their existing root and explicit-remote behavior', async (t) => {
  forbidRemoteCalls(t);
  const root = await tempRoot(t), nested = path.join(root, 'src/deep');
  await mkdir(nested, { recursive: true });
  git(root, ['init', '--quiet']);
  git(root, ['remote', 'add', 'origin', 'https://github.com/example/standalone.git']);
  git(root, ['remote', 'add', 'upstream', 'https://github.com/example/standalone-upstream.git']);
  await put(nested, 'plan.json', JSON.stringify({ provider: 'github', operations: [] }));
  const before = await treeSnapshot(root);
  for (const target of [root, nested]) {
    assert.equal((await cli(target, 'status')).value.repository.slug, 'example/standalone');
    assert.equal((await cli(target, 'status', ['--remote', 'upstream'])).value.repository.slug, 'example/standalone-upstream');
  }
  const preview = await cli(nested, 'sync', ['--plan', 'plan.json', '--remote', 'upstream', '--dry-run']);
  assert.equal(preview.code, 0);
  assert.equal(preview.value.mode.writes, false);
  assert.equal((await cli(nested, 'status', ['--repo', 'own'])).code, 1);
  assert.deepEqual(await treeSnapshot(root), before);
});

test('a member using a Git pointer file retains its own separate Git-directory remote', async (t) => {
  const { root, own } = await workspace(t, { separateGitDir: true });
  assert.equal(git(own, ['rev-parse', '--absolute-git-dir']).trim().replaceAll('\\', '/'), path.join(root, 'member-git-storage').replaceAll('\\', '/'));
  const result = await cli(root, 'status', ['--repo', 'own', '--remote', 'upstream']);
  assert.equal(result.code, 0);
  assert.equal(result.value.repository.slug, 'example/member-upstream');
});

test('removing a verified member Git directory before remote retrieval cannot redirect apply to its ancestor', async (t) => {
  forbidRemoteCalls(t);
  const { root, own } = await workspace(t);
  const original = childProcess.execFile;
  let removed = false;
  const intercept = function (command, args, options, callback) {
    if (command === 'git' && args.includes('get-url') && !removed) {
      const from = path.join(own, '.git'), to = path.join(root, 'moved-member-git');
      assert.ok(inside(root, from) && inside(root, to));
      renameSync(from, to);
      removed = true;
    }
    return original(command, args, options, callback);
  };
  // execFile's built-in promisifier closes over the original function; route its promise form through the hook too.
  Object.defineProperty(intercept, promisify.custom, { value: (command, args, options) => new Promise((resolve, reject) => {
    intercept(command, args, options, (error, stdout, stderr) => error ? reject(error) : resolve({ stdout, stderr }));
  }) });
  childProcess.execFile = intercept;
  syncBuiltinESMExports();
  t.after(() => { childProcess.execFile = original; syncBuiltinESMExports(); });
  const result = await cli(root, 'bootstrap', ['--repo', 'own', '--provider', 'github', '--milestone', 'Fixture milestone', '--apply']);
  assert.equal(removed, true, 'The regression must remove Git metadata between verification and retrieval.');
  assert.equal(result.code, 1);
  assert.match(result.value.message, /verified repository remote is required/);
});
