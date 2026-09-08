import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink, realpath } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { bootstrapProject, planBootstrapProject, applyBootstrapPlan, recoverBootstrap } from '../src/bootstrap.mjs';
import { treeSnapshot, sha256 } from '../src/fs-safety.mjs';

const exec = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const pbName = '.ai-agent-playbook';
async function git(target, ...args) {
  return (await exec('git', ['-C', target, ...args], { encoding: 'utf8', windowsHide: true, timeout: 10000 })).stdout.trim();
}
async function fixture(t, withGit = false) {
  const parent = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(parent, 'aapb-bootstrap-v12-'));
  const target = path.join(root, 'project'), home = path.join(root, 'home');
  await mkdir(target); await mkdir(home); await mkdir(path.join(home, 'templates'));
  const environment = { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, '.config'), GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'), GIT_CONFIG_SYSTEM: path.join(home, 'system'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: '0', GIT_TEMPLATE_DIR: path.join(home, 'templates'), GIT_CONFIG_PARAMETERS: undefined, GIT_DIR: undefined, GIT_WORK_TREE: undefined, GIT_INDEX_FILE: undefined, GIT_COMMON_DIR: undefined };
  const original = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(environment)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  t.after(async () => {
    for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    assert.equal(path.dirname(root), parent); assert.ok(path.basename(root).startsWith('aapb-bootstrap-v12-'));
    await rm(root, { recursive: true, force: true });
  });
  if (withGit) await git(target, 'init', '--quiet');
  return { root, target, home, pb: path.join(target, pbName), options: { target, repoRoot } };
}
const contents = (file) => readFile(file, 'utf8');
const absent = async (file) => assert.rejects(readFile(file), { code: 'ENOENT' });
async function ignored(target, relative) {
  try { return Boolean(await git(target, 'check-ignore', '--', relative)); }
  catch (error) { if (error.code === 1) return false; throw error; }
}

async function shortPath(t, directory) {
  const script = '[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); (New-Object -ComObject Scripting.FileSystemObject).GetFolder($env:AAPB_SHORT_PATH).ShortPath';
  // Cold Windows CI startup can exhaust ten seconds; this bound is only for the test helper.
  const result = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { env: { ...process.env, AAPB_SHORT_PATH: directory }, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  const alias = result.stdout.trim();
  assert.equal(await realpath(alias), directory);
  if (path.resolve(alias).toLowerCase() === directory.toLowerCase()) { t.skip('Filesystem does not expose a distinct short path.'); return null; }
  return alias;
}

test('Windows short exclusion paths cannot alias protected records, Git metadata or another exclusion scope', { skip: process.platform !== 'win32' }, async (t) => {
  const f = await fixture(t, true), alias = await shortPath(t, f.root);
  if (!alias) return;
  for (const suffix of ['project/.git/config', 'project/.git/info/exclude', 'project/.ai-agent-playbook/CURRENT.md', 'project/AGENTS.md']) {
    await git(f.target, 'config', '--global', 'core.excludesFile', path.join(alias, suffix));
    const before = await treeSnapshot(f.root);
    for (const dryRun of [true, false]) await assert.rejects(bootstrapProject({ ...f.options, exclude: 'global', dryRun }), /Git metadata|overlap|same file/);
    assert.deepEqual(await treeSnapshot(f.root), before);
  }
});

test('Windows short paths support new exclusion suffixes and old recovery journals', { skip: process.platform !== 'win32' }, async (t) => {
  const f = await fixture(t, true), alias = await shortPath(t, f.root);
  if (!alias) return;
  const ignore = path.join(f.home, 'new/global/ignore');
  await git(f.target, 'config', '--global', 'core.excludesFile', path.join(alias, 'home/new/global/ignore'));
  const applied = await bootstrapProject({ ...f.options, exclude: 'global' });
  assert.equal(applied.applied, true); assert.match(await contents(ignore), /ai-agent-playbook exclusions/);
  const journal = JSON.parse(await contents(applied.backup));
  for (const op of journal.operations) op.file = path.join(alias, path.relative(f.root, op.file));
  await writeFile(applied.backup, JSON.stringify(journal));
  assert.equal((await recoverBootstrap({ target: f.target, transaction: applied.backup })).applied, true);
  await absent(ignore); await absent(path.join(f.pb, 'CURRENT.md'));
  assert.equal((await recoverBootstrap({ target: f.target, transaction: applied.backup })).applied, false);
});

test('Git-less minimal defaults preserve policy, user metadata and ownership bytes on repeat', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.target, 'AGENTS.md'), '# My policy\r\nKeep this exactly.');
  const previewBefore = await treeSnapshot(f.root);
  assert.equal((await bootstrapProject({ ...f.options, dryRun: true })).writes, false);
  assert.deepEqual(await treeSnapshot(f.root), previewBefore);
  await bootstrapProject(f.options);
  assert.deepEqual((await readdir(f.pb)).sort(), ['.ai-agent-playbook-install.json', 'CURRENT.md', 'manifest.json']);
  const marker = await contents(path.join(f.pb, '.ai-agent-playbook-install.json'));
  await writeFile(path.join(f.pb, 'manifest.json'), '{"layoutKind":"custom","mine":42}\n');
  await writeFile(path.join(f.pb, 'CURRENT.md'), '# My current evidence\n');
  const before = await treeSnapshot(f.root);
  assert.equal((await bootstrapProject(f.options)).applied, false);
  assert.deepEqual(await treeSnapshot(f.root), before);
  assert.equal(await contents(path.join(f.pb, '.ai-agent-playbook-install.json')), marker);
});

