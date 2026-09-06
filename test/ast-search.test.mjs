import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, rm, symlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { searchAst, AST_LIMITS } from '../src/ast-search.mjs';
import { runCli } from '../src/cli.mjs';
import { treeSnapshot, statOrNull } from '../src/fs-safety.mjs';
import { toolResult, MAX_MCP_RESULT_BYTES } from '../src/record-paging.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function fixture(t, files) {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'aapb-ast-'));
  const target = path.join(parent, '한글 project');
  await mkdir(target);
  t.after(async () => { assert.equal(path.dirname(parent), os.tmpdir()); await rm(parent, { recursive: true, force: true }); });
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(target, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text);
  }
  return target;
}
const search = (target, extra = {}) => searchAst({ target, pattern: 'console.log($$$ARGS)', lang: 'javascript', ...extra });

test('AST matches source structure across lines, skips comments/strings and keeps Unicode locations', async (t) => {
  const source = '// console.log(0)\r\nconst text = "console.log(1)";\r\nconst 한글 = "😀"; console.log(\r\n  2, 3\r\n);\r\n';
  const target = await fixture(t, { 'src/한글.js': source, 'src/other.ts': 'console.log(9)' });
  const before = await treeSnapshot(target);
  const result = await search(target);
  assert.equal(result.scan.sourceMode, 'filesystem');
  assert.equal(result.scan.complete, true);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].path, 'src/한글.js');
  assert.deepEqual(result.results[0].range, { start: { line: 3, column: source.split('\r\n')[2].indexOf('console') + 1 }, end: { line: 5, column: 2 } });
  assert.equal(result.results[0].snippet, 'console.log(\r\n  2, 3\r\n)');
  assert.deepEqual(await treeSnapshot(target), before);
});

for (const [lang, file, source, pattern] of [
  ['typescript', 'a.mts', 'function f(value: number) { return value; }', 'function $NAME($$$ARGS) { $$$BODY }'],
  ['tsx', 'a.tsx', 'const View = () => <Button label="go" />;', '<Button $$$PROPS />'],
  ['jsx', 'a.jsx', 'const View = () => <Button label="go" />;', '<Button $$$PROPS />'],
  ['css', 'a.css', 'a { color: red; }', 'color: red;'],
  ['html', 'a.html', '<main><button>Go</button></main>', '<button>Go</button>']
]) test(`AST supports ${lang} without loading project code`, async (t) => {
  const target = await fixture(t, { [file]: source, 'package.json': '{"scripts":{"postinstall":"exit 1"}}' });
  const result = await search(target, { lang, pattern });
  assert.equal(result.results.length, 1);
  assert.equal(result.scan.complete, true);
});

test('AST Git selection honors ignore rules and always excludes local records and generated trees', async (t) => {
  const target = await fixture(t, { '.gitignore': 'ignored/\n', 'src/a.js': 'console.log(1)', 'ignored/b.js': 'console.log(2)', '.ai-agent-playbook/example.js': 'console.log(3)', 'dist/generated.js': 'console.log(4)' });
  execFileSync('git', ['init', '--quiet', target], { windowsHide: true });
  const monitor = path.join(target, '.git', 'monitor.cjs');
  await writeFile(monitor, `require('node:fs').writeFileSync(${JSON.stringify(path.join(target, 'monitor-ran'))}, 'unexpected');`);
  execFileSync('git', ['-C', target, 'config', 'core.fsmonitor', `"${process.execPath.replaceAll('\\', '/')}" "${monitor.replaceAll('\\', '/')}"`], { windowsHide: true });
  let result = await search(target);
  assert.equal(await statOrNull(path.join(target, 'monitor-ran')), null);
  assert.equal(result.scan.sourceMode, 'git');
  assert.deepEqual(result.results.map((item) => item.path), ['src/a.js']);
  execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', target, 'add', '--force', '--', 'ignored/b.js', '.ai-agent-playbook/example.js'], { windowsHide: true });
  result = await search(target);
  assert.deepEqual(result.results.map((item) => item.path), ['ignored/b.js', 'src/a.js']);
  await assert.rejects(search(target, { path: '.ai-agent-playbook' }), /excluded/);
  await assert.rejects(search(target, { path: '../escape.js' }), /relative|Unsafe/);
  await assert.rejects(search(target, { path: path.join(target, 'src/a.js') }), /relative/);
});

