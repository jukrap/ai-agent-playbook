import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { runCli } from '../src/cli.mjs';
import { bootstrapRecords, playbookSearch, playbookStatus } from '../src/records.mjs';
import { createWorklog, listWorklogs } from '../src/record-authoring.mjs';
import { treeSnapshot } from '../src/fs-safety.mjs';
const packageRoot = process.cwd();

async function cli(args, cwd) {
  let out = '', err = '';
  const code = await runCli([...args, '--json'], { cwd, repoRoot: packageRoot, stdout: { write: s => { out += s; } }, stderr: { write: s => { err += s; } } });
  return { code, value: JSON.parse(out), err };
}
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-integration-'));
  t.after(() => { assert.equal(path.dirname(root), os.tmpdir()); return rm(root, { recursive: true, force: true }); });
  const ids = ['pc-web', 'webview-a', 'webview-b', 'webview-c', 'android-a', 'android-b', 'android-c', 'android-d', 'ios-a', 'ios-b', 'ios-c', 'ios-d'];
  for (const id of ids) {
    const repo = path.join(root, id);
    await mkdir(path.join(repo, 'src'), { recursive: true });
    execFileSync('git', ['init', '--quiet', repo], { windowsHide: true });
    await writeFile(path.join(repo, 'src', 'index.js'), 'wanted(1);\n');
    await writeFile(path.join(repo, 'src', 'ignored.js'), 'wanted(2);\n');
    await writeFile(path.join(repo, '.gitignore'), 'src/ignored.js\n');
  }
  await bootstrapRecords({ target: path.join(root, 'pc-web'), repoRoot: packageRoot, records: 'standard' });
  await writeFile(path.join(root, 'pc-web', '.ai-agent-playbook', 'CURRENT.md'), '# Legacy repository evidence\n');
  const setup = await cli(['bootstrap', '--kind', 'workspace', '--records', 'standard', '--lang', 'ko', ...ids.flatMap(id => ['--repo-path', id])], root);
  assert.equal(setup.code, 0, JSON.stringify(setup.value));
  await writeFile(path.join(root, '.ai-agent-playbook', 'CURRENT.md'), '# Shared goal\nPreserve token lifetime 30 minutes; device validation pending.\n');
  return { root, ids, pb: path.join(root, '.ai-agent-playbook') };
}

test('argument bootstrap, record authoring and repo-filtered reads work across twelve independent Git repositories', async (t) => {
  const { root, pb } = await fixture(t);
  const member = path.join(root, 'pc-web');
  const status = await cli(['records', 'status', '--view', 'repositories'], member);
  assert.equal(status.value.repositories.length, 12);
  assert.equal(status.value.workspace.activeRepo, 'pc-web');
  assert.match((await cli(['records', 'read'], member)).value.content, /Shared goal/);
  assert.match((await cli(['records', 'read', '--record-source', 'repo:pc-web'], root)).value.content, /Legacy repository evidence/);
  const a = await cli(['worklog', 'new', '--title', '인증 상태 기록', '--date', '2026-09-08'], member);
  assert.equal(a.code, 0, JSON.stringify(a.value));
  const b = await createWorklog({ target: root, title: 'Android evidence', repo: 'android-a', date: '2026-09-08' });
  await writeFile(path.join(pb, a.value.path), a.value.content + '\nSearchable-auth: web evidence.\n');
  await writeFile(path.join(pb, b.path), b.content + '\nSearchable-auth: native evidence.\n');
  const found = await cli(['records', 'search', '--query', 'Searchable-auth', '--repo', 'pc-web', '--month', '2026-09', '--kind', 'worklog'], root);
  assert.equal(found.code, 0); assert.equal(found.value.results.length, 1);
  assert.equal(found.value.results[0].path, a.value.path);
  assert.equal((await cli(['worklog', 'list', '--month', '2026-09', '--repo', 'android-a'], root)).value.items.length, 1);
  assert.equal((await cli(['records', 'search', '--query', 'Shared goal', '--kind', 'current'], root)).value.results.length, 1);
  assert.equal((await cli(['ast', 'search', '--lang', 'javascript', '--pattern', 'wanted($VALUE)', '--path', 'src'], root)).code, 1);
  const ast = await cli(['ast', 'search', '--repo', 'pc-web', '--lang', 'javascript', '--pattern', 'wanted($VALUE)', '--path', 'src'], root);
  assert.equal(ast.code, 0, JSON.stringify(ast.value));
  assert.equal(ast.value.page.totalItems, 1); assert.equal(ast.value.scan.sourceMode, 'git');
  assert.equal((await cli(['forge', 'status'], root)).code, 1);
  assert.equal((await cli(['forge', 'status', '--repo', 'pc-web'], root)).code, 0);
});

