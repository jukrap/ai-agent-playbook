import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { SCHEMA_VERSION } from './harness.mjs';

const INSTALL_SOURCE = 'ai-agent-playbook';
const MARKER_FILE = '.ai-agent-playbook-install.json';
const OBSOLETE_SKILL_NAMES = [
  'design-system-first',
  'css-class-first',
  'utility-class-first',
  'inline-style-first'
];
const DESCRIPTION_WARNING_LENGTH = 180;
const SHALLOW_REFERENCE_LINE_THRESHOLD = 20;

export async function runSkillsLifecycle(options) {
  const {
    repoRoot,
    command,
    codexRoot = defaultCodexRoot(),
    agentsRoot = defaultAgentsRoot(),
    dryRun = false,
    forceManaged = false,
    forceUnmanaged = false
  } = options;
  const sourceRoot = path.join(path.resolve(repoRoot), 'skills');
  const skills = await discoverSkills(sourceRoot);
  const roots = {
    codex: path.resolve(codexRoot),
    agents: path.resolve(agentsRoot)
  };
  const operations = [];
  const warnings = [];
  const conflicts = [];
  let appliedOperations = 0;

  const mode = command === 'update' ? 'install' : command;
  if (!['check', 'install', 'uninstall'].includes(mode)) {
    throw new Error(`Unsupported skills command: ${command}`);
  }

  const targets = buildSkillTargets(skills, roots);
  const obsoleteTargets = buildObsoleteTargets(roots);

  if (mode === 'uninstall') {
    for (const target of [...targets, ...obsoleteTargets]) {
      const result = await planRemoveSkill(target, { dryRun, forceManaged });
      collect(result);
      appliedOperations += result.applied ? 1 : 0;
    }
  } else {
    for (const target of obsoleteTargets) {
      const result = await planRemoveSkill(target, { dryRun: mode === 'check' || dryRun, forceManaged, obsolete: true });
      collect(result);
      appliedOperations += result.applied ? 1 : 0;
    }
    for (const target of targets) {
      const result = mode === 'check'
        ? await checkSkill(target)
        : await syncSkill(target, { dryRun, forceManaged, forceUnmanaged });
      collect(result);
      appliedOperations += result.applied ? 1 : 0;
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    command: `skills.${command}`,
    applied: mode !== 'check' && !dryRun && appliedOperations > 0,
    sourceRoot,
    roots,
    summary: {
      skills: skills.length,
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };

  function collect(result) {
    operations.push(...result.operations);
    warnings.push(...result.warnings);
    conflicts.push(...result.conflicts);
  }
}

export async function lintSkills(options) {
  const { repoRoot } = options;
  const resolvedRepoRoot = path.resolve(repoRoot);
  const sourceRoot = path.join(resolvedRepoRoot, 'skills');
  const warnings = [];
  const conflicts = [];
  const skills = [];
  const skillFiles = [];
  await collectSkillFiles(sourceRoot, skillFiles);
  for (const skillFile of skillFiles.sort()) {
    const skill = await lintSkillFile({ sourceRoot, skillFile });
    skills.push(skill);
    warnings.push(...skill.warnings);
    conflicts.push(...skill.conflicts);
  }
  const depth = summarizeSkillDepth(skills);
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    command: 'skills.lint',
    summary: {
      skills: skills.length,
      pass: skills.filter((skill) => skill.status === 'pass').length,
      warn: skills.filter((skill) => skill.status === 'warn').length,
      conflict: skills.filter((skill) => skill.status === 'conflict').length,
      depth,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    skills: skills.map((skill) => ({
      name: skill.name,
      path: skill.path,
      status: skill.status,
      depth: skill.depth,
      warnings: skill.warnings.length,
      conflicts: skill.conflicts.length
    })),
    warnings,
    conflicts
  };
}

async function collectSkillFiles(sourceRoot, skillFiles) {
  if (!existsSync(sourceRoot)) return;
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(sourceRoot, entry.name);
    if (entry.isDirectory()) {
      await collectSkillFiles(fullPath, skillFiles);
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      skillFiles.push(fullPath);
    }
  }
}

async function lintSkillFile(options) {
  const { sourceRoot, skillFile } = options;
  const skillDir = path.dirname(skillFile);
  const relativePath = toPortablePath(path.relative(sourceRoot, skillFile));
  const text = await readFile(skillFile, 'utf8');
  const parsed = parseSkillMarkdown(text);
  const name = String(parsed.frontmatter.name ?? path.basename(skillDir)).trim();
  const description = String(parsed.frontmatter.description ?? '').trim();
  const warnings = [];
  const conflicts = [];
  const referenceFiles = await collectReferenceFiles(skillDir);
  const referenceStats = [];
  for (const referenceFile of referenceFiles) {
    const relativeReferencePath = toPortablePath(path.relative(skillDir, referenceFile));
    const lineCount = await countLines(referenceFile);
    const stat = { path: relativeReferencePath, lines: lineCount };
    referenceStats.push(stat);
    if (lineCount < SHALLOW_REFERENCE_LINE_THRESHOLD) {
      warnings.push(lintIssue(
        'skills.lint.reference-shallow',
        `${relativePath} reference ${relativeReferencePath} is shallow (${lineCount} lines); move enough reusable procedure, evidence, or examples into references.`,
        [relativePath, relativeReferencePath]
      ));
    }
  }
  const keys = Object.keys(parsed.frontmatter).sort();
  const extraKeys = keys.filter((key) => !['description', 'name'].includes(key));
  if (!parsed.hasFrontmatter || !parsed.frontmatter.name || !parsed.frontmatter.description) {
    conflicts.push(lintIssue('skills.lint.frontmatter-required', `${relativePath} must define name and description frontmatter.`, relativePath));
  }
  if (extraKeys.length > 0) {
    conflicts.push(lintIssue('skills.lint.frontmatter-keys', `${relativePath} has unsupported frontmatter keys: ${extraKeys.join(', ')}.`, relativePath));
  }
  if (!description.startsWith('Use when')) {
    warnings.push(lintIssue('skills.lint.description-trigger', `${relativePath} description should start with "Use when..." and describe trigger conditions.`, relativePath));
  }
  if (description.length > DESCRIPTION_WARNING_LENGTH) {
    warnings.push(lintIssue('skills.lint.description-length', `${relativePath} description is long; keep trigger text concise.`, relativePath));
  }
  if (/\b(this skill helps|follow(?:ing)? steps?|use this skill to|step-by-step|workflow\s*:)\b/i.test(description)) {
    warnings.push(lintIssue('skills.lint.description-workflow', `${relativePath} description looks workflow-oriented rather than trigger-focused.`, relativePath));
  }
  for (const link of markdownLinks(parsed.body)) {
    const resolved = resolveSkillLink(skillDir, link);
    if (!resolved) continue;
    if (!existsSync(resolved.absolutePath)) {
      warnings.push(lintIssue('skills.lint.reference-missing', `${relativePath} links to missing ${resolved.relativePath}.`, [relativePath, resolved.relativePath]));
    }
  }
  return {
    name,
    path: relativePath,
    status: conflicts.length > 0 ? 'conflict' : warnings.length > 0 ? 'warn' : 'pass',
    depth: {
      skillLines: lineCount(text),
      referenceFiles: referenceStats.length,
      referenceLines: referenceStats.reduce((sum, reference) => sum + reference.lines, 0),
      shallowReferences: referenceStats.filter((reference) => reference.lines < SHALLOW_REFERENCE_LINE_THRESHOLD).length
    },
    warnings,
    conflicts
  };
}

async function collectReferenceFiles(skillDir) {
  const referencesRoot = path.join(skillDir, 'references');
  const files = [];
  await collectMarkdownFiles(referencesRoot, files);
  return files.sort();
}

async function collectMarkdownFiles(root, files) {
  if (!existsSync(root)) return;
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }
}

