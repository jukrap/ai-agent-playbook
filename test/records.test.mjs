import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrapRecords, playbookRead, playbookSearch, playbookStatus, playbookValidate, migrateRecords, rollbackRecordMigration } from '../src/records.mjs';
import { sha256, treeSnapshot } from '../src/fs-safety.mjs';
import { listWorklogs } from '../src/record-authoring.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function fixture(t) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-records-'));
  t.after(async () => { assert.equal(path.dirname(target), os.tmpdir()); await rm(target, { recursive: true, force: true }); });
  return target;
}
test('bootstrap creates one editable entrypoint, preserves policy, and is idempotent', async (t) => {
  const target = await fixture(t);
  await writeFile(path.join(target, 'AGENTS.md'), 'User policy\n');
  const before = await treeSnapshot(target);
  await bootstrapRecords({ target, repoRoot, dryRun: true });
  assert.deepEqual(await treeSnapshot(target), before);
  await bootstrapRecords({ target, repoRoot });
  const pb = path.join(target, '.ai-agent-playbook');
  assert.deepEqual((await readdir(pb)).sort(), ['.ai-agent-playbook-install.json', 'CURRENT.md', 'manifest.json']);
  await writeFile(path.join(pb, 'CURRENT.md'), '# Current\n\nUser content.\n');
  const current = await treeSnapshot(target);
  assert.equal((await bootstrapRecords({ target, repoRoot })).applied, false);
  assert.deepEqual(await treeSnapshot(target), current);
  assert.equal((await playbookValidate({ target })).ok, true);
  assert.equal(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), 'User policy\n');
});

