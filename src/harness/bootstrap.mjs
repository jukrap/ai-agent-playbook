import { readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_PLAYBOOK_DIR,
  LEGACY_PLAYBOOK_DIRS,
  SCHEMA_VERSION,
  applyGitignoreMigration,
  assertDirectory,
  copyTree,
  ensureGitignoreEntry,
  gitignoreMigrationPlan,
  playbookReferenceUpdatePlan,
  replaceLegacyPlaybookRefs,
  toPortablePath,
  writeBootstrapManifest,
  writeManagedFile
} from './core.mjs';

export async function bootstrapProject(options) {
  const {
    repoRoot,
    target,
    profile,
    localOnly = false,
    dryRun = false,
    force = false
  } = options;

  await assertDirectory(target, 'Target repository does not exist');

  const operations = [];
  const conflicts = [];
  const templateRoot = path.join(repoRoot, 'templates');
  const playbookSource = path.join(templateRoot, 'project-playbook');
  const playbookTarget = path.join(target, DEFAULT_PLAYBOOK_DIR);
  const rootAgent = path.join(templateRoot, 'agents', 'global', 'AGENTS.md');

  let agentContent = await readFile(rootAgent, 'utf8');
  if (profile) {
    const profileFile = path.join(templateRoot, 'agents', 'profiles', profile, 'AGENTS.md');
    if (!existsSync(profileFile)) {
      throw new Error(`Unknown profile: ${profile}`);
    }
    const profileContent = await readFile(profileFile, 'utf8');
    agentContent = `${agentContent.trimEnd()}\n\n---\n\n# Profile: ${profile}\n\n${profileContent.trimStart()}`;
  }

  const preflight = { dryRun: true, force, operations, conflicts };
  await copyTree(playbookSource, playbookTarget, preflight);
  await writeManagedFile(path.join(target, 'AGENTS.md'), agentContent, preflight);
  if (localOnly) {
    await ensureGitignoreEntry(target, `${DEFAULT_PLAYBOOK_DIR}/`, preflight);
  }

  if (dryRun || conflicts.length > 0) {
    return {
      ok: conflicts.length === 0,
      operations,
      conflicts
    };
  }

  operations.length = 0;
  conflicts.length = 0;
  await copyTree(playbookSource, playbookTarget, { dryRun: false, force, operations, conflicts });
  await writeManagedFile(path.join(target, 'AGENTS.md'), agentContent, { dryRun: false, force, operations, conflicts });

  if (localOnly) {
    await ensureGitignoreEntry(target, `${DEFAULT_PLAYBOOK_DIR}/`, { dryRun: false, operations });
  }
  await writeBootstrapManifest({
    repoRoot,
    target,
    agentContent,
    localOnly,
    profile
  });

  return {
    ok: conflicts.length === 0,
    operations,
    conflicts
  };
}

export async function migratePlaybookPath(options) {
  const { target, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const activeRoot = path.join(resolvedTarget, DEFAULT_PLAYBOOK_DIR);
  const legacySources = LEGACY_PLAYBOOK_DIRS
    .map((directory) => ({ directory, root: path.join(resolvedTarget, directory), exists: existsSync(path.join(resolvedTarget, directory)) }))
    .filter((source) => source.exists);
  const hasActive = existsSync(activeRoot);
  const selectedLegacy = legacySources[0] ?? null;
  const operations = [];
  const warnings = [];
  const conflicts = [];

  if (hasActive && legacySources.length > 0) {
    conflicts.push({
      id: 'playbook.destination-exists',
      message: `${DEFAULT_PLAYBOOK_DIR}/ already exists beside legacy playbook path(s); review and merge manually.`,
      paths: [`${DEFAULT_PLAYBOOK_DIR}/`, ...legacySources.map((source) => `${source.directory}/`)]
    });
  } else if (!hasActive && legacySources.length > 1) {
    conflicts.push({
      id: 'playbook.multiple-legacy-sources',
      message: `Multiple legacy playbook paths exist; choose one before migrating to ${DEFAULT_PLAYBOOK_DIR}/.`,
      paths: legacySources.map((source) => `${source.directory}/`)
    });
  } else if (!hasActive && legacySources.length === 0) {
    conflicts.push({
      id: 'playbook.source-missing',
      message: `Missing legacy playbook source paths and ${DEFAULT_PLAYBOOK_DIR}/; run bootstrap or inspect the target first.`,
      paths: [...LEGACY_PLAYBOOK_DIRS.map((directory) => `${directory}/`), `${DEFAULT_PLAYBOOK_DIR}/`]
    });
  } else if (hasActive) {
    warnings.push({
      id: 'playbook.already-active-path',
      message: `${DEFAULT_PLAYBOOK_DIR}/ already exists; no path migration is needed.`,
      paths: [`${DEFAULT_PLAYBOOK_DIR}/`]
    });
  } else {
    operations.push({
      id: 'playbook.move',
      action: 'move',
      message: `Move ${selectedLegacy.directory}/ to ${DEFAULT_PLAYBOOK_DIR}/.`,
      paths: [`${selectedLegacy.directory}/`, `${DEFAULT_PLAYBOOK_DIR}/`]
    });
  }

  const referencePlanRoot = hasActive ? activeRoot : selectedLegacy?.root;
  const referencePlan = referencePlanRoot && existsSync(referencePlanRoot)
    ? await playbookReferenceUpdatePlan(resolvedTarget, referencePlanRoot)
    : [];
  if (referencePlan.length > 0) {
    operations.push({
      id: 'references.update',
      action: 'replace',
      message: `Update ${referencePlan.length} file(s) from legacy playbook references to ${DEFAULT_PLAYBOOK_DIR}/.`,
      paths: referencePlan.map((item) => toPortablePath(path.relative(resolvedTarget, item.file)))
    });
  }

  const gitignorePlan = await gitignoreMigrationPlan(resolvedTarget);
  if (gitignorePlan) operations.push(gitignorePlan);

  const ok = conflicts.length === 0;
  let movedPlaybook = false;
  if (apply && ok) {
    if (selectedLegacy && !hasActive) {
      await rename(selectedLegacy.root, activeRoot);
      movedPlaybook = true;
    }
    for (const item of referencePlan) {
      const file = selectedLegacy && item.file.startsWith(selectedLegacy.root)
        ? path.join(activeRoot, path.relative(selectedLegacy.root, item.file))
        : item.file;
      await writeFile(file, replaceLegacyPlaybookRefs(await readFile(file, 'utf8')));
    }
    if (gitignorePlan) {
      await applyGitignoreMigration(resolvedTarget);
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok,
    target: resolvedTarget,
    applied: Boolean(apply && ok && (movedPlaybook || referencePlan.length > 0 || gitignorePlan)),
    summary: {
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };
}