test('actual MCP keeps five tools, selects existing local records explicitly and rejects unrelated repositories without writes', async (t) => {
  const { root } = await fixture(t), before = await treeSnapshot(root);
  const client = new Client({ name: 'workspace-test', version: '1' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(packageRoot, 'bin/aapb.mjs'), 'mcp', '--with-ast'], cwd: path.join(root, 'pc-web'), stderr: 'pipe' });
  try {
    await client.connect(transport);
    assert.deepEqual((await client.listTools()).tools.map(t => t.name).sort(), ['aapb_ast_search', 'aapb_read', 'aapb_search', 'aapb_status', 'aapb_validate']);
    const read = await client.callTool({ name: 'aapb_read', arguments: {} });
    assert.match(read.structuredContent.content, /Shared goal/);
    const local = await client.callTool({ name: 'aapb_read', arguments: { recordSource: 'repo:pc-web' } });
    assert.match(local.structuredContent.content, /Legacy repository evidence/);
    const bad = await client.callTool({ name: 'aapb_read', arguments: { recordSource: 'repo:foreign' } });
    assert.equal(bad.isError, true);
    const search = await client.callTool({ name: 'aapb_search', arguments: { query: 'lifetime', kind: 'current' } });
    assert.equal(search.structuredContent.results.length, 1);
    const ast = await client.callTool({ name: 'aapb_ast_search', arguments: { repo: 'webview-a', lang: 'javascript', pattern: 'wanted($VALUE)', path: 'src' } });
    assert.equal(ast.isError, false); assert.equal(ast.structuredContent.page.totalItems, 1);
    const validation = await client.callTool({ name: 'aapb_validate', arguments: {} });
    assert.equal(validation.structuredContent.runtimeVerified, false);
  } finally { await client.close(); }
  assert.deepEqual(await treeSnapshot(root), before);
});

test('ambient Git overrides cannot redirect selected AST or Forge repository', async (t) => {
  const { root } = await fixture(t), selected = path.join(root, 'pc-web'), other = path.join(root, 'android-a');
  execFileSync('git', ['-C', selected, 'remote', 'add', 'origin', 'https://github.com/example/selected.git'], { windowsHide: true });
  execFileSync('git', ['-C', other, 'remote', 'add', 'origin', 'https://github.com/example/other.git'], { windowsHide: true });
  const before = { dir: process.env.GIT_DIR, worktree: process.env.GIT_WORK_TREE };
  process.env.GIT_DIR = path.join(other, '.git'); process.env.GIT_WORK_TREE = other;
  try {
    const forge = await cli(['forge', 'status', '--repo', 'pc-web'], root);
    assert.equal(forge.code, 0); assert.match(JSON.stringify(forge.value.repository), /selected/); assert.doesNotMatch(JSON.stringify(forge.value.repository), /other/);
    const ast = await cli(['ast', 'search', '--repo', 'pc-web', '--path', 'src', '--lang', 'javascript', '--pattern', 'wanted($VALUE)'], root);
    assert.equal(ast.code, 0, JSON.stringify(ast.value)); assert.equal(ast.value.page.totalItems, 1);
  } finally {
    if (before.dir === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = before.dir;
    if (before.worktree === undefined) delete process.env.GIT_WORK_TREE; else process.env.GIT_WORK_TREE = before.worktree;
  }
});

test('month/path filters prune other months before file limits and cursors preserve query scope', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aapb-history-'));
  t.after(() => { assert.equal(path.dirname(root), os.tmpdir()); return rm(root, { recursive: true, force: true }); });
  await bootstrapRecords({ target: root, repoRoot: packageRoot });
  const pb = path.join(root, '.ai-agent-playbook');
  await mkdir(path.join(pb, 'worklogs', '2026-08'), { recursive: true });
  await Promise.all(Array.from({ length: 2005 }, (_, n) => writeFile(path.join(pb, 'worklogs', '2026-08', n + '.md'), '# Old token\n')));
  for (const title of ['one', 'two']) {
    const item = await createWorklog({ target: root, title, date: '2026-09-08' });
    await writeFile(path.join(pb, item.path), item.content + '\nUnique-token current evidence.\n');
  }
  const selected = await playbookSearch({ target: root, query: 'Unique-token', month: '2026-09', maxResults: 1 });
  assert.equal(selected.scan.complete, true); assert.equal(selected.scannedFiles, 2);
  assert.equal(selected.page.totalItems, 2);
  await assert.rejects(playbookSearch({ target: root, query: 'Unique-token', month: '2026-08', cursor: selected.page.nextCursor }), /Cursor/);
  const narrowed = await playbookSearch({ target: root, query: 'Unique-token', path: 'worklogs/2026-09' });
  assert.equal(narrowed.results.length, 2); assert.equal(narrowed.scan.complete, true);
  const listed = await listWorklogs({ target: root, month: '2026-09' });
  assert.equal(listed.items.length, 2); assert.equal(listed.scan.complete, true);
});

