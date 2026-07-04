import { appendFile, mkdir, readdir, readFile, rename, rm, rmdir, stat, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const REQUIRED_PLAYBOOK_FILES = [
  'README.md',
  'START_HERE.md',
  'CURRENT.md',
  'questions.md',
  'manifest.json',
  'policy/SKILLS.md',
  'policy/GIT.md',
  'policy/SAFETY.md',
  'memory/README.md',
  'memory/glossary.md',
  'workflows/README.md',
  'workflows/recipes/README.md',
  'knowledge/sources.json',
  'runtime/README.md',
  'integrations/README.md'
];

export const SCHEMA_VERSION = '1';
export const DEFAULT_CONTEXT_MAX_CHARS = 12000;
export const DEFAULT_PLAYBOOK_DIR = '.ai-agent-playbook';
export const LEGACY_PLAYBOOK_DIRS = ['.ai-playbook', 'ai-playbook'];
export const LEGACY_PLAYBOOK_DIR = LEGACY_PLAYBOOK_DIRS[0];
export const CONTEXT_SOURCE_FILES = [
  'START_HERE.md',
  'CURRENT.md',
  'questions.md',
  'policy/SKILLS.md',
  'policy/GIT.md'
];
export const GUIDE_MANIFEST_FILE = 'manifest.json';
export const INSTALL_MANIFEST_FILE = '.ai-agent-playbook-install.json';
export const INSTALL_SOURCE = 'ai-agent-playbook';
export const CONTEXT_DIR = 'memory/context';
export const MAPS_DIR = 'memory/maps';
export const RUNS_DIR = 'workflows/runs';
export const CONTRACTS_DIR = 'memory/contracts';
export const WORKLOGS_DIR = 'workflows/worklogs';
export const GUIDES_DIR = 'knowledge/references/guides';
export const RUN_SUMMARY_MARKER = '<!-- ai-agent-playbook-run-summary -->';

export const OBSOLETE_STYLE_SKILLS = [
  'design-system-first',
  'css-class-first',
  'utility-class-first',
  'inline-style-first'
];

export const ROOT_BOOTSTRAP_REFS = [
  'START_HERE.md',
  'CURRENT.md',
  'questions.md',
  'policy/SKILLS.md',
  'policy/GIT.md'
];

export const CORE_TEMPLATE_MARKERS = [
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

export const CONTRACT_GLOB_EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

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
  const dir = DEFAULT_PLAYBOOK_DIR;
  return {
    dir,
    root: path.join(target, dir),
    relativeRoot: `${dir}/`
  };
}

export function activePlaybookMissingResult(target) {
  const playbook = resolvePlaybookLayout(target);
  if (existsSync(playbook.root)) return null;
  return {
    ok: false,
    file: playbook.relativeRoot,
    operations: [],
    conflicts: [`Missing ${playbook.relativeRoot}; run bootstrap or migrate path first.`]
  };
}

export function result(level, id, category, name, message, paths = []) {
  return { id, level, category, name, message, paths };
}

export function contextWarning(id, message, paths = []) {
  return { id, message, paths };
}

export function reminder(id, level, message, paths = []) {
  return { id, level, message, paths };
}

export function summarizeChecks(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.level === 'pass').length,
    warn: checks.filter((check) => check.level === 'warn').length,
    fail: checks.filter((check) => check.level === 'fail').length
  };
}

export function checkIdForPlaybookFile(file) {
  return `playbook.file.${file.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}`;
}

export function toPortablePath(value) {
  return value.split(path.sep).join('/');
}

