import { getForgeCapabilities } from './capabilities.mjs';

const SCHEMA_VERSION = '1';

const MANAGED_LABELS = [
  {
    name: 'aapb:ready',
    color: '1f883d',
    description: 'Approved AI Agent Playbook work that is ready to be claimed.'
  },
  {
    name: 'aapb:running',
    color: '0969da',
    description: 'AI Agent Playbook work currently being executed.'
  },
  {
    name: 'aapb:paused',
    color: 'bf8700',
    description: 'AI Agent Playbook work paused by policy, operator, or reconciliation.'
  },
  {
    name: 'aapb:blocked',
    color: 'cf222e',
    description: 'AI Agent Playbook work that cannot currently make progress.'
  },
  {
    name: 'aapb:review',
    color: '8250df',
    description: 'AI Agent Playbook work awaiting human or automated review.'
  }
];

const PROJECT_VIEWS = [
  { name: 'Queue', layout: 'table', filter: 'label:aapb:ready' },
  { name: 'Board', layout: 'board', filter: '-is:closed' },
  { name: 'Roadmap', layout: 'roadmap', filter: '-is:closed' },
  { name: 'Blocked', layout: 'table', filter: 'label:aapb:blocked' }
];

const TASK_STATUS_LABELS = {
  planned: 'aapb:ready',
  ready: 'aapb:ready',
  claimed: 'aapb:running',
  running: 'aapb:running',
  verifying: 'aapb:running',
  paused: 'aapb:paused',
  blocked: 'aapb:blocked',
  review: 'aapb:review'
};

const TASK_STATUSES = new Set([
  ...Object.keys(TASK_STATUS_LABELS),
  'completed',
  'cancelled'
]);

/**
 * Produce a read-only, idempotent plan for provider bootstrap assets.
 *
 * @param {{
 *   provider?: string,
 *   capabilities?: Record<string, string>,
 *   milestoneTitle?: string | null,
 *   projectTitle?: string | null
 * }} [options]
 */
export function planForgeBootstrap(options = {}) {
  const provider = normalizedProvider(options.provider);
  const capabilities = options.capabilities ?? getForgeCapabilities(provider);
  const milestoneTitle = normalizedText(options.milestoneTitle);
  const projectTitle = normalizedText(options.projectTitle);
  const operations = [];
  const warnings = capabilityWarnings(capabilities, ['labels', 'milestones', 'projects', 'views']);
  const conflicts = [];

  if (capabilities.labels === 'supported') {
    for (const label of MANAGED_LABELS) {
      operations.push(operation({
        id: `label:${label.name}`,
        idempotencyKey: `forge.bootstrap.label.${stableKey(label.name)}`,
        action: 'ensure',
        resource: 'label',
        capability: 'labels',
        payload: { ...label }
      }));
    }
  }

  if (milestoneTitle && capabilities.milestones === 'supported') {
    operations.push(operation({
      id: `milestone:${milestoneTitle}`,
      idempotencyKey: `forge.bootstrap.milestone.${stableKey(milestoneTitle)}`,
      action: 'ensure',
      resource: 'milestone',
      capability: 'milestones',
      payload: { title: milestoneTitle }
    }));
  }

  if (projectTitle && capabilities.projects === 'supported') {
    operations.push(operation({
      id: `project:${projectTitle}`,
      idempotencyKey: `forge.bootstrap.project.${stableKey(projectTitle)}`,
      action: 'ensure',
      resource: 'project',
      capability: 'projects',
      payload: { title: projectTitle }
    }));
  }

  if (projectTitle && capabilities.projects === 'supported' && capabilities.views === 'supported') {
    for (const view of PROJECT_VIEWS) {
      operations.push(operation({
        id: `view:${view.name}`,
        idempotencyKey: `forge.bootstrap.view.${stableKey(projectTitle)}.${stableKey(view.name)}`,
        action: 'ensure',
        resource: 'view',
        capability: 'views',
        payload: {
          projectTitle,
          ...view
        }
      }));
    }
  }

  if (
    projectTitle &&
    (capabilities.projects === 'fallback' || capabilities.views === 'fallback') &&
    capabilities.issues === 'supported' &&
    capabilities.labels === 'supported'
  ) {
    operations.push(operation({
      id: 'fallback:milestone-label-filter',
      idempotencyKey: `forge.bootstrap.fallback.${stableKey(projectTitle)}`,
      action: 'use',
      resource: 'milestone-label-filter',
      capability: 'issues',
      mode: 'fallback',
      payload: {
        projectTitle,
        milestoneTitle,
        labels: MANAGED_LABELS.map((label) => label.name)
      }
    }));
  }

  return planResult({
    kind: 'forge.bootstrap-plan',
    provider,
    operations,
    warnings,
    conflicts
  });
}

