import { mkdir, cp, rename } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { noLinks, statOrNull, readJson, writeAtomic, treeSnapshot, inside, relativePath } from './fs-safety.mjs';
import { skillCatalog, selectSkills, SKILL_PROFILES } from './catalog/selection.mjs';
import { PACKAGE_VERSION } from './version.mjs';

const OWNER = 'ai-agent-playbook';
const MARKER = '.ai-agent-playbook-install.json';
const snapshot = (root) => treeSnapshot(root, { exclude: [MARKER] });
const equal = (a, b) => a?.treeHash === b?.treeHash;
const json = (value) => JSON.stringify(value, null, 2) + '\n';

async function managedState(directory) {
  const tree = await snapshot(directory);
  if (!tree) return { tree: null, marker: null, owned: false, unchanged: false };
  const markerFile = path.join(directory, MARKER);
  let marker = null;
  if (await statOrNull(markerFile)) marker = await readJson(markerFile);
  const owned = marker?.source === OWNER && typeof marker.sourceHash === 'string';
  const unchanged = owned && (marker.sourceHash === tree.hash || (Number(marker.schemaVersion) === 1 && marker.sourceHash === tree.legacyHash));
  return { tree, marker, owned, unchanged };
}
function safeDestination(roots, rootKind, relative) {
  if (!['agents', 'codex'].includes(rootKind)) throw new Error('Invalid installation root kind.');
  const rel = relativePath(relative);
  if (!/^(?:legacys\/)?[a-z0-9-]+$/.test(rel)) throw new Error('Invalid skill installation path.');
  const destination = path.resolve(roots[rootKind], rel);
  if (!inside(roots[rootKind], destination) || destination === roots[rootKind]) throw new Error('Unsafe installation destination.');
  return destination;
}
async function rootsFor(options) {
  const roots = {
    agents: path.resolve(options.agentsRoot ?? path.join(os.homedir(), '.agents', 'skills')),
    codex: path.resolve(options.codexRoot ?? path.join(os.homedir(), '.codex', 'skills'))
  };
  if (inside(roots.agents, roots.codex) || inside(roots.codex, roots.agents)) throw new Error('Installation roots must be separate and non-overlapping.');
  await noLinks(roots.agents); await noLinks(roots.codex);
  return roots;
}
async function filesystemForDirectory(directory) {
  await noLinks(directory);
  let current = path.resolve(directory);
  while (true) {
    const st = await statOrNull(current);
    if (st) {
      if (!st.isDirectory()) throw new Error('Expected a directory for installation or backup: ' + current);
      return st.dev;
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error('Cannot inspect the installation filesystem: ' + directory);
    current = parent;
  }
}
async function validateBackupPlacement({ operations, roots, backupRoot }) {
  const parent = path.resolve(backupRoot ?? path.join(path.dirname(roots.agents), 'aapb-backups'));
  for (const root of Object.values(roots)) if (inside(root, parent) || inside(parent, root)) throw new Error('Backup root must be outside and separate from installation roots.');
  const backupFilesystem = await filesystemForDirectory(parent);
  const checked = new Set();
  for (const operation of operations) {
    const destination = safeDestination(roots, operation.rootKind, operation.relative);
    const container = path.dirname(destination);
    if (checked.has(container)) continue;
    if (await filesystemForDirectory(container) !== backupFilesystem) {
      throw new Error('Backup and affected installations must use the same filesystem for atomic moves. Choose a backup on that filesystem; migrate separate filesystems independently. No file changes were started.');
    }
    checked.add(container);
  }
  return parent;
}
export async function runSkillsLifecycle(options) {
  const { repoRoot, command = 'check', profile = 'core', dryRun = false, apply = false } = options;
  if (command === 'rollback') return rollbackSkills(options);
  const catalog = await skillCatalog({ repoRoot });
  if (command === 'list') return { schemaVersion: 2, ok: true, kind: 'skills.list', writes: false, profiles: SKILL_PROFILES, skills: catalog.map(({ directory, ...s }) => s) };
  const selected = selectSkills(catalog, options);
  const roots = await rootsFor(options);
  const operations = [], conflicts = [], warnings = [];
  if (!['check', 'lint', 'install', 'update', 'migrate', 'uninstall'].includes(command)) throw new Error('Unsupported skills command: ' + command);
  if (options.forceManaged || options.forceUnmanaged) throw new Error('Force replacement was retired. Preserve local edits and resolve the reported conflict before retrying.');
  if (command === 'lint') return { schemaVersion: 2, kind: 'skills.lint', ok: true, writes: false, summary: { skills: catalog.length }, warnings: catalog.filter((s) => s.description.length > 180).map((s) => 'Long trigger: ' + s.name) };
  const chosen = new Set(selected.map((s) => s.name));
  const baseline = (await readJson(path.join(repoRoot, 'docs/skill-decisions.json'), 2_000_000)).items;
  async function schedule(rootKind, relative, skill = null) {
    const destination = safeDestination(roots, rootKind, relative);
    try {
      const old = await managedState(destination);
      if (!skill && !old.tree) return;
      if (!skill && !old.owned) {
        warnings.push({ path: destination, code: 'unmanaged-preserved' }); return;
      }
      const source = skill ? await snapshot(skill.directory) : null;
      if (old.tree && (!old.owned || !old.unchanged)) {
        conflicts.push({ path: destination, code: old.owned ? 'modified-managed' : 'unmanaged', message: 'Preserved; no force replacement or removal.' }); return;
      }
      if (command === 'check') {
        if (!old.tree || old.tree.hash !== source?.hash) conflicts.push({ path: destination, code: old.tree ? 'outdated' : 'missing' });
        return;
      }
      if (source && old.unchanged && old.tree.hash === source.hash) return;
      operations.push({
        rootKind, relative, path: destination, skillName: skill?.name ?? path.basename(destination),
        action: skill ? old.tree ? 'update' : 'install' : 'remove',
        source: skill?.directory ?? null, sourceHash: source?.hash ?? null,
        beforeHash: old.tree?.treeHash ?? null,
        category: skill?.category ?? old.marker?.category ?? null
      });
    } catch (error) { conflicts.push({ path: destination, code: 'unsafe-or-unreadable', message: error.message }); }
  }
  if (command === 'uninstall') {
    for (const s of selected) await schedule('agents', s.name);
  } else {
    for (const s of selected) await schedule('agents', s.name, s);
  }
  if (command === 'migrate') {
    for (const row of baseline) {
      await schedule('codex', row.name);
      const relative = row.category === 'legacy' ? 'legacys/' + row.name : row.name;
      if (!chosen.has(row.name)) await schedule('agents', relative);
    }
    // New-generation duplicates are also removable only after ownership and hash checks.
    for (const s of catalog) if (!baseline.some((b) => b.name === s.name)) await schedule('codex', s.name);
  }
  const shouldApply = command === 'migrate' ? apply && !dryRun : ['install', 'update', 'uninstall'].includes(command) && !dryRun;
  const plannedBackupRoot = operations.length && ['install', 'update', 'migrate', 'uninstall'].includes(command)
    ? await validateBackupPlacement({ operations, roots, backupRoot: options.backupRoot }) : null;
  let transaction = null;
  if (shouldApply && operations.length) {
    transaction = await applySkillOperations({ operations, roots, profile, backupRoot: plannedBackupRoot, beforeOperation: options.beforeOperation });
    conflicts.push(...transaction.conflicts);
  }
  return {
    schemaVersion: 2, kind: 'skills.' + command, ok: conflicts.length === 0, writes: Boolean(transaction?.applied),
    applied: Boolean(transaction?.applied), profile, roots, operations, conflicts, warnings,
    backup: transaction?.backup ?? null, backupRoot: plannedBackupRoot, summary: { selected: selected.length, operations: operations.length, applied: transaction?.applied ?? 0, conflicts: conflicts.length }
  };
}
export async function applySkillOperations({ operations, roots, profile, backupRoot, beforeOperation }) {
  const parent = await validateBackupPlacement({ operations, roots, backupRoot });
  const backup = path.join(parent, 'skills-' + new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID());
  await mkdir(backup, { recursive: true });
  const journalFile = path.join(backup, 'journal.json');
  const journal = { schemaVersion: 1, kind: 'skills.transaction', source: OWNER, version: PACKAGE_VERSION, roots, profile, state: 'prepared', entries: [] };
  const conflicts = [];
  // Prepare and verify all replacement bytes before moving any installed directory.
  for (const [index, operation] of operations.entries()) {
    const entry = { ...operation, id: String(index), state: 'prepared', afterHash: null };
    const entryDir = path.join(backup, entry.id);
    await mkdir(entryDir);
    if (entry.source) {
      const stage = path.join(entryDir, 'after');
      await noLinks(entry.source);
      await cp(entry.source, stage, { recursive: true, dereference: false, errorOnExist: true, force: false });
      const staged = await snapshot(stage);
      if (staged.hash !== entry.sourceHash) throw new Error('Source skill changed during preparation: ' + entry.skillName);
      await writeAtomic(path.join(stage, MARKER), json({
        schemaVersion: 2, source: OWNER, version: PACKAGE_VERSION, profile,
        skillName: entry.skillName, category: entry.category, sourceHash: staged.hash
      }), { exclusive: true });
      entry.afterHash = (await snapshot(stage)).treeHash;
    }
    journal.entries.push(entry);
  }
  await writeAtomic(journalFile, json(journal), { exclusive: true });
  let applied = 0;
  journal.state = 'applying';
  for (const entry of journal.entries) {
    const destination = safeDestination(roots, entry.rootKind, entry.relative);
    const entryDir = path.join(backup, entry.id);
    try {
      if (beforeOperation) await beforeOperation(entry);
      await noLinks(destination);
      const current = await snapshot(destination);
      if ((current?.treeHash ?? null) !== entry.beforeHash) throw new Error('Installation changed after preview; preserved.');
      if (entry.afterHash && (await snapshot(path.join(entryDir, 'after')))?.treeHash !== entry.afterHash) throw new Error('Prepared replacement changed; preserved.');
      await mkdir(path.dirname(destination), { recursive: true });
      await noLinks(path.dirname(destination));
      entry.state = 'applying';
      await writeAtomic(journalFile, json(journal));
      if (current) {
        await rename(destination, path.join(entryDir, 'before'));
        if ((await snapshot(path.join(entryDir, 'before')))?.treeHash !== entry.beforeHash) throw new Error('Installation changed during the move; use rollback to inspect the preserved directory.');
      }
      if (entry.afterHash) {
        if (await statOrNull(destination)) throw new Error('A new destination appeared; it was preserved.');
        await rename(path.join(entryDir, 'after'), destination);
      }
      entry.state = 'applied';
      applied++;
    } catch (error) {
      entry.error = error.message;
      conflicts.push({ path: destination, code: 'apply-conflict', message: error.message });
    }
    await writeAtomic(journalFile, json(journal));
  }
  journal.state = conflicts.length ? 'partial' : 'applied';
  await writeAtomic(journalFile, json(journal));
  return { backup, applied, conflicts };
}
/** @param {{backup?: string, apply?: boolean, dryRun?: boolean, beforeOperation?: (entry: any) => Promise<void>}} options */
export async function rollbackSkills({ backup, apply = false, dryRun = false, beforeOperation } = {}) {
  if (!backup) throw new Error('Rollback requires --backup <transaction-directory>.');
  const directory = path.resolve(backup);
  await noLinks(directory);
  const journalFile = path.join(directory, 'journal.json');
  const journal = await readJson(journalFile, 4_000_000);
  if (journal.kind !== 'skills.transaction' || journal.source !== OWNER || journal.schemaVersion !== 1 || !Array.isArray(journal.entries)) throw new Error('Invalid skills recovery journal.');
  if (typeof journal.roots?.agents !== 'string' || typeof journal.roots?.codex !== 'string' || !path.isAbsolute(journal.roots.agents) || !path.isAbsolute(journal.roots.codex)) throw new Error('Recovery requires explicit absolute installation roots.');
  const roots = await rootsFor({ agentsRoot: journal.roots.agents, codexRoot: journal.roots.codex });
  for (const root of Object.values(roots)) if (inside(root, directory) || inside(directory, root)) throw new Error('Recovery journal overlaps an installation root.');
  const ids = new Set(), destinations = new Set();
  for (const entry of journal.entries) {
    if (!/^\d+$/.test(entry.id) || ids.has(entry.id) || !['prepared', 'applying', 'applied', 'restoring', 'restored'].includes(entry.state)) throw new Error('Invalid recovery entry.');
    for (const hash of [entry.beforeHash, entry.afterHash]) if (hash !== null && !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid recovery hash.');
    const destination = safeDestination(roots, entry.rootKind, entry.relative).toLowerCase();
    if (destinations.has(destination)) throw new Error('Duplicate recovery destination.');
    ids.add(entry.id); destinations.add(destination);
  }
  await validateBackupPlacement({ operations: journal.entries.filter((entry) => !['prepared', 'restored'].includes(entry.state)), roots, backupRoot: directory });
  const operations = [], conflicts = [];
  let restored = 0;
  for (const entry of [...journal.entries].reverse()) {
    if (!/^\d+$/.test(entry.id) || !['prepared', 'applying', 'applied', 'restoring', 'restored'].includes(entry.state)) throw new Error('Invalid recovery entry.');
    if (entry.state === 'prepared' || entry.state === 'restored') continue;
    const destination = safeDestination(roots, entry.rootKind, entry.relative);
    const before = path.join(directory, entry.id, 'before');
    try {
      const current = await snapshot(destination);
      const saved = await snapshot(before);
      // An interrupted rollback may have restored the directory before journaling completion.
      if ((current?.treeHash ?? null) === entry.beforeHash && !saved) {
        if (apply && !dryRun) { entry.state = 'restored'; await writeAtomic(journalFile, json(journal)); }
        continue;
      }
      if (entry.beforeHash && saved?.treeHash !== entry.beforeHash) throw new Error('Recovery content is missing or changed.');
      const currentHash = current?.treeHash ?? null;
      if (currentHash !== entry.afterHash && !(entry.state === 'applying' && !current) && !(entry.state === 'restoring' && !current)) throw new Error('Later user changes were preserved.');
      operations.push({ path: destination, action: entry.beforeHash ? 'restore' : 'remove-installed', id: entry.id });
      if (apply && !dryRun) {
        if (beforeOperation) await beforeOperation(entry);
        if (!equal(current, await snapshot(destination))) throw new Error('Destination changed during rollback.');
        entry.state = 'restoring'; await writeAtomic(journalFile, json(journal));
        if (current) await rename(destination, path.join(directory, entry.id, 'rolled-back-installation-' + randomUUID()));
        if (saved) { await mkdir(path.dirname(destination), { recursive: true }); await noLinks(destination); await rename(before, destination); }
        entry.state = 'restored'; restored++;
        await writeAtomic(journalFile, json(journal));
      }
    } catch (error) { conflicts.push({ path: destination, code: 'rollback-conflict', message: error.message }); }
  }
  if (apply && !dryRun) {
    journal.state = conflicts.length ? 'rollback-partial' : 'restored';
    await writeAtomic(journalFile, json(journal));
  }
  return { schemaVersion: 2, kind: 'skills.rollback', ok: conflicts.length === 0, writes: restored > 0, applied: restored > 0, operations, conflicts, backup: directory, summary: { restored, conflicts: conflicts.length } };
}
