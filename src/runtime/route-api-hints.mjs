import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  walkFiles
} from '../harness/core.mjs';

const ROUTE_API_HINTS_INDEX_FILE = 'runtime/indexes/route-api-hints.json';
const MAX_FILE_BYTES = 300000;
const EXCLUDED_PARTS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

const INSPECT_EXTENSIONS = new Set([
  '.cs',
  '.go',
  '.java',
  '.js',
  '.jsx',
  '.kt',
  '.kts',
  '.mjs',
  '.php',
  '.py',
  '.sql',
  '.ts',
  '.tsx'
]);

const ROUTE_PATTERNS = [
  routePattern('express', /\b(?:app|router)\.(get|post|put|patch|delete|options|head|all)\s*\(\s*["'`]([^"'`]+)["'`]/gi, 'medium', 'pattern.express.route'),
  routePattern('nest', /@(Get|Post|Put|Patch|Delete|Options|Head|All)\s*\(\s*(?:["'`]([^"'`]*)["'`])?/g, 'medium', 'pattern.nest.decorator'),
  routePattern('spring-mvc', /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\(\s*(?:value\s*=\s*)?["']([^"']+)["'])?/g, 'medium', 'pattern.spring.mapping'),
  routePattern('aspnet', /\[(HttpGet|HttpPost|HttpPut|HttpPatch|HttpDelete|Route)\s*(?:\(\s*["']([^"']+)["'])?/g, 'medium', 'pattern.aspnet.attribute'),
  routePattern('fastapi-flask', /@(app|router|blueprint)\.(get|post|put|patch|delete|route)\s*\(\s*["']([^"']+)["']/g, 'medium', 'pattern.python.decorator', 3, 2),
  routePattern('laravel', /\bRoute::(get|post|put|patch|delete|any|match)\s*\(\s*["']([^"']+)["']/gi, 'medium', 'pattern.laravel.route')
];

const CLIENT_API_PATTERNS = [
  apiPattern('fetch', /\bfetch\s*\(\s*["'`]([^"'`]+)["'`]/g, 'low', 'pattern.fetch.call'),
  apiPattern('axios', /\baxios\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi, 'low', 'pattern.axios.call', 2, 1)
];

const SQL_PATTERNS = [
  sqlPattern('table', /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`[]?([A-Za-z_][\w.]*)/gi, 'high', 'pattern.sql.create-table', 'create-table'),
  sqlPattern('table', /\bALTER\s+TABLE\s+["`[]?([A-Za-z_][\w.]*)/gi, 'high', 'pattern.sql.alter-table', 'alter-table'),
  sqlPattern('view', /\bCREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+["`[]?([A-Za-z_][\w.]*)/gi, 'medium', 'pattern.sql.create-view', 'create-view'),
  sqlPattern('procedure', /\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+["`[]?([A-Za-z_][\w.]*)/gi, 'medium', 'pattern.sql.create-routine', 'create-routine'),
  sqlPattern('query', /\bSELECT\b[\s\S]{0,120}?\bFROM\s+["`[]?([A-Za-z_][\w.]*)/gi, 'low', 'pattern.sql.select-from', 'select'),
  sqlPattern('query', /\bINSERT\s+INTO\s+["`[]?([A-Za-z_][\w.]*)/gi, 'low', 'pattern.sql.insert-into', 'insert'),
  sqlPattern('query', /\bUPDATE\s+["`[]?([A-Za-z_][\w.]*)/gi, 'low', 'pattern.sql.update', 'update')
];

export async function buildRouteApiHintsIndex({ target, maxHints = 100 }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const scan = await collectRouteApiHints({ target: resolvedTarget, playbookDir: playbook.dir, maxHints });
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.route-api-hints',
    ok: true,
    target: resolvedTarget,
    applied: false,
    mode: { localOnly: true, network: false, writes: false },
    index: `${playbook.dir}/${ROUTE_API_HINTS_INDEX_FILE}`,
    generatedAt: new Date().toISOString(),
    summary: summarizeHints(scan),
    hints: scan.hints,
    warnings: scan.warnings,
    conflicts: []
  };
}

async function collectRouteApiHints({ target, playbookDir, maxHints }) {
  const files = await walkFiles(target, (file) => shouldInspectFile(file, target, playbookDir));
  const hints = [];
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
    const relative = normalizePortablePath(path.relative(target, file));
    for (const hint of extractHintsFromText(text, relative)) {
      hints.push(hint);
      if (hints.length >= maxHints) {
        warnings.push({
          id: 'route-api-hints.max-results',
          message: `Route/API hints truncated at ${maxHints} entries.`
        });
        return { hints, warnings, filesScanned, skippedLargeFiles, truncated: true };
      }
    }
  }

  hints.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.kind.localeCompare(right.kind));
  return { hints, warnings, filesScanned, skippedLargeFiles, truncated: false };
}

function extractHintsFromText(text, file) {
  const hints = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    hints.push(...extractRouteHints(line, file, index + 1));
    hints.push(...extractClientApiHints(line, file, index + 1));
    hints.push(...extractSqlHints(line, file, index + 1));
  }
  if (isNextRouteFile(file)) {
    hints.push(nextRouteHint(file));
  }
  return hints;
}

function extractRouteHints(line, file, lineNumber) {
  const hints = [];
  for (const item of ROUTE_PATTERNS) {
    for (const match of line.matchAll(item.regex)) {
      const routePath = normalizeRoutePath(match[item.pathGroup] ?? '');
      hints.push({
        kind: 'route',
        file,
        line: lineNumber,
        framework: item.framework,
        method: normalizeMethod(match[item.methodGroup]),
        path: routePath,
        confidence: routePath ? item.confidence : 'low',
        source: item.source
      });
    }
  }
  return hints;
}

function extractClientApiHints(line, file, lineNumber) {
  const hints = [];
  for (const item of CLIENT_API_PATTERNS) {
    for (const match of line.matchAll(item.regex)) {
      hints.push({
        kind: 'client-api',
        file,
        line: lineNumber,
        client: item.client,
        method: normalizeMethod(match[item.methodGroup]),
        path: normalizeRoutePath(match[item.pathGroup] ?? ''),
        confidence: item.confidence,
        source: item.source
      });
    }
  }
  return hints;
}

function extractSqlHints(line, file, lineNumber) {
  if (!shouldInspectSqlLine(line, file)) return [];
  const hints = [];
  for (const item of SQL_PATTERNS) {
    for (const match of line.matchAll(item.regex)) {
      hints.push({
        kind: 'data',
        file,
        line: lineNumber,
        dataKind: item.dataKind,
        operation: item.operation,
        name: cleanSqlName(match[1]),
        confidence: item.confidence,
        source: item.source
      });
    }
  }
  return hints;
}

function shouldInspectSqlLine(line, file) {
  if (path.extname(file).toLowerCase() === '.sql') return true;
  if (!/\b(?:SELECT|INSERT\s+INTO|UPDATE|CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:OR\s+REPLACE\s+)?VIEW|CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION))\b/.test(line)) {
    return false;
  }
  return /["'`]/.test(line) || /\b(?:sql|query|execute|prepare|raw|statement|jdbcTemplate|createQuery)\b/i.test(line);
}

function shouldInspectFile(file, target, playbookDir) {
  const relative = normalizePortablePath(path.relative(target, file));
  const parts = relative.split('/');
  if (parts.some((part) => EXCLUDED_PARTS.has(part))) return false;
  if (relative.startsWith(`${playbookDir}/runtime/`)) return false;
  if (relative.startsWith(`${playbookDir.replace(/^\./, '')}/runtime/`)) return false;
  return INSPECT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function summarizeHints(scan) {
  return {
    filesScanned: scan.filesScanned,
    skippedLargeFiles: scan.skippedLargeFiles,
    hints: scan.hints.length,
    byKind: countBy(scan.hints, 'kind'),
    byFramework: countBy(scan.hints.filter((hint) => hint.framework), 'framework'),
    bySource: countBy(scan.hints, 'source'),
    truncated: scan.truncated,
    warnings: scan.warnings.length,
    conflicts: 0
  };
}

function nextRouteHint(file) {
  const route = file
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/^pages\//, '')
    .replace(/\/route\.[cm]?[jt]sx?$/, '')
    .replace(/\[(\w+)]/g, ':$1');
  return {
    kind: 'route',
    file,
    line: 1,
    framework: 'next',
    method: 'ANY',
    path: route.startsWith('/') ? route : `/${route}`,
    confidence: 'low',
    source: 'pattern.next.route-file'
  };
}

function isNextRouteFile(file) {
  return /(^|\/)(app|src\/app)\/.+\/route\.[cm]?[jt]sx?$/.test(file);
}

function normalizeMethod(value) {
  if (!value) return 'ANY';
  const normalized = String(value).toUpperCase();
  if (normalized === 'GETMAPPING') return 'GET';
  if (normalized === 'POSTMAPPING') return 'POST';
  if (normalized === 'PUTMAPPING') return 'PUT';
  if (normalized === 'PATCHMAPPING') return 'PATCH';
  if (normalized === 'DELETEMAPPING') return 'DELETE';
  if (normalized === 'REQUESTMAPPING' || normalized === 'ROUTE' || normalized === 'ALL' || normalized === 'ANY') return 'ANY';
  if (normalized.startsWith('HTTP')) return normalized.replace(/^HTTP/, '').toUpperCase();
  return normalized;
}

function normalizeRoutePath(value) {
  return String(value ?? '').trim();
}

function cleanSqlName(value) {
  return String(value ?? '').replace(/[[\]`"]/g, '').replace(/[;(,].*$/, '').trim();
}

function countBy(entries, field) {
  const counts = {};
  for (const entry of entries) {
    const key = entry[field];
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function routePattern(framework, regex, confidence, source, pathGroup = 2, methodGroup = 1) {
  return { framework, regex, confidence, source, pathGroup, methodGroup };
}

function apiPattern(client, regex, confidence, source, pathGroup = 1, methodGroup = 0) {
  return { client, regex, confidence, source, pathGroup, methodGroup };
}

function sqlPattern(dataKind, regex, confidence, source, operation) {
  return { dataKind, regex, confidence, source, operation };
}