/**
 * Produce deterministic task-to-issue synchronization operations. The plan is
 * structured data only; provider adapters decide how to apply each operation.
 *
 * @param {{
 *   provider?: string,
 *   capabilities?: Record<string, string>,
 *   milestoneTitle?: string | null,
 *   planId?: string | null,
 *   planTitle?: string | null,
 *   projectTitle?: string | null,
 *   language?: string | null,
 *   tasks?: object[],
 *   requestedCapabilities?: string[]
 * }} [options]
 */
export function planForgeSync(options = {}) {
  const provider = normalizedProvider(options.provider);
  const capabilities = options.capabilities ?? getForgeCapabilities(provider);
  const tasks = Array.isArray(options.tasks) ? options.tasks : [];
  const requestedCapabilities = [...new Set(
    (Array.isArray(options.requestedCapabilities) ? options.requestedCapabilities : [])
      .filter((capability) => typeof capability === 'string' && capability.trim())
      .map((capability) => capability.trim())
  )].sort((left, right) => left.localeCompare(right));
  const warnings = capabilityWarnings(capabilities, requestedCapabilities);
  const conflicts = taskConflicts(tasks);

  if (conflicts.length > 0) {
    return planResult({
      kind: 'forge.sync-plan',
      provider,
      operations: [],
      warnings,
      conflicts
    });
  }

  if (tasks.length > 0 && capabilities.issues !== 'supported') {
    warnings.push(...capabilityWarnings(capabilities, ['issues']));
    return planResult({
      kind: 'forge.sync-plan',
      provider,
      operations: [],
      warnings: deduplicateWarnings(warnings),
      conflicts
    });
  }

  const milestoneTitle = normalizedText(options.milestoneTitle);
  const language = workingLanguage(options.language, [
    options.planTitle,
    ...tasks.flatMap((task) => [task?.title, ...(Array.isArray(task?.acceptanceCriteria) ? task.acceptanceCriteria : [])])
  ].filter(Boolean).join(' '));
  const acceptanceHeading = language === 'ko' ? '수용 기준' : 'Acceptance criteria';
  const childOperations = [...tasks]
    .sort((left, right) => String(left.id).localeCompare(String(right.id)))
    .map((task) => taskSyncOperation(task, milestoneTitle, acceptanceHeading));
  const planId = normalizedText(options.planId);
  const planTitle = normalizedText(options.planTitle);
  const projectTitle = normalizedText(options.projectTitle) ?? planTitle;
  const operations = [];
  if (planId && planTitle) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(planId)) {
      conflicts.push({ id: 'forge.plan.invalid-id', message: `Forge plan identifier is not portable: ${planId}.`, taskId: planId, status: 'invalid' });
      return planResult({ kind: 'forge.sync-plan', provider, operations: [], warnings, conflicts });
    }
    operations.push(operation({
      id: `plan:${planId}:issue`,
      idempotencyKey: `forge.sync.plan.${stableKey(planId)}.issue`,
      action: 'ensure',
      resource: 'issue',
      capability: 'issues',
      payload: {
        marker: `<!-- aapb:plan:${planId} -->`,
        title: planTitle,
        state: 'open',
        labels: [],
        milestoneTitle,
        acceptanceHeading,
        acceptanceCriteria: []
      }
    }));
  }
  operations.push(...childOperations);
  if (projectTitle && provider === 'github' && capabilities.projects === 'supported') {
    for (const task of [...tasks].sort((left, right) => String(left.id).localeCompare(String(right.id)))) {
      operations.push(projectItemSyncOperation(task, projectTitle));
    }
  }
  if (planId && planTitle) {
    for (const task of [...tasks].sort((left, right) => String(left.id).localeCompare(String(right.id)))) {
      operations.push(operation({
        id: `plan:${planId}:child:${task.id}`,
        idempotencyKey: `forge.sync.plan.${stableKey(planId)}.child.${stableKey(task.id)}`,
        action: capabilities.subIssues === 'supported' ? 'ensure' : 'use',
        resource: 'sub-issue',
        capability: 'subIssues',
        mode: capabilities.subIssues === 'supported' ? 'native' : 'fallback',
        payload: {
          parentMarker: `<!-- aapb:plan:${planId} -->`,
          childMarker: `<!-- aapb:task:${task.id} -->`
        }
      }));
    }
  }

  return planResult({
    kind: 'forge.sync-plan',
    provider,
    operations,
    warnings,
    conflicts
  });
}

