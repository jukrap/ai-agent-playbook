import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  INSTALL_MANIFEST_FILE,
  SCHEMA_VERSION,
  assertDirectory,
  countBy,
  hasGitignoreEntry,
  managedFileStatuses,
  managedPruneResult,
  managedStatusConflicts,
  matchingManifestCandidates,
  normalizeManagedPath,
  readManagedManifest,
  removeEmptyManagedDirectories,
  resolvePlaybookLayout,
  summarizeManagedFiles,
  writeManagedManifest
} from './core.mjs';

export async function checkManagedManifest(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const manifestRelativePath = `${playbook.dir}/${INSTALL_MANIFEST_FILE}`;
  const manifestPath = path.join(playbook.root, INSTALL_MANIFEST_FILE);
  const base = {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    target: resolvedTarget,
    manifestPath: manifestRelativePath,
    summary: { total: 0, present: 0, modified: 0, missing: 0 },
    files: [],
    warnings: [],
    conflicts: []
  };

  const manifestResult = await readManagedManifest(resolvedTarget, playbook);
  if (!manifestResult.ok) {
    base.conflicts.push(manifestResult.conflict);
    return base;
  }

  const files = await managedFileStatuses(resolvedTarget, manifestResult.manifest.files);
  const summary = summarizeManagedFiles(files);
  const conflicts = files
    .filter((file) => file.status === 'modified' || file.status === 'missing')
    .map((file) => ({
      id: file.status === 'modified' ? 'managed.file.modified' : 'managed.file.missing',
      message: `${file.path} is ${file.status}.`,
      paths: [file.path]
    }));

  return {
    ...base,
    ok: conflicts.length === 0,
    summary,
    files,
    warnings: [],
    conflicts
  };
}

export async function catalogManagedManifest(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const manifestRelativePath = `${playbook.dir}/${INSTALL_MANIFEST_FILE}`;
  const base = {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    target: resolvedTarget,
    manifestPath: manifestRelativePath,
    manifest: null,
    summary: {
      total: 0,
      present: 0,
      modified: 0,
      missing: 0,
      byKind: {},
      byStatus: {}
    },
    files: [],
    warnings: [],
    conflicts: []
  };

  const manifestResult = await readManagedManifest(resolvedTarget, playbook);
  if (!manifestResult.ok) {
    return {
      ...base,
      conflicts: [manifestResult.conflict]
    };
  }

  const files = await managedFileStatuses(resolvedTarget, manifestResult.manifest.files);
  const summary = {
    ...summarizeManagedFiles(files),
    byKind: countBy(files, 'kind'),
    byStatus: countBy(files, 'status')
  };
  const conflicts = managedStatusConflicts(files);

  return {
    ...base,
    ok: conflicts.length === 0,
    manifest: {
      source: manifestResult.manifest.source,
      playbookDir: manifestResult.manifest.playbookDir,
      localOnly: Boolean(manifestResult.manifest.localOnly),
      installedAtUtc: manifestResult.manifest.installedAtUtc,
      updatedAtUtc: manifestResult.manifest.updatedAtUtc
    },
    summary,
    files,
    conflicts
  };
}

