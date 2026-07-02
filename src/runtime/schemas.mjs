import { isRecord, SCHEMA_VERSION } from '../harness/core.mjs';

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

export function assertRuntimeArtifact(value, options = {}) {
  const validation = validateRuntimeArtifact(value, options);
  if (!validation.ok) {
    const first = validation.conflicts[0]?.message ?? 'Invalid runtime artifact.';
    throw new Error(first);
  }
  return value;
}

function artifactConflict(id, message, paths) {
  return { id, level: 'fail', message, paths };
}

function isIsoLikeTimestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}
