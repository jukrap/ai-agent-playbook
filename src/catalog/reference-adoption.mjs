import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertDirectory,
  isSafePortablePath,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from '../harness/core.mjs';

const DEFAULT_MAX_PROJECTS = 100;
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_QUEUE_RESULTS = 20;
const REPRESENTATIVE_LIMIT = 16;
const MATRIX_TOP_REFERENCE_LIMIT = 8;
const DEFAULT_PLAN_RESULTS = 5;
const REPRESENTATIVE_CATEGORY_ORDER = [
  'overview',
  'agent',
  'skill',
  'mcp',
  'workflow',
  'architecture',
  'frontend',
  'connector',
  'database',
  'devops',
  'mobile',
  'data',
  'design',
  'observability',
  'runtime',
  'memory',
  'security',
  'package',
  'other'
];
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
  maxResults = DEFAULT_QUEUE_RESULTS,
  ledgerPath
}) {
  const inventory = await inventoryReferenceDirectory({ target, maxProjects, maxDepth });
  const ledger = ledgerPath ? await loadReferenceLedgerIndex(ledgerPath) : null;
  const queue = inventory.projects
    .map((project) => referenceQueueItem(project, ledger))
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
  const ledgerStatuses = {};
  if (ledger) {
    for (const item of queue) {
      ledgerStatuses[item.ledgerStatus] = (ledgerStatuses[item.ledgerStatus] ?? 0) + 1;
    }
  }
  const warnings = [...inventory.warnings, ...(ledger?.warnings ?? [])];
  const conflicts = ledger?.conflicts ?? [];
  const summary = {
    inventoryProjects: inventory.summary.projects,
    totalProjects: inventory.summary.totalProjects,
    queueItems: queue.length,
    priorities,
    recommendedCapabilities,
    warnings: warnings.length,
    conflicts: conflicts.length
  };
  if (ledger) summary.ledgerStatuses = ledgerStatuses;

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: inventory.target,
    mode: { localOnly: true, network: false, writes: false },
    summary,
    queue,
    warnings,
    conflicts
  };
}

export async function buildReferenceCapabilityMatrix({
  target,
  maxProjects = DEFAULT_MAX_PROJECTS,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxResults = DEFAULT_MAX_PROJECTS,
  ledgerPath,
  capability
}) {
  const queue = await buildReferenceAdoptionQueue({
    target,
    maxProjects,
    maxDepth,
    maxResults,
    ledgerPath
  });
  const capabilityFilter = normalizeMatrixCapability(capability);
  const groups = new Map();

  for (const item of queue.queue) {
    const capabilityIds = matrixCapabilityIds(item);
    if (capabilityFilter && !capabilityIds.includes(capabilityFilter)) continue;
    for (const capabilityId of capabilityIds) {
      if (capabilityFilter && capabilityId !== capabilityFilter) continue;
      recordMatrixGroup(groups, capabilityId, item);
    }
  }

  const capabilities = Object.fromEntries([...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([capabilityId, group]) => [capabilityId, finalizeMatrixGroup(capabilityId, group)]));

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.capability-matrix',
    ok: queue.ok,
    target: queue.target,
    mode: { localOnly: true, network: false, writes: false },
    filter: {
      capability: capabilityFilter
    },
    summary: {
      inventoryProjects: queue.summary.inventoryProjects,
      totalProjects: queue.summary.totalProjects,
      queueItems: queue.summary.queueItems,
      capabilities: Object.keys(capabilities).length,
      warnings: queue.warnings.length,
      conflicts: queue.conflicts.length
    },
    capabilities,
    warnings: queue.warnings,
    conflicts: queue.conflicts
  };
}

