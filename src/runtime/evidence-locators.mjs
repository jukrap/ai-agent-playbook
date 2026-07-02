import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  isRecord,
  isSafePortablePath,
  normalizePortablePath,
  SCHEMA_VERSION
} from '../harness/core.mjs';

const SOURCE_BOUNDARIES = new Set([
  'chat',
  'command-output',
  'data-source',
  'database',
  'docs',
  'external-source',
  'file',
  'issue-tracker',
  'local-file',
  'local-reference',
  'manual-observation',
  'object-store',
  'public-web',
  'runtime-artifact',
  'runtime-report',
  'source-registry',
  'web'
]);

const LOCATOR_SIGNAL_FIELDS = new Set([
  'locator',
  'locatorType',
  'locatorTypes',
  'sourceBoundary',
  'scanRange',
  'freshness',
  'sourceId',
  'credentialBoundary'
]);

const PORTABLE_PATH_FIELDS = new Set([
  'artifact',
  'definitionPath',
  'file',
  'locator',
  'path',
  'promotionTarget',
  'reportPath',
  'runtimePath',
  'sourcePath',
  'transcriptPath'
]);

export async function checkEvidenceLocators({ target, filePath } = {}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const mode = { localOnly: true, network: false, writes: false };
  const warnings = [];
  const conflicts = [];
  const normalizedPath = normalizePortablePath(filePath ?? '');

  if (!normalizedPath || !isSafePortablePath(normalizedPath)) {
    conflicts.push(locatorConflict('evidence-locator.path-invalid', 'Locator check requires a portable target-relative --path.', []));
    return locatorCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, format: 'unknown', locators: [], warnings, conflicts });
  }

  const absolutePath = path.resolve(resolvedTarget, normalizedPath);
  const relative = path.relative(resolvedTarget, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    conflicts.push(locatorConflict('evidence-locator.path-outside-target', 'Locator check path must stay inside the target project.', [normalizedPath]));
    return locatorCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, format: 'unknown', locators: [], warnings, conflicts });
  }

  let raw;
  try {
    raw = await readFile(absolutePath, 'utf8');
  } catch (error) {
    conflicts.push(locatorConflict('evidence-locator.file-unreadable', `Could not read target-relative evidence file (${formatFileError(error)}).`, [normalizedPath]));
    return locatorCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, format: 'unknown', locators: [], warnings, conflicts });
  }

  const format = detectEvidenceFormat(normalizedPath, raw);
  const locators = [];
  if (format === 'json') {
    parseJsonEvidence(raw, normalizedPath, locators, warnings, conflicts);
  } else if (format === 'markdown') {
    parseMarkdownEvidence(raw, normalizedPath, locators, warnings, conflicts);
  } else {
    warnings.push(locatorWarning('evidence-locator.format-unknown', 'Evidence locator check only inspects JSON and Markdown files.', [normalizedPath]));
  }

  if (format === 'json' && locators.length === 0 && conflicts.length === 0) {
    warnings.push(locatorWarning('evidence-locator.none', 'No locator-like objects were found in the JSON document.', [normalizedPath]));
  }

  return locatorCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, format, locators, warnings, conflicts });
}

function parseJsonEvidence(raw, filePath, locators, warnings, conflicts) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    conflicts.push(locatorConflict('evidence-locator.json-malformed', 'Evidence locator JSON could not be parsed.', [filePath]));
    return;
  }

  collectLocatorObjects(value, filePath).forEach((locator) => {
    locators.push({ path: locator.path, source: 'json' });
    validateLocatorObject(locator.value, { documentPath: filePath, objectPath: locator.path, warnings, conflicts });
  });
  validateUnsafeStrings(value, conflicts, filePath, [], { allowAbsoluteTrails: new Set(['target']) });
}

function parseMarkdownEvidence(raw, filePath, locators, warnings, conflicts) {
  const before = locators.length;
  for (const block of extractEvidenceFences(raw)) {
    if (looksJsonLike(block.body)) {
      parseJsonEvidence(block.body, `${filePath}#${block.id}`, locators, warnings, conflicts);
      continue;
    }

    const parsed = parseKeyValueEvidence(block.body);
    if (Object.keys(parsed).length > 0) {
      locators.push({ path: `${filePath}#${block.id}`, source: 'markdown-fence' });
      validateLocatorObject(parsed, { documentPath: filePath, objectPath: `${filePath}#${block.id}`, warnings, conflicts });
    } else {
      warnings.push(locatorWarning('evidence-locator.markdown-fence-unparsed', 'A fenced evidence block was found but did not contain JSON or key/value locator fields.', [filePath]));
    }
  }

  for (const table of extractLocatorTables(raw)) {
    table.rows.forEach((row, index) => {
      const objectPath = `${filePath}#table-${table.index + 1}-row-${index + 1}`;
      locators.push({ path: objectPath, source: 'markdown-table' });
      validateLocatorObject(row, { documentPath: filePath, objectPath, warnings, conflicts });
    });
  }

  if (locators.length === before) {
    warnings.push(locatorWarning('evidence-locator.markdown-none', 'Markdown file contains no fenced evidence block or locator table; treat it as advisory only.', [filePath]));
  }
  validateUnsafeStrings(raw, conflicts, filePath, [], {});
}

