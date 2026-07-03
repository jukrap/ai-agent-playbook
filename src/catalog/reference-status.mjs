import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  isRecord,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from '../harness/core.mjs';
import { validateSourceRegistry } from '../runtime/schemas.mjs';
import { buildReferenceAdoptionQueue } from './reference-adoption.mjs';

const DEFAULT_MAX_PROJECTS = 100;
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_STATUS_RESULTS = 20;
const SOURCE_REGISTRY_PATH = 'knowledge/sources.json';
const LEDGER_PATH = 'knowledge/reference-adoption-ledger.md';

export async function buildReferenceAdoptionStatus({
  target,
  referenceDir,
  filePath,
  ledgerPath,
  capability,
  maxProjects = DEFAULT_MAX_PROJECTS,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxResults = DEFAULT_STATUS_RESULTS
}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const warnings = [];
  const conflicts = [];
  const resolvedReferenceDir = resolveExternalDirectory({ target: resolvedTarget, directory: referenceDir });
  const resolvedRegistry = resolvePlaybookFile({
    target: resolvedTarget,
    filePath,
    defaultPortablePath: SOURCE_REGISTRY_PATH
  });
  const resolvedLedger = resolvePlaybookFile({
    target: resolvedTarget,
    filePath: ledgerPath,
    defaultPortablePath: LEDGER_PATH
  });
  const explicitRegistry = hasText(filePath);
  const explicitLedger = hasText(ledgerPath);
  const capabilityFilter = normalizeStatusKey(capability, '');

  if (!referenceDir) {
    conflicts.push(statusFinding('reference-adoption-status.reference-dir-required', 'Reference directory is required.', []));
  } else if (!await isDirectoryPath(resolvedReferenceDir)) {
    conflicts.push(statusFinding('reference-adoption-status.reference-dir-missing', 'Reference directory does not exist.', [normalizePortablePath(String(referenceDir))]));
  }

  if (!resolvedRegistry.ok) {
    conflicts.push(statusFinding('reference-adoption-status.source-registry-path-invalid', 'Source registry path must stay inside the target repository.', [resolvedRegistry.relativePath]));
  }

  if (!resolvedLedger.ok) {
    conflicts.push(statusFinding('reference-adoption-status.ledger-path-invalid', 'Reference adoption ledger path must stay inside the target repository.', [resolvedLedger.relativePath]));
  }

  if (explicitLedger && resolvedLedger.ok && !existsSync(resolvedLedger.path)) {
    conflicts.push(statusFinding('reference-adoption-status.ledger-missing', 'Explicit reference adoption ledger path does not exist.', [resolvedLedger.relativePath]));
  }

  let sourceIndex = emptySourceIndex();
  if (resolvedRegistry.ok) {
    sourceIndex = await loadStatusSourceRegistry({ registryPath: resolvedRegistry.path, relativePath: resolvedRegistry.relativePath });
    warnings.push(...sourceIndex.warnings);
    conflicts.push(...sourceIndex.conflicts);
    if (!sourceIndex.exists && !explicitRegistry) {
      warnings.push(statusFinding('reference-adoption-status.source-registry-missing', 'Source registry is missing; queued references will be reported as source-missing.', [resolvedRegistry.relativePath]));
    } else if (!sourceIndex.exists && explicitRegistry) {
      conflicts.push(statusFinding('reference-adoption-status.source-registry-missing', 'Explicit source registry path does not exist.', [resolvedRegistry.relativePath]));
    }
  }

  if (!explicitLedger && resolvedLedger.ok && !existsSync(resolvedLedger.path)) {
    warnings.push(statusFinding('reference-adoption-status.ledger-missing', 'Reference adoption ledger is missing; queued references will be reported as untracked.', [resolvedLedger.relativePath]));
  }

  let queue = null;
  if (conflicts.length === 0) {
    queue = await buildReferenceAdoptionQueue({
      target: resolvedReferenceDir,
      maxProjects,
      maxDepth,
      maxResults: maxProjects,
      ledgerPath: existsSync(resolvedLedger.path) ? resolvedLedger.path : undefined
    });
    warnings.push(...queue.warnings);
    conflicts.push(...queue.conflicts);
  }

  const limit = statusLimit(maxResults);
  const queueRows = (queue?.queue ?? [])
    .filter((item) => statusMatchesCapability(item, capabilityFilter))
    .slice(0, limit);
  const items = queueRows.map((item) => statusItem({ item, sourceIndex }));
  const summary = statusSummary({ queue, items, warnings, conflicts });

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.adoption-status',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    referenceDir: referenceDir ? normalizePortablePath(path.relative(resolvedTarget, resolvedReferenceDir)) : null,
    mode: { localOnly: true, network: false, writes: false },
    filter: {
      capability: capabilityFilter || null
    },
    paths: {
      sourceRegistry: resolvedRegistry.relativePath,
      ledger: resolvedLedger.relativePath
    },
    summary,
    items,
    capabilities: statusCapabilities(items),
    warnings,
    conflicts
  };
}