export async function buildReferenceAdoptionPlan({
  target,
  capability,
  maxProjects = DEFAULT_MAX_PROJECTS,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxResults = DEFAULT_PLAN_RESULTS,
  ledgerPath
}) {
  const normalizedCapability = normalizeMatrixCapability(capability);
  const selectionLimit = planSelectionLimit(maxResults);
  const matrix = await buildReferenceCapabilityMatrix({
    target,
    maxProjects,
    maxDepth,
    maxResults: maxProjects,
    ledgerPath,
    capability: normalizedCapability
  });
  const warnings = [...matrix.warnings];
  const conflicts = [...matrix.conflicts];

  if (!normalizedCapability) {
    conflicts.push({
      id: 'reference-adoption-plan.capability-required',
      message: 'Reference adoption plan requires --capability <id>.',
      paths: []
    });
  }

  const group = normalizedCapability ? matrix.capabilities[normalizedCapability] : null;
  if (normalizedCapability && !group) {
    warnings.push({
      id: 'reference-adoption-plan.no-capability-matches',
      message: `No reference candidates matched capability: ${normalizedCapability}.`,
      paths: []
    });
  }

  const selected = (group?.topReferences ?? []).slice(0, selectionLimit);
  const references = [];
  for (const item of selected) {
    const inspected = await inspectReferenceProject({
      target: matrix.target,
      project: item.project,
      maxDepth
    });
    warnings.push(...inspected.warnings);
    conflicts.push(...inspected.conflicts);
    if (inspected.ok) {
      references.push(referenceAdoptionPlanReference({ item, inspected }));
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.adoption-plan',
    ok: conflicts.length === 0,
    target: matrix.target,
    mode: { localOnly: true, network: false, writes: false },
    filter: {
      capability: normalizedCapability
    },
    summary: {
      capability: normalizedCapability,
      matrixCapabilities: matrix.summary.capabilities,
      selectedReferences: references.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    matrix: {
      capability: group?.capability ?? normalizedCapability,
      projects: group?.projects ?? 0,
      priorities: group?.priorities ?? { high: 0, medium: 0, low: 0 },
      ledgerStatuses: group?.ledgerStatuses ?? {},
      recommendedMatches: group?.recommendedMatches ?? 0,
      candidateMatches: group?.candidateMatches ?? 0
    },
    plan: {
      capability: normalizedCapability,
      objective: adoptionPlanObjective(normalizedCapability),
      references,
      stopConditions: adoptionPlanStopConditions(normalizedCapability),
      verification: adoptionPlanVerification(normalizedCapability),
      followUps: adoptionPlanFollowUps(normalizedCapability)
    },
    warnings,
    conflicts
  };
}

export async function inspectReferenceProject({
  target,
  project,
  maxDepth = DEFAULT_MAX_DEPTH
}) {
  await assertDirectory(target, 'Reference directory does not exist');
  const resolvedTarget = path.resolve(target);
  const generatedAt = new Date().toISOString();
  const warnings = [];
  const conflicts = [];
  const resolvedProject = resolveReferenceProjectPath({ target: resolvedTarget, project });

  if (!project) {
    conflicts.push(referenceInspectFinding('reference-inspect.project-required', 'Reference inspect requires --project <name>.', []));
  } else if (!resolvedProject.ok) {
    conflicts.push(referenceInspectFinding('reference-inspect.project-path-invalid', 'Project must be one top-level portable reference directory name.', [normalizePortablePath(String(project))]));
  } else if (!await isDirectoryPath(resolvedProject.path)) {
    conflicts.push(referenceInspectFinding('reference-inspect.project-missing', 'Reference project directory does not exist.', [resolvedProject.relativePath]));
  }

  const analyzed = conflicts.length === 0
    ? await analyzeReferenceProject({
      root: resolvedProject.path,
      id: resolvedProject.relativePath,
      maxDepth
    })
    : null;
  const queueItem = analyzed ? referenceQueueItem(analyzed, null) : null;
  const review = queueItem ? referenceInspectReview(queueItem) : null;

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.inspect',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    generatedAt,
    project: resolvedProject.relativePath,
    summary: {
      files: analyzed?.files ?? 0,
      directories: analyzed?.directories ?? 0,
      skippedDirectories: analyzed?.skippedDirectories ?? 0,
      score: queueItem?.score ?? 0,
      priority: queueItem?.priority ?? null,
      representativeFiles: queueItem?.representativeFiles.length ?? 0,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    signals: analyzed?.signals ?? emptySignals(),
    signalHighlights: queueItem?.signalHighlights ?? [],
    recommendedCapabilities: queueItem?.recommendedCapabilities ?? [],
    candidateCapabilities: queueItem?.candidateCapabilities ?? [],
    representativeFiles: queueItem?.representativeFiles ?? [],
    review,
    warnings,
    conflicts
  };
}

export async function initReferenceAdoptionLedger({
  target,
  referenceDir,
  filePath,
  maxResults = DEFAULT_QUEUE_RESULTS,
  apply = false
}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const resolvedLedger = resolveLedgerPath({ target: resolvedTarget, filePath });
  const generatedAt = new Date().toISOString();
  const warnings = [];
  const conflicts = [];

  if (!resolvedLedger.ok) {
    conflicts.push({
      id: 'reference-ledger-init.path-invalid',
      message: 'Ledger path must stay inside the target repository.',
      paths: [resolvedLedger.relativePath]
    });
  }

  if (!existsSync(playbook.root)) {
    conflicts.push({
      id: 'reference-ledger-init.playbook-missing',
      message: `Missing ${playbook.dir}/. Bootstrap or migrate the playbook before initializing a reference ledger.`,
      paths: [`${playbook.dir}/`]
    });
  }

  if (!referenceDir) {
    conflicts.push({
      id: 'reference-ledger-init.reference-dir-required',
      message: 'Reference directory is required.',
      paths: []
    });
  }

  if (resolvedLedger.ok && existsSync(resolvedLedger.path)) {
    conflicts.push({
      id: 'reference-ledger-init.file-exists',
      message: 'Reference adoption ledger already exists; refusing to overwrite it.',
      paths: [resolvedLedger.relativePath]
    });
  }

  const queue = conflicts.length === 0
    ? await buildReferenceAdoptionQueue({
      target: referenceDir,
      maxResults
    })
    : null;
  if (queue) {
    warnings.push(...queue.warnings);
    conflicts.push(...queue.conflicts);
  }

  const items = queue?.queue ?? [];
  const content = renderReferenceAdoptionLedger({ items, generatedAt });
  const operations = resolvedLedger.ok && conflicts.length === 0
    ? [{
      id: 'reference-ledger-init.write-ledger',
      action: apply ? 'write' : 'preview',
      message: `${apply ? 'Write' : 'Preview'} reference adoption ledger with ${items.length} queued reference row(s).`,
      paths: [resolvedLedger.relativePath]
    }]
    : [];

  const result = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.adoption-ledger-init',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: Boolean(apply) },
    generatedAt,
    applied: false,
    path: resolvedLedger.relativePath,
    summary: {
      entries: items.length,
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    ledger: {
      path: resolvedLedger.relativePath,
      content
    },
    operations,
    warnings,
    conflicts
  };

  if (!result.ok || !apply) return result;

  await mkdir(path.dirname(resolvedLedger.path), { recursive: true });
  await writeFile(resolvedLedger.path, content);

  return {
    ...result,
    applied: true
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

function referenceQueueItem(project, ledger) {
  const weightedSignals = scoreSignals(project.signals);
  const score = weightedSignals.reduce((sum, item) => sum + item.score, 0);
  const recommendedCapabilities = recommendedReferenceCapabilities(project.signals);
  const actions = referenceAdoptionActions(project.signals);
  const item = {
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
  if (ledger) {
    const ledgerEntry = findLedgerEntryForProject(project.id, ledger);
    item.ledgerStatus = ledgerEntry?.status ?? 'new';
    item.ledgerReferenceId = ledgerEntry?.referenceId ?? null;
    item.ledgerCapability = ledgerEntry?.capability ?? null;
    item.ledgerDecisionDate = ledgerEntry?.decisionDate ?? null;
  }
  return item;
}

function normalizeMatrixCapability(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized || null;
}

function matrixCapabilityIds(item) {
  return [...new Set([
    ...item.recommendedCapabilities,
    ...item.candidateCapabilities
  ].map(normalizeMatrixCapability).filter(Boolean))];
}

function recordMatrixGroup(groups, capabilityId, item) {
  if (!groups.has(capabilityId)) {
    groups.set(capabilityId, {
      projects: 0,
      priorities: { high: 0, medium: 0, low: 0 },
      ledgerStatuses: {},
      recommendedMatches: 0,
      candidateMatches: 0,
      topReferences: []
    });
  }
  const group = groups.get(capabilityId);
  group.projects += 1;
  group.priorities[item.priority] = (group.priorities[item.priority] ?? 0) + 1;
  if (item.ledgerStatus) {
    group.ledgerStatuses[item.ledgerStatus] = (group.ledgerStatuses[item.ledgerStatus] ?? 0) + 1;
  }
  if (item.recommendedCapabilities.includes(capabilityId)) group.recommendedMatches += 1;
  if (item.candidateCapabilities.includes(capabilityId)) group.candidateMatches += 1;
  group.topReferences.push(matrixReferenceSummary(item));
}

function matrixReferenceSummary(item) {
  const summary = {
    project: item.project,
    path: item.path,
    score: item.score,
    priority: item.priority,
    recommendedCapabilities: item.recommendedCapabilities,
    candidateCapabilities: item.candidateCapabilities,
    signalHighlights: item.signalHighlights.slice(0, 5),
    representativeFiles: item.representativeFiles.slice(0, 5),
    nextActions: item.nextActions.slice(0, 3)
  };
  if (item.ledgerStatus) {
    summary.ledgerStatus = item.ledgerStatus;
    summary.ledgerReferenceId = item.ledgerReferenceId;
    summary.ledgerCapability = item.ledgerCapability;
    summary.ledgerDecisionDate = item.ledgerDecisionDate;
  }
  return summary;
}

function finalizeMatrixGroup(capabilityId, group) {
  return {
    capability: capabilityId,
    projects: group.projects,
    priorities: group.priorities,
    ledgerStatuses: group.ledgerStatuses,
    recommendedMatches: group.recommendedMatches,
    candidateMatches: group.candidateMatches,
    topReferences: group.topReferences
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.project.localeCompare(right.project);
      })
      .slice(0, MATRIX_TOP_REFERENCE_LIMIT)
  };
}

function planSelectionLimit(value) {
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_PLAN_RESULTS;
  return Math.min(value, MATRIX_TOP_REFERENCE_LIMIT);
}

function referenceAdoptionPlanReference({ item, inspected }) {
  const ledger = item.ledgerStatus
    ? {
        status: item.ledgerStatus,
        referenceId: item.ledgerReferenceId,
        capability: item.ledgerCapability,
        decisionDate: item.ledgerDecisionDate
      }
    : null;

  return {
    project: item.project,
    path: item.path,
    score: item.score,
    priority: item.priority,
    ledger,
    recommendedCapabilities: item.recommendedCapabilities,
    candidateCapabilities: item.candidateCapabilities,
    usefulSignals: item.signalHighlights,
    readOrder: inspected.review.readOrder.slice(0, 10),
    adoptionQuestions: inspected.review.adoptionQuestions,
    suggestedSurfaces: suggestedAdoptionSurfaces({ item, inspected }),
    riskFlags: adoptionPlanRiskFlags({ item, inspected }),
    nextActions: item.nextActions
  };
}

function suggestedAdoptionSurfaces({ item, inspected }) {
  const ids = new Set([...item.recommendedCapabilities, ...item.candidateCapabilities]);
  const signals = inspected.signals;
  const surfaces = [];
  const add = (surface, reason) => {
    if (!surfaces.some((item) => item.surface === surface)) {
      surfaces.push({ surface, reason });
    }
  };

  if (ids.has('ai-harness') || ids.has('skill-pack')) {
    add('skill-reference', 'Extract reusable triggers, stop conditions, or reference notes instead of copying long skill bodies.');
  }
  if (ids.has('mcp-integration') || signals.mcp > 0) {
    add('mcp-permission-tier', 'Classify resource, prompt, read tool, scaffold, managed-write, and project-write boundaries before adoption.');
  }
  if (ids.has('agent-workflow') || ids.has('delivery') || signals.workflows > 0 || signals.commands > 0) {
    add('workflow-recipe', 'Capture worker contract, recipe, runbook, command, and handoff patterns with explicit stop conditions.');
  }
  if (ids.has('architecture') || ids.has('architecture-boundary') || signals.architecture > 0) {
    add('architecture-reference', 'Capture boundary, ownership, package, domain, and decision-record patterns without forcing a new architecture.');
  }
  if (ids.has('frontend') || ids.has('frontend-quality') || ids.has('design-system') || signals.frontend > 0 || signals.design > 0) {
    add('frontend-quality-reference', 'Extract rendered UI, accessibility, design-token, state/data, and visual regression checks as frontend guidance.');
  }
  if (ids.has('backend') || ids.has('backend-change') || signals.backend > 0) {
    add('backend-contract-reference', 'Document API, service, worker, route, middleware, and integration contract boundaries before adoption.');
  }
  if (ids.has('database') || ids.has('database-change') || signals.database > 0) {
    add('database-change-reference', 'Capture migration order, rollback, query performance, and data-integrity checks as database guidance.');
  }
  if (ids.has('devops') || ids.has('devops-release') || ids.has('observability-triage') || signals.devops > 0 || signals.observability > 0) {
    add('devops-runbook', 'Turn CI/CD, container, deployment, package release, and observability patterns into explicit runbooks and gates.');
  }
  if (ids.has('mobile') || ids.has('mobile-release') || signals.mobile > 0) {
    add('mobile-qa-reference', 'Extract release, permission, offline sync, signing, and device QA checks without stack-first routing.');
  }
  if (ids.has('data') || ids.has('data-pipeline') || signals.data > 0) {
    add('data-quality-reference', 'Capture pipeline, lineage, metric, dashboard, migration, and data-quality checks as data guidance.');
  }
  if (ids.has('runtime-index-canon') || signals.indexes > 0 || signals.memory > 0) {
    add('runtime-memory-boundary', 'Separate generated runtime evidence from reviewed memory or canon promotion rules.');
  }
  if (ids.has('security') || ids.has('security-validation') || signals.security > 0) {
    add('security-validator', 'Convert reusable security ideas into local checks, review prompts, or bounded checklist references.');
  }
  if (ids.has('compliance-review') || signals.compliance > 0) {
    add('compliance-reference', 'Preserve license, SBOM, notice, or policy evidence as summarized validation guidance.');
  }
  if (ids.has('connector-reference') || ids.has('backend') || signals.connectors > 0) {
    add('connector-contract', 'Document credential boundary, registration, retry, idempotency, and adapter contracts before implementation.');
  }
  if (ids.has('verification') || signals.tests > 0) {
    add('verification-gate', 'Harvest fixtures, regression checks, and required command gates as local verification patterns.');
  }
  if (ids.has('foundation') || ids.has('documentation') || signals.docs > 0) {
    add('docs-or-template', 'Turn stable conventions into concise docs, templates, or project playbook references.');
  }
  if (surfaces.length === 0) {
    add('manual-review', 'Automatic signals are weak; inspect the representative files before choosing a local surface.');
  }
  return surfaces;
}

function adoptionPlanRiskFlags({ item, inspected }) {
  const flags = [];
  if (['rejected', 'deferred'].includes(item.ledgerStatus)) {
    flags.push({
      id: 'ledger-decision',
      message: `Ledger status is ${item.ledgerStatus}; do not re-adopt without a new decision.`
    });
  }
  if (inspected.signals.security > 0 || inspected.signals.compliance > 0) {
    flags.push({
      id: 'security-compliance-surface',
      message: 'Security or compliance signals are present; summarize rules and validate local-only hygiene before adoption.'
    });
  }
  if (inspected.summary.files > 1000) {
    flags.push({
      id: 'large-reference',
      message: 'Reference project is large; keep the scan bounded and cite representative files only.'
    });
  }
  if (item.signalHighlights.some((signal) => signal.count >= 100)) {
    flags.push({
      id: 'high-signal-volume',
      message: 'One or more signal families are very broad; avoid treating count volume as quality.'
    });
  }
  return flags;
}

function adoptionPlanObjective(capability) {
  if (capability === 'ai-harness') return 'Identify reusable harness mechanics, skill packaging patterns, MCP surfaces, memory boundaries, and operator workflows.';
  if (capability === 'runtime-index-canon') return 'Extract runtime index, evidence, cache, graph, and canon promotion patterns while keeping generated output separate from trusted memory.';
  if (capability === 'mcp-integration') return 'Compare MCP resources, prompts, tools, schemas, and permission tiers before adding or changing local MCP surfaces.';
  if (capability === 'agent-workflow') return 'Extract agent orchestration, worker contracts, runbooks, handoffs, and stop conditions into reusable local workflows.';
  if (capability === 'verification') return 'Collect repeatable test, fixture, eval, validator, and CI gate ideas without importing noisy reference implementations.';
  if (capability === 'security') return 'Turn security and compliance reference signals into local review gates, validators, and safe documentation.';
  if (capability === 'architecture') return 'Identify boundary, ownership, domain modeling, monorepo, and decision-record patterns without forcing architecture changes.';
  if (capability === 'frontend') return 'Extract UI quality, accessibility, state/data flow, design-system, and visual regression practices from reference projects.';
  if (capability === 'backend') return 'Review API, service, worker, route, connector, and integration contracts before adopting backend patterns.';
  if (capability === 'database') return 'Capture migration, schema, query performance, rollback, and integrity checks as database change guidance.';
  if (capability === 'devops') return 'Review CI/CD, container, package, deployment, release, configuration, and observability patterns for reusable runbooks and gates.';
  if (capability === 'mobile') return 'Extract mobile release, permission, signing, offline sync, WebView, and device QA guidance without stack-first routing.';
  if (capability === 'data') return 'Capture pipeline, ETL, lineage, metric, dashboard, retrieval, and data-quality patterns as data guidance.';
  return `Review top local reference candidates for the ${capability ?? 'selected'} capability and decide which patterns deserve local adoption.`;
}

function adoptionPlanStopConditions(capability) {
  const stops = [
    'Reference usefulness cannot be explained without copying raw source content or large excerpts.',
    'A selected reference is already rejected or deferred in the ledger and no new decision exists.',
    'The proposed local surface lacks an owner category: skill, reference, recipe, runtime CLI, MCP resource, MCP prompt, MCP tool, adapter, plugin, docs, or no change.',
    'Write behavior would lack dry-run output, target path validation, permission tier, or audit trail.',
    'Generated runtime evidence would be promoted into memory or public docs without review.'
  ];
  if (capability === 'security' || capability === 'mcp-integration' || capability === 'backend') {
    stops.push('Credential boundary, private URL handling, or permission scope is unclear.');
  }
  if (capability === 'runtime-index-canon') {
    stops.push('Runtime artifact freshness, scan range, or source locator cannot be reopened.');
  }
  if (capability === 'database' || capability === 'data') {
    stops.push('Rollback, reconciliation, freshness, or consumer-impact evidence is missing.');
  }
  if (capability === 'devops' || capability === 'mobile') {
    stops.push('Release, rollback, environment, signing, or deployment target evidence is unclear.');
  }
  if (capability === 'frontend') {
    stops.push('Rendered states, accessibility, responsive layout, or visual evidence cannot be verified.');
  }
  return stops;
}

function adoptionPlanVerification(capability) {
  const verification = [
    'Run reference ledger-check for existing adoption decisions before writing follow-up changes.',
    'Run reference source-registry-check when source registry entries are part of the follow-up.',
    'Run catalog check when skills, wrappers, workflows, prompts, or MCP surfaces change.',
    'Run public-doc hygiene and translation validation when docs or templates change.',
    'Run npm run check and npm test for CLI/MCP/runtime behavior changes.'
  ];
  if (capability === 'runtime-index-canon') {
    verification.push('Run runtime schema-check for any new runtime artifact shape.');
  }
  if (capability === 'security') {
    verification.push('Run public documentation hygiene checks before publishing any security/compliance reference.');
  }
  if (capability === 'database' || capability === 'data') {
    verification.push('Run representative migration, query, reconciliation, or data-quality checks before adopting data guidance.');
  }
  if (capability === 'devops') {
    verification.push('Run the relevant CI/package/container/deployment dry-run or static validation command when the project defines one.');
  }
  if (capability === 'frontend') {
    verification.push('Verify rendered UI states, accessibility, responsive layout, and visual diff evidence when adopting frontend guidance.');
  }
  if (capability === 'mobile') {
    verification.push('Verify release-build, permission, signing/profile, and device or simulator evidence when adopting mobile guidance.');
  }
  return verification;
}

function adoptionPlanFollowUps(capability) {
  const followUps = [
    'Record accepted, deferred, rejected, or adopted decisions in the reference adoption ledger.',
    'Register durable source metadata in knowledge/sources.json only after review.',
    'Keep generated analysis under runtime until a separate canon or docs promotion is reviewed.'
  ];
  if (capability === 'mcp-integration') {
    followUps.push('Review the MCP permission model before exposing any new write-capable tool.');
  }
  if (capability === 'agent-workflow') {
    followUps.push('Convert reusable orchestration patterns into workflow recipes or handoff references, not default always-on context.');
  }
  if (capability === 'devops' || capability === 'mobile') {
    followUps.push('Keep live deploy, publish, signing, and store submission actions opt-in and outside default read-only workflows.');
  }
  if (capability === 'database' || capability === 'data') {
    followUps.push('Promote only reviewed schema, lineage, metric, or reconciliation facts into durable memory.');
  }
  return followUps;
}

function scoreSignals(signals) {
  const weights = {
    skills: 4,
    agents: 3,
    mcp: 4,
    commands: 2,
    hooks: 2,
    workflows: 3,
    architecture: 3,
    frontend: 3,
    backend: 3,
    database: 4,
    devops: 4,
    mobile: 4,
    data: 4,
    design: 3,
    observability: 3,
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
  if (signals.architecture > 0) capabilities.push('architecture');
  if (signals.frontend > 0 || signals.design > 0) capabilities.push('frontend');
  if (signals.backend > 0 || signals.connectors > 0) capabilities.push('backend');
  if (signals.database > 0) capabilities.push('database');
  if (signals.devops > 0 || signals.observability > 0 || (signals.packages > 0 && (signals.workflows > 0 || signals.tests > 0))) capabilities.push('devops');
  if (signals.mobile > 0) capabilities.push('mobile');
  if (signals.data > 0) capabilities.push('data');
  if (signals.skills > 0 || signals.mcp > 0 || signals.agents > 0 || signals.hooks > 0 || signals.memory > 0 || signals.indexes > 0) capabilities.push('ai-harness');
  if (signals.workflows > 0 || signals.commands > 0 || signals.tests > 0) capabilities.push('delivery');
  if (signals.docs > 0) capabilities.push('foundation');
  if (capabilities.length === 0 && signals.packages > 0) capabilities.push('devops');
  return capabilities;
}

function referenceAdoptionActions(signals) {
  const actions = [];
  if (signals.skills > 0) actions.push('Review skill trigger shape and extract reusable references instead of copying long skill bodies.');
  if (signals.mcp > 0) actions.push('Classify MCP surfaces as resource, prompt, read tool, scaffold, managed-write, or project-write before adoption.');
  if (signals.agents > 0 || signals.workflows > 0 || signals.hooks > 0) actions.push('Extract worker contracts, stop conditions, and verification handoff patterns.');
  if (signals.architecture > 0) actions.push('Extract architecture boundary, package ownership, and decision-record patterns before recommending restructuring.');
  if (signals.frontend > 0 || signals.design > 0) actions.push('Capture rendered UI, accessibility, design-system, and visual regression patterns as frontend references.');
  if (signals.backend > 0) actions.push('Review API, worker, service, route, and middleware contracts before adopting backend patterns.');
  if (signals.database > 0) actions.push('Capture migration, schema, query, and data-integrity checks as database change references.');
  if (signals.devops > 0 || signals.observability > 0) actions.push('Harvest CI/CD, container, release, deployment, and observability gates as DevOps runbook patterns.');
  if (signals.mobile > 0) actions.push('Extract mobile release, permission, offline sync, and device QA patterns without creating stack-first skills.');
  if (signals.data > 0) actions.push('Capture pipeline, lineage, dashboard, metric, and data-quality checks as data references.');
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
    representativeFileCandidates: []
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
    representativeFiles: selectRepresentativeFiles(state.representativeFileCandidates)
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
      if (isRepresentativeFile(portablePath)) {
        state.representativeFileCandidates.push(portablePath);
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
    architecture: 0,
    frontend: 0,
    backend: 0,
    database: 0,
    devops: 0,
    mobile: 0,
    data: 0,
    design: 0,
    observability: 0,
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
  if (isArchitecturePath(lower)) signals.architecture += 1;
  if (isFrontendPath(lower)) signals.frontend += 1;
  if (isBackendPath(lower)) signals.backend += 1;
  if (isDatabasePath(lower)) signals.database += 1;
  if (isDevopsPath(lower, basename)) signals.devops += 1;
  if (isMobilePath(lower)) signals.mobile += 1;
  if (isDataPath(lower)) signals.data += 1;
  if (isDesignPath(lower)) signals.design += 1;
  if (isObservabilityPath(lower)) signals.observability += 1;
  if (lower.includes('memory') || lower.includes('knowledge') || lower.includes('canon')) signals.memory += 1;
  if (lower.includes('index') || lower.includes('graph') || lower.includes('cache') || lower.includes('lens')) signals.indexes += 1;
  if (lower.includes('connector') || lower.includes('adapter') || lower.includes('integration')) signals.connectors += 1;
  if (lower.includes('security') || lower.includes('cve') || lower.includes('trivy') || lower.includes('sast') || lower.includes('sca') || lower.includes('secret') || lower.includes('osv') || lower.includes('vex')) signals.security += 1;
  if (lower.includes('license') || lower.includes('sbom') || lower.includes('spdx') || lower.includes('notice') || lower.includes('third-party')) signals.compliance += 1;
  if (lower.endsWith('.md') || basename.startsWith('readme')) signals.docs += 1;
  if (lower.includes('/test') || lower.includes('/tests/') || lower.includes('__tests__') || lower.endsWith('.test.ts') || lower.endsWith('.test.mjs')) signals.tests += 1;
  if (['package.json', 'pyproject.toml', 'cargo.toml', 'pnpm-workspace.yaml', 'turbo.json'].includes(basename)) signals.packages += 1;
}

function isArchitecturePath(lower) {
  return includesAny(lower, [
    'architecture',
    '/adr',
    '/domain/',
    '/bounded-context',
    '/monorepo',
    '/workspace',
    '/boundary',
    'turborepo',
    'nx.json'
  ]);
}

function isFrontendPath(lower) {
  return includesAny(lower, [
    '/components/',
    '/pages/',
    '/views/',
    '/frontend/',
    '/client/',
    'vite.config',
    'storybook',
    'tailwind'
  ]) || lower.endsWith('.tsx') || lower.endsWith('.jsx') || lower.endsWith('.vue');
}

function isBackendPath(lower) {
  return includesAny(lower, [
    '/api/',
    '/server/',
    '/controller',
    '/service',
    '/worker',
    '/queue',
    '/routes/',
    '/middleware/'
  ]);
}

function isDatabasePath(lower) {
  return includesAny(lower, [
    '/db/',
    '/database',
    '/migration',
    '/migrations/',
    '/schema',
    '/sql/',
    'prisma',
    'drizzle',
    'typeorm',
    'sequelize',
    'flyway',
    'liquibase'
  ]) || lower.endsWith('.sql');
}

function isDevopsPath(lower, basename) {
  return ['jenkinsfile', 'dockerfile'].includes(basename) || includesAny(lower, [
    '.github/workflows/',
    '.gitlab-ci',
    'docker-compose',
    '/k8s/',
    '/kubernetes/',
    '/helm/',
    '/terraform/',
    '/deploy',
    '/release',
    '/ci/',
    'actionlint',
    '.devcontainer/'
  ]);
}

function isMobilePath(lower) {
  return includesAny(lower, [
    '/android/',
    '/ios/',
    'react-native',
    '/expo',
    'xcodeproj',
    'fastlane',
    'podfile',
    '/mobile/'
  ]);
}

function isDataPath(lower) {
  return includesAny(lower, [
    'etl',
    'pipeline',
    'pipelines/',
    'warehouse',
    'analytics',
    'metrics',
    'dashboard',
    'dashboards/',
    '/dbt/',
    'bigquery',
    'snowflake',
    'airflow',
    'spark',
    'notebook',
    'jupyter'
  ]) || lower.endsWith('.parquet');
}

function isDesignPath(lower) {
  return includesAny(lower, [
    '/design',
    'figma',
    '/tokens/',
    '/themes/',
    'typography',
    '/visual',
    '/screenshots/',
    'wireframe'
  ]);
}

function isObservabilityPath(lower) {
  return includesAny(lower, [
    'observability',
    'monitoring',
    'metrics',
    'tracing',
    'logging',
    'opentelemetry',
    '/otel',
    'sentry',
    'prometheus',
    'grafana',
    '/alerts/'
  ]);
}

function isBroadCapabilityPath(lower, basename) {
  return isArchitecturePath(lower)
    || isFrontendPath(lower)
    || isBackendPath(lower)
    || isDatabasePath(lower)
    || isDevopsPath(lower, basename)
    || isMobilePath(lower)
    || isDataPath(lower)
    || isDesignPath(lower)
    || isObservabilityPath(lower);
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
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
    lower.includes('runbook') ||
    isBroadCapabilityPath(lower, basename)
  );
}

function selectRepresentativeFiles(candidates, limit = REPRESENTATIVE_LIMIT) {
  const buckets = new Map(REPRESENTATIVE_CATEGORY_ORDER.map((category) => [category, []]));
  for (const candidate of candidates) {
    const category = representativeFileCategory(candidate);
    buckets.get(category)?.push(candidate);
  }

  const selected = [];
  const seen = new Set();
  while (selected.length < limit) {
    let added = false;
    for (const category of REPRESENTATIVE_CATEGORY_ORDER) {
      const bucket = buckets.get(category);
      while (bucket?.length) {
        const candidate = bucket.shift();
        if (seen.has(candidate)) continue;
        selected.push(candidate);
        seen.add(candidate);
        added = true;
        break;
      }
      if (selected.length >= limit) break;
    }
    if (!added) break;
  }
  return selected;
}

function candidateCapabilities(signals) {
  const capabilities = [];
  if (signals.skills > 0) capabilities.push('skill-pack');
  if (signals.agents > 0 || signals.workflows > 0 || signals.commands > 0 || signals.hooks > 0) capabilities.push('agent-workflow');
  if (signals.mcp > 0) capabilities.push('mcp-integration');
  if (signals.architecture > 0) capabilities.push('architecture-boundary');
  if (signals.frontend > 0) capabilities.push('frontend-quality');
  if (signals.design > 0) capabilities.push('design-system');
  if (signals.backend > 0) capabilities.push('backend-change');
  if (signals.database > 0) capabilities.push('database-change');
  if (signals.devops > 0) capabilities.push('devops-release');
  if (signals.observability > 0) capabilities.push('observability-triage');
  if (signals.mobile > 0) capabilities.push('mobile-release');
  if (signals.data > 0) capabilities.push('data-pipeline');
  if (signals.indexes > 0 || signals.memory > 0) capabilities.push('runtime-index-canon');
  if (signals.connectors > 0) capabilities.push('connector-reference');
  if (signals.security > 0) capabilities.push('security-validation');
  if (signals.compliance > 0) capabilities.push('compliance-review');
  if (signals.tests > 0) capabilities.push('verification');
  if (signals.docs > 0) capabilities.push('documentation');
  return capabilities;
}

function referenceInspectReview(item) {
  return {
    readOrder: item.representativeFiles.slice(0, 10).map((filePath) => ({
      path: filePath,
      reason: representativeFileReason(filePath)
    })),
    adoptionQuestions: referenceInspectQuestions(item),
    nextActions: item.nextActions
  };
}

function referenceInspectQuestions(item) {
  const questions = [
    'Which behavior is reusable as a local skill, workflow, MCP surface, validator, or reference note?',
    'What evidence proves the pattern works without copying upstream prose or raw source content?',
    'Which local permission tier should own this pattern: read, scaffold, managed-write, or project-write?'
  ];
  if (item.recommendedCapabilities.includes('security')) {
    questions.push('Does the reference imply a security rule, dependency check, secret boundary, or compliance artifact that should be validated locally?');
  }
  if (item.recommendedCapabilities.includes('backend') || item.candidateCapabilities.includes('connector-reference')) {
    questions.push('What credential, retry, idempotency, or adapter contract needs to be documented before adoption?');
  }
  if (item.recommendedCapabilities.includes('frontend')) {
    questions.push('Which rendered states, accessibility checks, responsive breakpoints, or visual regression gates are reusable locally?');
  }
  if (item.recommendedCapabilities.includes('database')) {
    questions.push('Which migration order, rollback evidence, query check, or data-integrity invariant should become local guidance?');
  }
  if (item.recommendedCapabilities.includes('devops')) {
    questions.push('Which CI/CD, container, package, release, or observability gate should become a reusable runbook or validation check?');
  }
  if (item.recommendedCapabilities.includes('mobile')) {
    questions.push('Which release, permission, signing, offline sync, or device QA evidence should be required before adoption?');
  }
  if (item.recommendedCapabilities.includes('data')) {
    questions.push('Which lineage, freshness, metric, dashboard, ingestion, or data-quality contract should be preserved?');
  }
  if (item.recommendedCapabilities.includes('delivery')) {
    questions.push('Which test, CI gate, handoff, or workflow stop condition should become reusable verification guidance?');
  }
  return questions;
}

function representativeFileReason(filePath) {
  const category = representativeFileCategory(filePath);
  if (category === 'overview') return 'Project overview and setup shape.';
  if (category === 'agent') return 'Agent instruction and repository policy surface.';
  if (category === 'skill') return 'Skill trigger, workflow, or reference packaging pattern.';
  if (category === 'package') return 'Runtime, command, dependency, or package boundary signal.';
  if (category === 'security') return 'Security, secret, or compliance review signal.';
  if (category === 'mcp') return 'MCP resource, prompt, tool, or permission model signal.';
  if (category === 'workflow') return 'Workflow, runbook, stop condition, or handoff pattern.';
  if (category === 'architecture') return 'Architecture boundary, ownership, package, or decision-record signal.';
  if (category === 'frontend') return 'Frontend UI, state, accessibility, or visual QA signal.';
  if (category === 'connector') return 'Connector, adapter, credential, or integration contract signal.';
  if (category === 'database') return 'Database schema, migration, SQL, query, or data-integrity signal.';
  if (category === 'devops') return 'CI/CD, container, package, deployment, or release signal.';
  if (category === 'mobile') return 'Mobile release, permission, signing, offline sync, or device QA signal.';
  if (category === 'data') return 'Data pipeline, lineage, metric, dashboard, retrieval, or quality signal.';
  if (category === 'design') return 'Design-system, asset, token, screenshot, or visual reference signal.';
  if (category === 'observability') return 'Monitoring, logging, metrics, trace, alert, or incident signal.';
  if (category === 'runtime') return 'Runtime index, cache, graph, or generated evidence signal.';
  if (category === 'memory') return 'Memory, canon, source registry, or promotion boundary signal.';
  return 'Representative file selected by local reference signal scan.';
}

function representativeFileCategory(filePath) {
  const lower = filePath.toLowerCase();
  const basename = path.posix.basename(lower);
  if (basename === 'readme.md') return 'overview';
  if (basename === 'agents.md') return 'agent';
  if (basename === 'skill.md' || lower.includes('/skills/')) return 'skill';
  if (lower.includes('mcp') || lower.includes('modelcontextprotocol')) return 'mcp';
  if (lower.includes('workflow') || lower.includes('/runbook') || lower.includes('/recipe') || lower.includes('/.github/workflows/')) return 'workflow';
  if (isArchitecturePath(lower)) return 'architecture';
  if (isFrontendPath(lower)) return 'frontend';
  if (lower.includes('connector') || lower.includes('adapter') || lower.includes('integration')) return 'connector';
  if (isDatabasePath(lower)) return 'database';
  if (isDevopsPath(lower, basename)) return 'devops';
  if (isMobilePath(lower)) return 'mobile';
  if (isDataPath(lower)) return 'data';
  if (isDesignPath(lower)) return 'design';
  if (isObservabilityPath(lower)) return 'observability';
  if (lower.includes('graph') || lower.includes('index') || lower.includes('cache') || lower.includes('lens')) return 'runtime';
  if (lower.includes('canon') || lower.includes('memory') || lower.includes('knowledge')) return 'memory';
  if (basename === 'security.md' || lower.includes('security')) return 'security';
  if (basename === 'package.json' || basename === 'pyproject.toml' || basename === 'cargo.toml') return 'package';
  return 'other';
}

function resolveReferenceProjectPath({ target, project }) {
  const normalized = normalizePortablePath(project ?? '');
  if (!normalized || normalized.includes('/') || !isSafePortablePath(normalized)) {
    return {
      ok: false,
      path: path.resolve(target, normalized || '.'),
      relativePath: normalized
    };
  }
  const resolvedPath = path.resolve(target, normalized);
  const relative = path.relative(target, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, path: resolvedPath, relativePath: normalized };
  }
  return { ok: true, path: resolvedPath, relativePath: normalized };
}

function referenceInspectFinding(id, message, paths) {
  return { id, message, paths };
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

async function loadReferenceLedgerIndex(filePath) {
  const resolvedPath = path.resolve(filePath);
  const displayPath = normalizePortablePath(filePath);
  const warnings = [];
  const conflicts = [];
  const entries = new Map();

  if (!existsSync(resolvedPath)) {
    conflicts.push({
      id: 'reference-queue.ledger-missing',
      message: 'Reference adoption ledger does not exist.',
      paths: [displayPath]
    });
    return { entries, warnings, conflicts };
  }

  const text = await readFile(resolvedPath, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const row = parseLedgerRow(lines[index]);
    if (!row) continue;
    if (!LEDGER_STATUSES.has(row.status)) {
      warnings.push({
        id: 'reference-queue.ledger-invalid-status',
        message: `Ignoring ledger row with invalid status: ${row.status}.`,
        paths: [`${displayPath}:${index + 1}`]
      });
      continue;
    }
    const keys = ledgerEntryKeys(row.referenceId);
    for (const key of keys) {
      if (!entries.has(key)) entries.set(key, row);
    }
  }

  return { entries, warnings, conflicts };
}

function findLedgerEntryForProject(projectId, ledger) {
  for (const key of ledgerEntryKeys(projectId)) {
    const entry = ledger.entries.get(key);
    if (entry) return entry;
  }
  return null;
}

function renderReferenceAdoptionLedger({ items, generatedAt }) {
  const lines = [
    '# Reference Adoption Ledger',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Use this ledger to review local reference collections before adopting patterns into skills, MCP surfaces, runtime indexes, workflows, memory, or docs. Keep entries summarized; do not paste raw external files, credentials, private URLs, or local absolute paths.',
    '',
    '| Status | Reference ID | Capability | Useful Pattern | Local Adoption | Risk/Noise | Decision Date |',
    '| --- | --- | --- | --- | --- | --- | --- |'
  ];
  for (const item of items) {
    lines.push(renderReferenceAdoptionLedgerRow(item));
  }
  lines.push('');
  return lines.join('\n');
}

export async function updateReferenceAdoptionLedger({
  target,
  referenceDir,
  filePath,
  maxResults = DEFAULT_QUEUE_RESULTS,
  apply = false
}) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const resolvedLedger = resolveLedgerPath({ target: resolvedTarget, filePath });
  const generatedAt = new Date().toISOString();
  const warnings = [];
  const conflicts = [];

  if (!resolvedLedger.ok) {
    conflicts.push({
      id: 'reference-ledger-update.path-invalid',
      message: 'Ledger path must stay inside the target repository.',
      paths: [resolvedLedger.relativePath]
    });
  }

  if (!existsSync(playbook.root)) {
    conflicts.push({
      id: 'reference-ledger-update.playbook-missing',
      message: `Missing ${playbook.dir}/. Bootstrap or migrate the playbook before updating a reference ledger.`,
      paths: [`${playbook.dir}/`]
    });
  }

  if (!referenceDir) {
    conflicts.push({
      id: 'reference-ledger-update.reference-dir-required',
      message: 'Reference directory is required.',
      paths: []
    });
  } else if (!await isDirectoryPath(referenceDir)) {
    conflicts.push({
      id: 'reference-ledger-update.reference-dir-missing',
      message: 'Reference directory does not exist.',
      paths: [normalizePortablePath(path.resolve(referenceDir))]
    });
  }

  if (resolvedLedger.ok && !existsSync(resolvedLedger.path)) {
    conflicts.push({
      id: 'reference-ledger-update.ledger-missing',
      message: 'Reference adoption ledger is missing; run ledger-init or bootstrap the playbook first.',
      paths: [resolvedLedger.relativePath]
    });
  }

  let currentContent = '';
  if (conflicts.length === 0) {
    currentContent = await readFile(resolvedLedger.path, 'utf8');
  }

  const queue = conflicts.length === 0
    ? await buildReferenceAdoptionQueue({
      target: referenceDir,
      maxResults,
      ledgerPath: resolvedLedger.path
    })
    : null;
  if (queue) {
    warnings.push(...queue.warnings);
    conflicts.push(...queue.conflicts);
  }

  const newItems = (queue?.queue ?? []).filter((item) => item.ledgerStatus === 'new' && !item.ledgerReferenceId);
  let updatedContent = currentContent;
  let removedPlaceholder = false;
  if (conflicts.length === 0 && newItems.length > 0) {
    const appended = appendReferenceAdoptionLedgerRows({
      content: currentContent,
      rows: newItems.map((item) => renderReferenceAdoptionLedgerRow(item))
    });
    updatedContent = appended.content;
    removedPlaceholder = appended.removedPlaceholder;
    conflicts.push(...appended.conflicts);
  }

  const operations = resolvedLedger.ok && conflicts.length === 0 && newItems.length > 0
    ? [{
      id: 'reference-ledger-update.append-rows',
      action: apply ? 'write' : 'preview',
      message: `${apply ? 'Append' : 'Preview'} ${newItems.length} new reference adoption ledger row(s).`,
      paths: [resolvedLedger.relativePath]
    }]
    : [];

  const result = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'reference.adoption-ledger-update',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: Boolean(apply) },
    generatedAt,
    applied: false,
    path: resolvedLedger.relativePath,
    summary: {
      queueEntries: queue?.summary?.queueItems ?? 0,
      added: newItems.length,
      removedPlaceholder,
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    ledger: {
      path: resolvedLedger.relativePath,
      content: updatedContent
    },
    operations,
    warnings,
    conflicts
  };

  if (!result.ok || !apply || operations.length === 0) return result;

  await writeFile(resolvedLedger.path, updatedContent);

  return {
    ...result,
    applied: true
  };
}

function renderReferenceAdoptionLedgerRow(item) {
  return `| ${[
    'new',
    `reference-${normalizeLedgerKey(item.project, 'source')}`,
    primaryLedgerCapability(item),
    ledgerCell(ledgerPatternSummary(item)),
    ledgerCell(ledgerAdoptionSummary(item)),
    ledgerCell('Summarize reusable patterns; do not copy raw reference content.'),
    ''
  ].join(' | ')} |`;
}

function appendReferenceAdoptionLedgerRows({ content, rows }) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  const headerIndex = lines.findIndex((line) => isReferenceLedgerHeader(line));
  if (headerIndex < 0) {
    return {
      content,
      removedPlaceholder: false,
      conflicts: [{
        id: 'reference-ledger-update.table-missing',
        message: 'Reference adoption ledger table header is missing.',
        paths: []
      }]
    };
  }

  const separatorIndex = lines.findIndex((line, index) => index > headerIndex && isLedgerSeparatorRow(line));
  if (separatorIndex < 0) {
    return {
      content,
      removedPlaceholder: false,
      conflicts: [{
        id: 'reference-ledger-update.table-separator-missing',
        message: 'Reference adoption ledger table separator is missing.',
        paths: []
      }]
    };
  }

  let insertIndex = separatorIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('|')) {
    insertIndex += 1;
  }
  const existingRows = lines.slice(separatorIndex + 1, insertIndex);
  const filteredRows = existingRows.filter((line) => !isBlankLedgerPlaceholderRow(line));
  const removedPlaceholder = filteredRows.length !== existingRows.length;
  const nextLines = [
    ...lines.slice(0, separatorIndex + 1),
    ...filteredRows,
    ...rows,
    ...lines.slice(insertIndex)
  ];

  return {
    content: `${nextLines.join('\n')}\n`,
    removedPlaceholder,
    conflicts: []
  };
}

