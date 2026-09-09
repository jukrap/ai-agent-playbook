import { constants } from 'node:fs';
import { open, opendir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { resolveRecordContext } from './workspace.mjs';
import { noLinks, readJson, readText, relativePath, safePath, sha256, statOrNull, writeAtomic } from './fs-safety.mjs';
import { integerLimit, MAX_CONTENT_CHARS, pageItems, scopeHash, textBoundary } from './record-paging.mjs';

const HEADER_BYTES = 16_384;
const MAX_ENTRIES = 2000;
const MAX_SCAN_BYTES = 8_000_000;
const MAX_DEPTH = 16;
const MAX_LITERAL_CHARS = 500;
const REPO_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'cache', 'tmp', 'summaries', 'summary']);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const report = (kind, extra) => ({ schemaVersion: '2', kind, ok: true, writes: false, ...extra });

function literal(value, name, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > MAX_LITERAL_CHARS ||
      /[\p{Cc}\p{Cs}\u2028-\u202e\u2066-\u2069]/u.test(value)) {
    throw new Error(`${name} must be a single-line Unicode string of at most ${MAX_LITERAL_CHARS} characters.`);
  }
  return value; // Preserve supplied literals; only the filename is normalized.
}

function slug(value) {
  const normalized = value.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  let result = '';
  for (const character of normalized) {
    if (Buffer.byteLength(result + character, 'utf8') > 72) break;
    result += character;
  }
  result = result.replace(/-+$/g, '') || 'record';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9]|readme|index|summary|summaries)$/i.test(result)) result = 'record-' + result;
  return result;
}

function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00.000Z')) && new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) === value;
}

function validTimestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(value) &&
    validDay(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
}

/** Read only the leading record comment, optionally following a Markdown title. Invalid/legacy metadata returns null. */
export function parseRecordMetadata(text) {
  if (typeof text !== 'string') return null;
  const prefix = text.slice(0, HEADER_BYTES).replace(/^\uFEFF/, '');
  const match = /^\s*(?:# [^\r\n]*\r?\n\s*)?<!-- aapb-record ([^\r\n]*?) -->/.exec(prefix);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (!data || !['worklog', 'knowledge'].includes(data.kind) || typeof data.id !== 'string' ||
        !data.id || data.id.length > 128 || /[\p{Cc}\p{Cs}]/u.test(data.id) || !validTimestamp(data.createdAt) ||
        !Array.isArray(data.repos) || data.repos.length > 256 ||
        data.repos.some((id) => typeof id !== 'string' || !REPO_ID.test(id)) ||
        new Set(data.repos).size !== data.repos.length) return null;
    literal(data.topic, 'topic', true);
    return { kind: data.kind, id: data.id, createdAt: data.createdAt, repos: data.repos, topic: data.topic };
  } catch { return null; }
}

function summaryPath(relative) {
  const parts = relative.toLowerCase().split('/');
  if (parts.slice(0, -1).some((part) => part === 'summaries' || part === 'summary')) return true;
  const name = parts.at(-1);
  if (/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.\d{3}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-/.test(name)) return false;
  return /^(?:readme|index|summary|summaries)(?:[._-].*)?\.md$/.test(name) ||
    /(?:^|[-_.])summar(?:y|ies)(?:[-_.]|\.md$)/.test(name);
}

