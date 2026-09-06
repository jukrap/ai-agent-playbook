import { parentPort, workerData } from 'node:worker_threads';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { opendir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { AST_LANGUAGES, AST_LIMITS } from './ast-search.mjs';
import { projectRoot, safePath, relativePath, readBytes, sha256, noLinks } from './fs-safety.mjs';
import { integerLimit, pageItems, scopeHash, textBoundary } from './record-paging.mjs';

const EXCLUDED = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo', '.venv', '.ai-agent-playbook', '.ai-playbook', 'ai-playbook', '.refra-scope', '_reference', '_work']); // Includes legacy record layouts.
const EXTENSIONS = { javascript: ['.js', '.mjs', '.cjs'], typescript: ['.ts', '.mts', '.cts'], tsx: ['.tsx'], jsx: ['.jsx'], css: ['.css'], html: ['.html', '.htm'] };
const ENGINE_LANG = { javascript: 'JavaScript', typescript: 'TypeScript', tsx: 'Tsx', jsx: 'Tsx', css: 'Css', html: 'Html' };
const fail = (code, message) => Object.assign(new Error(message), { code: 'aapb.ast-' + code });
const excluded = (name) => name.split('/').some((part) => EXCLUDED.has(part));

try {
  parentPort.postMessage({ result: await scan(workerData) });
} catch (error) {
  parentPort.postMessage({ error: { code: error.code ?? 'aapb.ast-failed', message: String(error.message).slice(0, 1024) } });
}

async function scan(options) {
  const { target, pattern, lang, cursor, maxChars, maxResults } = options;
  if (typeof pattern !== 'string' || !pattern.trim() || pattern.length > 4096) throw fail('pattern', 'Provide a non-empty AST pattern of at most 4096 characters.');
  if (!AST_LANGUAGES.includes(lang)) throw fail('language', 'Select lang: ' + AST_LANGUAGES.join(', ') + '.');
  const maxFiles = integerLimit(options.maxFiles, 1000, AST_LIMITS.files);
  // Validate page limits before loading the optional engine or reading source.
  integerLimit(maxResults, 20, 100);
  integerLimit(maxChars, 12000, 100000);
  const root = await projectRoot(target);
  const selection = options.path === undefined || options.path === '.' ? '.' : relativePath(options.path);
  if (excluded(selection)) throw fail('excluded-path', 'Path belongs to an excluded generated or local-record directory.');
  const selected = selection === '.' ? root : await safePath(root, selection);
  const selectedStat = await lstat(selected);
  if (!selectedStat.isFile() && !selectedStat.isDirectory()) throw fail('path', 'Select a source file or directory.');
  let engine;
  try { engine = await import('@ast-grep/napi'); }
  catch { throw fail('engine-unavailable', 'AST engine is unavailable. Reinstall ai-agent-playbook with npm optional dependencies enabled (--include=optional). Record tools still work.'); }
  const language = ENGINE_LANG[lang];
  try { engine.parse(language, '').root().findAll(pattern); }
  catch { throw fail('pattern', 'The AST engine rejected this pattern. Check its syntax and selected language.'); }

  const warnings = [];
  let warningCount = 0, complete = true, examinedFiles = 0, readSize = 0, sourceMode = 'filesystem', entries = 0;
  const warn = (code, file) => {
    complete = false;
    warningCount++;
    if (warnings.length < 20) warnings.push({ code, path: file });
  };
  let candidates;
  try {
    const gitOptions = ['--literal-pathspecs', '-c', 'core.fsmonitor=false', '-C', root];
    await promisify(execFile)('git', [...gitOptions, 'rev-parse', '--is-inside-work-tree'], { windowsHide: true, timeout: 5000 });
    const output = await promisify(execFile)('git', [...gitOptions, 'ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', selection], { windowsHide: true, timeout: 10000, maxBuffer: 4_000_000 });
    candidates = [...new Set(output.stdout.split('\0').filter(Boolean))];
    sourceMode = 'git';
  } catch (error) {
    // A failed listing must not fall back to reading ignored source files.
    if (error.code !== 'ENOENT' && !(error.code === 128 && /not a git repository/i.test(error.stderr ?? ''))) throw fail('file-list', 'Git source listing failed. Check repository access and narrow the selected path.');
  }
  if (!candidates) {
    candidates = [];
    async function walk(file) {
      if (entries >= AST_LIMITS.entries) { warn('entry-limit', selection); return; }
      let st;
      try { await noLinks(file); st = await lstat(file); }
      catch { warn('unreadable-or-linked-entry', path.relative(root, file).replaceAll('\\', '/')); return; }
      if (st.isFile()) { candidates.push(path.relative(root, file).replaceAll('\\', '/')); return; }
      const directory = await opendir(file);
      for await (const entry of directory) {
        if (++entries > AST_LIMITS.entries) { warn('entry-limit', selection); break; }
        const relative = path.relative(root, path.join(file, entry.name)).replaceAll('\\', '/');
        if (excluded(relative)) continue;
        if (entry.isSymbolicLink()) { warn('linked-entry', relative); continue; }
        if (entry.isDirectory() || entry.isFile()) await walk(path.join(file, entry.name));
      }
    }
    await walk(selected);
  }
  candidates.sort();
  if (candidates.length > AST_LIMITS.entries) {
    candidates = candidates.slice(0, AST_LIMITS.entries);
    warn('entry-limit', selection);
  }
  const files = candidates.filter((name) => !excluded(name) && EXTENSIONS[lang].includes(path.extname(name).toLowerCase()));
  const results = [], hashes = [];
  for (const file of files) {
    if (examinedFiles >= maxFiles) { warn('file-limit', selection); break; }
    let bytes;
    try { bytes = await readBytes(await safePath(root, file), AST_LIMITS.fileBytes); }
    catch { warn('unreadable-linked-or-oversized-file', file); hashes.push([file, 'unreadable']); continue; }
    if (readSize + bytes.length > AST_LIMITS.totalBytes) { warn('byte-limit', selection); break; }
    readSize += bytes.length;
    hashes.push([file, sha256(bytes)]);
    let source;
    try {
      if (bytes.includes(0)) throw new Error();
      source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch { warn('non-utf8-or-binary-file', file); continue; }
    examinedFiles++;
    const syntax = engine.parse(language, source).root();
    if (syntax.find({ rule: { kind: 'ERROR' } })) warn('source-syntax-error', file);
    const matches = syntax.findAll(pattern);
    for (const node of matches) {
      if (results.length >= AST_LIMITS.matches) break;
      const range = node.range(), text = node.text();
      results.push({ path: file, range: {
        start: { line: range.start.line + 1, column: range.start.column + 1 },
        end: { line: range.end.line + 1, column: range.end.column + 1 }
      }, snippet: text.slice(0, textBoundary(text, Math.min(text.length, AST_LIMITS.snippetChars))), snippetTruncated: text.length > AST_LIMITS.snippetChars });
    }
    if (results.length >= AST_LIMITS.matches) { warn('match-limit', selection); break; }
  }
  if (selectedStat.isFile() && !files.length) throw fail('language-path', 'Selected file is excluded or its extension does not match lang.');
  const scope = scopeHash({ kind: 'ast', root, selection, lang, pattern, maxFiles, files, hashes, warningCount });
  return pageItems({ items: results, key: 'results', scope, cursor, pageSize: maxResults, maxChars,
    metadata: { schemaVersion: 2, kind: 'aapb.ast-search', ok: true, writes: false, lang, path: selection,
      scan: { complete, sourceMode, candidateFiles: files.length, examinedFiles, readBytes: readSize, limits: { ...AST_LIMITS, files: maxFiles }, excludedDirectories: [...EXCLUDED] },
      warnings: { total: warningCount, sample: warnings, hasMore: warningCount > warnings.length } }
  });
}