function statusItem({ item, sourceIndex }) {
  const source = findSourceForQueueItem(sourceIndex, item);
  const ledgerStatus = item.ledgerStatus ?? 'untracked';
  const result = {
    project: item.project,
    referenceId: stableReferenceSourceId(item.project),
    path: item.path,
    score: item.score,
    priority: item.priority,
    ledgerStatus,
    sourceRegistered: Boolean(source),
    recommendedCapabilities: item.recommendedCapabilities,
    candidateCapabilities: item.candidateCapabilities,
    signalHighlights: item.signalHighlights.slice(0, 5),
    representativeFiles: item.representativeFiles.slice(0, 5),
    nextActions: item.nextActions.slice(0, 3)
  };
  if (item.ledgerReferenceId) result.ledgerReferenceId = item.ledgerReferenceId;
  if (item.ledgerCapability) result.ledgerCapability = item.ledgerCapability;
  if (item.ledgerDecisionDate) result.ledgerDecisionDate = item.ledgerDecisionDate;
  if (source) {
    result.sourceId = source.id;
    result.sourceStatus = source.status ?? null;
    result.sourceFreshness = source.freshness ?? null;
    result.sourceReferencePath = source.referencePath ?? null;
  }
  return result;
}

function statusSummary({ queue, items, warnings, conflicts }) {
  const ledgerStatuses = {};
  const priorities = { high: 0, medium: 0, low: 0 };
  let sourceRegistered = 0;
  for (const item of items) {
    priorities[item.priority] = (priorities[item.priority] ?? 0) + 1;
    ledgerStatuses[item.ledgerStatus] = (ledgerStatuses[item.ledgerStatus] ?? 0) + 1;
    if (item.sourceRegistered) sourceRegistered += 1;
  }
  return {
    inventoryProjects: queue?.summary?.inventoryProjects ?? 0,
    totalProjects: queue?.summary?.totalProjects ?? 0,
    queueItems: items.length,
    priorities,
    ledgerStatuses,
    sourceRegistered,
    sourceMissing: items.length - sourceRegistered,
    warnings: warnings.length,
    conflicts: conflicts.length
  };
}

function statusCapabilities(items) {
  const groups = new Map();
  for (const item of items) {
    for (const capability of statusCapabilityIds(item)) {
      if (!groups.has(capability)) {
        groups.set(capability, {
          capability,
          queueItems: 0,
          sourceRegistered: 0,
          sourceMissing: 0,
          priorities: { high: 0, medium: 0, low: 0 },
          ledgerStatuses: {},
          references: []
        });
      }
      const group = groups.get(capability);
      group.queueItems += 1;
      if (item.sourceRegistered) group.sourceRegistered += 1;
      else group.sourceMissing += 1;
      group.priorities[item.priority] = (group.priorities[item.priority] ?? 0) + 1;
      group.ledgerStatuses[item.ledgerStatus] = (group.ledgerStatuses[item.ledgerStatus] ?? 0) + 1;
      group.references.push({
        project: item.project,
        priority: item.priority,
        ledgerStatus: item.ledgerStatus,
        sourceRegistered: item.sourceRegistered
      });
    }
  }
  return [...groups.values()].sort((left, right) => left.capability.localeCompare(right.capability));
}

