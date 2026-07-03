import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from '../harness/core.mjs';

const DEFAULT_MAX_PROJECTS = 100;
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_QUEUE_RESULTS = 20;
const REPRESENTATIVE_LIMIT = 16;
const LEDGER_PATH = 'knowledge/reference-adoption-ledger.md';
const LEDGER_STATUSES = new Set(['new', 'reviewed', 'adopted', 'deferred', 'rejected']);
const LOCAL_ABSOLUTE_PATH_PATTERN = /(?:[A-Za-z]:[\\/][^\s|)`]+|\\\\[^\\/\s|)`]+[\\/][^\s|)`]+)/;
const INTERNAL_URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.|[^/\s|)`]+(?:\.internal|\.corp|\.local|\.lan))(?:[^\s|)`]*)?/i;
const SECRET_PATTERN = /(?:sk-[A-Za-z0-9_-]{12,}|xox[baprs]-[A-Za-z0-9-]{12,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
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

export async function buildReferenceAdoptionQueue({
  target,
  maxProjects = DEFAULT_MAX_PROJECTS,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxResults = DEFAULT_QUEUE_RESULTS
}) {
  const inventory = await inventoryReferenceDirectory({ target, maxProjects, maxDepth });
  const queue = inventory.projects
    .map((project) => referenceQueueItem(project))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.project.localeCompare(right.project);
    })
    .slice(0, maxResults);
  const recommendedCapabilities = {};
  const priorities = { high: 0, medium: 0, low: 0 };
  for (const item of queue) {
    priorities[item.priority] += 1;
    for (const capability of item.recommendedCapabilities) {
      recommendedCapabilities[capability] = (recommendedCapabilities[capability] ?? 0) + 1;
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: inventory.target,
    mode: { localOnly: true, network: false, writes: false },
    summary: {
      inventoryProjects: inventory.summary.projects,
      totalProjects: inventory.summary.totalProjects,
      queueItems: queue.length,
      priorities,
      recommendedCapabilities,
      warnings: inventory.warnings.length,
      conflicts: 0
    },
    queue,
    warnings: inventory.warnings,
    conflicts: []
  };
}

export async function checkReferenceAdoptionLedger({ target, filePath, strict = false }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const resolvedLedger = resolveLedgerPath({ target: resolvedTarget, filePath });
  const conflicts = [];
  const warnings = [];
  const statusCounts = {};
  const capabilityCounts = {};

  if (!resolvedLedger.ok) {
    conflicts.push({
      id: 'reference-ledger.path-invalid',
      message: 'Ledger path must stay inside the target repository.',
      paths: [resolvedLedger.relativePath]
    });
    return ledgerResult({ target: resolvedTarget, path: resolvedLedger.relativePath, statusCounts, capabilityCounts, warnings, conflicts });
  }

  if (!existsSync(resolvedLedger.path)) {
    conflicts.push({
      id: 'reference-ledger.missing',
      message: 'Reference adoption ledger is missing.',
      paths: [resolvedLedger.relativePath]
    });
    return ledgerResult({ target: resolvedTarget, path: resolvedLedger.relativePath, statusCounts, capabilityCounts, warnings, conflicts });
  }

  const text = await readFile(resolvedLedger.path, 'utf8');
  const lines = text.split(/\r?\n/);
  let fenced = false;
  let fencedLines = 0;
  let fencedChars = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      fenced = !fenced;
      if (!fenced) {
        if (fencedLines > 20 || fencedChars > 2000) {
          const finding = {
            id: 'reference-ledger.large-excerpt',
            message: 'Ledger contains a large fenced excerpt; summarize the pattern instead of carrying raw source text.',
            paths: [`${resolvedLedger.relativePath}:${lineNumber}`]
          };
          if (strict) conflicts.push(finding);
          else warnings.push(finding);
        }
        fencedLines = 0;
        fencedChars = 0;
      }
      continue;
    }

    if (fenced) {
      fencedLines += 1;
      fencedChars += line.length;
    }

    if (LOCAL_ABSOLUTE_PATH_PATTERN.test(line)) {
      conflicts.push({
        id: 'reference-ledger.local-absolute-path',
        message: 'Ledger contains a local absolute path.',
        paths: [`${resolvedLedger.relativePath}:${lineNumber}`]
      });
    }

    if (INTERNAL_URL_PATTERN.test(line)) {
      conflicts.push({
        id: 'reference-ledger.internal-url',
        message: 'Ledger contains an internal or local URL.',
        paths: [`${resolvedLedger.relativePath}:${lineNumber}`]
      });
    }

    if (SECRET_PATTERN.test(line)) {
      conflicts.push({
        id: 'reference-ledger.secret-like-token',
        message: 'Ledger contains a token-like secret pattern.',
        paths: [`${resolvedLedger.relativePath}:${lineNumber}`]
      });
    }

    if (line.length > 1200) {
      warnings.push({
        id: 'reference-ledger.long-line',
        message: 'Ledger contains a very long line; summarize instead of pasting a raw excerpt.',
        paths: [`${resolvedLedger.relativePath}:${lineNumber}`]
      });
    }

    const row = parseLedgerRow(line);
    if (!row) continue;
    const { status, capability } = row;
    if (!LEDGER_STATUSES.has(status)) {
      conflicts.push({
        id: 'reference-ledger.invalid-status',
        message: `Invalid reference ledger status: ${status}.`,
        paths: [`${resolvedLedger.relativePath}:${lineNumber}`]
      });
      continue;
    }
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    recordCapabilityStatus(capabilityCounts, capability, status);
  }

  return ledgerResult({ target: resolvedTarget, path: resolvedLedger.relativePath, statusCounts, capabilityCounts, warnings, conflicts });
}

function referenceQueueItem(project) {
  const weightedSignals = scoreSignals(project.signals);
  const score = weightedSignals.reduce((sum, item) => sum + item.score, 0);
  const recommendedCapabilities = recommendedReferenceCapabilities(project.signals);
  const actions = referenceAdoptionActions(project.signals);
  return {
    project: project.id,
    path: project.path,
    score,
    priority: priorityForScore(score),
    recommendedCapabilities,
    signalHighlights: weightedSignals
      .filter((item) => item.count > 0)
      .slice(0, 8),
    candidateCapabilities: project.candidateCapabilities,
    representativeFiles: project.representativeFiles,
    nextActions: actions
  };
}

function scoreSignals(signals) {
  const weights = {
    skills: 4,
    agents: 3,
    mcp: 4,
    commands: 2,
    hooks: 2,
    workflows: 3,
    memory: 3,
    indexes: 3,
    connectors: 3,
    security: 4,
    compliance: 4,
    docs: 1,
    tests: 3,
    packages: 1
  };
  return Object.entries(signals)
    .map(([signal, count]) => ({
      signal,
      count,
      score: Math.min(count, 10) * (weights[signal] ?? 1)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.signal.localeCompare(right.signal);
    });
}

function priorityForScore(score) {
  if (score >= 60) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

function recommendedReferenceCapabilities(signals) {
  const capabilities = [];
  if (signals.security > 0 || signals.compliance > 0) capabilities.push('security');
  if (signals.skills > 0 || signals.mcp > 0 || signals.agents > 0 || signals.hooks > 0 || signals.memory > 0 || signals.indexes > 0) capabilities.push('ai-harness');
  if (signals.workflows > 0 || signals.commands > 0 || signals.tests > 0) capabilities.push('delivery');
  if (signals.connectors > 0) capabilities.push('backend');
  if (signals.docs > 0) capabilities.push('foundation');
  if (capabilities.length === 0 && signals.packages > 0) capabilities.push('devops');
  return capabilities;
}

function referenceAdoptionActions(signals) {
  const actions = [];
  if (signals.skills > 0) actions.push('Review skill trigger shape and extract reusable references instead of copying long skill bodies.');
  if (signals.mcp > 0) actions.push('Classify MCP surfaces as resource, prompt, read tool, scaffold, managed-write, or project-write before adoption.');
  if (signals.agents > 0 || signals.workflows > 0 || signals.hooks > 0) actions.push('Extract worker contracts, stop conditions, and verification handoff patterns.');
  if (signals.memory > 0 || signals.indexes > 0) actions.push('Separate generated runtime evidence from durable memory promotion rules.');
  if (signals.security > 0 || signals.compliance > 0) actions.push('Convert security and compliance ideas into local validators or checklist references, not raw policy dumps.');
  if (signals.connectors > 0) actions.push('Capture connector credential, retry, idempotency, and manifest conventions as backend/data references.');
  if (signals.tests > 0) actions.push('Harvest test fixtures, invariant checks, and regression gates as validation patterns.');
  if (actions.length === 0) actions.push('Review manually before adoption; this reference has weak automatic capability signals.');
  return actions;
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

function resolveLedgerPath({ target, filePath }) {
  const ledgerPath = filePath
    ? path.resolve(target, filePath)
    : path.join(resolvePlaybookLayout(target).root, ...LEDGER_PATH.split('/'));
  const relative = path.relative(target, ledgerPath);
  const relativePath = normalizePortablePath(relative || LEDGER_PATH);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: ledgerPath, relativePath: normalizePortablePath(String(filePath ?? ledgerPath)) };
  }
  return { ok: true, path: ledgerPath, relativePath };
}

function parseLedgerRow(line) {
  const trimmed = line.trim();
  const separatorRow = /^\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed);
  if (!trimmed.startsWith('|') || separatorRow || /^\|\s*status\s*\|/i.test(trimmed)) return null;
  const cells = trimmed.split('|').slice(1, -1).map((cell) => cell.trim());
  if (cells.length < 2) return null;
  const status = cells[0].toLowerCase();
  if (!status) return null;
  return {
    status,
    capability: normalizeLedgerKey(cells[2], 'uncategorized')
  };
}

function recordCapabilityStatus(capabilityCounts, capability, status) {
  capabilityCounts[capability] ??= {
    entries: 0,
    statuses: {}
  };
  capabilityCounts[capability].entries += 1;
  capabilityCounts[capability].statuses[status] = (capabilityCounts[capability].statuses[status] ?? 0) + 1;
}

function normalizeLedgerKey(value, fallback) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9가-힣._/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function ledgerResult({ target, path: ledgerPath, statusCounts, capabilityCounts, warnings, conflicts }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    mode: { localOnly: true, network: false, writes: false },
    path: ledgerPath,
    summary: {
      entries: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      statuses: statusCounts,
      capabilities: capabilityCounts,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    warnings,
    conflicts
  };
}
