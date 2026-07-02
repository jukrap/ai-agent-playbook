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

const INDEX_FILE = 'runtime/indexes/file-inventory.json';
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
    ok: true,
    target: resolvedTarget,
    applied: Boolean(apply),
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
  if (!existsSync(indexPath)) {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: true,
      target: resolvedTarget,
      exists: false,
      index: `${playbook.dir}/${INDEX_FILE}`,
      summary: {
        files: 0,
        generatedAt: null,
        warnings: 0,
        conflicts: 0
      },
      warnings: [],
      conflicts: []
    };
  }
  const parsed = JSON.parse(await readFile(indexPath, 'utf8'));
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    exists: true,
    index: `${playbook.dir}/${INDEX_FILE}`,
    summary: {
      files: parsed.summary?.files ?? parsed.files?.length ?? 0,
      generatedAt: parsed.generatedAt ?? null,
      warnings: 0,
      conflicts: 0
    },
    inventory: parsed.summary ?? {},
    warnings: [],
    conflicts: []
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