export async function collectContextEntries(options) {
  const { target, playbook, relativePath, warnings } = options;
  const contextRoot = path.join(playbook.root, CONTEXT_DIR);
  const files = await walkFiles(contextRoot, (file) => file.endsWith('.md'));
  const entries = [];
  for (const file of files) {
    const relative = normalizePortablePath(path.relative(target, file));
    const contextRelative = normalizePortablePath(path.relative(contextRoot, file));
    const text = await readFile(file, 'utf8');
    const parsed = parseMemoryMarkdown(text);
    const id = String(parsed.frontmatter.id ?? path.basename(file, path.extname(file))).trim();
    const globs = normalizeFrontmatterList(parsed.frontmatter.globs);
    const alwaysApply = parsed.frontmatter.alwaysApply === true || parsed.frontmatter.alwaysApply === 'true';
    const match = matchContext({ alwaysApply, globs, relativePath });
    entries.push({
      id,
      path: relative,
      contextPath: contextRelative,
      source: `${playbook.dir}/${CONTEXT_DIR}`,
      globs,
      alwaysApply,
      freshness: parsed.frontmatter.freshness ?? null,
      priority: parsed.frontmatter.priority ?? 'normal',
      applies: match.applies,
      reason: match.reason,
      bytes: Buffer.byteLength(text, 'utf8')
    });
  }
  entries.sort((left, right) => {
    if (left.applies !== right.applies) return left.applies ? -1 : 1;
    const priority = priorityRank(right.priority) - priorityRank(left.priority);
    return priority || left.path.localeCompare(right.path);
  });
  return entries;
}

export async function readDocMap(options) {
  const { target, playbook } = options;
  const file = path.join(playbook.root, ...MAPS_DIR.split('/'), 'doc-map.md');
  const relative = normalizePortablePath(path.relative(target, file));
  if (!existsSync(file)) {
    return {
      path: relative,
      exists: false,
      bytes: 0
    };
  }
  const text = await readFile(file, 'utf8');
  return {
    path: relative,
    exists: true,
    bytes: Buffer.byteLength(text, 'utf8')
  };
}

export async function writeMemoryFiles(options) {
  const { target, files, dryRun, command } = options;
  const operations = [];
  const warnings = [];
  const conflicts = [];
  for (const file of files) {
    const portablePath = normalizePortablePath(file.path);
    const fullPath = path.join(target, ...portablePath.split('/'));
    if (existsSync(fullPath)) {
      operations.push({
        id: `${command}.keep-existing`,
        action: 'keep',
        path: portablePath,
        message: `Keep existing ${portablePath}.`
      });
      continue;
    }
    operations.push({
      id: `${command}.write-file`,
      action: 'write',
      path: portablePath,
      message: `Write ${portablePath}.`
    });
    if (!dryRun) {
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, file.content);
    }
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    applied: !dryRun && conflicts.length === 0,
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

export function normalizeTargetRelativePath(target, filePath) {
  const raw = String(filePath);
  const resolved = path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)
    ? path.resolve(raw)
    : path.resolve(target, raw);
  const relative = path.relative(target, resolved);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return normalizePortablePath(relative);
  }
  return normalizePortablePath(raw);
}

export function normalizePortablePath(value) {
  return String(value)
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/+/g, '/');
}

export function isSafePortablePath(value) {
  const normalized = normalizePortablePath(value);
  return Boolean(
    normalized &&
    normalized === value &&
    !path.isAbsolute(value) &&
    !path.posix.isAbsolute(normalized) &&
    !/^[A-Za-z]:[\\/]/.test(value) &&
    !normalized.split('/').some((part) => part === '..' || part === '')
  );
}

export function normalizeFrontmatterList(value) {
  if (value === undefined || value === null || value === false) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [String(value).trim()].filter(Boolean);
}

export function matchContext(options) {
  const { alwaysApply, globs, relativePath } = options;
  if (alwaysApply) return { applies: true, reason: 'alwaysApply' };
  if (!relativePath) return { applies: false, reason: 'requiresPath' };
  if (globs.some((glob) => globMatches(glob, relativePath))) {
    return { applies: true, reason: 'glob' };
  }
  return { applies: false, reason: 'noMatch' };
}

export function priorityRank(priority) {
  const normalized = String(priority ?? '').toLowerCase();
  if (normalized === 'critical') return 4;
  if (normalized === 'high') return 3;
  if (normalized === 'medium') return 2;
  if (normalized === 'low') return 1;
  return 0;
}

export function parseMemoryMarkdown(text) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) {
    return { frontmatter: {}, body: text };
  }
  const normalized = text.replace(/\r\n/g, '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: text };
  const rawFrontmatter = normalized.slice(4, end);
  const body = normalized.slice(end + 5);
  return {
    frontmatter: parseFrontmatter(rawFrontmatter),
    body
  };
}

