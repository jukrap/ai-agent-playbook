import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  isRecord,
  isSafePortablePath,
  normalizePortablePath,
  SCHEMA_VERSION
} from '../harness/core.mjs';

const REQUIRED_FIELDS = [
  'schemaVersion',
  'kind',
  'target',
  'mode',
  'generatedAt',
  'summary',
  'warnings',
  'conflicts'
];

const KNOWN_RUNTIME_SCHEMA_KINDS = new Set([
  'runtime.artifact',
  'runtime.eval-definition',
  'runtime.eval-run-report',
  'runtime.capability-witness',
  'runtime.source-registry',
  'runtime.evidence-envelope',
  'runtime.repo-graph'
]);

const RISK_CLASSES = new Set(['low', 'medium', 'high', 'release-gate']);
const CAPABILITY_STATUSES = new Set(['pass', 'fail', 'degraded', 'skipped', 'unknown']);
const SOURCE_STATUSES = new Set(['available', 'building', 'partial', 'unavailable', 'failed', 'stale', 'unknown']);
const PRIVACY_TIERS = new Set(['public', 'internal', 'confidential', 'restricted', 'unknown']);
const PROMOTION_STATUSES = new Set(['runtime-only', 'candidate', 'promoted', 'rejected', 'expired']);
const REPO_GRAPH_NODE_KINDS = new Set(['file', 'doc', 'symbol', 'route', 'data', 'package', 'contract', 'rule', 'runtime-report', 'workflow']);
const REPO_GRAPH_EDGE_KINDS = new Set(['contains', 'exports', 'mentions', 'defines-route', 'uses-package', 'covered-by-contract', 'related-doc', 'evidence-for']);

export async function checkRuntimeSchema({ target, filePath, kind } = {}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const mode = { localOnly: true, network: false, writes: false };
  const warnings = [];
  const conflicts = [];
  const normalizedPath = normalizePortablePath(filePath ?? '');

  if (!normalizedPath || !isSafePortablePath(normalizedPath)) {
    conflicts.push(artifactConflict('runtime.schema.path-invalid', 'Schema check requires a portable target-relative --path.', []));
    return schemaCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, expectedKind: kind, value: null, warnings, conflicts });
  }

  const absolutePath = path.resolve(resolvedTarget, normalizedPath);
  const relative = path.relative(resolvedTarget, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    conflicts.push(artifactConflict('runtime.schema.path-outside-target', 'Schema check path must stay inside the target project.', [normalizedPath]));
    return schemaCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, expectedKind: kind, value: null, warnings, conflicts });
  }

  let rawJson;
  try {
    rawJson = await readFile(absolutePath, 'utf8');
  } catch (error) {
    conflicts.push(artifactConflict('runtime.schema.file-unreadable', `Could not read ${normalizedPath}: ${formatFileError(error)}`, [normalizedPath]));
    return schemaCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, expectedKind: kind, value: null, warnings, conflicts });
  }

  let value;
  try {
    value = JSON.parse(rawJson);
  } catch (error) {
    conflicts.push(artifactConflict('runtime.schema.file-unreadable', `Could not parse ${normalizedPath}: ${error.message}`, [normalizedPath]));
    return schemaCheckReport({ target: resolvedTarget, mode, filePath: normalizedPath, expectedKind: kind, value: null, warnings, conflicts });
  }

  const expectedKind = normalizeSchemaKind(kind) ?? detectRuntimeSchemaKind(value, normalizedPath);
  const validation = validateRuntimeSchema(value, { path: normalizedPath, expectedKind });
  return schemaCheckReport({
    target: resolvedTarget,
    mode,
    filePath: normalizedPath,
    expectedKind,
    value,
    warnings: [...warnings, ...validation.warnings],
    conflicts: [...conflicts, ...validation.conflicts]
  });
}

