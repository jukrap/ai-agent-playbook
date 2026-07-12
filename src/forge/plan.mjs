import { getForgeCapabilities } from './capabilities.mjs';
import { redactPublicArgv } from './public-redaction.mjs';

const SCHEMA_VERSION = '1';

const READY_LABEL = {
  name: 'status:ready',
  color: '1f883d',
  description: 'Approved work that is ready to be claimed.'
};

const FALLBACK_STATUS_LABELS = [
  READY_LABEL,
  {
    name: 'status:in-progress',
    color: '0969da',
    description: 'Work currently being executed.'
  },
  {
    name: 'status:paused',
    color: 'bf8700',
    description: 'Work paused by policy, operator, or reconciliation.'
  },
  {
    name: 'status:blocked',
    color: 'cf222e',
    description: 'Work that cannot currently make progress.'
  },
  {
    name: 'status:review',
    color: '8250df',
    description: 'Work awaiting human or automated review.'
  }
];

const PROJECT_VIEWS = [
  { name: 'Queue', layout: 'table', filter: 'delivery-status:Ready' },
  { name: 'Board', layout: 'board', filter: '-is:closed' },
  { name: 'Roadmap', layout: 'roadmap', filter: '-is:closed' },
  { name: 'Blocked', layout: 'table', filter: 'delivery-status:Blocked' }
];

const KOREAN_PROJECT_VIEWS = [
  { name: '전체', role: 'all', layout: 'table', filter: '-is:closed' },
  { name: '보드', layout: 'board', filter: '-is:closed' },
  { name: '로드맵', layout: 'roadmap', filter: '-is:closed' },
  { name: '주의 필요', layout: 'table', filter: 'delivery-status:Blocked' }
];

const FALLBACK_STATUS_BY_TASK = {
  ready: 'status:ready',
  claimed: 'status:in-progress',
  running: 'status:in-progress',
  verifying: 'status:in-progress',
  paused: 'status:paused',
  blocked: 'status:blocked',
  review: 'status:review'
};

const TASK_STATUSES = new Set([
  'planned',
  ...Object.keys(FALLBACK_STATUS_BY_TASK),
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
 *   milestoneDescription?: string | null,
 *   projectTitle?: string | null,
 *   projectMode?: string | null,
 *   language?: string | null
 * }} [options]
 */
export function planForgeBootstrap(options = {}) {
  const provider = normalizedProvider(options.provider);
  const capabilities = options.capabilities ?? getForgeCapabilities(provider);
  const milestoneTitle = normalizedText(options.milestoneTitle);
  const projectTitle = normalizedText(options.projectTitle);
  const requestedProjectMode = normalizedText(options.projectMode)?.toLowerCase() ?? (provider === 'gitea' ? 'milestone' : 'preferred');
  const projectMode = provider === 'gitea' && requestedProjectMode === 'preferred' ? 'milestone' : requestedProjectMode;
  const bootstrapLanguage = workingLanguage(options.language, `${projectTitle ?? ''} ${milestoneTitle ?? ''}`);
  const projectViews = bootstrapLanguage === 'ko'
    ? KOREAN_PROJECT_VIEWS
    : PROJECT_VIEWS;
  const operations = [];
  const warnings = capabilityWarnings(capabilities, ['labels', 'milestones', 'projects', 'views']);
  const missingProjectCapabilities = provider === 'github' && projectMode === 'preferred'
    ? ['projects', 'views'].filter((capability) => capabilities[capability] !== 'supported')
    : [];
  const planningCapabilities = missingProjectCapabilities.length > 0
    ? { ...capabilities, projects: 'supported', views: 'supported' }
    : capabilities;
  const conflicts = missingProjectCapabilities.length > 0
    ? [missingProjectsCapabilityConflict(missingProjectCapabilities)]
    : [];
  const managedLabels = provider === 'github' && projectMode === 'preferred'
    ? [READY_LABEL]
    : FALLBACK_STATUS_LABELS;

  if (planningCapabilities.labels === 'supported') {
    for (const label of managedLabels) {
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

  if (milestoneTitle && planningCapabilities.milestones === 'supported') {
    const milestoneDescription = normalizedText(options.milestoneDescription) ?? [
      `${bootstrapLanguage === 'ko' ? '프로그램' : 'Program'}: ${milestoneTitle}`,
      '',
      bootstrapLanguage === 'ko'
        ? '완료 정의와 현재 gate는 승인된 협업 계획에서 동기화합니다.'
        : 'Completion definition and the current gate are synchronized from the approved coordination plan.'
    ].join('\n');
    operations.push(operation({
      id: `milestone:${milestoneTitle}`,
      idempotencyKey: `forge.bootstrap.milestone.${stableKey(milestoneTitle)}`,
      action: 'ensure',
      resource: 'milestone',
      capability: 'milestones',
      payload: { title: milestoneTitle, description: milestoneDescription }
    }));
  }

  if (projectMode === 'preferred' && projectTitle && planningCapabilities.projects === 'supported') {
    operations.push(operation({
      id: `project:${projectTitle}`,
      idempotencyKey: `forge.bootstrap.project.${stableKey(projectTitle)}`,
      action: 'ensure',
      resource: 'project',
      capability: 'projects',
      payload: { title: projectTitle }
    }));
  }

  if (projectMode === 'preferred' && projectTitle && planningCapabilities.projects === 'supported' && planningCapabilities.views === 'supported') {
    for (const view of projectViews) {
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
    projectMode !== 'preferred' &&
    planningCapabilities.issues === 'supported' &&
    planningCapabilities.labels === 'supported'
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
        labels: managedLabels.map((label) => label.name)
      }
    }));
  }

  return planResult({
    kind: 'forge.bootstrap-plan',
    provider,
    operations: conflicts.length > 0 ? [] : operations,
    plannedOperations: operations,
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
 *   coordination?: object | null,
 *   tasks?: object[],
 *   requestedCapabilities?: string[]
 * }} [options]
 */
