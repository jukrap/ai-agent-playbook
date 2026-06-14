import { z } from 'zod';
import {
  buildProjectContext,
  catalogManagedManifest,
  checkContracts,
  checkManagedManifest,
  contextStatus,
  listContexts,
  listContracts,
  parseMaxChars,
  SCHEMA_VERSION
} from './harness.mjs';
import {
  analyzeOperator,
  auditOperator,
  checkDiagnostics,
  checkImageDiff,
  checkOperator,
  checkRules,
  deltaOperator,
  mapOperator,
  preflightOperator,
  researchOperator,
  searchOperator
} from './operator-diagnostics.mjs';
import {
  lspDefinition,
  lspDiagnostics,
  lspReferences,
  lspStatus,
  lspSymbols,
  runAstGrepSearch
} from './deep-analysis.mjs';

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

const targetSchema = z.string().min(1).describe('Target project directory.');
const pathSchema = z.string().min(1).optional().describe('Path inside the target project.');
const maxResultsSchema = z.number().int().min(1).max(100).optional();

export function registerPlaybookMcpTools(server, options) {
  const { repoRoot } = options;
  const tools = [
    tool('playbook_context', 'Build local playbook context for a target project.', {
      target: targetSchema,
      maxChars: z.number().int().min(500).optional()
    }, (args) => buildProjectContext({
      target: args.target,
      maxChars: parseMaxChars(args.maxChars)
    })),
    tool('operator_check', 'Run the low-noise operator check.', {
      target: targetSchema,
      path: pathSchema,
      includeDiff: z.boolean().optional()
    }, (args) => checkOperator({
      repoRoot,
      target: args.target,
      filePath: args.path,
      includeDiff: Boolean(args.includeDiff)
    })),
    tool('operator_search', 'Search local project and playbook text.', {
      target: targetSchema,
      query: z.string().min(1),
      path: pathSchema,
      maxResults: maxResultsSchema
    }, (args) => searchOperator({
      target: args.target,
      query: args.query,
      filePath: args.path,
      maxResults: args.maxResults ?? 20
    })),
    tool('operator_research', 'Run local multi-axis research without network access.', {
      target: targetSchema,
      query: z.string().min(1),
      path: pathSchema,
      maxResults: maxResultsSchema
    }, (args) => researchOperator({
      target: args.target,
      query: args.query,
      filePath: args.path,
      maxResults: args.maxResults ?? 50
    })),
    tool('operator_preflight', 'Collect advisory evidence before code changes.', {
      target: targetSchema,
      intent: z.string().min(1),
      path: pathSchema,
      maxResults: maxResultsSchema
    }, (args) => preflightOperator({
      target: args.target,
      intent: args.intent,
      filePath: args.path,
      maxResults: args.maxResults ?? 20
    })),
    tool('operator_delta', 'Compare a saved preflight JSON file with current project files.', {
      target: targetSchema,
      before: z.string().min(1)
    }, (args) => deltaOperator({ target: args.target, beforeFile: args.before })),
    tool('operator_map', 'Summarize stack, architecture, tests, and code concerns.', {
      target: targetSchema
    }, (args) => mapOperator({ target: args.target })),
    tool('operator_audit', 'Audit playbook memory links, drift, duplicates, and managed state.', {
      target: targetSchema
    }, (args) => auditOperator({ target: args.target })),
    tool('rules_check', 'Check local rule files that apply to an optional path.', {
      target: targetSchema,
      path: pathSchema
    }, (args) => checkRules({ target: args.target, filePath: args.path })),
    tool('context_status', 'Show path-scoped context matches.', {
      target: targetSchema,
      path: z.string().min(1)
    }, (args) => contextStatus({ target: args.target, filePath: args.path })),
    tool('context_list', 'List project context files.', {
      target: targetSchema
    }, (args) => listContexts({ target: args.target })),
    tool('contracts_check', 'Check active and pending contracts for an optional path.', {
      target: targetSchema,
      path: pathSchema
    }, (args) => checkContracts({ target: args.target, filePath: args.path })),
    tool('contracts_list', 'List active and pending contracts.', {
      target: targetSchema
    }, (args) => listContracts({ target: args.target })),
    tool('managed_check', 'Check managed manifest state.', {
      target: targetSchema
    }, (args) => checkManagedManifest({ target: args.target })),
    tool('managed_catalog', 'List managed and unmanaged playbook files.', {
      target: targetSchema
    }, (args) => catalogManagedManifest({ repoRoot, target: args.target })),
    tool('diagnostics_check', 'Find local verification command candidates.', {
      target: targetSchema
    }, (args) => checkDiagnostics({ target: args.target })),
    tool('qa_image_diff', 'Compare two PNG images without writing a diff image.', {
      reference: z.string().min(1),
      actual: z.string().min(1),
      threshold: z.number().min(0).max(1).optional()
    }, (args) => checkImageDiff({
      reference: args.reference,
      actual: args.actual,
      threshold: args.threshold ?? 0
    })),
    tool('operator_analyze_deep', 'Run deep local analysis with AST and TypeScript language signals.', {
      target: targetSchema,
      path: pathSchema
    }, (args) => analyzeOperator({ target: args.target, filePath: args.path, deep: true })),
    tool('ast_grep_search', 'Run read-only AST-grep structural search.', {
      target: targetSchema,
      pattern: z.string().min(1),
      language: z.string().optional(),
      path: pathSchema,
      maxResults: maxResultsSchema
    }, (args) => runAstGrepSearch({
      target: args.target,
      pattern: args.pattern,
      language: args.language,
      path: args.path,
      maxResults: args.maxResults ?? 20
    })),
    tool('lsp_status', 'Report available read-only language analysis engines.', {
      target: targetSchema
    }, (args) => lspStatus({ target: args.target })),
    tool('lsp_diagnostics', 'Return TypeScript/JavaScript diagnostics when available.', {
      target: targetSchema,
      path: pathSchema
    }, (args) => lspDiagnostics({ target: args.target, path: args.path })),
    tool('lsp_symbols', 'Return TypeScript/JavaScript symbols for a project or file.', {
      target: targetSchema,
      path: pathSchema,
      maxResults: z.number().int().min(1).max(500).optional()
    }, (args) => lspSymbols({ target: args.target, path: args.path, maxResults: args.maxResults ?? 100 })),
    tool('lsp_references', 'Return text-backed references for a symbol.', {
      target: targetSchema,
      path: pathSchema,
      symbol: z.string().min(1)
    }, (args) => lspReferences({ target: args.target, path: args.path, symbol: args.symbol })),
    tool('lsp_definition', 'Return the first read-only symbol definition match.', {
      target: targetSchema,
      path: pathSchema,
      symbol: z.string().min(1)
    }, (args) => lspDefinition({ target: args.target, path: args.path, symbol: args.symbol }))
  ];

  for (const item of tools) {
    server.registerTool(item.name, {
      title: item.name,
      description: item.description,
      inputSchema: item.schema,
      annotations: READ_ONLY
    }, async (args) => {
      try {
        const result = await item.handler(args);
        return toolResult(item.name, result);
      } catch (error) {
        return errorToolResult(item.name, error);
      }
    });
  }
}

function tool(name, description, schema, handler) {
  return { name, description, schema, handler };
}

function toolResult(name, result) {
  return {
    structuredContent: result,
    content: [{
      type: 'text',
      text: `${name}: ${summarizeResult(result)}\n\n${JSON.stringify(result, null, 2)}`
    }]
  };
}

function errorToolResult(name, error) {
  const message = error instanceof Error ? error.message : String(error);
  const result = {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    summary: {
      warnings: 0,
      conflicts: 1
    },
    warnings: [],
    conflicts: [{
      id: 'mcp.tool.error',
      message,
      paths: []
    }]
  };
  return {
    isError: true,
    structuredContent: result,
    content: [{
      type: 'text',
      text: `${name}: ${message}\n\n${JSON.stringify(result, null, 2)}`
    }]
  };
}

function summarizeResult(result) {
  if (!result || typeof result !== 'object') return 'completed';
  const status = result.ok === false ? 'needs attention' : 'ok';
  if (result.summary && typeof result.summary === 'object') {
    const parts = Object.entries(result.summary)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean')
      .slice(0, 5)
      .map(([key, value]) => `${key}=${value}`);
    if (parts.length > 0) return `${status} (${parts.join(', ')})`;
  }
  return status;
}