export function parseFrontmatter(text) {
  const result = {};
  const lines = text.split('\n');
  let currentKey = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(result[currentKey])) result[currentKey] = [];
      result[currentKey].push(parseFrontmatterValue(listMatch[1]));
      continue;
    }
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) {
      currentKey = null;
      continue;
    }
    const [, key, rawValue = ''] = keyMatch;
    currentKey = key;
    if (rawValue.trim() === '') {
      result[key] = [];
    } else {
      result[key] = parseFrontmatterValue(rawValue);
    }
  }
  return result;
}

export function parseFrontmatterValue(raw) {
  const value = String(raw).trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => stripQuotes(item.trim())).filter(Boolean);
  }
  return stripQuotes(value);
}

export function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, '');
}

export function globMatches(glob, relativePath) {
  const normalizedGlob = normalizePortablePath(glob);
  const normalizedPath = normalizePortablePath(relativePath);
  if (normalizedGlob === normalizedPath) return true;
  return globToRegex(normalizedGlob).test(normalizedPath);
}

export function globToRegex(glob) {
  let source = '';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === '*' && next === '*') {
      const after = glob[index + 2];
      if (after === '/') {
        source += '(?:.*/)?';
        index += 2;
      } else {
        source += '.*';
        index += 1;
      }
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else {
      source += escapeRegex(char);
    }
  }
  return new RegExp(`^${source}$`);
}

export function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

export function normalizeRunId(runId) {
  if (!runId || !String(runId).trim()) throw new Error('Missing --run-id.');
  const normalized = normalizePortablePath(String(runId).trim());
  if (
    normalized.includes('/') ||
    normalized.includes('..') ||
    path.isAbsolute(normalized) ||
    /^[A-Za-z]:[\\/]/.test(normalized)
  ) {
    throw new Error('Invalid --run-id; expected a portable id.');
  }
  return normalized;
}

export function normalizePortableUserPath(value) {
  if (!value || !String(value).trim()) return null;
  const raw = String(value).trim();
  const normalized = normalizePortablePath(raw);
  if (
    path.isAbsolute(raw) ||
    path.posix.isAbsolute(normalized) ||
    /^[A-Za-z]:[\\/]/.test(raw) ||
    normalized.split('/').some((part) => part === '..' || part === '')
  ) {
    return false;
  }
  return normalized;
}

export function isUnsafeRecordText(value) {
  const text = String(value ?? '');
  return (
    /[A-Za-z]:[\\/]/.test(text) ||
    /(^|\s)\/(?:Users|home|var|etc|tmp)\//.test(text) ||
    /\b(?:api[_-]?key|token|secret|password)\s*[:=]/i.test(text)
  );
}

export function memoryWarning(id, message, paths = []) {
  return { id, message, paths };
}

export function memoryConflict(id, message, paths = []) {
  return { id, message, paths };
}

export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function latestRunId(playbookRoot) {
  const runsRoot = path.join(playbookRoot, ...RUNS_DIR.split('/'));
  if (!existsSync(runsRoot)) return null;
  const entries = await readdir(runsRoot, { withFileTypes: true });
  const directories = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(runsRoot, entry.name);
    directories.push({ name: entry.name, mtimeMs: (await stat(fullPath)).mtimeMs });
  }
  directories.sort((left, right) => right.mtimeMs - left.mtimeMs || right.name.localeCompare(left.name));
  return directories[0]?.name ?? null;
}

export function runStatusResult(options) {
  const { target, runId, summary, criteria, events, warnings, conflicts } = options;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    runId,
    summary,
    criteria,
    events,
    warnings,
    conflicts
  };
}

export function emptyRunSummary() {
  return {
    events: 0,
    criteria: 0,
    openCriteria: 0,
    evidence: 0,
    pass: 0,
    fail: 0,
    blocked: 0,
    cleanup: 0,
    warnings: 0,
    conflicts: 0
  };
}

export async function readLedgerEvents(file, warnings, portablePath) {
  const text = await readFile(file, 'utf8');
  const events = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      warnings.push(memoryWarning('run.ledger.malformed-line', `Could not parse ${portablePath}:${index + 1}: ${error.message}`, [portablePath]));
    }
  }
  return events;
}

export async function readCriteria(file, warnings, portablePath) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.criteria)) return parsed.criteria;
    warnings.push(memoryWarning('run.criteria.invalid', `${portablePath} does not contain a criteria array.`, [portablePath]));
    return [];
  } catch (error) {
    warnings.push(memoryWarning('run.criteria.malformed', `Could not parse ${portablePath}: ${error.message}`, [portablePath]));
    return [];
  }
}