export function validateRuntimeSchema(value, options = {}) {
  const {
    path = 'runtime schema',
    expectedKind = detectRuntimeSchemaKind(value, path)
  } = options;

  if (!expectedKind) {
    const base = validateVersionedObject(value, { path, expectedKind: null });
    base.conflicts.push(artifactConflict('runtime.schema.kind-unknown', `${path} schema kind is unknown. Pass --kind or include a recognized kind.`, [path]));
    return finishValidation(base, value, path);
  }

  if (!KNOWN_RUNTIME_SCHEMA_KINDS.has(expectedKind)) {
    const base = validateVersionedObject(value, { path, expectedKind: null });
    base.conflicts.push(artifactConflict('runtime.schema.kind-unsupported', `${path} uses unsupported schema kind "${expectedKind}".`, [path]));
    return finishValidation(base, value, path);
  }

  if (expectedKind === 'runtime.artifact') return validateRuntimeArtifact(value, { path });
  if (expectedKind === 'runtime.eval-definition') return validateEvalDefinition(value, { path });
  if (expectedKind === 'runtime.eval-run-report') return validateEvalRunReport(value, { path });
  if (expectedKind === 'runtime.capability-witness') return validateCapabilityWitness(value, { path });
  if (expectedKind === 'runtime.source-registry') return validateSourceRegistry(value, { path });
  if (expectedKind === 'runtime.evidence-envelope') return validateEvidenceEnvelope(value, { path });
  if (expectedKind === 'runtime.repo-graph') return validateRepoGraph(value, { path });
  return validateRuntimeArtifact(value, { path, expectedKind });
}

export function validateRuntimeArtifact(value, options = {}) {
  const {
    path = 'runtime artifact',
    expectedKind
  } = options;
  const conflicts = [];
  const warnings = [];

  if (!isRecord(value)) {
    conflicts.push(artifactConflict('runtime.artifact.invalid-shape', `${path} must be a JSON object.`, [path]));
    return { ok: false, warnings, conflicts };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(value, field)) {
      conflicts.push(artifactConflict('runtime.artifact.missing-field', `${path} is missing required field "${field}".`, [path]));
    }
  }

  if (value.schemaVersion !== SCHEMA_VERSION) {
    conflicts.push(artifactConflict('runtime.artifact.schema-version', `${path} must use schemaVersion "${SCHEMA_VERSION}".`, [path]));
  }
  if (typeof value.kind !== 'string' || !value.kind.trim()) {
    conflicts.push(artifactConflict('runtime.artifact.kind', `${path} must include a non-empty kind.`, [path]));
  } else if (expectedKind && value.kind !== expectedKind) {
    conflicts.push(artifactConflict('runtime.artifact.kind-mismatch', `${path} kind must be "${expectedKind}".`, [path]));
  }
  if (typeof value.target !== 'string' || !value.target.trim()) {
    conflicts.push(artifactConflict('runtime.artifact.target', `${path} must include a target string.`, [path]));
  }
  if (!isRecord(value.mode)) {
    conflicts.push(artifactConflict('runtime.artifact.mode', `${path} mode must be an object.`, [path]));
  } else if (typeof value.mode.writes !== 'boolean') {
    conflicts.push(artifactConflict('runtime.artifact.mode-writes', `${path} mode.writes must be boolean.`, [path]));
  }
  if (!isIsoLikeTimestamp(value.generatedAt)) {
    conflicts.push(artifactConflict('runtime.artifact.generated-at', `${path} generatedAt must be an ISO-like timestamp.`, [path]));
  }
  if (!isRecord(value.summary)) {
    conflicts.push(artifactConflict('runtime.artifact.summary', `${path} summary must be an object.`, [path]));
  }
  if (!Array.isArray(value.warnings)) {
    conflicts.push(artifactConflict('runtime.artifact.warnings', `${path} warnings must be an array.`, [path]));
  }
  if (!Array.isArray(value.conflicts)) {
    conflicts.push(artifactConflict('runtime.artifact.conflicts', `${path} conflicts must be an array.`, [path]));
  }

  return {
    ok: conflicts.length === 0,
    warnings,
    conflicts
  };
}