function projectItemSyncOperation(task, projectTitle) {
  const status = normalizedText(task.status)?.toLowerCase() ?? 'planned';
  const issueNumber = Number.isInteger(task.issueNumber) && task.issueNumber > 0
    ? task.issueNumber
    : null;
  return operation({
    id: `task:${task.id}:project-item`,
    idempotencyKey: `forge.sync.task.${stableKey(task.id)}.project-item`,
    taskId: task.id,
    action: 'ensure',
    resource: 'project-item',
    capability: 'projects',
    payload: {
      projectTitle,
      ...(issueNumber ? { issueNumber } : { issueMarker: `<!-- aapb:task:${task.id} -->` }),
      taskId: task.id,
      status,
      priority: normalizedTaskPriority(task.priority),
      risk: normalizedTaskRisk(task.risk),
      progress: normalizedTaskProgress(task.progress, status)
    }
  });
}

function normalizedTaskPriority(value) {
  return Number.isInteger(value) && value >= 0 && value <= 1000 ? value : 50;
}

function normalizedTaskRisk(value) {
  const risk = normalizedText(value)?.toLowerCase();
  return ['low', 'medium', 'high'].includes(risk) ? risk : 'medium';
}

function normalizedTaskProgress(value, status) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) return value;
  return {
    planned: 0,
    ready: 0,
    claimed: 10,
    running: 25,
    verifying: 75,
    review: 90,
    completed: 100,
    paused: 0,
    blocked: 0,
    cancelled: 0
  }[status] ?? 0;
}

function taskSyncOperation(task, milestoneTitle, acceptanceHeading) {
  const status = normalizedText(task.status)?.toLowerCase() ?? 'planned';
  const label = TASK_STATUS_LABELS[status];
  const issueNumber = Number.isInteger(task.issueNumber) && task.issueNumber > 0
    ? task.issueNumber
    : null;
  const title = normalizedText(task.title) ?? task.id;
  const acceptanceCriteria = Array.isArray(task.acceptanceCriteria)
    ? task.acceptanceCriteria.filter((criterion) => typeof criterion === 'string')
    : [];

  const payload = issueNumber
    ? {
        taskId: task.id,
        state: status === 'completed' || status === 'cancelled' ? 'closed' : 'open',
        labels: label ? [label] : [],
        issueNumber,
        preserveNonManagedLabels: true,
        ...(normalizedText(task.expectedUpdatedAt) ? { expectedUpdatedAt: normalizedText(task.expectedUpdatedAt) } : {})
      }
    : {
        marker: `<!-- aapb:task:${task.id} -->`,
        taskId: task.id,
        title,
        state: status === 'completed' || status === 'cancelled' ? 'closed' : 'open',
        labels: label ? [label] : [],
        milestoneTitle,
        issueNumber,
        acceptanceHeading,
        acceptanceCriteria
      };

  return operation({
    id: `task:${task.id}:issue`,
    idempotencyKey: `forge.sync.task.${stableKey(task.id)}.issue`,
    taskId: task.id,
    action: issueNumber ? 'update' : 'ensure',
    resource: 'issue',
    capability: 'issues',
    payload
  });
}

