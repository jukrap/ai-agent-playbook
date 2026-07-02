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
  checkEvidenceLocators,
  checkManagedManifest,
  checkReferenceAdoptionLedger,
  checkRuntimeSchema,
  contextStatus,
  describePlaybookLayout,
  listContexts,
  listContracts,
  previewWriteGate,
  inventoryReferenceDirectory,
  parseMaxChars,
  previewRepoGraph,
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
    tool('runtime_schema_check', 'Validate a target-relative runtime, eval, witness, evidence, repo-graph, or source-registry JSON without writing files.', {
      target: targetSchema,
      path: z.string().min(1).describe('JSON path inside the target project.'),
      kind: z.string().min(1).optional().describe('Optional runtime schema kind override.')
    }, (args) => checkRuntimeSchema({
      target: args.target,
      filePath: args.path,
      kind: args.kind
    })),
    tool('evidence_locator_check', 'Validate JSON or Markdown evidence locators, scan ranges, source boundaries, and safe values without writing files.', {
      target: targetSchema,
      path: z.string().min(1).describe('JSON or Markdown path inside the target project.')
    }, (args) => checkEvidenceLocators({
      target: args.target,
      filePath: args.path
    })),
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
    tool('repo_graph_preview', 'Preview a compact graph over local runtime file, symbol, route/API, and dependency signals without writing files.', {
      target: targetSchema,
      maxResults: maxResultsSchema
    }, (args) => previewRepoGraph({
      target: args.target,
      maxNodes: args.maxResults ?? 100,
      maxEdges: (args.maxResults ?? 100) * 2
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

  server.registerPrompt('harness_governance_review', {
    title: 'Harness governance review',
    description: 'Review a proposed skill, recipe, MCP, context, memory, cache, or reference-adoption change before expanding the harness surface.',
    argsSchema: {
      target: z.string().optional(),
      capability: z.string().optional(),
      proposal: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS governance review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Capability: ${args.capability ?? '<capability or category>'}`,
    `Proposal: ${args.proposal ?? '<skill, reference, recipe, runtime command, MCP surface, adapter, plugin, or docs change>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe harness-extension',
    '- capability_catalog to confirm category fit and counts',
    '- skill_catalog to check trigger names, wrappers, references, and duplicate names',
    '- workflow_list to check whether a recipe already exists',
    '- write_gate_preview before suggesting managed writes',
    '',
    'Optional evidence:',
    '- reference_inventory and reference_ledger_check when adopting external reference material',
    '- index_status when runtime indexes, caches, generated evidence, or canon promotion are involved',
    '- playbook_layout when `.ai-playbook` layout changes are involved',
    '',
    'Stop conditions:',
    '- Change belongs in a selected reference, recipe, or docs page rather than always-on context',
    '- Proposed surface duplicates an existing skill, workflow, prompt, tool, or resource',
    '- Write behavior lacks permission tier, dry-run contract, target validation, or audit trail',
    '- Runtime evidence would be promoted into memory without review',
    '- External reference material would leak raw source text, private paths, internal URLs, secrets, branch names, or PR numbers',
    '',
    'Verification expectations:',
    '- State the chosen surface: skill, reference, recipe, runtime CLI, MCP resource, MCP prompt, MCP tool, adapter, plugin, docs, or no change.',
    '- Verify catalog, tests, translations, public-doc hygiene, and install/sync dry-runs for implemented changes.',
    '- Keep default context and default MCP tool surface narrow unless the broad benefit is explicit.'
  ]));

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

  server.registerPrompt('architecture_boundary_review', {
    title: 'Architecture boundary review',
    description: 'Review feature slice, domain model, monorepo/package, dependency direction, and public API boundary evidence.',
    argsSchema: {
      target: z.string().optional(),
      path: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS architecture boundary review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Path: ${args.path ?? '<optional module, package, or boundary path>'}`,
    `Intent: ${args.intent ?? '<architecture review intent>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe architecture-boundary-review',
    '- operator_map for stack, architecture, entrypoint, module boundary, and concern signals',
    '- operator_search for architecture docs, imports, package exports, domain terms, and boundary rules',
    '- write_gate_preview before suggesting module, package, or public API edits',
    '',
    'Optional evidence:',
    '- symbol_outline for owners, exports, components, services, functions, and classes',
    '- dependency_inventory for workspace/package/build graph and generated output context',
    '',
    'Stop conditions:',
    '- Architecture style is assumed from folder names instead of observed code and docs',
    '- Public API callers, domain invariant owner, dependency cycle impact, or package release impact is unknown',
    '- Broad restructure is proposed without compatibility, migration, or verification plan',
    '',
    'Verification expectations:',
    '- Name dependency direction, caller/import inventory, package build/typecheck/test, contract, and architecture decision/worklog checks actually available.',
    '- Do not force FSD, DDD, clean architecture, or monorepo reshuffling unless project evidence and user intent support it.'
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

  server.registerPrompt('package_release_readiness_review', {
    title: 'Package release readiness review',
    description: 'Review package publishing, artifact contents, metadata, dry-runs, license/notice evidence, and rollback constraints.',
    argsSchema: {
      target: z.string().optional(),
      artifact: z.string().optional(),
      channel: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS package release readiness review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Artifact: ${args.artifact ?? '<package, CLI, plugin, bundle, or binary>'}`,
    `Channel: ${args.channel ?? '<registry, marketplace, release channel, or distribution path>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe package-release-readiness',
    '- dependency_inventory for package manifests, lockfiles, scripts, containers, and CI signals',
    '- diagnostics_check for local build, test, pack, and verification command candidates',
    '- write_gate_preview before suggesting metadata, package, or release file edits',
    '',
    'Optional evidence:',
    '- operator_search for package metadata, changelog, release notes, license, notice, provenance, and generated output references',
    '- index_status for existing runtime reports and capability history',
    '',
    'Stop conditions:',
    '- Version source, artifact owner, registry/channel, license/notice evidence, or rollback/unpublish path is unknown',
    '- Registry credentials, publishing authority, or live network access is required but unavailable',
    '- Generated output or package dry-run evidence is stale or missing',
    '',
    'Verification expectations:',
    '- Name pack/dry-run file list, metadata, entrypoint, license/notice, provenance, lockfile, build, and affected runtime checks actually available.',
    '- Do not publish, log into registries, move tags, or claim legal approval from local evidence alone.'
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

  server.registerPrompt('mobile_release_review', {
    title: 'Mobile release review',
    description: 'Review mobile release, signing, device permission, offline sync, WebView bridge, and rollback evidence.',
    argsSchema: {
      target: z.string().optional(),
      platform: z.string().optional(),
      artifact: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS mobile release review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Platform: ${args.platform ?? '<iOS, Android, Expo, React Native, Flutter, or hybrid target>'}`,
    `Artifact: ${args.artifact ?? '<IPA, APK, AAB, internal build, OTA channel, or release artifact>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe mobile-release',
    '- dependency_inventory for package, native project, build, CI, and distribution signals',
    '- operator_search for signing, provisioning, build profile, permissions, offline sync, WebView bridge, and release cleanup references',
    '- write_gate_preview before suggesting mobile release, config, permission, or bridge edits',
    '',
    'Optional evidence:',
    '- route_api_hints for sync API, WebView routes, deep links, and backend contract hints',
    '- diagnostics_check for build, test, install, launch, and release verification command candidates',
    '',
    'Stop conditions:',
    '- Signing state, target device coverage, release artifact, rollback path, or store/distribution owner is unknown',
    '- Release build may expose a debug bridge, local endpoint, dev menu, or broad inspection surface',
    '- Permission expansion, offline/sync data path, or WebView bridge behavior lacks verification evidence',
    '',
    'Verification expectations:',
    '- Name build, artifact, install/launch, permission grant/deny, offline/network transition, WebView bridge, smoke, and rollback checks actually available.',
    '- Separate emulator/simulator evidence from real-device evidence and do not submit to stores or access credentials from prompt evidence alone.'
  ]));

  server.registerPrompt('connector_integration_review', {
    title: 'Connector integration review',
    description: 'Review connector, adapter, webhook, OAuth, registration, credential, retry, and integration contract evidence.',
    argsSchema: {
      target: z.string().optional(),
      path: z.string().optional(),
      integration: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS connector/integration review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Path: ${args.path ?? '<optional connector path>'}`,
    `Integration: ${args.integration ?? '<connector, API, webhook, OAuth app, MCP adapter, or sync job>'}`,
    '',
    'Required evidence:',
    '- route_api_hints for route, API, SQL, migration, data-object, and connector-adjacent hints',
    '- operator_search for connector registration, credential, webhook, retry, timeout, pagination, and error handling references',
    '- operator_preflight for related context, contracts, and nearby playbook guidance',
    '- write_gate_preview before suggesting connector or credential-related edits',
    '',
    'Optional evidence:',
    '- dependency_inventory for SDK, package, generated schema, or host-runtime package context',
    '- symbol_outline for connector classes, node definitions, handlers, adapters, and job owners',
    '',
    'Stop conditions:',
    '- Credential contract, API scope, webhook lifecycle, registration metadata, or saved-config compatibility is unknown',
    '- Permission scope widens without review or sandbox verification is unavailable',
    '- Connector depends on live external state without a repeatable verification path',
    '',
    'Verification expectations:',
    '- Include happy path, auth failure, permission failure, retry/rate-limit, malformed payload, webhook lifecycle, and registration checks when applicable.',
    '- Treat route/API hints as navigation evidence, not proof that connector contracts are correct.'
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

  server.registerPrompt('data_pipeline_review', {
    title: 'Data pipeline review',
    description: 'Route data contract, lineage, quality, reporting, instrumentation, retrieval, migration, and repair reviews through the right evidence.',
    argsSchema: {
      target: z.string().optional(),
      scope: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS data pipeline review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Scope: ${args.scope ?? '<dataset, report, event, retrieval index, pipeline, or metric>'}`,
    `Intent: ${args.intent ?? '<review intent>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe data-integrity-review',
    '- operator_search for metric, query, event, ETL, dashboard, retrieval, and reconciliation references',
    '- operator_map for lineage, producer, transformation, consumer, and ownership hints',
    '- route_api_hints for route, API, SQL, migration, and data-object hints',
    '- dependency_inventory for warehouse, ETL, scheduler, BI, document loader, or retrieval package context',
    '- write_gate_preview before suggesting edits',
    '',
    'Optional evidence:',
    '- index_status when generated indexes, retrieval artifacts, or runtime evidence are involved',
    '- contracts_check when data contracts or durable invariants exist',
    '- canon_check before promoting data facts into trusted memory',
    '',
    'Stop conditions:',
    '- Review type is unclear: contract/lineage, quality observability, reporting, migration integrity, instrumentation, or retrieval ingestion',
    '- Dataset grain, owner, source freshness, access model, denominator, or consumer impact is unknown',
    '- Source data, sampled rows, event payloads, or retrieval evidence are required but unavailable',
    '- Repair, backfill, or provider behavior cannot be bounded by dry-run, sample, or rollback evidence',
    '',
    'Verification expectations:',
    '- State which review type applies and which data skills should be read.',
    '- Name available source counts, sampled rows, reconciliation queries, lineage/contract evidence, quality checks, event payload samples, retrieval evaluation, freshness, and caveats.',
    '- Keep generated evidence separate from durable memory until reviewed.'
  ]));

  server.registerPrompt('database_change_review', {
    title: 'Database change review',
    description: 'Review schema migration, query performance, data integrity, rollback, and database consumer evidence.',
    argsSchema: {
      target: z.string().optional(),
      schema: z.string().optional(),
      intent: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS database change review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Schema or object: ${args.schema ?? '<table, migration, query, report, procedure, or constraint>'}`,
    `Intent: ${args.intent ?? '<database change intent>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe database-migration',
    '- operator_search for schema, migration, query, index, constraint, trigger, procedure, report, export, and rollback references',
    '- operator_map for stack, data, migration, reporting, and concern signals',
    '- route_api_hints for route, API, SQL, migration, and data-object hints',
    '- write_gate_preview before suggesting schema, query, migration, or data repair edits',
    '',
    'Optional evidence:',
    '- contracts_check when database invariants or API/data contracts exist',
    '- dependency_inventory for ORM, migration tool, scheduler, reporting, and database package context',
    '- index_status for existing generated runtime evidence',
    '',
    'Stop conditions:',
    '- Production data shape, lock impact, rollback path, backfill bound, or consumer impact is unknown',
    '- Destructive cleanup, drop, delete, truncate, reindex, or irreversible migration lacks explicit confirmation and rollback evidence',
    '- Credentials, secrets, private paths, or generated database output would be copied into reusable docs or trusted memory',
    '',
    'Verification expectations:',
    '- Name migration dry run, explain/estimate, before/after query, duplicate/orphan/null reconciliation, application compatibility, rendered report/export/dashboard, and post-deploy checks actually available.',
    '- Separate schema safety, query performance, data integrity, application contract, and reporting consumer evidence.'
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

  server.registerPrompt('documentation_package_review', {
    title: 'Documentation package review',
    description: 'Review PRDs, issue plans, release notes, handoffs, knowledge packages, and documentation evidence before creating durable docs.',
    argsSchema: {
      target: z.string().optional(),
      artifact: z.string().optional(),
      audience: z.string().optional(),
      source: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS documentation package review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Artifact: ${args.artifact ?? '<PRD, issue plan, release note, changelog, handoff, knowledge package, or documentation bundle>'}`,
    `Audience: ${args.audience ?? '<reader or owner>'}`,
    `Source: ${args.source ?? '<request, spec, worklog, runtime evidence, or docs source>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe documentation-package',
    '- playbook_context for current project memory and local documentation policy',
    '- operator_search for existing PRDs, issues, release notes, changelogs, runbooks, handoffs, maps, and docs',
    '- canon_check for existing durable facts and promoted evidence',
    '- write_gate_preview before suggesting documentation or memory writes',
    '',
    'Optional evidence:',
    '- reference_ledger_check when external reference adoption is part of the package',
    '- index_status when generated runtime reports, indexes, screenshots, or evidence are included',
    '- diagnostics_check for available docs, link, translation, or example validation commands',
    '',
    'Stop conditions:',
    '- Output type or audience is unclear',
    '- Source evidence conflicts with code, current docs, or durable memory',
    '- Raw transcripts, unreviewed generated summaries, or runtime reports would become trusted documentation',
    '- Owner, freshness, translation need, maintenance path, or archive path is unknown',
    '- Artifact would expose private paths, credentials, internal URLs, branch names, PR numbers, or raw reference excerpts',
    '',
    'Verification expectations:',
    '- State the output type: PRD/spec, issue plan, release note/changelog, handoff, knowledge package, docs update, or no durable doc.',
    '- List reviewed source evidence, open questions, caveats, owner, freshness, maintenance path, and archive path.',
    '- Keep generated evidence separate from durable memory until reviewed and promoted.',
    '- Validate public-doc hygiene, translations, links/paths, placeholders, setup commands, examples, and reader-specific handoff expectations when applicable.'
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

  server.registerPrompt('eval_harness_review', {
    title: 'Eval harness review',
    description: 'Review capability, regression, grader, fixture, and release-gate eval evidence before changing harness behavior.',
    argsSchema: {
      target: z.string().optional(),
      change: z.string().optional(),
      evalId: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS eval harness review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Change: ${args.change ?? '<prompt, skill, workflow, MCP, write tier, or capability change>'}`,
    `Eval: ${args.evalId ?? '<eval id or baseline>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe eval-driven-change',
    '- diagnostics_check for available test, lint, build, and eval commands',
    '- operator_search for existing evals, fixtures, graders, release gates, and regression notes',
    '- index_status for generated runtime evidence and preview-only indexes',
    '- write_gate_preview before suggesting harness, workflow, or memory writes',
    '',
    'Optional evidence:',
    '- capability_catalog and skill_catalog to locate related capabilities and trigger surfaces',
    '- canon_check when eval outcomes may become durable project memory',
    '',
    'Stop conditions:',
    '- Target behavior, baseline, grader, fixture scope, success threshold, or retry policy is missing',
    '- Generated evidence would hide failed attempts, cost, latency, or nondeterministic behavior',
    '- The proposed change would alter write behavior without a dry-run and permission-tier review',
    '',
    'Verification expectations:',
    '- State the eval type, fixture scope, grader type, pass/fail threshold, cost and latency caveats, and release-gate decision.',
    '- Keep failed attempts and generated reports in runtime evidence until reviewed.'
  ]));

  server.registerPrompt('capability_witness_review', {
    title: 'Capability witness review',
    description: 'Review observable capability evidence, baseline history, deltas, and regressions before declaring a harness capability healthy.',
    argsSchema: {
      target: z.string().optional(),
      capability: z.string().optional(),
      source: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS capability witness review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Capability: ${args.capability ?? '<capability id or behavior>'}`,
    `Source: ${args.source ?? '<runtime report, eval result, worklog, or manual evidence>'}`,
    '',
    'Required evidence:',
    '- capability_catalog for the current capability surface',
    '- index_status for available generated runtime evidence',
    '- operator_search for baselines, regression reports, worklogs, run records, and known failure modes',
    '- canon_check for existing durable facts and conflicts',
    '',
    'Optional evidence:',
    '- workflow_run_preview with recipe eval-driven-change when new witness evidence needs an eval run contract',
    '- diagnostics_check for commands that can reproduce the witness evidence',
    '',
    'Stop conditions:',
    '- Capability owner, baseline, scan range, source locator, status, or regression policy is unknown',
    '- Evidence cannot be reopened or distinguished from generated summaries',
    '- A degraded capability would be described as healthy without residual risk and follow-up work',
    '',
    'Verification expectations:',
    '- Record current status, baseline, delta, failed evidence, source locator, freshness, and reviewer decision.',
    '- Treat witness history as append-only evidence; do not overwrite prior failures with a new summary.'
  ]));

  server.registerPrompt('pre_action_fact_gate_review', {
    title: 'Pre-action fact gate review',
    description: 'Check facts, locators, write risk, and destructive-action boundaries before taking irreversible or high-impact actions.',
    argsSchema: {
      target: z.string().optional(),
      action: z.string().optional(),
      evidence: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS pre-action fact gate review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Action: ${args.action ?? '<command, edit, migration, deletion, publish, deploy, or promotion>'}`,
    `Evidence: ${args.evidence ?? '<fact, source locator, report, or claim>'}`,
    '',
    'Required evidence:',
    '- operator_preflight for target, tool, dependency, and environment checks',
    '- write_gate_preview for any file, memory, runtime, scaffold, deploy, publish, or destructive action',
    '- operator_search for source files, docs, scripts, and local policy related to the action',
    '- canon_check for durable facts and contradictions',
    '- index_status for generated evidence scope and freshness',
    '',
    'Optional evidence:',
    '- reference_ledger_check when the action depends on adopted external references',
    '- diagnostics_check for project-defined verification commands',
    '',
    'Stop conditions:',
    '- Critical fact, source locator, scan range, target path, owner, rollback path, or permission tier is missing',
    '- The action touches credentials, private paths, deployment targets, production data, or package publishing without explicit project policy',
    '- A generated hint would be treated as a verified fact without reopening the source',
    '',
    'Verification expectations:',
    '- State known facts, unknowns, exact evidence locators, write surface, dry-run path, rollback path, and verification command.',
    '- Do not proceed from this prompt alone; it is a review brief and keeps default MCP behavior read-only.'
  ]));

  server.registerPrompt('knowledge_source_review', {
    title: 'Knowledge source review',
    description: 'Review source registry entries, locator contracts, freshness, credentials, privacy tier, and promotion boundaries.',
    argsSchema: {
      target: z.string().optional(),
      source: z.string().optional(),
      useCase: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS knowledge source review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Source: ${args.source ?? '<source id, connector, dataset, repository, docs folder, or reference set>'}`,
    `Use case: ${args.useCase ?? '<search, browse, retrieval, reporting, onboarding, or promotion>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe knowledge-source-onboarding',
    '- reference_inventory for available local reference and source material',
    '- reference_ledger_check when external source adoption is in scope',
    '- operator_research for bounded source scans and evidence envelopes',
    '- index_status for generated source indexes and freshness',
    '- canon_check before promoting source-derived facts into trusted memory',
    '',
    'Optional evidence:',
    '- operator_search for local docs, source registry entries, adapters, hooks, and commands',
    '- write_gate_preview before suggesting registry, reference, memory, or integration writes',
    '',
    'Stop conditions:',
    '- Source owner, privacy tier, credential boundary, update cadence, freshness, browse path, or locator format is unknown',
    '- Source range is unbounded or evidence cannot be reopened from a compact locator',
    '- Private payloads, credentials, raw external excerpts, or generated summaries would be committed as trusted knowledge',
    '',
    'Verification expectations:',
    '- State registry fields, status, freshness, credential boundary, locator format, sample reopened evidence, caveats, and promotion policy.',
    '- Keep generated research and indexes under runtime until reviewed source facts are promoted explicitly.'
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

  server.registerPrompt('repo_graph_review', {
    title: 'Repo graph review',
    description: 'Review repo graph evidence, edge confidence, source locators, and promotion boundaries without writing files.',
    argsSchema: {
      target: z.string().optional(),
      focus: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS repo graph review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Focus: ${args.focus ?? '<files, symbols, routes, packages, contracts, docs, workflows, or evidence>'}`,
    '',
    'Required evidence:',
    '- repo_graph_preview for compact file, symbol, route/API, package, contract, doc, workflow, and evidence relationships',
    '- runtime_schema_check when a persisted graph artifact is being reviewed',
    '- evidence_locator_check for cited reports, evidence envelopes, or graph-linked markdown notes',
    '- index_status for available source indexes, preview-only indexes, and freshness',
    '- canon_check before treating generated graph facts as durable memory',
    '',
    'Optional evidence:',
    '- symbol_outline, dependency_inventory, and route_api_hints to reopen the source signals behind graph nodes and edges',
    '- operator_search for docs, contracts, rules, tests, and worklogs that explain graph relationships',
    '',
    'Stop conditions:',
    '- Edge confidence, source path, scan range, or source pattern is missing for the claim being made',
    '- Graph output is truncated or stale for the review scope',
    '- Generated graph facts would be promoted into memory without review',
    '- A private path, credential-shaped value, private URL, or noisy reference label appears in shared output',
    '',
    'Verification expectations:',
    '- Label graph findings as generated evidence, not truth.',
    '- Name reopened source locators and unresolved low-confidence edges.',
    '- Keep memory promotion behind explicit canon review and write-gate behavior.'
  ]));

  server.registerPrompt('ci_quality_gate_review', {
    title: 'CI quality gate review',
    description: 'Review required, optional, skipped, stale, and flaky checks before merge, release, or handoff.',
    argsSchema: {
      target: z.string().optional(),
      branch: z.string().optional(),
      change: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS CI quality gate review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Branch or revision: ${args.branch ?? '<branch, revision, or release candidate>'}`,
    `Change: ${args.change ?? '<change scope>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe ci-quality-gate',
    '- diagnostics_check for repository-defined lint, typecheck, test, build, package, docs, translation, and schema commands',
    '- dependency_inventory for package managers, lockfiles, CI workflows, containers, and scripts',
    '- evidence_locator_check for CI summaries, markdown gate notes, and runtime evidence references',
    '- write_gate_preview before suggesting CI, workflow, package, or verification file edits',
    '',
    'Optional evidence:',
    '- capability_witness or runtime capability-history evidence when available through index_status and operator_search',
    '- runtime_schema_check for generated eval, witness, or evidence-envelope artifacts',
    '- operator_search for flaky-test notes, skip policies, required check definitions, and owner metadata',
    '',
    'Stop conditions:',
    '- Required checks, owners, retry policy, stale evidence, skip reason, or release blocker status is unknown',
    '- A failed or skipped required check is treated as optional without owner acceptance',
    '- CI-only behavior cannot be reproduced or bounded by local evidence',
    '',
    'Verification expectations:',
    '- State pass, blocked, advisory-only, or accepted-risk gate status.',
    '- Separate required checks, optional checks, skipped checks, flaky checks, and unavailable checks.',
    '- Include the freshest command output or CI locator without copying private URLs, credentials, or long logs.'
  ]));

  server.registerPrompt('release_deployment_gate_review', {
    title: 'Release deployment gate review',
    description: 'Review artifact identity, deployment target, config diff, migration gate, rollback, and post-deploy evidence.',
    argsSchema: {
      target: z.string().optional(),
      artifact: z.string().optional(),
      environment: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS release/deployment gate review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Artifact: ${args.artifact ?? '<image, package, build, bundle, release candidate, or revision>'}`,
    `Environment: ${args.environment ?? '<environment, channel, tenant, region, or rollout mode>'}`,
    '',
    'Required evidence:',
    '- workflow_run_preview with recipe deployment-release',
    '- dependency_inventory for package, image, lockfile, container, CI, and release automation signals',
    '- route_api_hints for route/API/data/migration impact hints',
    '- diagnostics_check for build, test, smoke, package, docs, and deploy verification candidates',
    '- runtime_schema_check for generated release, witness, or evidence reports',
    '- evidence_locator_check for release gate notes and artifact evidence',
    '- canon_check before trusting promoted release facts',
    '- write_gate_preview before suggesting release, config, migration, or documentation edits',
    '',
    'Optional evidence:',
    '- operator_preflight for intent, context, and write-risk snapshot',
    '- operator_search for feature flags, config/env changes, migrations, workers, queues, cron jobs, release notes, rollback, monitors, and runbooks',
    '',
    'Stop conditions:',
    '- Artifact identity, deployment target, rollout owner, config diff, migration rollback, or post-deploy observation window is unknown',
    '- Deployment credentials or private endpoints are required but unavailable',
    '- Release notes or support handoff are required for a user-facing change but missing',
    '- A generated artifact or runtime report contains private paths, credentials, private URLs, or unrelated local files',
    '',
    'Verification expectations:',
    '- State pass, blocked, advisory-only, or accepted-risk release status.',
    '- Name artifact identity, CI quality gate, config diff, migration gate, smoke, monitoring, release notes, and rollback evidence.',
    '- Separate local source evidence from external deployment status claims.'
  ]));

  server.registerPrompt('security_compliance_gate_review', {
    title: 'Security compliance gate review',
    description: 'Review security and compliance gate evidence before merge, release, publication, or handoff.',
    argsSchema: {
      target: z.string().optional(),
      artifact: z.string().optional(),
      gate: z.string().optional()
    }
  }, (args) => promptMessage([
    'Run a Harness OS security/compliance gate review.',
    `Target: ${args.target ?? '<target repository>'}`,
    `Artifact: ${args.artifact ?? '<source change, package, image, document package, generated bundle, or release candidate>'}`,
    `Gate: ${args.gate ?? '<merge, release, publish, customer handoff, internal handoff, or documentation publication>'}`,
    '',
    'Required evidence:',
    '- skill_catalog to confirm security-compliance-gate and adjacent security skills are available',
    '- dependency_inventory for manifests, lockfiles, package scripts, containers, SBOM/provenance, and CI signals',
    '- route_api_hints for authz-sensitive route, API, SQL, migration, and data exposure hints',
    '- diagnostics_check for repository-defined security, public-doc, translation, schema, lint, test, and build checks',
    '- runtime_schema_check for generated runtime, eval, witness, source registry, graph, or evidence artifacts',
    '- evidence_locator_check for security findings, scanner summaries, release notes, handoffs, and evidence envelopes',
    '- write_gate_preview before suggesting security, dependency, license, documentation, or artifact edits',
    '',
    'Optional evidence:',
    '- operator_search for secrets, auth/access control, dependency, license, notice, generated artifact, scanner, and policy references',
    '- canon_check before relying on promoted security or compliance facts',
    '- reference_ledger_check when adopted reference material influenced the security/compliance rule',
    '',
    'Stop conditions:',
    '- Secret-like value, credential boundary, private URL, personal path, license/notice evidence, dependency provenance, or auth/access-control behavior is unresolved',
    '- Required scanner, public-doc hygiene, translation coverage, runtime schema, or locator check failed',
    '- Accepted risk lacks owner, expiry, compensating evidence, and follow-up path',
    '',
    'Verification expectations:',
    '- Classify findings as block, warn, document, or accepted-risk.',
    '- Route implementation details to security-review, auth-access-control, dependency-supply-chain-review, or license-notice-review.',
    '- Keep private scanner output bounded and cite reopenable locators instead of copying private URLs, credentials, long logs, or personal paths.'
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