export function validateEvalDefinition(value, options = {}) {
  const path = options.path ?? 'runtime eval definition';
  const validation = validateVersionedObject(value, { path, expectedKind: 'runtime.eval-definition' });
  if (!validation.valueOk) return finishValidation(validation, value, path);

  requireIdentifier(value, 'id', validation.conflicts, path);
  requireString(value, 'target', validation.conflicts, path);
  requireString(value, 'behavior', validation.conflicts, path);
  requireAllowed(value, 'riskClass', RISK_CLASSES, validation.conflicts, path);
  requirePresent(value, 'baseline', validation.conflicts, path);
  requireNonEmptyCollection(value, 'fixtures', validation.conflicts, path);
  requireNonEmptyCollection(value, 'graders', validation.conflicts, path);
  requireRecord(value, 'successCriteria', validation.conflicts, path);
  requireRecord(value, 'budgets', validation.conflicts, path);
  requireRecord(value, 'storage', validation.conflicts, path);
  validateStoragePaths(value.storage, validation.conflicts, path);
  return finishValidation(validation, value, path);
}

export function validateEvalRunReport(value, options = {}) {
  const path = options.path ?? 'runtime eval run report';
  const validation = validateVersionedObject(value, { path, expectedKind: 'runtime.eval-run-report' });
  if (!validation.valueOk) return finishValidation(validation, value, path);

  requireIdentifier(value, 'evalId', validation.conflicts, path);
  requireString(value, 'targetVersion', validation.conflicts, path);
  requireRecord(value, 'environment', validation.conflicts, path);
  requireRecord(value, 'attempts', validation.conflicts, path);
  requireNonEmptyCollection(value, 'results', validation.conflicts, path);
  validatePortablePathCollection(value.artifacts, 'artifacts', validation.conflicts, path);
  requireArray(value, 'caveats', validation.conflicts, path);
  requireAllowed(value, 'decision', new Set(['accepted', 'rejected', 'needs-follow-up', 'advisory-only']), validation.conflicts, path);
  return finishValidation(validation, value, path);
}

export function validateCapabilityWitness(value, options = {}) {
  const path = options.path ?? 'runtime capability witness';
  const validation = validateVersionedObject(value, { path, expectedKind: 'runtime.capability-witness' });
  if (!validation.valueOk) return finishValidation(validation, value, path);

  requireIdentifier(value, 'capabilityId', validation.conflicts, path);
  requireIdentifier(value, 'checkId', validation.conflicts, path);
  requireIsoTimestamp(value, 'timestamp', validation.conflicts, path);
  requireString(value, 'targetVersion', validation.conflicts, path);
  requireRecord(value, 'environment', validation.conflicts, path);
  requireAllowed(value, 'status', CAPABILITY_STATUSES, validation.conflicts, path);
  requireNonNegativeNumber(value, 'durationMs', validation.conflicts, path, { optional: true });
  requireString(value, 'summary', validation.conflicts, path);
  validatePortablePathCollection(value.artifacts, 'artifacts', validation.conflicts, path);
  requirePresent(value, 'baseline', validation.conflicts, path);
  requireArray(value, 'caveats', validation.conflicts, path);
  return finishValidation(validation, value, path);
}

export function validateSourceRegistry(value, options = {}) {
  const path = options.path ?? 'runtime source registry';
  const validation = validateVersionedObject(value, { path, expectedKind: null });
  if (!validation.valueOk) return finishValidation(validation, value, path);
  requireArray(value, 'sources', validation.conflicts, path);

  if (Array.isArray(value.sources)) {
    const sourceIds = new Set();
    value.sources.forEach((source, index) => {
      validateSourceEntry(source, index, validation.conflicts, path);
      if (!isRecord(source) || typeof source.id !== 'string') return;
      if (sourceIds.has(source.id)) {
        validation.conflicts.push(artifactConflict('runtime.schema.duplicate-source-id', `Duplicate source id: ${source.id}.`, [`${path}.sources[${index}]`]));
      }
      sourceIds.add(source.id);
    });
  }
  return finishValidation(validation, value, path);
}

