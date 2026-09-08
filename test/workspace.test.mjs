import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createWorkspaceConfig, validateWorkspaceConfig, locateLocalPlaybook, resolveRecordContext, resolveCodeTarget, discoverRepositories, runWorkspace } from '../src/workspace.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-workspace-'));
  t.after(() => { assert.equal(path.dirname(root), os.tmpdir()); return rm(root, { recursive: true, force: true }); });
  return root;
}
async function workspace(t) {
  const root = await fixture(t), pb = path.join(root, '.ai-agent-playbook');
  await mkdir(pb);
  const names = ['pc-web', 'webview-a', 'webview-b', 'webview-c', 'android-a', 'android-b', 'android-c', 'android-d', 'ios-a', 'ios-b', 'ios-c', 'ios-d'];
  const repos = names.map((id) => ({ id, path: 'repos/' + id, role: id.split('-')[0] }));
  for (const repo of repos) await mkdir(path.join(root, repo.path, '.git'), { recursive: true });
  await writeFile(path.join(pb, 'workspace.json'), JSON.stringify(createWorkspaceConfig(repos)));
  await writeFile(path.join(pb, 'CURRENT.md'), '# Shared objective\n');
  return { root, pb, repos };
}
test('12 repositories resolve shared records from parent, member and nested source', async (t) => {
  const w = await workspace(t);
  assert.equal((await resolveRecordContext({ target: w.root })).directory, w.pb);
  for (const repo of w.repos) {
    const source = path.join(w.root, repo.path, 'src'); await mkdir(source);
    const ctx = await resolveRecordContext({ target: source });
    assert.equal(ctx.activeRepo.id, repo.id); assert.equal(ctx.directory, w.pb);
    assert.equal(await resolveCodeTarget({ target: source }), path.join(w.root, repo.path));
  }
  await assert.rejects(resolveCodeTarget({ target: w.root }), /Select one repository/);
  assert.equal(await resolveCodeTarget({ target: w.root, repo: 'ios-d' }), path.join(w.root, 'repos', 'ios-d'));
  await assert.rejects(resolveCodeTarget({ target: w.root, repo: 'foreign' }), /Unknown/);
});
test('unregistered siblings remain isolated and local legacy records require explicit selection', async (t) => {
  const w = await workspace(t), child = path.join(w.root, w.repos[0].path), legacy = path.join(child, '.ai-playbook');
  await mkdir(legacy); await writeFile(path.join(legacy, 'CURRENT.md'), '# Old evidence\n');
  assert.equal((await resolveRecordContext({ target: child })).directory, w.pb);
  assert.equal((await resolveRecordContext({ target: w.root, recordSource: 'repo:pc-web' })).directory, legacy);
  assert.equal(await readFile(path.join(legacy, 'CURRENT.md'), 'utf8'), '# Old evidence\n');
  const unrelated = path.join(w.root, 'unregistered'); await mkdir(unrelated);
  const ctx = await resolveRecordContext({ target: unrelated });
  assert.equal(ctx.exists, false); assert.equal(ctx.workspace, null);
  await assert.rejects(resolveRecordContext({ target: w.root, recordSource: 'repo:nope' }), /Unknown/);
  await assert.rejects(resolveRecordContext({ target: unrelated, recordSource: 'repo:pc-web' }), /registered workspace/);
});
test('registries reject escaped, overlapping and metadata paths without reading them', () => {
  for (const path of ['../outside', 'C:/outside', '.git', 'repo/../../outside', '.ai-agent-playbook/secret']) {
    assert.throws(() => createWorkspaceConfig([{ id: 'x', path }]));
  }
  assert.throws(() => createWorkspaceConfig([{ id: 'x', path: 'a' }, { id: 'y', path: 'a/b' }]), /overlap/);
  assert.throws(() => createWorkspaceConfig([{ id: 'x', path: 'a' }, { id: 'x', path: 'b' }]), /unique/);
  assert.throws(() => validateWorkspaceConfig({ schemaVersion: 2, repositories: [] }));
});
test('linked member paths and linked metadata cannot expand the workspace', async (t) => {
  const w = await workspace(t), outside = await fixture(t);
  await symlink(outside, path.join(w.root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  await writeFile(path.join(w.pb, 'workspace.json'), JSON.stringify(createWorkspaceConfig([{ id: 'escape', path: 'escape' }])));
  await assert.rejects(resolveCodeTarget({ target: w.root, repo: 'escape' }), /link|junction/);
});
test('registry changes preview, retain a recovery copy and never delete member records', async (t) => {
  const w = await workspace(t), file = path.join(w.pb, 'workspace.json'), before = await readFile(file, 'utf8');
  await mkdir(path.join(w.root, '새로운 레포'));
  const opts = { target: w.root, command: 'add', id: 'extra', path: '새로운 레포', role: 'backend' };
  assert.equal((await runWorkspace(opts)).applied, false);
  assert.equal(await readFile(file, 'utf8'), before);
  const added = await runWorkspace({ ...opts, apply: true });
  assert.equal(added.applied, true);
  assert.equal(await readFile(path.join(w.pb, added.backup), 'utf8'), before);
  assert.equal((await runWorkspace({ ...opts, apply: true })).applied, false);
  assert.equal((await runWorkspace({ target: w.root, command: 'check' })).repositories.length, 13);
  assert.equal((await runWorkspace({ target: w.root, command: 'remove', id: 'extra', apply: true })).applied, true);
  assert.equal((await locateLocalPlaybook(path.join(w.root, '새로운 레포'))).exists, false);
});
test('discovery finds bounded nested repository candidates and skips links', async (t) => {
  const w = await workspace(t);
  const found = await discoverRepositories(w.root);
  assert.equal(found.repositories.length, 12); assert.equal(found.complete, true);
  assert.equal(new Set(found.repositories.map((r) => r.id)).size, 12);
});