async function countLines(filePath) {
  return lineCount(await readFile(filePath, 'utf8'));
}

function lineCount(text) {
  if (!text) return 0;
  return text.replace(/\r\n/g, '\n').split('\n').length;
}

function summarizeSkillDepth(skills) {
  const skillLines = skills.map((skill) => skill.depth.skillLines);
  const totalReferenceFiles = skills.reduce((sum, skill) => sum + skill.depth.referenceFiles, 0);
  const totalReferenceLines = skills.reduce((sum, skill) => sum + skill.depth.referenceLines, 0);
  return {
    skillLineThreshold: 60,
    shallowReferenceLineThreshold: SHALLOW_REFERENCE_LINE_THRESHOLD,
    skillLines: numberSummary(skillLines),
    referenceFiles: totalReferenceFiles,
    referenceLines: {
      total: totalReferenceLines,
      average: totalReferenceFiles === 0 ? 0 : roundOne(totalReferenceLines / totalReferenceFiles)
    },
    skillsWithReferences: skills.filter((skill) => skill.depth.referenceFiles > 0).length,
    skillsWithoutReferences: skills.filter((skill) => skill.depth.referenceFiles === 0).length,
    shallowReferences: skills.reduce((sum, skill) => sum + skill.depth.shallowReferences, 0)
  };
}