export function validateEvidenceEnvelope(value, options = {}) {
  const path = options.path ?? 'runtime evidence envelope';
  const validation = validateVersionedObject(value, { path, expectedKind: 'runtime.evidence-envelope' });
  if (!validation.valueOk) return finishValidation(validation, value, path);

  requireIdentifier(value, 'sourceId', validation.conflicts, path);
  requireRecord(value, 'locator', validation.conflicts, path);
  if (isRecord(value.locator)) {
    requireString(value.locator, 'type', validation.conflicts, `${path}.locator`);
    validateLocatorPath(value.locator, validation.conflicts, `${path}.locator`);
  }
  requireString(value, 'query', validation.conflicts, path);
  requirePresent(value, 'scanRange', validation.conflicts, path);
  requirePresent(value, 'freshness', validation.conflicts, path);
  requireString(value, 'evidenceType', validation.conflicts, path);
  requireString(value, 'summary', validation.conflicts, path);
  requireArray(value, 'caveats', validation.conflicts, path);
  requireAllowed(value, 'promotionStatus', PROMOTION_STATUSES, validation.conflicts, path);
  return finishValidation(validation, value, path);
}

export function validateRepoGraph(value, options = {}) {
  const path = options.path ?? 'runtime repo graph';
  const validation = validateVersionedObject(value, { path, expectedKind: 'runtime.repo-graph' });
  if (!validation.valueOk) return finishValidation(validation, value, path, { allowAbsoluteTrails: new Set(['target']) });

  requireString(value, 'target', validation.conflicts, path);
  requireRecord(value, 'mode', validation.conflicts, path);
  if (isRecord(value.mode) && value.mode.writes !== false) {
    validation.conflicts.push(artifactConflict('runtime.schema.mode-writes', `${path}.mode.writes must be false for repo graph schema checks.`, [path]));
  }
  requireIsoTimestamp(value, 'generatedAt', validation.conflicts, path);
  requireString(value, 'graph', validation.conflicts, path);
  validateOptionalPortablePath(value.graph, 'graph', validation.conflicts, path);
  requireRecord(value, 'scanRange', validation.conflicts, path);
  requireArray(value, 'sources', validation.conflicts, path);
  requireArray(value, 'nodes', validation.conflicts, path);
  requireArray(value, 'edges', validation.conflicts, path);
  requireRecord(value, 'summary', validation.conflicts, path);
  requireArray(value, 'warnings', validation.conflicts, path);
  requireArray(value, 'conflicts', validation.conflicts, path);

  validateBoundedArray(value.sources, 'sources', 100, validation.conflicts, path);
  validateBoundedArray(value.nodes, 'nodes', 2000, validation.conflicts, path);
  validateBoundedArray(value.edges, 'edges', 4000, validation.conflicts, path);

  const nodeIds = new Set();
  if (Array.isArray(value.sources)) {
    value.sources.forEach((source, index) => validateRepoGraphSource(source, index, validation.conflicts, path));
  }
  if (Array.isArray(value.nodes)) {
    value.nodes.forEach((node, index) => validateRepoGraphNode(node, index, nodeIds, validation.conflicts, path));
  }
  if (Array.isArray(value.edges)) {
    value.edges.forEach((edge, index) => validateRepoGraphEdge(edge, index, nodeIds, validation.conflicts, path));
  }

  return finishValidation(validation, value, path, { allowAbsoluteTrails: new Set(['target']) });
}

export function assertRuntimeArtifact(value, options = {}) {
  const validation = validateRuntimeArtifact(value, options);
  if (!validation.ok) {
    const first = validation.conflicts[0]?.message ?? 'Invalid runtime artifact.';
    throw new Error(first);
  }
  return value;
}

function schemaCheckReport({ target, mode, filePath, expectedKind, value, warnings, conflicts }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.schema-check',
    ok: conflicts.length === 0,
    target,
    mode,
    path: filePath,
    expectedKind: expectedKind ?? null,
    generatedAt: new Date().toISOString(),
    summary: {
      schemaKind: expectedKind ?? null,
      valueKind: isRecord(value) ? value.kind ?? null : null,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    warnings,
    conflicts
  };
}

