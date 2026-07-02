import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(repoRoot, 'bin', 'ai-playbook.mjs');

test('mcp server lists read-only playbook tools and calls operator search without writing files', async () => {
  const target = await tempRepo('mcp target-공백-');
  await mkdir(path.join(target, 'src', '기능 모듈'), { recursive: true });
  await writeFile(path.join(target, 'src', '기능 모듈', 'search target.ts'), [
    'export function loginFlow() {',
    '  return "login signal";',
    '}',
    ''
  ].join('\n'));
  await mkdir(path.join(target, '_reference', 'reference-pack', 'skills', 'demo'), { recursive: true });
  await writeFile(path.join(target, '_reference', 'reference-pack', 'README.md'), '# Reference Pack\n');
  await writeFile(path.join(target, '_reference', 'reference-pack', 'skills', 'demo', 'SKILL.md'), '---\nname: demo\n---\n# Demo\n');
  const before = await listRelativeFiles(target);

  const { client, transport } = await connectMcp();
  try {
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name).sort();
    for (const expected of [
      'capability_catalog',
      'skill_catalog',
      'workflow_list',
      'reference_inventory',
      'playbook_layout',
      'index_status',
      'index_search',
      'write_gate_preview',
      'playbook_context',
      'operator_check',
      'operator_search',
      'operator_research',
      'operator_preflight',
      'operator_delta',
      'operator_map',
      'operator_audit',
      'rules_check',
      'context_status',
      'context_list',
      'contracts_check',
      'contracts_list',
      'managed_check',
      'managed_catalog',
      'diagnostics_check',
      'qa_image_diff',
      'operator_analyze_deep',
      'source_function_clones',
      'ast_grep_search',
      'lsp_status',
      'lsp_diagnostics',
      'lsp_symbols',
      'lsp_references',
      'lsp_definition'
    ]) {
      assert.equal(names.includes(expected), true, `missing MCP tool ${expected}`);
    }
    assert.equal(listed.tools.every((tool) => tool.annotations?.readOnlyHint === true), true);

    const resources = await client.listResources();
    assert.equal(resources.resources.some((resource) => resource.uri === 'ai-playbook://capabilities'), true);
    assert.equal(resources.resources.some((resource) => resource.uri === 'ai-playbook://skills'), true);
    assert.equal(resources.resources.some((resource) => resource.uri === 'ai-playbook://workflows'), true);

    const prompts = await client.listPrompts();
    assert.equal(prompts.prompts.some((prompt) => prompt.name === 'repo_onboarding_runbook'), true);
    assert.equal(prompts.prompts.some((prompt) => prompt.name === 'harness_extension_plan'), true);

    const catalog = await client.callTool({
      name: 'capability_catalog',
      arguments: {}
    });
    assert.equal(catalog.structuredContent.ok, true);
    assert.equal(catalog.structuredContent.taxonomyVersion, '2');

    const resource = await client.readResource({ uri: 'ai-playbook://workflows' });
    assert.equal(JSON.parse(resource.contents[0].text).summary.workflows, 11);

    const prompt = await client.getPrompt({
      name: 'repo_onboarding_runbook',
      arguments: { target }
    });
    assert.equal(prompt.messages[0].content.text.includes(target), true);

    const inventory = await client.callTool({
      name: 'reference_inventory',
      arguments: {
        target: path.join(target, '_reference'),
        maxResults: 5
      }
    });
    assert.equal(inventory.structuredContent.ok, true);
    assert.equal(inventory.structuredContent.summary.projects, 1);
    assert.equal(inventory.structuredContent.projects[0].candidateCapabilities.includes('skill-pack'), true);

    const result = await client.callTool({
      name: 'operator_search',
      arguments: {
        target,
        query: 'login signal',
        maxResults: 5
      }
    });
    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.schemaVersion, '1');
    assert.equal(result.structuredContent.ok, true);
    assert.equal(result.structuredContent.summary.matches, 1);
    assert.equal(result.structuredContent.results[0].path, 'src/기능 모듈/search target.ts');
  } finally {
    await client.close();
    await transport.close();
  }

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator analyze --deep reports AST and LSP read-only signals without writing files', async () => {
  const target = await tempRepo('deep analyze-공백-한글-');
  await mkdir(path.join(target, 'src', 'features', '검색'), { recursive: true });
  await mkdir(path.join(target, 'src', 'shared'), { recursive: true });
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    scripts: { check: 'tsc --noEmit' },
    dependencies: { typescript: '^6.0.3' }
  }, null, 2));
  await writeFile(path.join(target, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, target: 'ES2022', module: 'ESNext' },
    include: ['src/**/*.ts']
  }, null, 2));
  await writeFile(path.join(target, 'src', 'features', '검색', 'SearchPanel.ts'), [
    'export function SearchPanel(query: string) {',
    '  const normalized = query.trim().toLowerCase();',
    '  const parts = normalized.split(/\\s+/).filter(Boolean);',
    '  return parts.join("-");',
    '}',
    '',
    'export const searchValue = SearchPanel("demo");',
    ''
  ].join('\n'));
  await writeFile(path.join(target, 'src', 'shared', 'format.ts'), [
    'export function formatSearchLabel(query: string) {',
    '  // Different comments and whitespace should still match the normalized body.',
    '  const normalized = query.trim().toLowerCase();',
    '',
    '  const parts = normalized.split(/\\s+/).filter(Boolean);',
    '  return parts.join("-");',
    '}',
    ''
  ].join('\n'));
  await writeFile(path.join(target, 'src', 'shared', 'different.ts'), [
    'export function SearchPanel(query: string) {',
    '  return query.trim().toUpperCase();',
    '}',
    '',
    'export function tiny(value: string) {',
    '  return value;',
    '}',
    '',
    'export function tinyAgain(value: string) {',
    '  return value;',
    '}',
    ''
  ].join('\n'));
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli([
    'operator',
    'analyze',
    '.',
    '--deep',
    '--path',
    'src/features/검색/SearchPanel.ts',
    '--json'
  ], checked), 0);

  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.deep.enabled, true);
  assert.equal(report.deep.astGrep.summary.matches > 0, true);
  assert.equal(report.deep.lsp.status.ok, true);
  assert.equal(report.deep.lsp.symbols.symbols.some((symbol) => symbol.name === 'SearchPanel'), true);
  assert.equal(report.deep.lsp.diagnostics.ok, true);
  assert.equal(report.summary.functionCloneGroups, 0);
  assert.equal(report.deep.summary.functionCloneGroups, 0);
  assert.equal(report.deep.functionClones.summary.groups, 0);
  assert.deepEqual(await listRelativeFiles(target), before);

  const allChecked = capture(target);
  assert.equal(await runCli(['operator', 'analyze', '.', '--deep', '--json'], allChecked), 0);
  const allReport = JSON.parse(allChecked.out());
  assert.equal(allReport.summary.functionCloneGroups, 1);
  assert.equal(allReport.deep.summary.functionCloneGroups, 1);
  assert.equal(allReport.deep.functionClones.summary.groups, 1);
  assert.deepEqual(
    allReport.deep.functionClones.groups[0].items.map((item) => item.path).sort(),
    ['src/features/검색/SearchPanel.ts', 'src/shared/format.ts']
  );
  assert.equal(
    allReport.deep.functionClones.groups.some((group) => group.items.some((item) => item.name === 'tiny')),
    false
  );
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('mcp source_function_clones returns exact function-body cues for a path without writing files', async () => {
  const target = await tempRepo('function clones-공백-한글-');
  await mkdir(path.join(target, 'src', '범위'), { recursive: true });
  await mkdir(path.join(target, 'src', 'other'), { recursive: true });
  await writeFile(path.join(target, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, target: 'ES2022', module: 'ESNext' },
    include: ['src/**/*.ts']
  }, null, 2));
  await writeFile(path.join(target, 'src', '범위', 'first.ts'), [
    'export function loadUserName(value: string) {',
    '  const cleaned = value.trim().toLowerCase();',
    '  const segments = cleaned.split(":").filter(Boolean);',
    '  return segments.map((segment) => segment.toUpperCase()).join("/");',
    '}',
    '',
    'export const sameArrow = (value: string) => {',
    '  const cleaned = value.trim().toLowerCase();',
    '  const segments = cleaned.split(":").filter(Boolean);',
    '  return segments.map((segment) => segment.toUpperCase()).join("/");',
    '};',
    ''
  ].join('\n'));
  await writeFile(path.join(target, 'src', '범위', 'second.ts'), [
    'export function loadUserName(value: string) {',
    '  const cleaned = value.trim().toUpperCase();',
    '  const segments = cleaned.split(":").filter(Boolean);',
    '  return segments.join("/");',
    '}',
    '',
    'export function trivialOne(value: string) {',
    '  return value;',
    '}',
    '',
    'export function trivialTwo(value: string) {',
    '  return value;',
    '}',
    ''
  ].join('\n'));
  await writeFile(path.join(target, 'src', 'other', 'third.ts'), [
    'export function outside(value: string) {',
    '  const cleaned = value.trim().toLowerCase();',
    '  const segments = cleaned.split(":").filter(Boolean);',
    '  return segments.map((segment) => segment.toUpperCase()).join("/");',
    '}',
    ''
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const { client, transport } = await connectMcp();
  try {
    const scoped = await client.callTool({
      name: 'source_function_clones',
      arguments: {
        target,
        path: 'src/범위',
        maxResults: 10
      }
    });
    assert.equal(scoped.isError, undefined);
    assert.equal(scoped.structuredContent.ok, true);
    assert.deepEqual(scoped.structuredContent.mode, { localOnly: true, network: false, writes: false });
    assert.equal(scoped.structuredContent.path, 'src/범위');
    assert.equal(scoped.structuredContent.summary.groups, 1);
    assert.deepEqual(
      scoped.structuredContent.groups[0].items.map((item) => item.path).sort(),
      ['src/범위/first.ts', 'src/범위/first.ts']
    );
    assert.equal(
      scoped.structuredContent.groups.some((group) => group.items.some((item) => item.name === 'trivialOne')),
      false
    );

    const all = await client.callTool({
      name: 'source_function_clones',
      arguments: {
        target,
        maxResults: 10
      }
    });
    assert.equal(all.structuredContent.ok, true);
    assert.equal(all.structuredContent.summary.groups, 1);
    assert.deepEqual(
      all.structuredContent.groups[0].items.map((item) => item.path).sort(),
      ['src/other/third.ts', 'src/범위/first.ts', 'src/범위/first.ts']
    );
  } finally {
    await client.close();
    await transport.close();
  }

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('operator analyze --deep follows referenced tsconfig options for TSX diagnostics', async () => {
  const target = await tempRepo('deep analyze references-한글-');
  await mkdir(path.join(target, 'src'), { recursive: true });
  await writeFile(path.join(target, 'tsconfig.json'), JSON.stringify({
    files: [],
    references: [{ path: './tsconfig.app.json' }]
  }, null, 2));
  await writeFile(path.join(target, 'tsconfig.app.json'), JSON.stringify({
    compilerOptions: {
      strict: true,
      target: 'ES2022',
      module: 'ESNext',
      jsx: 'preserve'
    },
    include: ['src']
  }, null, 2));
  await writeFile(path.join(target, 'src', 'App.tsx'), [
    'declare global {',
    '  namespace JSX {',
    '    interface IntrinsicElements {',
    '      section: Record<string, unknown>;',
    '    }',
    '  }',
    '}',
    '',
    'export function App() {',
    '  return <section />;',
    '}',
    ''
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli([
    'operator',
    'analyze',
    '.',
    '--deep',
    '--path',
    'src/App.tsx',
    '--json'
  ], checked), 0);

  const report = JSON.parse(checked.out());
  assert.equal(report.deep.lsp.status.summary.available, 1);
  assert.equal(report.deep.lsp.diagnostics.summary.errors, 0);
  assert.equal(report.deep.lsp.symbols.symbols.some((symbol) => symbol.name === 'App'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('mcp exposes AST-grep and TypeScript LSP read-only analysis tools', async () => {
  const target = await tempRepo('mcp ast lsp-한글-');
  await mkdir(path.join(target, 'src', '공백 경로'), { recursive: true });
  const sourcePath = path.join(target, 'src', '공백 경로', 'example.ts');
  await writeFile(path.join(target, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, target: 'ES2022', module: 'ESNext' },
    include: ['src/**/*.ts']
  }, null, 2));
  await writeFile(sourcePath, [
    'export function targetName(value: string) {',
    '  return value.toUpperCase();',
    '}',
    '',
    'export const result = targetName("ok");',
    ''
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const { client, transport } = await connectMcp();
  try {
    const ast = await client.callTool({
      name: 'ast_grep_search',
      arguments: {
        target,
        pattern: 'function $NAME($$$) { $$$ }',
        language: 'typescript',
        path: 'src/공백 경로/example.ts',
        maxResults: 10
      }
    });
    assert.equal(ast.structuredContent.ok, true);
    assert.equal(ast.structuredContent.summary.matches, 1);
    assert.equal(ast.structuredContent.results[0].path, 'src/공백 경로/example.ts');

    const status = await client.callTool({
      name: 'lsp_status',
      arguments: { target }
    });
    assert.equal(status.structuredContent.ok, true);
    assert.equal(status.structuredContent.servers.some((server) => server.language === 'typescript' && server.status === 'available'), true);

    const symbols = await client.callTool({
      name: 'lsp_symbols',
      arguments: { target, path: 'src/공백 경로/example.ts' }
    });
    assert.equal(symbols.structuredContent.ok, true);
    assert.equal(symbols.structuredContent.symbols.some((symbol) => symbol.name === 'targetName'), true);

    const refs = await client.callTool({
      name: 'lsp_references',
      arguments: { target, path: 'src/공백 경로/example.ts', symbol: 'targetName' }
    });
    assert.equal(refs.structuredContent.ok, true);
    assert.equal(refs.structuredContent.references.length >= 2, true);
  } finally {
    await client.close();
    await transport.close();
  }

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('mcp tool calls return safe errors for missing targets and traversal paths without writing files', async () => {
  const target = await tempRepo('mcp safety-한글-');
  await mkdir(path.join(target, 'src'), { recursive: true });
  await writeFile(path.join(target, 'src', 'ok.ts'), 'export const ok = true;\n');
  const before = await listRelativeFiles(target);
  const missingTarget = path.join(target, 'missing');

  const { client, transport } = await connectMcp();
  try {
    const missing = await client.callTool({
      name: 'operator_search',
      arguments: {
        target: missingTarget,
        query: 'ok'
      }
    });
    assert.equal(missing.isError, true);
    assert.equal(missing.structuredContent.schemaVersion, '1');
    assert.equal(missing.structuredContent.ok, false);
    assert.equal(missing.structuredContent.conflicts[0].id, 'mcp.tool.error');

    const traversal = await client.callTool({
      name: 'ast_grep_search',
      arguments: {
        target,
        pattern: 'const $NAME = $$$',
        path: '..\\outside.ts'
      }
    });
    assert.equal(traversal.isError, true);
    assert.equal(traversal.structuredContent.ok, false);
    assert.match(traversal.structuredContent.conflicts[0].message, /inside target/);
  } finally {
    await client.close();
    await transport.close();
  }

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

async function connectMcp() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath, 'mcp'],
    cwd: repoRoot,
    stderr: 'pipe'
  });
  const client = new Client({ name: 'ai-playbook-test', version: '1.0.0' });
  await client.connect(transport);
  return { client, transport };
}

function capture(cwd) {
  let stdout = '';
  let stderr = '';
  return {
    cwd,
    repoRoot,
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    out: () => stdout,
    err: () => stderr
  };
}

async function tempRepo(prefix = '.ai-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function listRelativeFiles(root) {
  const files = [];
  await walk(root, '');
  files.sort();
  return files;

  async function walk(current, rel) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, entryRel);
      } else if (entry.isFile()) {
        files.push(entryRel);
      }
    }
  }
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}