export function mergeCriteriaWithLedgerEvents(criteria, events) {
  const fileCriteria = criteria.map((criterion) => ({
    ...criterion,
    source: criterion.source ?? 'criteria'
  }));
  const ledgerCriteria = events
    .filter((event) => event.type === 'criterion')
    .map((event, index) => ({
      id: event.id ?? `ledger-${index + 1}`,
      status: event.status ?? 'info',
      message: event.message ?? 'criterion',
      source: 'ledger',
      timeUtc: event.timeUtc ?? null,
      evidence: event.evidence ?? null,
      paths: Array.isArray(event.paths) ? event.paths : []
    }));
  return [...fileCriteria, ...ledgerCriteria];
}

export function summarizeRunState(options) {
  const { events, criteria, warnings, conflicts } = options;
  return {
    events: events.length,
    criteria: criteria.length,
    openCriteria: criteria.filter((item) => !['pass', 'done'].includes(String(item.status ?? '').toLowerCase())).length,
    evidence: events.filter((event) => event.type === 'evidence').length,
    pass: events.filter((event) => event.status === 'pass').length,
    fail: events.filter((event) => event.status === 'fail').length,
    blocked: events.filter((event) => event.status === 'blocked' || event.type === 'blocker').length,
    cleanup: events.filter((event) => event.type === 'cleanup').length,
    warnings: warnings.length,
    conflicts: conflicts.length
  };
}