export function planForgeSync(options = {}) {
  const provider = normalizedProvider(options.provider);
  const capabilities = options.capabilities ?? getForgeCapabilities(provider);
  const tasks = Array.isArray(options.tasks) ? options.tasks : [];
  const coordination = options.coordination && typeof options.coordination === 'object'
    ? options.coordination
    : null;
  const requestedCapabilities = [...new Set(
    (Array.isArray(options.requestedCapabilities) ? options.requestedCapabilities : [])
      .filter((capability) => typeof capability === 'string' && capability.trim())
      .map((capability) => capability.trim())
  )].sort((left, right) => left.localeCompare(right));
  /** @type {Array<Record<string, unknown>>} */
  const warnings = capabilityWarnings(capabilities, requestedCapabilities);
  /** @type {Array<Record<string, unknown>>} */
  const conflicts = taskConflicts(tasks);
  const issueMode = coordination
    ? normalizedText(coordination.issueMode)?.toLowerCase() ?? 'delivery-group'
    : null;
  const requestedProjectMode = normalizedText(coordination?.projectMode)?.toLowerCase() ?? (provider === 'gitea' ? 'milestone' : 'preferred');
  const projectMode = provider === 'gitea' && requestedProjectMode === 'preferred' ? 'milestone' : requestedProjectMode;
  const missingProjectCapabilities = provider === 'github' && projectMode === 'preferred'
    ? ['projects', 'views'].filter((capability) => capabilities[capability] !== 'supported')
    : [];
  const planningCapabilities = missingProjectCapabilities.length > 0
    ? { ...capabilities, projects: 'supported', views: 'supported' }
    : capabilities;

  if (tasks.length > 0 && !coordination) {
    conflicts.push({
      id: 'forge.coordination.required',
      message: 'Remote synchronization requires reviewed coordination metadata. Use delivery-group (default), parent-only, or explicitly request legacy task mode.',
      status: 'invalid'
    });
  }
  if (coordination && !['delivery-group', 'parent-only', 'task'].includes(issueMode)) {
    conflicts.push({
      id: 'forge.coordination.issue-mode-invalid',
      message: `Unsupported forge issue mode: ${issueMode}.`,
      status: 'invalid'
    });
  }

  const planId = normalizedText(options.planId);
  const planTitle = normalizedText(options.planTitle);
  const milestoneTitle = normalizedText(options.milestoneTitle);
  const projectTitle = normalizedText(options.projectTitle) ?? planTitle;
  const language = workingLanguage(options.language, coordinationLanguageSample(coordination, planTitle, tasks));
  const presentationFindings = presentationFindingsFor({ coordination, issueMode, language, planTitle, tasks });
  conflicts.push(...presentationFindings
    .filter((finding) => finding.severity === 'error')
    .map((finding) => ({ ...finding, status: 'invalid' })));
  if (coordination && issueMode !== 'task') {
    conflicts.push(...coordinationConflicts({ coordination, issueMode, planId, planTitle, tasks }));
  }

  if (conflicts.length > 0) {
    return planResult({
      kind: 'forge.sync-plan',
      provider,
      operations: [],
      warnings,
      conflicts,
      presentationFindings
    });
  }

  if (tasks.length > 0 && capabilities.issues !== 'supported') {
    warnings.push(...capabilityWarnings(capabilities, ['issues']));
    return planResult({
      kind: 'forge.sync-plan',
      provider,
      operations: [],
      warnings: deduplicateWarnings(warnings),
      conflicts,
      presentationFindings
    });
  }

  const acceptanceHeading = language === 'ko' ? '수용 기준' : 'Acceptance criteria';
  const operations = [];
  if (milestoneTitle && capabilities.milestones === 'supported' && coordination?.program) {
    operations.push(operation({
      id: `milestone:${milestoneTitle}`,
      idempotencyKey: `forge.sync.milestone.${stableKey(milestoneTitle)}`,
      action: 'ensure',
      resource: 'milestone',
      capability: 'milestones',
      payload: {
        title: milestoneTitle,
        description: renderMilestoneDescription({ coordination, tasks, language })
      }
    }));
  }
  if (planId && publicPlanTitle(coordination, planTitle)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(planId)) {
      conflicts.push({ id: 'forge.plan.invalid-id', message: `Forge plan identifier is not portable: ${planId}.`, taskId: planId, status: 'invalid' });
      return planResult({ kind: 'forge.sync-plan', provider, operations: [], warnings, conflicts, presentationFindings });
    }
    const programIssueNumber = Number.isInteger(coordination?.program?.issueNumber) && coordination.program.issueNumber > 0
      ? coordination.program.issueNumber
      : null;
    operations.push(operation({
      id: `plan:${planId}:issue`,
      idempotencyKey: `forge.sync.plan.${stableKey(planId)}.issue`,
      action: programIssueNumber ? 'update' : 'ensure',
      resource: 'issue',
      capability: 'issues',
      critical: issueMode !== 'task',
      payload: {
        marker: `<!-- aapb:plan:${planId} -->`,
        title: publicPlanTitle(coordination, planTitle),
        state: 'open',
        labels: [],
        milestoneTitle,
        acceptanceHeading,
        acceptanceCriteria: issueMode === 'task' ? [] : normalizedStringValues(coordination.program?.successCriteria),
        ...(programIssueNumber ? {
          issueNumber: programIssueNumber,
          expectedUpdatedAt: normalizedText(coordination.program?.expectedUpdatedAt),
          preserveNonManagedLabels: true,
          preserveManagedBody: true
        } : {}),
        ...(issueMode === 'task' ? {} : {
          body: renderParentIssueBody({ coordination, tasks, language })
        })
      }
    }));
  }

  if (issueMode === 'task') {
    operations.push(...[...tasks]
      .sort((left, right) => String(left.id).localeCompare(String(right.id)))
      .map((task) => taskSyncOperation(task, milestoneTitle, acceptanceHeading, provider, capabilities, projectMode)));
    if (projectMode === 'preferred' && projectTitle && provider === 'github' && planningCapabilities.projects === 'supported') {
      for (const task of [...tasks].sort((left, right) => String(left.id).localeCompare(String(right.id)))) {
        operations.push(projectItemSyncOperation(task, projectTitle));
      }
    }
    appendTaskSubIssueOperations(operations, { planId, planTitle, tasks, capabilities });
  } else if (issueMode === 'delivery-group') {
    const groups = sortedGroups(coordination);
    for (const group of groups) {
      const groupTasks = tasksForGroup(group, tasks);
      operations.push(groupIssueOperation({ group, tasks: groupTasks, provider, capabilities, projectMode, milestoneTitle, acceptanceHeading, language, planId }));
    }
    if (projectMode === 'preferred' && projectTitle && provider === 'github' && planningCapabilities.projects === 'supported') {
      for (const group of groups) {
        operations.push(groupProjectItemSyncOperation(group, tasksForGroup(group, tasks), projectTitle));
      }
    }
    if (planId && publicPlanTitle(coordination, planTitle)) {
      for (const group of groups) {
        operations.push(subIssueOperation({
          planId,
          childId: group.id,
          childMarker: `<!-- aapb:group:${group.id} -->`,
          capabilities
        }));
      }
    }
  }

  const publicTitles = issueMode === 'task'
    ? [
        publicPlanTitle(coordination, planTitle),
        ...[...tasks].sort((left, right) => String(left.id).localeCompare(String(right.id))).map((task) => normalizedText(task.title))
      ].filter(Boolean)
    : [publicPlanTitle(coordination, planTitle), ...sortedGroups(coordination).map((group) => normalizedText(group.title))].filter(Boolean);
  const reviewableBodyCount = issueMode === 'delivery-group'
    ? (publicPlanTitle(coordination, planTitle) ? 1 : 0) + sortedGroups(coordination).length
    : issueMode === 'parent-only' && publicPlanTitle(coordination, planTitle) ? 1 : 0;
  const capabilityConflicts = missingProjectCapabilities.length > 0
    ? [missingProjectsCapabilityConflict(missingProjectCapabilities)]
    : [];
  return planResult({
    kind: 'forge.sync-plan',
    provider,
    operations: capabilityConflicts.length > 0 ? [] : operations,
    plannedOperations: operations,
    warnings,
    conflicts: [...conflicts, ...capabilityConflicts],
    presentationFindings,
    publicTitles,
    bodyCompleteness: { complete: reviewableBodyCount, total: reviewableBodyCount }
  });
}

