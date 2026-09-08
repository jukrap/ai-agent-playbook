import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, open, rename, unlink, rmdir, link, realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inside, noLinks, projectRoot, readBytes, readText, safePath, sha256, statOrNull } from './fs-safety.mjs';
import { createWorkspaceConfig, locateLocalPlaybook, resolveRecordContext, validateWorkspaceConfig } from './workspace.mjs';

const exec = promisify(execFile);
const PACKAGE_ROOT = fileURLToPath(new URL('../', import.meta.url));
const MARKER = '.ai-agent-playbook-install.json';
const MAX_BYTES = 500_000;
const DOCS = ['CURRENT.md', 'manifest.json', MARKER, 'worklogs/README.md', 'knowledge/README.md', 'workspace.json'];
const fail = (message, code = 'aapb.bootstrap-invalid') => Object.assign(new Error(message), { code });
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const slash = (value) => value.replaceAll('\\', '/');

// Resolve existing filesystem aliases before comparing scopes, without following links.
// Keep a missing suffix so a new ignore file or directory can still be planned.
async function canonicalFilePath(file) {
  const absolute = path.resolve(file);
  await noLinks(absolute);
  let ancestor = absolute;
  const suffix = [];
  while (!await statOrNull(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw fail('No existing ancestor for exclusion path.');
    suffix.unshift(path.basename(ancestor)); ancestor = parent;
  }
  return path.join(await realpath(ancestor), ...suffix);
}

function enumValue(value, values, name) {
  if (!values.includes(value)) throw fail(`${name} must be ${values.join(' or ')}.`);
  return value;
}

export function normalizeBootstrapOptions(options) {
  if (options.localOnly && options.exclude !== undefined && options.exclude !== 'local') throw fail('--local-only conflicts with the selected exclusion mode.');
  const result = {
    ...options, kind: enumValue(options.kind === 'project' ? 'single' : options.kind ?? 'single', ['single', 'workspace'], 'kind'),
    exclude: enumValue(options.exclude ?? (options.localOnly ? 'local' : 'none'), ['local', 'shared', 'global', 'none'], 'exclude'),
    lang: enumValue(options.lang ?? 'en', ['en', 'ko'], 'lang'),
    records: enumValue(options.records ?? 'minimal', ['minimal', 'standard'], 'records'),
    agents: enumValue(options.agents ?? 'preserve', ['preserve', 'link'], 'agents')
  };
  if (result.repositories !== undefined && result.kind !== 'workspace') throw fail('Explicit repositories require kind=workspace.');
  return result;
}

// Ignore ambient worktree/index overrides: all Git queries belong to the selected target.
async function git(root, args, { optional = false } = {}) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0', LC_ALL: 'C' };
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_PREFIX']) delete env[name];
  try {
    return (await exec('git', ['-C', root, ...args], { env, encoding: 'utf8', windowsHide: true, timeout: 10000, maxBuffer: 1_000_000 })).stdout;
  } catch (error) {
    if (optional && (error.code === 'ENOENT' || error.code === 1 || /not a git repository/i.test(error.stderr ?? ''))) return null;
    throw fail('Git preflight failed: ' + String(error.stderr || error.message).slice(0, 1500));
  }
}

export async function inspectBootstrapGit(target) {
  const root = await projectRoot(target);
  if (/[\x00-\x1f]/.test(root)) throw fail('Bootstrap paths must not contain control characters.');
  const top = await git(root, ['rev-parse', '--show-toplevel'], { optional: true });
  if (top === null) return null;
  const topLevel = await canonicalFilePath(path.resolve(root, top.trim()));
  if (!inside(topLevel, root)) throw fail('Git worktree does not contain the selected target.');
  await noLinks(topLevel);
  await noLinks(path.join(topLevel, '.git'));
  const commonDirectory = await canonicalFilePath(path.resolve(root, (await git(root, ['rev-parse', '--git-common-dir'])).trim()));
  const excludeFile = await canonicalFilePath(path.resolve(root, (await git(root, ['rev-parse', '--git-path', 'info/exclude'])).trim()));
  if (excludeFile !== path.join(commonDirectory, 'info', 'exclude')) throw fail('Git returned an unexpected local exclusion path.');
  await noLinks(excludeFile);
  return { topLevel, commonDirectory, excludeFile };
}

