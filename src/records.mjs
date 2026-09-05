import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, safePath, statOrNull, noLinks, readText, readJson, readBytes, sha256, writeAtomic, relativePath } from './fs-safety.mjs';
import { DEFAULT_CONTENT_CHARS, MAX_CONTENT_CHARS, fitsResponse, integerLimit, pagingError, scopeHash, cursorAt, readCursor, pageItems, textBoundary } from './record-paging.mjs';

export const PLAYBOOK_NAMES = ['.ai-agent-playbook', '.ai-playbook', 'ai-playbook'];
export const RECORD_TOOLS = ['aapb_status', 'aapb_search', 'aapb_read', 'aapb_validate'];
const MARKER = '.ai-agent-playbook-install.json';
const MAX_FILES = 2000;
const MAX_FILE_BYTES = 500_000;
const MAX_SCAN_BYTES = 32_000_000;
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.jsonl', '.yaml', '.yml', '.toml']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'cache', 'tmp', 'objects']);

export async function locatePlaybook(target) {
  const root = await projectRoot(target);
  const candidates = [];
  for (const name of PLAYBOOK_NAMES) {
    const directory = await safePath(root, name);
    const st = await statOrNull(directory);
    if (st) {
      if (!st.isDirectory()) throw new Error('Playbook path is not a directory: ' + name);
      candidates.push({ name, directory });
    }
  }
  if (candidates.length > 1) throw new Error('Multiple playbook roots exist; select and reconcile them before using records.');
  return { root, ...(candidates[0] ?? { name: PLAYBOOK_NAMES[0], directory: path.join(root, PLAYBOOK_NAMES[0]) }), exists: candidates.length === 1 };
}
function report(kind, extra = {}) { return { schemaVersion: '2', kind, ok: true, writes: false, ...extra }; }
function managedFiles(marker, playbookName) {
  if (!Array.isArray(marker?.files)) return marker?.files ?? {};
  const result = {};
  for (const entry of marker.files) {
    const original = entry.path ?? entry.relativePath;
    if (typeof original !== 'string' || !original.startsWith(playbookName + '/')) continue;
    result[original.slice(playbookName.length + 1)] = entry.sourceHash;
  }
  return result;
}
function warning(path, code, message) { return { path, code, message: String(message).slice(0, 1024) }; }
function warningSummary(warnings) { return { total: warnings.length, sample: warnings.slice(0, 3), hasMore: warnings.length > 3 }; }
async function inventory(playbook) {
  const records = [], warnings = [], excluded = new Set();
  let visited = 0, limited = false;
  async function walk(dir) {
    if (limited) return;
    await noLinks(dir);
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (++visited > MAX_FILES) { limited = true; warnings.push(warning('', 'traversal-limit', 'Record traversal limit reached.')); return; }
      const file = path.join(dir, entry.name);
      const rel = path.relative(playbook.directory, file).replaceAll('\\', '/');
      if (entry.isSymbolicLink()) { warnings.push(warning(rel, 'linked-record', 'Skipped linked record.')); continue; }
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) excluded.add(entry.name);
        else await walk(file);
      } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) && entry.name !== MARKER) records.push(rel);
      if (limited) return;
    }
  }
  if (playbook.exists) await walk(playbook.directory);
  return { records, warnings, limited, visited: Math.min(visited, MAX_FILES), excluded: [...excluded].sort() };
}
function scanSummary(data, extra = {}) {
  return { complete: !data.limited && !data.warnings.length, visitedEntries: data.visited,
    recordCount: data.records.length, excludedDirectories: data.excluded,
    limits: { entries: MAX_FILES, fileBytes: MAX_FILE_BYTES, textBytes: MAX_SCAN_BYTES }, ...extra };
}
async function inspectRecords(pb) {
  const data = await inventory(pb), documents = [], hashes = [], warnings = [...data.warnings];
  let bytes = 0, stopped = false;
  for (const relative of data.records) {
    try {
      const file = await safePath(pb.directory, relative), info = await statOrNull(file);
      if (info?.size > MAX_SCAN_BYTES - bytes) {
        warnings.push(warning(relative, 'scan-byte-limit', 'Aggregate text inspection limit reached.'));
        stopped = true; break;
      }
      const content = await readBytes(file, Math.min(MAX_FILE_BYTES, MAX_SCAN_BYTES - bytes));
      bytes += content.length;
      hashes.push([relative, sha256(content)]);
      if (content.includes(0)) throw new Error('Binary files are not text records.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(content).replace(/^\uFEFF/, '');
      documents.push({ relative, text });
    } catch (e) { warnings.push(warning(relative, 'unreadable-record', e.message)); }
  }
  const scan = { ...scanSummary(data), complete: !data.limited && !stopped && !warnings.length,
    inspectedFiles: documents.length, inspectedBytes: bytes, uninspectedFiles: data.records.length - documents.length };
  return { ...data, documents, hashes: Object.fromEntries(hashes), warnings, scan, snapshot: scopeHash({ root: pb.directory, records: data.records, hashes, warnings, scan }) };
}
export async function playbookStatus({ target, view = 'summary', pageSize, maxChars, cursor }) {
  if (!['summary', 'records', 'warnings'].includes(view)) throw new Error('Status view must be summary, records or warnings.');
  const pb = await locatePlaybook(target), data = await inventory(pb);
  let layout = pb.exists ? 'legacy' : 'missing', manifest = null;
  if (pb.exists && await statOrNull(path.join(pb.directory, 'manifest.json'))) {
    manifest = await readJson(await safePath(pb.directory, 'manifest.json'), MAX_FILE_BYTES);
    layout = manifest.layoutKind ?? 'legacy';
  }
  const metadata = report('aapb.status', {
    exists: pb.exists, playbook: pb.name, layout, view,
    entrypoint: data.records.includes('CURRENT.md') ? 'CURRENT.md' : data.records.includes('START_HERE.md') ? 'START_HERE.md' : null,
    recordCount: data.records.length, warnings: warningSummary(data.warnings), scan: scanSummary(data), complete: !data.limited && !data.warnings.length,
    validation: { configurationInspected: Boolean(manifest), runtimeVerified: false }
  });
  if (view === 'summary') { if (cursor !== undefined) throw new Error('A summary does not accept a cursor.'); return metadata; }
  return pageItems({ items: view === 'records' ? data.records : data.warnings, key: 'items', metadata,
    scope: scopeHash({ root: pb.directory, kind: metadata.kind, view, manifest, records: data.records, warnings: data.warnings }), cursor, pageSize, maxChars });
}
export async function playbookRead({ target, path: recordPath = 'CURRENT.md', startLine, endLine, maxChars, cursor }) {
  const pb = await locatePlaybook(target);
  if (!pb.exists) throw new Error('No playbook exists; bootstrap only when this project needs records.');
  const relative = relativePath(recordPath);
  if (!TEXT_EXTENSIONS.has(path.extname(relative))) throw new Error('Only text records can be read.');
  const bytes = await readBytes(await safePath(pb.directory, relative), MAX_FILE_BYTES);
  if (bytes.includes(0)) throw new Error('Binary files are not text records.');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  const hash = sha256(bytes), scope = scopeHash({ root: pb.directory, kind: 'aapb.read', path: relative, hash });
  const cap = integerLimit(maxChars, DEFAULT_CONTENT_CHARS, MAX_CONTENT_CHARS);
  const offsets = [0];
  for (const match of text.matchAll(/\r\n|\r|\n/g)) offsets.push(match.index + match[0].length);
  const continuation = readCursor(cursor, scope, text.length);
  let start, rangeEnd;
  if (continuation) {
    if (startLine !== undefined || endLine !== undefined) throw new Error('A read cursor replaces startLine and endLine.');
    start = continuation.offset; rangeEnd = continuation.end;
    if (!Number.isSafeInteger(rangeEnd) || rangeEnd < start || rangeEnd > text.length || textBoundary(text, start) !== start || textBoundary(text, rangeEnd) !== rangeEnd) throw pagingError('aapb.cursor-invalid', 'Invalid read continuation range. Restart the read.');
  } else {
    const first = integerLimit(startLine, 1, 1_000_000), last = endLine === undefined ? offsets.length : integerLimit(endLine, offsets.length, 1_000_000);
    if (last < first && endLine !== undefined) throw new Error('endLine must not precede startLine.');
    start = offsets[first - 1] ?? text.length;
    rangeEnd = Math.max(start, offsets[last] ?? text.length);
  }
  const position = (offset) => {
    let line = 0;
    while (line + 1 < offsets.length && offsets[line + 1] <= offset) line++;
    return { line: line + 1, column: offset - offsets[line] + 1, offset };
  };
  const resultAt = (end) => report('aapb.read', { path: relative, sha256: hash, totalLines: offsets.length,
    startLine: position(start).line, position: position(start), nextPosition: end < rangeEnd ? position(end) : null,
    content: text.slice(start, end), truncated: end < rangeEnd,
    nextCursor: end < rangeEnd ? cursorAt(scope, end, { end: rangeEnd }) : null });
  let low = start, high = Math.min(start + cap, rangeEnd);
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fitsResponse(resultAt(textBoundary(text, mid)))) low = mid; else high = mid - 1;
  }
  let end = textBoundary(text, low);
  if (end < rangeEnd) {
    const newline = text.lastIndexOf('\n', end - 1);
    if (newline >= start) end = newline + 1;
  }
  if (end === start && start < rangeEnd) throw pagingError('aapb.page-budget-too-small', 'The read budget cannot hold the next Unicode character. Increase maxChars.');
  return resultAt(end);
}
export async function playbookSearch({ target, query, maxResults, maxChars, cursor, view = 'results' }) {
  if (typeof query !== 'string' || !query.trim() || query.length > 1000) throw new Error('Search requires a non-empty literal query of at most 1000 characters.');
  if (!['results', 'warnings'].includes(view)) throw new Error('Search view must be results or warnings.');
  const pb = await locatePlaybook(target), data = await inspectRecords(pb), results = [];
  const needle = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu');
  let matchLimit = false;
  outer: for (const { relative, text } of data.documents) {
    const lines = text.split(/\r\n|\r|\n/);
    for (let i = 0; i < lines.length; i++) {
      const match = needle.exec(lines[i])?.index;
      if (match === undefined) continue;
      if (results.length >= 10000) { matchLimit = true; break outer; }
      const start = textBoundary(lines[i], Math.max(0, match - 160));
      const end = textBoundary(lines[i], Math.min(lines[i].length, start + Math.max(500, query.length + 160)));
      results.push({ path: relative, line: i + 1, column: match + 1, text: lines[i].slice(start, end), excerptStartColumn: start + 1,
        excerptTruncated: start > 0 || end < lines[i].length });
    }
  }
  if (matchLimit) data.warnings.push(warning('', 'match-limit', 'Search match limit reached; narrow the query.'));
  const scan = { ...data.scan, complete: data.scan.complete && !matchLimit, matchLimit: 10000 };
  return pageItems({ items: view === 'results' ? results : data.warnings, key: 'results',
    metadata: report('aapb.search', { query, view, matchCount: results.length, scannedFiles: data.documents.length, scan, warnings: warningSummary(data.warnings) }),
    scope: scopeHash({ snapshot: data.snapshot, kind: 'aapb.search', query, view }), cursor, pageSize: maxResults, maxChars });
}
export async function playbookValidate({ target, view = 'issues', pageSize, maxChars, cursor }) {
  if (!['summary', 'issues', 'warnings'].includes(view)) throw new Error('Validation view must be summary, issues or warnings.');
  const pb = await locatePlaybook(target), data = await inspectRecords(pb), issues = [];
  let issuesLimited = false;
  const addIssue = (issue) => { if (issues.length < 10000) issues.push(issue); else issuesLimited = true; };
  if (!pb.exists) addIssue({ path: pb.name, code: 'missing', message: 'No playbook found.' });
  if (pb.exists && !data.documents.some((d) => d.relative === 'CURRENT.md')) addIssue({ path: 'CURRENT.md', code: 'missing-entrypoint', message: 'A readable current-state entrypoint is missing.' });
  for (const { relative, text } of data.documents) {
    if (issuesLimited) break;
    if (relative.endsWith('.json')) {
      try { JSON.parse(text); } catch { addIssue({ path: relative, code: 'invalid-json', message: 'Invalid JSON record.' }); }
    }
    if (!relative.endsWith('.md')) continue;
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      if (issuesLimited) break;
      const link = match[1].replace(/^<|>$/g, '');
      if (/^(?:[a-z]+:|#|\/)/i.test(link)) continue;
      const message = link.slice(0, 512), messageTruncated = link.length > 512;
      const decoded = (() => { try { return decodeURIComponent(link.split('#')[0]); } catch { return null; } })();
      if (decoded === null) { addIssue({ path: relative, code: 'invalid-link', message, messageTruncated }); continue; }
      if (!decoded) continue;
      const full = path.resolve(pb.directory, path.dirname(relative), decoded);
      const projectRelative = path.relative(pb.root, full).replaceAll('\\', '/');
      try {
        const bounded = await safePath(pb.root, projectRelative);
        if (!await statOrNull(bounded)) addIssue({ path: relative, code: 'missing-link', message, messageTruncated });
      } catch { addIssue({ path: relative, code: 'unsafe-link', message, messageTruncated }); }
    }
  }
  const markerFile = path.join(pb.directory, MARKER);
  let markerHash = null;
  if (pb.exists && await statOrNull(markerFile)) {
    try {
      const markerBytes = await readBytes(markerFile, Math.min(MAX_FILE_BYTES, MAX_SCAN_BYTES - data.scan.inspectedBytes));
      data.scan.inspectedBytes += markerBytes.length;
      markerHash = sha256(markerBytes);
      const marker = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(markerBytes).replace(/^\uFEFF/, ''));
      const entries = managedFiles(marker, pb.name);
      for (const [name, expected] of Object.entries(entries)) {
        if (issuesLimited) break;
        const hash = typeof expected === 'string' ? expected : expected?.sourceHash;
        if (!hash) continue;
        const file = await safePath(pb.directory, name);
        if (!await statOrNull(file)) addIssue({ path: name, code: 'managed-missing', message: 'Managed file is missing.' });
        else {
          let actual = data.hashes[name];
          if (!actual) {
            const bytes = await readBytes(file, Math.min(MAX_FILE_BYTES, MAX_SCAN_BYTES - data.scan.inspectedBytes));
            data.scan.inspectedBytes += bytes.length; actual = sha256(bytes);
          }
          if (actual !== hash) addIssue({ path: name, code: 'managed-modified', message: 'Preserved user modification; do not overwrite.' });
        }
      }
    } catch (e) { data.scan.complete = false; addIssue({ path: MARKER, code: 'invalid-marker', message: String(e.message).slice(0, 1024) }); }
  }
  if (issuesLimited) { data.scan.complete = false; data.warnings.push(warning('', 'issue-limit', 'Validation issue limit reached; inspect source files directly.')); }
  const counts = {};
  for (const issue of issues) counts[issue.code] = (counts[issue.code] ?? 0) + 1;
  const metadata = report('aapb.validate', { ok: issues.length === 0 && data.scan.complete, view, issueCount: issues.length, issueCounts: counts,
    warnings: warningSummary(data.warnings), scan: data.scan, complete: data.scan.complete, configurationOnly: true, runtimeVerified: false });
  if (view === 'summary') { if (cursor !== undefined) throw new Error('A summary does not accept a cursor.'); return metadata; }
  return pageItems({ items: view === 'issues' ? issues : data.warnings, key: 'issues', metadata,
    scope: scopeHash({ snapshot: data.snapshot, markerHash, kind: metadata.kind, view, issues }), cursor, pageSize, maxChars });
}

