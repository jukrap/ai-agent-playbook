import { rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_PLAYBOOK_DIR,
  INSTALL_MANIFEST_FILE,
  LEGACY_PLAYBOOK_DIRS,
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  MAP_EXCLUDED_DIRS,
  assertDirectory,
  auditContextGlobs,
  auditContractDrift,
  auditDocMapTargets,
  auditDuplicateMarkdown,
  auditManagedManifest,
  auditMarkdownLinks,
  collectPlaybookMarkdownFiles,
  findPlaybookRoot,
  hashFile,
  isRecord,
  operatorFinding,
  operatorGcResult,
  readOperatorManagedManifest,
  removeEmptyParents,
  safeJoin,
  summarizeChecks,
  toPortablePath,
  walkProjectFiles
} from './shared.mjs';

export async function auditOperator(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const findings = [];
  const playbook = await findPlaybookRoot(resolvedTarget);
  const legacyPlaybooks = legacyPlaybookDirs(resolvedTarget);
  const bothPlaybookPathsExist = playbook && legacyPlaybooks.length > 0;
  if (!playbook) {
    findings.push(operatorFinding(
      'fail',
      'operator.audit.playbook-missing',
      'playbook',
      `No active ${DEFAULT_PLAYBOOK_DIR}/ folder found. If this project still has a legacy playbook folder, run migrate path first.`,
      [`${DEFAULT_PLAYBOOK_DIR}/`, ...legacyPlaybooks.map((directory) => `${directory}/`)]
    ));
  }
  if (bothPlaybookPathsExist) {
    findings.push(operatorFinding(
      'warn',
      'operator.audit.legacy-playbook',
      'playbook',
      `${DEFAULT_PLAYBOOK_DIR}/ exists beside legacy playbook folder(s); runtime uses only ${DEFAULT_PLAYBOOK_DIR}/. Review legacy cleanup after migration.`,
      [`${DEFAULT_PLAYBOOK_DIR}/`, ...legacyPlaybooks.map((directory) => `${directory}/`)]
    ));
  }

  const sections = {
    links: { checked: 0, broken: 0, findings: [] },
    context: { files: 0, orphaned: 0, warnings: 0, findings: [] },
    duplicates: { groups: 0, items: [] },
    managed: { manifest: playbook ? `${playbook.name}/${INSTALL_MANIFEST_FILE}` : null, status: 'missing-playbook', total: 0, modified: 0, missing: 0 },
    memoryDrift: { contextOrphans: 0, missingDocMapTargets: 0, contractAppliesToMissing: 0, findings: [] }
  };

  if (playbook) {
    const markdownFiles = await collectPlaybookMarkdownFiles(playbook.absolutePath);
    const projectFiles = await walkProjectFiles(resolvedTarget, MAP_EXCLUDED_DIRS);
    const linkFindings = await auditMarkdownLinks({ target: resolvedTarget, markdownFiles });
    sections.links.checked = markdownFiles.length;
    sections.links.broken = linkFindings.length;
    sections.links.findings = linkFindings;
    findings.push(...linkFindings);

    const contextFindings = await auditContextGlobs({
      target: resolvedTarget,
      playbook,
      projectFiles: projectFiles.map((file) => toPortablePath(path.relative(resolvedTarget, file)))
    });
    sections.context.files = contextFindings.files;
    sections.context.orphaned = contextFindings.orphaned;
    sections.context.warnings = contextFindings.warnings;
    sections.context.findings = contextFindings.findings;
    findings.push(...contextFindings.findings);

    const docMapFindings = await auditDocMapTargets({ target: resolvedTarget, playbook });
    const contractFindings = await auditContractDrift({ target: resolvedTarget });
    sections.memoryDrift = {
      contextOrphans: contextFindings.orphaned,
      missingDocMapTargets: docMapFindings.length,
      contractAppliesToMissing: contractFindings.length,
      findings: [...docMapFindings, ...contractFindings]
    };
    findings.push(...docMapFindings, ...contractFindings);

    const duplicateFindings = await auditDuplicateMarkdown({ target: resolvedTarget, markdownFiles });
    sections.duplicates.groups = duplicateFindings.length;
    sections.duplicates.items = duplicateFindings.map((finding) => ({ paths: finding.paths }));
    findings.push(...duplicateFindings);

    const managed = await auditManagedManifest({ target: resolvedTarget, playbook });
    sections.managed = managed.section;
    findings.push(...managed.findings);
  }

  const summary = summarizeChecks(findings);
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    summary: {
      findings: findings.length,
      ...summary
    },
    findings,
    sections,
    warnings: findings.filter((finding) => finding.level === 'warn')
  };
}

