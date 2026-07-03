import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  todayIso
} from '../harness/core.mjs';

const LEDGER_PATH = 'knowledge/reference-adoption-ledger.md';
const DECISION_STATUSES = new Set(['reviewed', 'adopted', 'deferred', 'rejected']);
const LOCAL_ABSOLUTE_PATH_PATTERN = /(?:[A-Za-z]:[\\/][^\s|)`]+|\\\\[^\\/\s|)`]+[\\/][^\s|)`]+)/;
const INTERNAL_URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.|[^/\s|)`]+(?:\.internal|\.corp|\.local|\.lan))(?:[^\s|)`]*)?/i;
const SECRET_PATTERN = /(?:sk-[A-Za-z0-9_-]{12,}|xox[baprs]-[A-Za-z0-9-]{12,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;

export async function updateReferenceLedgerDecision({
  target,
  filePath,
  referenceId,
  status,
  capability,
  pattern,
  adoption,
  risk,
  decisionDate,
  apply = false
}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const resolvedLedger = resolveLedgerPath({ target: resolvedTarget, filePath });
  const warnings = [];
  const conflicts = [];
  const generatedAt = new Date().toISOString();
  const normalizedReferenceId = normalizeLedgerKey(referenceId, '');
  const normalizedStatus = normalizeLedgerKey(status, '');
  let decision = null;
  let content = '';
  let updatedContent = '';
  let changed = false;
  let operations = [];

  if (!normalizedReferenceId) {
    conflicts.push(decisionFinding('reference-ledger-decision.reference-required', 'Reference id is required.', []));
  }
  if (!DECISION_STATUSES.has(normalizedStatus)) {
    conflicts.push(decisionFinding('reference-ledger-decision.invalid-status', `Status must be one of: ${[...DECISION_STATUSES].join(', ')}.`, []));
  }
  if (hasText(decisionDate) && !/^\d{4}-\d{2}-\d{2}$/.test(String(decisionDate).trim())) {
    conflicts.push(decisionFinding('reference-ledger-decision.invalid-date', 'Decision date must use YYYY-MM-DD.', []));
  }
  if (!resolvedLedger.ok) {
    conflicts.push(decisionFinding('reference-ledger-decision.path-invalid', 'Ledger path must stay inside the target repository.', [resolvedLedger.relativePath]));
  } else if (!await isFilePath(resolvedLedger.path)) {
    conflicts.push(decisionFinding('reference-ledger-decision.ledger-missing', 'Reference adoption ledger is missing; run ledger-init first.', [resolvedLedger.relativePath]));
  }

  if (conflicts.length === 0) {
    content = await readFile(resolvedLedger.path, 'utf8');
    const table = parseLedgerTable(content, resolvedLedger.relativePath);
    warnings.push(...table.warnings);
    conflicts.push(...table.conflicts);
    const row = table.rows.find((row) => ledgerEntryKeys(row.data.referenceId).includes(normalizedReferenceId));
    if (!row) {
      conflicts.push(decisionFinding('reference-ledger-decision.reference-missing', 'Reference id was not found in the adoption ledger.', [resolvedLedger.relativePath]));
    } else {
      const before = row.data;
      const after = nextDecisionRow({
        before,
        status: normalizedStatus,
        capability,
        pattern,
        adoption,
        risk,
        decisionDate
      });
      conflicts.push(...validateDecisionRow(after, `${resolvedLedger.relativePath}:${row.lineNumber}`));
      changed = !sameDecisionRow(before, after);
      decision = {
        referenceId: before.referenceId,
        line: row.lineNumber,
        before: compactDecisionRow(before),
        after: compactDecisionRow(after)
      };
      if (conflicts.length === 0 && changed) {
        updatedContent = replaceLine(content, row.index, renderDecisionRow(after));
        operations = [{
          id: 'reference-ledger-decision.replace-row',
          action: apply ? 'write' : 'preview',
          message: `${apply ? 'Update' : 'Preview update for'} reference adoption ledger row ${before.referenceId}.`,
          paths: [`${resolvedLedger.relativePath}:${row.lineNumber}`]
        }];
      } else {
        updatedContent = content;
      }
    }
  }

  const result = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.ledger-decision',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: Boolean(apply) },
    generatedAt,
    applied: false,
    path: resolvedLedger.relativePath,
    summary: {
      changed,
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    decision,
    operations,
    warnings,
    conflicts
  };

  if (!result.ok || !apply || !changed) return result;

  await writeFile(resolvedLedger.path, updatedContent);
  return {
    ...result,
    applied: true
  };
}

function parseLedgerTable(content, relativePath) {
  const warnings = [];
  const conflicts = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headerIndex = lines.findIndex((line) => isReferenceLedgerHeader(line));
  if (headerIndex < 0) {
    conflicts.push(decisionFinding('reference-ledger-decision.table-missing', 'Reference adoption ledger table header is missing.', [relativePath]));
    return { rows: [], warnings, conflicts };
  }

  const separatorIndex = lines.findIndex((line, index) => index > headerIndex && isLedgerSeparatorRow(line));
  if (separatorIndex < 0) {
    conflicts.push(decisionFinding('reference-ledger-decision.table-separator-missing', 'Reference adoption ledger table separator is missing.', [relativePath]));
    return { rows: [], warnings, conflicts };
  }

  const rows = [];
  for (let index = separatorIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim().startsWith('|')) break;
    const cells = ledgerRowCells(line);
    if (cells.length < 7) {
      warnings.push(decisionFinding('reference-ledger-decision.short-row', 'Ignoring ledger row with fewer than seven cells.', [`${relativePath}:${index + 1}`]));
      continue;
    }
    rows.push({
      index,
      lineNumber: index + 1,
      data: {
        status: normalizeLedgerKey(cells[0], ''),
        referenceId: normalizeLedgerKey(cells[1], 'unknown-reference'),
        capability: normalizeLedgerKey(cells[2], 'uncategorized'),
        pattern: cells[3],
        adoption: cells[4],
        risk: cells[5],
        decisionDate: cells[6]
      }
    });
  }
  return { rows, warnings, conflicts };
}

function nextDecisionRow({
  before,
  status,
  capability,
  pattern,
  adoption,
  risk,
  decisionDate
}) {
  const nextDate = hasText(decisionDate)
    ? String(decisionDate).trim()
    : (before.decisionDate || todayIso());
  return {
    status,
    referenceId: before.referenceId,
    capability: hasText(capability) ? normalizeLedgerKey(capability, before.capability) : before.capability,
    pattern: hasText(pattern) ? String(pattern).trim() : before.pattern,
    adoption: hasText(adoption) ? String(adoption).trim() : before.adoption,
    risk: hasText(risk) ? String(risk).trim() : before.risk,
    decisionDate: nextDate
  };
}

function validateDecisionRow(row, pathLabel) {
  const conflicts = [];
  if (!row.referenceId) {
    conflicts.push(decisionFinding('reference-ledger-decision.reference-empty', 'Reference id cannot be empty.', [pathLabel]));
  }
  if (!row.capability) {
    conflicts.push(decisionFinding('reference-ledger-decision.capability-empty', 'Capability cannot be empty.', [pathLabel]));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.decisionDate)) {
    conflicts.push(decisionFinding('reference-ledger-decision.invalid-date', 'Decision date must use YYYY-MM-DD.', [pathLabel]));
  }
  for (const [field, value] of Object.entries(row)) {
    const text = String(value ?? '');
    if (text.includes('|') || /[\r\n]/.test(text)) {
      conflicts.push(decisionFinding('reference-ledger-decision.table-cell-unsafe', `${field} contains a table separator or newline.`, [pathLabel]));
    }
    if (text.length > 300) {
      conflicts.push(decisionFinding('reference-ledger-decision.table-cell-too-long', `${field} is too long for a compact ledger cell.`, [pathLabel]));
    }
    if (LOCAL_ABSOLUTE_PATH_PATTERN.test(text)) {
      conflicts.push(decisionFinding('reference-ledger-decision.local-absolute-path', `${field} contains a local absolute path.`, [pathLabel]));
    }
    if (INTERNAL_URL_PATTERN.test(text)) {
      conflicts.push(decisionFinding('reference-ledger-decision.internal-url', `${field} contains an internal or local URL.`, [pathLabel]));
    }
    if (SECRET_PATTERN.test(text)) {
      conflicts.push(decisionFinding('reference-ledger-decision.secret-like-token', `${field} contains a token-like secret pattern.`, [pathLabel]));
    }
  }
  return conflicts;
}

function renderDecisionRow(row) {
  return `| ${[
    row.status,
    row.referenceId,
    row.capability,
    ledgerCell(row.pattern),
    ledgerCell(row.adoption),
    ledgerCell(row.risk),
    row.decisionDate
  ].join(' | ')} |`;
}

function compactDecisionRow(row) {
  return {
    status: row.status,
    referenceId: row.referenceId,
    capability: row.capability,
    pattern: compactCell(row.pattern),
    adoption: compactCell(row.adoption),
    risk: compactCell(row.risk),
    decisionDate: row.decisionDate
  };
}

function sameDecisionRow(left, right) {
  return left.status === right.status
    && left.referenceId === right.referenceId
    && left.capability === right.capability
    && left.pattern === right.pattern
    && left.adoption === right.adoption
    && left.risk === right.risk
    && left.decisionDate === right.decisionDate;
}

function replaceLine(content, index, nextLine) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const hasFinalNewline = normalized.endsWith('\n');
  const lines = normalized.split('\n');
  if (hasFinalNewline) lines.pop();
  lines[index] = nextLine;
  return `${lines.join('\n')}${hasFinalNewline ? '\n' : ''}`;
}

function isReferenceLedgerHeader(line) {
  const cells = ledgerRowCells(line).map((cell) => cell.toLowerCase());
  return cells.length >= 7
    && cells[0] === 'status'
    && cells[1] === 'reference id'
    && cells[2] === 'capability'
    && cells[3] === 'useful pattern'
    && cells[4] === 'local adoption'
    && cells[5] === 'risk/noise'
    && cells[6] === 'decision date';
}

function isLedgerSeparatorRow(line) {
  return /^\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function ledgerRowCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  return trimmed.split('|').slice(1, -1).map((cell) => cell.trim());
}

function ledgerEntryKeys(referenceId) {
  const direct = normalizeLedgerKey(referenceId, '');
  const stripped = direct.startsWith('reference-') ? direct.slice('reference-'.length) : direct;
  return [...new Set([direct, stripped, direct ? `reference-${stripped || direct}` : ''].filter(Boolean))];
}

function ledgerCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '/')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

function compactCell(value) {
  const normalized = ledgerCell(value);
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217)}...`;
}

function normalizeLedgerKey(value, fallback) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9가-힣._/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function resolveLedgerPath({ target, filePath }) {
  const ledgerPath = filePath
    ? path.resolve(target, filePath)
    : path.join(resolvePlaybookLayout(target).root, ...LEDGER_PATH.split('/'));
  const relative = path.relative(target, ledgerPath);
  const relativePath = normalizePortablePath(relative || LEDGER_PATH);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: ledgerPath, relativePath: normalizePortablePath(String(filePath ?? ledgerPath)) };
  }
  return { ok: true, path: ledgerPath, relativePath };
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function decisionFinding(id, message, paths) {
  return { id, message, paths };
}

async function isFilePath(candidate) {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}
