import test from 'node:test';
import assert from 'node:assert/strict';
import fs, { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink, realpath } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import os from 'node:os';
import { createWorkspaceConfig, validateWorkspaceConfig, locateLocalPlaybook, resolveRecordContext, resolveCodeTarget, discoverRepositories, runWorkspace } from '../src/workspace.mjs';

async function fixture(t) {
  const parent = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(parent, 'aapb-workspace-'));
  t.after(() => { assert.equal(path.dirname(root), parent); return rm(root, { recursive: true, force: true }); });
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
  for (const path of ['../outside', 'C:/outside', '.git', '.GIT/objects', 'repo/../../outside', '.ai-agent-playbook/secret', '.AI-AGENT-PLAYBOOK/knowledge']) {
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

test('concurrent registry writers cannot silently lose another registration', async (t) => {
  const w = await workspace(t);
  for (const id of ['extra-a', 'extra-b']) await mkdir(path.join(w.root, id));
  const attempts = await Promise.allSettled(['extra-a', 'extra-b'].map(id => runWorkspace({ target: w.root, command: 'add', id, path: id, apply: true })));
  const applied = attempts.filter(result => result.status === 'fulfilled' && result.value.applied).length;
  const stored = JSON.parse(await readFile(path.join(w.pb, 'workspace.json'), 'utf8'));
  assert.equal(stored.repositories.length, 12 + applied);
  for (const repo of w.repos) assert.ok(stored.repositories.some(item => item.id === repo.id && item.path === repo.path));
  for (const attempt of attempts) if (attempt.status === 'rejected') assert.match(attempt.reason.message, /busy|changed/);
});

test('an editor change after registry staging is preserved and the temp file and lock are cleaned up', async (t) => {
  const w = await workspace(t), file = path.join(w.pb, 'workspace.json');
  const before = await readFile(file, 'utf8');
  const edited = JSON.stringify({ ...JSON.parse(before), externalUserNote: 'Keep this editor change.' });
  await mkdir(path.join(w.root, 'extra'));
  const originalWrite = fs.writeFile;
  let injected = false;
  try {
    // Reproduce an independent editor writing after the proposed temporary file is complete.
    fs.writeFile = async function (target, ...args) {
      const result = await originalWrite.call(this, target, ...args);
      if (!injected && typeof target === 'string' && path.dirname(target) === w.pb && path.basename(target).startsWith('.workspace.json.') && target.endsWith('.tmp')) {
        injected = true;
        await originalWrite(file, edited);
      }
      return result;
    };
    syncBuiltinESMExports();
    await assert.rejects(runWorkspace({ target: w.root, command: 'add', id: 'extra', path: 'extra', apply: true }), /Workspace registry changed after staging/);
  } finally { fs.writeFile = originalWrite; syncBuiltinESMExports(); }
  assert.equal(injected, true);
  assert.equal(await readFile(file, 'utf8'), edited);
  const entries = await readdir(w.pb);
  assert.equal(entries.some(name => name.endsWith('.tmp') || name === '.workspace-write.lock'), false);
  const backups = await readdir(path.join(w.pb, 'archive'));
  assert.equal(backups.length, 1);
  assert.equal(await readFile(path.join(w.pb, 'archive', backups[0]), 'utf8'), before);
  const retried = await runWorkspace({ target: w.root, command: 'add', id: 'extra', path: 'extra', apply: true });
  assert.equal(retried.applied, true);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).externalUserNote, 'Keep this editor change.');
});

test('check reports a missing saved recordPath instead of substituting another local playbook', async (t) => {
  const w = await workspace(t), member = { ...w.repos[0], recordPath: '.ai-playbook' };
  const root = path.join(w.root, member.path), local = path.join(root, '.ai-agent-playbook');
  await mkdir(local); await writeFile(path.join(local, 'CURRENT.md'), '# Real local evidence\n');
  const registry = JSON.stringify(createWorkspaceConfig([member, ...w.repos.slice(1)]));
  await writeFile(path.join(w.pb, 'workspace.json'), registry);
  await mkdir(path.join(root, 'src'));
  for (const target of [w.root, path.join(root, 'src')]) {
    const checked = await runWorkspace({ target, command: 'check' });
    assert.equal(checked.ok, false); assert.equal(checked.writes, false);
    assert.ok(checked.warnings.some(item => item.id === member.id && item.code === 'missing-record-path' && item.path === member.recordPath));
    const selected = checked.repositories.find(item => item.id === member.id);
    assert.equal(selected.available, true); assert.equal(selected.localRecords, null);
    const read = await resolveRecordContext({ target, recordSource: 'repo:' + member.id });
    assert.equal(read.exists, false); assert.equal(read.name, member.recordPath);
  }
  const listed = await runWorkspace({ target: w.root, command: 'list' });
  assert.equal(listed.ok, true); assert.equal(listed.warnings.length, 1);
  assert.equal(await readFile(path.join(w.pb, 'workspace.json'), 'utf8'), registry);
  assert.equal(await readFile(path.join(local, 'CURRENT.md'), 'utf8'), '# Real local evidence\n');
});

test('check and reads honor an explicit legacy root even when another local root also exists', async (t) => {
  const w = await workspace(t), member = { ...w.repos[0], recordPath: '.ai-playbook' };
  const root = path.join(w.root, member.path);
  for (const name of ['.ai-playbook', '.ai-agent-playbook']) {
    await mkdir(path.join(root, name));
    await writeFile(path.join(root, name, 'CURRENT.md'), '# ' + name + '\n');
  }
  await writeFile(path.join(w.pb, 'workspace.json'), JSON.stringify(createWorkspaceConfig([member, ...w.repos.slice(1)])));
  const checked = await runWorkspace({ target: w.root, command: 'check' });
  assert.equal(checked.ok, true); assert.deepEqual(checked.warnings, []);
  assert.equal(checked.repositories.find(item => item.id === member.id).localRecords, member.recordPath);
  const read = await resolveRecordContext({ target: w.root, recordSource: 'repo:' + member.id });
  assert.equal(read.directory, path.join(root, member.recordPath));
  assert.equal(await readFile(path.join(read.directory, 'CURRENT.md'), 'utf8'), '# .ai-playbook\n');
});

test('check and reads reject a saved recordPath that is a file or junction without falling back', async (t) => {
  for (const kind of ['file', 'junction']) {
    const w = await workspace(t), member = { ...w.repos[0], recordPath: '.ai-playbook' };
    const root = path.join(w.root, member.path), configured = path.join(root, member.recordPath);
    await mkdir(path.join(root, '.ai-agent-playbook'));
    if (kind === 'file') await writeFile(configured, '# Not a directory\n');
    else {
      const outside = await fixture(t);
      await symlink(outside, configured, process.platform === 'win32' ? 'junction' : 'dir');
    }
    await writeFile(path.join(w.pb, 'workspace.json'), JSON.stringify(createWorkspaceConfig([member, ...w.repos.slice(1)])));
    const checked = await runWorkspace({ target: w.root, command: 'check' });
    assert.equal(checked.ok, false);
    assert.ok(checked.warnings.some(item => item.id === member.id && /not a directory|link|junction/.test(item.message)));
    await assert.rejects(resolveRecordContext({ target: w.root, recordSource: 'repo:' + member.id }), /not a directory|link|junction/);
  }
});
