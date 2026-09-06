import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runCli } from '../src/cli.mjs';
import { execFileSync } from 'node:child_process';
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

test('omitted project uses the supplied working directory and previews do not write', async (t) => {
  const parent = await fixture(t), root = path.join(parent, '한글 프로젝트');
  await mkdir(root);
  execFileSync('git', ['init', '--quiet', root], { windowsHide: true });
  await writeFile(path.join(root, 'AGENTS.md'), 'Keep the project policy.\n');
  const before = await treeSnapshot(root);
  const preview = await cli(['bootstrap', '--local-only', '--dry-run', '--json'], root);
  assert.equal(preview.code, 0); assert.equal(preview.value.writes, false);
  assert.deepEqual(await treeSnapshot(root), before);
  assert.equal((await cli(['bootstrap', '--local-only', '--json'], root)).code, 0);
  assert.equal(await readFile(path.join(root, 'AGENTS.md'), 'utf8'), 'Keep the project policy.\n');
  const current = path.join(root, '.ai-agent-playbook', 'CURRENT.md');
  await writeFile(current, '# Current state\n\nLocal target evidence.\n');
  const snapshot = await treeSnapshot(root);
  for (const targetArgs of [[], ['.'], ['--project', '.']]) {
    const result = await cli(['records', 'read', ...targetArgs, '--path', 'CURRENT.md', '--json'], root);
    assert.equal(result.code, 0); assert.equal(result.value.content, await readFile(current, 'utf8'));
  }
  assert.equal((await cli(['records', 'search', '--query', 'Local target', '--json'], root)).value.ok, true);
  assert.equal((await cli(['records', 'status', '--json'], root)).value.entrypoint, 'CURRENT.md');
  assert.equal((await cli(['records', 'validate', '--json'], root)).value.ok, true);
  const selected = await cli(['records', 'read', '--project', '한글 프로젝트', '--json'], parent);
  assert.equal(selected.value.content, await readFile(current, 'utf8'));
  assert.equal((await cli(['records', 'read', 'unused-positional-path', '--project', '한글 프로젝트', '--json'], parent)).value.content, selected.value.content);
  assert.deepEqual(await treeSnapshot(root), snapshot);
  assert.equal((await cli(['records', 'status', '--json'], parent)).value.exists, false);
  const nested = path.join(root, 'nested');
  await mkdir(nested);
  assert.equal((await cli(['records', 'status', '--json'], nested)).value.exists, false);
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
test('writing reports honor the selected root and reject a root outside the project', async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'selected'));
  await writeFile(path.join(root, 'selected/note.md'), 'Selected text.');
  await writeFile(path.join(root, 'unrelated.md'), 'Unrelated text.');
  const before = await treeSnapshot(root);
  const result = await cli(['writing', 'naturalness-report', root, '--root', 'selected', '--json'], root);
  assert.equal(result.code, 0);
  assert.equal(result.value.root, 'selected');
  assert.deepEqual(result.value.files.map((f) => f.path), ['selected/note.md']);
  assert.equal((await cli(['writing', 'naturalness-report', root, '--root', '..', '--json'], root)).code, 1);
  assert.deepEqual(await treeSnapshot(root), before);
});
test('advisory checks reject ancestor junctions without reading outside the project', async (t) => {
  const root = await fixture(t), outside = await fixture(t);
  await mkdir(path.join(outside, 'texts'));
  await writeFile(path.join(outside, 'texts/note.md'), 'Outside evidence 12. https://example.com/private');
  await writeFile(path.join(outside, 'texts/view.css'), '.view { border-radius: 12px; }');
  await symlink(outside, path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  const before = await treeSnapshot(outside);
  for (const args of [
    ['writing', 'naturalness-check', root, '--path', 'linked/texts/note.md'],
    ['writing', 'naturalness-report', root, '--root', 'linked/texts'],
    ['writing', 'fidelity-check', root, '--before', 'linked/texts/note.md', '--after', 'linked/texts/note.md'],
    ['qa', 'ui-genericity-scan', root, '--root', 'linked/texts']
  ]) {
    const result = await cli([...args, '--json'], root);
    assert.equal(result.code, 1, args.join(' '));
    assert.equal(result.value.ok, false);
    assert.doesNotMatch(result.out, /Outside evidence/);
  }
  assert.deepEqual(await treeSnapshot(outside), before);
});
test('release metadata, copyable templates and selected skill references agree', async () => {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.match(pkg.version, /^\d+\.\d+\.\d+(?:-next\.\d+)?$/);
  assert.deepEqual(pkg.bin, { 'ai-agent-playbook': 'bin/aapb.mjs', aapb: 'bin/aapb.mjs' });
  const pythonVersion = (await readFile(path.join(repoRoot, 'pyproject.toml'), 'utf8')).match(/^version = "([^"]+)"/m)?.[1];
  assert.equal(pythonVersion, pkg.version.replace(/-next\.(\d+)$/, '.dev$1'));
  const { skillCatalog } = await import('../src/catalog/selection.mjs');
  for (const skill of await skillCatalog({ repoRoot })) {
    const body = await readFile(path.join(skill.directory, 'SKILL.md'), 'utf8');
    for (const match of body.matchAll(/\]\((references\/[^)]+)\)/g)) await readFile(path.join(skill.directory, match[1]));
  }
});
