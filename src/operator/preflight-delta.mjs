import path from 'node:path';
import {
  checkContracts,
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  assertDirectory,
  buildPreflightCandidates,
  buildPreflightSnapshot,
  deltaFileSummary,
  isIntentScopedChange,
  isPlaybookPath,
  normalizeTargetRelativePath,
  operatorDeltaError,
  preflightContextSummary,
  readPreflightFile,
  researchTerms,
  validatePreflightSnapshot
} from './shared.mjs';
import { mapOperator } from './map.mjs';
import { checkRules } from './rules.mjs';
import { searchOperator } from './search.mjs';
import { previewOperatorContext } from './context-analyze.mjs';

export async function preflightOperator(options) {
  const {
    target,
    intent,
    filePath,
    maxResults = 20
  } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!intent || !intent.trim()) throw new Error('Missing --intent.');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const [search, map, rules, context, contracts, snapshot] = await Promise.all([
    searchOperator({ target: resolvedTarget, query: intent, filePath: relativePath, maxResults }),
    mapOperator({ target: resolvedTarget }),
    checkRules({ target: resolvedTarget, filePath: relativePath }),
    relativePath === undefined ? preflightContextSummary({ target: resolvedTarget }) : previewOperatorContext({ target: resolvedTarget, filePath: relativePath }),
    checkContracts({ target: resolvedTarget, filePath: relativePath }),
    buildPreflightSnapshot({ target: resolvedTarget, intent, relativePath })
  ]);
  const candidates = buildPreflightCandidates({
    searchResults: search.results,
    relativePath,
    rules,
    context,
    contracts,
    maxResults
  });
  const warnings = [
    ...(search.warnings ?? []),
    ...(rules.warnings ?? []),
    ...(context.warnings ?? []),
    ...(contracts.warnings ?? [])
  ];
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    intent,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      candidates: candidates.length,
      snapshotFiles: snapshot.files.length,
      warnings: warnings.length,
      conflicts: 0
    },
    candidates,
    signals: {
      search: {
        summary: search.summary
      },
      map: {
        summary: map.summary,
        stack: map.stack
      },
      rules: {
        summary: rules.summary,
        matches: rules.rules.filter((rule) => rule.applies),
        warnings: rules.warnings
      },
      context: {
        summary: context.summary,
        matches: context.contexts.filter((item) => item.applies),
        docMap: context.docMap,
        warnings: context.warnings
      },
      contracts: {
        summary: contracts.summary,
        contracts: contracts.contracts,
        warnings: contracts.warnings
      }
    },
    snapshot,
    warnings,
    conflicts: []
  };
}

export async function deltaOperator(options) {
  const { target, beforeFile } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const before = await readPreflightFile(beforeFile);
  if (!before.ok) {
    return operatorDeltaError({ target: resolvedTarget, beforeFile, conflict: before.conflict });
  }
  const validation = validatePreflightSnapshot(before.value);
  if (!validation.ok) {
    return operatorDeltaError({ target: resolvedTarget, beforeFile, conflict: validation.conflict });
  }

  const currentSnapshot = await buildPreflightSnapshot({
    target: resolvedTarget,
    intent: before.value.intent ?? '',
    relativePath: before.value.path
  });
  const beforeFiles = new Map(before.value.snapshot.files.map((file) => [file.path, file]));
  const currentFiles = new Map(currentSnapshot.files.map((file) => [file.path, file]));
  const added = [];
  const deleted = [];
  const modified = [];

  for (const [filePath, current] of currentFiles) {
    const previous = beforeFiles.get(filePath);
    if (!previous) {
      added.push(current);
    } else if (previous.hash !== current.hash) {
      modified.push({
        path: filePath,
        beforeHash: previous.hash,
        afterHash: current.hash,
        beforeSize: previous.size,
        afterSize: current.size
      });
    }
  }
  for (const [filePath, previous] of beforeFiles) {
    if (!currentFiles.has(filePath)) {
      deleted.push(previous);
    }
  }

  const changes = {
    added: added.map(deltaFileSummary),
    deleted: deleted.map(deltaFileSummary),
    modified: modified.map(deltaFileSummary)
  };
  const allChanges = [...changes.added, ...changes.deleted, ...changes.modified];
  const intentTerms = before.value.snapshot.intentTerms ?? researchTerms(before.value.intent ?? '');
  const scopedPath = before.value.path;
  const warnings = [];
  const outside = allChanges.filter((item) => !isIntentScopedChange(item.path, intentTerms, scopedPath));
  if (outside.length > 0) {
    warnings.push({
      id: 'operator.delta.intent-outside-change',
      message: `${outside.length} changed file(s) do not appear related to the preflight intent or path.`,
      paths: outside.slice(0, 20).map((item) => item.path)
    });
  }
  const playbookChanges = allChanges.filter((item) => isPlaybookPath(item.path));
  if (playbookChanges.length > 0) {
    warnings.push({
      id: 'operator.delta.playbook-change',
      message: `${playbookChanges.length} playbook, rule, context, or contract file(s) changed after preflight.`,
      paths: playbookChanges.slice(0, 20).map((item) => item.path)
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    before: {
      file: beforeFile,
      intent: before.value.intent ?? '',
      path: before.value.path,
      snapshotFiles: before.value.snapshot.files.length
    },
    summary: {
      added: changes.added.length,
      deleted: changes.deleted.length,
      modified: changes.modified.length,
      warnings: warnings.length,
      conflicts: 0
    },
    changes,
    warnings,
    conflicts: []
  };
}