export async function adoptManagedManifest(options) {
  const { repoRoot, target, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const candidates = await matchingManifestCandidates({ repoRoot, target: resolvedTarget, playbook });
  const localOnly = await hasGitignoreEntry(resolvedTarget, `${playbook.dir}/`);
  const operations = candidates.map((file) => ({
    id: 'managed.adopt-file',
    action: 'adopt',
    message: `Adopt ${file.path}.`,
    paths: [file.path]
  }));
  operations.push({
    id: 'managed.write-manifest',
    action: 'write-manifest',
    message: `Write ${playbook.dir}/${INSTALL_MANIFEST_FILE}.`,
    paths: [`${playbook.dir}/${INSTALL_MANIFEST_FILE}`]
  });

  if (apply) {
    await writeManagedManifest(resolvedTarget, playbook, {
      localOnly,
      files: candidates,
      installedAtUtc: new Date().toISOString()
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    applied: Boolean(apply),
    summary: {
      adopted: candidates.length,
      operations: operations.length,
      warnings: 0,
      conflicts: 0
    },
    operations,
    warnings: [],
    conflicts: []
  };
}

export async function pruneManagedManifest(options) {
  const { target, managedPath, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const operations = [];
  const warnings = [];
  const conflicts = [];

  const manifestResult = await readManagedManifest(resolvedTarget, playbook);
  if (!manifestResult.ok) {
    return managedPruneResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts: [manifestResult.conflict] });
  }

  const selected = normalizeManagedPath(managedPath);
  if (!selected.ok) {
    conflicts.push({
      id: selected.missing ? 'managed.prune.path-missing' : 'managed.prune.path-invalid',
      message: selected.missing
        ? 'Missing --path for managed prune.'
        : `Refusing non-portable managed path: ${managedPath}`,
      paths: managedPath ? [String(managedPath)] : []
    });
    return managedPruneResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts });
  }

  const entry = manifestResult.manifest.files.find((file) => file.path === selected.path);
  if (!entry) {
    conflicts.push({
      id: 'managed.prune.file-unmanaged',
      message: `${selected.path} is not listed in the managed manifest.`,
      paths: [selected.path]
    });
    return managedPruneResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts });
  }

  const [file] = await managedFileStatuses(resolvedTarget, [entry]);
  if (file.status === 'missing') {
    conflicts.push({
      id: 'managed.prune.file-missing',
      message: `${file.path} is already missing; review the manifest before pruning it.`,
      paths: [file.path]
    });
  } else if (file.status === 'modified') {
    conflicts.push({
      id: 'managed.prune.file-modified',
      message: `${file.path} has local edits and will not be removed.`,
      paths: [file.path]
    });
  } else {
    operations.push({
      id: 'managed.prune.remove-file',
      action: 'remove',
      message: `Remove ${file.path}.`,
      paths: [file.path]
    });
  }

  let applied = false;
  if (apply && conflicts.length === 0 && operations.length > 0) {
    await rm(path.join(resolvedTarget, ...file.path.split('/')), { force: true });
    await writeManagedManifest(resolvedTarget, playbook, {
      localOnly: Boolean(manifestResult.manifest.localOnly),
      installedAtUtc: manifestResult.manifest.installedAtUtc,
      files: manifestResult.manifest.files.filter((item) => item.path !== file.path)
    });
    await removeEmptyManagedDirectories(resolvedTarget, playbook.root, [file.path]);
    applied = true;
  }

  return managedPruneResult({ target: resolvedTarget, apply, applied, operations, warnings, conflicts });
}

export async function uninstallManagedManifest(options) {
  const { target, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const manifestResult = await readManagedManifest(resolvedTarget, playbook);
  const warnings = [];
  const operations = [];
  if (!manifestResult.ok) {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: false,
      target: resolvedTarget,
      applied: false,
      summary: { removable: 0, conflicts: 1, warnings: 0 },
      operations,
      warnings,
      conflicts: [manifestResult.conflict]
    };
  }

  const files = await managedFileStatuses(resolvedTarget, manifestResult.manifest.files);
  const removable = files.filter((file) => file.status === 'present');
  const conflicts = files
    .filter((file) => file.status === 'modified')
    .map((file) => ({
      id: 'managed.file.modified',
      message: `${file.path} has local edits and will not be removed.`,
      paths: [file.path]
    }));

  for (const file of removable) {
    operations.push({
      id: 'managed.remove-file',
      action: 'remove',
      message: `Remove ${file.path}.`,
      paths: [file.path]
    });
  }
  if (manifestResult.manifest.localOnly) {
    warnings.push({
      id: 'managed.gitignore.manual-cleanup',
      message: `Review .gitignore manually for the ${playbook.dir}/ local-only entry.`,
      paths: ['.gitignore', `${playbook.dir}/`]
    });
  }

  if (apply) {
    for (const file of removable) {
      await rm(path.join(resolvedTarget, ...file.path.split('/')), { force: true });
    }
    if (conflicts.length === 0) {
      await rm(path.join(playbook.root, INSTALL_MANIFEST_FILE), { force: true });
    }
    await removeEmptyManagedDirectories(resolvedTarget, playbook.root, removable.map((file) => file.path));
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    applied: Boolean(apply && removable.length > 0),
    summary: {
      removable: removable.length,
      conflicts: conflicts.length,
      warnings: warnings.length
    },
    operations,
    warnings,
    conflicts
  };
}