function numberSummary(values) {
  if (values.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: roundOne(values.reduce((sum, value) => sum + value, 0) / values.length)
  };
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function parseSkillMarkdown(text) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) {
    return { hasFrontmatter: false, frontmatter: {}, body: text };
  }
  const normalized = text.replace(/\r\n/g, '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return { hasFrontmatter: false, frontmatter: {}, body: text };
  const frontmatterText = normalized.slice(4, end);
  const frontmatter = {};
  for (const line of frontmatterText.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    frontmatter[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return {
    hasFrontmatter: true,
    frontmatter,
    body: normalized.slice(end + '\n---\n'.length)
  };
}

function markdownLinks(text) {
  const links = [];
  const pattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(pattern)) {
    links.push(match[1]);
  }
  return links;
}

function resolveSkillLink(skillDir, href) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const withoutFragment = trimmed.split('#')[0];
  if (!withoutFragment) return null;
  const absolutePath = path.resolve(skillDir, withoutFragment);
  const relativePath = toPortablePath(path.relative(skillDir, absolutePath));
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;
  return { absolutePath, relativePath };
}

function lintIssue(id, message, paths) {
  return {
    id,
    message,
    paths: Array.isArray(paths) ? paths : [paths]
  };
}

function defaultCodexRoot() {
  return path.join(os.homedir(), '.codex', 'skills');
}

function defaultAgentsRoot() {
  return path.join(os.homedir(), '.agents', 'skills');
}

async function discoverSkills(sourceRoot) {
  const skillFiles = [];
  await walk(sourceRoot);
  if (skillFiles.length === 0) throw new Error(`No SKILL.md files found under ${sourceRoot}`);

  const skills = [];
  for (const skillFile of skillFiles.sort()) {
    const sourceDir = path.dirname(skillFile);
    const skillName = path.basename(sourceDir);
    const category = path.basename(path.dirname(sourceDir));
    skills.push({
      skillName,
      category,
      sourceDir,
      sourceHash: await directorySignature(sourceDir)
    });
  }
  return skills;

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name === 'SKILL.md') {
        skillFiles.push(fullPath);
      }
    }
  }
}

function buildSkillTargets(skills, roots) {
  const targets = [];
  for (const skill of skills) {
    targets.push({
      ...skill,
      rootKind: 'codex',
      destinationRoot: roots.codex,
      destination: path.join(roots.codex, skill.skillName)
    });
    targets.push({
      ...skill,
      rootKind: 'agents',
      destinationRoot: skill.category === 'legacy' ? path.join(roots.agents, 'legacys') : roots.agents,
      destination: skill.category === 'legacy'
        ? path.join(roots.agents, 'legacys', skill.skillName)
        : path.join(roots.agents, skill.skillName)
    });
  }
  return targets;
}

function buildObsoleteTargets(roots) {
  return OBSOLETE_SKILL_NAMES.flatMap((skillName) => [
    {
      skillName,
      category: 'obsolete',
      sourceDir: null,
      sourceHash: null,
      rootKind: 'codex',
      destinationRoot: roots.codex,
      destination: path.join(roots.codex, skillName)
    },
    {
      skillName,
      category: 'obsolete',
      sourceDir: null,
      sourceHash: null,
      rootKind: 'agents',
      destinationRoot: roots.agents,
      destination: path.join(roots.agents, skillName)
    }
  ]);
}