/** Classify conventional/custom record paths with the same summary exclusion policy. */
export function classifyRecordPath(relative, worklogRoots = ['worklogs', 'workflows/worklogs']) {
  try { relative = relativePath(relative); } catch { return null; }
  if (!/\.md$/i.test(relative) || summaryPath(relative)) return null;
  if (worklogRoots.some((root) => relative.toLowerCase().startsWith(relativePath(root).toLowerCase() + '/'))) return 'worklog';
  if (/^knowledge\//i.test(relative)) return 'knowledge';
  return null;
}

function recordRepos(context, repo, inferCurrent) {
  const members = context.workspace?.config?.repositories ?? [];
  if (repo !== undefined) {
    if (typeof repo !== 'string' || !REPO_ID.test(repo) || !members.some((member) => member.id === repo)) {
      throw new Error('repo must identify a registered workspace repository.');
    }
    return [repo];
  }
  const active = typeof context.activeRepo === 'string' ? context.activeRepo : context.activeRepo?.id;
  if (!inferCurrent || !active) return [];
  if (!members.some((member) => member.id === active)) throw new Error('Current repository is not registered in the workspace.');
  return [active];
}

async function recordManifest(context) {
  if (!context.exists) return {};
  const file = await safePath(context.directory, 'manifest.json');
  if (!await statOrNull(file)) return {};
  const manifest = await readJson(file, 500_000);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Expected a record manifest object.');
  return manifest;
}

async function configuredWorklogs(context, manifest = undefined) {
  manifest ??= await recordManifest(context);
  if (manifest.recordPaths?.worklogs === undefined) return null;
  const relative = relativePath(manifest.recordPaths.worklogs);
  if (/[<>"|?*\x7f]/.test(relative) || relative.split('/').some((part) => part.startsWith('.') || SKIP_DIRS.has(part.toLowerCase()))) {
    throw new Error('Unsafe manifest recordPaths.worklogs.');
  }
  await directoryPath(context, relative);
  return relative;
}

async function directoryPath(context, relative) {
  const file = await safePath(context.directory, relative);
  const st = await statOrNull(file);
  if (st && !st.isDirectory()) throw new Error('Record directory is not a directory: ' + relative);
  return file;
}

async function worklogDirectory(context, manifest) {
  const configured = await configuredWorklogs(context, manifest);
  if (configured) return configured;
  const legacy = await directoryPath(context, 'workflows/worklogs');
  return await statOrNull(legacy) ? 'workflows/worklogs' : 'worklogs';
}

async function draft(kind, { target, title, lang = undefined, repo = undefined, topic = undefined, date = undefined, dryRun = false, recordSource = undefined }) {
  literal(title, 'title');
  if (lang !== undefined && !['en', 'ko'].includes(lang)) throw new Error('lang must be en or ko.');
  if (typeof dryRun !== 'boolean') throw new Error('dryRun must be a boolean.');
  const topicLiteral = topic === undefined ? (kind === 'knowledge' ? title : '') : literal(topic, 'topic');
  if (date !== undefined && !validDay(date)) throw new Error('date must be a real calendar date in YYYY-MM-DD format.');
  const context = await resolveRecordContext({ target, recordSource });
  const repos = recordRepos(context, repo, true);
  if (!context.exists) throw new Error('No playbook exists; bootstrap explicitly before authoring records.');
  const manifest = await recordManifest(context);
  lang ??= manifest.lang ?? manifest.language ?? 'en';
  if (!['en', 'ko'].includes(lang)) throw new Error('Manifest language must be en or ko, or select lang explicitly.');
  const createdAt = new Date().toISOString(), id = randomUUID();
  const day = date ?? createdAt.slice(0, 10);
  const directory = kind === 'worklog' ? await worklogDirectory(context, manifest) : 'knowledge';
  await directoryPath(context, directory);
  const filename = kind === 'worklog'
    ? `${directory}/${day.slice(0, 7)}/${day}-${createdAt.slice(11, 23).replaceAll(':', '-')}-${id}-${slug(title)}.md`
    : `${directory}/${slug(topicLiteral)}.md`;
  const file = await safePath(context.directory, filename);
  // Both preview and apply refuse duplicates; the exclusive write below also closes the concurrent-creation race.
  if (await statOrNull(file)) throw new Error('Record already exists; existing content was preserved: ' + filename);
  const metadata = { kind, id, createdAt, repos, topic: topicLiteral };
  const serialized = JSON.stringify(metadata).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
  const templateUrl = new URL(lang === 'ko'
    ? `../translations/ko/templates/record-artifacts/${kind}.ko.md`
    : `../templates/record-artifacts/${kind}.md`, import.meta.url);
  const template = await readText(fileURLToPath(templateUrl));
  // A replacement callback preserves literal $&, $`, and other replacement-string syntax in user text.
  const content = template.replace(/\{\{(metadata|title)\}\}/g, (_, key) => key === 'metadata' ? `<!-- aapb-record ${serialized} -->` : title);
  if (!dryRun) {
    try { await writeAtomic(file, content, { exclusive: true }); }
    catch (error) {
      if (error.code === 'EEXIST') throw new Error('Record already exists; existing content was preserved: ' + filename);
      throw error;
    }
  }
  return report(`aapb.${kind}.create`, { writes: !dryRun, applied: !dryRun, dryRun, lang, playbook: context.name,
    path: filename, metadata, content, userEditable: true });
}

export async function createWorklog({ target, title, lang = undefined, repo = undefined, topic = undefined, date = undefined, dryRun = false, recordSource = undefined }) {
  return draft('worklog', { target, title, lang, repo, topic, date, dryRun, recordSource });
}

export async function createKnowledge({ target, title, lang = undefined, repo = undefined, topic = undefined, dryRun = false, recordSource = undefined }) {
  return draft('knowledge', { target, title, lang, repo, topic, dryRun, recordSource });
}

async function readHeader(file, budget, onRead) {
  await noLinks(file);
  const before = await statOrNull(file);
  if (!before?.isFile()) throw new Error('Expected a regular record file.');
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || before.dev !== opened.dev || before.ino !== opened.ino || before.size !== opened.size || before.mtimeMs !== opened.mtimeMs) {
      throw new Error('Record changed during header inspection.');
    }
    const buffer = Buffer.alloc(Math.min(HEADER_BYTES, budget, opened.size));
    let size = 0;
    while (size < buffer.length) {
      const result = await handle.read(buffer, size, buffer.length - size, size);
      if (!result.bytesRead) break;
      size += result.bytesRead;
      onRead(result.bytesRead);
    }
    const after = await handle.stat();
    if (size !== buffer.length || after.size !== opened.size || after.mtimeMs !== opened.mtimeMs) throw new Error('Record changed during header inspection.');
    const bytes = buffer.subarray(0, size);
    if (bytes.includes(0)) throw new Error('Binary files are not text records.');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes, { stream: size < opened.size }).replace(/^\uFEFF/, '');
    return { text, budgetLimited: Math.min(HEADER_BYTES, opened.size) > budget,
      signature: [sha256(bytes), opened.size, opened.mtimeMs, opened.ctimeMs] };
  } finally { await handle.close(); }
}

