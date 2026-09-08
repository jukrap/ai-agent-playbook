import { readdir, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, safePath, statOrNull, noLinks, readJson, readBytes, relativePath, inside, sha256, writeAtomic } from './fs-safety.mjs';

export const PLAYBOOK_NAMES = ['.ai-agent-playbook', '.ai-playbook', 'ai-playbook']; // Legacy compatibility roots.
const MAX_REPOSITORIES = 256;
const fail = (message) => Object.assign(new Error(message), { code: 'aapb.workspace-invalid' });

/** Keep user authentication/configuration but never let ambient worktree overrides retarget a query. */
export function projectGitEnvironment() {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_PREFIX']) delete env[name];
  return env;
}

export async function locateLocalPlaybook(target) {
  const root = await projectRoot(target), found = [];
  for (const name of PLAYBOOK_NAMES) {
    const directory = await safePath(root, name), st = await statOrNull(directory);
    if (!st) continue;
    if (!st.isDirectory()) throw fail('Playbook path is not a directory: ' + name);
    found.push({ name, directory });
  }
  if (found.length > 1) throw fail('Multiple playbook roots exist; select and reconcile them before using records.');
  return { root, ...(found[0] ?? { name: PLAYBOOK_NAMES[0], directory: path.join(root, PLAYBOOK_NAMES[0]) }), exists: found.length === 1 };
}

export function validateWorkspaceConfig(config) {
  if (!config || config.schemaVersion !== 1 || !Array.isArray(config.repositories) || config.repositories.length > MAX_REPOSITORIES) throw fail('Expected workspace schemaVersion 1 and at most 256 repositories.');
  const ids = new Set(), paths = [];
  const repositories = config.repositories.map((repo) => {
    if (!repo || typeof repo.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(repo.id) || ids.has(repo.id)) throw fail('Repository IDs must be unique lowercase names of at most 64 characters.');
    const relative = relativePath(repo.path);
    if (relative.split('/').some((part) => part.toLowerCase() === '.git' || PLAYBOOK_NAMES.includes(part.toLowerCase()))) throw fail('Repository paths cannot point into Git metadata or playbook records.');
    const folded = relative.toLowerCase();
    if (paths.some((other) => other === folded || other.startsWith(folded + '/') || folded.startsWith(other + '/'))) throw fail('Registered repository paths must not duplicate or overlap.');
    if (repo.role !== undefined && (typeof repo.role !== 'string' || repo.role.length > 200 || /[\x00-\x1f]/.test(repo.role))) throw fail('Repository role must be a short, single-line description.');
    if (repo.recordPath !== undefined && !PLAYBOOK_NAMES.includes(repo.recordPath)) throw fail('recordPath must name a supported local playbook folder.');
    ids.add(repo.id); paths.push(folded);
    return { ...repo, path: relative, role: repo.role ?? 'repository' };
  });
  return { ...config, repositories };
}

export function createWorkspaceConfig(repositories = []) {
  return validateWorkspaceConfig({ schemaVersion: 1, repositories });
}

async function readWorkspaceAt(root) {
  const found = [];
  for (const name of PLAYBOOK_NAMES) {
    const directory = path.join(root, name), file = path.join(directory, 'workspace.json');
    await noLinks(directory);
    if (!await statOrNull(file)) continue;
    const bytes = await readBytes(file, 500_000);
    const config = validateWorkspaceConfig(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '')));
    found.push({ root, name, directory, file, config, hash: sha256(bytes) });
  }
  if (found.length > 1) throw fail('Multiple workspace registries exist at the same root.');
  return found[0] ?? null;
}

