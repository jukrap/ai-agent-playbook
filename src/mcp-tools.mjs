import { z } from 'zod';
import {
  buildDependencyInventoryIndex,
  buildProjectContext,
  buildRouteApiHintsIndex,
  buildSymbolOutlineIndex,
  capabilityCatalog,
  catalogManagedManifest,
  checkCanonFacts,
  checkContracts,
  checkManagedManifest,
  checkReferenceAdoptionLedger,
  contextStatus,
  describePlaybookLayout,
  listContexts,
  listContracts,
  previewWriteGate,
  inventoryReferenceDirectory,
  parseMaxChars,
  previewWorkflowRun,
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
    tool('workflow_run_preview', 'Preview a workflow run manifest from a target or bundled recipe without writing files.', {
      target: targetSchema,
      recipe: z.string().min(1).describe('Lowercase hyphenated workflow recipe id.')
    }, (args) => previewWorkflowRun({
      repoRoot,
      target: args.target,
      recipeId: args.recipe
    })),
    tool('reference_inventory', 'Summarize a local reference collection without reading large source contents.', {
      target: targetSchema.describe('Reference directory to inventory.'),
      maxResults: maxResultsSchema
    }, (args) => inventoryReferenceDirectory({
      target: args.target,
      maxProjects: args.maxResults ?? 100
    })),
    tool('reference_ledger_check', 'Validate a project reference adoption ledger for statuses and local-only leaks.', {
      target: targetSchema,
      path: pathSchema.describe('Optional ledger path inside the target project.'),
      strict: z.boolean().optional().describe('Treat oversized excerpts as conflicts instead of warnings.')
    }, (args) => checkReferenceAdoptionLedger({
      target: args.target,
      filePath: args.path,
      strict: Boolean(args.strict)
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
    tool('symbol_outline', 'Preview local source symbols without writing a runtime index artifact.', {
      target: targetSchema,
      maxResults: maxResultsSchema
    }, (args) => buildSymbolOutlineIndex({
      target: args.target,
      maxEntries: args.maxResults ?? 100
    })),
    tool('dependency_inventory', 'Preview local dependency, lockfile, container, and CI inventory without executing package scripts.', {
      target: targetSchema
    }, (args) => buildDependencyInventoryIndex({
      target: args.target
    })),
    tool('route_api_hints', 'Preview local route, client API, SQL, and data object hints without writing runtime artifacts.', {
      target: targetSchema,
      maxResults: maxResultsSchema
    }, (args) => buildRouteApiHintsIndex({
      target: args.target,
      maxHints: args.maxResults ?? 100
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
    tool('canon_check', 'Check promoted canon facts against runtime evidence and current files without writing.', {
      target: targetSchema,
      path: pathSchema.describe('Optional canon facts JSON path inside the target project.')
    }, (args) => checkCanonFacts({
      target: args.target,
      filePath: args.path
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

  server.registerPrompt('reference_adoption_review', {
    title: 'Reference adoption review',
    description: 'Review a local reference collection and update adoption decisions without copying noisy source text.',
    argsSchema: {
      target: z.string().optional(),
      referenceDir: z.string().optional(),
      capability: z.string().optional()
    }
  }, (args) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: [
          'Run a Harness OS reference adoption review.',
          `Target project: ${args.target ?? '<target repository>'}`,
          `Reference directory: ${args.referenceDir ?? '<reference directory>'}`,
          `Capability focus: ${args.capability ?? '<capability or broad sweep>'}`,
          '',
          'Start with read-only reference inventory and reference ledger validation.',
          'Adopt patterns, contracts, and capability gaps only after recording status in the ledger.',
          'Do not copy large upstream excerpts, local absolute paths, internal URLs, secrets, or noisy upstream branding into public docs.'
        ].join('\n')
      }
    }]
  }));

  server.registerPrompt('backend_change_review', {
    title: 'Backend change review',
    description: 'Review backend/API changes with runtime evidence, contracts, and stop conditions.',
    argsSchema: {
      target: z.string().optional(),
      path: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS backend change review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Path: ${args.path ?? '<optional path>'}`,
    `Intent: ${args.intent ?? '<change intent>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe backend-contract-change',
    '- route_api_hints for route/API/data hints',
    '- contracts_check for path-scoped active or pending contracts',
    '- write_gate_preview before suggesting edits',
    '',
    'Optional evidence:',
    '- symbol_outline for owners and nearby functions',
    '- operator_search for callers, DTOs, payload examples, and errors',
    '',
    'Stop conditions:',
    '- Unknown caller behavior',
    '- Missing schema or contract owner',
    '- Auth, authorization, migration, or rollout behavior is ambiguous',
    '',
    'Verification expectations:',
    '- Name contract, integration, and caller compatibility checks actually available in the target.',
    '- Treat generated hints as evidence candidates, not trusted memory.'
  ]));

  server.registerPrompt('auth_access_control_review', {
    title: 'Auth access-control review',
    description: 'Review authentication and authorization changes with explicit evidence and denial-path checks.',
    argsSchema: {
      target: z.string().optional(),
      path: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS auth/access-control review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Path: ${args.path ?? '<optional path>'}`,
    `Intent: ${args.intent ?? '<auth or authorization concern>'}`,
    '',
    'Required evidence:',
    '- operator_search for auth, role, permission, session, token, and guard terms',
    '- route_api_hints for protected route and API hints',
    '- contracts_check for security-sensitive invariants',
    '- write_gate_preview before suggesting edits',
    '',
    'Optional evidence:',
    '- dependency_inventory for auth/security dependency context',
    '- symbol_outline for middleware, guard, policy, and controller owners',
    '',
    'Stop conditions:',
    '- Role matrix or denial behavior is unknown',
    '- Token/session lifecycle is unclear',
    '- Sensitive data exposure or authorization bypass risk cannot be bounded',
    '',
    'Verification expectations:',
    '- Include positive, denial, expired/invalid credential, and cross-tenant or cross-role checks when applicable.',
    '- Do not treat route hints as proof that authorization exists.'
  ]));

  server.registerPrompt('dependency_supply_chain_review', {
    title: 'Dependency supply-chain review',
    description: 'Review dependency, lockfile, container, and CI evidence without network vulnerability lookups by default.',
    argsSchema: {
      target: z.string().optional(),
      ecosystem: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS dependency/supply-chain review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Ecosystem focus: ${args.ecosystem ?? '<all detected ecosystems>'}`,
    '',
    'Required evidence:',
    '- dependency_inventory for manifests, lockfiles, containers, and CI actions',
    '- diagnostics_check for local verification command candidates',
    '- operator_search for package manager, SBOM, license, Docker, and workflow references',
    '',
    'Optional evidence:',
    '- index_status to see available runtime evidence',
    '- rules_check for project-specific dependency policy',
    '',
    'Stop conditions:',
    '- Missing lockfile for a production dependency ecosystem',
    '- Unclear package manager or release artifact owner',
    '- Network CVE/license lookup is required but not explicitly authorized',
    '',
    'Verification expectations:',
    '- Do not execute package scripts.',
    '- Separate local inventory findings from external vulnerability or license claims.'
  ]));

  server.registerPrompt('deployment_release_review', {
    title: 'Deployment release review',
    description: 'Review release, deployment, rollback, container, CI, and post-deploy evidence with explicit gates.',
    argsSchema: {
      target: z.string().optional(),
      environment: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS deployment/release review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Environment: ${args.environment ?? '<target environment>'}`,
    `Intent: ${args.intent ?? '<release or deployment intent>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe deployment-release',
    '- dependency_inventory for package, lockfile, container, and CI signals',
    '- diagnostics_check for local verification command candidates',
    '- write_gate_preview before suggesting edits',
    '',
    'Optional evidence:',
    '- operator_search for deployment scripts, release notes, migration gates, feature flags, and rollback references',
    '- index_status for existing runtime reports and capability history',
    '',
    'Stop conditions:',
    '- Rollback path, artifact identity, migration gate, or production owner is unknown',
    '- Deploy credentials or environment access is required but unavailable',
    '- Post-deploy smoke checks or monitoring signals cannot be bounded',
    '',
    'Verification expectations:',
    '- Name the CI, artifact/image, migration, smoke, logs, metrics, traces, and rollback checks actually available.',
    '- Separate local evidence from external deployment status claims.'
  ]));

  server.registerPrompt('frontend_quality_review', {
    title: 'Frontend quality review',
    description: 'Review frontend state/data, accessibility, responsive behavior, and visual regression evidence.',
    argsSchema: {
      target: z.string().optional(),
      path: z.string().optional(),
      screen: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS frontend quality review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Path: ${args.path ?? '<optional path>'}`,
    `Screen or flow: ${args.screen ?? '<screen or user flow>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe frontend-quality-review',
    '- operator_preflight for related context, contracts, and nearby playbook guidance',
    '- operator_search or index_search for affected screens, components, state, and data flow',
    '- write_gate_preview before suggesting edits',
    '',
    'Optional evidence:',
    '- symbol_outline for component, hook, and handler owners',
    '- qa_image_diff or browser evidence when screenshots are available',
    '',
    'Stop conditions:',
    '- Runnable screen, fixture, credential, design baseline, or supported breakpoint is missing',
    '- State ownership, cache invalidation, or accessibility target is unclear',
    '- Visual evidence is too stale or low-confidence for the claim being made',
    '',
    'Verification expectations:',
    '- Include desktop/mobile, keyboard/focus, loading/empty/error, stale data, overflow, and visual diff checks when applicable.',
    '- Treat screenshots and generated hints as evidence, not as durable project memory.'
  ]));

  server.registerPrompt('data_integrity_review', {
    title: 'Data integrity review',
    description: 'Review analytics, reporting, migration, backfill, reconciliation, and data contract evidence.',
    argsSchema: {
      target: z.string().optional(),
      dataset: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS data integrity review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Dataset or report: ${args.dataset ?? '<dataset, report, dashboard, or metric>'}`,
    `Intent: ${args.intent ?? '<review intent>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe data-integrity-review',
    '- route_api_hints for route, API, SQL, migration, and data-object hints',
    '- operator_search for metric, query, migration, ETL, dashboard, and reconciliation references',
    '- contracts_check when data contracts or durable invariants exist',
    '',
    'Optional evidence:',
    '- dependency_inventory for warehouse, ETL, scheduler, or reporting package context',
    '- canon_check before promoting data facts into trusted memory',
    '',
    'Stop conditions:',
    '- Metric owner, grain, denominator, source freshness, or rollback/repair path is unknown',
    '- Source data access is required but unavailable',
    '- Destructive repair, migration, or backfill behavior cannot be bounded',
    '',
    'Verification expectations:',
    '- Name source counts, sampled rows, reconciliation queries, report/dashboard checks, freshness, and caveats actually available.',
    '- Separate source data issues from transformation, query, and presentation issues.'
  ]));

  server.registerPrompt('adr_spec_handoff_review', {
    title: 'ADR/spec handoff review',
    description: 'Review decisions, specs, worklogs, and runtime evidence before durable project-memory promotion.',
    argsSchema: {
      target: z.string().optional(),
      source: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS ADR/spec handoff review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Source: ${args.source ?? '<plan, worklog, decision, or runtime artifact>'}`,
    `Intent: ${args.intent ?? '<handoff or promotion intent>'}`,
    '',
    'Required evidence:',
    '- canon_check for existing durable facts and conflicts',
    '- index_status for available generated runtime evidence',
    '- write_gate_preview if a future memory promotion write is being considered',
    '- operator_search for existing ADR, spec, worklog, map, and runbook references',
    '',
    'Optional evidence:',
    '- workflow_run_preview with recipe documentation-package when a documentation package is being prepared',
    '- reference_ledger_check when external reference adoption is part of the handoff',
    '',
    'Stop conditions:',
    '- Source evidence is noisy, private, unreviewed, or conflicts with current project memory',
    '- Decision owner, status, consequence, or replacement path is unclear',
    '- The handoff would store credentials, private paths, branch names, PR numbers, or raw chat transcripts',
    '',
    'Verification expectations:',
    '- Separate current rules, decisions, open questions, historical worklogs, and generated evidence.',
    '- Promote only reviewed stable facts; leave uncertain evidence in worklogs, plans, or runtime reports.'
  ]));

  server.registerPrompt('workflow_run_review', {
    title: 'Workflow run review',
    description: 'Preview and review a workflow recipe run contract before starting long-running work.',
    argsSchema: {
      target: z.string().optional(),
      recipe: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS workflow run review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Recipe: ${args.recipe ?? '<recipe id>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview for the selected recipe',
    '- playbook_layout to confirm the workflow folders exist',
    '- context_status or playbook_context when a path or project memory is relevant',
    '',
    'Optional evidence:',
    '- index_status for available runtime evidence',
    '- diagnostics_check for verification command candidates',
    '',
    'Stop conditions:',
    '- Recipe is missing, target-specific, or stale',
    '- Inputs, stop conditions, or verification expectations are incomplete',
    '- Work would require write tools that are not explicitly enabled',
    '',
    'Verification expectations:',
    '- Report the run contract without creating run files.',
    '- Keep worklog or memory promotion separate from generated preview evidence.'
  ]));

  server.registerPrompt('canon_promotion_review', {
    title: 'Canon promotion review',
    description: 'Review generated runtime evidence before promoting durable canon facts.',
    argsSchema: {
      target: z.string().optional(),
      source: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS canon promotion review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Runtime source: ${args.source ?? '<runtime report or index>'}`,
    '',
    'Required evidence:',
    '- index_status to list available runtime artifacts',
    '- canon_check to compare existing promoted facts',
    '- write_gate_preview if a future promotion write is being considered',
    '',
    'Optional evidence:',
    '- symbol_outline, dependency_inventory, and route_api_hints depending on the fact type',
    '- operator_research for local supporting evidence',
    '',
    'Stop conditions:',
    '- Runtime artifact is missing or malformed',
    '- Source scan range is unknown',
    '- Fact would mix generated evidence with trusted memory without review',
    '',
    'Verification expectations:',
    '- State which generated facts are candidates and which remain unknown.',
    '- Promotion requires explicit reviewed/apply behavior outside this prompt.'
  ]));

  server.registerPrompt('index_interpretation_review', {
    title: 'Index interpretation review',
    description: 'Interpret runtime indexes without converting generated hints into trusted project memory.',
    argsSchema: {
      target: z.string().optional(),
      focus: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS index interpretation review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Focus: ${args.focus ?? '<symbols, dependencies, routes, data, or broad review>'}`,
    '',
    'Required evidence:',
    '- index_status for available and preview-only indexes',
    '- symbol_outline for source owners and exported shapes',
    '- dependency_inventory for package, lockfile, container, and CI signals',
    '- route_api_hints for route/API/data hints',
    '',
    'Optional evidence:',
    '- index_search and operator_search for local supporting text',
    '- canon_check when promoted facts already exist',
    '',
    'Stop conditions:',
    '- Evidence is truncated or low-confidence for the claim being made',
    '- Runtime hints conflict with trusted memory',
    '- A conclusion requires executing project commands or using network data',
    '',
    'Verification expectations:',
    '- Clearly label generated hints, low-confidence matches, and unknowns.',
    '- Recommend canon promotion only after explicit human review.'
  ]));
}

function tool(name, description, schema, handler) {
  return { name, description, schema, handler };
}

function resource(name, uri, description, handler) {
  return { name, uri, description, handler };
}

function promptMessage(lines) {
  return {
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: lines.join('\n')
      }
    }]
  };
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
