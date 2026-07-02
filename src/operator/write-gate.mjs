import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { preflightOperator } from '../operator-diagnostics.mjs';
import { assertDirectory, normalizePortablePath, normalizeTargetRelativePath, resolvePlaybookLayout, SCHEMA_VERSION } from '../harness/core.mjs';
import { validateRuntimeArtifact } from '../runtime/schemas.mjs';
import {
  buildPreflightSnapshot,
  deltaFileSummary,
  isIntentScopedChange,
  isPlaybookPath,
  researchTerms,
  validatePreflightSnapshot
} from './shared.mjs';

export async function previewWriteGate({ repoRoot, target, intent, filePath, maxResults = 20 }) {
  if (!intent || !String(intent).trim()) throw new Error('Missing --intent.');
  const preflight = await preflightOperator({
    target,
    intent,
    filePath,
    maxResults
  });
  const normalizedPath = filePath ? normalizeTargetRelativePath(target, filePath) : null;
  const invocationId = randomUUID();
  const playbook = resolvePlaybookLayout(path.resolve(target));
  const advisoryPath = `${playbook.dir}/runtime/reports/write-gate/pre-write-advisory.${invocationId}.json`;
  const blockers = [];
  const rules = preflight.rules?.rules ?? [];
  const contextMatches = preflight.context?.contexts?.filter((item) => item.applies) ?? [];
  const contractMatches = preflight.contracts?.contracts?.filter((item) => item.matches) ?? [];

  if (normalizedPath && isPlaybookRuntimePath(normalizedPath)) {
    blockers.push({
      id: 'write-gate.runtime-target',
      message: 'Runtime output is generated. Promote reviewed information into memory instead of editing runtime files directly.',
      paths: [normalizedPath]
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: blockers.length === 0,
    target: path.resolve(target),
    repoRoot: repoRoot ? path.resolve(repoRoot) : null,
    mode: { localOnly: true, network: false, writes: false },
    transaction: {
      invocationId,
      lifecycle: 'pre-write-preview',
      advisoryPath,
      applied: false
    },
    intent: String(intent),
    path: normalizedPath,
    summary: {
      candidates: preflight.summary?.candidates ?? 0,
      contexts: contextMatches.length,
      contracts: contractMatches.length,
      rules: rules.filter((rule) => rule.applies).length,
      blockers: blockers.length,
      warnings: preflight.warnings?.length ?? 0,
      conflicts: preflight.conflicts?.length ?? 0
    },
    candidates: (preflight.candidates ?? []).map((item) => ({
      path: item.path,
      category: item.category,
      snippets: item.snippets
    })),
    snapshot: preflight.snapshot,
    evidence: {
      contexts: contextMatches.map((item) => ({ id: item.id, path: item.path, reason: item.reason })),
      contracts: contractMatches.map((item) => ({ id: item.id, path: item.path, status: item.status })),
      rules: rules
        .filter((rule) => rule.applies)
        .map((rule) => ({ id: rule.id, path: rule.path, reason: rule.reason }))
    },
    blockers,
    warnings: [
      ...(preflight.warnings ?? []),
      {
        id: 'write-gate.preview-only',
        message: 'This tool previews write risk only; it does not modify project files.',
        paths: normalizedPath ? [normalizePortablePath(normalizedPath)] : []
      }
    ],
    conflicts: preflight.conflicts ?? []
  };
}

export async function postCheckWriteGate({ target, advisoryPath }) {
  await assertDirectory(target, 'Target repository does not exist');
  if (!advisoryPath || !String(advisoryPath).trim()) throw new Error('Missing --advisory.');
  const resolvedTarget = path.resolve(target);
  const resolvedAdvisory = resolveInputAdvisoryPath({ target: resolvedTarget, advisoryPath });
  if (!resolvedAdvisory.ok) {
    return postCheckUnknown({
      target: resolvedTarget,
      advisoryFile: resolvedAdvisory.relativePath,
      conflict: {
        id: 'write-gate.post-check.advisory-path-invalid',
        message: 'Advisory path must stay inside the target repository.',
        paths: [resolvedAdvisory.relativePath]
      }
    });
  }
  if (!existsSync(resolvedAdvisory.fullPath)) {
    return postCheckUnknown({
      target: resolvedTarget,
      advisoryFile: resolvedAdvisory.relativePath,
      conflict: {
        id: 'write-gate.post-check.advisory-missing',
        message: 'Matching advisory file is missing; post-write state is unknown.',
        paths: [resolvedAdvisory.relativePath]
      }
    });
  }

  const advisory = await readAdvisoryJson(resolvedAdvisory.fullPath);
  if (!advisory.ok) {
    return postCheckUnknown({
      target: resolvedTarget,
      advisoryFile: resolvedAdvisory.relativePath,
      conflict: {
        id: 'write-gate.post-check.advisory-invalid',
        message: advisory.message,
        paths: [resolvedAdvisory.relativePath]
      }
    });
  }

  const snapshot = advisory.value.snapshot;
  const snapshotValidation = validatePreflightSnapshot(advisory.value);
  if (!snapshotValidation.ok) {
    return postCheckUnknown({
      target: resolvedTarget,
      advisoryFile: resolvedAdvisory.relativePath,
      conflict: {
        id: 'write-gate.post-check.snapshot-invalid',
        message: snapshotValidation.conflict.message,
        paths: [resolvedAdvisory.relativePath, ...(snapshotValidation.conflict.paths ?? [])]
      }
    });
  }
  const manifestTarget = advisory.value.manifest?.target;
  if (typeof manifestTarget === 'string' && path.resolve(manifestTarget) !== resolvedTarget) {
    return postCheckUnknown({
      target: resolvedTarget,
      advisoryFile: resolvedAdvisory.relativePath,
      conflict: {
        id: 'write-gate.post-check.target-mismatch',
        message: 'Advisory target does not match the checked repository; post-write state is unknown.',
        paths: [resolvedAdvisory.relativePath]
      }
    });
  }

  const intent = advisory.value.intent ?? advisory.value.manifest?.intent ?? '';
  const scopedPath = snapshot.path ?? advisory.value.path ?? advisory.value.manifest?.path;
  const currentSnapshot = await buildPreflightSnapshot({
    target: resolvedTarget,
    intent,
    relativePath: scopedPath
  });
  const beforeFiles = new Map(snapshot.files
    .filter((file) => file.path !== resolvedAdvisory.relativePath)
    .map((file) => [file.path, file]));
  const currentFiles = new Map(currentSnapshot.files
    .filter((file) => file.path !== resolvedAdvisory.relativePath)
    .map((file) => [file.path, file]));
  const added = [];
  const deleted = [];
  const modified = [];

  for (const [filePath, current] of currentFiles) {
    const previous = beforeFiles.get(filePath);
    if (!previous) {
      added.push(current);
    } else if (previous.hash !== current.hash) {
      modified.push({
        path: filePath,
        beforeHash: previous.hash,
        afterHash: current.hash,
        beforeSize: previous.size,
        afterSize: current.size
      });
    }
  }
  for (const [filePath, previous] of beforeFiles) {
    if (!currentFiles.has(filePath)) {
      deleted.push(previous);
    }
  }

  const changes = {
    added: added.map(deltaFileSummary),
    deleted: deleted.map(deltaFileSummary),
    modified: modified.map(deltaFileSummary)
  };
  const allChanges = [...changes.added, ...changes.deleted, ...changes.modified];
  const intentTerms = snapshot.intentTerms ?? researchTerms(intent);
  const warnings = [];
  const outside = allChanges.filter((item) => !isIntentScopedChange(item.path, intentTerms, scopedPath));
  if (outside.length > 0) {
    warnings.push({
      id: 'write-gate.post-check.intent-outside-change',
      message: `${outside.length} changed file(s) do not appear related to the advisory intent or path.`,
      paths: outside.slice(0, 20).map((item) => item.path)
    });
  }
  const playbookChanges = allChanges.filter((item) => isPlaybookPath(item.path));
  if (playbookChanges.length > 0) {
    warnings.push({
      id: 'write-gate.post-check.playbook-change',
      message: `${playbookChanges.length} playbook, rule, context, contract, or runtime file(s) changed after advisory creation.`,
      paths: playbookChanges.slice(0, 20).map((item) => item.path)
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    advisory: {
      file: resolvedAdvisory.relativePath,
      invocationId: advisory.value.transaction?.invocationId ?? advisory.value.manifest?.invocationId ?? null,
      intent,
      path: scopedPath,
      snapshotFiles: snapshot.files.length
    },
    summary: {
      status: 'checked',
      added: changes.added.length,
      deleted: changes.deleted.length,
      modified: changes.modified.length,
      warnings: warnings.length,
      conflicts: 0
    },
    changes,
    warnings,
    conflicts: []
  };
}

export async function createWriteGateAdvisory({ repoRoot, target, intent, filePath, maxResults = 20, apply = false }) {
  const preview = await previewWriteGate({ repoRoot, target, intent, filePath, maxResults });
  const resolvedTarget = path.resolve(target);
  const advisoryPath = preview.transaction.advisoryPath;
  const advisoryTarget = resolveAdvisoryTarget({ target: resolvedTarget, advisoryPath });
  const conflicts = [...(preview.conflicts ?? [])];
  if (!advisoryTarget.ok) {
    conflicts.push({
      id: 'write-gate.advisory-path-invalid',
      message: 'Advisory output path must stay inside playbook runtime reports.',
      paths: [advisoryPath]
    });
  }

  const generatedAt = new Date().toISOString();
  const validationProbe = {
    ...preview,
    kind: 'write-gate.pre-write-advisory',
    generatedAt,
    summary: {
      ...preview.summary,
      warnings: preview.warnings?.length ?? 0,
      conflicts: conflicts.length,
      operations: 1
    },
    conflicts
  };
  const artifactValidation = validateRuntimeArtifact(validationProbe, {
    path: advisoryPath,
    expectedKind: 'write-gate.pre-write-advisory'
  });
  conflicts.push(...artifactValidation.conflicts);
  const shouldWrite = Boolean(apply && preview.ok && advisoryTarget.ok && conflicts.length === 0);
  const transaction = {
    ...preview.transaction,
    lifecycle: shouldWrite ? 'pre-write-advisory' : 'pre-write-advisory-preview',
    applied: shouldWrite
  };
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'write-gate.pre-write-advisory',
    generatedAt,
    target: resolvedTarget,
    intent: String(intent),
    path: preview.path,
    scanRange: preview.path ? [preview.path] : preview.candidates.map((item) => item.path),
    advisoryPath,
    invocationId: transaction.invocationId
  };
  const warnings = [
    ...(preview.warnings ?? []),
    ...(apply ? [] : [{
      id: 'write-gate.advisory-dry-run',
      message: 'Advisory was previewed only. Add --apply to write the runtime report.',
      paths: [advisoryPath]
    }])
  ];
  const advisoryDocument = {
    ...preview,
    kind: 'write-gate.pre-write-advisory',
    transaction,
    manifest,
    generatedAt,
    summary: {
      ...preview.summary,
      warnings: warnings.length,
      conflicts: conflicts.length,
      operations: 1
    },
    warnings,
    conflicts
  };

  if (shouldWrite) {
    await mkdir(path.dirname(advisoryTarget.fullPath), { recursive: true });
    await writeFile(advisoryTarget.fullPath, `${JSON.stringify(advisoryDocument, null, 2)}\n`);
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: preview.ok && conflicts.length === 0,
    target: resolvedTarget,
    repoRoot: repoRoot ? path.resolve(repoRoot) : null,
    mode: { localOnly: true, network: false, writes: shouldWrite },
    transaction,
    advisory: {
      path: advisoryPath,
      written: shouldWrite,
      manifest
    },
    summary: {
      ...preview.summary,
      warnings: warnings.length,
      conflicts: conflicts.length,
      operations: 1
    },
    operations: [{
      id: 'write-gate.advisory.write',
      action: 'write',
      path: advisoryPath,
      applied: shouldWrite
    }],
    blockers: preview.blockers,
    warnings,
    conflicts
  };
}

function isPlaybookRuntimePath(filePath) {
  const portablePath = normalizePortablePath(filePath);
  return (
    portablePath === '.ai-playbook/runtime' ||
    portablePath.startsWith('.ai-playbook/runtime/') ||
    portablePath === 'ai-playbook/runtime' ||
    portablePath.startsWith('ai-playbook/runtime/')
  );
}

function resolveAdvisoryTarget({ target, advisoryPath }) {
  const playbook = resolvePlaybookLayout(target);
  const fullPath = path.resolve(target, ...advisoryPath.split('/'));
  const allowedRoot = path.resolve(playbook.root, 'runtime', 'reports', 'write-gate');
  const relative = path.relative(allowedRoot, fullPath);
  const ok = Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
  return { ok, fullPath, allowedRoot };
}

function resolveInputAdvisoryPath({ target, advisoryPath }) {
  const rawPath = String(advisoryPath);
  const fullPath = path.isAbsolute(rawPath)
    ? path.resolve(rawPath)
    : path.resolve(target, ...rawPath.split(/[\\/]+/));
  const relative = path.relative(target, fullPath);
  const relativePath = normalizePortablePath(relative || rawPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, fullPath, relativePath: normalizePortablePath(rawPath) };
  }
  return { ok: true, fullPath, relativePath };
}

async function readAdvisoryJson(file) {
  try {
    const value = JSON.parse(await readFile(file, 'utf8'));
    if (value?.manifest?.kind !== 'write-gate.pre-write-advisory') {
      return { ok: false, message: 'File is not a write-gate pre-write advisory.' };
    }
    return { ok: true, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

function postCheckUnknown({ target, advisoryFile, conflict }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    target,
    mode: { localOnly: true, network: false, writes: false },
    advisory: {
      file: advisoryFile,
      invocationId: null,
      intent: null,
      path: null,
      snapshotFiles: 0
    },
    summary: {
      status: 'unknown',
      added: 0,
      deleted: 0,
      modified: 0,
      warnings: 0,
      conflicts: 1
    },
    changes: {
      added: [],
      deleted: [],
      modified: []
    },
    warnings: [],
    conflicts: [conflict]
  };
}
