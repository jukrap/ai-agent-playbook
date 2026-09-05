import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, safePath, statOrNull, noLinks, readText, readJson, readBytes, sha256, writeAtomic, relativePath } from './fs-safety.mjs';

export const PLAYBOOK_NAMES = ['.ai-agent-playbook', '.ai-playbook', 'ai-playbook'];
export const RECORD_TOOLS = ['playbook_status', 'playbook_search', 'playbook_read', 'playbook_validate'];
const MARKER = '.ai-agent-playbook-install.json';
const MAX_FILES = 2000;
const MAX_FILE_BYTES = 500_000;
const DEFAULT_CHARS = 12000;
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
function limit(value, fallback, max) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new Error('Invalid output limit.');
  return parsed;
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
async function inventory(playbook) {
  const records = [], warnings = [];
  let visited = 0, limited = false;
  async function walk(dir) {
    if (limited) return;
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (++visited > MAX_FILES) { limited = true; warnings.push('Record traversal limit reached.'); return; }
      const file = path.join(dir, entry.name);
      const rel = path.relative(playbook.directory, file).replaceAll('\\', '/');
      if (entry.isSymbolicLink()) { warnings.push('Skipped linked record: ' + rel); continue; }
      if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) await walk(file); }
      else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) && entry.name !== MARKER) records.push(rel);
      if (limited) return;
    }
  }
  if (playbook.exists) await walk(playbook.directory);
  return { records, warnings, limited };
}
export async function playbookStatus({ target }) {
  const pb = await locatePlaybook(target), data = await inventory(pb);
  let layout = pb.exists ? 'legacy' : 'missing', manifest = null;
  if (pb.exists && await statOrNull(path.join(pb.directory, 'manifest.json'))) {
    manifest = await readJson(await safePath(pb.directory, 'manifest.json'), MAX_FILE_BYTES);
    layout = manifest.layoutKind ?? 'legacy';
  }
  return report('playbook.status', {
    exists: pb.exists, playbook: pb.name, layout,
    entrypoint: data.records.includes('CURRENT.md') ? 'CURRENT.md' : data.records.includes('START_HERE.md') ? 'START_HERE.md' : null,
    records: data.records, warnings: data.warnings, complete: !data.limited,
    validation: { configurationInspected: Boolean(manifest), runtimeVerified: false }
  });
}
export async function playbookRead({ target, path: recordPath = 'CURRENT.md', startLine = 1, maxChars = DEFAULT_CHARS }) {
  const pb = await locatePlaybook(target);
  if (!pb.exists) throw new Error('No playbook exists; bootstrap only when this project needs records.');
  const relative = relativePath(recordPath);
  if (!TEXT_EXTENSIONS.has(path.extname(relative))) throw new Error('Only text records can be read.');
  const file = await safePath(pb.directory, relative);
  const bytes = await readBytes(file, MAX_FILE_BYTES);
  if (bytes.includes(0)) throw new Error('Binary files are not text records.');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  const first = limit(startLine, 1, 1_000_000);
  const cap = limit(maxChars, DEFAULT_CHARS, 100_000);
  const lines = text.split(/\r?\n/), selected = lines.slice(first - 1).join('\n');
  const content = selected.slice(0, cap);
  return report('playbook.read', { path: relative, startLine: first, totalLines: lines.length, sha256: sha256(bytes), content, truncated: selected.length > cap });
}
export async function playbookSearch({ target, query, maxResults = 20, maxChars = DEFAULT_CHARS }) {
  if (typeof query !== 'string' || !query.trim() || query.length > 1000) throw new Error('Search requires a non-empty literal query of at most 1000 characters.');
  const pb = await locatePlaybook(target), data = await inventory(pb);
  const count = limit(maxResults, 20, 100), cap = limit(maxChars, DEFAULT_CHARS, 100_000);
  const results = [], warnings = [...data.warnings];
  let used = 0, scanned = 0, truncated = data.limited;
  outer: for (const relative of data.records) {
    let text;
    try { text = await readText(await safePath(pb.directory, relative), MAX_FILE_BYTES); }
    catch (e) { warnings.push('Skipped ' + relative + ': ' + e.message); continue; }
    scanned++;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].toLocaleLowerCase().includes(query.toLocaleLowerCase())) continue;
      const item = { path: relative, line: i + 1, text: lines[i].slice(0, 500) };
      const cost = JSON.stringify(item).length;
      if (results.length >= count || used + cost > cap) { truncated = true; break outer; }
      results.push(item); used += cost;
    }
  }
  return report('playbook.search', { query, results, scannedFiles: scanned, warnings, truncated });
}
export async function playbookValidate({ target }) {
  const pb = await locatePlaybook(target), data = await inventory(pb), issues = [];
  if (!pb.exists) issues.push({ path: pb.name, code: 'missing', message: 'No playbook found.' });
  if (pb.exists && !data.records.includes('CURRENT.md')) issues.push({ path: 'CURRENT.md', code: 'missing-entrypoint', message: 'A current-state entrypoint is missing.' });
  for (const relative of data.records) {
    let text;
    try { text = await readText(await safePath(pb.directory, relative), MAX_FILE_BYTES); }
    catch (e) { issues.push({ path: relative, code: 'unreadable', message: e.message }); continue; }
    if (relative.endsWith('.json')) {
      try { JSON.parse(text); } catch { issues.push({ path: relative, code: 'invalid-json', message: 'Invalid JSON record.' }); }
    }
    if (!relative.endsWith('.md')) continue;
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const link = match[1].replace(/^<|>$/g, '');
      if (/^(?:[a-z]+:|#|\/)/i.test(link)) continue;
      const decoded = (() => { try { return decodeURIComponent(link.split('#')[0]); } catch { return null; } })();
      if (decoded === null) { issues.push({ path: relative, code: 'invalid-link', message: link }); continue; }
      if (!decoded) continue;
      const full = path.resolve(pb.directory, path.dirname(relative), decoded);
      const projectRelative = path.relative(pb.root, full).replaceAll('\\', '/');
      try {
        const bounded = await safePath(pb.root, projectRelative);
        if (!await statOrNull(bounded)) issues.push({ path: relative, code: 'missing-link', message: link });
      } catch { issues.push({ path: relative, code: 'unsafe-link', message: link }); }
    }
  }
  const markerFile = path.join(pb.directory, MARKER);
  if (pb.exists && await statOrNull(markerFile)) {
    try {
      const marker = await readJson(markerFile);
      const entries = managedFiles(marker, pb.name);
      for (const [name, expected] of Object.entries(entries)) {
        const hash = typeof expected === 'string' ? expected : expected?.sourceHash;
        if (!hash) continue;
        const file = await safePath(pb.directory, name);
        if (!await statOrNull(file)) issues.push({ path: name, code: 'managed-missing', message: 'Managed file is missing.' });
        else if (sha256(await readBytes(file)) !== hash) issues.push({ path: name, code: 'managed-modified', message: 'Preserved user modification; do not overwrite.' });
      }
    } catch (e) { issues.push({ path: MARKER, code: 'invalid-marker', message: e.message }); }
  }
  return report('playbook.validate', { ok: issues.length === 0 && !data.limited, issues, warnings: data.warnings, complete: !data.limited, configurationOnly: true, runtimeVerified: false });
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
  if (!await statOrNull(await safePath(pb.directory, 'CURRENT.md'))) conflicts.push({ path: 'CURRENT.md', reason: 'Create a reviewed current-state entrypoint before migration; no automatic summary is written.' });
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
