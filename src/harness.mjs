import { mkdir, readdir, readFile, stat, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
export const CONTEXT_SOURCE_FILES = [
  'START_HERE.md',
  'CURRENT.md',
  'SKILLS.md',
  'GIT.md'
];

const OBSOLETE_STYLE_SKILLS = [
  'design-system-first',
  'css-class-first',
  'utility-class-first',
  'inline-style-first'
];

const ROOT_BOOTSTRAP_REFS = [
  'ai-playbook/START_HERE.md',
  'ai-playbook/CURRENT.md',
  'ai-playbook/SKILLS.md',
  'ai-playbook/GIT.md'
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
  const playbookTarget = path.join(target, 'ai-playbook');

  await copyTree(playbookSource, playbookTarget, { dryRun, force, operations, conflicts });

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
  await writeManagedFile(path.join(target, 'AGENTS.md'), agentContent, { dryRun, force, operations, conflicts });

  if (localOnly) {
    await ensureGitignoreEntry(target, 'ai-playbook/', { dryRun, operations });
  }

  return {
    ok: conflicts.length === 0,
    operations,
    conflicts
  };
}

export async function doctorProject(options) {
  const { target, strict = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const checks = [];
  const playbookRoot = path.join(target, 'ai-playbook');
  const hasPlaybook = existsSync(playbookRoot);
  checks.push(result(
    hasPlaybook ? 'pass' : 'fail',
    'playbook.directory',
    'setup',
    'ai-playbook directory',
    hasPlaybook ? 'Found ai-playbook/.' : 'Missing ai-playbook/.',
    ['ai-playbook/']
  ));

  for (const file of REQUIRED_PLAYBOOK_FILES) {
    const ok = existsSync(path.join(playbookRoot, file));
    checks.push(result(
      ok ? 'pass' : 'fail',
      checkIdForPlaybookFile(file),
      'setup',
      `ai-playbook/${file}`,
      ok ? 'Found.' : 'Missing.',
      [`ai-playbook/${toPortablePath(file)}`]
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
    const pointsToPlaybook = agentsText.includes('ai-playbook/');
    checks.push(result(
      pointsToPlaybook ? 'pass' : 'warn',
      'root-agents.points-to-playbook',
      'bootstrap',
      'root AGENTS bootstrap',
      pointsToPlaybook ? 'Points to ai-playbook/.' : 'Found, but does not point agents to ai-playbook/.',
      ['AGENTS.md']
    ));
    const missingRefs = ROOT_BOOTSTRAP_REFS.filter((ref) => !agentsText.includes(ref));
    checks.push(result(
      missingRefs.length ? 'warn' : 'pass',
      'root-agents.reading-order',
      'bootstrap',
      'root AGENTS reading order',
      missingRefs.length ? `Missing explicit references: ${missingRefs.join(', ')}` : 'References core ai-playbook files.',
      ['AGENTS.md', ...missingRefs]
    ));
  }

  const rootPolicyFiles = ['SKILLS.md', 'GIT.md'].filter((file) => existsSync(path.join(target, file)));
  checks.push(result(
    rootPolicyFiles.length ? 'warn' : 'pass',
    'root-policy-files',
    'policy',
    'root policy files',
    rootPolicyFiles.length ? `Prefer ai-playbook/SKILLS.md and ai-playbook/GIT.md; root files found: ${rootPolicyFiles.join(', ')}` : 'No root SKILLS.md or GIT.md.',
    rootPolicyFiles
  ));

  const gitignore = path.join(target, '.gitignore');
  const gitignoreText = existsSync(gitignore) ? await readFile(gitignore, 'utf8') : '';
  const ignoresPlaybook = gitignoreText.split(/\r?\n/).some((line) => line.trim() === 'ai-playbook/');
  checks.push(result(
    ignoresPlaybook ? 'pass' : 'warn',
    'playbook.commit-policy',
    'policy',
    'ai-playbook commit policy',
    ignoresPlaybook ? 'Marked local-only in .gitignore.' : 'Not marked local-only; treat as committed project docs.',
    ['.gitignore', 'ai-playbook/']
  ));

  if (hasPlaybook) {
    const templateFiles = await findCoreTemplateFiles(playbookRoot);
    checks.push(result(
      templateFiles.length ? 'warn' : 'pass',
      'playbook.adaptation',
      'adaptation',
      'playbook adaptation',
      templateFiles.length ? `Template prompts remain in: ${templateFiles.join(', ')}` : 'Core playbook files look adapted.',
      templateFiles.map((file) => `ai-playbook/${toPortablePath(file)}`)
    ));
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

export async function checkGuides(options) {
  const { repoRoot, target } = options;

  await assertDirectory(target, 'Target repository does not exist');

  const source = path.join(repoRoot, 'templates', 'project-playbook', 'guides');
  const destination = path.join(target, 'ai-playbook', 'guides');
  const sourceFiles = await walkFiles(source, (file) => file.endsWith('.md'));
  const guides = [];
  for (const file of sourceFiles) {
    const rel = toPortablePath(path.relative(source, file));
    const destinationFile = path.join(destination, rel);
    guides.push({
      path: `ai-playbook/guides/${rel}`,
      status: existsSync(destinationFile) ? 'present' : 'missing'
    });
  }
  guides.sort((left, right) => left.path.localeCompare(right.path));
  const summary = {
    total: guides.length,
    present: guides.filter((guide) => guide.status === 'present').length,
    missing: guides.filter((guide) => guide.status === 'missing').length
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

  const playbookRoot = path.join(target, 'ai-playbook');
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
      warnings: [contextWarning('context.missing-playbook', 'Missing ai-playbook/.')]
    };
  }

  for (const file of CONTEXT_SOURCE_FILES) {
    const fullPath = path.join(playbookRoot, file);
    const sourcePath = `ai-playbook/${file}`;
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
  const destination = path.join(target, 'ai-playbook', 'guides');
  await copyTree(source, destination, {
    dryRun,
    force,
    skipExisting: !force,
    operations,
    conflicts
  });

  return {
    ok: conflicts.length === 0,
    operations,
    conflicts
  };
}

export async function createPlan(options) {
  const { target, title, date = todayIso(), dryRun = false, force = false } = options;
  requireTitle(title);
  const file = path.join(target, 'ai-playbook', 'plans', `${date}-${slugifyTitle(title)}.md`);
  const content = `# ${title}\n\nStatus: active\nDate: ${date}\n\n## Goal\n\nDescribe the outcome this plan should produce.\n\n## Approach\n\nRecord the chosen implementation path and important constraints.\n\n## Steps\n\n- [ ] First implementation slice.\n- [ ] Verification and cleanup.\n\n## Verification\n\n- Record commands or manual checks here after they are known.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

export async function createWorklog(options) {
  const { target, title, date = todayIso(), dryRun = false, force = false } = options;
  requireTitle(title);
  const month = date.slice(0, 7);
  const file = path.join(target, 'ai-playbook', 'worklogs', month, `${date}-${slugifyTitle(title)}.md`);
  const content = `# ${title}\n\nDate: ${date}\n\n## Context\n\nExplain what prompted the work.\n\n## Decision Path\n\nRecord the reasoning, alternatives considered, and evidence.\n\n## Changes\n\nSummarize the important changes without reducing this to a file list.\n\n## Verification\n\nRecord only checks that were actually run.\n\n## Remaining Risk\n\nCapture follow-up risk or note none after verification.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

export async function summarizeWorklogs(options) {
  const { target, month, dryRun = false, force = false } = options;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Missing or invalid --month YYYY-MM.');
  }
  const monthDir = path.join(target, 'ai-playbook', 'worklogs', month);
  const files = existsSync(monthDir)
    ? (await readdir(monthDir, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort()
    : [];
  const file = path.join(target, 'ai-playbook', 'worklogs', 'summaries', `${month}.md`);
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