function appendTaskSubIssueOperations(operations, { planId, planTitle, tasks, capabilities }) {
  if (!planId || !planTitle) return;
  for (const task of [...tasks].sort((left, right) => String(left.id).localeCompare(String(right.id)))) {
    operations.push(subIssueOperation({
      planId,
      childId: task.id,
      childMarker: `<!-- aapb:task:${task.id} -->`,
      capabilities
    }));
  }
}

function subIssueOperation({ planId, childId, childMarker, capabilities }) {
  return operation({
    id: `plan:${planId}:child:${childId}`,
    idempotencyKey: `forge.sync.plan.${stableKey(planId)}.child.${stableKey(childId)}`,
    action: capabilities.subIssues === 'supported' ? 'ensure' : 'use',
    resource: 'sub-issue',
    capability: 'subIssues',
    mode: capabilities.subIssues === 'supported' ? 'native' : 'fallback',
    payload: {
      parentMarker: `<!-- aapb:plan:${planId} -->`,
      childMarker
    }
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
      phase: normalizedText(task.deliveryGroup) ?? 'delivery',
      status,
      priority: normalizedTaskPriority(task.priority),
      risk: normalizedTaskRisk(task.risk),
      progress: normalizedTaskProgress(task.progress, status)
    }
  });
}

function groupProjectItemSyncOperation(group, tasks, projectTitle) {
  const status = aggregateGroupStatus(tasks);
  const issueNumber = Number.isInteger(group.issueNumber) && group.issueNumber > 0
    ? group.issueNumber
    : null;
  return operation({
    id: `group:${group.id}:project-item`,
    idempotencyKey: `forge.sync.group.${stableKey(group.id)}.project-item`,
    groupId: group.id,
    action: 'ensure',
    resource: 'project-item',
    capability: 'projects',
    payload: {
      projectTitle,
      ...(issueNumber ? { issueNumber } : { issueMarker: `<!-- aapb:group:${group.id} -->` }),
      groupId: group.id,
      phase: group.id,
      status,
      priority: aggregatePriority(tasks),
      risk: aggregateRisk(tasks),
      progress: aggregateProgress(tasks)
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

function taskSyncOperation(task, milestoneTitle, acceptanceHeading, provider, capabilities, projectMode) {
  const status = normalizedText(task.status)?.toLowerCase() ?? 'planned';
  const labels = statusLabels(status, provider, capabilities, projectMode);
  const issueNumber = Number.isInteger(task.issueNumber) && task.issueNumber > 0
    ? task.issueNumber
    : null;
  const title = normalizedText(task.title) ?? task.id;
  const acceptanceCriteria = acceptanceCriteriaFor(task);

  const payload = issueNumber
    ? {
        taskId: task.id,
        state: status === 'completed' || status === 'cancelled' ? 'closed' : 'open',
        labels,
        issueNumber,
        preserveNonManagedLabels: true,
        ...(normalizedText(task.expectedUpdatedAt) ? { expectedUpdatedAt: normalizedText(task.expectedUpdatedAt) } : {})
      }
    : {
        marker: `<!-- aapb:task:${task.id} -->`,
        taskId: task.id,
        title,
        state: status === 'completed' || status === 'cancelled' ? 'closed' : 'open',
        labels,
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

function groupIssueOperation({ group, tasks, provider, capabilities, projectMode, milestoneTitle, acceptanceHeading, language, planId }) {
  const status = aggregateGroupStatus(tasks);
  const issueNumber = Number.isInteger(group.issueNumber) && group.issueNumber > 0
    ? group.issueNumber
    : null;
  const payload = {
    marker: `<!-- aapb:group:${group.id} -->`,
    groupId: group.id,
    taskIds: tasks.map((task) => task.id),
    title: normalizedText(group.title) ?? group.id,
    body: renderGroupIssueBody({ group, tasks, status, language, planId }),
    state: ['completed', 'cancelled'].includes(status) ? 'closed' : 'open',
    labels: statusLabels(status, provider, capabilities, projectMode),
    milestoneTitle,
    acceptanceHeading,
    acceptanceCriteria: tasks.flatMap(acceptanceCriteriaFor)
  };
  if (issueNumber) {
    payload.issueNumber = issueNumber;
    payload.preserveNonManagedLabels = true;
    payload.preserveManagedBody = true;
    if (normalizedText(group.expectedUpdatedAt)) payload.expectedUpdatedAt = normalizedText(group.expectedUpdatedAt);
  }
  return operation({
    id: `group:${group.id}:issue`,
    idempotencyKey: `forge.sync.group.${stableKey(group.id)}.issue`,
    groupId: group.id,
    action: issueNumber ? 'update' : 'ensure',
    resource: 'issue',
    capability: 'issues',
    payload
  });
}

function statusLabels(status, provider, capabilities, projectMode) {
  if (status === 'ready') return ['status:ready'];
  if (provider === 'github' && projectMode === 'preferred' && capabilities?.projects === 'supported') return [];
  const fallback = FALLBACK_STATUS_BY_TASK[status];
  return fallback ? [fallback] : [];
}

function renderMilestoneDescription({ coordination, tasks, language }) {
  const ko = language === 'ko';
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const criteria = tasks.flatMap(acceptanceCriteriaFor);
  const passed = tasks.flatMap((task) => Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [])
    .filter((criterion) => criterion?.status === 'pass').length;
  return [
    `## ${ko ? '목적' : 'Purpose'}`,
    normalizedText(coordination.program?.summary) ?? normalizedText(coordination.program?.title),
    '',
    `## ${ko ? '완료 정의' : 'Completion definition'}`,
    ...normalizedStringValues(coordination.program?.successCriteria).map((item) => `- ${item}`),
    '',
    `## ${ko ? '현재 gate' : 'Current gate'}`,
    `- ${completed}/${tasks.length} ${ko ? '작업 완료' : 'tasks completed'}`,
    `- ${passed}/${criteria.length} ${ko ? '수용 기준 통과' : 'acceptance criteria passed'}`
  ].filter((line) => line !== null && line !== undefined).join('\n').trim();
}

function aggregateGroupStatus(tasks) {
  const statuses = tasks.map((task) => normalizedText(task.status)?.toLowerCase() ?? 'planned');
  if (statuses.length === 0) return 'planned';
  if (statuses.every((status) => status === 'completed')) return 'completed';
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled';
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.includes('paused')) return 'paused';
  if (statuses.some((status) => ['claimed', 'running', 'verifying'].includes(status))) return 'running';
  if (statuses.includes('review')) return 'review';
  if (statuses.includes('ready')) return 'ready';
  return 'planned';
}

function aggregatePriority(tasks) {
  if (tasks.length === 0) return 50;
  return Math.max(...tasks.map((task) => normalizedTaskPriority(task.priority)));
}

function aggregateRisk(tasks) {
  const rank = { low: 0, medium: 1, high: 2 };
  return tasks
    .map((task) => normalizedTaskRisk(task.risk))
    .sort((left, right) => rank[right] - rank[left])[0] ?? 'medium';
}

function aggregateProgress(tasks) {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => {
    const status = normalizedText(task.status)?.toLowerCase() ?? 'planned';
    return sum + normalizedTaskProgress(task.progress, status);
  }, 0);
  return Math.round(total / tasks.length);
}

function acceptanceCriteriaFor(task) {
  if (!Array.isArray(task?.acceptanceCriteria)) return [];
  return task.acceptanceCriteria
    .map((criterion) => typeof criterion === 'string' ? criterion : criterion?.text)
    .map(normalizedText)
    .filter(Boolean);
}

function coordinationLanguageSample(coordination, planTitle, tasks) {
  return [
    coordination?.program?.title,
    coordination?.program?.summary,
    planTitle,
    ...sortedGroups(coordination).flatMap((group) => [group.title, group.summary]),
    ...tasks.flatMap((task) => [task?.title, ...acceptanceCriteriaFor(task)])
  ].filter(Boolean).join(' ');
}

function publicPlanTitle(coordination, planTitle) {
  return normalizedText(coordination?.program?.title) ?? planTitle;
}

function sortedGroups(coordination) {
  return Array.isArray(coordination?.groups)
    ? [...coordination.groups].sort((left, right) => String(left?.id).localeCompare(String(right?.id)))
    : [];
}

function tasksForGroup(group, tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return [...new Set(Array.isArray(group?.taskIds) ? group.taskIds : [])]
    .map((taskId) => byId.get(taskId))
    .filter(Boolean)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
}

function coordinationConflicts({ coordination, issueMode, planId, planTitle, tasks }) {
  const conflicts = [];
  const program = coordination.program && typeof coordination.program === 'object' ? coordination.program : {};
  if (!planId || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(planId)) {
    conflicts.push({ id: 'forge.coordination.plan-id-required', message: 'Grouped forge coordination requires a portable planId.', status: 'invalid' });
  }
  if (!reviewableText(program.title ?? planTitle, 3)) {
    conflicts.push({ id: 'forge.coordination.program-title-required', message: 'Grouped forge coordination requires a public program title.', status: 'invalid' });
  }
  if (!reviewableText(program.summary, 8)) {
    conflicts.push({ id: 'forge.coordination.program-summary-required', message: 'Grouped forge coordination requires a reviewable program summary.', status: 'invalid' });
  }
  if (Number.isInteger(program.issueNumber) && program.issueNumber > 0 && !normalizedText(program.expectedUpdatedAt)) {
    conflicts.push({ id: 'forge.coordination.program-cas-required', message: 'Updating an existing roadmap issue requires program.expectedUpdatedAt.', status: 'invalid' });
  }
  for (const [field, id] of [
    ['scope', 'scope-required'],
    ['nonGoals', 'non-goals-required'],
    ['successCriteria', 'success-criteria-required']
  ]) {
    const entries = normalizedStringValues(program[field]);
    if (entries.length === 0 || entries.some((entry) => entry.length < 2)) {
      conflicts.push({ id: `forge.coordination.${id}`, message: `Grouped forge coordination requires at least one program ${field} entry.`, status: 'invalid' });
    }
  }
  if (issueMode === 'parent-only') return conflicts;

  const groups = sortedGroups(coordination);
  const configuredMax = coordination.maxChildIssues ?? 6;
  const maxChildIssues = Number.isInteger(configuredMax) && configuredMax >= 1 ? configuredMax : 6;
  if (groups.length === 0) {
    conflicts.push({ id: 'forge.coordination.groups-required', message: 'Delivery-group mode requires at least one group.', status: 'invalid' });
  }
  if (!Number.isInteger(configuredMax) || configuredMax < 1) {
    conflicts.push({ id: 'forge.coordination.max-child-issues-invalid', message: 'maxChildIssues must be a positive integer.', status: 'invalid' });
  } else if (groups.length > maxChildIssues) {
    conflicts.push({
      id: 'forge.coordination.too-many-groups',
      message: `Delivery-group mode permits at most ${maxChildIssues} child issues; received ${groups.length}.`,
      status: 'invalid'
    });
  }

  const taskIds = new Set(tasks.map((task) => task.id));
  const mapped = new Map();
  const groupIds = new Set();
  for (const group of groups) {
    const id = normalizedText(group?.id);
    if (!id || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) {
      conflicts.push({ id: 'forge.coordination.group-id-invalid', message: 'Delivery group identifiers must be portable stable IDs.', groupId: id, status: 'invalid' });
      continue;
    }
    if (groupIds.has(id)) conflicts.push({ id: 'forge.coordination.group-id-duplicate', message: `Delivery group identifier is duplicated: ${id}.`, groupId: id, status: 'invalid' });
    groupIds.add(id);
    if (!reviewableText(group.title, 3)) conflicts.push({ id: 'forge.coordination.group-title-required', message: `Delivery group ${id} requires a public title.`, groupId: id, status: 'invalid' });
    if (!reviewableText(group.summary, 8)) conflicts.push({ id: 'forge.coordination.group-summary-required', message: `Delivery group ${id} requires a reviewable summary.`, groupId: id, status: 'invalid' });
    if (!reviewableText(group.rollback, 5)) conflicts.push({ id: 'forge.coordination.group-rollback-required', message: `Delivery group ${id} requires rollback guidance.`, groupId: id, status: 'invalid' });
    if (Number.isInteger(group.issueNumber) && group.issueNumber > 0 && !normalizedText(group.expectedUpdatedAt)) {
      conflicts.push({ id: 'forge.coordination.group-cas-required', message: `Updating delivery group ${id} requires expectedUpdatedAt.`, groupId: id, status: 'invalid' });
    }
    const ids = Array.isArray(group.taskIds) ? group.taskIds : [];
    if (ids.length === 0) conflicts.push({ id: 'forge.coordination.group-tasks-required', message: `Delivery group ${id} must contain at least one task.`, groupId: id, status: 'invalid' });
    for (const taskId of ids) {
      if (!taskIds.has(taskId)) {
        conflicts.push({ id: 'forge.coordination.task-unknown', message: `Delivery group ${id} references unknown task ${String(taskId)}.`, groupId: id, taskId, status: 'invalid' });
        continue;
      }
      mapped.set(taskId, [...(mapped.get(taskId) ?? []), id]);
    }
  }
  for (const task of tasks) {
    const owners = mapped.get(task.id) ?? [];
    if (owners.length === 0) conflicts.push({ id: 'forge.coordination.task-unmapped', message: `Task ${task.id} is not assigned to a delivery group.`, taskId: task.id, status: 'invalid' });
    if (owners.length > 1) conflicts.push({ id: 'forge.coordination.task-multiply-mapped', message: `Task ${task.id} is assigned to more than one delivery group.`, taskId: task.id, status: 'invalid' });
  }
  return conflicts;
}

function presentationFindingsFor({ coordination, issueMode, language, planTitle, tasks }) {
  if (language !== 'ko') return [];
  const titleStyle = normalizedText(coordination?.titleStyle)?.toLowerCase() ?? 'auto';
  if (!['auto', 'noun-phrase'].includes(titleStyle)) return [];
  const titles = issueMode === 'task'
    ? tasks.map((task) => ({ path: `tasks.${task.id}.title`, title: task.title }))
    : [
        { path: 'coordination.program.title', title: publicPlanTitle(coordination, planTitle) },
        ...sortedGroups(coordination).map((group) => ({ path: `coordination.groups.${group.id}.title`, title: group.title }))
      ];
  return titles
    .filter(({ title }) => koreanSentenceTitle(title))
    .map(({ path, title }) => ({
      id: 'forge.presentation.korean-title-sentence-ending',
      severity: 'error',
      path,
      title: normalizedText(title),
      message: `Public Korean title must use a concise noun phrase instead of a sentence ending: ${normalizedText(title)}.`
    }));
}

function koreanSentenceTitle(value) {
  return /(?:한다|된다|이다|있다|없다|했다|됐다)[.!?]?$/u.test(normalizedText(value) ?? '');
}

function renderParentIssueBody({ coordination, tasks, language }) {
  const program = coordination.program ?? {};
  const groups = sortedGroups(coordination);
  const ko = language === 'ko';
  const groupRows = groups.length > 0
    ? groups.map((group) => {
        const groupTasks = tasksForGroup(group, tasks);
        return `- [${aggregateGroupStatus(groupTasks) === 'completed' ? 'x' : ' '}] ${safeMarkdown(group.title)} (${completedCount(groupTasks)}/${groupTasks.length})`;
      })
    : tasks.map((task) => `- [${task.status === 'completed' ? 'x' : ' '}] ${safeMarkdown(task.title)} \`${task.id}\``);
  const next = nextAction(groups, tasks, ko);
  const managed = [
    `## ${ko ? '목표' : 'Goal'}`,
    safeMarkdown(program.summary),
    `## ${ko ? '배경' : 'Background'}`,
    ko ? '세부 실행 사실과 검증 증거는 로컬 원장이 관리하며, 이 이슈는 사람이 검토할 프로그램 수준의 결정과 진척을 제공합니다.' : 'The local ledger owns execution facts and evidence; this issue presents program-level decisions and progress for human review.',
    `## ${ko ? '범위' : 'Scope'}`,
    ...markdownList(program.scope),
    `## ${ko ? '제외 범위' : 'Non-goals'}`,
    ...markdownList(program.nonGoals),
    `## ${ko ? '완료 조건' : 'Definition of done'}`,
    ...markdownChecklist(program.successCriteria),
    `## ${ko ? '진행 현황' : 'Progress'}`,
    ...(groupRows.length > 0 ? groupRows : [`- ${ko ? '등록된 작업 없음' : 'No registered work'}`]),
    `## ${ko ? '현재 게이트' : 'Current gate'}`,
    `- ${currentGate(tasks, ko)}`,
    `## ${ko ? '다음 행동' : 'Next action'}`,
    `- ${next}`,
    `## ${ko ? '관련 PR' : 'Related pull requests'}`,
    `- ${ko ? '연결된 PR은 동기화 댓글과 Project에서 갱신' : 'Linked pull requests are updated through the synchronization marker and Project'}`
  ].join('\n\n');
  return `<!-- aapb:managed:start -->\n\n${managed}\n\n<!-- aapb:managed:end -->`;
}

function renderGroupIssueBody({ group, tasks, status, language, planId }) {
  const ko = language === 'ko';
  const taskSections = tasks.flatMap((task) => [
    `### ${safeMarkdown(task.title)} \`${task.id}\``,
    ...markdownChecklist(acceptanceCriteriaFor(task))
  ]);
  const dependencies = tasks.flatMap((task) => {
    const dependsOn = Array.isArray(task.dependsOn) ? task.dependsOn : [];
    return dependsOn.length > 0 ? [`- \`${task.id}\` ← ${dependsOn.map((id) => `\`${id}\``).join(', ')}`] : [];
  });
  const technical = tasks.flatMap((task) => {
    const commands = verificationCommandsFor(task);
    const paths = normalizedStringValues(task.paths);
    return [
      `#### ${safeMarkdown(task.title)} \`${task.id}\``,
      ...(commands.length > 0 ? commands.map((command) => `- ${ko ? '검증' : 'Verify'}: \`${safeCode(command)}\``) : [`- ${ko ? '검증 명령 미지정' : 'No verification command specified'}`]),
      ...(paths.length > 0 ? paths.map((path) => `- ${ko ? '경로' : 'Path'}: \`${safeCode(path)}\``) : [])
    ];
  });
  const managed = [
    `## ${ko ? '목적' : 'Purpose'}`,
    safeMarkdown(group.summary),
    `## ${ko ? '결과물' : 'Deliverables'}`,
    ...tasks.map((task) => `- ${task.status === 'completed' ? (ko ? '완료' : 'Done') : (ko ? '대기' : 'Pending')} · ${safeMarkdown(task.title)} \`${task.id}\``),
    `## ${ko ? '수용 기준' : 'Acceptance criteria'}`,
    ...(taskSections.length > 0 ? taskSections : [`- ${ko ? '등록된 기준 없음' : 'No registered criteria'}`]),
    `## ${ko ? '의존성' : 'Dependencies'}`,
    ...(dependencies.length > 0 ? dependencies : [`- ${ko ? '선행 작업 없음' : 'No prerequisites'}`]),
    `## ${ko ? '위험과 복구' : 'Risk and recovery'}`,
    `- ${ko ? '현재 위험도' : 'Current risk'}: ${aggregateRisk(tasks)}`,
    `- ${ko ? '복구' : 'Rollback'}: ${safeMarkdown(group.rollback)}`,
    `## ${ko ? '현재 상태' : 'Current status'}`,
    `- ${status}`,
    '<details>',
    `<summary>${ko ? '기술 상세(검증 명령과 경로)' : 'Technical details (verification commands and paths)'}</summary>`,
    '',
    ...technical,
    '',
    '</details>'
  ].join('\n\n');
  const ownership = normalizedText(planId) ? `<!-- aapb:plan-owner:${planId} -->\n\n` : '';
  return `${ownership}<!-- aapb:managed:start -->\n\n${managed}\n\n<!-- aapb:managed:end -->`;
}

function verificationCommandsFor(task) {
  if (!Array.isArray(task?.verificationCommands)) return [];
  return task.verificationCommands.flatMap((command) => {
    if (typeof command === 'string') return normalizedText(command) ? [normalizedText(command)] : [];
    if (!Array.isArray(command?.argv)) return [];
    return [redactPublicArgv(command.argv).map((argument) => commandArgument(argument)).join(' ')];
  });
}

function commandArgument(value) {
  const text = String(value);
  return /\s/.test(text) ? JSON.stringify(text) : text;
}

function normalizedStringValues(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => typeof entry === 'string' ? entry : entry?.text).map(normalizedText).filter(Boolean);
}

function markdownList(values) {
  return normalizedStringValues(values).map((value) => `- ${safeMarkdown(value)}`);
}

function markdownChecklist(values) {
  return normalizedStringValues(values).map((value) => `- [ ] ${safeMarkdown(value)}`);
}

function safeMarkdown(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/<!--/g, '&lt;!--').trim();
}

