import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  walkFiles
} from '../harness/core.mjs';
import { validateRuntimeArtifact } from './schemas.mjs';

const INDEX_FILE = 'runtime/indexes/file-inventory.json';
const INDEX_DEFINITIONS = [
  { kind: 'file-inventory', artifactKind: 'runtime.file-inventory', file: INDEX_FILE, previewOnly: false },
  { kind: 'symbol-outline', artifactKind: 'runtime.symbol-outline', file: 'runtime/indexes/symbol-outline.json', previewOnly: true },
  { kind: 'dependency-inventory', artifactKind: 'runtime.dependency-inventory', file: 'runtime/indexes/dependency-inventory.json', previewOnly: true },
  { kind: 'route-api-hints', artifactKind: 'runtime.route-api-hints', file: 'runtime/indexes/route-api-hints.json', previewOnly: true }
];
const TEXT_EXTENSIONS = new Set([
  '.c',
  '.conf',
  '.cs',
  '.css',
  '.go',
  '.graphql',
  '.html',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.kt',
  '.md',
  '.mjs',
  '.php',
  '.properties',
  '.py',
  '.rb',
  '.rs',
  '.scss',
  '.sh',
  '.sql',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
  '.xml',
  '.yaml',
  '.yml'
]);
const EXCLUDED_PARTS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

