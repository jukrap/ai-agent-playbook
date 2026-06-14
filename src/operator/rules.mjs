import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  RULE_DIRECTORY_SOURCES,
  RULE_FILE_SOURCES,
  assertDirectory,
  buildRuleEntry,
  normalizeTargetRelativePath,
  sourcePriority,
  walkRuleFiles
} from './shared.mjs';

export async function checkRules(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const warnings = [];
  const rules = [];

  for (const [relativeRoot, source] of RULE_DIRECTORY_SOURCES) {
    const root = path.join(resolvedTarget, ...relativeRoot.split('/'));
    const files = await walkRuleFiles(root);
    for (const file of files) {
      rules.push(await buildRuleEntry({
        target: resolvedTarget,
        file,
        source,
        relativePath,
        isSingleFile: false,
        warnings
      }));
    }
  }

  for (const [relativeFile, source] of RULE_FILE_SOURCES) {
    const file = path.join(resolvedTarget, ...relativeFile.split('/'));
    if (!existsSync(file)) continue;
    rules.push(await buildRuleEntry({
      target: resolvedTarget,
      file,
      source,
      relativePath,
      isSingleFile: true,
      warnings
    }));
  }

  rules.sort((left, right) => sourcePriority(left.source) - sourcePriority(right.source) || left.path.localeCompare(right.path));
  const summary = {
    total: rules.length,
    applies: rules.filter((rule) => rule.applies).length,
    warnings: warnings.length
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary,
    rules,
    warnings
  };
}
