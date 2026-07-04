import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  CONTRACTS_DIR,
  SCHEMA_VERSION,
  addSnapshotEntry,
  assertDirectory,
  collectContracts,
  contractAppliesToExists,
  createContractPathCache,
  expandContractPath,
  hasRequiredEvidence,
  isSafePortablePath,
  isStaleDate,
  memoryWarning,
  normalizePortablePath,
  normalizeTargetRelativePath,
  readContractSnapshot,
  resolvePlaybookLayout,
  result,
  writeMemoryFiles
} from './core.mjs';

export async function initContracts(options) {
  const { target, dryRun = false } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const files = [
    {
      path: `${playbook.dir}/${CONTRACTS_DIR}/README.md`,
      content: [
        '# Contracts',
        '',
        'Contracts capture important business rules, invariants, and verification expectations.',
        '',
        'Use `active/` for approved contracts and `pending/` for drafts.',
        '',
        'Contract checks are read-only in this playbook. They do not block commits or call an AI judge.',
        ''
      ].join('\n')
    }
  ];
  const result = await writeMemoryFiles({ target: resolvedTarget, files, dryRun, command: 'contracts.init' });
  for (const directory of [`${playbook.dir}/${CONTRACTS_DIR}/active/`, `${playbook.dir}/${CONTRACTS_DIR}/pending/`]) {
    result.operations.push({
      id: 'contracts.mkdir',
      action: 'mkdir',
      path: directory,
      message: `Create ${directory}.`
    });
    result.summary.operations += 1;
    if (!dryRun) {
      await mkdir(path.join(resolvedTarget, ...directory.split('/')), { recursive: true });
    }
  }
  return result;
}

export async function listContracts(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const warnings = [];
  const contracts = await collectContracts({ target: resolvedTarget, playbook, warnings });
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    summary: {
      total: contracts.length,
      active: contracts.filter((contract) => contract.status === 'active').length,
      pending: contracts.filter((contract) => contract.status === 'pending').length,
      warnings: warnings.length
    },
    contracts,
    warnings,
    conflicts: []
  };
}

export async function checkContracts(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const warnings = [];
  const contracts = await collectContracts({ target: resolvedTarget, playbook, warnings, relativePath });
  const matches = relativePath === undefined ? contracts : contracts.filter((contract) => contract.matchesPath);
  const pathCache = createContractPathCache(resolvedTarget);
  for (const contract of matches) {
    for (const appliesTo of contract.appliesTo) {
      if (!await contractAppliesToExists(pathCache, appliesTo)) {
        warnings.push(memoryWarning('contracts.applies-to-missing', `${contract.id} references missing path ${appliesTo}.`, [contract.path, appliesTo]));
      }
    }
    if (contract.status === 'pending') {
      warnings.push(memoryWarning('contracts.pending-match', `${contract.id} is pending and matches the requested path.`, [contract.path]));
    }
    if (isStaleDate(contract.freshness)) {
      warnings.push(memoryWarning('contracts.stale', `${contract.id} freshness is older than 90 days.`, [contract.path]));
    }
    if (!contract.hasRequiredEvidence) {
      warnings.push(memoryWarning('contracts.evidence-missing', `${contract.id} has no Required evidence content.`, [contract.path]));
    }
  }
  const snapshot = await readContractSnapshot({ target: resolvedTarget, playbook, warnings, contracts: matches, pathCache });
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      total: contracts.length,
      matches: matches.length,
      active: matches.filter((contract) => contract.status === 'active').length,
      pending: matches.filter((contract) => contract.status === 'pending').length,
      warnings: warnings.length
    },
    contracts: matches,
    snapshot,
    warnings,
    conflicts: []
  };
}

export async function snapshotContracts(options) {
  const { target, contractId, apply = false } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const warnings = [];
  const conflicts = [];
  const contracts = await collectContracts({ target: resolvedTarget, playbook, warnings });
  const selected = contractId === undefined
    ? contracts
    : contracts.filter((contract) => contract.id === contractId);
  if (contractId !== undefined && selected.length === 0) {
    conflicts.push(memoryWarning('contracts.snapshot.contract-missing', `No contract matched ${contractId}.`, []));
  }
  const pathCache = createContractPathCache(resolvedTarget);
  const entries = new Map();
  for (const contract of selected) {
    await addSnapshotEntry(entries, {
      target: resolvedTarget,
      portablePath: contract.path,
      kind: 'contract',
      sourceContract: contract.id
    });
    for (const appliesTo of contract.appliesTo) {
      const paths = await expandContractPath({ target: resolvedTarget, pathCache, pattern: appliesTo });
      if (paths.length === 0) {
        warnings.push(memoryWarning('contracts.snapshot.applies-to-missing', `${contract.id} appliesTo has no current file for ${appliesTo}.`, [contract.path, appliesTo]));
      }
      for (const portablePath of paths) {
        await addSnapshotEntry(entries, {
          target: resolvedTarget,
          portablePath,
          kind: 'appliesTo',
          sourceContract: contract.id
        });
      }
    }
    for (const evidence of contract.requiredEvidence) {
      const portableEvidence = normalizePortablePath(evidence);
      if (!isSafePortablePath(portableEvidence)) {
        warnings.push(memoryWarning('contracts.snapshot.evidence-invalid', `${contract.id} evidence path is not portable: ${evidence}.`, [contract.path]));
        continue;
      }
      if (!existsSync(path.join(resolvedTarget, ...portableEvidence.split('/')))) {
        warnings.push(memoryWarning('contracts.snapshot.evidence-missing', `${contract.id} evidence path is missing: ${portableEvidence}.`, [contract.path, portableEvidence]));
        continue;
      }
      await addSnapshotEntry(entries, {
        target: resolvedTarget,
        portablePath: portableEvidence,
        kind: 'evidence',
        sourceContract: contract.id
      });
    }
  }

  const snapshotPath = `${playbook.dir}/${CONTRACTS_DIR}/.hashes.json`;
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    source: 'ai-agent-playbook',
    generatedAtUtc: new Date().toISOString(),
    contracts: selected.map((contract) => contract.id),
    entries: [...entries.values()].sort((left, right) => left.path.localeCompare(right.path) || left.kind.localeCompare(right.kind))
  };
  const operations = [{
    id: 'contracts.snapshot.write',
    action: apply ? 'write' : 'preview',
    path: snapshotPath,
    message: `${apply ? 'Write' : 'Preview'} contract hash snapshot.`
  }];
  if (apply && conflicts.length === 0) {
    const fullPath = path.join(resolvedTarget, ...snapshotPath.split('/'));
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    applied: apply && conflicts.length === 0,
    snapshotPath,
    summary: {
      contracts: selected.length,
      entries: snapshot.entries.length,
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };
}