function detectRuntimeSchemaKind(value, filePath = '') {
  if (isRecord(value) && typeof value.kind === 'string' && KNOWN_RUNTIME_SCHEMA_KINDS.has(value.kind)) {
    return value.kind;
  }
  if (isRecord(value) && typeof value.kind === 'string' && value.kind.startsWith('runtime.')) {
    return 'runtime.artifact';
  }
  const normalized = normalizePortablePath(filePath).toLowerCase();
  if (normalized.endsWith('knowledge/sources.json')) return 'runtime.source-registry';
  return null;
}

function normalizeSchemaKind(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function validateVersionedObject(value, { path, expectedKind }) {
  const conflicts = [];
  const warnings = [];
  if (!isRecord(value)) {
    conflicts.push(artifactConflict('runtime.schema.invalid-shape', `${path} must be a JSON object.`, [path]));
    return { ok: false, valueOk: false, warnings, conflicts };
  }
  if (value.schemaVersion !== SCHEMA_VERSION) {
    conflicts.push(artifactConflict('runtime.schema.version', `${path} must use schemaVersion "${SCHEMA_VERSION}".`, [path]));
  }
  if (expectedKind && value.kind !== expectedKind) {
    conflicts.push(artifactConflict('runtime.schema.kind', `${path} kind must be "${expectedKind}".`, [path]));
  }
  return { ok: conflicts.length === 0, valueOk: true, warnings, conflicts };
}

function finishValidation(validation, value, path, options = {}) {
  if (isRecord(value)) validateUnsafeStrings(value, validation.conflicts, path, [], options);
  return {
    ok: validation.conflicts.length === 0,
    warnings: validation.warnings,
    conflicts: validation.conflicts
  };
}

function artifactConflict(id, message, paths) {
  return { id, level: 'fail', message, paths };
}

function formatFileError(error) {
  if (typeof error?.code === 'string') return error.code;
  return 'read failed';
}

function isIsoLikeTimestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function requirePresent(value, field, conflicts, path) {
  if (!Object.hasOwn(value, field) || value[field] === null || value[field] === undefined || value[field] === '') {
    conflicts.push(artifactConflict('runtime.schema.missing-field', `${path} is missing required field "${field}".`, [path]));
  }
}

function requireString(value, field, conflicts, path) {
  if (typeof value[field] !== 'string' || !value[field].trim()) {
    conflicts.push(artifactConflict('runtime.schema.string-field', `${path}.${field} must be a non-empty string.`, [path]));
  }
}

function requireIdentifier(value, field, conflicts, path) {
  requireString(value, field, conflicts, path);
  if (typeof value[field] === 'string' && !/^[a-z0-9][a-z0-9._:-]*$/.test(value[field])) {
    conflicts.push(artifactConflict('runtime.schema.identifier-field', `${path}.${field} must be a stable lowercase identifier.`, [path]));
  }
}

function requireAllowed(value, field, allowed, conflicts, path) {
  requireString(value, field, conflicts, path);
  if (typeof value[field] === 'string' && !allowed.has(value[field])) {
    conflicts.push(artifactConflict('runtime.schema.enum-field', `${path}.${field} has unsupported value "${value[field]}".`, [path]));
  }
}

function requireRecord(value, field, conflicts, path) {
  if (!isRecord(value[field])) {
    conflicts.push(artifactConflict('runtime.schema.object-field', `${path}.${field} must be an object.`, [path]));
  }
}

function requireArray(value, field, conflicts, path) {
  if (!Array.isArray(value[field])) {
    conflicts.push(artifactConflict('runtime.schema.array-field', `${path}.${field} must be an array.`, [path]));
  }
}

function requireNonEmptyCollection(value, field, conflicts, path) {
  const item = value[field];
  if (Array.isArray(item) && item.length > 0) return;
  if (isRecord(item) && Object.keys(item).length > 0) return;
  conflicts.push(artifactConflict('runtime.schema.non-empty-field', `${path}.${field} must be a non-empty array or object.`, [path]));
}

function requireIsoTimestamp(value, field, conflicts, path) {
  if (!isIsoLikeTimestamp(value[field])) {
    conflicts.push(artifactConflict('runtime.schema.timestamp-field', `${path}.${field} must be an ISO-like timestamp.`, [path]));
  }
}

function requireNonNegativeNumber(value, field, conflicts, path, options = {}) {
  const item = value[field];
  if (options.optional && (item === undefined || item === null || item === '')) return;
  if (typeof item !== 'number' || !Number.isFinite(item) || item < 0) {
    conflicts.push(artifactConflict('runtime.schema.number-field', `${path}.${field} must be a non-negative number.`, [path]));
  }
}

function validatePortablePathCollection(value, field, conflicts, path) {
  if (!Array.isArray(value)) {
    conflicts.push(artifactConflict('runtime.schema.array-field', `${path}.${field} must be an array.`, [path]));
    return;
  }
  for (const [index, item] of value.entries()) {
    const candidate = typeof item === 'string' ? item : isRecord(item) ? item.path : null;
    if (typeof candidate !== 'string' || !candidate.trim()) {
      conflicts.push(artifactConflict('runtime.schema.artifact-path', `${path}.${field}[${index}] must be a path string or object with path.`, [path]));
      continue;
    }
    if (!isSafePortablePath(normalizePortablePath(candidate))) {
      conflicts.push(artifactConflict('runtime.schema.artifact-path', `${path}.${field}[${index}] must be a portable relative path.`, [path]));
    }
  }
}

function validateStoragePaths(storage, conflicts, path) {
  if (!isRecord(storage)) return;
  for (const field of ['runtimePath', 'definitionPath', 'reportPath', 'promotionTarget']) {
    if (storage[field] === undefined) continue;
    if (typeof storage[field] !== 'string' || !isSafePortablePath(normalizePortablePath(storage[field]))) {
      conflicts.push(artifactConflict('runtime.schema.storage-path', `${path}.storage.${field} must be a portable relative path.`, [path]));
    }
  }
}

function validateSourceEntry(source, index, conflicts, path) {
  const sourcePath = `${path}.sources[${index}]`;
  if (!isRecord(source)) {
    conflicts.push(artifactConflict('runtime.schema.source-entry', `${sourcePath} must be an object.`, [path]));
    return;
  }
  requireIdentifier(source, 'id', conflicts, sourcePath);
  requireAllowed(source, 'type', new Set(['file', 'docs', 'issue-tracker', 'chat', 'database', 'object-store', 'web', 'runtime-index', 'report', 'other']), conflicts, sourcePath);
  requireString(source, 'title', conflicts, sourcePath);
  requireString(source, 'owner', conflicts, sourcePath);
  requireAllowed(source, 'status', SOURCE_STATUSES, conflicts, sourcePath);
  requireAllowed(source, 'privacyTier', PRIVACY_TIERS, conflicts, sourcePath);
  requireString(source, 'credentialBoundary', conflicts, sourcePath);
  requireString(source, 'updateCadence', conflicts, sourcePath);
  requirePresent(source, 'freshness', conflicts, sourcePath);
  requireArray(source, 'locatorTypes', conflicts, sourcePath);
  requireArray(source, 'searchModes', conflicts, sourcePath);
  requirePresent(source, 'browse', conflicts, sourcePath);
  requirePresent(source, 'promotionPolicy', conflicts, sourcePath);
  requireArray(source, 'caveats', conflicts, sourcePath);
}

function validateLocatorPath(locator, conflicts, path) {
  if (typeof locator.path === 'string' && !isSafePortablePath(normalizePortablePath(locator.path))) {
    conflicts.push(artifactConflict('runtime.schema.locator-path', `${path}.path must be a portable relative path.`, [path]));
  }
}

function validateRepoGraphSource(source, index, conflicts, path) {
  const sourcePath = `${path}.sources[${index}]`;
  if (!isRecord(source)) {
    conflicts.push(artifactConflict('runtime.schema.repo-graph-source', `${sourcePath} must be an object.`, [path]));
    return;
  }
  requireString(source, 'kind', conflicts, sourcePath);
  requireNonNegativeNumber(source, 'entries', conflicts, sourcePath, { optional: true });
  validateOptionalPortablePath(source.index, 'index', conflicts, sourcePath);
}

function validateRepoGraphNode(node, index, nodeIds, conflicts, path) {
  const nodePath = `${path}.nodes[${index}]`;
  if (!isRecord(node)) {
    conflicts.push(artifactConflict('runtime.schema.repo-graph-node', `${nodePath} must be an object.`, [path]));
    return;
  }
  requireString(node, 'id', conflicts, nodePath);
  requireAllowed(node, 'kind', REPO_GRAPH_NODE_KINDS, conflicts, nodePath);
  requireString(node, 'label', conflicts, nodePath);
  validateOptionalPortablePath(node.path, 'path', conflicts, nodePath);
  requireNonNegativeNumber(node, 'line', conflicts, nodePath, { optional: true });
  if (typeof node.id === 'string') nodeIds.add(node.id);
}

function validateRepoGraphEdge(edge, index, nodeIds, conflicts, path) {
  const edgePath = `${path}.edges[${index}]`;
  if (!isRecord(edge)) {
    conflicts.push(artifactConflict('runtime.schema.repo-graph-edge', `${edgePath} must be an object.`, [path]));
    return;
  }
  requireString(edge, 'id', conflicts, edgePath);
  requireAllowed(edge, 'kind', REPO_GRAPH_EDGE_KINDS, conflicts, edgePath);
  requireString(edge, 'from', conflicts, edgePath);
  requireString(edge, 'to', conflicts, edgePath);
  validateOptionalPortablePath(edge.sourcePath, 'sourcePath', conflicts, edgePath);
  requireNonNegativeNumber(edge, 'line', conflicts, edgePath, { optional: true });
  if (typeof edge.from === 'string' && !nodeIds.has(edge.from)) {
    conflicts.push(artifactConflict('runtime.schema.repo-graph-edge-ref', `${edgePath}.from must reference a declared node id.`, [path]));
  }
  if (typeof edge.to === 'string' && !nodeIds.has(edge.to)) {
    conflicts.push(artifactConflict('runtime.schema.repo-graph-edge-ref', `${edgePath}.to must reference a declared node id.`, [path]));
  }
}

function validateOptionalPortablePath(value, field, conflicts, path) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string' || !isSafePortablePath(normalizePortablePath(value))) {
    conflicts.push(artifactConflict('runtime.schema.portable-path', `${path}.${field} must be a portable relative path.`, [path]));
  }
}