test('standard English and Korean guides are useful editable documents; existing guides stay untouched', async (t) => {
  const f = await fixture(t);
  for (const lang of ['en', 'ko']) {
    const target = path.join(f.target, lang); await mkdir(target);
    const options = { target, repoRoot, lang, records: 'standard' };
    await bootstrapProject(options);
    const pb = path.join(target, pbName);
    const marker = JSON.parse(await contents(path.join(pb, '.ai-agent-playbook-install.json')));
    assert.deepEqual(Object.keys(marker.files), ['manifest.json']);
    assert.ok(marker.userFiles.includes('worklogs/README.md'));
    assert.match(await contents(path.join(pb, 'worklogs/README.md')), /YYYY-MM/);
    assert.match(await contents(path.join(pb, 'knowledge/README.md')), /CURRENT.md/);
    assert.match(await contents(path.join(pb, 'CURRENT.md')), lang === 'ko' ? /현재 상태/ : /Current state/);
    await writeFile(path.join(pb, 'worklogs/README.md'), 'My worklog rules\n');
    const before = await treeSnapshot(target);
    assert.equal((await bootstrapProject(options)).applied, false);
    assert.deepEqual(await treeSnapshot(target), before);
  }
});

test('explicit choices persist in unchanged managed metadata with matching ownership and editable documents preserved', async (t) => {
  const f = await fixture(t);
  await bootstrapProject(f.options);
  await writeFile(path.join(f.pb, 'CURRENT.md'), '# Original English evidence\n');
  const options = { ...f.options, lang: 'ko', records: 'standard', kind: 'workspace', repositories: [] };
  const before = await treeSnapshot(f.root);
  const preview = await bootstrapProject({ ...options, dryRun: true });
  assert.ok(preview.operations.includes('manifest.json')); assert.ok(preview.operations.includes('.ai-agent-playbook-install.json'));
  assert.deepEqual(await treeSnapshot(f.root), before);
  const output = await bootstrapProject(options);
  assert.ok(output.backup);
  const bytes = await readFile(path.join(f.pb, 'manifest.json')), manifest = JSON.parse(bytes.toString());
  assert.equal(manifest.lang, 'ko'); assert.equal(manifest.layoutKind, 'standard'); assert.equal(manifest.kind, 'workspace');
  const marker = JSON.parse(await contents(path.join(f.pb, '.ai-agent-playbook-install.json')));
  assert.equal(marker.files['manifest.json'], sha256(bytes));
  assert.deepEqual(Object.keys(marker.files), ['manifest.json']);
  assert.ok(marker.userFiles.includes('worklogs/README.md')); assert.ok(marker.userFiles.includes('knowledge/README.md'));
  assert.equal(await contents(path.join(f.pb, 'CURRENT.md')), '# Original English evidence\n');
  const after = await treeSnapshot(f.root);
  assert.equal((await bootstrapProject(options)).applied, false);
  assert.deepEqual(await treeSnapshot(f.root), after);
});