test('legacy month filtering, repo pruning and transaction backup exclusion retain searchable evidence', async (t) => {
  const { root, pb } = await fixture(t);
  await mkdir(path.join(pb, 'workflows/worklogs'), { recursive: true });
  await writeFile(path.join(pb, 'workflows/worklogs/2026-09-08-legacy.md'), '# Legacy\nToken-flat\n');
  assert.equal((await playbookSearch({ target: root, query: 'Token-flat', month: '2026-09', kind: 'worklog' })).results.length, 1);
  await mkdir(path.join(pb, 'repos/pc-web'), { recursive: true });
  await mkdir(path.join(pb, 'repos/ios-d'), { recursive: true });
  await Promise.all(Array.from({ length: 2005 }, (_, i) => writeFile(path.join(pb, 'repos/pc-web', i + '.md'), '# unrelated\n')));
  await writeFile(path.join(pb, 'repos/ios-d/CURRENT.md'), '# Token-selected\n');
  const found = await playbookSearch({ target: root, query: 'Token-selected', repo: 'ios-d' });
  assert.equal(found.results.length, 1); assert.equal(found.scan.complete, true);
  await mkdir(path.join(pb, 'archive'), { recursive: true });
  await writeFile(path.join(pb, 'archive/bootstrap-11111111-2222-3333-4444-555555555555.json'), '{"old":"Token-backup"}');
  await writeFile(path.join(pb, 'archive/workspace-0123456789abcdef.json'), '{"old":"Token-backup"}');
  assert.equal((await playbookSearch({ target: root, query: 'Token-backup', path: 'archive' })).results.length, 0);
});

test('repository cursors cannot cross workspace roots with identical registries', async (t) => {
  const a = await fixture(t), b = await fixture(t);
  const first = await playbookStatus({ target: a.root, view: 'repositories', pageSize: 1 });
  await assert.rejects(playbookStatus({ target: b.root, view: 'repositories', pageSize: 1, cursor: first.page.nextCursor }), /Cursor/);
});

test('explicit member layout migration and rollback never mutate shared records', async (t) => {
  const { root, pb } = await fixture(t), child = path.join(root, 'pc-web', '.ai-agent-playbook');
  const standard = await readFile(path.join(child, 'manifest.json'), 'utf8');
  const before = await treeSnapshot(pb);
  const moved = await cli(['migrate', 'layout', '--record-source', 'repo:pc-web', '--apply'], root);
  assert.equal(moved.code, 0, JSON.stringify(moved.value)); assert.equal(moved.value.applied, true);
  assert.equal(JSON.parse(await readFile(path.join(child, 'manifest.json'), 'utf8')).layoutKind, 'minimal');
  assert.deepEqual(await treeSnapshot(pb), before);
  const restored = await cli(['migrate', 'rollback', '--record-source', 'repo:pc-web', '--backup', moved.value.backup, '--apply'], root);
  assert.equal(restored.code, 0); assert.equal(await readFile(path.join(child, 'manifest.json'), 'utf8'), standard);
  assert.deepEqual(await treeSnapshot(pb), before);
});

test('repository metadata is selected before unrelated full text consumes search budgets', async (t) => {
  const { root, pb } = await fixture(t);
  const header = (id, repo) => '<!-- aapb-record ' + JSON.stringify({ kind: 'worklog', id, createdAt: '2026-09-08T00:00:00Z', repos: [repo], topic: 'budget' }) + ' -->\n';
  await mkdir(path.join(pb, 'worklogs/2026-09'), { recursive: true });
  await Promise.all(Array.from({ length: 85 }, (_, i) => writeFile(path.join(pb, 'worklogs/2026-09', 'a-' + i + '.md'), header(String(i), 'pc-web') + 'x'.repeat(400_000))));
  await writeFile(path.join(pb, 'worklogs/2026-09/z-selected.md'), header('selected', 'ios-d') + 'Selected-header-token\n');
  const result = await playbookSearch({ target: root, query: 'Selected-header-token', repo: 'ios-d', month: '2026-09' });
  assert.equal(result.results.length, 1); assert.equal(result.scan.complete, true);
  assert.equal(result.scan.filteredFiles, 85); assert.ok(result.scan.inspectedBytes < 2_000_000);
});