async function globalExclusion(root, gitInfo) {
  const configured = await git(root, ['config', '--path', '--get', 'core.excludesFile'], { optional: true });
  // A missing key exits 1 even when Git itself is available.
  const value = configured === null ? null : configured.replace(/\r?\n$/, '');
  if (value !== null && (!value || /[\x00-\x1f]/.test(value))) throw fail('core.excludesFile must identify a non-empty safe file path.');
  const home = process.env.HOME || os.homedir();
  const base = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  if (value === null && !path.isAbsolute(base)) throw fail('The Git global configuration directory must be absolute.');
  const file = await canonicalFilePath(value === null ? path.join(base, 'git', 'ignore') : path.resolve(gitInfo?.topLevel ?? root, value));
  if (file === path.parse(file).root) throw fail('Global exclusions must name a file.');
  await noLinks(file);
  return { file, configured: value !== null, value };
}

async function snapshot(file) {
  if (/[\x00-\x1f]/.test(file)) throw fail('Bootstrap paths must not contain control characters.');
  await noLinks(file);
  const info = await statOrNull(file);
  if (!info) return { file, bytes: null, stamp: null, mode: null };
  if (!info.isFile() || info.size > MAX_BYTES || info.nlink > 1) throw fail('Expected a bounded, unlinked regular file: ' + file);
  const bytes = await readBytes(file, MAX_BYTES);
  const after = await statOrNull(file);
  const stamp = (st) => st && [st.dev, st.ino, st.size, st.mtimeMs, st.ctimeMs, st.mode].join(':');
  if (stamp(info) !== stamp(after)) throw fail('File changed during bootstrap inspection: ' + file, 'aapb.bootstrap-concurrent-edit');
  return { file, bytes, stamp: stamp(after), mode: info.mode & 0o777 };
}

function textOf(entry) {
  if (!entry.bytes) return '';
  if (entry.bytes.includes(0)) throw fail('Expected UTF-8 text: ' + entry.file);
  return new TextDecoder('utf-8', { fatal: true }).decode(entry.bytes);
}

function sameBytes(a, b) { return a === null || b === null ? a === b : a.equals(b); }

async function unchanged(expected) {
  const current = await snapshot(expected.file);
  if (!sameBytes(current.bytes, expected.bytes) || current.stamp !== expected.stamp) throw fail('File changed after bootstrap preflight: ' + expected.file, 'aapb.bootstrap-concurrent-edit');
}

