import { z } from 'zod';
import {
  buildProjectContext,
  capabilityCatalog,
  catalogManagedManifest,
  checkContracts,
  checkManagedManifest,
  contextStatus,
  describePlaybookLayout,
  listContexts,
  listContracts,
  previewWriteGate,
  inventoryReferenceDirectory,
  parseMaxChars,
  runtimeIndexStatus,
  searchRuntimeIndex,
  skillCatalog,
  workflowCatalog,
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
  runAstGrepSearch,
  sourceFunctionClones
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
    tool('capability_catalog', 'List Harness OS capability categories, skill counts, and workflow counts.', {}, () => capabilityCatalog({ repoRoot })),
    tool('skill_catalog', 'List local skills with v2 taxonomy and compatibility wrapper metadata.', {}, () => skillCatalog({ repoRoot })),
    tool('workflow_list', 'List Harness OS workflow recipes.', {}, () => workflowCatalog()),
    tool('reference_inventory', 'Summarize a local reference collection without reading large source contents.', {
      target: targetSchema.describe('Reference directory to inventory.'),
      maxResults: maxResultsSchema
    }, (args) => inventoryReferenceDirectory({
      target: args.target,
      maxProjects: args.maxResults ?? 100
    })),
    tool('playbook_layout', 'Describe whether a target playbook has the v2 layout.', {
      target: targetSchema
    }, (args) => describePlaybookLayout({ target: args.target })),
    tool('index_status', 'Report the local runtime index status for a target project.', {
      target: targetSchema
    }, (args) => runtimeIndexStatus({ target: args.target })),
    tool('index_search', 'Search local project files without writing the runtime index.', {
      target: targetSchema,
      query: z.string().min(1),
      maxResults: maxResultsSchema
    }, (args) => searchRuntimeIndex({
      target: args.target,
      query: args.query,
      maxResults: args.maxResults ?? 20
    })),
    tool('write_gate_preview', 'Preview write risk for a target path and intent without modifying files.', {
      target: targetSchema,
      intent: z.string().min(1),
      path: pathSchema,
      maxResults: maxResultsSchema
    }, (args) => previewWriteGate({
      repoRoot,
      target: args.target,
      intent: args.intent,
      filePath: args.path,
      maxResults: args.maxResults ?? 20
    })),
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
    tool('source_function_clones', 'Find exact normalized function-body clone cues in local source files.', {
      target: targetSchema,
      path: pathSchema,
      maxResults: maxResultsSchema
    }, (args) => sourceFunctionClones({
      target: args.target,
      path: args.path,
      maxResults: args.maxResults ?? 20
    })),
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

export function registerPlaybookMcpResourcesAndPrompts(server, options) {
  const { repoRoot } = options;
  const resources = [
    resource('capability_catalog', 'ai-playbook://capabilities', 'Harness OS capability catalog.', () => capabilityCatalog({ repoRoot })),
    resource('skill_catalog', 'ai-playbook://skills', 'Harness OS skill taxonomy catalog.', () => skillCatalog({ repoRoot })),
    resource('workflow_list', 'ai-playbook://workflows', 'Harness OS workflow recipe catalog.', () => workflowCatalog())
  ];

  for (const item of resources) {
    server.registerResource(item.name, item.uri, {
      title: item.name,
      description: item.description,
      mimeType: 'application/json'
    }, async (uri) => {
      const result = await item.handler();
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2)
        }]
      };
    });
  }

  server.registerPrompt('repo_onboarding_runbook', {
    title: 'Repo onboarding runbook',
    description: 'Start a local-first onboarding pass with catalog, layout, index, and write-gate checks.',
    argsSchema: {
      target: z.string().optional()
    }
  }, (args) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: [
          'Run a Harness OS repo onboarding pass.',
          `Target: ${args.target ?? '<target repository>'}`,
          '',
          'Use read-only catalog, layout status, runtime index preview/search, and write-gate preview first.',
          'Only write files when a command or runbook explicitly enables apply mode.'
        ].join('\n')
      }
    }]
  }));

  server.registerPrompt('harness_extension_plan', {
    title: 'Harness extension plan',
    description: 'Plan a new skill, MCP tool, recipe, or playbook layout extension.',
    argsSchema: {
      capability: z.string().optional()
    }
  }, (args) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: [
          'Plan a Harness OS extension.',
          `Capability: ${args.capability ?? '<capability>'}`,
          '',
          'Check the capability catalog, skill taxonomy, workflow list, and permission tier before writing implementation files.',
          'Keep skills trigger-focused and move reusable detail into references.'
        ].join('\n')
      }
    }]
  }));
}

function tool(name, description, schema, handler) {
  return { name, description, schema, handler };
}

function resource(name, uri, description, handler) {
  return { name, uri, description, handler };
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
