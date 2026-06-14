import path from 'node:path';
import {
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  MAP_EXCLUDED_DIRS,
  SOURCE_EXTENSIONS,
  assertDirectory,
  buildArchitectureMap,
  buildConcernsMap,
  buildQualityMap,
  buildStackMap,
  collectTopLevelEntries,
  readPackageInfo,
  walkProjectFiles
} from './shared.mjs';
import { checkDiagnostics } from './diagnostics.mjs';

export async function mapOperator(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const files = await walkProjectFiles(resolvedTarget, MAP_EXCLUDED_DIRS);
  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()));
  const [diagnostics, packageInfo, topLevelEntries] = await Promise.all([
    checkDiagnostics({ target: resolvedTarget }),
    readPackageInfo(resolvedTarget),
    collectTopLevelEntries(resolvedTarget)
  ]);
  const stack = buildStackMap({ target: resolvedTarget, files, sourceFiles, diagnostics, packageInfo });
  const architecture = await buildArchitectureMap({ target: resolvedTarget, files, sourceFiles, topLevelEntries });
  const quality = buildQualityMap({ target: resolvedTarget, files, diagnostics });
  const concerns = await buildConcernsMap({ target: resolvedTarget, sourceFiles });

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    summary: {
      files: files.length,
      sourceFiles: sourceFiles.length,
      manifests: stack.manifests.length,
      testFiles: quality.testFiles.count,
      concerns: concerns.todos.count + concerns.debugArtifacts.count + concerns.securitySignals.count
    },
    stack,
    architecture,
    quality,
    concerns,
    warnings: []
  };
}
