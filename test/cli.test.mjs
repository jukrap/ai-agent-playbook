import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runCli } from '../src/cli.mjs';
import { treeSnapshot } from '../src/fs-safety.mjs';
const repoRoot = process.cwd();
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-cli-'));
  t.after(async () => { assert.equal(path.dirname(root), os.tmpdir()); await rm(root, { recursive: true, force: true }); });
  return root;
}
async function cli(args, cwd) {
  let out = '', err = '';
  const code = await runCli(args, { cwd, repoRoot, stdout: { write: (s) => { out += s; } }, stderr: { write: (s) => { err += s; } } });
  return { code, out, err, value: (() => { try { return JSON.parse(out); } catch { return null; } })() };
}
test('retired commands never run legacy flags or mutate project records', async (t) => {
  const root = await fixture(t), before = await treeSnapshot(root);
  for (const name of ['automation', 'run', 'graph', 'write-gate']) {
    const r = await cli([name, 'start', root, '--apply', '--unknown-legacy-flag', '--json'], root);
    assert.equal(r.code, 2); assert.equal(r.value.writes, false);
    assert.match(r.value.recovery, /@0\.5\.11/); assert.equal(r.value.automaticFallback, false);
  }
  assert.deepEqual(await treeSnapshot(root), before);
});
test('public CLI bootstraps and reads records, rejecting missing options and traversal', async (t) => {
  const root = await fixture(t);
  assert.equal((await cli(['bootstrap', root, '--json'], root)).code, 0);
  assert.equal((await cli(['records', 'status', root, '--json'], root)).value.entrypoint, 'CURRENT.md');
  assert.equal((await cli(['records', 'read', root, '--path', '../outside.md', '--json'], root)).code, 1);
  assert.equal((await cli(['records', 'search', root, '--query', '--json'], root)).code, 1);
});
test('optional writing fidelity reports changed numeric and URL evidence without modifying files', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'before.md'), '배포 시 12초 동안 대기합니다. https://example.com/a 에서 확인하세요.\n');
  await writeFile(path.join(root, 'after.md'), '배포 시 20초 동안 대기합니다. https://example.com/b 에서 확인하세요.\n');
  const before = await treeSnapshot(root);
  const r = await cli(['writing','fidelity-check',root,'--before','before.md','--after','after.md','--lang','ko','--json'], root);
  assert.equal(r.err, ''); assert.ok(r.value);
  assert.match(JSON.stringify(r.value), /12|20/);
  assert.equal(r.value.reviewRequired, true);
  assert.deepEqual(await treeSnapshot(root), before);
});
test('release metadata, copyable templates and selected skill references agree', async () => {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '1.0.0-next.1'); assert.equal(pkg.bin.aapb, 'bin/aapb.mjs');
  assert.match(await readFile(path.join(repoRoot, 'pyproject.toml'), 'utf8'), /1\.0\.0\.dev1/);
  const { skillCatalog } = await import('../src/catalog/selection.mjs');
  for (const skill of await skillCatalog({ repoRoot })) {
    const body = await readFile(path.join(skill.directory, 'SKILL.md'), 'utf8');
    for (const match of body.matchAll(/\]\((references\/[^)]+)\)/g)) await readFile(path.join(skill.directory, match[1]));
  }
});