test('worklog kind excludes guide and summary documents in conventional and custom folders', async (t) => {
  const target = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  const pb = path.join(target, '.ai-agent-playbook');
  const manifestFile = path.join(pb, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  await writeFile(manifestFile, JSON.stringify({ ...manifest, recordPaths: { worklogs: 'history/tasks' } }));
  const roots = ['worklogs', 'workflows/worklogs', 'history/tasks'];
  for (const root of roots) {
    await mkdir(path.join(pb, root, '2026-09'), { recursive: true });
    for (const name of ['README.md', 'index.md', '2026-09-summary.md', '2026-09/2026-09-09-work.md']) {
      await writeFile(path.join(pb, root, name), '# Worklog-kind-probe\n');
    }
  }
  const before = await treeSnapshot(target);
  const logs = await playbookSearch({ target, query: 'Worklog-kind-probe', kind: 'worklog' });
  assert.deepEqual(logs.results.map((entry) => entry.path).sort(), roots.map((root) => root + '/2026-09/2026-09-09-work.md').sort());
  const listed = await listWorklogs({ target });
  assert.deepEqual(listed.items.map((entry) => entry.path).sort(), logs.results.map((entry) => entry.path).sort());
  const other = await playbookSearch({ target, query: 'Worklog-kind-probe', kind: 'other' });
  assert.equal(other.results.length, 9);
  assert.deepEqual(await treeSnapshot(target), before);
});
test('records are bounded, literal, non-mutating and retain source locations', async (t) => {
  const target = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  await writeFile(path.join(target, '.ai-agent-playbook/CURRENT.md'), '# State\nKeep API 0.5.11\n[x] is literal\n' + 'a'.repeat(1000));
  const before = await treeSnapshot(target);
  const read = await playbookRead({ target, startLine: 2, maxChars: 12 });
  assert.equal(read.content, 'Keep API 0.5');
  assert.equal(read.truncated, true);
  const search = await playbookSearch({ target, query: '[x]' });
  assert.equal(search.results[0].line, 3);
  assert.equal(search.results[0].path, 'CURRENT.md');
  assert.deepEqual(await treeSnapshot(target), before);
  await assert.rejects(playbookRead({ target, path: '../AGENTS.md' }), /Unsafe|relative/);
  await assert.rejects(playbookRead({ target, path: 'C:/private.md' }), /relative/);
  await assert.rejects(playbookRead({ target, path: 'CURRENT.md:stream' }), /relative/);
});

test('record path filters match platform casing and retain actual filenames', async (t) => {
  const target = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  const pb = path.join(target, '.ai-agent-playbook');
  await writeFile(path.join(pb, 'CURRENT.md'), '# Case-probe\n');
  await mkdir(path.join(pb, 'workflows/plans'), { recursive: true });
  await writeFile(path.join(pb, 'workflows/plans/plan.MD'), '# Case-probe\n');
  const before = await treeSnapshot(target);
  for (const [exact, alias] of [['CURRENT.md', 'current.md'], ['workflows/plans', 'WORKFLOWS/plans']]) {
    const original = await playbookSearch({ target, query: 'Case-probe', path: exact });
    const alternate = await playbookSearch({ target, query: 'Case-probe', path: alias });
    assert.equal(original.matchCount, 1);
    assert.equal(alternate.scan.complete, true);
    if (process.platform === 'win32') assert.deepEqual(alternate.results, original.results);
    else assert.equal(alternate.matchCount, 0);
  }
  if (process.platform === 'win32') assert.equal((await playbookRead({ target, path: 'current.MD' })).content, '# Case-probe\n');
  assert.deepEqual(await treeSnapshot(target), before);
});

test('month search and worklog list agree on metadata dates while pruning other months', async (t) => {
  const target = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  const pb = path.join(target, '.ai-agent-playbook');
  const metadata = { kind: 'worklog', id: 'month-probe', createdAt: '2026-09-09T11:00:00.000Z', repos: [], topic: 'month-probe' };
  for (const name of ['undated.md', '2026-09/entry.md', '2026-08/entry.md', '2026-08-01-earlier.md']) {
    const file = path.join(pb, 'worklogs', name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, '<!-- aapb-record ' + JSON.stringify(metadata) + ' -->\n# Month-probe\n');
  }
  const before = await treeSnapshot(target);
  const listed = await listWorklogs({ target, month: '2026-09' });
  const searched = await playbookSearch({ target, query: 'Month-probe', kind: 'worklog', month: '2026-09' });
  assert.equal(listed.items.length, 2);
  assert.deepEqual([...new Set(searched.results.map((item) => item.path))].sort(), listed.items.map((item) => item.path).sort());
  assert.equal(searched.scannedFiles, 2);
  assert.equal(searched.scan.complete, true);
  assert.deepEqual(await treeSnapshot(target), before);
});
test('linked record directories cannot disclose data outside the bound project', async (t) => {
  const target = await fixture(t), outside = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  await writeFile(path.join(outside, 'private.md'), 'not a record');
  await symlink(outside, path.join(target, '.ai-agent-playbook/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(playbookRead({ target, path: 'linked/private.md' }), /link|junction/);
  const search = await playbookSearch({ target, query: 'not a record' });
  assert.equal(search.results.length, 0);
  assert.ok(search.warnings.sample.some((w) => w.code === 'linked-record'));
});
test('legacy roots and ownership arrays remain readable; ambiguity is reported', async (t) => {
  const target = await fixture(t), pb = path.join(target, '.ai-playbook');
  await mkdir(pb);
  const body = '{"schemaVersion":"1","layoutKind":"structured"}\n';
  await writeFile(path.join(pb, 'CURRENT.md'), '# Kept legacy record\n');
  await writeFile(path.join(pb, 'manifest.json'), body);
  await writeFile(path.join(pb, '.ai-agent-playbook-install.json'), JSON.stringify({ source: 'ai-agent-playbook', schemaVersion: '1', files: [{ path: '.ai-playbook/manifest.json', sourceHash: sha256(body) }] }));
  assert.equal((await playbookStatus({ target })).layout, 'structured');
  assert.equal((await playbookValidate({ target })).ok, true);
  assert.match((await playbookRead({ target })).content, /Kept legacy/);
  await mkdir(path.join(target, '.ai-agent-playbook'));
  await assert.rejects(playbookStatus({ target }), /Multiple/);
});
test('layout migration preserves documents and supports checked rollback and replay', async (t) => {
  const target = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  const pb = path.join(target, '.ai-agent-playbook'), body = '{"schemaVersion":"1","layoutKind":"structured"}\n';
  await writeFile(path.join(pb, 'manifest.json'), body);
  await writeFile(path.join(pb, '.ai-agent-playbook-install.json'), JSON.stringify({ schemaVersion: 1, source: 'ai-agent-playbook', files: [{ path: '.ai-agent-playbook/manifest.json', sourceHash: sha256(body) }] }));
  await writeFile(path.join(pb, 'CURRENT.md'), '# Reviewed\nDo not change API.\n');
  const before = await treeSnapshot(target);
  await migrateRecords({ target });
  assert.deepEqual(await treeSnapshot(target), before);
  assert.equal((await migrateRecords({ target, apply: true })).applied, true);
  assert.equal((await migrateRecords({ target, apply: true })).applied, false);
  assert.equal(await readFile(path.join(pb, 'CURRENT.md'), 'utf8'), '# Reviewed\nDo not change API.\n');
  const backup = 'archive/' + (await readdir(path.join(pb, 'archive')))[0];
  assert.equal((await rollbackRecordMigration({ target, backup })).applied, false);
  assert.equal((await rollbackRecordMigration({ target, backup, apply: true })).applied, true);
  assert.equal(await readFile(path.join(pb, 'manifest.json'), 'utf8'), body);
  assert.equal((await rollbackRecordMigration({ target, backup, apply: true })).applied, false);
});
test('unmanaged layout and later metadata edits are never overwritten', async (t) => {
  const target = await fixture(t);
  await bootstrapRecords({ target, repoRoot });
  const pb = path.join(target, '.ai-agent-playbook');
  await writeFile(path.join(pb, 'manifest.json'), '{"layoutKind":"custom"}\n');
  const before = await treeSnapshot(target);
  const result = await migrateRecords({ target, apply: true });
  assert.equal(result.ok, false);
  assert.equal(result.applied, false);
  assert.deepEqual(await treeSnapshot(target), before);
});

test('layout migration requires a readable text entrypoint before writing metadata', async (t) => {
  for (const content of [null, Buffer.from([0]), Buffer.from([0xff])]) {
    const target = await fixture(t), pb = path.join(target, '.ai-agent-playbook');
    await mkdir(pb);
    const body = '{"layoutKind":"structured"}\n';
    await writeFile(path.join(pb, 'manifest.json'), body);
    await writeFile(path.join(pb, '.ai-agent-playbook-install.json'), JSON.stringify({ source: 'ai-agent-playbook', files: { 'manifest.json': sha256(body) } }));
    if (content === null) await mkdir(path.join(pb, 'CURRENT.md'));
    else await writeFile(path.join(pb, 'CURRENT.md'), content);
    const before = await treeSnapshot(target);
    for (const apply of [false, true]) {
      const result = await migrateRecords({ target, apply });
      assert.equal(result.ok, false);
      assert.equal(result.applied, false);
      assert.ok(result.conflicts.some((c) => c.path === 'CURRENT.md'));
      assert.deepEqual(await treeSnapshot(target), before);
    }
  }
});
