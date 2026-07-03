import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  walkFiles
} from '../harness/core.mjs';

const DEPENDENCY_INVENTORY_INDEX_FILE = 'runtime/indexes/dependency-inventory.json';
const EXCLUDED_PARTS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.vite',
  '.next',
  '.turbo',
  'coverage'
]);

const LOCKFILES = new Map([
  ['npm', ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock']],
  ['composer', ['composer.lock']],
  ['python', ['poetry.lock', 'Pipfile.lock', 'requirements.lock']],
  ['go', ['go.sum']],
  ['nuget', ['packages.lock.json']]
]);

export async function buildDependencyInventoryIndex({ target }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const scan = await collectDependencyInventory(resolvedTarget, playbook.dir);
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.dependency-inventory',
    ok: true,
    target: resolvedTarget,
    applied: false,
    mode: { localOnly: true, network: false, writes: false },
    index: `${playbook.dir}/${DEPENDENCY_INVENTORY_INDEX_FILE}`,
    generatedAt: new Date().toISOString(),
    summary: summarizeInventory(scan),
    ecosystems: scan.ecosystems,
    manifests: scan.manifests,
    lockfiles: scan.lockfiles,
    containers: scan.containers,
    ci: scan.ci,
    warnings: scan.warnings,
    conflicts: []
  };
}

async function collectDependencyInventory(target, playbookDir) {
  const files = await walkFiles(target, (file) => shouldInspectFile(file, target, playbookDir));
  const scan = {
    manifests: [],
    lockfiles: [],
    containers: [],
    ci: [],
    warnings: [],
    ecosystems: []
  };

  for (const file of files.sort()) {
    const relative = normalizePortablePath(path.relative(target, file));
    const basename = path.basename(file);
    if (basename === 'package.json') {
      scan.manifests.push(await readPackageJsonManifest(file, relative, target));
      continue;
    }
    if (isNpmLockfile(basename)) {
      scan.lockfiles.push(lockfileEntry('npm', relative));
      continue;
    }
    if (basename === 'composer.json') {
      scan.manifests.push(await readComposerManifest(file, relative, target));
      continue;
    }
    if (basename === 'composer.lock') {
      scan.lockfiles.push(lockfileEntry('composer', relative));
      continue;
    }
    if (basename === 'go.mod') {
      scan.manifests.push(await readGoModManifest(file, relative, target));
      continue;
    }
    if (basename === 'go.sum') {
      scan.lockfiles.push(lockfileEntry('go', relative));
      continue;
    }
    if (isPythonManifest(basename)) {
      scan.manifests.push(await readSimpleManifest(file, relative, 'python', target));
      continue;
    }
    if (isPythonLockfile(basename)) {
      scan.lockfiles.push(lockfileEntry('python', relative));
      continue;
    }
    if (basename === 'pom.xml' || basename === 'build.gradle' || basename === 'build.gradle.kts' || basename === 'settings.gradle' || basename === 'settings.gradle.kts') {
      scan.manifests.push(await readSimpleManifest(file, relative, basename === 'pom.xml' ? 'maven' : 'gradle', target));
      continue;
    }
    if (basename === 'gradle.lockfile') {
      scan.lockfiles.push(lockfileEntry('gradle', relative));
      continue;
    }
    if (basename.endsWith('.csproj') || basename === 'packages.config') {
      scan.manifests.push(await readSimpleManifest(file, relative, 'nuget', target));
      continue;
    }
    if (basename === 'packages.lock.json') {
      scan.lockfiles.push(lockfileEntry('nuget', relative));
      continue;
    }
    if (basename === 'Dockerfile' || basename.endsWith('.Dockerfile')) {
      scan.containers.push(await readDockerfile(file, relative));
      continue;
    }
    if (isComposeFile(relative)) {
      scan.containers.push(await readComposeFile(file, relative));
      continue;
    }
    if (isGitHubWorkflow(relative)) {
      scan.ci.push(await readGitHubWorkflow(file, relative));
    }
  }

  scan.ecosystems = summarizeEcosystems(scan);
  addMissingLockfileWarnings(scan);
  return scan;
}