export async function findWorkspace(target) {
  const start = await projectRoot(target);
  let ancestor = start;
  // Probe named metadata only. Never enumerate a user's parent directories.
  for (let depth = 0; depth < 64; depth++) {
    const workspace = await readWorkspaceAt(ancestor);
    if (workspace) {
      const activeRepo = workspace.config.repositories.find((repo) => inside(path.resolve(ancestor, repo.path), start)) ?? null;
      if (ancestor === start || activeRepo) {
        if (activeRepo) await projectRoot(await safePath(ancestor, activeRepo.path));
        return { workspace, activeRepo, start };
      }
    }
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  return { workspace: null, activeRepo: null, start };
}

async function locateMemberPlaybook(workspace, member) {
  const root = await projectRoot(await safePath(workspace.root, member.path));
  if (!member.recordPath) return locateLocalPlaybook(root);
  const directory = await safePath(root, member.recordPath), st = await statOrNull(directory);
  if (st && !st.isDirectory()) throw fail('Local record path is not a directory.');
  return { root, directory, name: member.recordPath, exists: Boolean(st) };
}

export async function resolveRecordContext({ target, recordSource = undefined }) {
  const context = await findWorkspace(target);
  if (recordSource !== undefined && recordSource !== 'workspace' && !/^repo:[a-z0-9][a-z0-9-]{0,63}$/.test(recordSource)) throw fail('recordSource must be workspace or repo:<registered-id>.');
  if (!context.workspace) {
    if (recordSource !== undefined && recordSource !== 'workspace') throw fail('A registered workspace is required to select repository records.');
    return { ...await locateLocalPlaybook(context.start), workspace: null, activeRepo: null, recordSource: 'workspace' };
  }
  const { workspace, activeRepo } = context;
  if (recordSource?.startsWith('repo:')) {
    const id = recordSource.slice(5), repo = workspace.config.repositories.find((item) => item.id === id);
    if (!repo) throw fail('Unknown repository ID: ' + id);
    const local = await locateMemberPlaybook(workspace, repo);
    return { ...local, workspace, activeRepo: repo, recordSource };
  }
  return { root: workspace.root, directory: workspace.directory, name: workspace.name, exists: true, workspace, activeRepo, recordSource: 'workspace' };
}

export async function resolveCodeTarget({ target, repo = undefined }) {
  const context = await findWorkspace(target);
  if (!context.workspace) {
    if (repo !== undefined) throw fail('--repo requires a registered workspace.');
    return context.start;
  }
  const selected = repo === undefined ? context.activeRepo : context.workspace.config.repositories.find((entry) => entry.id === repo);
  if (!selected) throw fail(repo === undefined ? 'Select one repository with --repo (or repo in MCP) when starting at a workspace root.' : 'Unknown repository ID: ' + repo);
  return projectRoot(await safePath(context.workspace.root, selected.path));
}

export async function discoverRepositories(target) {
  const root = await projectRoot(target), repositories = [], warnings = [], used = new Set();
  let visited = 0, complete = true;
  const skip = new Set([...PLAYBOOK_NAMES, '.git', 'node_modules', 'vendor', 'build', 'dist', '.venv', '.gradle', 'Pods']);
  async function walk(directory, depth) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (++visited > 2000) { complete = false; return; }
      if (entry.isSymbolicLink() || !entry.isDirectory() || skip.has(entry.name)) continue;
      const child = path.join(directory, entry.name), rel = path.relative(root, child).replaceAll('\\', '/');
      try {
        await noLinks(child);
        const git = await statOrNull(path.join(child, '.git'));
        if (git && !git.isSymbolicLink() && (git.isDirectory() || git.isFile())) {
          let id = entry.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 54) || 'repository';
          const base = id; let suffix = 2;
          while (used.has(id)) id = base + '-' + suffix++;
          used.add(id);
          const local = await locateLocalPlaybook(child);
          repositories.push({ id, path: rel, role: 'repository', ...(local.exists ? { recordPath: local.name } : {}) });
          if (repositories.length >= MAX_REPOSITORIES) { complete = false; return; }
        } else if (depth < 2) await walk(child, depth + 1);
      } catch (error) { complete = false; warnings.push({ path: rel, message: String(error.message).slice(0, 500) }); }
      if (!complete && (visited > 2000 || repositories.length >= MAX_REPOSITORIES)) return;
    }
  }
  await walk(root, 0);
  return { repositories, warnings, complete, visitedEntries: Math.min(visited, 2000) };
}

