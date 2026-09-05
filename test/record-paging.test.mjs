import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { bootstrapRecords, playbookRead, playbookStatus, playbookSearch, playbookValidate } from '../src/records.mjs';
import { treeSnapshot } from '../src/fs-safety.mjs';
import { toolResult, MAX_MCP_RESULT_BYTES } from '../src/record-paging.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function fixture(t) {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-paging-'));
  t.after(async () => { assert.equal(path.dirname(target), os.tmpdir()); await rm(target, { recursive: true, force: true }); });
  await bootstrapRecords({ target, repoRoot });
  return target;
}
const wireBytes = (value) => Buffer.byteLength(JSON.stringify(toolResult(value)), 'utf8');

test('read continuation reconstructs long Unicode lines and original CRLF within the wire ceiling', async (t) => {
  const target = await fixture(t);
  const original = 'first\r\n' + '가😀"\\'.repeat(20000) + '\r\nlast\r\n';
  await writeFile(path.join(target, '.ai-agent-playbook/long.md'), original);
  const before = await treeSnapshot(target);
  let cursor, reconstructed = '', pages = 0;
  do {
    const result = await playbookRead({ target, path: 'long.md', maxChars: 100000, cursor });
    assert.ok(wireBytes(result) <= MAX_MCP_RESULT_BYTES);
    assert.ok(result.content.length > 0);
    assert.equal(result.position.offset, reconstructed.length);
    assert.doesNotMatch(result.content, /[\uD800-\uDBFF]$/);
    reconstructed += result.content; cursor = result.nextCursor ?? undefined;
    assert.ok(++pages < 20);
  } while (cursor);
  assert.equal(reconstructed, original);
  assert.ok(pages > 1);
  assert.deepEqual(await treeSnapshot(target), before);
});

test('read ranges continue without line arguments and reject changed files and foreign projects', async (t) => {
  const target = await fixture(t), foreign = await fixture(t);
  const content = 'one\r\ntwo😀three\r\nfour\r\n';
  for (const root of [target, foreign]) await writeFile(path.join(root, '.ai-agent-playbook/CURRENT.md'), content);
  const first = await playbookRead({ target, startLine: 2, endLine: 2, maxChars: 3 });
  assert.equal(first.content, 'two');
  const rest = await playbookRead({ target, cursor: first.nextCursor });
  assert.equal(first.content + rest.content, 'two😀three\r\n');
  assert.equal(rest.nextCursor, null);
  await assert.rejects(playbookRead({ target: foreign, cursor: first.nextCursor }), /Cursor/);
  await assert.rejects(playbookRead({ target, cursor: first.nextCursor, startLine: 2 }), /replaces/);
  await writeFile(path.join(target, '.ai-agent-playbook/CURRENT.md'), 'changed');
  await assert.rejects(playbookRead({ target, cursor: first.nextCursor }), /Cursor/);
});

test('a tiny read budget cannot split a Unicode pair or silently stall continuation', async (t) => {
  const target = await fixture(t);
  await writeFile(path.join(target, '.ai-agent-playbook/CURRENT.md'), '😀x');
  await assert.rejects(playbookRead({ target, maxChars: 1 }), /Unicode/);
  assert.equal((await playbookRead({ target, maxChars: 2 })).content, '😀');
});

test('status defaults to summary and pages stable record names without duplicates', async (t) => {
  const target = await fixture(t);
  for (let i = 0; i < 7; i++) await writeFile(path.join(target, `.ai-agent-playbook/note-${i}.md`), 'record');
  const summary = await playbookStatus({ target });
  assert.equal(summary.recordCount, 9);
  assert.equal(summary.items, undefined);
  const all = [];
  let cursor;
  do {
    const page = await playbookStatus({ target, view: 'records', pageSize: 2, cursor });
    assert.equal(page.page.totalItems, 9);
    all.push(...page.items); cursor = page.page.nextCursor ?? undefined;
  } while (cursor);
  assert.equal(all.length, 9);
  assert.equal(new Set(all).size, 9);
  const page = await playbookStatus({ target, view: 'records', pageSize: 1 });
  await writeFile(path.join(target, '.ai-agent-playbook/new.md'), 'new');
  await assert.rejects(playbookStatus({ target, view: 'records', cursor: page.page.nextCursor }), /Cursor/);
});

