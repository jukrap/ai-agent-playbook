import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runSkillsLifecycle } from '../src/skills-lifecycle.mjs';
import { skillCatalog, selectSkills } from '../src/catalog/selection.mjs';
import { treeSnapshot, statOrNull } from '../src/fs-safety.mjs';
import { runCli } from '../src/cli.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-light-'));
  t.after(async () => {
    assert.equal(path.dirname(root), os.tmpdir());
    await rm(root, { recursive: true, force: true });
  });
  return { root, repoRoot, agentsRoot: path.join(root, 'agents'), codexRoot: path.join(root, 'codex'), backupRoot: path.join(root, 'backups') };
}

test('light installs one self-contained skill with less discovery text than core', async (t) => {
  const f = await fixture(t), before = await treeSnapshot(f.root);
  const preview = await runSkillsLifecycle({ ...f, command: 'install', profile: 'light', dryRun: true });
  assert.equal(preview.summary.selected, 1);
  assert.deepEqual(await treeSnapshot(f.root), before);
  const installed = await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
  assert.equal(installed.ok, true);
  assert.equal(installed.summary.applied, 1);
  assert.deepEqual(await readdir(f.agentsRoot), ['project-notes']);
  assert.deepEqual((await readdir(path.join(f.agentsRoot, 'project-notes'))).sort(), ['.ai-agent-playbook-install.json', 'SKILL.md']);
  assert.equal(await statOrNull(f.codexRoot), null);
  const catalog = await skillCatalog({ repoRoot });
  const discoverySize = (profile) => selectSkills(catalog, { profile }).reduce((sum, skill) => sum + skill.name.length + skill.description.length, 0);
  assert.ok(discoverySize('light') < discoverySize('core'));
  const text = await readFile(path.join(f.agentsRoot, 'project-notes/SKILL.md'), 'utf8');
  const coreText = await Promise.all(selectSkills(catalog, { profile: 'core' }).map((s) => readFile(path.join(s.directory, 'SKILL.md'), 'utf8')));
  assert.ok(Buffer.byteLength(text) < Buffer.byteLength(coreText.join('')));
  assert.equal((await runSkillsLifecycle({ ...f, command: 'check', profile: 'light' })).ok, true);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'update', profile: 'light' })).summary.operations, 0);
  const removed = await runSkillsLifecycle({ ...f, command: 'uninstall', profile: 'light' });
  assert.equal(removed.summary.applied, 1);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'rollback', backup: removed.backup, apply: true })).ok, true);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'check', profile: 'light' })).ok, true);
});

test('light installation is additive; explicit migration reduces current profiles and rolls back exact bytes', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'development' });
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
  assert.equal((await readdir(f.agentsRoot)).length, 6);
  const original = await treeSnapshot(f.agentsRoot), before = await treeSnapshot(f.root);
  const preview = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light' });
  assert.equal(preview.operations.filter((op) => op.action === 'remove').length, 5);
  assert.equal(preview.writes, false);
  assert.deepEqual(await treeSnapshot(f.root), before);
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply: true });
  assert.equal(result.ok, true);
  assert.deepEqual(await readdir(f.agentsRoot), ['project-notes']);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply: true })).summary.operations, 0);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true })).ok, true);
  assert.deepEqual(await treeSnapshot(f.agentsRoot), original);
});

test('migration from light to core removes the compact entry and preserves explicit selections', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
  const core = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'core', apply: true });
  assert.equal(core.ok, true);
  assert.deepEqual((await readdir(f.agentsRoot)).sort(), ['project-memory', 'spec-artifacts']);
  const explicit = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', skills: ['spec-artifacts'], apply: true });
  assert.equal(explicit.ok, true);
  assert.deepEqual(await readdir(f.agentsRoot), ['spec-artifacts']);
});

