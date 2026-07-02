import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { assertDirectory, normalizePortablePath, SCHEMA_VERSION } from '../harness/core.mjs';

const DEFAULT_MAX_PROJECTS = 100;
const DEFAULT_MAX_DEPTH = 6;
const REPRESENTATIVE_LIMIT = 16;
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.venv',
  'venv',
  '__pycache__'
]);

export async function inventoryReferenceDirectory({ target, maxProjects = DEFAULT_MAX_PROJECTS, maxDepth = DEFAULT_MAX_DEPTH }) {
  await assertDirectory(target, 'Reference directory does not exist');
  const resolvedTarget = path.resolve(target);
  const entries = await readdir(resolvedTarget, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && !SKIP_DIRS.has(entry.name))
    .map((entry) => entry.name)
    .sort();
  const selected = directories.slice(0, maxProjects);
  const projects = [];

  for (const name of selected) {
    projects.push(await analyzeReferenceProject({
      root: path.join(resolvedTarget, name),
      id: name,
      maxDepth
    }));
  }

  const summary = summarizeProjects({ projects, totalProjects: directories.length });
  const warnings = [];
  if (directories.length > selected.length) {
    warnings.push({
      id: 'reference-inventory.project-limit',
      message: `Inventory truncated to ${selected.length} of ${directories.length} top-level project(s).`,
      paths: []
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    summary: {
      ...summary,
      warnings: warnings.length,
      conflicts: 0
    },
    projects,
    warnings,
    conflicts: []
  };
}

async function analyzeReferenceProject({ root, id, maxDepth }) {
  const state = {
    files: 0,
    directories: 0,
    skippedDirectories: 0,
    signals: emptySignals(),
    representativeFiles: []
  };
  await walkReferenceProject({ current: root, relative: '', depth: 0, maxDepth, state });
  return {
    id,
    path: id,
    files: state.files,
    directories: state.directories,
    skippedDirectories: state.skippedDirectories,
    signals: state.signals,
    candidateCapabilities: candidateCapabilities(state.signals),
    representativeFiles: state.representativeFiles
  };
}

async function walkReferenceProject({ current, relative, depth, maxDepth, state }) {
  const entries = await readdir(current, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const childPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        state.skippedDirectories += 1;
        continue;
      }
      state.directories += 1;
      if (depth + 1 > maxDepth) {
        state.skippedDirectories += 1;
        continue;
      }
      await walkReferenceProject({ current: childPath, relative: childRelative, depth: depth + 1, maxDepth, state });
    } else if (entry.isFile()) {
      state.files += 1;
      const portablePath = normalizePortablePath(childRelative);
      addSignals(state.signals, portablePath);
      if (state.representativeFiles.length < REPRESENTATIVE_LIMIT && isRepresentativeFile(portablePath)) {
        state.representativeFiles.push(portablePath);
      }
    }
  }
}

function summarizeProjects({ projects, totalProjects }) {
  const signalTotals = emptySignals();
  for (const project of projects) {
    for (const key of Object.keys(signalTotals)) {
      signalTotals[key] += project.signals[key] > 0 ? 1 : 0;
    }
  }
  return {
    projects: projects.length,
    totalProjects,
    files: projects.reduce((sum, project) => sum + project.files, 0),
    directories: projects.reduce((sum, project) => sum + project.directories, 0),
    skippedDirectories: projects.reduce((sum, project) => sum + project.skippedDirectories, 0),
    projectsWithSignals: signalTotals
  };
}

function emptySignals() {
  return {
    skills: 0,
    agents: 0,
    mcp: 0,
    commands: 0,
    hooks: 0,
    workflows: 0,
    memory: 0,
    indexes: 0,
    connectors: 0,
    security: 0,
    compliance: 0,
    docs: 0,
    tests: 0,
    packages: 0
  };
}

function addSignals(signals, relativePath) {
  const lower = relativePath.toLowerCase();
  const basename = path.posix.basename(lower);
  if (basename === 'skill.md' || lower.includes('/skills/')) signals.skills += 1;
  if (basename === 'agents.md' || lower.includes('/agents/') || lower.includes('/agent/')) signals.agents += 1;
  if (lower.includes('mcp') || lower.includes('modelcontextprotocol')) signals.mcp += 1;
  if (lower.includes('/commands/') || lower.includes('/command') || lower.endsWith('.toml')) signals.commands += 1;
  if (lower.includes('/hooks/') || lower.includes('/hook')) signals.hooks += 1;
  if (lower.includes('workflow') || lower.includes('/runbook') || lower.includes('/recipe')) signals.workflows += 1;
  if (lower.includes('memory') || lower.includes('knowledge') || lower.includes('canon')) signals.memory += 1;
  if (lower.includes('index') || lower.includes('graph') || lower.includes('cache') || lower.includes('lens')) signals.indexes += 1;
  if (lower.includes('connector') || lower.includes('adapter') || lower.includes('integration')) signals.connectors += 1;
  if (lower.includes('security') || lower.includes('cve') || lower.includes('trivy') || lower.includes('sast') || lower.includes('sca') || lower.includes('secret') || lower.includes('osv') || lower.includes('vex')) signals.security += 1;
  if (lower.includes('license') || lower.includes('sbom') || lower.includes('spdx') || lower.includes('notice') || lower.includes('third-party')) signals.compliance += 1;
  if (lower.endsWith('.md') || basename.startsWith('readme')) signals.docs += 1;
  if (lower.includes('/test') || lower.includes('/tests/') || lower.includes('__tests__') || lower.endsWith('.test.ts') || lower.endsWith('.test.mjs')) signals.tests += 1;
  if (['package.json', 'pyproject.toml', 'cargo.toml', 'pnpm-workspace.yaml', 'turbo.json'].includes(basename)) signals.packages += 1;
}

function isRepresentativeFile(relativePath) {
  const lower = relativePath.toLowerCase();
  const basename = path.posix.basename(lower);
  return Boolean(
    ['readme.md', 'agents.md', 'skill.md', 'package.json', 'pyproject.toml', 'cargo.toml', 'security.md'].includes(basename) ||
    lower.includes('write-gate') ||
    lower.includes('canon') ||
    lower.includes('mcp') ||
    lower.includes('graph') ||
    lower.includes('index') ||
    lower.includes('connector') ||
    lower.includes('workflow') ||
    lower.includes('runbook')
  );
}

function candidateCapabilities(signals) {
  const capabilities = [];
  if (signals.skills > 0) capabilities.push('skill-pack');
  if (signals.agents > 0 || signals.workflows > 0 || signals.commands > 0 || signals.hooks > 0) capabilities.push('agent-workflow');
  if (signals.mcp > 0) capabilities.push('mcp-integration');
  if (signals.indexes > 0 || signals.memory > 0) capabilities.push('runtime-index-canon');
  if (signals.connectors > 0) capabilities.push('connector-reference');
  if (signals.security > 0) capabilities.push('security-validation');
  if (signals.compliance > 0) capabilities.push('compliance-review');
  if (signals.tests > 0) capabilities.push('verification');
  if (signals.docs > 0) capabilities.push('documentation');
  return capabilities;
}