const ignoreEscape = (value) => value.replace(/[\\*?\[\]!# ]/g, '\\$&');
function ownedBlock(id, pattern, newline = '\n') {
  return `# >>> ai-agent-playbook exclusions ${id} >>>${newline}${pattern}${newline}# <<< ai-agent-playbook exclusions ${id} <<<${newline}`;
}

// Only an exact block with a known pattern is owned. Bare 1.1 ignore lines and edited blocks stay user-owned.
function replaceBlock(original, id, pattern, add, warnings, label) {
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const begin = `# >>> ai-agent-playbook exclusions ${id} >>>`;
  const end = `# <<< ai-agent-playbook exclusions ${id} <<<`;
  const expression = new RegExp(`^${begin}[\\r]?\\n[\\s\\S]*?^${end}(?:\\r?\\n|$)`, 'gm');
  const matches = [...original.matchAll(expression)];
  if ((original.includes(begin) || original.includes(end)) && (matches.length !== 1 || matches[0][0].replaceAll('\r\n', '\n').replace(/\n?$/, '\n') !== ownedBlock(id, pattern))) {
    warnings.push(`Edited or ambiguous AAPB exclusion block preserved in ${label}.`);
    return original;
  }
  if (matches.length) return add ? original : original.replace(expression, '');
  if (!add) return original;
  return original + (original && !original.endsWith('\n') ? newline : '') + ownedBlock(id, pattern, newline);
}

function guides(lang) {
  return lang === 'ko' ? {
    'worklogs/README.md': '# 작업 기록\n\n완료한 작업은 `YYYY-MM/` 아래 개별 Markdown 파일로 남깁니다. `aapb worklog new`로 기록을 만들고 목표, 변경, 실제 검증 명령과 결과, 남은 문제를 적습니다. 관련 저장소 ID와 근거 링크를 유지합니다.\n\n지난 기록을 요약으로 덮어쓰지 않습니다. 다음 행동은 [CURRENT.md](../CURRENT.md)에, 반복해서 쓸 결정과 교훈은 [지식 기록](../knowledge/README.md)에 연결합니다. 오래된 `workflows/worklogs/` 기록도 보존합니다.\n',
    'knowledge/README.md': '# 지식 기록\n\n반복해서 쓸 결정, 제약, 문제 해결 방법은 `aapb knowledge new`로 개별 Markdown 파일에 기록합니다. 적용 범위, 관련 저장소 ID, 확인한 사실과 근거, 아직 모르는 점을 명시합니다.\n\n추측과 검증 결과를 구분하고 이전 결정을 대체할 때 원문을 보존한 채 새 기록을 연결합니다. 비밀 값은 넣지 않습니다. 작업 이력은 [작업 기록](../worklogs/README.md)에, 현재 목표는 [CURRENT.md](../CURRENT.md)에 둡니다.\n'
  } : {
    'worklogs/README.md': '# Worklogs\n\nKeep completed work in separate Markdown files under `YYYY-MM/`. Use `aapb worklog new` and record the objective, changes, actual verification commands and results, and remaining issues. Keep repository IDs and links to evidence.\n\nPreserve older entries instead of replacing them with summaries. Link the next action from [CURRENT.md](../CURRENT.md) and reusable decisions or lessons from [knowledge](../knowledge/README.md). Preserve legacy `workflows/worklogs/` records too.\n',
    'knowledge/README.md': '# Knowledge\n\nUse `aapb knowledge new` for a separate Markdown record of a reusable decision, constraint, or troubleshooting lesson. State its scope, relevant repository IDs, verified facts and evidence, and what remains unknown.\n\nDistinguish inference from observed results. When a decision changes, preserve the original and link its replacement. Keep secrets out. Put task history in [worklogs](../worklogs/README.md) and the active objective in [CURRENT.md](../CURRENT.md).\n'
  };
}

// Preserve both supported ownership formats and every unrelated entry while updating one hash.
function updateManifestOwnership(marker, name, oldHash, newHash, userFiles) {
  if (marker?.source !== 'ai-agent-playbook') return null;
  if (marker.userFiles !== undefined && (!Array.isArray(marker.userFiles) || marker.userFiles.some((file) => typeof file !== 'string'))) return null;
  let files;
  if (Array.isArray(marker.files)) {
    const matching = marker.files.filter((entry) => (entry.path ?? entry.relativePath) === name + '/manifest.json');
    if (matching.length !== 1 || matching[0].sourceHash !== oldHash) return null;
    files = marker.files.map((entry) => entry === matching[0] ? { ...entry, sourceHash: newHash } : entry);
  } else {
    const entry = marker.files?.['manifest.json'];
    if ((typeof entry === 'string' ? entry : entry?.sourceHash) !== oldHash) return null;
    files = { ...marker.files, 'manifest.json': typeof entry === 'string' ? newHash : { ...entry, sourceHash: newHash } };
  }
  return { ...marker, files, userFiles: [...new Set([...(Array.isArray(marker.userFiles) ? marker.userFiles : []), ...userFiles])] };
}

async function exclusionLocations(pb, gitInfo) {
  const global = await globalExclusion(pb.root, gitInfo);
  const result = [
    { mode: 'shared', file: path.join(pb.root, '.gitignore'), pattern: `/${pb.name}/` },
    { mode: 'global', file: global.file, pattern: `${pb.name}/` }
  ];
  if (gitInfo) result.unshift({ mode: 'local', file: gitInfo.excludeFile, pattern: '/' + ignoreEscape(slash(path.relative(gitInfo.topLevel, pb.directory))) + '/' });
  if (new Set(result.map((entry) => entry.file)).size !== result.length) throw fail('Git exclusion scopes resolve to the same file; resolve core.excludesFile before bootstrap.');
  for (const entry of result) {
    if (inside(pb.directory, entry.file) || entry.file === path.join(pb.root, 'AGENTS.md')) throw fail('Git exclusions overlap project records or instructions.');
    if (entry.mode !== 'local' && gitInfo && inside(gitInfo.commonDirectory, entry.file)) throw fail('Git exclusions must not overwrite Git metadata.');
  }
  return { locations: result, global };
}

/** Read existing choices for the wizard, without changing or claiming ownership of metadata. */
export async function readBootstrapDefaults(target) {
  const pb = await resolveRecordContext({ target }), defaults = {};
  const manifest = await snapshot(await safePath(pb.directory, 'manifest.json'));
  if (manifest.bytes !== null) {
    const value = JSON.parse(textOf(manifest).replace(/^\uFEFF/, ''));
    if (['en', 'ko'].includes(value.lang)) defaults.lang = value.lang;
    if (['minimal', 'standard'].includes(value.layoutKind)) defaults.records = value.layoutKind;
    if (['single', 'workspace'].includes(value.kind)) defaults.kind = value.kind;
  }
  if (pb.workspace) { defaults.kind = 'workspace'; defaults.repositories = pb.workspace.config.repositories; }
  const gitInfo = await inspectBootstrapGit(pb.root);
  const { locations } = await exclusionLocations(pb, gitInfo);
  const marker = `# >>> ai-agent-playbook exclusions ${sha256(pb.root).slice(0, 24)} >>>`;
  for (const location of locations) if (textOf(await snapshot(location.file)).includes(marker)) defaults.exclude = location.mode;
  if (pb.exists && defaults.exclude === undefined) defaults.exclude = 'none';
  return defaults;
}

/** Read-only plan. The returned plan is intended for immediate use with applyBootstrapPlan. */
export async function planBootstrapProject(options) {
  const selected = normalizeBootstrapOptions(options);
  const requestedRoot = await projectRoot(selected.target);
  const context = await resolveRecordContext({ target: requestedRoot });
  const pb = context;
  const gitInfo = await inspectBootstrapGit(pb.root);
  const warnings = [], preserved = [], guards = [], operations = [];
  const inspect = async (file) => {
    const existing = guards.find((entry) => entry.file === file);
    if (existing) return existing;
    const entry = await snapshot(file); guards.push(entry); return entry;
  };
  const add = async (file, body, label, preserve = true) => {
    const before = await inspect(file), after = Buffer.from(body);
    if (preserve && before.bytes !== null) { preserved.push(label); return; }
    if (!sameBytes(before.bytes, after)) operations.push({ file, label, before, after });
  };
  const recordPath = (relative) => safePath(pb.directory, relative);
  if (context.workspace && pb.root !== requestedRoot) {
    await inspect(context.workspace.file);
    warnings.push('Registered member uses the existing shared workspace records. Bootstrap choices must be changed from the workspace root; no duplicate local playbook was created.');
    return { pb, requestedRoot, selected: { ...selected, repositories: undefined }, guards, operations, gitInfo, exclusionState: null, explicitExclude: false, preserved: [pb.name, 'workspace.json'], warnings,
      exclusion: { mode: selected.exclude, git: Boolean(gitInfo), globalImpact: false, applied: false, locations: [] } };
  }
  const currentEntry = await inspect(await recordPath('CURRENT.md'));
  const manifestEntry = await inspect(await recordPath('manifest.json'));
  const markerEntry = await inspect(await recordPath(MARKER));
  if (currentEntry.bytes === null) {
    const source = selected.lang === 'ko' ? 'translations/ko/templates/project-playbook/CURRENT.ko.md' : 'templates/project-playbook/CURRENT.md';
    let current = await readText(await safePath(selected.repoRoot ?? PACKAGE_ROOT, source), MAX_BYTES);
    if (selected.records === 'standard') current += selected.lang === 'ko' ? '\n[작업 기록](worklogs/README.md) · [지식 기록](knowledge/README.md)\n' : '\n[Worklogs](worklogs/README.md) · [Knowledge](knowledge/README.md)\n';
    await add(await recordPath('CURRENT.md'), current, 'CURRENT.md');
  } else preserved.push('CURRENT.md');
  // Explicit metadata updates require matching AAPB ownership; editable documents stay intact.
  const manifest = json({ schemaVersion: '2', source: 'ai-agent-playbook', layoutKind: selected.records, kind: selected.kind, lang: selected.lang });
  if (manifestEntry.bytes === null) await add(manifestEntry.file, manifest, 'manifest.json');
  else {
    const metadata = {};
    if (options.lang !== undefined) metadata.lang = selected.lang;
    if (options.records !== undefined) metadata.layoutKind = selected.records;
    if (options.kind !== undefined) metadata.kind = selected.kind;
    if (Object.keys(metadata).length) {
      let value, marker;
      try { value = JSON.parse(textOf(manifestEntry).replace(/^\uFEFF/, '')); marker = JSON.parse(textOf(markerEntry).replace(/^\uFEFF/, '')); } catch { /* Preserve invalid or unmanaged metadata. */ }
      const defaults = { lang: 'en', kind: context.workspace ? 'workspace' : 'single' };
      const changed = Object.entries(metadata).some(([key, next]) => (value?.[key] ?? defaults[key]) !== next);
      if (changed) {
        const proposed = json({ ...value, ...metadata });
        const userFiles = ['CURRENT.md', ...(selected.records === 'standard' ? ['worklogs/README.md', 'knowledge/README.md'] : [])];
        const updatedMarker = value && typeof value === 'object' && !Array.isArray(value) && updateManifestOwnership(marker, pb.name, sha256(manifestEntry.bytes), sha256(proposed), userFiles);
        if (updatedMarker) {
          await add(manifestEntry.file, proposed, 'manifest.json', false);
          await add(markerEntry.file, json(updatedMarker), MARKER, false);
        } else warnings.push('Selected metadata was not persisted: the manifest is unmanaged, modified, or has invalid ownership. Existing documents and metadata were preserved; reconcile ownership before changing saved language or layout.');
      }
    }
    if (!operations.some((op) => op.file === manifestEntry.file)) preserved.push('manifest.json');
  }
  if (markerEntry.bytes === null) await add(markerEntry.file, json({ schemaVersion: 2, source: 'ai-agent-playbook', files: manifestEntry.bytes === null ? { 'manifest.json': sha256(manifest) } : {}, userFiles: ['CURRENT.md', ...(selected.records === 'standard' ? ['worklogs/README.md', 'knowledge/README.md'] : [])] }), MARKER);
  else if (!operations.some((op) => op.file === markerEntry.file)) preserved.push(MARKER);
  if (selected.records === 'standard') for (const [name, body] of Object.entries(guides(selected.lang))) await add(await recordPath(name), body, name);
  if (selected.kind === 'workspace') {
    const entry = await inspect(await recordPath('workspace.json'));
    if (entry.bytes !== null) {
      const existing = validateWorkspaceConfig(JSON.parse(textOf(entry).replace(/^\uFEFF/, '')));
      if (selected.repositories !== undefined && json(createWorkspaceConfig(selected.repositories)) !== json({ schemaVersion: 1, repositories: existing.repositories })) warnings.push('Existing workspace membership was preserved; use workspace management to change registered repositories.');
      preserved.push('workspace.json');
    } else {
      if (selected.repositories === undefined) throw fail('A new workspace requires explicit repository selection (repositories).');
      const config = createWorkspaceConfig(selected.repositories);
      for (const repo of config.repositories) await projectRoot(await safePath(pb.root, repo.path));
      await add(entry.file, json(config), 'workspace.json');
    }
  }
  if (selected.agents === 'link') {
    const file = path.join(pb.root, 'AGENTS.md'), before = await inspect(file), original = textOf(before);
    const link = `${pb.name}/CURRENT.md`;
    if (!original.includes(`](${link})`) && !original.includes('<!-- aapb:records:start -->')) {
      const guidance = selected.lang === 'ko' ? `프로젝트 기록이 필요한 과제는 [현재 상태](${link})부터 확인합니다. 확인한 근거와 다음 행동을 기록합니다.` : `When a task needs project records, start with [current state](${link}). Keep verified evidence and the next action in those records.`;
      await add(file, original + (original && !original.endsWith('\n') ? '\n' : '') + '\n<!-- aapb:records:start -->\n' + guidance + '\n<!-- aapb:records:end -->\n', 'AGENTS.md', false);
    } else preserved.push('AGENTS.md');
  }
  const explicitExclude = options.exclude !== undefined || Boolean(options.localOnly);
  let exclusion = { mode: selected.exclude, git: Boolean(gitInfo), globalImpact: false, applied: false, reason: null, locations: [] };
  let exclusionState = null;
  if (explicitExclude && selected.exclude === 'local' && !gitInfo) {
    exclusion.reason = 'no-git-worktree';
    warnings.push('Local Git exclusion was not applied: this target has no Git worktree. Records can still be used; Git was not initialized.');
  }
  if (explicitExclude && !exclusion.reason) {
    // config --get may exit 1 for the default; first verify Git availability for explicit global use.
    if (selected.exclude === 'global') await git(pb.root, ['--version']);
    exclusionState = await exclusionLocations(pb, gitInfo);
    const id = sha256(pb.root).slice(0, 24);
    for (const location of exclusionState.locations) {
      const before = await inspect(location.file), original = textOf(before);
      const next = replaceBlock(original, id, location.pattern, location.mode === selected.exclude, warnings, location.mode);
      if (next !== original) {
        await add(location.file, next, 'git-' + location.mode + '-exclude', false);
        if (location.mode === 'global') exclusion.globalImpact = true;
      }
    }
    exclusion.locations = exclusionState.locations.map(({ mode, file, pattern }) => ({ mode, file, pattern, selected: mode === selected.exclude }));
    if (selected.exclude === 'global' || exclusion.globalImpact) {
      exclusion.globalImpact = true;
      warnings.push('Global impact: every repository using this Git exclusions file is affected by its unanchored playbook-folder pattern. Existing core.excludesFile is respected; no Git configuration is changed. A backup is retained for every modification.');
    }
    if (selected.exclude === 'local' && gitInfo) warnings.push('Git local exclusions use the common Git directory and may also affect linked worktrees.');
    if (selected.exclude === 'none') warnings.push('Only unchanged AAPB-owned exclusion blocks are removed. User-authored or other Git ignore rules may still exclude records.');
    if (!gitInfo && selected.exclude !== 'none') warnings.push('This target has no Git worktree; exclusion patterns take effect only in repositories that read the selected file.');
  }
  if (gitInfo && explicitExclude) {
    const relative = slash(path.relative(gitInfo.topLevel, pb.directory));
    const tracked = (await git(gitInfo.topLevel, ['ls-files', '-z', '--', ':(literal)' + relative])).split('\0').filter(Boolean);
    if (tracked.length) warnings.push(`${tracked.length} tracked playbook file(s) remain tracked; ignore rules do not alter the index. Sample: ${tracked.slice(0, 3).join(', ')}`);
  }
  return { pb, requestedRoot, selected, guards, operations, gitInfo, exclusionState, explicitExclude, preserved, warnings, exclusion };
}

async function preflight(plan) {
  const pb = await locateLocalPlaybook(plan.pb.root);
  const context = await resolveRecordContext({ target: plan.requestedRoot });
  if (context.root !== plan.pb.root || context.directory !== plan.pb.directory) throw fail('Workspace membership changed after bootstrap preflight.', 'aapb.bootstrap-concurrent-edit');
  if (pb.directory !== plan.pb.directory || pb.exists !== plan.pb.exists) throw fail('Playbook changed after bootstrap preflight.', 'aapb.bootstrap-concurrent-edit');
  if (json(await inspectBootstrapGit(pb.root)) !== json(plan.gitInfo)) throw fail('Git context changed after bootstrap preflight.', 'aapb.bootstrap-concurrent-edit');
  if (plan.exclusionState && json(await exclusionLocations(pb, plan.gitInfo)) !== json(plan.exclusionState)) throw fail('Git exclusion configuration changed after bootstrap preflight.', 'aapb.bootstrap-concurrent-edit');
  for (const entry of plan.guards) await unchanged(entry);
  for (const repo of plan.selected.repositories ?? []) await projectRoot(await safePath(pb.root, repo.path));
}

async function ensureDirectory(directory, created) {
  await noLinks(directory);
  const existing = await statOrNull(directory);
  if (existing) {
    if (!existing.isDirectory()) throw fail('Expected a directory: ' + directory);
    return;
  }
  await ensureDirectory(path.dirname(directory), created);
  await mkdir(directory); created.push(directory);
}

async function durableWrite(file, bytes, mode, exclusive = true) {
  const handle = await open(file, exclusive ? 'wx' : 'w', mode ?? 0o600);
  try {
    await handle.writeFile(bytes);
    if (mode !== undefined && mode !== null) await handle.chmod(mode);
    await handle.sync();
  } finally { await handle.close(); }
}

async function replaceFile(file, bytes, expected, created) {
  await ensureDirectory(path.dirname(file), created);
  await unchanged(expected);
  const temporary = path.join(path.dirname(file), '.aapb-write-' + randomUUID() + '.tmp');
  try {
    await durableWrite(temporary, bytes, expected.mode ?? 0o644);
    await unchanged(expected);
    // Atomic exclusive publication prevents a partial new file or replacing a concurrent creation.
    if (expected.bytes === null) await link(temporary, file);
    else await rename(temporary, file);
  } finally { await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
}

async function writeJournal(file, data, initial = false) {
  if (initial) return durableWrite(file, Buffer.from(json(data)), 0o600);
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    await noLinks(file);
    await durableWrite(temporary, Buffer.from(json(data)), 0o600);
    await noLinks(file);
    await rename(temporary, file);
  } finally { await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
}

function result(plan, extra = {}) {
  return { schemaVersion: '2', kind: 'playbook.bootstrap', ok: true, writes: false, applied: false,
    operations: plan.operations.map((op) => op.label), preserved: plan.preserved, warnings: plan.warnings,
    localOnly: plan.selected.exclude === 'local', agentsPreserved: !plan.operations.some((op) => op.label === 'AGENTS.md'),
    selection: { kind: plan.selected.kind, records: plan.selected.records, lang: plan.selected.lang, agents: plan.selected.agents, exclude: plan.selected.exclude },
    exclusion: plan.exclusion, ...extra };
}

async function restoreOperations(operations) {
  const conflicts = [];
  for (const op of [...operations].reverse()) {
    try {
      const current = await snapshot(op.file);
      const before = op.before === null ? null : Buffer.from(op.before, 'base64');
      if (sameBytes(current.bytes, before)) continue;
      if (current.bytes === null || sha256(current.bytes) !== op.afterHash) throw fail('Later edit preserved: ' + op.file);
      if (before === null) { await unchanged(current); await unlink(op.file); }
      else await replaceFile(op.file, before, { ...current, mode: op.mode }, []);
    } catch (error) { conflicts.push({ path: op.file, message: error.message }); }
  }
  return conflicts;
}

async function removeEmpty(directories) {
  for (const directory of [...directories].reverse()) {
    await noLinks(directory);
    await rmdir(directory).catch((error) => { if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error; });
  }
}

/** Apply an immediate plan. beforeWrite is an optional deterministic fault/concurrency test seam. */
export async function applyBootstrapPlan(plan, { beforeWrite = undefined } = {}) {
  await preflight(plan);
  if (plan.selected.dryRun || !plan.operations.length) return result(plan);
  const created = [];
  const journalFile = await safePath(plan.pb.directory, 'archive/bootstrap-' + randomUUID() + '.json');
  const journal = { schemaVersion: 1, source: 'ai-agent-playbook-bootstrap', root: plan.pb.root, playbook: plan.pb.name, status: 'prepared', applied: [], pending: null, createdDirectories: created,
    operations: plan.operations.map((op) => ({ file: op.file, label: op.label, before: op.before.bytes?.toString('base64') ?? null, mode: op.before.mode, afterHash: sha256(op.after) })) };
  let started = false;
  try {
    await ensureDirectory(path.dirname(journalFile), created);
    // Record all intended directories before the first file mutation for crash recovery.
    for (const op of plan.operations) await ensureDirectory(path.dirname(op.file), created);
    for (const entry of plan.guards) await unchanged(entry);
    await writeJournal(journalFile, journal, true); started = true;
    for (const [index, op] of plan.operations.entries()) {
      if (beforeWrite) await beforeWrite({ index, path: op.file, label: op.label });
      await unchanged(op.before);
      journal.pending = index; await writeJournal(journalFile, journal);
      await replaceFile(op.file, op.after, op.before, created);
      journal.applied.push(index); journal.pending = null; await writeJournal(journalFile, journal);
    }
    journal.status = 'complete'; await writeJournal(journalFile, journal);
  } catch (error) {
    const conflicts = started ? await restoreOperations(journal.applied.map((index) => journal.operations[index])) : [];
    if (started) {
      journal.pending = null;
      journal.status = conflicts.length ? 'recovery-required' : 'rolled-back';
      await writeJournal(journalFile, journal).catch(() => {});
    }
    if (!conflicts.length) {
      if (started) await unlink(journalFile).catch(() => {});
      await removeEmpty(created).catch(() => {});
    }
    throw Object.assign(fail('Bootstrap failed: ' + error.message + (conflicts.length ? '. Recovery journal: ' + journalFile : '. Applied changes were rolled back.'), error.code ?? 'aapb.bootstrap-transaction-failed'),
      { cause: error, rolledBack: !conflicts.length, recovery: conflicts.length ? journalFile : null, conflicts });
  }
  const backupNeeded = plan.operations.some((op) => op.before.bytes !== null || op.label === 'git-global-exclude');
  if (!backupNeeded) { await unlink(journalFile); await removeEmpty(created.filter((dir) => dir === path.dirname(journalFile))); }
  return result(plan, { writes: true, applied: true, exclusion: { ...plan.exclusion, applied: !plan.exclusion.reason && plan.operations.some((op) => op.label.startsWith('git-')) }, ...(backupNeeded ? { backup: journalFile } : {}) });
}

export async function bootstrapProject(options) {
  return applyBootstrapPlan(await planBootstrapProject(options));
}

/** Checked rollback of a returned backup/recovery journal; later edits always remain untouched. */
export async function recoverBootstrap({ target, transaction, dryRun = false, recordSource = undefined }) {
  if (typeof transaction !== 'string' || !transaction) throw fail('Select the returned bootstrap backup with --backup.');
  const pb = await resolveRecordContext({ target, recordSource });
  const journalFile = path.isAbsolute(transaction) ? transaction : path.resolve(pb.directory, transaction);
  const relative = slash(path.relative(pb.directory, journalFile));
  if (!/^archive\/bootstrap-[0-9a-f-]{36}\.json$/.test(relative)) throw fail('Select a bootstrap journal in the playbook archive.');
  await safePath(pb.directory, relative);
  const original = await readBytes(journalFile, 12_000_000);
  const journal = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(original));
  if (journal.schemaVersion !== 1 || journal.source !== 'ai-agent-playbook-bootstrap' || journal.root !== pb.root || journal.playbook !== pb.name || !Array.isArray(journal.operations) || journal.operations.length > 16) throw fail('Invalid bootstrap recovery journal.');
  const gitInfo = await inspectBootstrapGit(pb.root);
  const { locations } = await exclusionLocations(pb, gitInfo);
  const allowed = new Set([path.join(pb.root, 'AGENTS.md'), ...DOCS.map((name) => path.join(pb.directory, name)), ...locations.map((entry) => entry.file)]);
  const indices = [...new Set([...(journal.applied ?? []), ...(journal.pending === null ? [] : [journal.pending])])];
  if (!Array.isArray(journal.applied) || indices.some((index) => !Number.isInteger(index) || index < 0 || index >= journal.operations.length)) throw fail('Invalid bootstrap recovery progress.');
  const seen = new Set(), conflicts = [];
  for (const op of journal.operations) {
    // Older journals may contain an equivalent Windows short path.
    if (typeof op.file !== 'string' || !path.isAbsolute(op.file)) throw fail('Unsafe bootstrap recovery path.');
    op.file = await canonicalFilePath(op.file);
    if (!allowed.has(op.file) || seen.has(op.file) || !/^[a-f0-9]{64}$/.test(op.afterHash) || (op.before !== null && (typeof op.before !== 'string' || Buffer.byteLength(op.before, 'base64') > MAX_BYTES)) || (op.mode !== null && (!Number.isInteger(op.mode) || op.mode < 0 || op.mode > 0o777))) throw fail('Unsafe bootstrap recovery operation.');
    seen.add(op.file);
  }
  const affected = indices.map((index) => journal.operations[index]);
  for (const op of affected) {
    const current = await snapshot(op.file), before = op.before === null ? null : Buffer.from(op.before, 'base64');
    if (!sameBytes(current.bytes, before) && (current.bytes === null || sha256(current.bytes) !== op.afterHash)) conflicts.push({ path: op.file, message: 'Later edit preserved.' });
  }
  const report = { schemaVersion: '2', kind: 'playbook.bootstrap-recovery', ok: !conflicts.length, writes: false, applied: false, conflicts, transaction: journalFile };
  if (dryRun || conflicts.length || journal.status === 'rolled-back') return report;
  if (!original.equals(await readBytes(journalFile, 12_000_000))) throw fail('Recovery journal changed during inspection.');
  const laterConflicts = await restoreOperations(affected);
  journal.status = laterConflicts.length ? 'recovery-required' : 'rolled-back';
  await writeJournal(journalFile, journal);
  return { ...report, ok: !laterConflicts.length, writes: true, applied: !laterConflicts.length, conflicts: laterConflicts };
}
