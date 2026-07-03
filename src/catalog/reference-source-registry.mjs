import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  isSafePortablePath,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from '../harness/core.mjs';
import { validateSourceRegistry } from '../runtime/schemas.mjs';
import { buildReferenceAdoptionQueue } from './reference-adoption.mjs';

const DEFAULT_QUEUE_RESULTS = 20;
const SOURCE_REGISTRY_PATH = 'knowledge/sources.json';
const DEFAULT_STALE_DAYS = 90;

export async function buildReferenceSourceRegistryPreview({
  target,
  maxProjects,
  maxDepth,
  maxResults = DEFAULT_QUEUE_RESULTS
}) {
  const queue = await buildReferenceAdoptionQueue({ target, maxProjects, maxDepth, maxResults });
  const freshness = new Date().toISOString().slice(0, 10);
  const sources = queue.queue.map((item) => sourceRegistryEntry(item, freshness));
  const registry = {
    schemaVersion: SCHEMA_VERSION,
    sources
  };
  const validation = validateSourceRegistry(registry, { path: 'knowledge/sources.json' });
  const conflicts = [...queue.conflicts, ...validation.conflicts];
  const warnings = [...queue.warnings, ...validation.warnings];

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: queue.target,
    mode: { localOnly: true, network: false, writes: false },
    candidatePath: '.ai-playbook/knowledge/sources.json',
    summary: {
      sources: sources.length,
      priorities: queue.summary.priorities,
      recommendedCapabilities: queue.summary.recommendedCapabilities,
      schemaValid: validation.ok,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    registry,
    warnings,
    conflicts
  };
}

export async function checkReferenceSourceRegistry({
  target,
  filePath,
  referenceDir,
  staleDays = DEFAULT_STALE_DAYS
}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const resolvedRegistry = resolveSourceRegistryPath({ target: resolvedTarget, filePath });
  const warnings = [];
  const conflicts = [];
  const statusCounts = {};
  const privacyTiers = {};
  const types = {};
  let staleSources = 0;
  let duplicateIds = 0;
  let missingReferencePaths = 0;
  let missingRepresentativeFiles = 0;

  if (!resolvedRegistry.ok) {
    conflicts.push(sourceRegistryFinding('reference-source-registry.path-invalid', 'Source registry path must stay inside the target repository.', [resolvedRegistry.relativePath]));
    return sourceRegistryCheckResult({ target: resolvedTarget, path: resolvedRegistry.relativePath, schemaValid: false, entries: 0, statusCounts, privacyTiers, types, staleSources, duplicateIds, missingReferencePaths, missingRepresentativeFiles, warnings, conflicts });
  }

  if (!existsSync(resolvedRegistry.path)) {
    conflicts.push(sourceRegistryFinding('reference-source-registry.missing', 'Source registry file is missing.', [resolvedRegistry.relativePath]));
    return sourceRegistryCheckResult({ target: resolvedTarget, path: resolvedRegistry.relativePath, schemaValid: false, entries: 0, statusCounts, privacyTiers, types, staleSources, duplicateIds, missingReferencePaths, missingRepresentativeFiles, warnings, conflicts });
  }

  let registry;
  try {
    registry = JSON.parse(await readFile(resolvedRegistry.path, 'utf8'));
  } catch (error) {
    conflicts.push(sourceRegistryFinding('reference-source-registry.malformed-json', `Source registry JSON could not be parsed: ${formatReadError(error)}.`, [resolvedRegistry.relativePath]));
    return sourceRegistryCheckResult({ target: resolvedTarget, path: resolvedRegistry.relativePath, schemaValid: false, entries: 0, statusCounts, privacyTiers, types, staleSources, duplicateIds, missingReferencePaths, missingRepresentativeFiles, warnings, conflicts });
  }

  const validation = validateSourceRegistry(registry, { path: resolvedRegistry.relativePath });
  warnings.push(...validation.warnings);
  conflicts.push(...validation.conflicts);
  const sources = Array.isArray(registry.sources) ? registry.sources : [];
  const seenIds = new Set();
  const referenceRoot = referenceDir ? resolveReferenceRoot(referenceDir, resolvedTarget) : null;
  if (referenceRoot && !existsSync(referenceRoot)) {
    conflicts.push(sourceRegistryFinding('reference-source-registry.reference-dir-missing', 'Reference directory does not exist.', [normalizePortablePath(String(referenceDir))]));
  }

  for (const [index, source] of sources.entries()) {
    if (!isRecord(source)) continue;
    const sourcePath = `${resolvedRegistry.relativePath}.sources[${index}]`;
    countValue(statusCounts, source.status);
    countValue(privacyTiers, source.privacyTier);
    countValue(types, source.type);

    if (typeof source.id === 'string') {
      if (seenIds.has(source.id)) {
        duplicateIds += 1;
        conflicts.push(sourceRegistryFinding('reference-source-registry.duplicate-id', `Duplicate source id: ${source.id}.`, [sourcePath]));
      }
      seenIds.add(source.id);
    }

    const freshness = freshnessFinding(source.freshness, staleDays);
    if (freshness.kind === 'stale') {
      staleSources += 1;
      warnings.push(sourceRegistryFinding('reference-source-registry.stale-freshness', `Source freshness is older than ${staleDays} day(s).`, [sourcePath]));
    } else if (freshness.kind === 'malformed') {
      warnings.push(sourceRegistryFinding('reference-source-registry.malformed-freshness', 'Source freshness should be an ISO date string such as YYYY-MM-DD.', [sourcePath]));
    }

    if (referenceRoot && existsSync(referenceRoot) && typeof source.referencePath === 'string') {
      const resolvedReference = resolveReferenceChild(referenceRoot, source.referencePath);
      if (!resolvedReference.ok) {
        conflicts.push(sourceRegistryFinding('reference-source-registry.reference-path-invalid', 'referencePath must be a portable relative path inside the reference directory.', [sourcePath]));
      } else if (!existsSync(resolvedReference.path)) {
        missingReferencePaths += 1;
        conflicts.push(sourceRegistryFinding('reference-source-registry.reference-path-missing', 'Registered referencePath does not exist under the provided reference directory.', [source.referencePath]));
      } else if (Array.isArray(source.representativeFiles)) {
        for (const representativeFile of source.representativeFiles) {
          if (typeof representativeFile !== 'string') continue;
          const combined = normalizePortablePath(`${source.referencePath}/${representativeFile}`);
          const resolvedRepresentative = resolveReferenceChild(referenceRoot, combined);
          if (!resolvedRepresentative.ok) {
            conflicts.push(sourceRegistryFinding('reference-source-registry.representative-file-invalid', 'Representative file must stay inside the registered reference path.', [sourcePath]));
          } else if (!existsSync(resolvedRepresentative.path)) {
            missingRepresentativeFiles += 1;
            warnings.push(sourceRegistryFinding('reference-source-registry.representative-file-missing', 'Representative file no longer exists under the provided reference directory.', [combined]));
          }
        }
      }
    }
  }

  return sourceRegistryCheckResult({
    target: resolvedTarget,
    path: resolvedRegistry.relativePath,
    schemaValid: validation.ok,
    entries: sources.length,
    statusCounts,
    privacyTiers,
    types,
    staleSources,
    duplicateIds,
    missingReferencePaths,
    missingRepresentativeFiles,
    warnings,
    conflicts
  });
}