async function loadStatusSourceRegistry({ registryPath, relativePath }) {
  const warnings = [];
  const conflicts = [];
  const byReferencePath = new Map();
  const byId = new Map();

  if (!existsSync(registryPath)) {
    return {
      exists: false,
      byReferencePath,
      byId,
      warnings,
      conflicts
    };
  }

  let registry;
  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch (error) {
    conflicts.push(statusFinding('reference-adoption-status.source-registry-malformed-json', `Source registry JSON could not be parsed: ${formatReadError(error)}.`, [relativePath]));
    return {
      exists: true,
      byReferencePath,
      byId,
      warnings,
      conflicts
    };
  }

  const validation = validateSourceRegistry(registry, { path: relativePath });
  warnings.push(...validation.warnings);
  conflicts.push(...validation.conflicts);
  const sources = Array.isArray(registry.sources) ? registry.sources : [];
  for (const source of sources) {
    if (!isRecord(source)) continue;
    if (typeof source.id === 'string' && source.id.trim()) {
      byId.set(source.id, source);
    }
    if (typeof source.referencePath === 'string' && source.referencePath.trim()) {
      byReferencePath.set(normalizePortablePath(source.referencePath), source);
    }
  }

  return {
    exists: true,
    byReferencePath,
    byId,
    warnings,
    conflicts
  };
}

function findSourceForQueueItem(sourceIndex, item) {
  const referencePath = normalizePortablePath(item.path);
  return sourceIndex.byReferencePath.get(referencePath) ?? sourceIndex.byId.get(stableReferenceSourceId(item.project)) ?? null;
}

function emptySourceIndex() {
  return {
    exists: false,
    byReferencePath: new Map(),
    byId: new Map(),
    warnings: [],
    conflicts: []
  };
}

function statusCapabilityIds(item) {
  return [...new Set([
    ...item.recommendedCapabilities,
    ...item.candidateCapabilities
  ].map((capability) => normalizeStatusKey(capability, '')).filter(Boolean))];
}

function statusMatchesCapability(item, capabilityFilter) {
  if (!capabilityFilter) return true;
  return statusCapabilityIds(item).includes(capabilityFilter) || normalizeStatusKey(item.ledgerCapability, '') === capabilityFilter;
}

function stableReferenceSourceId(project) {
  return `reference-${normalizeStatusKey(project, 'source')}`;
}

function normalizeStatusKey(value, fallback) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9가-힣._/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function statusLimit(value) {
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_STATUS_RESULTS;
  return Math.min(value, DEFAULT_MAX_PROJECTS);
}

function resolveExternalDirectory({ target, directory }) {
  if (!directory) return target;
  return path.resolve(target, directory);
}

function resolvePlaybookFile({ target, filePath, defaultPortablePath }) {
  const playbook = resolvePlaybookLayout(target);
  const resolvedPath = filePath
    ? path.resolve(target, filePath)
    : path.join(playbook.root, ...defaultPortablePath.split('/'));
  const relative = path.relative(target, resolvedPath);
  const relativePath = normalizePortablePath(relative || defaultPortablePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: resolvedPath, relativePath: normalizePortablePath(String(filePath ?? resolvedPath)) };
  }
  return { ok: true, path: resolvedPath, relativePath };
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function statusFinding(id, message, paths) {
  return { id, message, paths };
}

function formatReadError(error) {
  if (error instanceof Error && error.message) return error.message;
  return 'read failed';
}

async function isDirectoryPath(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}