function collectLocatorObjects(value, documentPath) {
  const locators = [];
  visitLocatorObjects(value, [], documentPath, locators);
  return locators;
}

function visitLocatorObjects(value, trail, documentPath, locators) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitLocatorObjects(item, [...trail, String(index)], documentPath, locators));
    return;
  }
  if (!isRecord(value)) return;

  if (isLocatorLikeObject(value)) {
    locators.push({
      path: trail.length ? `${documentPath}.${trail.join('.')}` : documentPath,
      value
    });
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    visitLocatorObjects(item, [...trail, key], documentPath, locators);
  }
}

function isLocatorLikeObject(value) {
  if (!isRecord(value)) return false;
  if (value.kind === 'runtime.evidence-envelope') return true;
  if (isRecord(value.locator) || typeof value.locator === 'string') return true;
  if (Array.isArray(value.locatorTypes) && Object.hasOwn(value, 'credentialBoundary')) return true;

  const signals = Object.keys(value).filter((key) => LOCATOR_SIGNAL_FIELDS.has(key)).length;
  return signals >= 2;
}

function validateLocatorObject(value, { documentPath, objectPath, warnings, conflicts }) {
  const sourceEntry = Array.isArray(value.locatorTypes) && Object.hasOwn(value, 'credentialBoundary');
  const hasLocator = hasLocatorReference(value) || sourceEntry;
  const hasScanRange = hasPresent(value.scanRange) || sourceEntry;
  const hasBoundary = hasPresent(value.sourceId) || hasPresent(value.credentialBoundary) || hasPresent(value.sourceBoundary) || hasPresent(value.boundary);
  const hasFreshness = hasPresent(value.freshness) || hasPresent(value.generatedAt) || hasPresent(value.updateCadence);

  if (!hasLocator) {
    conflicts.push(locatorConflict('evidence-locator.locator-missing', `${objectPath} must include a locator reference.`, [documentPath]));
  }
  if (!hasScanRange) {
    conflicts.push(locatorConflict('evidence-locator.scan-range-missing', `${objectPath} must include scanRange or an equivalent source registry locator policy.`, [documentPath]));
  }
  if (!hasBoundary) {
    conflicts.push(locatorConflict('evidence-locator.source-boundary-missing', `${objectPath} must identify a source boundary or source id.`, [documentPath]));
  }
  if (!hasFreshness) {
    warnings.push(locatorWarning('evidence-locator.freshness-missing', `${objectPath} should include freshness, generatedAt, or updateCadence.`, [documentPath]));
  }
  if (!hasPresent(value.caveats) && !sourceEntry) {
    warnings.push(locatorWarning('evidence-locator.caveats-missing', `${objectPath} should include caveats when evidence is partial or inferred.`, [documentPath]));
  }

  validateSourceBoundary(value, { documentPath, objectPath, conflicts });
  validatePortableLocatorPaths(value, { documentPath, objectPath, conflicts });
}

function hasLocatorReference(value) {
  if (typeof value.locator === 'string' && value.locator.trim()) return true;
  if (isRecord(value.locator)) return true;
  if (typeof value.locatorType === 'string' && value.locatorType.trim()) return true;
  if (typeof value.path === 'string' && value.path.trim()) return true;
  if (typeof value.file === 'string' && value.file.trim()) return true;
  return false;
}

function validateSourceBoundary(value, { documentPath, objectPath, conflicts }) {
  const raw = typeof value.sourceBoundary === 'string'
    ? value.sourceBoundary
    : typeof value.boundary === 'string'
      ? value.boundary
      : null;
  if (!raw) return;

  const normalized = normalizeBoundary(raw);
  if (!SOURCE_BOUNDARIES.has(normalized)) {
    conflicts.push(locatorConflict('evidence-locator.source-boundary-unknown', `${objectPath} uses unknown source boundary "${raw}".`, [documentPath]));
  }
}

function validatePortableLocatorPaths(value, { documentPath, objectPath, conflicts }) {
  for (const [key, item] of Object.entries(value)) {
    if (isRecord(item)) {
      validatePortableLocatorPaths(item, { documentPath, objectPath: `${objectPath}.${key}`, conflicts });
      continue;
    }
    if (Array.isArray(item)) {
      item.forEach((entry, index) => {
        if (isRecord(entry)) validatePortableLocatorPaths(entry, { documentPath, objectPath: `${objectPath}.${key}[${index}]`, conflicts });
      });
      continue;
    }
    if (!PORTABLE_PATH_FIELDS.has(key) || typeof item !== 'string' || !item.trim() || looksLikeUrl(item)) continue;
    const candidate = normalizePathLocator(item);
    if (!isSafePortablePath(candidate)) {
      conflicts.push(locatorConflict('evidence-locator.portable-path', `${objectPath}.${key} must be a portable relative path.`, [documentPath]));
    }
  }
}