function sourceRegistryEntry(item, freshness) {
  return {
    id: `reference-${normalizeRegistryKey(item.project, 'source')}`,
    type: item.signalHighlights.some((highlight) => highlight.signal === 'docs') ? 'docs' : 'other',
    title: `Reference source: ${item.project}`,
    owner: 'local-reference-collection',
    status: 'available',
    privacyTier: 'internal',
    credentialBoundary: 'local filesystem only; do not inline secrets or private URLs',
    updateCadence: 'manual',
    freshness,
    locatorTypes: ['path-range', 'file'],
    searchModes: ['keyword', 'inventory-signal'],
    browse: 'Open paths relative to the scanned reference root and cite project-relative file and line locators.',
    promotionPolicy: 'Summarize reusable patterns into the reference adoption ledger before promoting facts into memory or references.',
    caveats: [
      'Queue score is a triage signal, not a trust decision.',
      'Representative files are candidates and must be reviewed before adoption.',
      'Do not copy upstream prose, local absolute paths, credentials, or internal URLs into public docs.'
    ],
    referencePath: item.path,
    priority: item.priority,
    score: item.score,
    recommendedCapabilities: item.recommendedCapabilities,
    candidateCapabilities: item.candidateCapabilities,
    representativeFiles: item.representativeFiles,
    signalHighlights: item.signalHighlights,
    nextActions: item.nextActions
  };
}

function resolveSourceRegistryPath({ target, filePath }) {
  const registryPath = filePath
    ? path.resolve(target, filePath)
    : path.join(resolvePlaybookLayout(target).root, ...SOURCE_REGISTRY_PATH.split('/'));
  const relative = path.relative(target, registryPath);
  const relativePath = normalizePortablePath(relative || SOURCE_REGISTRY_PATH);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: registryPath, relativePath: normalizePortablePath(String(filePath ?? registryPath)) };
  }
  return { ok: true, path: registryPath, relativePath };
}

function resolveReferenceRoot(referenceDir, target) {
  return path.resolve(target, referenceDir);
}

function resolveReferenceChild(referenceRoot, childPath) {
  const normalized = normalizePortablePath(childPath);
  if (!isSafePortablePath(normalized)) {
    return { ok: false, path: path.resolve(referenceRoot, childPath), relativePath: normalized };
  }
  const resolved = path.resolve(referenceRoot, ...normalized.split('/'));
  const relative = path.relative(referenceRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: resolved, relativePath: normalized };
  }
  return { ok: true, path: resolved, relativePath: normalized };
}

function freshnessFinding(value, staleDays) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { kind: 'malformed' };
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return { kind: 'malformed' };
  const ageDays = (Date.now() - timestamp) / 86400000;
  if (ageDays > staleDays) return { kind: 'stale' };
  return { kind: 'fresh' };
}

function countValue(counts, value) {
  const key = String(value ?? 'unknown').trim() || 'unknown';
  counts[key] = (counts[key] ?? 0) + 1;
}

function normalizeRegistryKey(value, fallback) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9가-힣._/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function formatReadError(error) {
  if (error instanceof Error && error.message) return error.message;
  return 'read failed';
}

function sourceRegistryCheckResult({
  target,
  path: registryPath,
  schemaValid,
  entries,
  statusCounts,
  privacyTiers,
  types,
  staleSources,
  duplicateIds,
  missingReferencePaths,
  missingRepresentativeFiles,
  warnings,
  conflicts
}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    mode: { localOnly: true, network: false, writes: false },
    path: registryPath,
    summary: {
      entries,
      statuses: statusCounts,
      privacyTiers,
      types,
      schemaValid,
      staleSources,
      duplicateIds,
      missingReferencePaths,
      missingRepresentativeFiles,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    warnings,
    conflicts
  };
}

function sourceRegistryFinding(id, message, paths) {
  return { id, message, paths };
}