test('modified or unmanaged metadata is preserved with an explicit persistence warning', async (t) => {
  const f = await fixture(t);
  await bootstrapProject(f.options);
  const manifest = path.join(f.pb, 'manifest.json'), marker = path.join(f.pb, '.ai-agent-playbook-install.json');
  const markerBefore = await contents(marker);
  const body = '{"schemaVersion":"2","source":"ai-agent-playbook","layoutKind":"minimal","lang":"en","user":42}\n';
  await writeFile(manifest, body);
  const output = await bootstrapProject({ ...f.options, lang: 'ko', records: 'standard' });
  assert.ok(output.warnings.some((message) => /Selected metadata was not persisted/.test(message)));
  assert.equal(await contents(manifest), body); assert.equal(await contents(marker), markerBefore);
  assert.match(await contents(path.join(f.pb, 'worklogs/README.md')), /작업 기록/);
});

test('owned legacy metadata updates retain array ownership and unrelated marker entries', async (t) => {
  const f = await fixture(t), legacy = path.join(f.target, '.ai-playbook'); await mkdir(legacy);
  const original = '{"schemaVersion":1,"layoutKind":"structured","lang":"en","custom":"preserve"}\n';
  const oldMarker = { schemaVersion: 1, source: 'ai-agent-playbook', custom: { keep: true }, files: [
    { relativePath: '.ai-playbook/manifest.json', sourceHash: sha256(original), custom: 'keep' }, // Legacy ownership format.
    { path: '.ai-playbook/other.json', sourceHash: 'other' } // Legacy unrelated record remains owned.
  ] };
  await writeFile(path.join(legacy, 'manifest.json'), original);
  await writeFile(path.join(legacy, '.ai-agent-playbook-install.json'), JSON.stringify(oldMarker));
  await writeFile(path.join(legacy, 'CURRENT.md'), 'Keep this current state\n');
  await bootstrapProject({ ...f.options, lang: 'ko' });
  const bytes = await readFile(path.join(legacy, 'manifest.json'));
  const marker = JSON.parse(await contents(path.join(legacy, '.ai-agent-playbook-install.json')));
  assert.ok(Array.isArray(marker.files)); assert.deepEqual(marker.files[1], oldMarker.files[1]); assert.deepEqual(marker.custom, oldMarker.custom);
  assert.equal(marker.files[0].sourceHash, sha256(bytes)); assert.equal(marker.files[0].custom, 'keep');
  assert.equal(JSON.parse(bytes.toString()).layoutKind, 'structured');
  assert.equal(JSON.parse(bytes.toString()).lang, 'ko');
});

test('manifest and marker changes roll back together on failure, and marker concurrency blocks writes', async (t) => {
  const f = await fixture(t); await bootstrapProject(f.options);
  const before = await treeSnapshot(f.root), plan = await planBootstrapProject({ ...f.options, lang: 'ko', records: 'standard' });
  await assert.rejects(applyBootstrapPlan(plan, { beforeWrite: ({ label }) => { if (label === '.ai-agent-playbook-install.json') throw new Error('Metadata failure'); } }), /rolled back/);
  assert.deepEqual(await treeSnapshot(f.root), before);
  const fresh = await planBootstrapProject({ ...f.options, lang: 'ko' });
  await writeFile(path.join(f.pb, '.ai-agent-playbook-install.json'), '{}\n');
  const changed = await treeSnapshot(f.root);
  await assert.rejects(applyBootstrapPlan(fresh), { code: 'aapb.bootstrap-concurrent-edit' });
  assert.deepEqual(await treeSnapshot(f.root), changed);
});