async function checkSkill(target) {
  const operations = [];
  const warnings = [];
  const conflicts = [];
  const marker = await readMarker(target.destination);
  if (!existsSync(target.destination)) {
    conflicts.push(conflict('skills.missing', `${target.skillName} is not installed in ${target.rootKind}.`, target));
    return { applied: false, operations, warnings, conflicts };
  }
  const destinationHash = await directorySignature(target.destination);
  if (isManagedMarker(marker.value)) {
    if (marker.value.sourceHash && !sameHash(destinationHash, marker.value.sourceHash)) {
      conflicts.push(conflict('skills.modified-managed', `${target.skillName} has local edits in ${target.rootKind}.`, target));
    } else {
      operations.push(operation('skills.present-managed', 'present', `${target.skillName} is managed in ${target.rootKind}.`, target));
    }
  } else if (sameHash(destinationHash, target.sourceHash)) {
    operations.push(operation('skills.adoptable-unmanaged', 'adopt', `${target.skillName} matches the source and can be adopted in ${target.rootKind}.`, target));
  } else {
    conflicts.push(conflict('skills.unmanaged-conflict', `${target.skillName} exists in ${target.rootKind} but is not managed by this playbook.`, target));
  }
  return { applied: false, operations, warnings, conflicts };
}

async function syncSkill(target, options) {
  assertInside(target.destinationRoot, target.destination);
  const operations = [];
  const warnings = [];
  const conflicts = [];
  const { dryRun, forceManaged, forceUnmanaged } = options;
  const exists = existsSync(target.destination);
  let action = 'install';
  let message = `Install managed skill ${target.skillName} into ${target.rootKind}.`;

  if (exists) {
    const marker = await readMarker(target.destination);
    const destinationHash = await directorySignature(target.destination);
    if (isManagedMarker(marker.value)) {
      if (!forceManaged && marker.value.sourceHash && !sameHash(destinationHash, marker.value.sourceHash)) {
        conflicts.push(conflict('skills.modified-managed', `${target.skillName} has local edits in ${target.rootKind}; use --force-managed to replace it.`, target));
        return { applied: false, operations, warnings, conflicts };
      }
      action = 'update';
      message = `Update managed skill ${target.skillName} in ${target.rootKind}.`;
    } else if (sameHash(destinationHash, target.sourceHash)) {
      action = 'adopt';
      message = `Adopt matching unmanaged skill ${target.skillName} in ${target.rootKind}.`;
    } else if (forceUnmanaged) {
      action = 'replace';
      message = `Replace unmanaged skill ${target.skillName} in ${target.rootKind}.`;
    } else {
      conflicts.push(conflict('skills.unmanaged-conflict', `${target.skillName} exists in ${target.rootKind} but is not managed by this playbook.`, target));
      return { applied: false, operations, warnings, conflicts };
    }
  }

  operations.push(operation(`skills.${action}`, action, message, target));
  if (dryRun) return { applied: false, operations, warnings, conflicts };

  await mkdir(target.destinationRoot, { recursive: true });
  if (action === 'adopt') {
    await writeMarker(target);
  } else {
    if (exists) await rm(target.destination, { recursive: true, force: true });
    await cp(target.sourceDir, target.destination, { recursive: true });
    await writeMarker(target);
  }
  return { applied: true, operations, warnings, conflicts };
}

