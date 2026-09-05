import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runSkillsLifecycle } from '../src/skills-lifecycle.mjs';
import { treeSnapshot, statOrNull } from '../src/fs-safety.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-skills-'));
  t.after(async () => { assert.equal(path.dirname(root), os.tmpdir()); await rm(root, { recursive: true, force: true }); });
  return { root, repoRoot, agentsRoot: path.join(root, '한글 agents skills'), codexRoot: path.join(root, 'codex skills'), backupRoot: path.join(root, 'backups') };
}
async function legacy(root, name, text = '# Old managed skill\n') {
  const dir = path.join(root, name);
  await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, 'SKILL.md'), text);
  const snap = await treeSnapshot(dir);
  await writeFile(path.join(dir, '.ai-agent-playbook-install.json'), JSON.stringify({ source: 'ai-agent-playbook', schemaVersion: 1, skillName: name, sourceHash: snap.legacyHash }));
  return dir;
}
test('selected installation is single-root, preview is write-free, repeat is a no-op', async (t) => {
  const f = await fixture(t), before = await treeSnapshot(f.root);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'core', dryRun: true });
  assert.deepEqual(await treeSnapshot(f.root), before);
  const installed = await runSkillsLifecycle({ ...f, command: 'install', profile: 'core' });
  assert.equal(installed.ok, true);
  assert.equal(installed.summary.applied, 2);
  assert.equal(await statOrNull(f.codexRoot), null);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'update', profile: 'core' })).summary.operations, 0);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'check', profile: 'core' })).ok, true);
});

test('custom installation defaults to a sibling backup and previews its placement', async (t) => {
  const f = await fixture(t);
  const options = { ...f, command: 'install', backupRoot: undefined };
  const preview = await runSkillsLifecycle({ ...options, dryRun: true });
  assert.equal(preview.backupRoot, path.join(f.root, 'aapb-backups'));
  assert.equal(await statOrNull(preview.backupRoot), null);
  const result = await runSkillsLifecycle(options);
  assert.equal(path.dirname(result.backup), preview.backupRoot);
  assert.equal(result.summary.applied, 2);
});

