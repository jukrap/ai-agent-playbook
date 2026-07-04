import path from 'node:path';
import {
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  runDeepAnalysis
} from '../deep-analysis.mjs';
import {
  assertDirectory,
  buildOptionalAnalysisSignals,
  collectCoreContextSources,
  collectPathContextFiles,
  collectRelatedContextFiles,
  findPlaybookRoot,
  normalizeTargetRelativePath,
  readOperatorDocMap
} from './shared.mjs';
import { checkDiagnostics } from './diagnostics.mjs';
import { mapOperator } from './map.mjs';
import { checkRules } from './rules.mjs';

export async function previewOperatorContext(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!filePath || typeof filePath !== 'string') throw new Error('Missing --path.');

  const resolvedTarget = path.resolve(target);
  const relativePath = normalizeTargetRelativePath(resolvedTarget, filePath);
  const warnings = [];
  const playbook = await findPlaybookRoot(resolvedTarget);
  if (!playbook) {
    warnings.push({
      id: 'operator.context.playbook-missing',
      message: 'No active .ai-playbook/ folder found. If this project still has ai-playbook/, run migrate path first.',
      paths: ['.ai-playbook/']
    });
  }

  const [coreSources, contexts, rules, related] = await Promise.all([
    playbook ? collectCoreContextSources({ target: resolvedTarget, playbook }) : [],
    playbook ? collectPathContextFiles({ target: resolvedTarget, playbook, relativePath, warnings }) : [],
    checkRules({ target: resolvedTarget, filePath: relativePath }),
    playbook ? collectRelatedContextFiles({ target: resolvedTarget, playbook, relativePath }) : []
  ]);
  const docMap = playbook ? await readOperatorDocMap({ target: resolvedTarget, playbook }) : null;

  const matchingContexts = contexts.filter((item) => item.applies);
  const matchingRules = rules.rules.filter((rule) => rule.applies);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    path: relativePath,
    summary: {
      coreSources: coreSources.length,
      contextFiles: contexts.length,
      matchingContextFiles: matchingContexts.length,
      ruleMatches: matchingRules.length,
      relatedFiles: related.length,
      docMap: docMap?.exists ? 1 : 0,
      warnings: warnings.length + rules.warnings.length
    },
    coreSources,
    contexts,
    docMap,
    rules: {
      summary: rules.summary,
      rules: matchingRules,
      warnings: rules.warnings
    },
    related,
    warnings
  };
}

export async function analyzeOperator(options) {
  const { target, filePath, deep = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const [diagnostics, map, rules, context] = await Promise.all([
    checkDiagnostics({ target: resolvedTarget }),
    mapOperator({ target: resolvedTarget }),
    checkRules({ target: resolvedTarget, filePath: relativePath }),
    relativePath === undefined ? null : previewOperatorContext({ target: resolvedTarget, filePath: relativePath })
  ]);
  const optionalTools = buildOptionalAnalysisSignals({ map, diagnostics });
  const matchingRules = rules.rules.filter((rule) => rule.applies);
  const deepReport = deep
    ? await runDeepAnalysis({ target: resolvedTarget, filePath: relativePath })
    : undefined;

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      sourceFiles: map.summary.sourceFiles,
      commands: diagnostics.summary.commands,
      ruleMatches: matchingRules.length,
      contextMatches: context ? context.summary.matchingContextFiles : 0,
      optionalToolSignals: optionalTools.filter((tool) => ['detected', 'project-signals'].includes(tool.status)).length,
      functionCloneGroups: deepReport ? deepReport.summary.functionCloneGroups : 0,
      deepSignals: deepReport ? deepReport.summary.astGrepMatches + deepReport.summary.lspSymbols + deepReport.summary.functionCloneGroups : 0,
      warnings: diagnostics.summary.warn + rules.warnings.length + (context ? context.warnings.length : 0) + (deepReport ? deepReport.summary.warnings : 0)
    },
    diagnostics: {
      packageManager: diagnostics.packageManager,
      summary: diagnostics.summary,
      commands: diagnostics.commands
    },
    map: {
      summary: map.summary,
      stack: map.stack,
      architecture: map.architecture,
      quality: map.quality,
      concerns: map.concerns
    },
    rules: {
      summary: rules.summary,
      matches: matchingRules,
      warnings: rules.warnings
    },
    ...(context ? {
      context: {
        summary: context.summary,
        coreSources: context.coreSources,
        matches: context.contexts.filter((item) => item.applies),
        related: context.related,
        warnings: context.warnings
      }
    } : {}),
    optionalTools,
    ...(deepReport ? { deep: deepReport } : {})
  };
}