export function buildRunSummaryMarkdown(options) {
  const { runId, events, criteria } = options;
  const lines = [
    RUN_SUMMARY_MARKER,
    `# ${runId} Run Summary`,
    '',
    '## Criteria',
    ''
  ];
  if (criteria.length === 0) {
    lines.push('- No criteria recorded.');
  } else {
    for (const criterion of criteria) {
      lines.push(`- [${criterion.status ?? 'info'}] ${criterion.message ?? criterion.id ?? 'criterion'}`);
    }
  }
  lines.push('', '## Ledger', '');
  if (events.length === 0) {
    lines.push('- No events recorded.');
  } else {
    for (const event of events) {
      lines.push(`- ${event.timeUtc ?? 'unknown'} [${event.type ?? 'note'}/${event.status ?? 'info'}] ${event.message ?? ''}`.trimEnd());
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function isUserEditedRunSummary(text, runId) {
  return !(
    text.includes(RUN_SUMMARY_MARKER) ||
    text.includes(`Run ID: ${runId}`) ||
    text.startsWith(`# ${runId} Run Summary\n`)
  );
}

export async function collectContracts(options) {
  const { target, playbook, warnings, relativePath } = options;
  const contracts = [];
  for (const status of ['active', 'pending']) {
    const root = path.join(playbook.root, CONTRACTS_DIR, status);
    const files = await walkFiles(root, (file) => file.endsWith('.md'));
    for (const file of files) {
      const relative = normalizePortablePath(path.relative(target, file));
      const text = await readFile(file, 'utf8');
      const parsed = parseMemoryMarkdown(text);
      const appliesTo = normalizeFrontmatterList(parsed.frontmatter.appliesTo);
      const contractStatus = String(parsed.frontmatter.status ?? status);
      const matchesPath = relativePath === undefined
        ? false
        : appliesTo.some((item) => globMatches(item, relativePath));
      contracts.push({
        id: String(parsed.frontmatter.id ?? path.basename(file, path.extname(file))),
        path: relative,
        status: contractStatus,
        folder: status,
        appliesTo,
        risk: parsed.frontmatter.risk ?? null,
        approvedAt: parsed.frontmatter.approvedAt ?? null,
        freshness: parsed.frontmatter.freshness ?? null,
        matchesPath,
        stale: isStaleDate(parsed.frontmatter.freshness),
        hasRequiredEvidence: hasRequiredEvidence(parsed.body),
        requiredEvidence: extractRequiredEvidencePaths(parsed.body)
      });
    }
  }
  contracts.sort((left, right) => left.status.localeCompare(right.status) || left.path.localeCompare(right.path));
  return contracts;
}

export async function readContractSnapshot(options) {
  const { target, playbook, warnings, contracts, pathCache } = options;
  const snapshotPath = `${playbook.dir}/${CONTRACTS_DIR}/.hashes.json`;
  const fullPath = path.join(target, ...snapshotPath.split('/'));
  if (!existsSync(fullPath)) {
    return { path: snapshotPath, exists: false, entries: 0 };
  }
  let parsed;
  try {
    parsed = JSON.parse(await readFile(fullPath, 'utf8'));
  } catch (error) {
    warnings.push(memoryWarning('contracts.snapshot.malformed', `Contract snapshot is malformed: ${error.message}.`, [snapshotPath]));
    return { path: snapshotPath, exists: true, entries: 0, malformed: true };
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
    warnings.push(memoryWarning('contracts.snapshot.malformed', 'Contract snapshot does not contain entries.', [snapshotPath]));
    return { path: snapshotPath, exists: true, entries: 0, malformed: true };
  }
  const entries = new Map();
  for (const entry of parsed.entries) {
    if (!isRecord(entry) || typeof entry.path !== 'string' || typeof entry.hash !== 'string') continue;
    if (!isSafePortablePath(entry.path)) {
      warnings.push(memoryWarning('contracts.snapshot.path-invalid', `Contract snapshot contains unsafe path ${entry.path}.`, [snapshotPath]));
      continue;
    }
    entries.set(entry.path, entry);
  }
  for (const contract of contracts) {
    await checkSnapshotPath({ target, entries, portablePath: contract.path, kind: 'contract', contract, warnings });
    for (const appliesTo of contract.appliesTo) {
      const paths = await expandContractPath({ target, pathCache, pattern: appliesTo });
      for (const portablePath of paths) {
        await checkSnapshotPath({ target, entries, portablePath, kind: 'appliesTo', contract, warnings });
      }
    }
    for (const evidence of contract.requiredEvidence) {
      const portablePath = normalizePortablePath(evidence);
      if (!isSafePortablePath(portablePath)) continue;
      const fullEvidencePath = path.join(target, ...portablePath.split('/'));
      if (!existsSync(fullEvidencePath)) {
        warnings.push(memoryWarning('contracts.snapshot.evidence-missing', `${contract.id} evidence path is missing after snapshot: ${portablePath}.`, [contract.path, portablePath]));
        continue;
      }
      await checkSnapshotPath({ target, entries, portablePath, kind: 'evidence', contract, warnings });
    }
  }
  const generatedAtUtc = typeof parsed.generatedAtUtc === 'string' ? parsed.generatedAtUtc : null;
  return {
    path: snapshotPath,
    exists: true,
    generatedAtUtc,
    entries: entries.size
  };
}

export async function checkSnapshotPath(options) {
  const { target, entries, portablePath, kind, contract, warnings } = options;
  const entry = entries.get(portablePath);
  const fullPath = path.join(target, ...portablePath.split('/'));
  if (!entry) {
    warnings.push(memoryWarning('contracts.snapshot.missing-hash', `${contract.id} has no snapshot hash for ${portablePath}.`, [contract.path, portablePath]));
    return;
  }
  if (!existsSync(fullPath)) {
    warnings.push(memoryWarning(kind === 'evidence' ? 'contracts.snapshot.evidence-missing' : 'contracts.snapshot.path-missing', `${contract.id} snapshot path is missing: ${portablePath}.`, [contract.path, portablePath]));
    return;
  }
  const currentHash = await hashFile(fullPath);
  if (currentHash !== entry.hash) {
    warnings.push(memoryWarning('contracts.snapshot.hash-mismatch', `${contract.id} snapshot hash differs for ${portablePath}.`, [contract.path, portablePath]));
  }
}

export async function addSnapshotEntry(entries, options) {
  const { target, portablePath, kind, sourceContract } = options;
  const normalized = normalizePortablePath(portablePath);
  if (!isSafePortablePath(normalized)) return;
  const fullPath = path.join(target, ...normalized.split('/'));
  if (!existsSync(fullPath)) return;
  entries.set(`${kind}:${sourceContract}:${normalized}`, {
    path: normalized,
    kind,
    sourceContract,
    hash: await hashFile(fullPath)
  });
}

export async function expandContractPath(options) {
  const { target, pathCache, pattern } = options;
  const normalized = normalizePortablePath(pattern);
  if (!isSafePortablePath(normalized)) return [];
  if (!hasGlobPattern(normalized)) {
    return existsSync(path.join(target, ...normalized.split('/'))) ? [normalized] : [];
  }
  const files = await pathCache.files();
  return files.filter((file) => globMatches(normalized, file));
}

export function createContractPathCache(target) {
  let filesPromise = null;
  return {
    target,
    async files() {
      filesPromise ??= walkContractFiles(target);
      return filesPromise;
    }
  };
}

export async function contractAppliesToExists(cache, appliesTo) {
  const normalized = normalizePortablePath(appliesTo);
  if (!hasGlobPattern(normalized)) {
    return existsSync(path.join(cache.target, ...normalized.split('/')));
  }
  const files = await cache.files();
  return files.some((file) => globMatches(normalized, file));
}

export function hasGlobPattern(value) {
  return /[*?]/.test(value);
}

export async function walkContractFiles(root) {
  const files = [];
  await walkContractFilesInto(root, root, files);
  files.sort();
  return files;
}

export async function walkContractFilesInto(root, current, files) {
  if (!existsSync(current)) return;
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (CONTRACT_GLOB_EXCLUDED_DIRS.has(entry.name)) continue;
      await walkContractFilesInto(root, path.join(current, entry.name), files);
      continue;
    }
    if (!entry.isFile()) continue;
    files.push(normalizePortablePath(path.relative(root, path.join(current, entry.name))));
  }
}

export function hasRequiredEvidence(body) {
  const normalized = body.replace(/\r\n/g, '\n');
  const match = normalized.match(/^##\s+Required evidence\s*\n([\s\S]*?)(?:\n##\s+|$)/im);
  if (!match) return false;
  return match[1].split('\n').some((line) => line.trim() && !line.trim().startsWith('<!--'));
}

export function extractRequiredEvidencePaths(body) {
  const normalized = body.replace(/\r\n/g, '\n');
  const match = normalized.match(/^##\s+Required evidence\s*\n([\s\S]*?)(?:\n##\s+|$)/im);
  if (!match) return [];
  const paths = [];
  for (const line of match[1].split('\n')) {
    const cleaned = line
      .trim()
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+\.\s+/, '');
    if (!cleaned || cleaned.startsWith('<!--')) continue;
    const markdownLink = cleaned.match(/\[[^\]]+]\(([^)]+)\)/);
    const backtick = cleaned.match(/`([^`]+)`/);
    const candidate = markdownLink?.[1] ?? backtick?.[1] ?? cleaned.split(/\s+/)[0];
    if (!candidate || /^[a-z][a-z0-9+.-]*:/i.test(candidate)) continue;
    const portable = normalizePortablePath(candidate.replace(/[),.;:]$/g, ''));
    if (portable.includes('/') && isSafePortablePath(portable)) {
      paths.push(portable);
    }
  }
  return [...new Set(paths)];
}

export function isStaleDate(value) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const ageMs = Date.now() - date.getTime();
  return ageMs > 90 * 24 * 60 * 60 * 1000;
}

export function truncateText(text, maxChars) {
  if (text.length <= maxChars) return { text, truncated: false };
  const marker = '\n[ai-agent-playbook context truncated]\n';
  const sliceLength = Math.max(0, maxChars - marker.length);
  return {
    text: `${text.slice(0, sliceLength).trimEnd()}${marker}`,
    truncated: true
  };
}

export async function findCoreTemplateFiles(playbookRoot) {
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

export async function worklogSummaryFreshnessChecks(playbookRoot, playbookDir) {
  const checks = [];
  const worklogsRoot = path.join(playbookRoot, ...WORKLOGS_DIR.split('/'));
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
    const monthPath = `${playbookDir}/${WORKLOGS_DIR}/${month}/`;
    const summaryPath = `${playbookDir}/${WORKLOGS_DIR}/summaries/${month}.md`;
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
        [`${playbookDir}/${WORKLOGS_DIR}/${month}/${latestWorklog.name}`, summaryPath]
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

export async function latestFileByModifiedTime(directory, files) {
  const details = await Promise.all(files.map(async (name) => ({
    name,
    info: await stat(path.join(directory, name))
  })));
  details.sort((left, right) => right.info.mtimeMs - left.info.mtimeMs || left.name.localeCompare(right.name));
  return details[0];
}

export function hasExactLine(text, marker) {
  return text.split(/\r?\n/).some((line) => line.trim() === marker);
}

export async function assertDirectory(dir, message) {
  if (!existsSync(dir)) throw new Error(`${message}: ${dir}`);
  const info = await stat(dir);
  if (!info.isDirectory()) throw new Error(`Not a directory: ${dir}`);
}

export async function copyTemplateFile(source, destination, context) {
  const content = await readFile(source, 'utf8');
  await writeManagedFile(destination, content, context);
}

export async function copyTree(sourceRoot, destinationRoot, context) {
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

export async function writeManagedFile(destination, content, context) {
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

export async function ensureGitignoreEntry(target, entry, context) {
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

export async function writeBootstrapManifest(options) {
  const { repoRoot, target, agentContent, localOnly, profile } = options;
  const playbook = resolvePlaybookLayout(target);
  const files = await sourceTemplateManifestEntries({
    repoRoot,
    target,
    playbook,
    includeOnlyExistingAndMatching: false
  });
  const playbookFiles = files.filter((file) => file.path !== 'AGENTS.md');
  const agentHash = hashContent(agentContent);
  playbookFiles.push({
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
    files: playbookFiles,
    installedAtUtc: new Date().toISOString()
  });
}

export async function updateGuideManifestEntries(options) {
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

export async function writeManagedManifest(target, playbook, options) {
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

export async function readManagedManifest(target, playbook = resolvePlaybookLayout(target)) {
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

export function validateManagedManifest(manifest) {
  if (manifest?.schemaVersion !== SCHEMA_VERSION) return 'schemaVersion mismatch';
  if (manifest.source !== INSTALL_SOURCE) return 'source mismatch';
  if (typeof manifest.playbookDir !== 'string') return 'missing playbookDir';
  if (!Array.isArray(manifest.files)) return 'missing files';
  for (const file of manifest.files) {
    if (!file || typeof file.path !== 'string') return 'file entry missing path';
    if (!isPortableManagedPath(file.path)) return `non-portable path ${file.path}`;
    if (typeof file.kind !== 'string' || typeof file.source !== 'string') return `invalid entry ${file.path}`;
    if (!isPortableManagedPath(file.source)) return `non-portable source ${file.source}`;
    if (typeof file.sourceHash !== 'string' || typeof file.targetHash !== 'string') return `missing hashes for ${file.path}`;
  }
  return null;
}

export function isPortableManagedPath(value) {
  const parts = value.split('/');
  return !(
    path.isAbsolute(value) ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:\//.test(value) ||
    value.includes('\\') ||
    value === '.' ||
    parts.some((part) => part === '' || part === '.' || part === '..')
  );
}

export async function managedFileStatuses(target, files) {
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

export function summarizeManagedFiles(files) {
  return {
    total: files.length,
    present: files.filter((file) => file.status === 'present').length,
    modified: files.filter((file) => file.status === 'modified').length,
    missing: files.filter((file) => file.status === 'missing').length
  };
}

export function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] ?? 'unknown';
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function managedStatusConflicts(files) {
  return files
    .filter((file) => file.status === 'modified' || file.status === 'missing')
    .map((file) => ({
      id: file.status === 'modified' ? 'managed.file.modified' : 'managed.file.missing',
      message: `${file.path} is ${file.status}.`,
      paths: [file.path]
    }));
}

export function managedPruneResult(options) {
  const { target, apply, applied, operations, warnings, conflicts } = options;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    applied: Boolean(applied),
    summary: {
      selected: operations.length + conflicts.length,
      removable: operations.length,
      conflicts: conflicts.length,
      warnings: warnings.length
    },
    operations,
    warnings,
    conflicts
  };
}

export function normalizeManagedPath(value) {
  if (value === undefined || value === false || String(value).trim() === '') {
    return { ok: false, missing: true };
  }
  const raw = String(value).trim();
  const normalized = raw.replace(/\\/g, '/').replace(/^\.\/+/, '');
  const parts = normalized.split('/');
  if (
    path.isAbsolute(raw) ||
    path.posix.isAbsolute(normalized) ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized === '.' ||
    parts.some((part) => part === '..' || part === '')
  ) {
    return { ok: false };
  }
  return { ok: true, path: normalized };
}

export async function matchingManifestCandidates(options) {
  return sourceTemplateManifestEntries({
    ...options,
    includeOnlyExistingAndMatching: true
  });
}

export async function sourceTemplateManifestEntries(options) {
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
      kind: rel.startsWith(`${GUIDES_DIR}/`) ? 'guide' : 'playbook',
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

export async function sourceGuideManifestEntries(options) {
  const { repoRoot, target, playbook } = options;
  const sourceRoot = path.join(repoRoot, 'templates', 'project-playbook', ...GUIDES_DIR.split('/'));
  const sourceGuides = await loadGuideManifest(sourceRoot);
  const entries = [];
  for (const guide of sourceGuides) {
    const rel = toPortablePath(guide.path);
    const targetPath = `${playbook.dir}/${GUIDES_DIR}/${rel}`;
    const targetFile = path.join(target, ...targetPath.split('/'));
    if (!existsSync(targetFile)) continue;
    entries.push({
      path: targetPath,
      kind: 'guide',
      source: `templates/project-playbook/${GUIDES_DIR}/${rel}`,
      sourceHash: guide.sourceHash ?? await hashFile(path.join(sourceRoot, ...rel.split('/'))),
      targetHash: await hashFile(targetFile)
    });
  }
  return entries;
}

export function mergeManagedFiles(existingFiles, updates) {
  const byPath = new Map(existingFiles.map((file) => [file.path, file]));
  for (const update of updates) {
    byPath.set(update.path, update);
  }
  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export async function hasGitignoreEntry(target, entry) {
  const file = path.join(target, '.gitignore');
  if (!existsSync(file)) return false;
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/).map((line) => line.trim());
  return lines.includes(entry);
}

export async function removeEmptyManagedDirectories(target, playbookRoot, managedPaths) {
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

export async function playbookReferenceUpdatePlan(target, playbookRoot) {
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

export function replaceLegacyPlaybookRefs(text) {
  return text
    .replace(/\.ai-playbook\//g, `${DEFAULT_PLAYBOOK_DIR}/`)
    .replace(/(^|[^A-Za-z0-9_.-])ai-playbook\//g, `$1${DEFAULT_PLAYBOOK_DIR}/`);
}

export async function gitignoreMigrationPlan(target) {
  const file = path.join(target, '.gitignore');
  const existing = existsSync(file) ? await readFile(file, 'utf8') : '';
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(`${DEFAULT_PLAYBOOK_DIR}/`)) return null;
  const ignoredLegacyDirs = LEGACY_PLAYBOOK_DIRS.filter((directory) => lines.includes(`${directory}/`));
  if (ignoredLegacyDirs.length === 0) return null;
  return {
    id: 'gitignore.add-active-playbook',
    action: 'append',
    message: `Add ${DEFAULT_PLAYBOOK_DIR}/ to .gitignore because legacy playbook paths are already ignored.`,
    paths: ['.gitignore', `${DEFAULT_PLAYBOOK_DIR}/`, ...ignoredLegacyDirs.map((directory) => `${directory}/`)]
  };
}

export async function applyGitignoreMigration(target) {
  const file = path.join(target, '.gitignore');
  const existing = existsSync(file) ? await readFile(file, 'utf8') : '';
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(`${DEFAULT_PLAYBOOK_DIR}/`)) return;
  if (!LEGACY_PLAYBOOK_DIRS.some((directory) => lines.includes(`${directory}/`))) return;
  const prefix = existing && !existing.endsWith('\n') ? `${existing}\n` : existing;
  await writeFile(file, `${prefix}${DEFAULT_PLAYBOOK_DIR}/\n`);
}

export async function guideDiff(sourceFile, targetFile) {
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

export function normalizedLines(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
  return normalized.length ? normalized.split('\n') : [];
}

export async function loadGuideManifest(sourceRoot) {
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

export async function loadGuideManifestFallback(sourceRoot) {
  const sourceFiles = await walkFiles(sourceRoot, (file) => file.endsWith('.md'));
  return Promise.all(sourceFiles.map(async (file) => ({
    path: toPortablePath(path.relative(sourceRoot, file)),
    sourceHash: await hashFile(file)
  })));
}

export async function hashFile(file) {
  const content = await readFile(file);
  return createHash('sha256').update(content).digest('hex');
}

export function hashContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function writeScaffold(file, content, options) {
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

export function requireTitle(title) {
  if (!title || !title.trim()) {
    throw new Error('Missing --title.');
  }
}

export async function walkFiles(root, predicate) {
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