test('AST does not traverse junctions or symlinks, including explicit and ancestor paths', async (t) => {
  const target = await fixture(t, { 'src/a.js': 'console.log(1)' });
  const outside = await fixture(t, { 'secret.js': 'console.log(2)' });
  await symlink(outside, path.join(target, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = await search(target);
  assert.equal(result.results.length, 1);
  assert.equal(result.scan.complete, false);
  await assert.rejects(search(target, { path: 'linked/secret.js' }), /link|junction/);
  await assert.rejects(search(path.join(target, 'linked')), /link|junction/);
});

test('AST coverage reports file limits, parser errors, oversized and binary source', async (t) => {
  const target = await fixture(t, { 'a.js': 'console.log(1)', 'b.js': 'console.log(2)' });
  assert.equal((await search(target, { maxFiles: 1 })).scan.complete, false);
  await writeFile(path.join(target, 'broken.js'), 'const = ; console.log(3)');
  await writeFile(path.join(target, 'large.js'), 'x'.repeat(AST_LIMITS.fileBytes + 1));
  await writeFile(path.join(target, 'binary.js'), Buffer.from([0, 1, 2]));
  const result = await search(target);
  assert.equal(result.scan.complete, false);
  assert.equal(result.warnings.total, 3);
  assert.equal(result.results.length, 3);
  await assert.rejects(search(target, { pattern: ' ' }), /pattern/i);
  await assert.rejects(search(target, { pattern: '$$$' }), /engine rejected/i);
  await assert.rejects(search(target, { lang: 'python' }), /lang/);
  await assert.rejects(search(target, { path: 'a.js', lang: 'tsx' }), /extension/);
  await assert.rejects(search(target, { maxFiles: 0 }), /limit/);
});

test('AST continuation has stable pages and rejects foreign query, project, path and changed source', async (t) => {
  const source = 'console.log(1); console.log(2); console.log(3);';
  const target = await fixture(t, { 'src/a.js': source });
  const other = await fixture(t, { 'src/a.js': source });
  const first = await search(target, { maxResults: 1 });
  assert.equal(first.truncated, true);
  const cursor = first.page.nextCursor;
  assert.equal((await search(target, { cursor })).results.length, 2);
  await assert.rejects(search(other, { cursor }), /Cursor/);
  await assert.rejects(search(target, { cursor, pattern: 'console.error($$$ARGS)' }), /Cursor/);
  await assert.rejects(search(target, { cursor, path: 'src' }), /Cursor/);
  await writeFile(path.join(target, 'src/a.js'), source + '\n// changed');
  await assert.rejects(search(target, { cursor }), /Cursor/);
});

test('AST pages bound snippets and the full MCP wire response without splitting Unicode', async (t) => {
  const target = await fixture(t, { 'a.js': (`console.log('${'가😀'.repeat(200)}');\n`).repeat(150) });
  const result = await search(target, { maxChars: 100000, maxResults: 100 });
  assert.ok(Buffer.byteLength(JSON.stringify(toolResult(result))) <= MAX_MCP_RESULT_BYTES);
  assert.equal(result.truncated, true);
  assert.ok(result.results.every((item) => item.snippetTruncated && item.snippet.length <= 500 && !/[\uD800-\uDBFF]$/.test(item.snippet)));
  await assert.rejects(search(target, { maxChars: 1 }), /budget/);
});

test('AST CLI uses cwd, preserves read-only behavior and keeps old mutation commands retired', async (t) => {
  const target = await fixture(t, { 'a.js': 'console.log(1)' });
  let output = '';
  const io = { cwd: target, stdout: { write: (text) => { output += text; } } };
  assert.equal(await runCli(['ast', 'search', '--pattern', 'console.log($$$ARGS)', '--lang', 'javascript', '--json'], io), 0);
  assert.equal(JSON.parse(output).results.length, 1);
  output = '';
  assert.equal(await runCli(['ast', 'search', '--apply', '--json'], io), 1);
  assert.match(output, /read-only/);
  output = '';
  assert.equal(await runCli(['ast', 'rewrite', '--json'], io), 2);
  assert.equal(JSON.parse(output).kind, 'command.retired');
});

test('AST reports a missing optional engine without downloading or changing source', async (t) => {
  const target = await fixture(t, { 'source/a.js': 'console.log(1)' });
  for (const name of ['ast-search.mjs', 'ast-worker.mjs', 'fs-safety.mjs', 'record-paging.mjs']) {
    await copyFile(path.join(repoRoot, 'src', name), path.join(target, name));
  }
  const isolated = await import(pathToFileURL(path.join(target, 'ast-search.mjs')).href);
  const before = await treeSnapshot(target);
  await assert.rejects(isolated.searchAst({ target, path: 'source', lang: 'javascript', pattern: 'console.log($$$ARGS)' }), { code: 'aapb.ast-engine-unavailable' });
  assert.deepEqual(await treeSnapshot(target), before);
});

test('AST match ceiling is reported as incomplete, separately from result pagination', async (t) => {
  const target = await fixture(t, { 'a.js': 'console.log(1);\n'.repeat(AST_LIMITS.matches + 1) });
  const result = await search(target);
  assert.equal(result.scan.complete, false);
  assert.equal(result.page.totalItems, AST_LIMITS.matches);
  assert.equal(result.truncated, true);
  assert.equal(result.warnings.sample[0].code, 'match-limit');
});

test('opt-in MCP exposes exactly one extra bound read-only AST tool', async (t) => {
  const target = await fixture(t, { 'a.js': 'console.log(1)' });
  const before = await treeSnapshot(target);
  const client = new Client({ name: 'ast-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(repoRoot, 'bin/aapb.mjs'), 'mcp', '--with-ast', '--project', target], stderr: 'pipe' });
  try {
    await client.connect(transport);
    const tools = (await client.listTools()).tools;
    assert.deepEqual(tools.map((tool) => tool.name).sort(), ['aapb_ast_search', 'aapb_read', 'aapb_search', 'aapb_status', 'aapb_validate']);
    assert.ok(tools.every((tool) => tool.annotations.readOnlyHint));
    const result = await client.callTool({ name: 'aapb_ast_search', arguments: { lang: 'javascript', pattern: 'console.log($$$ARGS)' } });
    assert.equal(result.structuredContent.results.length, 1);
    assert.equal(result.isError, false);
    const bad = await client.callTool({ name: 'aapb_ast_search', arguments: { lang: 'javascript', pattern: 'console.log($$$ARGS)', path: '../a.js' } });
    assert.equal(bad.isError, true);
    assert.deepEqual(await treeSnapshot(target), before);
  } finally { await client.close(); }
});
