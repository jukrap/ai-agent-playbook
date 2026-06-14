import path from 'node:path';
import {
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  assertDirectory,
  normalizeTargetRelativePath,
  searchFile,
  walkSearchFiles
} from './shared.mjs';
import { checkDiagnostics } from './diagnostics.mjs';
import { checkRules } from './rules.mjs';

export async function searchOperator(options) {
  const {
    target,
    query,
    filePath,
    maxResults = 20
  } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!query || !query.trim()) throw new Error('Missing --query.');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const files = await walkSearchFiles(resolvedTarget);
  const results = [];
  const normalizedQuery = query.trim().toLowerCase();

  for (const file of files) {
    const result = await searchFile({ target: resolvedTarget, file, normalizedQuery });
    if (result) results.push(result);
  }

  results.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  const limited = results.slice(0, maxResults);
  const diagnostics = await checkDiagnostics({ target: resolvedTarget });
  const related = {
    diagnostics: {
      summary: diagnostics.summary,
      packageManager: diagnostics.packageManager,
      commands: diagnostics.commands
    }
  };
  if (relativePath !== undefined) {
    const rules = await checkRules({ target: resolvedTarget, filePath: relativePath });
    related.rules = {
      summary: rules.summary,
      rules: rules.rules.filter((rule) => rule.applies),
      warnings: rules.warnings
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    query: query.trim(),
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      matches: results.length,
      returned: limited.length,
      searchedFiles: files.length
    },
    results: limited,
    related
  };
}