function workingLanguage(value, sample) {
  const configured = normalizedText(value)?.toLowerCase();
  if (configured === 'ko' || configured?.startsWith('ko-')) return 'ko';
  if (configured === 'en' || configured?.startsWith('en-')) return 'en';
  return /[가-힣]/u.test(String(sample)) ? 'ko' : 'en';
}

function taskConflicts(tasks) {
  const conflicts = [];
  const counts = new Map();
  for (const task of tasks) {
    const id = task && typeof task === 'object' ? normalizedText(task.id) : null;
    if (!id || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) {
      conflicts.push({
        id: 'forge.task.invalid-id',
        message: 'Forge task identifiers must use letters, numbers, dot, underscore, or hyphen and begin with a letter or number.',
        taskId: id
      });
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
    const status = normalizedText(task.status)?.toLowerCase() ?? 'planned';
    if (!TASK_STATUSES.has(status)) {
      conflicts.push({
        id: 'forge.task.invalid-status',
        message: `Forge task ${id} has an unsupported status: ${status}.`,
        taskId: id,
        status
      });
    }
  }
  for (const [id, count] of [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (count > 1) {
      conflicts.push({
        id: 'forge.task.duplicate-id',
        message: `Forge task identifier is duplicated: ${id}.`,
        taskId: id
      });
    }
  }
  return conflicts;
}

function capabilityWarnings(capabilities, requestedCapabilities) {
  const warnings = [];
  for (const capability of [...new Set(requestedCapabilities)]) {
    const state = capabilities[capability] ?? 'unsupported';
    if (state === 'supported') continue;
    warnings.push({
      id: 'forge.capability.degraded',
      capability,
      state,
      message: capabilityMessage(capability, state)
    });
  }
  return warnings;
}

function capabilityMessage(capability, state) {
  if (state === 'fallback') {
    return `${capability} is not natively supported by this provider; the operation plan uses a documented fallback.`;
  }
  if (state === 'preview') {
    return `${capability} is a preview capability and is not selected automatically.`;
  }
  if (state === 'read-only') {
    return `${capability} is available only for reads with the current authorization; no remote write operation is planned for it.`;
  }
  if (state === 'unavailable') {
    return `${capability} is unavailable under the verified server or authorization capabilities; no remote operation is planned for it.`;
  }
  return `${capability} is unsupported by this provider; no remote operation is planned for it.`;
}

function deduplicateWarnings(warnings) {
  const byKey = new Map();
  for (const warning of warnings) {
    byKey.set(`${warning.id}:${warning.capability}:${warning.state}`, warning);
  }
  return [...byKey.values()];
}

function planResult({ kind, provider, operations, warnings, conflicts }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind,
    ok: conflicts.length === 0,
    mode: {
      writes: false,
      apply: false
    },
    provider,
    summary: {
      operations: operations.length,
      fallback: operations.filter((item) => item.mode === 'fallback').length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };
}

function operation(value) {
  return {
    mode: 'native',
    ...value
  };
}

function stableKey(value) {
  return encodeURIComponent(String(value).trim().toLowerCase()).replace(/%/g, '_');
}

function normalizedProvider(value) {
  return normalizedText(value)?.toLowerCase() ?? 'none';
}

function normalizedText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