test('search keeps late-line match context and rejects changed-query or changed-content cursors', async (t) => {
  const target = await fixture(t);
  await writeFile(path.join(target, '.ai-agent-playbook/search.md'), ['İ'.repeat(4) + 'x'.repeat(700) + 'needle', 'needle two', 'needle three'].join('\n'));
  const first = await playbookSearch({ target, query: 'needle', maxResults: 1 });
  assert.match(first.results[0].text, /needle/);
  assert.equal(first.results[0].column, 705);
  const rest = await playbookSearch({ target, query: 'needle', maxResults: 5, cursor: first.page.nextCursor });
  assert.deepEqual(rest.results.map((r) => r.line), [2, 3]);
  assert.equal(rest.page.nextCursor, null);
  await assert.rejects(playbookSearch({ target, query: 'different', cursor: first.page.nextCursor }), /Cursor/);
  await assert.rejects(playbookSearch({ target, query: 'needle', maxChars: 1 }), /complete item/);
  await writeFile(path.join(target, '.ai-agent-playbook/search.md'), 'needle changed');
  await assert.rejects(playbookSearch({ target, query: 'needle', cursor: first.page.nextCursor }), /Cursor/);
});

test('every validation page retains global failures and scan completeness', async (t) => {
  const target = await fixture(t);
  for (let i = 0; i < 5; i++) await writeFile(path.join(target, `.ai-agent-playbook/bad-${i}.json`), '{invalid');
  const before = await treeSnapshot(target);
  let cursor, count = 0;
  do {
    const result = await playbookValidate({ target, pageSize: 2, cursor });
    assert.equal(result.ok, false); assert.equal(result.complete, true);
    assert.equal(result.runtimeVerified, false); assert.equal(result.issueCount, 5);
    assert.equal(result.issueCounts['invalid-json'], 5);
    assert.ok(wireBytes(result) <= MAX_MCP_RESULT_BYTES);
    count += result.issues.length; cursor = result.page.nextCursor ?? undefined;
  } while (cursor);
  assert.equal(count, 5);
  assert.deepEqual(await treeSnapshot(target), before);
});

test('skipped records remain visible through paged warning views and cannot yield a passing validation', async (t) => {
  const target = await fixture(t), outside = await fixture(t);
  for (let i = 0; i < 5; i++) await symlink(outside, path.join(target, `.ai-agent-playbook/linked-${i}`), process.platform === 'win32' ? 'junction' : 'dir');
  const summary = await playbookStatus({ target });
  assert.equal(summary.warnings.total, 5); assert.equal(summary.warnings.hasMore, true); assert.equal(summary.scan.complete, false);
  let cursor, count = 0;
  do {
    const result = await playbookValidate({ target, view: 'warnings', pageSize: 2, cursor });
    assert.equal(result.ok, false); assert.equal(result.issueCount, 0); assert.equal(result.complete, false);
    count += result.issues.length; cursor = result.page.nextCursor ?? undefined;
  } while (cursor);
  assert.equal(count, 5);
});

test('malformed cursors and incompatible views fail without writes', async (t) => {
  const target = await fixture(t), before = await treeSnapshot(target);
  for (const cursor of ['', '%%%invalid', Buffer.from('{"v":1,"offset":-1}').toString('base64url')]) {
    await assert.rejects(playbookRead({ target, cursor }), /Cursor/);
  }
  await assert.rejects(playbookStatus({ target, view: 'other' }), /view/);
  await assert.rejects(playbookValidate({ target, cursor: 'unused', view: 'summary' }), /cursor/);
  assert.deepEqual(await treeSnapshot(target), before);
});