test('legacy playbook and ownership array are preserved when standard guides and AGENTS links are added', async (t) => {
  const f = await fixture(t), pb = path.join(f.target, '.ai-playbook');
  await mkdir(pb);
  const manifest = '{"schemaVersion":1,"layoutKind":"structured","user":true}\r\n';
  const marker = '{"source":"ai-agent-playbook","files":[{"path":".ai-playbook/manifest.json","sourceHash":"user"}]}\n'; // Legacy ownership fixture.
  await writeFile(path.join(pb, 'manifest.json'), manifest);
  await writeFile(path.join(pb, '.ai-agent-playbook-install.json'), marker);
  await writeFile(path.join(pb, 'CURRENT.md'), 'Original current\n');
  await writeFile(path.join(f.target, 'AGENTS.md'), '# Existing rules\r\n');
  const output = await bootstrapProject({ ...f.options, records: 'standard', agents: 'link' });
  assert.equal(output.agentsPreserved, false);
  assert.equal(await contents(path.join(pb, 'manifest.json')), manifest);
  assert.equal(await contents(path.join(pb, '.ai-agent-playbook-install.json')), marker);
  assert.match(await contents(path.join(f.target, 'AGENTS.md')), /^# Existing rules\r\n/);
  assert.match(await contents(path.join(f.target, 'AGENTS.md')), /\]\(\.ai-playbook\/CURRENT.md\)/);
  const before = await treeSnapshot(f.root);
  assert.equal((await bootstrapProject({ ...f.options, records: 'standard', agents: 'link' })).applied, false);
  assert.deepEqual(await treeSnapshot(f.root), before);
});

test('local and shared exclusions actually ignore records while preserving unowned lines', async (t) => {
  const f = await fixture(t, true);
  const exclude = path.join(f.target, '.git/info/exclude');
  await mkdir(path.dirname(exclude), { recursive: true });
  const user = '# User excludes\r\nprivate.txt\r\n';
  await writeFile(exclude, user);
  await writeFile(path.join(f.target, '.gitignore'), '# User sharing\nnode_modules/\n');
  await bootstrapProject({ ...f.options, exclude: 'local' });
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
  assert.ok((await contents(exclude)).startsWith(user));
  await bootstrapProject({ ...f.options, exclude: 'shared' });
  assert.equal(await contents(exclude), user);
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
  assert.match(await contents(path.join(f.target, '.gitignore')), /^# User sharing\nnode_modules\//);
  await bootstrapProject({ ...f.options, exclude: 'none' });
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), false);
  assert.equal(await contents(path.join(f.target, '.gitignore')), '# User sharing\nnode_modules/\n');
});

test('unowned legacy ignore lines and edited owned blocks are never migrated away', async (t) => {
  const f = await fixture(t, true), file = path.join(f.target, '.gitignore');
  await writeFile(file, `${pbName}/\n# Mine\n`);
  await bootstrapProject({ ...f.options, exclude: 'shared' });
  await writeFile(file, (await contents(file)).replace(`/${pbName}/`, `/${pbName}/\nmy-secret/`));
  const original = await contents(file);
  const output = await bootstrapProject({ ...f.options, exclude: 'none' });
  assert.equal(await contents(file), original);
  assert.ok(output.warnings.some((message) => /Edited or ambiguous/.test(message)));
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
});

test('local exclusion is anchored to the selected nested path and escapes Git pattern characters', async (t) => {
  const f = await fixture(t, true), target = path.join(f.target, 'nested [one]');
  await mkdir(target);
  await bootstrapProject({ target, repoRoot, exclude: 'local' });
  assert.equal(await ignored(f.target, `nested [one]/${pbName}/CURRENT.md`), true);
  assert.equal(await ignored(f.target, `nested o/${pbName}/CURRENT.md`), false);
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), false);
});