export async function runWorkspace({ target, command, id = undefined, path: repoPath = undefined, role = undefined, apply = false, dryRun = false }) {
  const { workspace } = await findWorkspace(target);
  if (!workspace) throw fail('No registered workspace exists. Use bootstrap --kind workspace first.');
  if (!['list', 'add', 'remove', 'check'].includes(command)) throw fail('Choose workspace list, add, remove or check.');
  const warnings = [], repositories = [];
  for (const member of workspace.config.repositories) {
    try {
      const local = await locateMemberPlaybook(workspace, member);
      repositories.push({ ...member, available: true, localRecords: local.exists ? local.name : null });
      if (member.recordPath && !local.exists) warnings.push({ id: member.id, code: 'missing-record-path', path: member.recordPath,
        message: 'Registered local record path is missing: ' + member.recordPath + '. The saved selection was preserved; no alternative playbook was substituted.' });
    } catch (error) {
      repositories.push({ ...member, available: false, localRecords: null });
      warnings.push({ id: member.id, message: String(error.message).slice(0, 500) });
    }
  }
  const base = { schemaVersion: 2, kind: 'aapb.workspace.' + command, ok: true, writes: false, applied: false, repositories, warnings };
  if (command === 'list' || command === 'check') return { ...base, ok: command === 'list' || !warnings.length };
  let next;
  if (command === 'add') {
    const candidate = validateWorkspaceConfig({ schemaVersion: 1, repositories: [{ id, path: repoPath, role }] }).repositories[0];
    const root = await projectRoot(await safePath(workspace.root, candidate.path));
    const local = await locateLocalPlaybook(root);
    if (local.exists) candidate.recordPath = local.name;
    const existing = workspace.config.repositories.find((item) => item.id === id);
    if (existing && existing.path === candidate.path && existing.role === candidate.role) return base;
    next = validateWorkspaceConfig({ ...workspace.config, repositories: [...workspace.config.repositories, candidate] });
  } else {
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw fail('Provide the registered --id to remove.');
    next = { ...workspace.config, repositories: workspace.config.repositories.filter((item) => item.id !== id) };
    if (next.repositories.length === workspace.config.repositories.length) return base;
  }
  const proposed = JSON.stringify(next, null, 2) + '\n';
  let backup;
  if (apply && !dryRun) {
    const lockPath = await safePath(workspace.directory, '.workspace-write.lock');
    let lock;
    try { lock = await open(lockPath, 'wx'); }
    catch (error) { if (error.code === 'EEXIST') throw fail('Workspace registration is busy. Retry after the writer finishes; preserve a stale lock until its owner is checked.'); throw error; }
    const lockStat = await lock.stat();
    try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }) + '\n');
    const original = await readBytes(workspace.file, 500_000);
    if (sha256(original) !== workspace.hash) throw fail('Workspace registry changed; inspect it before applying.');
    backup = 'archive/workspace-' + workspace.hash.slice(0, 16) + '.json';
    const backupFile = await safePath(workspace.directory, backup);
    const existingBackup = await statOrNull(backupFile);
    if (!existingBackup) await writeAtomic(backupFile, original, { exclusive: true });
    else if (sha256(await readBytes(backupFile, 500_000)) !== workspace.hash) throw fail('Workspace backup differs; preserve it and choose a new transaction.');
    if (sha256(await readBytes(workspace.file, 500_000)) !== workspace.hash) throw fail('Workspace registry changed after backup; no registry update applied.');
    await writeAtomic(workspace.file, proposed, { beforeReplace: async () => {
      if (sha256(await readBytes(workspace.file, 500_000)) !== workspace.hash) throw fail('Workspace registry changed after staging; no registry update applied.');
    } });
    } finally {
      await lock.close();
      const currentLock = await statOrNull(lockPath);
      if (currentLock && currentLock.dev === lockStat.dev && currentLock.ino === lockStat.ino) await unlink(lockPath);
    }
  }
  return { ...base, writes: Boolean(apply && !dryRun), applied: Boolean(apply && !dryRun), proposedRepositories: next.repositories, ...(backup ? { backup } : {}), recordsPreserved: true };
}