export async function bootstrapRecords({ target, repoRoot, dryRun = false, localOnly = false }) {
  const pb = await locatePlaybook(target);
  if (pb.exists) return report('playbook.bootstrap', { applied: false, operations: [], warnings: ['Existing records and project instructions were preserved.'] });
  const current = await readText(path.join(repoRoot, 'templates/project-playbook/CURRENT.md'));
  const manifest = JSON.stringify({ schemaVersion: '2', source: 'ai-agent-playbook', layoutKind: 'minimal' }, null, 2) + '\n';
  const contents = { 'CURRENT.md': current, 'manifest.json': manifest };
  const marker = JSON.stringify({ schemaVersion: 2, source: 'ai-agent-playbook', files: { 'manifest.json': sha256(manifest) }, userFiles: ['CURRENT.md'] }, null, 2) + '\n';
  const operations = Object.keys(contents).concat(MARKER);
  let excludeFile, excludeText;
  if (localOnly) {
    // .git may be a worktree pointer; git resolves the correct local exclude file.
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const gitPath = await promisify(execFile)('git', ['-C', pb.root, 'rev-parse', '--git-path', 'info/exclude'], { encoding: 'utf8' });
    excludeFile = path.resolve(pb.root, gitPath.stdout.trim());
    await noLinks(excludeFile);
    excludeText = await statOrNull(excludeFile) ? await readText(excludeFile) : '';
    operations.push('git-local-exclude');
  }
  if (!dryRun) {
    await noLinks(pb.directory);
    await mkdir(pb.directory); // exclusive creation: do not race an existing bootstrap
    for (const [name, body] of Object.entries({ ...contents, [MARKER]: marker })) await writeAtomic(await safePath(pb.directory, name), body, { exclusive: true });
    if (localOnly && !excludeText.split(/\r?\n/).some((line) => line.trim() === '.ai-agent-playbook/')) {
      if ((await statOrNull(excludeFile) ? await readText(excludeFile) : '') !== excludeText) throw new Error('Local exclude changed; preserve it and add .ai-agent-playbook/ manually.');
      await writeAtomic(excludeFile, excludeText + (excludeText && !excludeText.endsWith('\n') ? '\n' : '') + '.ai-agent-playbook/\n');
    }
  }
  return report('playbook.bootstrap', { writes: !dryRun, applied: !dryRun, operations, localOnly, agentsPreserved: true });
}
export async function migrateRecords({ target, apply = false }) {
  const pb = await locatePlaybook(target);
  if (!pb.exists) throw new Error('No records to migrate.');
  const file = await safePath(pb.directory, 'manifest.json');
  const original = await statOrNull(file) ? await readBytes(file) : null;
  const old = original ? JSON.parse(new TextDecoder().decode(original).replace(/^\uFEFF/, '')) : {};
  if (old.layoutKind === 'minimal') return report('playbook.migrate', { applied: false, operations: [], conflicts: [] });
  const conflicts = [];
  const markerFile = await safePath(pb.directory, MARKER);
  const marker = await statOrNull(markerFile) ? await readJson(markerFile) : null;
  const entries = managedFiles(marker, pb.name);
  const entry = entries['manifest.json'];
  const ownedHash = typeof entry === 'string' ? entry : entry?.sourceHash;
  if (!original || !ownedHash || sha256(original) !== ownedHash || marker?.source !== 'ai-agent-playbook') {
    conflicts.push({ path: 'manifest.json', reason: 'Unmanaged or modified layout metadata is preserved. Existing records remain readable without migration.' });
  }
  try {
    await readText(await safePath(pb.directory, 'CURRENT.md'), MAX_FILE_BYTES);
  } catch {
    conflicts.push({ path: 'CURRENT.md', reason: 'Create a reviewed, readable UTF-8 text entrypoint within the record size limit before migration; no automatic summary is written.' });
  }
  const operations = conflicts.length ? [] : ['manifest.json', MARKER];
  let backupPath = null;
  if (apply && operations.length) {
    backupPath = 'archive/migration-layout-' + Date.now() + '.json';
    const backup = await safePath(pb.directory, backupPath);
    const body = JSON.stringify({ ...old, schemaVersion: '2', layoutKind: 'minimal', legacyRecordsPreserved: true }, null, 2) + '\n';
    const markerBytes = await statOrNull(markerFile) ? await readBytes(markerFile) : null;
    const nextMarker = { ...marker, schemaVersion: 2, source: 'ai-agent-playbook', files: { ...entries, 'manifest.json': sha256(body) }, legacyManifest: path.relative(pb.directory, backup).replaceAll('\\', '/') };
    const nextMarkerBody = JSON.stringify(nextMarker, null, 2) + '\n';
    await writeAtomic(backup, JSON.stringify({ schemaVersion: 1, kind: 'playbook.layout-backup', files: {
      'manifest.json': { before: original?.toString('base64') ?? null, afterHash: sha256(body) },
      [MARKER]: { before: markerBytes?.toString('base64') ?? null, afterHash: sha256(nextMarkerBody) }
    } }, null, 2) + '\n', { exclusive: true });
    if ((await statOrNull(file) ? sha256(await readBytes(file)) : null) !== (original ? sha256(original) : null)) throw new Error('Manifest changed during migration.');
    if ((await statOrNull(markerFile) ? sha256(await readBytes(markerFile)) : null) !== (markerBytes ? sha256(markerBytes) : null)) throw new Error('Ownership marker changed during migration.');
    await writeAtomic(file, body);
    await writeAtomic(markerFile, nextMarkerBody);
  }
  return report('playbook.migrate', { ok: !conflicts.length, writes: apply && operations.length > 0, applied: apply && operations.length > 0, operations, conflicts, backup: backupPath, recordsPreserved: true });
}

