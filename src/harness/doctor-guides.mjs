import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  CONTEXT_SOURCE_FILES,
  DEFAULT_CONTEXT_MAX_CHARS,
  GUIDES_DIR,
  OBSOLETE_STYLE_SKILLS,
  REQUIRED_PLAYBOOK_FILES,
  ROOT_BOOTSTRAP_REFS,
  SCHEMA_VERSION,
  activePlaybookMissingResult,
  assertDirectory,
  checkIdForPlaybookFile,
  contextWarning,
  copyTree,
  findCoreTemplateFiles,
  guideDiff,
  hashFile,
  loadGuideManifest,
  reminder,
  resolvePlaybookLayout,
  result,
  summarizeChecks,
  toPortablePath,
  truncateText,
  updateGuideManifestEntries,
  walkFiles,
  worklogSummaryFreshnessChecks
} from './core.mjs';

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
    rootPolicyFiles.length ? `Prefer ${playbook.relativeRoot}policy/SKILLS.md and ${playbook.relativeRoot}policy/GIT.md; root files found: ${rootPolicyFiles.join(', ')}` : 'No root SKILLS.md or GIT.md.',
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

  const source = path.join(repoRoot, 'templates', 'project-playbook', ...GUIDES_DIR.split('/'));
  const playbook = resolvePlaybookLayout(target);
  const destination = path.join(playbook.root, ...GUIDES_DIR.split('/'));
  const sourceGuides = await loadGuideManifest(source);
  const guides = [];
  for (const guide of sourceGuides) {
    const rel = toPortablePath(guide.path);
    const destinationFile = path.join(destination, ...rel.split('/'));
    const sourceHash = guide.sourceHash ?? await hashFile(path.join(source, ...rel.split('/')));
    if (!existsSync(destinationFile)) {
      guides.push({
        path: `${playbook.relativeRoot}${GUIDES_DIR}/${rel}`,
        status: 'missing',
        sourceHash
      });
      continue;
    }
    const targetHash = await hashFile(destinationFile);
    const entry = {
      path: `${playbook.relativeRoot}${GUIDES_DIR}/${rel}`,
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
  const missing = activePlaybookMissingResult(target);
  if (missing) {
    return {
      ok: false,
      operations,
      conflicts: missing.conflicts
    };
  }
  const source = path.join(repoRoot, 'templates', 'project-playbook', ...GUIDES_DIR.split('/'));
  const destination = path.join(resolvePlaybookLayout(target).root, ...GUIDES_DIR.split('/'));
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