function safeCode(value) {
  return String(value ?? '').replace(/`/g, '\\`').replace(/[\r\n]+/g, ' ').trim();
}

function completedCount(tasks) {
  return tasks.filter((task) => task.status === 'completed').length;
}

function currentGate(tasks, ko) {
  const status = aggregateGroupStatus(tasks);
  const labels = {
    planned: ko ? '계획 승인 및 의존성 해소 대기' : 'Waiting for plan approval and dependencies',
    ready: ko ? '실행 가능 작업 있음' : 'Ready work is available',
    running: ko ? '구현 또는 검증 진행 중' : 'Implementation or verification in progress',
    review: ko ? '검토 대기' : 'Waiting for review',
    blocked: ko ? '차단 원인 해소 필요' : 'Blocker resolution required',
    paused: ko ? '재개 승인 대기' : 'Waiting for resume approval',
    completed: ko ? '완료' : 'Complete',
    cancelled: ko ? '취소' : 'Cancelled'
  };
  return labels[status] ?? status;
}

function nextAction(groups, tasks, ko) {
  const ready = tasks.find((task) => task.status === 'ready');
  if (ready) return `${safeMarkdown(ready.title)} \`${ready.id}\``;
  const active = tasks.find((task) => ['claimed', 'running', 'verifying', 'review'].includes(task.status));
  if (active) return `${safeMarkdown(active.title)} \`${active.id}\``;
  if (tasks.every((task) => ['completed', 'cancelled'].includes(task.status))) return ko ? '최종 검증 결과 검토' : 'Review final verification results';
  return ko ? '계획 승인과 선행 작업 확인' : 'Review plan approval and prerequisites';
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

function missingProjectsCapabilityConflict(unavailableFeatures) {
  return {
    id: 'forge.scope.projects-missing',
    message: 'GitHub Projects is preferred but required Project or View capabilities are unavailable. No remote writes are allowed; run `gh auth refresh -s project`, then `aapb forge status .`, or explicitly allow the projects,views fallback.',
    status: 'blocked',
    unavailableFeatures: [...unavailableFeatures],
    fallback: 'milestone',
    remediations: [
      { argv: ['gh', 'auth', 'refresh', '-s', 'project'], interactive: true },
      { argv: ['aapb', 'forge', 'status', '.'], interactive: false }
    ]
  };
}

function deduplicateWarnings(warnings) {
  const byKey = new Map();
  for (const warning of warnings) {
    byKey.set(`${warning.id}:${warning.capability}:${warning.state}`, warning);
  }
  return [...byKey.values()];
}

function planResult({ kind, provider, operations, plannedOperations = operations, warnings, conflicts, presentationFindings = [], publicTitles = [], bodyCompleteness = { complete: 0, total: 0 } }) {
  const artifacts = artifactCounts(plannedOperations);
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
      plannedOperations: plannedOperations.length,
      fallback: operations.filter((item) => item.mode === 'fallback').length,
      warnings: warnings.length,
      conflicts: conflicts.length,
      artifacts,
      presentationFindings: presentationFindings.length,
      publicTitles,
      bodyCompleteness
    },
    operations,
    presentationFindings,
    warnings,
    conflicts
  };
}

function artifactCounts(operations) {
  const issues = operations.filter((item) => item.resource === 'issue');
  return {
    issuesUpdated: issues.filter((item) => item.action === 'update').length,
    issuesClosed: issues.filter((item) => item.action === 'close').length,
    parentIssues: issues.filter((item) => item.id.startsWith('plan:')).length,
    groupIssues: issues.filter((item) => item.id.startsWith('group:')).length,
    taskIssues: issues.filter((item) => item.id.startsWith('task:')).length,
    subIssueLinks: operations.filter((item) => item.resource === 'sub-issue').length,
    projects: operations.filter((item) => item.resource === 'project').length,
    views: operations.filter((item) => item.resource === 'view').length,
    labels: operations.filter((item) => item.resource === 'label').length,
    milestones: operations.filter((item) => item.resource === 'milestone').length,
    pullRequests: operations.filter((item) => item.resource === 'draft-pull-request').length,
    projectItems: operations.filter((item) => item.resource === 'project-item').length
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

function reviewableText(value, minimumLength) {
  return (normalizedText(value)?.length ?? 0) >= minimumLength;
}
