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
    'router.post("/login", loginFlow);',
    ''
  ].join('\n'));
  await writeFile(path.join(target, 'package.json'), `${JSON.stringify({
    name: 'mcp-fixture',
    scripts: { test: 'node --test' },
    dependencies: { '@modelcontextprotocol/sdk': '^1.29.0' }
  }, null, 2)}\n`);
  await writeFile(path.join(target, 'package-lock.json'), '{"lockfileVersion": 3}\n');
  await mkdir(path.join(target, '_reference', 'reference-pack', 'skills', 'demo'), { recursive: true });
  await writeFile(path.join(target, '_reference', 'reference-pack', 'README.md'), '# Reference Pack\n');
  await writeFile(path.join(target, '_reference', 'reference-pack', 'skills', 'demo', 'SKILL.md'), '---\nname: demo\n---\n# Demo\n');
  await mkdir(path.join(target, '.ai-playbook', 'knowledge'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'knowledge', 'custom-reference-ledger.md'), [
    '# Custom Reference Adoption Ledger',
    '',
    '| Status | Reference ID | Capability | Useful Pattern | Local Adoption | Risk/Noise | Decision Date |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| reviewed | security-pack | security | summarize source pattern | local validator | none | 2026-07-03 |',
    ''
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const { client, transport } = await connectMcp();
  try {
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name).sort();
    for (const expected of [
      'capability_catalog',
      'skill_catalog',
      'workflow_list',
      'workflow_run_preview',
      'reference_inventory',
      'reference_ledger_check',
      'playbook_layout',
      'index_status',
      'index_search',
      'symbol_outline',
      'dependency_inventory',
      'route_api_hints',
      'write_gate_preview',
      'canon_check',
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
    assert.equal(names.includes('write_gate_advisory'), false);
    assert.equal(names.includes('canon_promote'), false);
    assert.equal(listed.tools.every((tool) => tool.annotations?.readOnlyHint === true), true);

    const resources = await client.listResources();
    assert.equal(resources.resources.some((resource) => resource.uri === 'ai-playbook://capabilities'), true);
    assert.equal(resources.resources.some((resource) => resource.uri === 'ai-playbook://skills'), true);
    assert.equal(resources.resources.some((resource) => resource.uri === 'ai-playbook://workflows'), true);

    const prompts = await client.listPrompts();
    const promptNames = prompts.prompts.map((prompt) => prompt.name);
    for (const expected of [
      'repo_onboarding_runbook',
      'harness_extension_plan',
      'reference_adoption_review',
      'backend_change_review',
      'auth_access_control_review',
      'dependency_supply_chain_review',
      'workflow_run_review',
      'canon_promotion_review',
      'index_interpretation_review'
    ]) {
      assert.equal(promptNames.includes(expected), true, `missing MCP prompt ${expected}`);
    }

    const catalog = await client.callTool({
      name: 'capability_catalog',
      arguments: {}
    });
    assert.equal(catalog.structuredContent.ok, true);
    assert.equal(catalog.structuredContent.taxonomyVersion, '2');

    const resource = await client.readResource({ uri: 'ai-playbook://workflows' });
    assert.equal(JSON.parse(resource.contents[0].text).summary.workflows, 14);

    const workflowRunPreview = await client.callTool({
      name: 'workflow_run_preview',
      arguments: {
        target,
        recipe: 'backend-contract-change'
      }
    });
    assert.equal(workflowRunPreview.isError, undefined);
    assert.equal(workflowRunPreview.structuredContent.ok, true);
    assert.equal(workflowRunPreview.structuredContent.mode.writes, false);
    assert.equal(workflowRunPreview.structuredContent.recipe.source, 'bundled');
    assert.equal(workflowRunPreview.structuredContent.manifest.verification.some((item) => item.includes('contract tests')), true);

    const indexStatus = await client.callTool({
      name: 'index_status',
      arguments: { target }
    });
    assert.equal(indexStatus.structuredContent.ok, true);
    assert.equal(indexStatus.structuredContent.indexes.some((item) => item.kind === 'file-inventory'), true);
    assert.equal(indexStatus.structuredContent.indexes.some((item) => item.kind === 'symbol-outline' && item.previewOnly === true), true);

    const symbolOutline = await client.callTool({
      name: 'symbol_outline',
      arguments: {
        target,
        maxResults: 10
      }
    });
    assert.equal(symbolOutline.isError, undefined);
    assert.equal(symbolOutline.structuredContent.ok, true);
    assert.equal(symbolOutline.structuredContent.mode.writes, false);
    assert.equal(symbolOutline.structuredContent.entries.some((entry) => entry.file === 'src/기능 모듈/search target.ts' && entry.name === 'loginFlow'), true);

    const dependencyInventory = await client.callTool({
      name: 'dependency_inventory',
      arguments: { target }
    });
    assert.equal(dependencyInventory.isError, undefined);
    assert.equal(dependencyInventory.structuredContent.ok, true);
    assert.equal(dependencyInventory.structuredContent.mode.writes, false);
    assert.equal(dependencyInventory.structuredContent.manifests.some((manifest) => manifest.path === 'package.json' && manifest.scripts.includes('test')), true);
    assert.equal(dependencyInventory.structuredContent.lockfiles.some((lockfile) => lockfile.path === 'package-lock.json'), true);

    const routeApiHints = await client.callTool({
      name: 'route_api_hints',
      arguments: {
        target,
        maxResults: 10
      }
    });
    assert.equal(routeApiHints.isError, undefined);
    assert.equal(routeApiHints.structuredContent.ok, true);
    assert.equal(routeApiHints.structuredContent.mode.writes, false);
    assert.equal(routeApiHints.structuredContent.hints.some((hint) => hint.kind === 'route' && hint.path === '/login'), true);

    const prompt = await client.getPrompt({
      name: 'repo_onboarding_runbook',
      arguments: { target }
    });
    assert.equal(prompt.messages[0].content.text.includes(target), true);

    const referencePrompt = await client.getPrompt({
      name: 'reference_adoption_review',
      arguments: {
        target,
        referenceDir: path.join(target, '_reference'),
        capability: 'security'
      }
    });
    assert.equal(referencePrompt.messages[0].content.text.includes(path.join(target, '_reference')), true);
    assert.equal(referencePrompt.messages[0].content.text.includes('security'), true);

    for (const { name, toolName, arguments: promptArguments } of [
      { name: 'backend_change_review', toolName: 'workflow_run_preview', arguments: { target, intent: 'review auth flow' } },
      { name: 'auth_access_control_review', toolName: 'route_api_hints', arguments: { target, intent: 'review auth flow' } },
      { name: 'dependency_supply_chain_review', toolName: 'dependency_inventory', arguments: { target, ecosystem: 'npm' } },
      { name: 'workflow_run_review', toolName: 'workflow_run_preview', arguments: { target, recipe: 'backend-contract-change' } },
      { name: 'canon_promotion_review', toolName: 'canon_check', arguments: { target, source: '.ai-playbook/runtime/indexes/file-inventory.json' } },
      { name: 'index_interpretation_review', toolName: 'index_status', arguments: { target, focus: 'routes' } }
    ]) {
      const reviewPrompt = await client.getPrompt({
        name,
        arguments: promptArguments
      });
      const text = reviewPrompt.messages[0].content.text;
      assert.equal(text.includes(target), true);
      assert.equal(text.includes('Required evidence:'), true);
      assert.equal(text.includes('Stop conditions:'), true);
      assert.equal(text.includes('Verification expectations:'), true);
      assert.equal(text.includes(toolName), true, `${name} should mention ${toolName}`);
      assert.equal(text.includes('apply: true'), false);
    }

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

    const ledger = await client.callTool({
      name: 'reference_ledger_check',
      arguments: { target }
    });
    assert.equal(ledger.structuredContent.ok, false);
    assert.equal(ledger.structuredContent.conflicts.some((conflict) => conflict.id === 'reference-ledger.missing'), true);

    const customLedger = await client.callTool({
      name: 'reference_ledger_check',
      arguments: {
        target,
        path: '.ai-playbook/knowledge/custom-reference-ledger.md'
      }
    });
    assert.equal(customLedger.structuredContent.ok, true);
    assert.equal(customLedger.structuredContent.summary.capabilities.security.statuses.reviewed, 1);

    const canon = await client.callTool({
      name: 'canon_check',
      arguments: { target }
    });
    assert.equal(canon.structuredContent.ok, true);
    assert.equal(canon.structuredContent.mode.writes, false);
    assert.equal(canon.structuredContent.summary.facts, 0);

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
