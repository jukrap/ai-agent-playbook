import path from 'node:path';
import {
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  assertDirectory,
  buildResearchAxes,
  buildResearchGaps,
  buildResearchMarkdown,
  buildResearchNextSteps,
  normalizeTargetRelativePath,
  researchFile,
  summarizeEvidenceCategories,
  walkSearchFiles
} from './shared.mjs';
import { checkDiagnostics } from './diagnostics.mjs';
import { mapOperator } from './map.mjs';
import { checkRules } from './rules.mjs';
import { previewOperatorContext } from './context-analyze.mjs';

export async function researchOperator(options) {
  const {
    target,
    query,
    filePath,
    maxResults = 50
  } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!query || !query.trim()) throw new Error('Missing --query.');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const axes = buildResearchAxes({ query: query.trim(), relativePath });
  const allTerms = [...new Set(axes.flatMap((axis) => axis.terms))];
  const files = await walkSearchFiles(resolvedTarget);
  const evidence = [];

  for (const file of files) {
    const result = await researchFile({
      target: resolvedTarget,
      file,
      axes,
      allTerms
    });
    if (result) evidence.push(result);
  }

  evidence.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  const limited = evidence.slice(0, maxResults);
  const [diagnostics, map, rules, context] = await Promise.all([
    checkDiagnostics({ target: resolvedTarget }),
    mapOperator({ target: resolvedTarget }),
    relativePath === undefined ? null : checkRules({ target: resolvedTarget, filePath: relativePath }),
    relativePath === undefined ? null : previewOperatorContext({ target: resolvedTarget, filePath: relativePath })
  ]);
  const gaps = buildResearchGaps({ evidence, relativePath, rules, context, map });
  const nextSteps = buildResearchNextSteps({ query: query.trim(), relativePath, evidence, gaps, diagnostics });
  const summary = {
    axes: axes.length,
    searchedFiles: files.length,
    evidence: evidence.length,
    returned: limited.length,
    categories: summarizeEvidenceCategories(evidence),
    gaps: gaps.length,
    commands: diagnostics.summary.commands
  };
  const result = {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    query: query.trim(),
    ...(relativePath === undefined ? {} : { path: relativePath }),
    mode: {
      localOnly: true,
      network: false,
      writes: false
    },
    summary,
    axes,
    evidence: limited,
    gaps,
    nextSteps,
    related: {
      diagnostics: {
        summary: diagnostics.summary,
        packageManager: diagnostics.packageManager,
        commands: diagnostics.commands
      },
      map: {
        summary: map.summary,
        stack: map.stack,
        architecture: map.architecture,
        quality: map.quality,
        concerns: map.concerns
      },
      ...(rules ? {
        rules: {
          summary: rules.summary,
          rules: rules.rules.filter((rule) => rule.applies),
          warnings: rules.warnings
        }
      } : {}),
      ...(context ? {
        context: {
          summary: context.summary,
          coreSources: context.coreSources,
          matches: context.contexts.filter((item) => item.applies),
          related: context.related,
          warnings: context.warnings
        }
      } : {})
    }
  };
  return {
    ...result,
    reportMarkdown: buildResearchMarkdown(result)
  };
}