test('linked worktree uses git-path info/exclude and leaves the index unchanged', async (t) => {
  const f = await fixture(t, true), linked = path.join(f.root, 'linked');
  await git(f.target, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'fixture');
  await git(f.target, 'worktree', 'add', '--quiet', '--detach', linked);
  const expected = path.resolve(linked, await git(linked, 'rev-parse', '--git-path', 'info/exclude'));
  const index = path.resolve(linked, await git(linked, 'rev-parse', '--git-path', 'index'));
  const before = await readFile(index);
  const output = await bootstrapProject({ target: linked, repoRoot, exclude: 'local' });
  assert.equal(output.exclusion.locations.find((entry) => entry.mode === 'local').file, expected);
  assert.equal(await ignored(linked, `${pbName}/CURRENT.md`), true);
  assert.deepEqual(await readFile(index), before);
  assert.ok(output.warnings.some((warning) => /linked worktrees/.test(warning)));
});

test('global mode respects configured excludesFile, backs it up and reports effects across repositories', async (t) => {
  const f = await fixture(t, true), file = path.join(f.home, 'existing.ignore');
  await writeFile(file, '# Personal ignores\n*.private\n');
  await git(f.target, 'config', '--global', 'core.excludesFile', file);
  const configBefore = await contents(path.join(f.home, '.gitconfig'));
  const output = await bootstrapProject({ ...f.options, exclude: 'global' });
  assert.equal(output.exclusion.globalImpact, true); assert.ok(output.backup);
  assert.ok((await contents(file)).startsWith('# Personal ignores\n*.private\n'));
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
  const other = path.join(f.root, 'other'); await mkdir(other); await git(other, 'init', '--quiet');
  assert.equal(await ignored(other, `${pbName}/CURRENT.md`), true);
  assert.equal(await contents(path.join(f.home, '.gitconfig')), configBefore);
  const backup = JSON.parse(await contents(output.backup));
  assert.equal(Buffer.from(backup.operations.find((entry) => entry.file === file).before, 'base64').toString(), '# Personal ignores\n*.private\n');
  await bootstrapProject({ ...f.options, exclude: 'local' });
  assert.equal(await contents(file), '# Personal ignores\n*.private\n');
  assert.equal(await ignored(other, `${pbName}/CURRENT.md`), false);
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
});