async function readPackageJsonManifest(file, relative, target) {
  const text = await readFile(file, 'utf8');
  const parsed = safeJson(text);
  const scripts = parsed && isRecord(parsed.scripts) ? Object.keys(parsed.scripts).sort() : [];
  const dependencies = countPackageJsonDependencies(parsed);
  return {
    ecosystem: 'npm',
    kind: 'manifest',
    path: relative,
    directory: normalizePortablePath(path.dirname(relative)),
    name: typeof parsed?.name === 'string' ? parsed.name : null,
    packageManager: typeof parsed?.packageManager === 'string' ? parsed.packageManager : null,
    scripts,
    dependencies,
    lockfiles: existingNpmLockfiles(target, path.dirname(relative))
  };
}

async function readComposerManifest(file, relative, target) {
  const text = await readFile(file, 'utf8');
  const parsed = safeJson(text);
  const dependencies = {
    production: countRecord(parsed?.require),
    development: countRecord(parsed?.['require-dev'])
  };
  return {
    ecosystem: 'composer',
    kind: 'manifest',
    path: relative,
    directory: normalizePortablePath(path.dirname(relative)),
    name: typeof parsed?.name === 'string' ? parsed.name : null,
    scripts: isRecord(parsed?.scripts) ? Object.keys(parsed.scripts).sort() : [],
    dependencies,
    lockfiles: existingLockfiles(target, path.dirname(relative), LOCKFILES.get('composer'))
  };
}

async function readGoModManifest(file, relative, target) {
  const text = await readFile(file, 'utf8');
  const moduleMatch = text.match(/^\s*module\s+([^\s]+)/m);
  const requireMatches = [...text.matchAll(/^\s*(?:require\s+)?([A-Za-z0-9_.\-\/]+)\s+v[0-9]/gm)];
  return {
    ecosystem: 'go',
    kind: 'manifest',
    path: relative,
    directory: normalizePortablePath(path.dirname(relative)),
    module: moduleMatch?.[1] ?? null,
    dependencies: { production: requireMatches.length },
    lockfiles: existingLockfiles(target, path.dirname(relative), LOCKFILES.get('go'))
  };
}

async function readSimpleManifest(file, relative, ecosystem, target) {
  const basename = path.basename(relative);
  const directory = normalizePortablePath(path.dirname(relative));
  return {
    ecosystem,
    kind: 'manifest',
    path: relative,
    directory,
    name: basename,
    dependencies: {},
    lockfiles: existingLockfiles(target, path.dirname(relative), LOCKFILES.get(ecosystem) ?? [])
  };
}

async function readDockerfile(file, relative) {
  const text = await readFile(file, 'utf8');
  const baseImages = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*FROM\s+([^\s]+)(?:\s+AS\s+([A-Za-z0-9_.-]+))?/i);
    if (match) baseImages.push({ image: match[1], stage: match[2] ?? null });
  }
  return {
    kind: 'dockerfile',
    path: relative,
    baseImages
  };
}

async function readComposeFile(file, relative) {
  const text = await readFile(file, 'utf8');
  const images = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*image:\s*["']?([^"'\s]+)["']?/);
    if (match) images.push(match[1]);
  }
  return {
    kind: 'compose',
    path: relative,
    images
  };
}

async function readGitHubWorkflow(file, relative) {
  const text = await readFile(file, 'utf8');
  const uses = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-\s*)?uses:\s*["']?([^"'\s]+)["']?/);
    if (match) uses.push(match[1]);
  }
  return {
    provider: 'github-actions',
    path: relative,
    uses: [...new Set(uses)].sort()
  };
}

function shouldInspectFile(file, target, playbookDir) {
  const relative = normalizePortablePath(path.relative(target, file));
  const parts = relative.split('/');
  if (parts.some((part) => EXCLUDED_PARTS.has(part))) return false;
  if (relative.startsWith(`${playbookDir}/runtime/`)) return false;
  if (relative.startsWith(`${playbookDir.replace(/^\./, '')}/runtime/`)) return false;
  const basename = path.basename(file);
  return (
    basename === 'package.json' ||
    basename === 'composer.json' ||
    basename === 'go.mod' ||
    basename === 'pom.xml' ||
    basename === 'build.gradle' ||
    basename === 'build.gradle.kts' ||
    basename === 'settings.gradle' ||
    basename === 'settings.gradle.kts' ||
    basename === 'gradle.lockfile' ||
    basename === 'packages.config' ||
    basename.endsWith('.csproj') ||
    basename === 'Dockerfile' ||
    basename.endsWith('.Dockerfile') ||
    isNpmLockfile(basename) ||
    isPythonManifest(basename) ||
    isPythonLockfile(basename) ||
    basename === 'composer.lock' ||
    basename === 'go.sum' ||
    basename === 'packages.lock.json' ||
    isComposeFile(relative) ||
    isGitHubWorkflow(relative)
  );
}

