import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from '../harness/core.mjs';

const CAPABILITY_HISTORY_FILE = 'runtime/reports/capability-history.jsonl';
const KNOWN_STATUSES = new Set(['pass', 'fail', 'blocked', 'warn', 'info', 'unknown']);

export async function previewCapabilityHistory({ target }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const history = `${playbook.dir}/${CAPABILITY_HISTORY_FILE}`;
  const historyPath = path.join(playbook.root, ...CAPABILITY_HISTORY_FILE.split('/'));
  const generatedAt = new Date().toISOString();

  if (!existsSync(historyPath)) {
    return reportCapabilityHistory({
      target: resolvedTarget,
      history,
      exists: false,
      generatedAt,
      entries: [],
      lineCount: 0,
      warnings: [],
      conflicts: []
    });
  }

  const parsed = parseJsonlHistory(await readFile(historyPath, 'utf8'), history);
  return reportCapabilityHistory({
    target: resolvedTarget,
    history,
    exists: true,
    generatedAt,
    ...parsed
  });
}

function parseJsonlHistory(text, historyPath) {
  const entries = [];
  const warnings = [];
  const conflicts = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let lineCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index].trim();
    if (!line) continue;
    lineCount += 1;

    let value;
    try {
      value = JSON.parse(line);
    } catch {
      conflicts.push(historyConflict(
        'capability-history.malformed-line',
        `Capability history line ${lineNumber} is not valid JSON.`,
        historyPath,
        lineNumber
      ));
      continue;
    }

    if (!isRecord(value)) {
      conflicts.push(historyConflict(
        'capability-history.invalid-line',
        `Capability history line ${lineNumber} must be a JSON object.`,
        historyPath,
        lineNumber
      ));
      continue;
    }

    const capability = normalizeCapability(value.capability ?? value.id ?? value.name);
    if (!capability) {
      conflicts.push(historyConflict(
        'capability-history.capability-missing',
        `Capability history line ${lineNumber} is missing a capability.`,
        historyPath,
        lineNumber
      ));
      continue;
    }

    const status = normalizeStatus(value.status ?? value.result?.status, warnings, historyPath, lineNumber);
    const generatedAt = normalizeTimestamp(value.generatedAt ?? value.timestamp ?? value.recordedAt, warnings, historyPath, lineNumber);
    const durationMs = numberOrNull(value.durationMs ?? value.duration?.ms ?? value.metrics?.durationMs);
    const baselineMs = numberOrNull(value.baselineMs ?? value.baseline?.durationMs ?? value.metrics?.baselineMs);
    const drift = calculateDrift(durationMs, baselineMs);

    entries.push({
      line: lineNumber,
      capability,
      status,
      generatedAt,
      durationMs,
      baselineMs,
      driftMs: drift.driftMs,
      driftPercent: drift.driftPercent,
      evidence: collectEvidence(value, warnings, historyPath, lineNumber)
    });
  }

  return { entries, lineCount, warnings, conflicts };
}

function reportCapabilityHistory({ target, history, exists, generatedAt, entries, lineCount, warnings, conflicts }) {
  const capabilities = summarizeCapabilities(entries);
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.capability-history',
    ok: conflicts.length === 0,
    target,
    mode: { localOnly: true, network: false, writes: false },
    history,
    exists,
    generatedAt,
    summary: {
      entries: entries.length,
      lines: lineCount,
      capabilities: capabilities.length,
      latestStatuses: countBy(capabilities, 'latestStatus'),
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    capabilities,
    warnings,
    conflicts
  };
}

function summarizeCapabilities(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    const group = grouped.get(entry.capability) ?? [];
    group.push(entry);
    grouped.set(entry.capability, group);
  }

  return [...grouped.entries()].map(([capability, group]) => {
    const latest = group.at(-1);
    return {
      capability,
      entries: group.length,
      latestStatus: latest.status,
      latestGeneratedAt: latest.generatedAt,
      latestDurationMs: latest.durationMs,
      baselineMs: latest.baselineMs,
      driftMs: latest.driftMs,
      driftPercent: latest.driftPercent,
      statuses: countBy(group, 'status'),
      evidence: latest.evidence
    };
  }).sort((left, right) => left.capability.localeCompare(right.capability));
}

function collectEvidence(value, warnings, historyPath, lineNumber) {
  const candidates = [];
  if (typeof value.evidence === 'string') candidates.push(value.evidence);
  if (Array.isArray(value.evidence)) {
    for (const item of value.evidence) {
      if (typeof item === 'string') candidates.push(item);
      else if (isRecord(item) && typeof item.path === 'string') candidates.push(item.path);
    }
  }
  if (typeof value.evidencePath === 'string') candidates.push(value.evidencePath);
  if (Array.isArray(value.evidencePaths)) {
    for (const item of value.evidencePaths) {
      if (typeof item === 'string') candidates.push(item);
    }
  }

  const safe = [];
  for (const candidate of candidates) {
    const normalized = portableEvidencePath(candidate);
    if (!normalized) {
      warnings.push(historyWarning(
        'capability-history.non-portable-evidence',
        `Capability history line ${lineNumber} contains a non-portable evidence path; value omitted.`,
        historyPath,
        lineNumber
      ));
      continue;
    }
    if (!safe.includes(normalized)) safe.push(normalized);
  }
  return safe;
}

function portableEvidencePath(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(raw)) return null;
  if (/^[A-Za-z]:[\\/]/.test(raw) || raw.startsWith('\\\\') || path.isAbsolute(raw)) return null;
  const normalized = normalizePortablePath(raw);
  const parts = normalized.split('/');
  if (normalized === '..' || normalized.startsWith('../') || parts.includes('..')) return null;
  return normalized;
}

function normalizeCapability(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]*$/.test(text)) return null;
  return text;
}

function normalizeStatus(value, warnings, historyPath, lineNumber) {
  const text = String(value ?? 'unknown').trim().toLowerCase();
  if (KNOWN_STATUSES.has(text)) return text;
  warnings.push(historyWarning(
    'capability-history.unknown-status',
    `Capability history line ${lineNumber} has an unknown status; normalized to unknown.`,
    historyPath,
    lineNumber
  ));
  return 'unknown';
}

function normalizeTimestamp(value, warnings, historyPath, lineNumber) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(text)) return text;
  warnings.push(historyWarning(
    'capability-history.invalid-timestamp',
    `Capability history line ${lineNumber} has a non-ISO timestamp; value omitted.`,
    historyPath,
    lineNumber
  ));
  return null;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function calculateDrift(durationMs, baselineMs) {
  if (durationMs === null || baselineMs === null || baselineMs <= 0) {
    return { driftMs: null, driftPercent: null };
  }
  const driftMs = durationMs - baselineMs;
  return {
    driftMs: roundMetric(driftMs),
    driftPercent: roundMetric((driftMs / baselineMs) * 100)
  };
}

function countBy(entries, field) {
  const counts = {};
  for (const entry of entries) {
    const value = entry[field];
    if (!value) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function historyConflict(id, message, historyPath, lineNumber) {
  return {
    id,
    level: 'fail',
    message,
    paths: [historyPath],
    line: lineNumber
  };
}

function historyWarning(id, message, historyPath, lineNumber) {
  return {
    id,
    message,
    paths: [historyPath],
    line: lineNumber
  };
}

function roundMetric(value) {
  return Number(value.toFixed(2));
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