export async function buildRuntimeIndex({ target, apply = false }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const entries = await collectInventory(resolvedTarget, playbook.dir);
  const report = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.file-inventory',
    ok: true,
    target: resolvedTarget,
    applied: Boolean(apply),
    mode: { localOnly: true, network: false, writes: Boolean(apply) },
    index: `${playbook.dir}/${INDEX_FILE}`,
    generatedAt: new Date().toISOString(),
    summary: summarizeInventory(entries),
    files: entries,
    warnings: [],
    conflicts: []
  };

  if (apply) {
    const indexPath = path.join(playbook.root, ...INDEX_FILE.split('/'));
    await mkdir(path.dirname(indexPath), { recursive: true });
    await writeFile(indexPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

export async function runtimeIndexStatus({ target }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const indexPath = path.join(playbook.root, ...INDEX_FILE.split('/'));
  const indexes = await Promise.all(INDEX_DEFINITIONS.map((definition) => readIndexStatus(playbook, definition)));
  const fileIndexStatus = indexes.find((item) => item.kind === 'file-inventory');
  const otherIndexConflicts = indexes
    .filter((item) => item.kind !== 'file-inventory')
    .flatMap((item) => item.validation?.conflicts ?? []);
  if (!existsSync(indexPath)) {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: otherIndexConflicts.length === 0,
      target: resolvedTarget,
      exists: false,
      index: `${playbook.dir}/${INDEX_FILE}`,
      summary: {
        files: 0,
        generatedAt: null,
        warnings: 0,
        conflicts: 0
      },
      indexes,
      warnings: [],
      conflicts: otherIndexConflicts
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(await readFile(indexPath, 'utf8'));
  } catch {
    const validation = fileIndexStatus?.validation ?? { ok: false, warnings: [], conflicts: [] };
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: false,
      target: resolvedTarget,
      exists: true,
      index: `${playbook.dir}/${INDEX_FILE}`,
      summary: {
        files: 0,
        generatedAt: null,
        warnings: validation.warnings.length,
        conflicts: validation.conflicts.length + otherIndexConflicts.length
      },
      inventory: {},
      indexes,
      warnings: validation.warnings,
      conflicts: [...validation.conflicts, ...otherIndexConflicts]
    };
  }
  const validation = fileIndexStatus?.validation ?? validateRuntimeArtifact(parsed, {
    path: `${playbook.dir}/${INDEX_FILE}`,
    expectedKind: 'runtime.file-inventory'
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: validation.ok && otherIndexConflicts.length === 0,
    target: resolvedTarget,
    exists: true,
    index: `${playbook.dir}/${INDEX_FILE}`,
    summary: {
      files: parsed.summary?.files ?? parsed.files?.length ?? 0,
      generatedAt: parsed.generatedAt ?? null,
      warnings: validation.warnings.length,
      conflicts: validation.conflicts.length + otherIndexConflicts.length
    },
    inventory: parsed.summary ?? {},
    indexes,
    warnings: validation.warnings,
    conflicts: [...validation.conflicts, ...otherIndexConflicts]
  };
}

export async function searchRuntimeIndex({ target, query, maxResults = 20 }) {
  await assertDirectory(target, 'Target repository does not exist');
  if (!query || !String(query).trim()) throw new Error('Missing --query.');
  const resolvedTarget = path.resolve(target);
  const normalizedQuery = String(query).toLowerCase();
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const files = await walkFiles(resolvedTarget, (file) => shouldIndexFile(file, resolvedTarget, playbook.dir));
  const results = [];

  for (const file of files) {
    const info = await stat(file);
    if (info.size > 250000 || !TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const text = await readFile(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const snippets = [];
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].toLowerCase().includes(normalizedQuery)) {
        snippets.push({ line: index + 1, text: lines[index].trim().slice(0, 240) });
        if (snippets.length >= 3) break;
      }
    }
    if (snippets.length > 0) {
      results.push({
        path: normalizePortablePath(path.relative(resolvedTarget, file)),
        category: categorizeFile(file, resolvedTarget, playbook.dir),
        snippets
      });
      if (results.length >= maxResults) break;
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    summary: {
      matches: results.length,
      warnings: 0,
      conflicts: 0
    },
    results,
    warnings: [],
    conflicts: []
  };
}

async function collectInventory(target, playbookDir) {
  const files = await walkFiles(target, (file) => shouldIndexFile(file, target, playbookDir));
  const entries = [];
  for (const file of files) {
    const info = await stat(file);
    entries.push({
      path: normalizePortablePath(path.relative(target, file)),
      category: categorizeFile(file, target, playbookDir),
      extension: path.extname(file).toLowerCase(),
      bytes: info.size,
      modifiedTime: info.mtime.toISOString()
    });
  }
  entries.sort((left, right) => left.path.localeCompare(right.path));
  return entries;
}

function summarizeInventory(entries) {
  const byCategory = {};
  for (const entry of entries) {
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
  }
  return {
    files: entries.length,
    byCategory,
    warnings: 0,
    conflicts: 0
  };
}

function shouldIndexFile(file, target, playbookDir) {
  const relative = normalizePortablePath(path.relative(target, file));
  const parts = relative.split('/');
  if (parts.some((part) => EXCLUDED_PARTS.has(part))) return false;
  if (relative.startsWith(`${playbookDir}/runtime/`)) return false;
  if (relative.startsWith(`${playbookDir.replace(/^\./, '')}/runtime/`)) return false;
  return true;
}

function categorizeFile(file, target, playbookDir) {
  const relative = normalizePortablePath(path.relative(target, file));
  const extension = path.extname(file).toLowerCase();
  if (relative.startsWith(`${playbookDir}/`)) return 'playbook';
  if (relative.startsWith('test/') || relative.includes('/test/') || relative.includes('/tests/') || relative.includes('__tests__/')) return 'tests';
  if (['.md', '.mdx', '.txt', '.rst'].includes(extension)) return 'docs';
  if (['.json', '.yaml', '.yml', '.toml', '.ini'].includes(extension) || path.basename(file).startsWith('.env')) return 'config';
  if (TEXT_EXTENSIONS.has(extension)) return 'source';
  return 'other';
}

async function readIndexStatus(playbook, definition) {
  const indexPath = path.join(playbook.root, ...definition.file.split('/'));
  const relativePath = `${playbook.dir}/${definition.file}`;
  if (!existsSync(indexPath)) {
    return {
      kind: definition.kind,
      path: relativePath,
      exists: false,
      previewOnly: definition.previewOnly,
      schemaVersion: null,
      generatedAt: null,
      entries: 0
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(await readFile(indexPath, 'utf8'));
  } catch (error) {
    return {
      kind: definition.kind,
      path: relativePath,
      exists: true,
      previewOnly: definition.previewOnly,
      schemaVersion: null,
      generatedAt: null,
      entries: 0,
      valid: false,
      validation: {
        ok: false,
        warnings: [],
        conflicts: [{
          id: 'runtime.artifact.malformed-json',
          level: 'fail',
          message: `${relativePath} is not valid JSON: ${error.message}`,
          paths: [relativePath]
        }]
      }
    };
  }
  const validation = validateRuntimeArtifact(parsed, {
    path: relativePath,
    expectedKind: definition.artifactKind
  });
  return {
    kind: definition.kind,
    path: relativePath,
    exists: true,
    previewOnly: definition.previewOnly,
    schemaVersion: parsed.schemaVersion ?? null,
    generatedAt: parsed.generatedAt ?? null,
    entries: parsed.summary?.files ?? parsed.summary?.entries ?? parsed.files?.length ?? parsed.entries?.length ?? 0,
    valid: validation.ok,
    validation
  };
}