function summarizeInventory(scan) {
  return {
    ecosystems: scan.ecosystems.length,
    manifests: scan.manifests.length,
    lockfiles: scan.lockfiles.length,
    containers: scan.containers.length,
    ci: scan.ci.length,
    packageScripts: scan.manifests.reduce((total, manifest) => total + (manifest.scripts?.length ?? 0), 0),
    baseImages: scan.containers.reduce((total, item) => total + (item.baseImages?.length ?? item.images?.length ?? 0), 0),
    warnings: scan.warnings.length,
    conflicts: 0
  };
}

function summarizeEcosystems(scan) {
  const ecosystems = new Map();
  for (const manifest of scan.manifests) {
    const current = ecosystems.get(manifest.ecosystem) ?? { ecosystem: manifest.ecosystem, manifests: 0, lockfiles: 0 };
    current.manifests += 1;
    ecosystems.set(manifest.ecosystem, current);
  }
  for (const lockfile of scan.lockfiles) {
    const current = ecosystems.get(lockfile.ecosystem) ?? { ecosystem: lockfile.ecosystem, manifests: 0, lockfiles: 0 };
    current.lockfiles += 1;
    ecosystems.set(lockfile.ecosystem, current);
  }
  return [...ecosystems.values()].sort((left, right) => left.ecosystem.localeCompare(right.ecosystem));
}

function addMissingLockfileWarnings(scan) {
  for (const manifest of scan.manifests) {
    if (!['npm', 'composer', 'python', 'go', 'nuget'].includes(manifest.ecosystem)) continue;
    if ((manifest.lockfiles?.length ?? 0) > 0) continue;
    scan.warnings.push({
      id: 'dependency-inventory.lockfile-missing',
      message: `${manifest.ecosystem} manifest has no known lockfile: ${manifest.path}.`,
      paths: [manifest.path]
    });
  }
}

function existingNpmLockfiles(target, relativeDirectory) {
  const directLockfiles = existingLockfiles(target, relativeDirectory, LOCKFILES.get('npm'));
  if (directLockfiles.length > 0 || relativeDirectory === '.') return directLockfiles;
  if (!hasNpmWorkspaceMarker(target)) return directLockfiles;
  return existingLockfiles(target, '.', LOCKFILES.get('npm'));
}

function existingLockfiles(target, relativeDirectory, lockfileNames) {
  const directory = relativeDirectory === '.' ? '' : normalizePortablePath(relativeDirectory);
  const found = [];
  for (const lockfileName of lockfileNames ?? []) {
    const fullPath = path.join(target, ...directory.split('/').filter(Boolean), lockfileName);
    if (existsSync(fullPath)) found.push(normalizePortablePath(path.posix.join(directory, lockfileName)));
  }
  return found;
}

function hasNpmWorkspaceMarker(target) {
  if (existsSync(path.join(target, 'pnpm-workspace.yaml'))) return true;
  const packagePath = path.join(target, 'package.json');
  if (!existsSync(packagePath)) return false;
  const parsed = safeJson(readFileSync(packagePath, 'utf8'));
  return Array.isArray(parsed?.workspaces) || isRecord(parsed?.workspaces);
}

function lockfileEntry(ecosystem, relative) {
  return {
    ecosystem,
    kind: 'lockfile',
    path: relative,
    directory: normalizePortablePath(path.dirname(relative))
  };
}

function countPackageJsonDependencies(parsed) {
  if (!parsed) return {};
  return {
    production: countRecord(parsed.dependencies),
    development: countRecord(parsed.devDependencies),
    peer: countRecord(parsed.peerDependencies),
    optional: countRecord(parsed.optionalDependencies)
  };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function countRecord(value) {
  return isRecord(value) ? Object.keys(value).length : 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNpmLockfile(basename) {
  return ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'].includes(basename);
}

function isPythonManifest(basename) {
  return ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py'].includes(basename);
}

function isPythonLockfile(basename) {
  return ['poetry.lock', 'Pipfile.lock', 'requirements.lock'].includes(basename);
}

function isComposeFile(relative) {
  return /(^|\/)(docker-compose|compose)\.ya?ml$/i.test(relative);
}

function isGitHubWorkflow(relative) {
  return /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(relative);
}