test('cross-filesystem backups fail before writes and a local default supports install and recovery', async (t) => {
  const f = await fixture(t), firstDevice = (await stat(f.root)).dev;
  let otherParent = null;
  for (const candidate of [repoRoot, ...(process.platform === 'win32' ? [] : ['/dev/shm'])]) {
    const st = await statOrNull(candidate);
    if (st?.isDirectory() && st.dev !== firstDevice) { otherParent = candidate; break; }
  }
  if (!otherParent) { t.skip('A second writable filesystem is not available.'); return; }
  const second = await mkdtemp(path.join(otherParent, '.aapb-volume-test-'));
  t.after(async () => { assert.equal(path.dirname(second), otherParent); await rm(second, { recursive: true, force: true }); });
  const options = { ...f, agentsRoot: path.join(second, 'skills'), command: 'install' };
  const firstBefore = await treeSnapshot(f.root), secondBefore = await treeSnapshot(second);
  for (const dryRun of [true, false]) await assert.rejects(runSkillsLifecycle({ ...options, dryRun }), /same filesystem/);
  assert.deepEqual(await treeSnapshot(f.root), firstBefore);
  assert.deepEqual(await treeSnapshot(second), secondBefore);
  const installed = await runSkillsLifecycle({ ...options, backupRoot: undefined });
  assert.equal(installed.ok, true);
  assert.equal(installed.summary.applied, 2);
  const restored = await runSkillsLifecycle({ ...options, command: 'rollback', backup: installed.backup, apply: true });
  assert.equal(restored.ok, true);
  assert.equal(restored.summary.restored, 2);
});
test('migration removes owned duplicates and preserves independent changed and unmanaged files', async (t) => {
  const f = await fixture(t);
  const clean = await legacy(f.codexRoot, 'repo-onboarding');
  const changed = await legacy(f.codexRoot, 'project-doc-system');
  await writeFile(path.join(changed, 'SKILL.md'), '# User edit\n');
  const foreign = path.join(f.agentsRoot, 'project-bootstrap');
  await mkdir(foreign, { recursive: true }); await writeFile(path.join(foreign, 'SKILL.md'), '# Foreign\n');
  const before = await treeSnapshot(f.root);
  const preview = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'development', dryRun: true });
  assert.equal(preview.ok, false);
  assert.deepEqual(await treeSnapshot(f.root), before);
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'development', apply: true });
  assert.equal(result.ok, false);
  assert.equal(result.applied, true);
  assert.equal(await statOrNull(clean), null);
  assert.equal(await readFile(path.join(changed, 'SKILL.md'), 'utf8'), '# User edit\n');
  assert.equal(await readFile(path.join(foreign, 'SKILL.md'), 'utf8'), '# Foreign\n');
  assert.equal((await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'development', apply: true })).summary.operations, 0);
});
test('rollback restores original bytes, preserves later edits and can be repeated', async (t) => {
  const f = await fixture(t);
  const old = await legacy(f.codexRoot, 'repo-onboarding');
  const original = await treeSnapshot(old);
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'core', apply: true });
  const changed = path.join(f.agentsRoot, 'project-memory/SKILL.md');
  await writeFile(changed, '# Later user edit\n');
  const rollback = await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true });
  assert.equal(rollback.ok, false);
  assert.deepEqual(await treeSnapshot(old), original);
  assert.equal(await readFile(changed, 'utf8'), '# Later user edit\n');
  assert.equal(await statOrNull(path.join(f.agentsRoot, 'spec-artifacts')), null);
  const replay = await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true });
  assert.equal(replay.summary.restored, 0);
});
test('changed-after-preview entry is preserved while independently safe entries complete', async (t) => {
  const f = await fixture(t);
  const old = await legacy(f.codexRoot, 'repo-onboarding');
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', apply: true,
    beforeOperation: async (entry) => { if (entry.skillName === 'repo-onboarding') await writeFile(path.join(old, 'SKILL.md'), '# Concurrent edit\n'); }
  });
  assert.equal(result.ok, false);
  assert.equal(await readFile(path.join(old, 'SKILL.md'), 'utf8'), '# Concurrent edit\n');
  assert.ok(await statOrNull(path.join(f.agentsRoot, 'project-memory/SKILL.md')));
});
test('linked installation is preserved without traversing or moving its target', async (t) => {
  const f = await fixture(t), outside = path.join(f.root, 'outside');
  await mkdir(outside); await writeFile(path.join(outside, 'SKILL.md'), '# Preserve\n');
  await mkdir(f.codexRoot);
  await symlink(outside, path.join(f.codexRoot, 'repo-onboarding'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', apply: true });
  assert.equal(result.ok, false);
  assert.equal(await readFile(path.join(outside, 'SKILL.md'), 'utf8'), '# Preserve\n');
  assert.equal((await statOrNull(path.join(f.codexRoot, 'repo-onboarding'))).isSymbolicLink(), true);
});
test('backup roots cannot overlap installations and invalid selections do not mutate', async (t) => {
  const f = await fixture(t), before = await treeSnapshot(f.root);
  await assert.rejects(runSkillsLifecycle({ ...f, command: 'install', profile: 'unknown' }), /Unknown/);
  await assert.rejects(runSkillsLifecycle({ ...f, command: 'install', skills: ['..\/outside'] }), /Unknown/);
  await assert.rejects(runSkillsLifecycle({ ...f, command: 'install', backupRoot: path.join(f.agentsRoot, 'backup') }), /outside|separate/);
  assert.deepEqual(await treeSnapshot(f.root), before);
});

test('empty explicit skill selections cannot trigger legacy cleanup', async (t) => {
  const f = await fixture(t);
  await legacy(f.codexRoot, 'repo-onboarding');
  const before = await treeSnapshot(f.root);
  for (const skills of [[''], [','], ['project-memory,,spec-artifacts']]) {
    for (const dryRun of [true, false]) {
      await assert.rejects(runSkillsLifecycle({ ...f, command: 'migrate', skills, apply: true, dryRun }), /empty skill/i);
      assert.deepEqual(await treeSnapshot(f.root), before);
    }
  }
});

test('interrupted apply can restore a moved original before a replacement is installed', async (t) => {
  const f = await fixture(t), old = await legacy(f.agentsRoot, 'project-memory');
  const original = await treeSnapshot(old);
  const result = await runSkillsLifecycle({ ...f, command: 'install', skills: ['project-memory'] });
  const journalPath = path.join(result.backup, 'journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  const entry = journal.entries[0];
  await rename(old, path.join(result.backup, entry.id, 'after'));
  entry.state = 'applying'; journal.state = 'partial';
  await writeFile(journalPath, JSON.stringify(journal));
  const recovered = await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true });
  assert.equal(recovered.ok, true);
  assert.deepEqual(await treeSnapshot(old), original);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true })).summary.restored, 0);
});

test('all journal paths are validated before recovery and tampered backups are preserved', async (t) => {
  const f = await fixture(t); await legacy(f.codexRoot, 'repo-onboarding');
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', apply: true });
  const journalPath = path.join(result.backup, 'journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  const original = JSON.stringify(journal);
  journal.entries[0].relative = '../outside';
  await writeFile(journalPath, JSON.stringify(journal));
  const before = await treeSnapshot(f.agentsRoot);
  await assert.rejects(runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true }), /Unsafe/);
  assert.deepEqual(await treeSnapshot(f.agentsRoot), before);
  await writeFile(journalPath, original);
  const removed = journal.entries.find((e) => e.action === 'remove');
  await writeFile(path.join(result.backup, removed.id, 'before', 'SKILL.md'), '# Changed backup\n');
  const rollback = await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true });
  assert.equal(rollback.ok, false);
  assert.equal(await statOrNull(path.join(f.codexRoot, 'repo-onboarding')), null);
});