function isReferenceLedgerHeader(line) {
  const cells = ledgerRowCells(line).map((cell) => cell.toLowerCase());
  return cells.length >= 7
    && cells[0] === 'status'
    && cells[1] === 'reference id'
    && cells[2] === 'capability'
    && cells[3] === 'useful pattern'
    && cells[4] === 'local adoption'
    && cells[5] === 'risk/noise'
    && cells[6] === 'decision date';
}

function isLedgerSeparatorRow(line) {
  return /^\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function isBlankLedgerPlaceholderRow(line) {
  const cells = ledgerRowCells(line);
  return cells.length >= 7
    && cells[0].toLowerCase() === 'new'
    && cells.slice(1).every((cell) => cell === '');
}

function ledgerRowCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  return trimmed.split('|').slice(1, -1).map((cell) => cell.trim());
}

async function isDirectoryPath(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

function primaryLedgerCapability(item) {
  const preferred = ['security', 'architecture', 'frontend', 'backend', 'database', 'devops', 'mobile', 'data', 'ai-harness', 'delivery', 'foundation'];
  return item.recommendedCapabilities.find((capability) => preferred.includes(capability))
    ?? item.recommendedCapabilities[0]
    ?? item.candidateCapabilities[0]
    ?? 'uncategorized';
}

function ledgerPatternSummary(item) {
  const signals = item.signalHighlights
    .slice(0, 3)
    .map((signal) => `${signal.signal}:${signal.count}`)
    .join(', ');
  return signals ? `Queue score ${item.score}; signals ${signals}` : `Queue score ${item.score}`;
}

function ledgerAdoptionSummary(item) {
  const capabilities = item.recommendedCapabilities.slice(0, 3).join(', ');
  return capabilities ? `Review for ${capabilities}` : 'Review manually before adoption';
}

function ledgerCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '/')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function ledgerEntryKeys(referenceId) {
  const direct = normalizeLedgerKey(referenceId, '');
  const stripped = direct.startsWith('reference-') ? direct.slice('reference-'.length) : direct;
  return [...new Set([direct, stripped, direct ? `reference-${stripped || direct}` : ''].filter(Boolean))];
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
    referenceId: normalizeLedgerKey(cells[1], 'unknown-reference'),
    capability: normalizeLedgerKey(cells[2], 'uncategorized'),
    decisionDate: cells[6] || null
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