async function planRemoveSkill(target, options) {
  assertInside(target.destinationRoot, target.destination);
  const operations = [];
  const warnings = [];
  const conflicts = [];
  const { dryRun, forceManaged, obsolete = false } = options;
  if (!existsSync(target.destination)) return { applied: false, operations, warnings, conflicts };

  const marker = await readMarker(target.destination);
  if (!isManagedMarker(marker.value)) {
    warnings.push(warning(obsolete ? 'skills.obsolete-unmanaged' : 'skills.unmanaged-skip', `${target.skillName} in ${target.rootKind} is not managed by this playbook; leaving it in place.`, target));
    return { applied: false, operations, warnings, conflicts };
  }

  const destinationHash = await directorySignature(target.destination);
  if (!forceManaged && marker.value.sourceHash && !sameHash(destinationHash, marker.value.sourceHash)) {
    conflicts.push(conflict('skills.modified-managed', `${target.skillName} has local edits in ${target.rootKind}; use --force-managed to remove it.`, target));
    return { applied: false, operations, warnings, conflicts };
  }

  operations.push(operation(obsolete ? 'skills.remove-obsolete' : 'skills.uninstall', 'remove', `Remove managed skill ${target.skillName} from ${target.rootKind}.`, target));
  if (dryRun) return { applied: false, operations, warnings, conflicts };

  await rm(target.destination, { recursive: true, force: true });
  await removeEmptyParents(path.dirname(target.destination), target.destinationRoot);
  return { applied: true, operations, warnings, conflicts };
}

async function readMarker(destination) {
  const markerPath = path.join(destination, MARKER_FILE);
  if (!existsSync(markerPath)) return { path: markerPath, value: null };
  try {
    return { path: markerPath, value: JSON.parse(await readFile(markerPath, 'utf8')) };
  } catch (error) {
    return { path: markerPath, value: { malformed: true, error: error.message } };
  }
}

function isManagedMarker(marker) {
  return marker && typeof marker === 'object' && marker.source === INSTALL_SOURCE;
}

async function writeMarker(target) {
  const existing = await readMarker(target.destination);
  const installedAtUtc = isManagedMarker(existing.value) && typeof existing.value.installedAtUtc === 'string'
    ? existing.value.installedAtUtc
    : new Date().toISOString();
  const marker = {
    schemaVersion: 1,
    source: INSTALL_SOURCE,
    skillName: target.skillName,
    category: target.category,
    sourceHash: target.sourceHash,
    installedAtUtc
  };
  await writeFile(path.join(target.destination, MARKER_FILE), `${JSON.stringify(marker, null, 2)}\n`);
}

async function directorySignature(directory) {
  if (!existsSync(directory)) return null;
  const files = [];
  await walk(directory, '');
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return sha256(files.map((file) => `${file.relativePath}=${file.hash}`).join('\n'));

  async function walk(current, rel) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, entryRel);
      } else if (entry.isFile() && entry.name !== MARKER_FILE) {
        files.push({
          relativePath: entryRel,
          hash: sha256(await readFile(fullPath))
        });
      }
    }
  }
}

async function removeEmptyParents(startDir, stopDir) {
  const resolvedStop = path.resolve(stopDir);
  let current = path.resolve(startDir);
  while (current !== resolvedStop && isInside(resolvedStop, current)) {
    try {
      const entries = await readdir(current);
      if (entries.length > 0) break;
      await rm(current, { recursive: false });
    } catch {
      break;
    }
    current = path.dirname(current);
  }
}

function operation(id, action, message, target) {
  return {
    id,
    action,
    message,
    skillName: target.skillName,
    category: target.category,
    root: target.rootKind,
    path: target.destination
  };
}

function warning(id, message, target) {
  return {
    id,
    message,
    skillName: target.skillName,
    root: target.rootKind,
    paths: [target.destination]
  };
}

function conflict(id, message, target) {
  return {
    id,
    message,
    skillName: target.skillName,
    root: target.rootKind,
    paths: [target.destination]
  };
}

function assertInside(root, child) {
  const resolvedRoot = path.resolve(root);
  const resolvedChild = path.resolve(child);
  if (resolvedChild !== resolvedRoot && !isInside(resolvedRoot, resolvedChild)) {
    throw new Error(`Refusing to operate outside destination root: ${resolvedChild}`);
  }
}

function isInside(root, child) {
  const resolvedRoot = normalizeCase(path.resolve(root));
  const resolvedChild = normalizeCase(path.resolve(child));
  return resolvedChild.startsWith(`${resolvedRoot}${path.sep}`);
}

function normalizeCase(value) {
  return process.platform === 'win32' ? value.toLowerCase() : value;
}

function toPortablePath(value) {
  return value.split(path.sep).join('/');
}

function sameHash(left, right) {
  return typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