export async function gcOperator(options) {
  const { repoRoot, target, apply = false } = options;
  await assertDirectory(repoRoot, 'Repository root does not exist');
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedTarget = path.resolve(target);
  const playbook = await findPlaybookRoot(resolvedTarget);
  const operations = [];
  const warnings = [];
  const conflicts = [];
  if (!playbook) {
    conflicts.push({
      id: 'operator.gc.playbook-missing',
      message: `No active ${DEFAULT_PLAYBOOK_DIR}/ folder found. If this project still has a legacy playbook folder, run migrate path first.`,
      paths: [`${DEFAULT_PLAYBOOK_DIR}/`, ...legacyPlaybookDirs(resolvedTarget).map((directory) => `${directory}/`)]
    });
    return operatorGcResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts });
  }

  const manifestResult = await readOperatorManagedManifest(playbook);
  if (!manifestResult.ok) {
    conflicts.push(manifestResult.conflict);
    return operatorGcResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts });
  }

  const removedPaths = [];
  const files = manifestResult.manifest.files;
  for (const entry of files) {
    if (!isRecord(entry) || typeof entry.path !== 'string' || typeof entry.source !== 'string') continue;
    const sourcePath = safeJoin(resolvedRepoRoot, entry.source);
    if (sourcePath && existsSync(sourcePath)) continue;

    const targetPath = safeJoin(resolvedTarget, entry.path);
    if (!targetPath) {
      conflicts.push({
        id: 'operator.gc.unsafe-managed-path',
        message: `${entry.path} is outside the target repository and will not be removed.`,
        paths: [entry.path]
      });
      continue;
    }
    if (!entry.path.startsWith(`${playbook.name}/`)) {
      conflicts.push({
        id: 'operator.gc.protected-managed-file',
        message: `${entry.path} is outside ${playbook.name}/ and will not be removed by operator gc.`,
        paths: [entry.path]
      });
      continue;
    }
    if (!existsSync(targetPath)) {
      warnings.push({
        id: 'operator.gc.missing-obsolete-managed-file',
        message: `${entry.path} is already missing.`,
        paths: [entry.path]
      });
      continue;
    }
    const currentHash = await hashFile(targetPath);
    if (currentHash !== entry.targetHash) {
      conflicts.push({
        id: 'operator.gc.modified-obsolete-managed-file',
        message: `${entry.path} has local edits and will not be removed.`,
        paths: [entry.path]
      });
      continue;
    }
    operations.push({
      id: 'operator.gc.remove-obsolete-managed-file',
      action: 'remove',
      message: `Remove obsolete managed file ${entry.path}.`,
      paths: [entry.path]
    });
    removedPaths.push(entry.path);
  }

  let applied = false;
  if (apply && removedPaths.length > 0) {
    for (const relativePath of removedPaths) {
      const targetPath = safeJoin(resolvedTarget, relativePath);
      if (!targetPath) continue;
      await rm(targetPath, { force: true });
      await removeEmptyParents(path.dirname(targetPath), playbook.absolutePath);
    }
    const updatedManifest = {
      ...manifestResult.manifest,
      updatedAtUtc: new Date().toISOString(),
      files: files.filter((entry) => !removedPaths.includes(entry.path))
    };
    await writeFile(manifestResult.path, `${JSON.stringify(updatedManifest, null, 2)}\n`);
    applied = true;
  }

  return operatorGcResult({ target: resolvedTarget, apply, applied, operations, warnings, conflicts });
}

function legacyPlaybookDirs(target) {
  return LEGACY_PLAYBOOK_DIRS.filter((directory) => existsSync(path.join(target, directory)));
}