// Shared bounded metadata inspection; callers account for the bytes in their scan budget.
export async function readRecordHeader(file, budget = HEADER_BYTES) {
  let bytes = 0;
  const result = await readHeader(file, budget, (count) => { bytes += count; });
  return { ...result, bytes };
}

function heading(text, relative) {
  const value = /^ {0,3}# +([^\r\n]+)/m.exec(text)?.[1] ?? path.posix.basename(relative, path.posix.extname(relative));
  return value.slice(0, textBoundary(value, Math.min(value.length, MAX_LITERAL_CHARS)));
}

export function recordMonth(relative, metadata) {
  const day = /^(\d{4}-\d{2}-\d{2})(?:[-T_.]|$)/.exec(path.posix.basename(relative))?.[1];
  if (validDay(day)) return day.slice(0, 7);
  const folder = relative.split('/').slice(0, -1).reverse().find((part) => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(part));
  return folder ?? metadata?.createdAt.slice(0, 7) ?? null;
}

export async function listWorklogs({ target, repo = undefined, topic = undefined, month = undefined, pageSize = undefined, maxChars = undefined, cursor = undefined, recordSource = undefined }) {
  integerLimit(pageSize, 20, 100);
  integerLimit(maxChars, 12000, MAX_CONTENT_CHARS);
  if (topic !== undefined) literal(topic, 'topic', true);
  if (month !== undefined && (typeof month !== 'string' || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month))) throw new Error('month must use YYYY-MM format.');
  const context = await resolveRecordContext({ target, recordSource });
  recordRepos(context, repo, false); // Listing without an explicit filter includes all member records.
  const configured = await configuredWorklogs(context);
  const roots = [...new Set([configured, 'workflows/worklogs', 'worklogs'].filter(Boolean))].sort(compare);
  const items = [], warnings = [], signatures = [], visitedDirectories = new Set();
  let visited = 0, inspected = 0, bytes = 0, limited = false;
  const warn = (relative, code, message) => warnings.push({ path: relative, code, message });
  async function walk(relative, depth = 0) {
    if (limited || visitedDirectories.has(relative)) return;
    visitedDirectories.add(relative);
    if (depth > MAX_DEPTH) { warn(relative, 'depth-limit', 'Record directory depth limit reached.'); return; }
    let file;
    try {
      file = await directoryPath(context, relative);
      if (!await statOrNull(file)) return;
    } catch { warn(relative, 'unsafe-directory', 'Skipped an unsafe or unreadable record directory.'); return; }
    // Bound directory enumeration before sorting. Oversized directories yield no arbitrary partial subset.
    const entries = [];
    try {
      for await (const entry of await opendir(file)) {
        if (month && entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name) && entry.name !== month) continue;
        if (month && entry.isFile() && /^\d{4}-\d{2}-\d{2}[-_.]/.test(entry.name) && !entry.name.startsWith(month + '-')) continue;
        if (++visited > MAX_ENTRIES) { limited = true; warn(relative, 'traversal-limit', 'Record traversal limit reached.'); return; }
        entries.push(entry);
      }
    } catch { warn(relative, 'unreadable-directory', 'Could not enumerate record directory.'); return; }
    for (const entry of entries.sort((a, b) => compare(a.name, b.name))) {
      if (limited) return;
      const child = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) { warn(child, 'linked-record', 'Skipped linked record.'); continue; }
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name.toLowerCase())) await walk(child, depth + 1);
      } else if (entry.isFile() && /\.md$/i.test(entry.name) && !summaryPath(child)) {
        if (bytes >= MAX_SCAN_BYTES) { limited = true; warn(child, 'scan-byte-limit', 'Record header inspection limit reached.'); return; }
        try {
          const header = await readHeader(await safePath(context.directory, child), MAX_SCAN_BYTES - bytes, (count) => { bytes += count; });
          if (header.budgetLimited) { limited = true; warn(child, 'scan-byte-limit', 'Record header inspection limit reached.'); return; }
          inspected++;
          signatures.push([child, header.signature]);
          const metadata = parseRecordMetadata(header.text);
          if (metadata && metadata.kind !== 'worklog') continue;
          if (!metadata && /<!-- aapb-record /.test(header.text)) warn(child, 'invalid-metadata', 'Metadata is invalid; record is listed using its heading and path.');
          const item = { path: child, title: heading(header.text, child), kind: 'worklog', id: metadata?.id ?? null,
            createdAt: metadata?.createdAt ?? null, repos: metadata?.repos ?? [], topic: metadata?.topic ?? null,
            month: recordMonth(child, metadata), legacy: !metadata };
          if ((repo === undefined || item.repos.includes(repo) || context.recordSource === 'repo:' + repo) && (topic === undefined || item.topic === topic) &&
              (month === undefined || item.month === month)) items.push(item);
        } catch { warn(child, 'unreadable-record', 'Skipped an unsafe, changing or unreadable record header.'); }
      }
    }
  }
  if (context.exists) for (const root of roots) await walk(root);
  items.sort((a, b) => compare(a.path, b.path));
  const scan = { complete: !limited && !warnings.length, visitedEntries: Math.min(visited, MAX_ENTRIES),
    inspectedFiles: inspected, inspectedBytes: bytes, headerOnly: true,
    limits: { entries: MAX_ENTRIES, headerBytes: HEADER_BYTES, textBytes: MAX_SCAN_BYTES, depth: MAX_DEPTH } };
  return pageItems({ items, key: 'items', pageSize, maxChars, cursor,
    metadata: report('aapb.worklog.list', { exists: context.exists, playbook: context.name, filters: { repo: repo ?? null, topic: topic ?? null, month: month ?? null },
      scan, warnings: { total: warnings.length, sample: warnings.slice(0, 3), hasMore: warnings.length > 3 } }),
    scope: scopeHash({ root: context.directory, workspace: context.workspace?.hash ?? null, recordSource: context.recordSource,
      roots, repo, topic, month, signatures, items, warnings, scan }) });
}