export async function rollbackRecordMigration({ target, backup, apply = false }) {
  const pb = await locatePlaybook(target);
  const archive = await readJson(await safePath(pb.directory, backup));
  if (archive.kind !== 'playbook.layout-backup' || archive.schemaVersion !== 1) throw new Error('Invalid layout recovery record.');
  const operations = [], conflicts = [];
  for (const name of ['manifest.json', MARKER]) {
    const item = archive.files?.[name];
    if (!item || typeof item.before !== 'string') throw new Error('Recovery requires preserved metadata bytes.');
    const file = await safePath(pb.directory, name), before = Buffer.from(item.before, 'base64');
    const current = await statOrNull(file) ? await readBytes(file) : null;
    if (current && sha256(current) === sha256(before)) continue;
    if (!current || sha256(current) !== item.afterHash) { conflicts.push({ path: name, reason: 'Later changes were preserved.' }); continue; }
    operations.push({ path: name, beforeHash: sha256(current), content: before });
  }
  if (apply && !conflicts.length) {
    for (const op of operations) {
      const file = await safePath(pb.directory, op.path);
      if (sha256(await readBytes(file)) !== op.beforeHash) throw new Error('Metadata changed during rollback.');
      await writeAtomic(file, op.content);
    }
  }
  const applied = apply && !conflicts.length && operations.length > 0;
  return report('playbook.rollback', { ok: !conflicts.length, writes: applied, applied, operations: operations.map(({ path }) => path), conflicts });
}