test('light transition preserves changed and unmanaged skills and unrelated plugin folders', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'development' });
  const changed = path.join(f.agentsRoot, 'ui-polish/SKILL.md');
  await writeFile(changed, '# Local edits\n');
  const unmanaged = path.join(f.agentsRoot, 'legacy-contracts');
  await mkdir(unmanaged); await writeFile(path.join(unmanaged, 'SKILL.md'), '# User-owned\n');
  const unrelated = path.join(f.agentsRoot, 'other-plugin');
  await mkdir(unrelated); await writeFile(path.join(unrelated, 'SKILL.md'), '# Other plugin\n');
  const unmanagedBefore = await treeSnapshot(unmanaged), unrelatedBefore = await treeSnapshot(unrelated);
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply: true });
  assert.equal(result.ok, false);
  assert.ok(result.conflicts.some((c) => c.path === path.dirname(changed) && c.code === 'modified-managed'));
  assert.equal(await readFile(changed, 'utf8'), '# Local edits\n');
  assert.deepEqual(await treeSnapshot(unmanaged), unmanagedBefore);
  assert.deepEqual(await treeSnapshot(unrelated), unrelatedBefore);
  assert.ok(await statOrNull(path.join(f.agentsRoot, 'project-notes/SKILL.md')));
  assert.equal(await statOrNull(path.join(f.agentsRoot, 'project-memory')), null);
});

test('CLI exposes light selection and checks the installed compact skill', async (t) => {
  const f = await fixture(t);
  async function cli(args) {
    let out = '', err = '';
    const code = await runCli(args, { cwd: f.root, repoRoot, stdout: { write: (s) => { out += s; } }, stderr: { write: (s) => { err += s; } } });
    assert.equal(code, 0, err || out);
    return JSON.parse(out);
  }
  assert.deepEqual((await cli(['skills', 'list', '--json'])).profiles.light, ['project-notes']);
  const args = ['--profile', 'light', '--agents-root', f.agentsRoot, '--codex-root', f.codexRoot, '--backup-root', f.backupRoot, '--json'];
  const before = await treeSnapshot(f.root);
  assert.equal((await cli(['skills', 'install', ...args, '--dry-run'])).summary.selected, 1);
  assert.deepEqual(await treeSnapshot(f.root), before);
  assert.equal((await cli(['skills', 'install', ...args])).summary.applied, 1);
  assert.equal((await cli(['skills', 'check', ...args])).ok, true);
});

test('a conflicting replacement blocks cleanup in both roots during preview and apply', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'development' });
  await cp(path.join(f.agentsRoot, 'project-memory'), path.join(f.codexRoot, 'project-memory'), { recursive: true });
  const replacement = path.join(f.agentsRoot, 'project-notes');
  await mkdir(replacement); await writeFile(path.join(replacement, 'SKILL.md'), '# Independently owned\n');
  const before = await treeSnapshot(f.root);
  for (const apply of [false, true]) {
    const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply });
    assert.equal(result.ok, false);
    assert.equal(result.writes, false);
    assert.equal(result.backup, null);
    assert.ok(result.conflicts.some((c) => c.code === 'unmanaged'));
    assert.equal(result.operations.some((op) => op.action === 'remove'), false);
    assert.deepEqual(await treeSnapshot(f.root), before);
  }
});

test('a replacement conflict still permits independent installations without retiring the old profile', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
  const previous = await treeSnapshot(path.join(f.agentsRoot, 'project-notes'));
  await mkdir(path.join(f.agentsRoot, 'project-memory'));
  await writeFile(path.join(f.agentsRoot, 'project-memory/SKILL.md'), '# Independently owned\n');
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'core', apply: true });
  assert.equal(result.ok, false);
  assert.equal(result.summary.applied, 1);
  assert.equal(result.operations.some((op) => op.action === 'remove'), false);
  assert.deepEqual(await treeSnapshot(path.join(f.agentsRoot, 'project-notes')), previous);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'check', skills: ['spec-artifacts'] })).ok, true);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true })).ok, true);
  assert.deepEqual(await treeSnapshot(path.join(f.agentsRoot, 'project-notes')), previous);
});

