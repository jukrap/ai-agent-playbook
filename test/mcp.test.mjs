import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { bootstrapRecords } from '../src/records.mjs';
import { treeSnapshot } from '../src/fs-safety.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('MCP exposes only four bound read-only tools and tool calls do not change files', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-mcp-'));
  const client = new Client({ name: 'record-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(repoRoot, 'bin/aapb.mjs'), 'mcp', '--project', target], stderr: 'pipe' });
  try {
    await bootstrapRecords({ target, repoRoot });
    await writeFile(path.join(target, '.ai-agent-playbook/CURRENT.md'), '# State\nKeep the contract.\n');
    const before = await treeSnapshot(target);
    await client.connect(transport);
    const tools = (await client.listTools()).tools;
    assert.deepEqual(tools.map((t) => t.name).sort(), ['aapb_read','aapb_search','aapb_status','aapb_validate']);
    assert.ok(tools.every((t) => t.annotations.readOnlyHint && !t.annotations.openWorldHint));
    for (const name of ['aapb_status', 'aapb_validate']) assert.notEqual((await client.callTool({ name, arguments: {} })).isError, true);
    const search = await client.callTool({ name: 'aapb_search', arguments: { query: 'contract' } });
    assert.match(JSON.stringify(search), /CURRENT.md/);
    assert.equal((await client.callTool({ name: 'aapb_read', arguments: { path: '../AGENTS.md' } })).isError, true);
    assert.deepEqual(await treeSnapshot(target), before);
    await writeFile(path.join(target, '.ai-agent-playbook/large.md'), '"\\quoted\\"\n'.repeat(5000));
    const largeBefore = await treeSnapshot(target);
    const large = await client.callTool({ name: 'aapb_read', arguments: { path: 'large.md', maxChars: 15000 } });
    assert.equal(large.structuredContent.truncated, true);
    assert.equal(large.structuredContent.path, 'large.md');
    assert.ok(large.structuredContent.content.length > 12000);
    assert.ok(large.structuredContent.nextCursor);
    assert.ok(Buffer.byteLength(JSON.stringify(large), 'utf8') <= 256 * 1024);
    assert.deepEqual(await treeSnapshot(target), largeBefore);
  } finally {
    await client.close(); await transport.close();
    assert.equal(path.dirname(target), os.tmpdir()); await rm(target, { recursive: true, force: true });
  }
});