function extractEvidenceFences(raw) {
  const blocks = [];
  const pattern = /```([A-Za-z0-9_-]*)[^\n]*\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  while ((match = pattern.exec(raw)) !== null) {
    const language = match[1].toLowerCase();
    const body = match[2].trim();
    const locatorish = /locator|scanRange|sourceBoundary|sourceId|credentialBoundary/i.test(body);
    if (['evidence', 'evidence-locator', 'locator', 'json'].includes(language) || locatorish) {
      blocks.push({ id: `fence-${index + 1}`, language, body });
      index += 1;
    }
  }
  return blocks;
}

function extractLocatorTables(raw) {
  const tables = [];
  const lines = raw.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isMarkdownTableLine(lines[index]) || !isMarkdownSeparatorLine(lines[index + 1])) continue;
    const headers = splitMarkdownRow(lines[index]).map((header) => normalizeHeader(header));
    if (!headers.some((header) => ['locator', 'locatorType', 'scanRange', 'sourceBoundary', 'sourceId'].includes(header))) continue;

    const rows = [];
    let cursor = index + 2;
    while (cursor < lines.length && isMarkdownTableLine(lines[cursor])) {
      const cells = splitMarkdownRow(lines[cursor]);
      const row = {};
      headers.forEach((header, headerIndex) => {
        if (header) row[header] = cells[headerIndex] ?? '';
      });
      rows.push(row);
      cursor += 1;
    }
    tables.push({ index, rows });
    index = cursor;
  }
  return tables;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isMarkdownTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isMarkdownSeparatorLine(line) {
  return splitMarkdownRow(line).every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function normalizeHeader(value) {
  const normalized = value.trim().replace(/`/g, '').replace(/[^A-Za-z0-9]+(.)/g, (_, letter) => letter.toUpperCase());
  if (/^locator$/i.test(normalized)) return 'locator';
  if (/^locatorType$/i.test(normalized)) return 'locatorType';
  if (/^scanRange$/i.test(normalized)) return 'scanRange';
  if (/^sourceBoundary$/i.test(normalized)) return 'sourceBoundary';
  if (/^sourceId$/i.test(normalized)) return 'sourceId';
  if (/^freshness$/i.test(normalized)) return 'freshness';
  if (/^caveats$/i.test(normalized)) return 'caveats';
  return normalized;
}

function parseKeyValueEvidence(body) {
  const record = {};
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?)\s*$/);
    if (!match) continue;
    record[normalizeHeader(match[1])] = match[2];
  }
  return record;
}

function detectEvidenceFormat(filePath, raw) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (looksJsonLike(raw)) return 'json';
  return 'unknown';
}

function locatorCheckReport({ target, mode, filePath, format, locators, warnings, conflicts }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.evidence-locator-check',
    ok: conflicts.length === 0,
    target,
    mode,
    path: filePath,
    format,
    generatedAt: new Date().toISOString(),
    summary: {
      locators: locators.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    locators,
    warnings,
    conflicts
  };
}

function locatorConflict(id, message, paths) {
  return { id, level: 'fail', message, paths };
}

function locatorWarning(id, message, paths) {
  return { id, level: 'warn', message, paths };
}

function hasPresent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function normalizeBoundary(value) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function normalizePathLocator(value) {
  const withoutAnchor = value.split('#')[0];
  return normalizePortablePath(withoutAnchor);
}

function looksJsonLike(value) {
  const trimmed = String(value).trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function looksLikeUrl(value) {
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) && !/^[A-Za-z]:[\\/]/.test(value);
}

function looksLikeAbsolutePath(value) {
  return /(?:^|[\s("'`])(?:[A-Za-z]:[\\/]|\\\\|\/Users\/|\/home\/)/.test(value);
}

function looksLikeSecret(value) {
  return /(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(value);
}

function validateUnsafeStrings(value, conflicts, path, trail = [], options = {}) {
  if (typeof value === 'string') {
    const textPath = trail.length ? `${path}.${trail.join('.')}` : path;
    const trailKey = trail.join('.');
    if (!options.allowAbsoluteTrails?.has(trailKey) && looksLikeAbsolutePath(value)) {
      conflicts.push(locatorConflict('evidence-locator.absolute-path', `${textPath} must not contain a personal or absolute path.`, [path]));
    }
    if (looksLikeSecret(value)) {
      conflicts.push(locatorConflict('evidence-locator.credential-value', `${textPath} appears to contain a credential value. Store a credential reference instead.`, [path]));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateUnsafeStrings(item, conflicts, path, [...trail, String(index)], options));
    return;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      validateUnsafeStrings(item, conflicts, path, [...trail, key], options);
    }
  }
}

function formatFileError(error) {
  if (typeof error?.code === 'string') return error.code;
  return 'read failed';
}
