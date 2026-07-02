import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  walkFiles
} from '../harness/core.mjs';

const SYMBOL_OUTLINE_INDEX_FILE = 'runtime/indexes/symbol-outline.json';
const MAX_FILE_BYTES = 250000;
const EXCLUDED_PARTS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

const LANGUAGE_BY_EXTENSION = new Map([
  ['.cjs', 'javascript'],
  ['.cs', 'csharp'],
  ['.go', 'go'],
  ['.java', 'java'],
  ['.js', 'javascript'],
  ['.jsx', 'javascript'],
  ['.kt', 'kotlin'],
  ['.kts', 'kotlin'],
  ['.mjs', 'javascript'],
  ['.php', 'php'],
  ['.py', 'python'],
  ['.rb', 'ruby'],
  ['.rs', 'rust'],
  ['.ts', 'javascript'],
  ['.tsx', 'javascript']
]);

const PATTERNS = {
  javascript: [
    pattern('class', /^\s*(?:export\s+default\s+|export\s+)?class\s+([A-Za-z_$][\w$]*)\b/, 'high', 'pattern.javascript.class'),
    pattern('function', /^\s*(?:export\s+default\s+|export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/, 'high', 'pattern.javascript.function'),
    pattern('function', /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/, 'medium', 'pattern.javascript.arrow-function'),
    pattern('constant', /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/, 'medium', 'pattern.javascript.binding')
  ],
  python: [
    pattern('class', /^\s*class\s+([A-Za-z_]\w*)\s*[:(]/, 'high', 'pattern.python.class'),
    pattern('function', /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/, 'high', 'pattern.python.function')
  ],
  java: [
    pattern('class', /^\s*(?:public|private|protected|abstract|final|static|\s)*\s*(?:class|interface|enum|record)\s+([A-Za-z_]\w*)\b/, 'high', 'pattern.java.type'),
    pattern('method', /^\s*(?:public|private|protected|static|final|abstract|synchronized|native|default|strictfp|\s)+[\w<>\[\],.?]+\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*(?:throws\s+[^{]+)?[{;]/, 'low', 'pattern.java.method')
  ],
  kotlin: [
    pattern('class', /^\s*(?:data\s+|sealed\s+|open\s+|abstract\s+)?(?:class|interface|object|enum\s+class)\s+([A-Za-z_]\w*)\b/, 'high', 'pattern.kotlin.type'),
    pattern('function', /^\s*(?:private|protected|public|internal|suspend|inline|override|open|\s)*fun\s+([A-Za-z_]\w*)\s*\(/, 'high', 'pattern.kotlin.function')
  ],
  csharp: [
    pattern('class', /^\s*(?:public|private|protected|internal|static|abstract|sealed|partial|\s)*\s*(?:class|interface|enum|record|struct)\s+([A-Za-z_]\w*)\b/, 'high', 'pattern.csharp.type'),
    pattern('method', /^\s*(?:public|private|protected|internal|static|abstract|virtual|override|async|sealed|partial|\s)+[\w<>\[\],.?]+\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*[{;]/, 'low', 'pattern.csharp.method')
  ],
  go: [
    pattern('function', /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/, 'high', 'pattern.go.function'),
    pattern('class', /^\s*type\s+([A-Za-z_]\w*)\s+(?:struct|interface)\b/, 'medium', 'pattern.go.type')
  ],
  php: [
    pattern('class', /^\s*(?:abstract\s+|final\s+)?(?:class|interface|trait|enum)\s+([A-Za-z_]\w*)\b/, 'high', 'pattern.php.type'),
    pattern('function', /^\s*(?:public|private|protected|static|final|abstract|\s)*function\s+([A-Za-z_]\w*)\s*\(/, 'high', 'pattern.php.function')
  ],
  ruby: [
    pattern('class', /^\s*class\s+([A-Za-z_]\w*)\b/, 'medium', 'pattern.ruby.class'),
    pattern('function', /^\s*def\s+([A-Za-z_]\w*[!?=]?)\b/, 'medium', 'pattern.ruby.method')
  ],
  rust: [
    pattern('class', /^\s*(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z_]\w*)\b/, 'medium', 'pattern.rust.type'),
    pattern('function', /^\s*(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*\(/, 'high', 'pattern.rust.function')
  ]
};

const RESERVED_NAMES = new Set([
  'catch',
  'for',
  'if',
  'switch',
  'while'
]);

export async function buildSymbolOutlineIndex({ target, maxEntries = 100 }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const scanResult = await collectSymbols({ target: resolvedTarget, playbookDir: playbook.dir, maxEntries });
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.symbol-outline',
    ok: true,
    target: resolvedTarget,
    applied: false,
    mode: { localOnly: true, network: false, writes: false },
    index: `${playbook.dir}/${SYMBOL_OUTLINE_INDEX_FILE}`,
    generatedAt: new Date().toISOString(),
    summary: summarizeSymbols(scanResult.entries, scanResult),
    entries: scanResult.entries,
    warnings: scanResult.warnings,
    conflicts: []
  };
}

async function collectSymbols({ target, playbookDir, maxEntries }) {
  const files = await walkFiles(target, (file) => shouldScanFile(file, target, playbookDir));
  const entries = [];
  const warnings = [];
  let filesScanned = 0;
  let skippedLargeFiles = 0;

  for (const file of files.sort()) {
    const info = await stat(file);
    if (info.size > MAX_FILE_BYTES) {
      skippedLargeFiles += 1;
      continue;
    }
    filesScanned += 1;
    const text = await readFile(file, 'utf8');
    const relativeFile = normalizePortablePath(path.relative(target, file));
    const language = languageForFile(file);
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      for (const entry of extractLineSymbols(lines[index], language)) {
        entries.push({
          file: relativeFile,
          language,
          kind: entry.kind,
          name: entry.name,
          line: index + 1,
          confidence: entry.confidence,
          source: entry.source
        });
        if (entries.length >= maxEntries) {
          warnings.push({
            id: 'symbol-outline.max-results',
            message: `Symbol outline truncated at ${maxEntries} entries.`
          });
          return { entries, warnings, filesScanned, skippedLargeFiles, truncated: true };
        }
      }
    }
  }

  entries.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.name.localeCompare(right.name));
  return { entries, warnings, filesScanned, skippedLargeFiles, truncated: false };
}

function extractLineSymbols(line, language) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) return [];
  const entries = [];
  const seenNames = new Set();
  for (const item of PATTERNS[language] ?? []) {
    const match = line.match(item.regex);
    const name = match?.[1];
    if (!name || seenNames.has(name) || RESERVED_NAMES.has(name)) continue;
    seenNames.add(name);
    entries.push({
      kind: classifyKind(item.kind, name, language),
      name,
      confidence: item.confidence,
      source: item.source
    });
  }
  return entries;
}

function shouldScanFile(file, target, playbookDir) {
  const relative = normalizePortablePath(path.relative(target, file));
  const parts = relative.split('/');
  if (parts.some((part) => EXCLUDED_PARTS.has(part))) return false;
  if (relative.startsWith(`${playbookDir}/runtime/`)) return false;
  if (relative.startsWith(`${playbookDir.replace(/^\./, '')}/runtime/`)) return false;
  return LANGUAGE_BY_EXTENSION.has(path.extname(file).toLowerCase());
}

function languageForFile(file) {
  return LANGUAGE_BY_EXTENSION.get(path.extname(file).toLowerCase()) ?? 'unknown';
}

function classifyKind(kind, name, language) {
  if (language === 'javascript' && kind === 'function' && /^[A-Z]/.test(name)) return 'component';
  return kind;
}

function summarizeSymbols(entries, scanResult) {
  return {
    filesScanned: scanResult.filesScanned,
    skippedLargeFiles: scanResult.skippedLargeFiles,
    entries: entries.length,
    byLanguage: countBy(entries, 'language'),
    byKind: countBy(entries, 'kind'),
    truncated: scanResult.truncated,
    warnings: scanResult.warnings.length,
    conflicts: 0
  };
}

function countBy(entries, field) {
  const counts = {};
  for (const entry of entries) {
    counts[entry[field]] = (counts[entry[field]] ?? 0) + 1;
  }
  return counts;
}

function pattern(kind, regex, confidence, source) {
  return { kind, regex, confidence, source };
}