test('a replacement failure after a clean preview preserves all old copies and supports rollback', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'development' });
  await cp(path.join(f.agentsRoot, 'project-memory'), path.join(f.codexRoot, 'project-memory'), { recursive: true });
  const previous = await treeSnapshot(f.agentsRoot), previousCodex = await treeSnapshot(f.codexRoot);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light' })).ok, true);
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply: true,
    beforeOperation: async (entry) => {
      if (entry.action === 'install') {
        await mkdir(entry.path); await writeFile(path.join(entry.path, 'SKILL.md'), '# Concurrent owner\n');
      }
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.summary.applied, 0);
  const remaining = await treeSnapshot(f.agentsRoot);
  for (const [file, hash] of Object.entries(previous.files)) assert.equal(remaining.files[file], hash, file);
  assert.deepEqual(await treeSnapshot(f.codexRoot), previousCodex);
  const beforeRollback = await treeSnapshot(f.agentsRoot);
  const rollback = await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true });
  assert.equal(rollback.ok, true);
  assert.equal(rollback.summary.restored, 0);
  assert.deepEqual(await treeSnapshot(f.agentsRoot), beforeRollback);
});

test('cleanup requires every selected skill even when another replacement installs successfully', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
  const previous = await treeSnapshot(path.join(f.agentsRoot, 'project-notes'));
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'core', apply: true,
    beforeOperation: async (entry) => {
      if (entry.skillName === 'spec-artifacts') {
        await mkdir(entry.path); await writeFile(path.join(entry.path, 'SKILL.md'), '# Concurrent owner\n');
      }
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.summary.applied, 1);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'check', skills: ['project-memory'] })).ok, true);
  assert.deepEqual(await treeSnapshot(path.join(f.agentsRoot, 'project-notes')), previous);
  assert.equal((await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true })).ok, true);
  assert.equal(await statOrNull(path.join(f.agentsRoot, 'project-memory')), null);
  assert.deepEqual(await treeSnapshot(path.join(f.agentsRoot, 'project-notes')), previous);
  assert.equal(await readFile(path.join(f.agentsRoot, 'spec-artifacts/SKILL.md'), 'utf8'), '# Concurrent owner\n');
});

for (const alreadyInstalled of [false, true]) {
  test(`cleanup rechecks ${alreadyInstalled ? 'an already current' : 'a newly installed'} replacement before removals`, async (t) => {
    const f = await fixture(t);
    await runSkillsLifecycle({ ...f, command: 'install', profile: 'development' });
    const previous = await treeSnapshot(f.agentsRoot);
    if (alreadyInstalled) await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
    let changed = false;
    const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply: true,
      beforeOperation: async (entry) => {
        if (entry.action === 'remove' && !changed) {
          changed = true;
          await writeFile(path.join(f.agentsRoot, 'project-notes/SKILL.md'), '# Later edit\n');
        }
      }
    });
    assert.equal(changed, true);
    assert.equal(result.ok, false);
    assert.equal(result.summary.applied, alreadyInstalled ? 0 : 1);
    const remaining = await treeSnapshot(f.agentsRoot);
    for (const [file, hash] of Object.entries(previous.files)) assert.equal(remaining.files[file], hash, file);
    assert.equal(await readFile(path.join(f.agentsRoot, 'project-notes/SKILL.md'), 'utf8'), '# Later edit\n');
  });
}

test('each removal rechecks replacements and stops further cleanup after a later edit', async (t) => {
  const f = await fixture(t);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'development' });
  const previous = await treeSnapshot(f.agentsRoot);
  await runSkillsLifecycle({ ...f, command: 'install', profile: 'light' });
  let attempts = 0, removed;
  const result = await runSkillsLifecycle({ ...f, command: 'migrate', profile: 'light', apply: true,
    beforeOperation: async (entry) => {
      if (entry.action !== 'remove') return;
      if (++attempts === 1) removed = entry.relative;
      if (attempts === 2) await writeFile(path.join(f.agentsRoot, 'project-notes/SKILL.md'), '# Later edit\n');
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.summary.applied, 1);
  const remaining = await treeSnapshot(f.agentsRoot);
  for (const [file, hash] of Object.entries(previous.files)) {
    if (file.startsWith(removed + '/')) assert.equal(remaining.files[file], undefined);
    else assert.equal(remaining.files[file], hash, file);
  }
  const rollback = await runSkillsLifecycle({ ...f, command: 'rollback', backup: result.backup, apply: true });
  assert.equal(rollback.ok, true);
  assert.equal(rollback.summary.restored, 1);
  assert.equal(await readFile(path.join(f.agentsRoot, 'project-notes/SKILL.md'), 'utf8'), '# Later edit\n');
});
