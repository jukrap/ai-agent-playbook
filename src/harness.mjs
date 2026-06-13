import { mkdir, readdir, readFile, rename, rm, rmdir, stat, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const REQUIRED_PLAYBOOK_FILES = [
  'README.md',
  'START_HERE.md',
  'CURRENT.md',
  'SKILLS.md',
  'GIT.md',
  'questions.md',
  'maps/README.md',
  'runbooks/README.md',
  'plans/README.md',
  'worklogs/README.md',
  'worklogs/summaries/README.md'
];

export const SCHEMA_VERSION = '1';
export const DEFAULT_CONTEXT_MAX_CHARS = 12000;
export const DEFAULT_PLAYBOOK_DIR = '.ai-playbook';
export const LEGACY_PLAYBOOK_DIR = 'ai-playbook';
export const CONTEXT_SOURCE_FILES = [
  'START_HERE.md',
  'CURRENT.md',
  'SKILLS.md',
  'GIT.md'
];
export const GUIDE_MANIFEST_FILE = 'manifest.json';
export const INSTALL_MANIFEST_FILE = '.ai-agent-playbook-install.json';
export const INSTALL_SOURCE = 'ai-agent-playbook';

const OBSOLETE_STYLE_SKILLS = [
  'design-system-first',
  'css-class-first',
  'utility-class-first',
  'inline-style-first'
];

const ROOT_BOOTSTRAP_REFS = [
  'START_HERE.md',
  'CURRENT.md',
  'SKILLS.md',
  'GIT.md'
];

const CORE_TEMPLATE_MARKERS = [
  {
    file: 'START_HERE.md',
    markers: [
      '- State the active task in one or two bullets.',
      '# Replace with the next useful command for this project.',
      '- Local-only policy:'
    ]
  },
  {
    file: 'CURRENT.md',
    markers: [
      '- Product or system shape:',
      '- Primary stack:',
      '- Verification commands:'
    ]
  },
  {
    file: 'questions.md',
    markers: [
      '| Open |  |  |  |  |'
    ]
  }
];

export function slugifyTitle(title) {
  const slug = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'note';
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function parseMaxChars(value, optionName = '--max-chars') {
  if (value === undefined || value === false) return DEFAULT_CONTEXT_MAX_CHARS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 500) {
    throw new Error(`Invalid ${optionName}; expected an integer >= 500.`);
  }
  return parsed;
}

export function resolvePlaybookLayout(target) {
  const defaultRoot = path.join(target, DEFAULT_PLAYBOOK_DIR);
  const legacyRoot = path.join(target, LEGACY_PLAYBOOK_DIR);
  const dir = existsSync(defaultRoot)
    ? DEFAULT_PLAYBOOK_DIR
    : existsSync(legacyRoot)
      ? LEGACY_PLAYBOOK_DIR
      : DEFAULT_PLAYBOOK_DIR;
  return {
    dir,
    root: path.join(target, dir),
    relativeRoot: `${dir}/`
  };
}

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
  const legacyRoot = path.join(resolvedTarget, LEGACY_PLAYBOOK_DIR);
  const dotRoot = path.join(resolvedTarget, DEFAULT_PLAYBOOK_DIR);
  const hasLegacy = existsSync(legacyRoot);
  const hasDot = existsSync(dotRoot);
  const operations = [];
  const warnings = [];
  const conflicts = [];

  if (hasDot && hasLegacy) {
    conflicts.push({
      id: 'playbook.destination-exists',
      message: `Both ${DEFAULT_PLAYBOOK_DIR}/ and ${LEGACY_PLAYBOOK_DIR}/ exist; review and merge manually.`,
      paths: [`${DEFAULT_PLAYBOOK_DIR}/`, `${LEGACY_PLAYBOOK_DIR}/`]
    });
  } else if (!hasLegacy && !hasDot) {
    conflicts.push({
      id: 'playbook.source-missing',
      message: `Missing ${LEGACY_PLAYBOOK_DIR}/ and ${DEFAULT_PLAYBOOK_DIR}/; run bootstrap or inspect the target first.`,
      paths: [`${LEGACY_PLAYBOOK_DIR}/`, `${DEFAULT_PLAYBOOK_DIR}/`]
    });
  } else if (hasDot) {
    warnings.push({
      id: 'playbook.already-dot-path',
      message: `${DEFAULT_PLAYBOOK_DIR}/ already exists; no path migration is needed.`,
      paths: [`${DEFAULT_PLAYBOOK_DIR}/`]
    });
  } else {
    operations.push({
      id: 'playbook.move',
      action: 'move',
      message: `Move ${LEGACY_PLAYBOOK_DIR}/ to ${DEFAULT_PLAYBOOK_DIR}/.`,
      paths: [`${LEGACY_PLAYBOOK_DIR}/`, `${DEFAULT_PLAYBOOK_DIR}/`]
    });
  }

  const referencePlanRoot = hasDot ? dotRoot : legacyRoot;
  const referencePlan = existsSync(referencePlanRoot)
    ? await playbookReferenceUpdatePlan(resolvedTarget, referencePlanRoot)
    : [];
  if (referencePlan.length > 0) {
    operations.push({
      id: 'references.update',
      action: 'replace',
      message: `Update ${referencePlan.length} file(s) from ${LEGACY_PLAYBOOK_DIR}/ references to ${DEFAULT_PLAYBOOK_DIR}/.`,
      paths: referencePlan.map((item) => toPortablePath(path.relative(resolvedTarget, item.file)))
    });
  }

  const gitignorePlan = await gitignoreMigrationPlan(resolvedTarget);
  if (gitignorePlan) operations.push(gitignorePlan);

  const ok = conflicts.length === 0;
  let movedPlaybook = false;
  if (apply && ok) {
    if (hasLegacy && !hasDot) {
      await rename(legacyRoot, dotRoot);
      movedPlaybook = true;
    }
    for (const item of referencePlan) {
      const file = item.file.startsWith(legacyRoot)
        ? path.join(dotRoot, path.relative(legacyRoot, item.file))
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

export async function doctorProject(options) {
  const { target, strict = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const checks = [];
  const playbook = resolvePlaybookLayout(target);
  const playbookRoot = playbook.root;
  const hasPlaybook = existsSync(playbookRoot);
  checks.push(result(
    hasPlaybook ? 'pass' : 'fail',
    'playbook.directory',
    'setup',
    `${playbook.dir} directory`,
    hasPlaybook ? `Found ${playbook.relativeRoot}.` : `Missing ${playbook.relativeRoot}.`,
    [playbook.relativeRoot]
  ));

  for (const file of REQUIRED_PLAYBOOK_FILES) {
    const ok = existsSync(path.join(playbookRoot, file));
    checks.push(result(
      ok ? 'pass' : 'fail',
      checkIdForPlaybookFile(file),
      'setup',
      `${playbook.relativeRoot}${file}`,
      ok ? 'Found.' : 'Missing.',
      [`${playbook.relativeRoot}${toPortablePath(file)}`]
    ));
  }

  const agentsFile = path.join(target, 'AGENTS.md');
  const hasAgents = existsSync(agentsFile);
  checks.push(result(
    hasAgents ? 'pass' : 'warn',
    'root-agents.exists',
    'bootstrap',
    'root AGENTS.md',
    hasAgents ? 'Found.' : 'Missing root agent policy.',
    ['AGENTS.md']
  ));
  if (hasAgents) {
    const agentsText = await readFile(agentsFile, 'utf8');
    const pointsToPlaybook = agentsText.includes(playbook.relativeRoot);
    checks.push(result(
      pointsToPlaybook ? 'pass' : 'warn',
      'root-agents.points-to-playbook',
      'bootstrap',
      'root AGENTS bootstrap',
      pointsToPlaybook ? `Points to ${playbook.relativeRoot}.` : `Found, but does not point agents to ${playbook.relativeRoot}.`,
      ['AGENTS.md']
    ));
    const expectedRefs = ROOT_BOOTSTRAP_REFS.map((ref) => `${playbook.relativeRoot}${ref}`);
    const missingRefs = expectedRefs.filter((ref) => !agentsText.includes(ref));
    checks.push(result(
      missingRefs.length ? 'warn' : 'pass',
      'root-agents.reading-order',
      'bootstrap',
      'root AGENTS reading order',
      missingRefs.length ? `Missing explicit references: ${missingRefs.join(', ')}` : `References core ${playbook.relativeRoot} files.`,
      ['AGENTS.md', ...missingRefs]
    ));
  }

  const rootPolicyFiles = ['SKILLS.md', 'GIT.md'].filter((file) => existsSync(path.join(target, file)));
  checks.push(result(
    rootPolicyFiles.length ? 'warn' : 'pass',
    'root-policy-files',
    'policy',
    'root policy files',
    rootPolicyFiles.length ? `Prefer ${playbook.relativeRoot}SKILLS.md and ${playbook.relativeRoot}GIT.md; root files found: ${rootPolicyFiles.join(', ')}` : 'No root SKILLS.md or GIT.md.',
    rootPolicyFiles
  ));

  const gitignore = path.join(target, '.gitignore');
  const gitignoreText = existsSync(gitignore) ? await readFile(gitignore, 'utf8') : '';
  const ignoresPlaybook = gitignoreText.split(/\r?\n/).some((line) => line.trim() === playbook.relativeRoot);
  checks.push(result(
    ignoresPlaybook ? 'pass' : 'warn',
    'playbook.commit-policy',
    'policy',
    `${playbook.relativeRoot} commit policy`,
    ignoresPlaybook ? 'Marked local-only in .gitignore.' : 'Not marked local-only; treat as committed project docs.',
    ['.gitignore', playbook.relativeRoot]
  ));

  if (hasPlaybook) {
    const templateFiles = await findCoreTemplateFiles(playbookRoot);
    checks.push(result(
      templateFiles.length ? 'warn' : 'pass',
      'playbook.adaptation',
      'adaptation',
      'playbook adaptation',
      templateFiles.length ? `Template prompts remain in: ${templateFiles.join(', ')}` : 'Core playbook files look adapted.',
      templateFiles.map((file) => `${playbook.relativeRoot}${toPortablePath(file)}`)
    ));
    checks.push(...await worklogSummaryFreshnessChecks(playbookRoot, playbook.dir));
  }

  const markdownFiles = await walkFiles(target, (file) => file.endsWith('.md'));
  const privatePaths = [];
  const obsoleteSkillRefs = [];
  for (const file of markdownFiles) {
    const text = await readFile(file, 'utf8');
    const rel = toPortablePath(path.relative(target, file));
    if (/[A-Za-z]:\\/.test(text)) privatePaths.push(rel);
    for (const skill of OBSOLETE_STYLE_SKILLS) {
      if (text.includes(skill)) obsoleteSkillRefs.push(`${rel} -> ${skill}`);
    }
  }

  checks.push(result(
    privatePaths.length ? 'fail' : 'pass',
    'public-safety.absolute-local-paths',
    'safety',
    'absolute local paths',
    privatePaths.length ? privatePaths.join(', ') : 'None found.',
    privatePaths
  ));
  checks.push(result(
    obsoleteSkillRefs.length ? 'warn' : 'pass',
    'skills.obsolete-style-references',
    'skills',
    'obsolete style skill references',
    obsoleteSkillRefs.length ? obsoleteSkillRefs.join(', ') : 'None found.',
    obsoleteSkillRefs.map((item) => item.split(' -> ')[0])
  ));

  const hasFailure = checks.some((check) => check.level === 'fail');
  const hasWarning = checks.some((check) => check.level === 'warn');
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: strict ? !hasFailure && !hasWarning : !hasFailure,
    target: path.resolve(target),
    strict,
    summary: summarizeChecks(checks),
    checks
  };
}

export async function buildDoctorReminderSignal(options) {
  const { repoRoot, target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(target);
  const playbookRoot = playbook.root;
  const reminders = [];

  if (!existsSync(playbookRoot)) {
    reminders.push(reminder(
      'reminder.playbook.missing',
      'warn',
      `${playbook.relativeRoot} is missing; run bootstrap or inspect the project playbook setup before relying on runtime reminders.`,
      [playbook.relativeRoot]
    ));
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: false,
      target: resolvedTarget,
      reminders
    };
  }

  const guideReport = await checkGuides({ repoRoot, target });
  const missingGuides = guideReport.guides.filter((guide) => guide.status === 'missing');
  if (missingGuides.length > 0) {
    reminders.push(reminder(
      'reminder.guides.missing',
      'warn',
      `Missing ${missingGuides.length} guide template(s); run guides sync after reviewing the target project.`,
      missingGuides.map((guide) => guide.path)
    ));
  }

  const staleGuides = guideReport.guides.filter((guide) => guide.status === 'stale');
  if (staleGuides.length > 0) {
    reminders.push(reminder(
      'reminder.guides.stale',
      'warn',
      `Found ${staleGuides.length} stale guide template(s); review local edits before replacing them.`,
      staleGuides.map((guide) => guide.path)
    ));
  }

  const freshnessChecks = await worklogSummaryFreshnessChecks(playbookRoot, playbook.dir);
  for (const check of freshnessChecks.filter((item) => item.level === 'warn')) {
    reminders.push(reminder(
      `reminder.${check.id}`,
      check.level,
      check.message,
      check.paths
    ));
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: reminders.length === 0,
    target: resolvedTarget,
    reminders
  };
}

export async function checkGuides(options) {
  const { repoRoot, target, includeDiff = false } = options;

  await assertDirectory(target, 'Target repository does not exist');

  const source = path.join(repoRoot, 'templates', 'project-playbook', 'guides');
  const playbook = resolvePlaybookLayout(target);
  const destination = path.join(playbook.root, 'guides');
  const sourceGuides = await loadGuideManifest(source);
  const guides = [];
  for (const guide of sourceGuides) {
    const rel = toPortablePath(guide.path);
    const destinationFile = path.join(destination, ...rel.split('/'));
    const sourceHash = guide.sourceHash ?? await hashFile(path.join(source, ...rel.split('/')));
    if (!existsSync(destinationFile)) {
      guides.push({
        path: `${playbook.relativeRoot}guides/${rel}`,
        status: 'missing',
        sourceHash
      });
      continue;
    }
    const targetHash = await hashFile(destinationFile);
    const entry = {
      path: `${playbook.relativeRoot}guides/${rel}`,
      status: targetHash === sourceHash ? 'present' : 'stale',
      sourceHash,
      targetHash
    };
    if (includeDiff && entry.status === 'stale') {
      entry.diff = await guideDiff(path.join(source, ...rel.split('/')), destinationFile);
    }
    guides.push(entry);
  }
  guides.sort((left, right) => left.path.localeCompare(right.path));
  const summary = {
    total: guides.length,
    present: guides.filter((guide) => guide.status === 'present').length,
    missing: guides.filter((guide) => guide.status === 'missing').length,
    stale: guides.filter((guide) => guide.status === 'stale').length
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.missing === 0,
    target: path.resolve(target),
    summary,
    guides
  };
}

export async function buildProjectContext(options) {
  const { target, maxChars = DEFAULT_CONTEXT_MAX_CHARS } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const playbook = resolvePlaybookLayout(target);
  const playbookRoot = playbook.root;
  const warnings = [];
  const sources = [];
  const sections = [];
  if (!existsSync(playbookRoot)) {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: false,
      target: path.resolve(target),
      sources,
      additionalContext: '',
      warnings: [contextWarning('context.missing-playbook', `Missing ${playbook.relativeRoot}.`, [playbook.relativeRoot])]
    };
  }

  for (const file of CONTEXT_SOURCE_FILES) {
    const fullPath = path.join(playbookRoot, file);
    const sourcePath = `${playbook.relativeRoot}${file}`;
    if (!existsSync(fullPath)) {
      warnings.push(contextWarning('context.missing-source', `Missing ${sourcePath}.`, [sourcePath]));
      continue;
    }
    const content = (await readFile(fullPath, 'utf8')).trim();
    sources.push({ path: sourcePath, bytes: content.length });
    if (content) {
      sections.push(`## ${sourcePath}\n\n${content}`);
    }
  }

  if (sections.length === 0) {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: false,
      target: path.resolve(target),
      sources,
      additionalContext: '',
      warnings: [
        ...warnings,
        contextWarning('context.empty', 'No non-empty context source files found.')
      ]
    };
  }

  const rawContext = `<ai-playbook-context>\n${sections.join('\n\n---\n\n')}\n</ai-playbook-context>`;
  const { text, truncated } = truncateText(rawContext, maxChars);
  if (truncated) {
    warnings.push(contextWarning('context.truncated', `Context was truncated to ${maxChars} characters.`));
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: path.resolve(target),
    sources,
    additionalContext: text,
    warnings
  };
}

export async function syncGuides(options) {
  const {
    repoRoot,
    target,
    dryRun = false,
    force = false
  } = options;

  await assertDirectory(target, 'Target repository does not exist');

  const operations = [];
  const conflicts = [];
  const source = path.join(repoRoot, 'templates', 'project-playbook', 'guides');
  const destination = path.join(resolvePlaybookLayout(target).root, 'guides');
  await copyTree(source, destination, {
    dryRun,
    force,
    skipExisting: !force,
    operations,
    conflicts
  });
  if (!dryRun && conflicts.length === 0) {
    await updateGuideManifestEntries({ repoRoot, target });
  }

  return {
    ok: conflicts.length === 0,
    operations,
    conflicts
  };
}

export async function checkManagedManifest(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const manifestRelativePath = `${playbook.dir}/${INSTALL_MANIFEST_FILE}`;
  const manifestPath = path.join(playbook.root, INSTALL_MANIFEST_FILE);
  const base = {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    target: resolvedTarget,
    manifestPath: manifestRelativePath,
    summary: { total: 0, present: 0, modified: 0, missing: 0 },
    files: [],
    warnings: [],
    conflicts: []
  };

  const manifestResult = await readManagedManifest(resolvedTarget, playbook);
  if (!manifestResult.ok) {
    base.conflicts.push(manifestResult.conflict);
    return base;
  }

  const files = await managedFileStatuses(resolvedTarget, manifestResult.manifest.files);
  const summary = summarizeManagedFiles(files);
  const conflicts = files
    .filter((file) => file.status === 'modified' || file.status === 'missing')
    .map((file) => ({
      id: file.status === 'modified' ? 'managed.file.modified' : 'managed.file.missing',
      message: `${file.path} is ${file.status}.`,
      paths: [file.path]
    }));

  return {
    ...base,
    ok: conflicts.length === 0,
    summary,
    files,
    warnings: [],
    conflicts
  };
}

export async function adoptManagedManifest(options) {
  const { repoRoot, target, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const candidates = await matchingManifestCandidates({ repoRoot, target: resolvedTarget, playbook });
  const localOnly = await hasGitignoreEntry(resolvedTarget, `${playbook.dir}/`);
  const operations = candidates.map((file) => ({
    id: 'managed.adopt-file',
    action: 'adopt',
    message: `Adopt ${file.path}.`,
    paths: [file.path]
  }));
  operations.push({
    id: 'managed.write-manifest',
    action: 'write-manifest',
    message: `Write ${playbook.dir}/${INSTALL_MANIFEST_FILE}.`,
    paths: [`${playbook.dir}/${INSTALL_MANIFEST_FILE}`]
  });

  if (apply) {
    await writeManagedManifest(resolvedTarget, playbook, {
      localOnly,
      files: candidates,
      installedAtUtc: new Date().toISOString()
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    applied: Boolean(apply),
    summary: {
      adopted: candidates.length,
      operations: operations.length,
      warnings: 0,
      conflicts: 0
    },
    operations,
    warnings: [],
    conflicts: []
  };
}

export async function uninstallManagedManifest(options) {
  const { target, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const manifestResult = await readManagedManifest(resolvedTarget, playbook);
  const warnings = [];
  const operations = [];
  if (!manifestResult.ok) {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: false,
      target: resolvedTarget,
      applied: false,
      summary: { removable: 0, conflicts: 1, warnings: 0 },
      operations,
      warnings,
      conflicts: [manifestResult.conflict]
    };
  }

  const files = await managedFileStatuses(resolvedTarget, manifestResult.manifest.files);
  const removable = files.filter((file) => file.status === 'present');
  const conflicts = files
    .filter((file) => file.status === 'modified')
    .map((file) => ({
      id: 'managed.file.modified',
      message: `${file.path} has local edits and will not be removed.`,
      paths: [file.path]
    }));

  for (const file of removable) {
    operations.push({
      id: 'managed.remove-file',
      action: 'remove',
      message: `Remove ${file.path}.`,
      paths: [file.path]
    });
  }
  if (manifestResult.manifest.localOnly) {
    warnings.push({
      id: 'managed.gitignore.manual-cleanup',
      message: `Review .gitignore manually for the ${playbook.dir}/ local-only entry.`,
      paths: ['.gitignore', `${playbook.dir}/`]
    });
  }

  if (apply) {
    for (const file of removable) {
      await rm(path.join(resolvedTarget, ...file.path.split('/')), { force: true });
    }
    if (conflicts.length === 0) {
      await rm(path.join(playbook.root, INSTALL_MANIFEST_FILE), { force: true });
    }
    await removeEmptyManagedDirectories(resolvedTarget, playbook.root, removable.map((file) => file.path));
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    applied: Boolean(apply && removable.length > 0),
    summary: {
      removable: removable.length,
      conflicts: conflicts.length,
      warnings: warnings.length
    },
    operations,
    warnings,
    conflicts
  };
}

export async function createPlan(options) {
  const { target, title, date = todayIso(), dryRun = false, force = false } = options;
  requireTitle(title);
  const file = path.join(resolvePlaybookLayout(target).root, 'plans', `${date}-${slugifyTitle(title)}.md`);
  const content = `# ${title}\n\nStatus: active\nDate: ${date}\n\n## Goal\n\nDescribe the outcome this plan should produce.\n\n## Approach\n\nRecord the chosen implementation path and important constraints.\n\n## Steps\n\n- [ ] First implementation slice.\n- [ ] Verification and cleanup.\n\n## Verification\n\n- Record commands or manual checks here after they are known.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

export async function createWorklog(options) {
  const { target, title, date = todayIso(), dryRun = false, force = false } = options;
  requireTitle(title);
  const month = date.slice(0, 7);
  const file = path.join(resolvePlaybookLayout(target).root, 'worklogs', month, `${date}-${slugifyTitle(title)}.md`);
  const content = `# ${title}\n\nDate: ${date}\n\n## Context\n\nExplain what prompted the work.\n\n## Decision Path\n\nRecord the reasoning, alternatives considered, and evidence.\n\n## Changes\n\nSummarize the important changes without reducing this to a file list.\n\n## Verification\n\nRecord only checks that were actually run.\n\n## Remaining Risk\n\nCapture follow-up risk or note none after verification.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

export async function summarizeWorklogs(options) {
  const { target, month, dryRun = false, force = false } = options;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Missing or invalid --month YYYY-MM.');
  }
  const playbook = resolvePlaybookLayout(target);
  const monthDir = path.join(playbook.root, 'worklogs', month);
  const files = existsSync(monthDir)
    ? (await readdir(monthDir, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort()
    : [];
  const file = path.join(playbook.root, 'worklogs', 'summaries', `${month}.md`);
  const lines = files.length
    ? files.map((name) => `- ${name}: summarize durable facts, decisions, verification, and follow-up risk.`)
    : ['- No worklog files found for this month yet.'];
  const content = `# ${month} Worklog Summary\n\n## Durable Facts\n\n- Promote still-current facts into CURRENT.md, maps, runbooks, or decisions.\n\n## Entries\n\n${lines.join('\n')}\n\n## Follow-up\n\n- Record unresolved risks or cleanup items.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

function result(level, id, category, name, message, paths = []) {
  return { id, level, category, name, message, paths };
}

function contextWarning(id, message, paths = []) {
  return { id, message, paths };
}

function reminder(id, level, message, paths = []) {
  return { id, level, message, paths };
}

function summarizeChecks(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.level === 'pass').length,
    warn: checks.filter((check) => check.level === 'warn').length,
    fail: checks.filter((check) => check.level === 'fail').length
  };
}

function checkIdForPlaybookFile(file) {
  return `playbook.file.${file.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}`;
}

function toPortablePath(value) {
  return value.split(path.sep).join('/');
}

function truncateText(text, maxChars) {
  if (text.length <= maxChars) return { text, truncated: false };
  const marker = '\n[ai-playbook context truncated]\n';
  const sliceLength = Math.max(0, maxChars - marker.length);
  return {
    text: `${text.slice(0, sliceLength).trimEnd()}${marker}`,
    truncated: true
  };
}

async function findCoreTemplateFiles(playbookRoot) {
  const files = [];
  for (const { file, markers } of CORE_TEMPLATE_MARKERS) {
    const fullPath = path.join(playbookRoot, file);
    if (!existsSync(fullPath)) continue;
    const text = await readFile(fullPath, 'utf8');
    if (markers.some((marker) => hasExactLine(text, marker))) {
      files.push(file);
    }
  }
  return files;
}

async function worklogSummaryFreshnessChecks(playbookRoot, playbookDir) {
  const checks = [];
  const worklogsRoot = path.join(playbookRoot, 'worklogs');
  const summariesRoot = path.join(worklogsRoot, 'summaries');
  if (!existsSync(worklogsRoot)) return checks;

  const entries = await readdir(worklogsRoot, { withFileTypes: true });
  const months = entries
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const month of months) {
    const monthDir = path.join(worklogsRoot, month);
    const worklogFiles = (await readdir(monthDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();
    if (worklogFiles.length === 0) continue;

    const summaryFile = path.join(summariesRoot, `${month}.md`);
    const monthPath = `${playbookDir}/worklogs/${month}/`;
    const summaryPath = `${playbookDir}/worklogs/summaries/${month}.md`;
    if (!existsSync(summaryFile)) {
      checks.push(result(
        'warn',
        `worklog-summary.missing.${month}`,
        'freshness',
        `${month} worklog summary`,
        `Worklog entries exist for ${month}, but the monthly summary is missing.`,
        [monthPath, summaryPath]
      ));
      continue;
    }

    const summaryInfo = await stat(summaryFile);
    const latestWorklog = await latestFileByModifiedTime(monthDir, worklogFiles);
    if (latestWorklog.info.mtimeMs > summaryInfo.mtimeMs) {
      checks.push(result(
        'warn',
        `worklog-summary.stale.${month}`,
        'freshness',
        `${month} worklog summary freshness`,
        `The ${month} summary is older than ${latestWorklog.name}.`,
        [`${playbookDir}/worklogs/${month}/${latestWorklog.name}`, summaryPath]
      ));
      continue;
    }

    checks.push(result(
      'pass',
      `worklog-summary.fresh.${month}`,
      'freshness',
      `${month} worklog summary freshness`,
      `The ${month} summary is newer than the detailed worklogs.`,
      [summaryPath, monthPath]
    ));
  }

  return checks;
}

async function latestFileByModifiedTime(directory, files) {
  const details = await Promise.all(files.map(async (name) => ({
    name,
    info: await stat(path.join(directory, name))
  })));
  details.sort((left, right) => right.info.mtimeMs - left.info.mtimeMs || left.name.localeCompare(right.name));
  return details[0];
}

function hasExactLine(text, marker) {
  return text.split(/\r?\n/).some((line) => line.trim() === marker);
}

async function assertDirectory(dir, message) {
  if (!existsSync(dir)) throw new Error(`${message}: ${dir}`);
  const info = await stat(dir);
  if (!info.isDirectory()) throw new Error(`Not a directory: ${dir}`);
}

async function copyTemplateFile(source, destination, context) {
  const content = await readFile(source, 'utf8');
  await writeManagedFile(destination, content, context);
}

async function copyTree(sourceRoot, destinationRoot, context) {
  const files = await walkFiles(sourceRoot, () => true);
  for (const source of files) {
    const rel = path.relative(sourceRoot, source);
    const destination = path.join(destinationRoot, rel);
    if (existsSync(destination) && !context.force) {
      if (context.skipExisting) {
        context.operations.push(`keep ${path.relative(path.dirname(destinationRoot), destination)}`);
        continue;
      }
      context.conflicts.push(path.relative(path.dirname(destinationRoot), destination));
      continue;
    }
    context.operations.push(`copy ${path.relative(sourceRoot, source)} -> ${path.relative(path.dirname(destinationRoot), destination)}`);
    if (!context.dryRun) {
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }
  }
}

async function writeManagedFile(destination, content, context) {
  if (existsSync(destination) && !context.force) {
    context.conflicts.push(path.basename(destination));
    return;
  }
  context.operations.push(`write ${path.basename(destination)}`);
  if (!context.dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
}

async function ensureGitignoreEntry(target, entry, context) {
  const file = path.join(target, '.gitignore');
  const existing = existsSync(file) ? await readFile(file, 'utf8') : '';
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(entry)) {
    context.operations.push(`keep .gitignore ${entry}`);
    return;
  }
  context.operations.push(`append .gitignore ${entry}`);
  if (!context.dryRun) {
    const prefix = existing && !existing.endsWith('\n') ? `${existing}\n` : existing;
    await writeFile(file, `${prefix}${entry}\n`);
  }
}

async function writeBootstrapManifest(options) {
  const { repoRoot, target, agentContent, localOnly, profile } = options;
  const playbook = resolvePlaybookLayout(target);
  const files = await sourceTemplateManifestEntries({
    repoRoot,
    target,
    playbook,
    includeOnlyExistingAndMatching: false
  });
  const agentHash = hashContent(agentContent);
  files.push({
    path: 'AGENTS.md',
    kind: 'bootstrap',
    source: profile
      ? `templates/agents/global/AGENTS.md+templates/agents/profiles/${profile}/AGENTS.md`
      : 'templates/agents/global/AGENTS.md',
    sourceHash: agentHash,
    targetHash: await hashFile(path.join(target, 'AGENTS.md'))
  });
  await writeManagedManifest(target, playbook, {
    localOnly,
    files,
    installedAtUtc: new Date().toISOString()
  });
}

async function updateGuideManifestEntries(options) {
  const { repoRoot, target } = options;
  const playbook = resolvePlaybookLayout(target);
  const existing = await readManagedManifest(target, playbook);
  const existingFiles = existing.ok ? existing.manifest.files : [];
  const guideEntries = await sourceGuideManifestEntries({ repoRoot, target, playbook });
  const merged = mergeManagedFiles(existingFiles, guideEntries);
  await writeManagedManifest(target, playbook, {
    localOnly: existing.ok ? Boolean(existing.manifest.localOnly) : await hasGitignoreEntry(target, `${playbook.dir}/`),
    files: merged,
    installedAtUtc: existing.ok ? existing.manifest.installedAtUtc : new Date().toISOString()
  });
}

async function writeManagedManifest(target, playbook, options) {
  const installedAtUtc = options.installedAtUtc ?? new Date().toISOString();
  const now = new Date().toISOString();
  const files = [...options.files].sort((left, right) => left.path.localeCompare(right.path));
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    source: INSTALL_SOURCE,
    playbookDir: playbook.dir,
    localOnly: Boolean(options.localOnly),
    installedAtUtc,
    updatedAtUtc: now,
    files
  };
  const manifestPath = path.join(playbook.root, INSTALL_MANIFEST_FILE);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function readManagedManifest(target, playbook = resolvePlaybookLayout(target)) {
  const manifestPath = path.join(playbook.root, INSTALL_MANIFEST_FILE);
  const relativePath = `${playbook.dir}/${INSTALL_MANIFEST_FILE}`;
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      conflict: {
        id: 'managed.manifest.missing',
        message: `Missing managed manifest ${relativePath}.`,
        paths: [relativePath]
      }
    };
  }
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    return {
      ok: false,
      conflict: {
        id: 'managed.manifest.malformed',
        message: `Could not parse ${relativePath}: ${error.message}`,
        paths: [relativePath]
      }
    };
  }
  const invalidReason = validateManagedManifest(manifest);
  if (invalidReason) {
    return {
      ok: false,
      conflict: {
        id: 'managed.manifest.invalid',
        message: `${relativePath} is invalid: ${invalidReason}`,
        paths: [relativePath]
      }
    };
  }
  return { ok: true, manifest };
}

function validateManagedManifest(manifest) {
  if (manifest?.schemaVersion !== SCHEMA_VERSION) return 'schemaVersion mismatch';
  if (manifest.source !== INSTALL_SOURCE) return 'source mismatch';
  if (typeof manifest.playbookDir !== 'string') return 'missing playbookDir';
  if (!Array.isArray(manifest.files)) return 'missing files';
  for (const file of manifest.files) {
    if (!file || typeof file.path !== 'string') return 'file entry missing path';
    if (path.isAbsolute(file.path) || file.path.includes('\\')) return `non-portable path ${file.path}`;
    if (typeof file.kind !== 'string' || typeof file.source !== 'string') return `invalid entry ${file.path}`;
    if (typeof file.sourceHash !== 'string' || typeof file.targetHash !== 'string') return `missing hashes for ${file.path}`;
  }
  return null;
}

async function managedFileStatuses(target, files) {
  const statuses = [];
  for (const file of files) {
    const fullPath = path.join(target, ...file.path.split('/'));
    if (!existsSync(fullPath)) {
      statuses.push({ ...file, status: 'missing' });
      continue;
    }
    const targetHash = await hashFile(fullPath);
    statuses.push({
      ...file,
      status: targetHash === file.targetHash ? 'present' : 'modified',
      currentHash: targetHash
    });
  }
  statuses.sort((left, right) => left.path.localeCompare(right.path));
  return statuses;
}

function summarizeManagedFiles(files) {
  return {
    total: files.length,
    present: files.filter((file) => file.status === 'present').length,
    modified: files.filter((file) => file.status === 'modified').length,
    missing: files.filter((file) => file.status === 'missing').length
  };
}

async function matchingManifestCandidates(options) {
  return sourceTemplateManifestEntries({
    ...options,
    includeOnlyExistingAndMatching: true
  });
}

async function sourceTemplateManifestEntries(options) {
  const { repoRoot, target, playbook, includeOnlyExistingAndMatching } = options;
  const sourceRoot = path.join(repoRoot, 'templates', 'project-playbook');
  const sourceFiles = await walkFiles(sourceRoot, (file) => file !== path.join(sourceRoot, INSTALL_MANIFEST_FILE));
  const entries = [];
  for (const sourceFile of sourceFiles) {
    const rel = toPortablePath(path.relative(sourceRoot, sourceFile));
    const targetPath = `${playbook.dir}/${rel}`;
    const targetFile = path.join(target, ...targetPath.split('/'));
    if (!existsSync(targetFile)) {
      if (includeOnlyExistingAndMatching) continue;
      continue;
    }
    const sourceHash = await hashFile(sourceFile);
    const targetHash = await hashFile(targetFile);
    if (includeOnlyExistingAndMatching && sourceHash !== targetHash) continue;
    entries.push({
      path: targetPath,
      kind: rel.startsWith('guides/') ? 'guide' : 'playbook',
      source: `templates/project-playbook/${rel}`,
      sourceHash,
      targetHash
    });
  }

  const rootAgent = path.join(repoRoot, 'templates', 'agents', 'global', 'AGENTS.md');
  const targetAgent = path.join(target, 'AGENTS.md');
  if (existsSync(targetAgent)) {
    const sourceHash = await hashFile(rootAgent);
    const targetHash = await hashFile(targetAgent);
    if (!includeOnlyExistingAndMatching || sourceHash === targetHash) {
      entries.push({
        path: 'AGENTS.md',
        kind: 'bootstrap',
        source: 'templates/agents/global/AGENTS.md',
        sourceHash,
        targetHash
      });
    }
  }

  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

async function sourceGuideManifestEntries(options) {
  const { repoRoot, target, playbook } = options;
  const sourceRoot = path.join(repoRoot, 'templates', 'project-playbook', 'guides');
  const sourceGuides = await loadGuideManifest(sourceRoot);
  const entries = [];
  for (const guide of sourceGuides) {
    const rel = toPortablePath(guide.path);
    const targetPath = `${playbook.dir}/guides/${rel}`;
    const targetFile = path.join(target, ...targetPath.split('/'));
    if (!existsSync(targetFile)) continue;
    entries.push({
      path: targetPath,
      kind: 'guide',
      source: `templates/project-playbook/guides/${rel}`,
      sourceHash: guide.sourceHash ?? await hashFile(path.join(sourceRoot, ...rel.split('/'))),
      targetHash: await hashFile(targetFile)
    });
  }
  return entries;
}

function mergeManagedFiles(existingFiles, updates) {
  const byPath = new Map(existingFiles.map((file) => [file.path, file]));
  for (const update of updates) {
    byPath.set(update.path, update);
  }
  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function hasGitignoreEntry(target, entry) {
  const file = path.join(target, '.gitignore');
  if (!existsSync(file)) return false;
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/).map((line) => line.trim());
  return lines.includes(entry);
}

async function removeEmptyManagedDirectories(target, playbookRoot, managedPaths) {
  const directories = [...new Set(managedPaths
    .map((managedPath) => path.dirname(path.join(target, ...managedPath.split('/'))))
    .filter((directory) => directory.startsWith(playbookRoot)))]
    .sort((left, right) => right.length - left.length);

  for (const directory of directories) {
    if (directory === target) continue;
    try {
      await rmdir(directory);
    } catch {
      // Non-empty directories are intentionally preserved.
    }
  }
  try {
    await rmdir(playbookRoot);
  } catch {
    // Keep playbook root when modified files, manifest, or user files remain.
  }
}

async function playbookReferenceUpdatePlan(target, playbookRoot) {
  const candidates = [];
  for (const rootFile of ['AGENTS.md']) {
    const file = path.join(target, rootFile);
    if (existsSync(file)) candidates.push(file);
  }
  candidates.push(...await walkFiles(playbookRoot, (file) => /\.(?:md|json)$/i.test(file)));

  const updates = [];
  for (const file of candidates) {
    const text = await readFile(file, 'utf8');
    const updated = replaceLegacyPlaybookRefs(text);
    if (updated !== text) {
      updates.push({ file });
    }
  }
  return updates;
}

function replaceLegacyPlaybookRefs(text) {
  return text.replace(/(^|[^.])ai-playbook\//g, '$1.ai-playbook/');
}

async function gitignoreMigrationPlan(target) {
  const file = path.join(target, '.gitignore');
  const existing = existsSync(file) ? await readFile(file, 'utf8') : '';
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(`${DEFAULT_PLAYBOOK_DIR}/`)) return null;
  if (!lines.includes(`${LEGACY_PLAYBOOK_DIR}/`)) return null;
  return {
    id: 'gitignore.add-dot-playbook',
    action: 'append',
    message: `Add ${DEFAULT_PLAYBOOK_DIR}/ to .gitignore because legacy ${LEGACY_PLAYBOOK_DIR}/ is already ignored.`,
    paths: ['.gitignore', `${DEFAULT_PLAYBOOK_DIR}/`, `${LEGACY_PLAYBOOK_DIR}/`]
  };
}

async function applyGitignoreMigration(target) {
  const file = path.join(target, '.gitignore');
  const existing = existsSync(file) ? await readFile(file, 'utf8') : '';
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(`${DEFAULT_PLAYBOOK_DIR}/`)) return;
  if (!lines.includes(`${LEGACY_PLAYBOOK_DIR}/`)) return;
  const prefix = existing && !existing.endsWith('\n') ? `${existing}\n` : existing;
  await writeFile(file, `${prefix}${DEFAULT_PLAYBOOK_DIR}/\n`);
}

async function guideDiff(sourceFile, targetFile) {
  const sourceLines = normalizedLines(await readFile(sourceFile, 'utf8'));
  const targetLines = normalizedLines(await readFile(targetFile, 'utf8'));
  const max = Math.max(sourceLines.length, targetLines.length);
  let firstDifferenceLine = max + 1;
  for (let index = 0; index < max; index += 1) {
    if ((sourceLines[index] ?? null) !== (targetLines[index] ?? null)) {
      firstDifferenceLine = index + 1;
      break;
    }
  }
  return {
    sourceLineCount: sourceLines.length,
    targetLineCount: targetLines.length,
    firstDifferenceLine,
    sourceLine: sourceLines[firstDifferenceLine - 1] ?? null,
    targetLine: targetLines[firstDifferenceLine - 1] ?? null
  };
}

function normalizedLines(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
  return normalized.length ? normalized.split('\n') : [];
}

async function loadGuideManifest(sourceRoot) {
  const manifestPath = path.join(sourceRoot, GUIDE_MANIFEST_FILE);
  if (!existsSync(manifestPath)) {
    return loadGuideManifestFallback(sourceRoot);
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(manifest.guides)) {
    throw new Error(`Invalid guide manifest: ${manifestPath}`);
  }

  return manifest.guides.map((guide) => {
    if (!guide || typeof guide.path !== 'string' || typeof guide.sourceHash !== 'string') {
      throw new Error(`Invalid guide manifest entry: ${manifestPath}`);
    }
    return {
      path: toPortablePath(guide.path),
      sourceHash: guide.sourceHash
    };
  });
}

async function loadGuideManifestFallback(sourceRoot) {
  const sourceFiles = await walkFiles(sourceRoot, (file) => file.endsWith('.md'));
  return Promise.all(sourceFiles.map(async (file) => ({
    path: toPortablePath(path.relative(sourceRoot, file)),
    sourceHash: await hashFile(file)
  })));
}

async function hashFile(file) {
  const content = await readFile(file);
  return createHash('sha256').update(content).digest('hex');
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function writeScaffold(file, content, options) {
  const operations = [];
  if (existsSync(file) && !options.force) {
    return { ok: false, file, operations, conflicts: [file] };
  }
  operations.push(`write ${file}`);
  if (!options.dryRun) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  return { ok: true, file, operations, conflicts: [] };
}

function requireTitle(title) {
  if (!title || !title.trim()) {
    throw new Error('Missing --title.');
  }
}

async function walkFiles(root, predicate) {
  const result = [];
  if (!existsSync(root)) return result;
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...await walkFiles(fullPath, predicate));
    } else if (entry.isFile() && predicate(fullPath)) {
      result.push(fullPath);
    }
  }
  return result;
}
