import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  globMatches,
  hashFile,
  isRecord,
  isSafePortablePath,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  todayIso,
  walkFiles
} from '../harness/core.mjs';

const INDEX_REPORT = 'runtime/indexes/file-inventory.json';
const RUNTIME_REPORTS = 'runtime/reports';
const CONFIDENCE_VALUES = new Set(['low', 'medium', 'high']);

export async function draftCanonFacts({ target, maxFacts = 50 }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const evidence = await collectRuntimeEvidence({ target: resolvedTarget, playbook });
  const facts = [];

  if (evidence.index?.ok) {
    facts.push(draftIndexFact(evidence.index));
  }
  for (const report of evidence.reports.filter((item) => item.ok)) {
    facts.push(draftRuntimeReportFact(report));
  }

  const warnings = [];
  if (facts.length === 0) {
    warnings.push({
      id: 'canon.draft.no-runtime-evidence',
      message: 'No runtime index or JSON reports were found to draft canon facts from.',
      paths: [`${playbook.dir}/runtime/`]
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    summary: {
      facts: Math.min(facts.length, maxFacts),
      runtimeReports: evidence.reports.length,
      index: evidence.index?.ok ? 1 : 0,
      warnings: warnings.length,
      conflicts: 0
    },
    facts: facts.slice(0, maxFacts),
    warnings,
    conflicts: []
  };
}

export async function checkCanonFacts({ target, filePath }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const loaded = await loadPromotedFacts({ target: resolvedTarget, playbook, filePath });
  const warnings = [...loaded.warnings];
  const conflicts = [...loaded.conflicts];
  const checkedFacts = [];

  for (const entry of loaded.facts) {
    const checked = await checkPromotedFact({ target: resolvedTarget, entry });
    checkedFacts.push(checked.fact);
    warnings.push(...checked.warnings);
    conflicts.push(...checked.conflicts);
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    summary: summarizeCheckedFacts(checkedFacts, warnings, conflicts),
    sources: loaded.sources,
    facts: checkedFacts,
    warnings,
    conflicts
  };
}

async function collectRuntimeEvidence({ target, playbook }) {
  const indexPath = path.join(playbook.root, ...INDEX_REPORT.split('/'));
  const index = existsSync(indexPath)
    ? await readJsonReport({ target, file: indexPath, relativePath: `${playbook.dir}/${INDEX_REPORT}` })
    : null;
  const reportsRoot = path.join(playbook.root, ...RUNTIME_REPORTS.split('/'));
  const reportFiles = (await walkFiles(reportsRoot, (file) => file.endsWith('.json'))).sort();
  const reports = [];
  for (const file of reportFiles) {
    reports.push(await readJsonReport({
      target,
      file,
      relativePath: normalizePortablePath(path.relative(target, file))
    }));
  }
  return { index, reports };
}

async function readJsonReport({ target, file, relativePath }) {
  try {
    const value = JSON.parse(await readFile(file, 'utf8'));
    const info = await stat(file);
    return {
      ok: true,
      path: relativePath,
      file,
      value,
      modifiedTime: info.mtime.toISOString(),
      bytes: info.size,
      target
    };
  } catch (error) {
    return {
      ok: false,
      path: relativePath,
      file,
      value: null,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function draftIndexFact(report) {
  const value = reportObject(report);
  const generatedAt = value.generatedAt ?? report.modifiedTime;
  return {
    id: 'project.file-inventory',
    kind: 'file-inventory',
    sourceReport: report.path,
    scanRange: ['**/*'],
    confidence: 'medium',
    observedAt: dateOnly(generatedAt),
    evidence: {
      files: value.summary?.files ?? value.files?.length ?? 0,
      categories: value.summary?.byCategory ?? {}
    }
  };
}

function draftRuntimeReportFact(report) {
  const value = reportObject(report);
  const manifest = isRecord(value.manifest) ? value.manifest : {};
  const invocationId = value.transaction?.invocationId ?? manifest.invocationId ?? path.basename(report.path, '.json');
  const generatedAt = value.generatedAt ?? manifest.generatedAt ?? report.modifiedTime;
  const scanRange = normalizeScanRange(
    manifest.scanRange ??
    value.scanRange ??
    value.snapshot?.path ??
    value.path ??
    ['**/*']
  );
  const isWriteGate = manifest.kind === 'write-gate.pre-write-advisory';
  return {
    id: isWriteGate ? `write-gate.${invocationId}` : `runtime-report.${path.basename(report.path, '.json')}`,
    kind: isWriteGate ? 'write-gate-advisory' : 'runtime-report',
    sourceReport: report.path,
    scanRange,
    confidence: value.conflicts?.length > 0 || value.blockers?.length > 0 ? 'low' : 'medium',
    observedAt: dateOnly(generatedAt),
    evidence: {
      invocationId,
      reportKind: manifest.kind ?? null,
      warnings: value.warnings?.length ?? 0,
      conflicts: value.conflicts?.length ?? 0
    }
  };
}

async function loadPromotedFacts({ target, playbook, filePath }) {
  const warnings = [];
  const conflicts = [];
  const sources = [];
  const files = [];

  if (filePath) {
    const resolved = resolveTargetFile(target, filePath);
    if (!resolved.ok) {
      return {
        facts: [],
        sources: [],
        warnings,
        conflicts: [{
          id: 'canon.check.path-invalid',
          message: 'Canon fact path must be a portable path inside the target repository.',
          paths: [normalizePortablePath(String(filePath))]
        }]
      };
    }
    files.push(resolved.fullPath);
  } else {
    const memoryRoot = path.join(playbook.root, 'memory');
    files.push(...await walkFiles(memoryRoot, (file) => file.endsWith('.json')));
  }

  files.sort((left, right) => left.localeCompare(right));
  const facts = [];
  for (const file of files) {
    const relativePath = normalizePortablePath(path.relative(target, file));
    let parsed;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      conflicts.push({
        id: 'canon.check.file-malformed',
        message: `Could not parse canon facts from ${relativePath}: ${error.message}`,
        paths: [relativePath]
      });
      continue;
    }
    const extracted = extractFactArray(parsed);
    if (extracted.length === 0) continue;
    sources.push({ path: relativePath, facts: extracted.length });
    for (const fact of extracted) {
      facts.push({ fact, sourceFile: relativePath });
    }
  }

  return { facts, sources, warnings, conflicts };
}

function extractFactArray(parsed) {
  if (Array.isArray(parsed)) return parsed.filter(isRecord);
  if (Array.isArray(parsed?.facts)) return parsed.facts.filter(isRecord);
  if (isRecord(parsed) && typeof parsed.id === 'string' && typeof parsed.kind === 'string') return [parsed];
  return [];
}

async function checkPromotedFact({ target, entry }) {
  const { fact, sourceFile } = entry;
  const warnings = [];
  const conflicts = [];
  const base = normalizeFact(fact, sourceFile);
  const invalidReasons = validateFactShape(base);
  if (invalidReasons.length > 0) {
    warnings.push({
      id: 'canon.fact.unverified',
      message: `${base.id} cannot be verified: ${invalidReasons.join(', ')}.`,
      paths: [sourceFile]
    });
    return {
      fact: checkedFact(base, 'unverified', { matchedFiles: 0, changedPaths: [], missingPaths: [], reasons: invalidReasons }),
      warnings,
      conflicts
    };
  }

  if (!base.sourceReport) {
    warnings.push({
      id: 'canon.fact.unverified',
      message: `${base.id} has no sourceReport, so it remains unverified.`,
      paths: [sourceFile]
    });
    return {
      fact: checkedFact(base, 'unverified', { matchedFiles: 0, changedPaths: [], missingPaths: [], reasons: ['missing sourceReport'] }),
      warnings,
      conflicts
    };
  }

  const reportPath = resolveTargetFile(target, base.sourceReport);
  if (!reportPath.ok) {
    warnings.push({
      id: 'canon.fact.unverified',
      message: `${base.id} sourceReport is not a safe target-relative path.`,
      paths: [sourceFile, base.sourceReport]
    });
    return {
      fact: checkedFact(base, 'unverified', { matchedFiles: 0, changedPaths: [], missingPaths: [], reasons: ['unsafe sourceReport'] }),
      warnings,
      conflicts
    };
  }
  if (!existsSync(reportPath.fullPath)) {
    const conflict = {
      id: 'canon.fact.source-report-missing',
      message: `${base.id} source report is missing: ${base.sourceReport}.`,
      paths: [sourceFile, base.sourceReport]
    };
    conflicts.push(conflict);
    return {
      fact: checkedFact(base, 'missing', { matchedFiles: 0, changedPaths: [], missingPaths: [base.sourceReport], reasons: ['missing sourceReport'] }),
      warnings,
      conflicts
    };
  }

  const report = await readJsonReport({ target, file: reportPath.fullPath, relativePath: base.sourceReport });
  if (!report.ok) {
    warnings.push({
      id: 'canon.fact.unverified',
      message: `${base.id} sourceReport could not be parsed: ${report.message}.`,
      paths: [sourceFile, base.sourceReport]
    });
    return {
      fact: checkedFact(base, 'unverified', { matchedFiles: 0, changedPaths: [], missingPaths: [], reasons: ['sourceReport malformed'] }),
      warnings,
      conflicts
    };
  }

  const verification = await verifyAgainstReport({ target, fact: base, report });
  const reportValue = reportObject(report);
  const reportObservedAt = dateOnly(reportValue.generatedAt ?? reportValue.manifest?.generatedAt ?? report.modifiedTime);
  const stale = isNewerDate(reportObservedAt, base.observedAt);
  if (verification.status === 'missing') {
    conflicts.push({
      id: 'canon.fact.path-missing',
      message: `${base.id} references paths that are missing in the current repository.`,
      paths: [sourceFile, ...verification.missingPaths]
    });
    return { fact: checkedFact(base, 'missing', verification, reportObservedAt), warnings, conflicts };
  }
  if (verification.status === 'changed') {
    conflicts.push({
      id: 'canon.fact.changed',
      message: `${base.id} has drifted from its source report snapshot.`,
      paths: [sourceFile, ...verification.changedPaths]
    });
    return { fact: checkedFact(base, 'changed', verification, reportObservedAt), warnings, conflicts };
  }
  if (verification.status === 'unverified') {
    warnings.push({
      id: 'canon.fact.unverified',
      message: `${base.id} source report does not provide enough evidence for the scan range.`,
      paths: [sourceFile, base.sourceReport]
    });
    return { fact: checkedFact(base, 'unverified', verification, reportObservedAt), warnings, conflicts };
  }
  if (stale) {
    warnings.push({
      id: 'canon.fact.stale',
      message: `${base.id} is older than its source report evidence.`,
      paths: [sourceFile, base.sourceReport]
    });
    return { fact: checkedFact(base, 'stale', verification, reportObservedAt), warnings, conflicts };
  }

  return { fact: checkedFact(base, 'verified', verification, reportObservedAt), warnings, conflicts };
}

function normalizeFact(fact, sourceFile) {
  return {
    sourceFile,
    id: typeof fact.id === 'string' && fact.id.trim() ? fact.id.trim() : 'unknown-fact',
    kind: typeof fact.kind === 'string' && fact.kind.trim() ? fact.kind.trim() : 'unknown',
    sourceReport: typeof fact.sourceReport === 'string' && fact.sourceReport.trim()
      ? normalizePortablePath(fact.sourceReport.trim())
      : null,
    scanRange: normalizeScanRange(fact.scanRange),
    confidence: typeof fact.confidence === 'string' ? fact.confidence : 'unknown',
    observedAt: typeof fact.observedAt === 'string' ? fact.observedAt : null
  };
}

function validateFactShape(fact) {
  const reasons = [];
  if (fact.id === 'unknown-fact') reasons.push('missing id');
  if (fact.kind === 'unknown') reasons.push('missing kind');
  if (!CONFIDENCE_VALUES.has(fact.confidence)) reasons.push('confidence must be low, medium, or high');
  if (!isDateOnly(fact.observedAt)) reasons.push('observedAt must be YYYY-MM-DD');
  if (!Array.isArray(fact.scanRange) || fact.scanRange.length === 0) reasons.push('scanRange is empty');
  if (fact.scanRange.some((item) => !isSafePortablePath(item))) reasons.push('scanRange contains an unsafe path');
  return reasons;
}

async function verifyAgainstReport({ target, fact, report }) {
  const value = reportObject(report);
  if (Array.isArray(value.snapshot?.files)) {
    return verifySnapshotFiles({ target, fact, files: value.snapshot.files });
  }
  if (Array.isArray(value.files)) {
    return verifyInventoryFiles({ target, fact, files: value.files });
  }
  return {
    status: 'unverified',
    matchedFiles: 0,
    changedPaths: [],
    missingPaths: [],
    reasons: ['source report has no verifiable file inventory']
  };
}

async function verifySnapshotFiles({ target, fact, files }) {
  const selected = files
    .filter((file) => typeof file.path === 'string' && typeof file.hash === 'string')
    .filter((file) => matchesScanRange(file.path, fact.scanRange));
  if (selected.length === 0) {
    return emptyVerification('unverified', 'no snapshot files matched scanRange');
  }

  const changedPaths = [];
  const missingPaths = [];
  for (const file of selected) {
    const current = resolveTargetFile(target, file.path);
    if (!current.ok || !existsSync(current.fullPath)) {
      missingPaths.push(file.path);
      continue;
    }
    const currentHash = await hashFile(current.fullPath);
    if (currentHash !== file.hash) changedPaths.push(file.path);
  }
  return driftVerification({ matchedFiles: selected.length, changedPaths, missingPaths });
}

async function verifyInventoryFiles({ target, fact, files }) {
  const selected = files
    .filter((file) => typeof file.path === 'string')
    .filter((file) => matchesScanRange(file.path, fact.scanRange));
  if (selected.length === 0) {
    return emptyVerification('unverified', 'no inventory files matched scanRange');
  }

  const changedPaths = [];
  const missingPaths = [];
  for (const file of selected) {
    const current = resolveTargetFile(target, file.path);
    if (!current.ok || !existsSync(current.fullPath)) {
      missingPaths.push(file.path);
      continue;
    }
    if (typeof file.hash === 'string') {
      const currentHash = await hashFile(current.fullPath);
      if (currentHash !== file.hash) changedPaths.push(file.path);
      continue;
    }
    if (typeof file.modifiedTime === 'string') {
      const info = await stat(current.fullPath);
      if (info.mtime.toISOString() !== file.modifiedTime) changedPaths.push(file.path);
    }
  }
  return driftVerification({ matchedFiles: selected.length, changedPaths, missingPaths });
}

function driftVerification({ matchedFiles, changedPaths, missingPaths }) {
  if (missingPaths.length > 0) {
    return { status: 'missing', matchedFiles, changedPaths, missingPaths, reasons: [] };
  }
  if (changedPaths.length > 0) {
    return { status: 'changed', matchedFiles, changedPaths, missingPaths, reasons: [] };
  }
  return { status: 'verified', matchedFiles, changedPaths, missingPaths, reasons: [] };
}

function emptyVerification(status, reason) {
  return {
    status,
    matchedFiles: 0,
    changedPaths: [],
    missingPaths: [],
    reasons: [reason]
  };
}

function checkedFact(fact, status, verification, reportObservedAt = null) {
  return {
    id: fact.id,
    kind: fact.kind,
    sourceFile: fact.sourceFile,
    sourceReport: fact.sourceReport,
    scanRange: fact.scanRange,
    confidence: fact.confidence,
    observedAt: fact.observedAt,
    reportObservedAt,
    status,
    checks: {
      matchedFiles: verification.matchedFiles,
      changedPaths: verification.changedPaths,
      missingPaths: verification.missingPaths,
      reasons: verification.reasons
    }
  };
}

function summarizeCheckedFacts(facts, warnings, conflicts) {
  const summary = {
    facts: facts.length,
    verified: 0,
    missing: 0,
    stale: 0,
    changed: 0,
    unverified: 0,
    warnings: warnings.length,
    conflicts: conflicts.length
  };
  for (const fact of facts) {
    if (Object.hasOwn(summary, fact.status)) summary[fact.status] += 1;
  }
  return summary;
}

function reportObject(report) {
  return isRecord(report.value) ? report.value : {};
}

function resolveTargetFile(target, portablePath) {
  const normalized = normalizePortablePath(String(portablePath));
  if (!isSafePortablePath(normalized)) return { ok: false, path: normalized, fullPath: null };
  const fullPath = path.resolve(target, ...normalized.split('/'));
  const relative = path.relative(target, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: normalized, fullPath };
  }
  return { ok: true, path: normalized, fullPath };
}

function normalizeScanRange(value) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(raw
    .map((item) => normalizePortablePath(String(item).trim()))
    .filter(Boolean))];
}

function matchesScanRange(filePath, scanRange) {
  const normalized = normalizePortablePath(filePath);
  return scanRange.some((pattern) => {
    if (pattern === '.' || pattern === '**/*') return true;
    if (pattern.includes('*') || pattern.includes('?')) return globMatches(pattern, normalized);
    return normalized === pattern || normalized.startsWith(`${pattern.replace(/\/$/, '')}/`);
  });
}

function dateOnly(value) {
  if (!value) return todayIso();
  const text = String(value);
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : todayIso();
}

function isDateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNewerDate(left, right) {
  if (!isDateOnly(left) || !isDateOnly(right)) return false;
  return left > right;
}