function validateBoundedArray(value, field, maxItems, conflicts, path) {
  if (!Array.isArray(value)) return;
  if (value.length > maxItems) {
    conflicts.push(artifactConflict('runtime.schema.array-too-large', `${path}.${field} must contain at most ${maxItems} items.`, [path]));
  }
}

function validateUnsafeStrings(value, conflicts, path, trail = [], options = {}) {
  if (typeof value === 'string') {
    const textPath = trail.length ? `${path}.${trail.join('.')}` : path;
    const trailKey = trail.join('.');
    if (!options.allowAbsoluteTrails?.has(trailKey) && looksLikeAbsolutePath(value)) {
      conflicts.push(artifactConflict('runtime.schema.absolute-path', `${textPath} must not contain a personal or absolute path.`, [path]));
    }
    if (looksLikeSecret(value)) {
      conflicts.push(artifactConflict('runtime.schema.credential-value', `${textPath} appears to contain a credential value. Store a credential reference instead.`, [path]));
    }
    if (value.length > 4000) {
      conflicts.push(artifactConflict('runtime.schema.oversized-text', `${textPath} is too large for a compact runtime schema field. Store bulky evidence as a runtime artifact.`, [path]));
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

function looksLikeAbsolutePath(value) {
  return /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\') || value.startsWith('/Users/') || value.startsWith('/home/');
}

function looksLikeSecret(value) {
  return /(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(value);
}
