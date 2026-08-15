import { readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  AGENTS_LINK_END,
  AGENTS_LINK_START,
  DEFAULT_PLAYBOOK_DIR,
  LEGACY_PLAYBOOK_DIRS,
  SCHEMA_VERSION,
  applyGitignoreMigration,
  assertProtectedFileUnchanged,
  assertDirectory,
  captureProtectedFileSnapshot,
  copyTree,
  ensureGitignoreEntry,
  gitignoreMigrationPlan,
  hashContent,
  planAgentsLink,
  playbookReferenceUpdatePlan,
  readManagedManifest,
  replaceLegacyPlaybookRefs,
  resolvePlaybookLayout,
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
    force = false,
    preserveAgents = false,
    linkAgents = false,
    replaceAgents = false,
    beforeApply
  } = options;

  await assertDirectory(target, 'Target repository does not exist');

  const operations = [];
  const warnings = [];
  const conflicts = [];
  const nextSteps = [];
  const templateRoot = path.join(repoRoot, 'templates');
  const playbookSource = path.join(templateRoot, 'project-playbook');
  const playbookTarget = path.join(target, DEFAULT_PLAYBOOK_DIR);
  const rootAgent = path.join(templateRoot, 'agents', 'global', 'AGENTS.md');
  const targetAgent = path.join(target, 'AGENTS.md');
  const targetGitignore = path.join(target, '.gitignore');
  let agentSnapshot;
  let gitignoreSnapshot;
  try {
    agentSnapshot = await captureProtectedFileSnapshot(targetAgent, 'AGENTS.md');
    gitignoreSnapshot = await captureProtectedFileSnapshot(targetGitignore, '.gitignore');
  } catch (error) {
    return bootstrapResult({ target, ok: false, agentsMode: null, operations, warnings, conflicts: [error.message], nextSteps });
  }
  const explicitModes = [preserveAgents, linkAgents, replaceAgents].filter(Boolean).length;

  if (explicitModes > 1) {
    conflicts.push('Choose only one of --preserve-agents, --link-agents, or --replace-agents.');
  }
  if (replaceAgents && !force) {
    conflicts.push('--replace-agents requires --force.');
  }
  if (agentSnapshot.exists && profile) {
    conflicts.push('Existing AGENTS.md cannot be combined with --profile automatically; integrate the profile manually.');
  }
  if (agentSnapshot.exists && explicitModes === 0) {
    conflicts.push('Existing AGENTS.md requires an explicit preservation mode; --force alone never replaces it.');
    nextSteps.push(
      `aapb bootstrap "${target}"${localOnly ? ' --local-only' : ''} --preserve-agents`,
      `aapb bootstrap "${target}"${localOnly ? ' --local-only' : ''} --link-agents`,
      `aapb bootstrap "${target}"${localOnly ? ' --local-only' : ''} --replace-agents --force`
    );
  }

  let agentContent = await readFile(rootAgent, 'utf8');
  if (profile) {
    const profileFile = path.join(templateRoot, 'agents', 'profiles', profile, 'AGENTS.md');
    if (!existsSync(profileFile)) {
      throw new Error(`Unknown profile: ${profile}`);
    }
    const profileContent = await readFile(profileFile, 'utf8');
    agentContent = `${agentContent.trimEnd()}\n\n---\n\n# Profile: ${profile}\n\n${profileContent.trimStart()}`;
  }

  let agentsMode = agentSnapshot.exists ? 'preserved' : 'generated';
  let linkedPlan = null;
  let agentEntry = null;
  const preflight = { dryRun: true, force, operations, conflicts };
  await copyTree(playbookSource, playbookTarget, preflight);
  if (preserveAgents) {
    operations.push(`${agentSnapshot.exists ? 'preserve' : 'leave absent'} AGENTS.md`);
    agentsMode = 'preserved';
  } else if (linkAgents && agentSnapshot.exists) {
    linkedPlan = planAgentsLink(agentSnapshot.content);
    if (!linkedPlan.ok) {
      conflicts.push(linkedPlan.conflict);
    } else if (linkedPlan.alreadyLinked) {
      operations.push('keep AGENTS.md existing playbook reading order');
      warnings.push('AGENTS.md already references the full playbook reading order; no managed link block will be added.');
      agentsMode = 'preserved';
    } else {
      const existingManifest = await readManagedManifest(target, resolvePlaybookLayout(target));
      const existingBlock = existingManifest.ok
        ? existingManifest.manifest.files.find((file) => file.path === 'AGENTS.md' && file.ownership === 'block')
        : null;
      if (existingBlock) {
        linkedPlan.leadingSeparator = existingBlock.leadingSeparator ?? '';
        linkedPlan.trailingSeparator = existingBlock.trailingSeparator ?? '';
      }
      operations.push(`${linkedPlan.changed ? 'update' : 'keep'} AGENTS.md managed link block`);
      agentsMode = 'linked';
      agentEntry = {
        path: 'AGENTS.md',
        kind: 'bootstrap',
        source: 'templates/agents/global/AGENTS.md',
        sourceHash: hashContent(linkedPlan.block),
        targetHash: hashContent(linkedPlan.block),
        ownership: 'block',
        startMarker: AGENTS_LINK_START,
        endMarker: AGENTS_LINK_END,
        leadingSeparator: linkedPlan.leadingSeparator,
        trailingSeparator: linkedPlan.trailingSeparator
      };
    }
  } else {
    const mayReplace = !agentSnapshot.exists || (replaceAgents && force);
    if (mayReplace) {
      await writeManagedFile(targetAgent, agentContent, { ...preflight, force: true });
      agentsMode = agentSnapshot.exists ? 'replaced' : 'generated';
    }
  }
  if (localOnly) {
    await ensureGitignoreEntry(target, `${DEFAULT_PLAYBOOK_DIR}/`, preflight);
  }

  if (dryRun || conflicts.length > 0) {
    return bootstrapResult({ target, ok: conflicts.length === 0, agentsMode, operations, warnings, conflicts, nextSteps, agentSnapshot });
  }

  if (beforeApply) await beforeApply();
  try {
    await assertProtectedFileUnchanged(targetAgent, agentSnapshot, 'AGENTS.md');
    await assertProtectedFileUnchanged(targetGitignore, gitignoreSnapshot, '.gitignore');
  } catch (error) {
    conflicts.push(error.message);
    return bootstrapResult({ target, ok: false, agentsMode, operations, warnings, conflicts, nextSteps, agentSnapshot });
  }

  operations.length = 0;
  conflicts.length = 0;
  await copyTree(playbookSource, playbookTarget, { dryRun: false, force, operations, conflicts });
  if (agentsMode === 'generated' || agentsMode === 'replaced') {
    await writeManagedFile(targetAgent, agentContent, { dryRun: false, force: true, operations, conflicts });
  } else if (agentsMode === 'linked' && linkedPlan?.changed) {
    operations.push('update AGENTS.md managed link block');
    await writeFile(targetAgent, linkedPlan.content);
  } else {
    operations.push(`${agentSnapshot.exists ? 'preserve' : 'leave absent'} AGENTS.md`);
  }

  if (localOnly) {
    await ensureGitignoreEntry(target, `${DEFAULT_PLAYBOOK_DIR}/`, { dryRun: false, operations });
  }
  await writeBootstrapManifest({
    repoRoot,
    target,
    agentContent,
    localOnly,
    profile,
    agentsMode,
    agentEntry
  });

  return bootstrapResult({ target, ok: conflicts.length === 0, applied: conflicts.length === 0, agentsMode, operations, warnings, conflicts, nextSteps, agentSnapshot });
}

function bootstrapResult(options) {
  const {
    target,
    ok,
    applied = false,
    agentsMode,
    operations,
    warnings,
    conflicts,
    nextSteps,
    agentSnapshot = null
  } = options;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok,
    target: path.resolve(target),
    applied,
    agentsMode,
    summary: {
      operations: operations.length,
      preserved: agentsMode === 'preserved' && agentSnapshot?.exists ? 1 : 0,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    preservedFiles: agentsMode === 'preserved' && agentSnapshot?.exists ? ['AGENTS.md'] : [],
    warnings,
    conflicts,
    nextSteps
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