test('global default uses Git XDG ignore without writing a config file, including a Git-less target', async (t) => {
  const f = await fixture(t);
  const output = await bootstrapProject({ ...f.options, exclude: 'global' });
  assert.ok(output.backup);
  const file = path.join(f.home, '.config/git/ignore');
  assert.match(await contents(file), /\.ai-agent-playbook\//);
  assert.equal((await contents(file)).includes(f.target), false);
  await absent(path.join(f.home, '.gitconfig'));
  await git(f.target, 'init', '--quiet');
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
});

test('relative configured excludesFile is honored and never written into global configuration', async (t) => {
  const f = await fixture(t, true);
  await git(f.target, 'config', '--global', 'core.excludesFile', 'custom.ignore');
  const before = await contents(path.join(f.home, '.gitconfig'));
  await bootstrapProject({ ...f.options, exclude: 'global' });
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
  assert.match(await contents(path.join(f.target, 'custom.ignore')), /\.ai-agent-playbook\//);
  assert.equal(await contents(path.join(f.home, '.gitconfig')), before);
  const nested = path.join(f.target, 'nested'); await mkdir(nested);
  await bootstrapProject({ target: nested, repoRoot, exclude: 'global' });
  assert.equal(await ignored(f.target, `nested/${pbName}/CURRENT.md`), true);
  await absent(path.join(nested, 'custom.ignore'));
});

test('Git-less local-only bootstraps records, reports the skipped exclusion and never initializes Git', async (t) => {
  const f = await fixture(t);
  const output = await bootstrapProject({ ...f.options, localOnly: true });
  assert.equal(output.applied, true);
  assert.equal(output.exclusion.applied, false); assert.equal(output.exclusion.reason, 'no-git-worktree');
  assert.ok(output.warnings.some((message) => /not applied/.test(message)));
  assert.ok(!output.operations.includes('git-local-exclude'));
  assert.match(await contents(path.join(f.pb, 'CURRENT.md')), /Current state/);
  assert.deepEqual((await readdir(f.target)).sort(), [pbName]);
  assert.deepEqual(await readdir(f.home), ['templates']);
});

test('bootstrap from a registered member reuses shared records and does not create duplicate records', async (t) => {
  const f = await fixture(t), member = path.join(f.target, 'member'); await mkdir(member);
  await bootstrapProject({ ...f.options, kind: 'workspace', repositories: [{ id: 'member', path: 'member' }], lang: 'ko', records: 'standard' });
  const before = await treeSnapshot(f.root);
  const output = await bootstrapProject({ target: member, repoRoot, records: 'standard', agents: 'link', exclude: 'shared' });
  assert.equal(output.applied, false);
  assert.ok(output.warnings.some((message) => /shared workspace records/.test(message)));
  assert.deepEqual(await treeSnapshot(f.root), before);
  await absent(path.join(member, pbName, 'CURRENT.md'));
});

test('exclusion modes, AGENTS linking and workspace selection honor dry-run across project and Git home', async (t) => {
  const f = await fixture(t, true);
  await mkdir(path.join(f.target, 'member'));
  for (const exclude of ['none', 'local', 'shared', 'global']) {
    const before = await treeSnapshot(f.root);
    const output = await bootstrapProject({ ...f.options, dryRun: true, kind: 'workspace', repositories: [{ id: 'member', path: 'member' }], exclude, agents: 'link', records: 'standard' });
    assert.equal(output.applied, false); assert.equal(output.writes, false);
    assert.ok(output.operations.includes('workspace.json'));
    assert.deepEqual(await treeSnapshot(f.root), before);
  }
});

test('workspace registers only explicit bounded members and preserves existing registry bytes', async (t) => {
  const f = await fixture(t), repositories = [];
  for (let i = 1; i <= 12; i++) {
    const id = 'repo-' + i; await mkdir(path.join(f.target, id)); repositories.push({ id, path: id, role: 'service' });
  }
  await assert.rejects(bootstrapProject({ ...f.options, kind: 'workspace' }), /explicit repository selection/);
  await absent(path.join(f.pb, 'CURRENT.md'));
  const selected = repositories.slice(0, 10);
  await bootstrapProject({ ...f.options, kind: 'workspace', repositories: selected });
  const original = await contents(path.join(f.pb, 'workspace.json'));
  assert.deepEqual(JSON.parse(original).repositories, selected);
  const output = await bootstrapProject({ ...f.options, kind: 'workspace', repositories });
  assert.equal(output.applied, false);
  assert.ok(output.warnings.some((warning) => /membership was preserved/.test(warning)));
  assert.equal(await contents(path.join(f.pb, 'workspace.json')), original);
  await absent(path.join(f.target, 'repo-1', pbName, 'CURRENT.md'));
});

test('unsafe repository paths and junctions fail preflight without modifying either root', async (t) => {
  const f = await fixture(t), outside = path.join(f.root, 'outside'); await mkdir(outside);
  await symlink(outside, path.join(f.target, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const relative of ['../outside', 'linked', '.git', 'C:/private', 'thing:stream']) {
    await assert.rejects(bootstrapProject({ ...f.options, kind: 'workspace', repositories: [{ id: 'unsafe', path: relative }] }), /relative|Unsafe|link|junction|metadata/);
    await absent(path.join(f.pb, 'CURRENT.md'));
  }
  assert.deepEqual(await readdir(outside), []);
});

test('linked exclusion parent and overlapping Git metadata are rejected before records are created', async (t) => {
  const f = await fixture(t, true), outside = path.join(f.root, 'outside'); await mkdir(outside);
  const linked = path.join(f.home, 'linked'); await symlink(outside, linked, process.platform === 'win32' ? 'junction' : 'dir');
  await git(f.target, 'config', '--global', 'core.excludesFile', path.join(linked, 'ignore'));
  await assert.rejects(bootstrapProject({ ...f.options, exclude: 'global' }), /link|junction/);
  await git(f.target, 'config', '--global', 'core.excludesFile', path.join(f.target, '.git/config'));
  await assert.rejects(bootstrapProject({ ...f.options, exclude: 'global' }), /Git metadata/);
  await absent(path.join(f.pb, 'CURRENT.md'));
  assert.deepEqual(await readdir(outside), []);
});

test('tracked records trigger a warning while their index entries stay byte-identical', async (t) => {
  const f = await fixture(t, true);
  await bootstrapProject(f.options);
  await git(f.target, 'add', '--', `${pbName}/CURRENT.md`);
  const file = path.join(f.target, '.git/index'), before = await readFile(file);
  const output = await bootstrapProject({ ...f.options, exclude: 'shared' });
  assert.ok(output.warnings.some((warning) => /1 tracked playbook/.test(warning)));
  assert.deepEqual(await readFile(file), before);
});

test('preflight detects concurrent document and global-config edits before any bootstrap write', async (t) => {
  const f = await fixture(t, true);
  await writeFile(path.join(f.target, '.gitignore'), '# Before\n');
  const plan = await planBootstrapProject({ ...f.options, exclude: 'shared' });
  await writeFile(path.join(f.target, '.gitignore'), '# Concurrent edit\n');
  const before = await treeSnapshot(f.root);
  await assert.rejects(applyBootstrapPlan(plan), { code: 'aapb.bootstrap-concurrent-edit' });
  assert.deepEqual(await treeSnapshot(f.root), before);
  const globalPlan = await planBootstrapProject({ ...f.options, exclude: 'global' });
  await git(f.target, 'config', '--global', 'core.excludesFile', path.join(f.home, 'changed.ignore'));
  const configBefore = await treeSnapshot(f.root);
  await assert.rejects(applyBootstrapPlan(globalPlan), { code: 'aapb.bootstrap-concurrent-edit' });
  assert.deepEqual(await treeSnapshot(f.root), configBefore);
});

test('partial write failure restores earlier records and removes newly created directories', async (t) => {
  const f = await fixture(t), before = await treeSnapshot(f.root);
  const plan = await planBootstrapProject({ ...f.options, records: 'standard', agents: 'link' });
  await assert.rejects(applyBootstrapPlan(plan, { beforeWrite: ({ index }) => { if (index === 2) throw new Error('Injected disk failure'); } }), (error) => {
    assert.equal(error.rolledBack, true); assert.equal(error.recovery, null); return /Injected disk failure/.test(error.message);
  });
  assert.deepEqual(await treeSnapshot(f.root), before);
});

test('rollback never removes an unwritten file concurrently created with the expected bytes', async (t) => {
  const f = await fixture(t), plan = await planBootstrapProject(f.options);
  await assert.rejects(applyBootstrapPlan(plan, { beforeWrite: async ({ index, path: file }) => {
    if (index === 1) await writeFile(file, plan.operations[index].after);
  } }), /changed after bootstrap preflight/);
  assert.deepEqual(await readFile(path.join(f.pb, 'manifest.json')), plan.operations[1].after);
  await absent(path.join(f.pb, 'CURRENT.md'));
});

test('a process interrupted between writes leaves a durable journal that can recover its changes', async (t) => {
  const f = await fixture(t);
  const source = new URL('../src/bootstrap.mjs', import.meta.url).href;
  const script = `import {planBootstrapProject,applyBootstrapPlan} from ${JSON.stringify(source)}; const plan=await planBootstrapProject(${JSON.stringify(f.options)}); await applyBootstrapPlan(plan,{beforeWrite:({index})=>{if(index===1) process.exit(23);}});`;
  await assert.rejects(exec(process.execPath, ['--input-type=module', '-e', script], { windowsHide: true, timeout: 10000 }), { code: 23 });
  const journals = await readdir(path.join(f.pb, 'archive'));
  assert.equal(journals.length, 1);
  const transaction = 'archive/' + journals[0];
  assert.match(await contents(path.join(f.pb, 'CURRENT.md')), /Current state/);
  assert.equal((await recoverBootstrap({ target: f.target, transaction })).applied, true);
  await absent(path.join(f.pb, 'CURRENT.md'));
});

test('partial exclusion migration failure restores an earlier modified ignore file', async (t) => {
  const f = await fixture(t, true);
  await bootstrapProject({ ...f.options, exclude: 'shared' });
  const before = await treeSnapshot(f.root);
  const plan = await planBootstrapProject({ ...f.options, exclude: 'local' });
  await assert.rejects(applyBootstrapPlan(plan, { beforeWrite: ({ label }) => { if (label === 'git-shared-exclude') throw new Error('Injected failure after local write'); } }), /rolled back/);
  assert.deepEqual(await treeSnapshot(f.root), before);
  assert.equal(await ignored(f.target, `${pbName}/CURRENT.md`), true);
});

test('later edits survive failed rollback and checked recovery provides a usable journal', async (t) => {
  const f = await fixture(t), plan = await planBootstrapProject({ ...f.options, records: 'standard' });
  let recovery;
  await assert.rejects(applyBootstrapPlan(plan, { beforeWrite: async ({ index }) => {
    if (index === 1) { await writeFile(path.join(f.pb, 'CURRENT.md'), '# User edit during write\n'); throw new Error('Injected failure'); }
  } }), (error) => { recovery = error.recovery; assert.equal(error.rolledBack, false); return Boolean(recovery); });
  assert.equal(await contents(path.join(f.pb, 'CURRENT.md')), '# User edit during write\n');
  const before = await treeSnapshot(f.root);
  const preview = await recoverBootstrap({ target: f.target, transaction: recovery, dryRun: true });
  assert.equal(preview.ok, false); assert.equal(preview.conflicts.length, 1);
  assert.deepEqual(await treeSnapshot(f.root), before);
  assert.equal((await recoverBootstrap({ target: f.target, transaction: recovery })).writes, false);
  // Simulate the user reconciling the conflict with the known generated version.
  await writeFile(path.join(f.pb, 'CURRENT.md'), plan.operations[0].after);
  assert.equal((await recoverBootstrap({ target: f.target, transaction: recovery })).applied, true);
  await absent(path.join(f.pb, 'CURRENT.md'));
  assert.equal((await recoverBootstrap({ target: f.target, transaction: recovery })).applied, false);
  assert.equal((await bootstrapProject(f.options)).applied, true);
});

test('successful global backup can be previewed and rolled back without touching unrelated files', async (t) => {
  const f = await fixture(t, true), file = path.join(f.home, 'ignore');
  await writeFile(file, '# Original\n');
  await git(f.target, 'config', '--global', 'core.excludesFile', file);
  const output = await bootstrapProject({ ...f.options, exclude: 'global' });
  const before = await treeSnapshot(f.root);
  assert.equal((await recoverBootstrap({ target: f.target, transaction: output.backup, dryRun: true })).writes, false);
  assert.deepEqual(await treeSnapshot(f.root), before);
  assert.equal((await recoverBootstrap({ target: f.target, transaction: output.backup })).applied, true);
  assert.equal(await contents(file), '# Original\n');
  await assert.rejects(recoverBootstrap({ target: f.target, transaction: '../outside.json' }), /journal/);
});
