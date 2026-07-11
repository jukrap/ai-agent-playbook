import path from 'node:path';

export const WORKFLOW_PLAN_SCHEMA_VERSION = '2';
export const WORKFLOW_PLAN_KIND = 'workflow.plan.v2';

const STABLE_ID = /^[a-z0-9][a-z0-9._-]{0,99}$/;
const RISKS = new Set(['low', 'medium', 'high']);
const APPROVAL_STATUSES = new Set(['draft', 'approved', 'rejected', 'superseded']);

export const TASK_STATUSES = Object.freeze([
  'planned',
  'ready',
  'claimed',
  'running',
  'verifying',
  'review',
  'completed',
  'paused',
  'blocked',
  'cancelled'
]);

export const RUN_STATUSES = Object.freeze([
  'planned',
  'running',
  'paused',
  'blocked',
  'completed',
  'cancelled'
]);

export function validateWorkflowPlan(input, options = {}) {
  const conflicts = [];
  const warnings = [];
  const plan = isRecord(input) ? structuredClone(input) : {};

  if (plan.schemaVersion !== WORKFLOW_PLAN_SCHEMA_VERSION) {
    conflicts.push(conflict('automation.plan.schema-version', 'schemaVersion must be "2".'));
  }
  if (plan.kind !== WORKFLOW_PLAN_KIND) {
    conflicts.push(conflict('automation.plan.kind', `kind must be "${WORKFLOW_PLAN_KIND}".`));
  }
  if (!isStableId(plan.planId)) {
    conflicts.push(conflict('automation.plan.plan-id-invalid', 'planId must be a stable lowercase hyphenated id.'));
  }
  if (!hasText(plan.title)) {
    conflicts.push(conflict('automation.plan.title-missing', 'title must be a non-empty string.'));
  }
  if (!isRecord(plan.approval) || !APPROVAL_STATUSES.has(plan.approval.status)) {
    conflicts.push(conflict('automation.plan.approval-invalid', 'approval.status must be draft, approved, rejected, or superseded.'));
  } else if (plan.approval.status !== 'approved') {
    if (options.requireApproved === true) {
      conflicts.push(conflict('automation.plan.not-approved', 'Plan must be approved before automation can start.'));
    } else {
      warnings.push(warning('automation.plan.not-approved', 'Plan is not approved for automation.'));
    }
  }
  if (plan.sourcePath !== undefined && !isSafeRelativePath(plan.sourcePath)) {
    conflicts.push(conflict('automation.plan.path-unsafe', 'sourcePath must be a safe project-relative path.', ['sourcePath']));
  } else if (plan.sourcePath !== undefined) {
    plan.sourcePath = normalizePortablePath(plan.sourcePath);
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    conflicts.push(conflict('automation.plan.tasks-missing', 'tasks must be a non-empty array.'));
    plan.tasks = [];
  } else {
    plan.tasks = plan.tasks.map((task, index) => normalizeTask(task, index, conflicts, warnings));
    validateTaskGraph(plan.tasks, conflicts);
  }

  return {
    schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
    kind: 'automation.plan-validation',
    ok: conflicts.length === 0,
    ready: conflicts.length === 0 && plan.approval?.status === 'approved' && plan.tasks.every(taskIsComplete),
    plan,
    warnings,
    conflicts
  };
}

export function createInitialRunState(input, options = {}) {
  const validation = validateWorkflowPlan(input, { requireApproved: true });
  if (!validation.ok) {
    throw new Error(`Workflow plan validation failed: ${validation.conflicts.map((item) => item.id).join(', ')}`);
  }
  if (!validation.ready) {
    throw new Error('Workflow plan must be complete before automation can start.');
  }
  const {
    runId = `${validation.plan.planId}-run`,
    createdAt = new Date().toISOString(),
    maxAttempts = 3
  } = options;
  if (!isStableId(runId)) throw new Error('runId must be a stable lowercase hyphenated id.');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error('maxAttempts must be a positive integer.');

  const state = {
    schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
    kind: 'automation.run-state',
    runId,
    planId: validation.plan.planId,
    planTitle: validation.plan.title,
    runStatus: 'planned',
    pauseReason: null,
    createdAt,
    updatedAt: createdAt,
    lastEventSequence: 0,
    tasks: validation.plan.tasks.map((task, index) => runtimeTaskFromPlan(task, index, maxAttempts, createdAt))
  };
  state.progress = calculateProgress(state);
  return state;
}

export function selectNextReadyTask(state) {
  if (!isRecord(state) || !Array.isArray(state.tasks)) return null;
  if (['paused', 'blocked', 'completed', 'cancelled'].includes(state.runStatus)) return null;
  const ready = state.tasks.filter((task) => task.status === 'ready');
  ready.sort((left, right) => (
    right.priority - left.priority ||
    left.order - right.order ||
    left.id.localeCompare(right.id)
  ));
  return ready[0] ?? null;
}

export function reduceRunEvents(plan, events, options = {}) {
  if (!Array.isArray(events)) throw new Error('events must be an array.');
  return events.reduce((state, event) => reduceRunEvent(state, event), createInitialRunState(plan, options));
}

export function reduceRunEvent(inputState, inputEvent) {
  if (!isRecord(inputState) || inputState.kind !== 'automation.run-state') {
    throw new Error('state must be an automation.run-state object.');
  }
  if (!isRecord(inputEvent) || !hasText(inputEvent.type)) throw new Error('event.type is required.');
  const event = structuredClone(inputEvent);
  const expectedSequence = inputState.lastEventSequence + 1;
  if (!Number.isInteger(event.sequence) || event.sequence !== expectedSequence) {
    throw new Error(`event.sequence must be ${expectedSequence}.`);
  }
  const state = structuredClone(inputState);
  const task = event.taskId === undefined ? null : taskById(state, event.taskId);

  switch (event.type) {
    case 'run.started':
      transitionRun(state, ['planned'], 'running', event);
      break;
    case 'run.paused':
      transitionRun(state, ['planned', 'running', 'blocked'], 'paused', event);
      state.pauseReason = hasText(event.reason) ? event.reason.trim() : 'operator';
      break;
    case 'run.reconcile-required':
      transitionRun(state, ['planned', 'running', 'blocked'], 'paused', event);
      state.pauseReason = 'needs-reconcile';
      break;
    case 'run.resumed':
      transitionRun(state, ['paused', 'blocked'], 'running', event);
      state.pauseReason = null;
      break;
    case 'run.blocked':
      transitionRun(state, ['planned', 'running', 'paused'], 'blocked', event);
      state.pauseReason = hasText(event.reason) ? event.reason.trim() : 'blocked';
      break;
    case 'run.cancelled':
      transitionRun(state, ['planned', 'running', 'paused', 'blocked'], 'cancelled', event);
      break;
    case 'run.completed':
      if (!state.tasks.every((item) => item.status === 'completed')) {
        throw new Error('run.completed requires every task to be completed.');
      }
      transitionRun(state, ['running', 'completed'], 'completed', event);
      break;
    case 'task.claimed':
      transitionTask(task, ['ready'], 'claimed', event);
      task.claimedBy = hasText(event.ownerId) ? event.ownerId.trim() : null;
      break;
    case 'task.added': {
      if (['completed', 'cancelled'].includes(state.runStatus)) throw new Error('task.added cannot reopen a terminal run.');
      const conflicts = [];
      const warnings = [];
      const normalized = normalizeTask(event.task, state.tasks.length, conflicts, warnings);
      if (conflicts.length > 0 || !taskIsComplete(normalized)) throw new Error('task.added contains an invalid automation task.');
      if (state.tasks.some((candidate) => candidate.id === normalized.id)) throw new Error(`task.added duplicates task ${normalized.id}.`);
      if (normalized.dependsOn.some((dependency) => !state.tasks.some((candidate) => candidate.id === dependency))) {
        throw new Error(`task.added contains an unknown dependency for ${normalized.id}.`);
      }
      const maxAttempts = Number.isInteger(event.maxAttempts) && event.maxAttempts > 0 ? event.maxAttempts : 3;
      state.tasks.push(runtimeTaskFromPlan(normalized, state.tasks.length, maxAttempts, event.timeUtc ?? state.updatedAt));
      if (state.runStatus === 'blocked') {
        state.runStatus = 'running';
        state.pauseReason = null;
      }
      break;
    }
    case 'task.started':
      transitionTask(task, ['claimed'], 'running', event);
      break;
    case 'task.workspace-prepared':
      if (!task || task.status !== 'running') {
        throw new Error('task.workspace-prepared requires a running task.');
      }
      task.workspace = normalizeWorkspaceCheckpoint(event.workspace, event);
      task.updatedAt = hasText(event.timeUtc) ? event.timeUtc : task.updatedAt;
      break;
    case 'task.remote-linked': {
      if (!task || !['planned', 'ready'].includes(task.status)) {
        throw new Error('task.remote-linked requires an unclaimed planned or ready task.');
      }
      const sourceConflicts = [];
      const source = normalizeTaskSource(event.source, `tasks.${task.id}`, sourceConflicts);
      if (!source || sourceConflicts.length > 0) throw new Error('task.remote-linked contains an invalid forge issue source.');
      if (task.source && task.source.issueNumber !== source.issueNumber) {
        throw new Error('task.remote-linked cannot replace an existing forge issue link.');
      }
      task.source = source;
      task.updatedAt = hasText(event.timeUtc) ? event.timeUtc : task.updatedAt;
      break;
    }
    case 'task.requirements-reconciled':
      reconcileTaskRequirements(task, event);
      break;
    case 'task.verifying':
      transitionTask(task, ['running'], 'verifying', event);
      break;
    case 'task.review-requested':
      if (task.delivery?.status !== 'succeeded') {
        throw new Error(`task.review-requested requires a durable delivery checkpoint for ${task.id}.`);
      }
      transitionTask(task, ['verifying'], 'review', event);
      break;
    case 'task.delivery-recorded':
      if (!task || task.status !== 'verifying') {
        throw new Error('task.delivery-recorded requires a verifying task.');
      }
      task.delivery = normalizeDeliveryCheckpoint(event.delivery, event);
      task.updatedAt = hasText(event.timeUtc) ? event.timeUtc : task.updatedAt;
      break;
    case 'task.completed':
      if (!task.criteria.every((criterion) => criterion.status === 'pass')) {
        throw new Error(`task.completed requires all criteria to pass for ${task.id}.`);
      }
      transitionTask(task, ['review'], 'completed', event);
      break;
    case 'task.attempt-failed':
      if (!['claimed', 'running', 'verifying', 'review'].includes(task?.status)) {
        throw new Error(`task.attempt-failed requires an active task attempt.`);
      }
      task.attempts += 1;
      task.lastFailure = {
        reason: hasText(event.reason) ? event.reason.trim() : 'attempt-failed',
        timeUtc: hasText(event.timeUtc) ? event.timeUtc : null
      };
      task.claimedBy = null;
      task.delivery = null;
      for (const criterion of task.criteria) {
        criterion.status = 'pending';
        criterion.evidence = [];
        criterion.updatedAt = hasText(event.timeUtc) ? event.timeUtc : null;
      }
      task.updatedAt = hasText(event.timeUtc) ? event.timeUtc : task.updatedAt;
      if (task.attempts >= task.maxAttempts) {
        task.status = 'blocked';
        task.blocker = 'attempt-limit';
      } else {
        task.status = 'ready';
        task.blocker = null;
      }
      break;
    case 'task.paused':
      if (!task) throw new Error('task.paused requires taskId.');
      task.statusBeforePause = task.status;
      transitionTask(task, ['ready', 'claimed', 'running', 'verifying', 'review'], 'paused', event);
      task.pauseReason = hasText(event.reason) ? event.reason.trim() : 'operator';
      task.claimedBy = null;
      break;
    case 'task.resumed':
      transitionTask(task, ['paused'], dependenciesCompleted(state, task) ? 'ready' : 'planned', event);
      task.pauseReason = null;
      task.statusBeforePause = null;
      break;
    case 'task.blocked':
      transitionTask(task, ['ready', 'claimed', 'running', 'verifying', 'review', 'paused'], 'blocked', event);
      task.blocker = hasText(event.reason) ? event.reason.trim() : 'blocked';
      break;
    case 'task.unblocked':
      transitionTask(task, ['blocked'], dependenciesCompleted(state, task) ? 'ready' : 'planned', event);
      task.blocker = null;
      if (event.resetAttempts === true) {
        task.attempts = 0;
        task.lastFailure = null;
      }
      break;
    case 'task.cancelled':
      transitionTask(task, ['planned', 'ready', 'claimed', 'running', 'verifying', 'review', 'paused', 'blocked'], 'cancelled', event);
      break;
    case 'criterion.passed':
      updateCriterion(task, event, 'pass');
      break;
    case 'criterion.failed':
      updateCriterion(task, event, 'fail');
      break;
    default:
      throw new Error(`Unsupported run event type: ${event.type}.`);
  }

  state.lastEventSequence = event.sequence;
  state.updatedAt = hasText(event.timeUtc) ? event.timeUtc : state.updatedAt;
  refreshReadyTasks(state);
  if (state.tasks.length > 0 && state.tasks.every((item) => item.status === 'completed')) {
    state.runStatus = 'completed';
    state.pauseReason = null;
  } else if (
    ['planned', 'running'].includes(state.runStatus) &&
    state.tasks.some((item) => item.status === 'blocked') &&
    !state.tasks.some((item) => ['ready', 'claimed', 'running', 'verifying', 'review'].includes(item.status))
  ) {
    state.runStatus = 'blocked';
    state.pauseReason = 'task-blocked';
  }
  state.progress = calculateProgress(state);
  return state;
}

function runtimeTaskFromPlan(task, order, maxAttempts, createdAt) {
  return {
    id: task.id,
    title: task.title,
    status: task.dependsOn.length === 0 ? 'ready' : 'planned',
    dependsOn: [...task.dependsOn],
    priority: task.priority,
    risk: task.risk,
    deliveryGroup: task.deliveryGroup,
    remoteEligible: task.remoteEligible,
    source: task.source ? structuredClone(task.source) : null,
    paths: [...task.paths],
    verificationCommands: structuredClone(task.verificationCommands),
    criteria: task.acceptanceCriteria.map((criterion) => ({
      ...structuredClone(criterion),
      status: 'pending',
      evidence: []
    })),
    attempts: 0,
    maxAttempts,
    order,
    claimedBy: null,
    blocker: null,
    pauseReason: null,
    lastFailure: null,
    delivery: null,
    workspace: null,
    statusBeforePause: null,
    updatedAt: createdAt
  };
}

export function calculateProgress(state) {
  const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
  const criteria = tasks.flatMap((task) => Array.isArray(task.criteria) ? task.criteria : []);
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const passedCriteria = criteria.filter((criterion) => criterion.status === 'pass').length;
  return {
    tasks: progressPart(completedTasks, tasks.length),
    criteria: progressPart(passedCriteria, criteria.length, 'passed')
  };
}

export function readCompatibleRunInput(input) {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    return {
      schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
      kind: 'automation.run-state-view',
      runId: null,
      planId: null,
      planTitle: null,
      runStatus: 'planned',
      tasks: [],
      progress: {
        tasks: progressPart(0, 0),
        criteria: progressPart(0, 0, 'passed')
      },
      compatibility: {
        source: 'empty',
        sourceSchemaVersion: null,
        readOnly: true
      }
    };
  }

  if (input.schemaVersion === WORKFLOW_PLAN_SCHEMA_VERSION && input.kind === 'automation.run-state') {
    const state = structuredClone(input);
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.progress = calculateProgress(state);
    return state;
  }

  const legacyInput = structuredClone(input);
  const criteria = Array.isArray(legacyInput.criteria) ? legacyInput.criteria : [];
  const completedCriteria = criteria.filter((criterion) => ['pass', 'done', 'completed'].includes(String(criterion?.status ?? '').toLowerCase())).length;
  const legacyTasks = Array.isArray(legacyInput.tasks) ? legacyInput.tasks : [];
  const completedTasks = legacyTasks.filter((task) => ['done', 'completed'].includes(String(task?.status ?? '').toLowerCase())).length;
  return {
    schemaVersion: WORKFLOW_PLAN_SCHEMA_VERSION,
    kind: 'automation.run-state-view',
    runId: hasText(legacyInput.runId) ? legacyInput.runId : null,
    planId: hasText(legacyInput.planId) ? legacyInput.planId : null,
    runStatus: legacyRunStatus(legacyInput.status),
    tasks: [],
    progress: {
      tasks: progressPart(completedTasks, legacyTasks.length),
      criteria: progressPart(completedCriteria, criteria.length, 'passed')
    },
    compatibility: {
      source: 'legacy',
      sourceSchemaVersion: String(legacyInput.schemaVersion ?? '1'),
      readOnly: true
    },
    legacyInput
  };
}

function normalizeTask(input, index, conflicts, warnings) {
  const task = isRecord(input) ? input : {};
  const location = `tasks[${index}]`;
  if (!isStableId(task.id)) {
    conflicts.push(conflict('automation.plan.task-id-invalid', `${location}.id must be a stable lowercase hyphenated id.`, [location]));
  }
  if (!hasText(task.title)) {
    conflicts.push(conflict('automation.plan.task-title-missing', `${location}.title must be a non-empty string.`, [location]));
  }
  if (!Array.isArray(task.dependsOn)) {
    conflicts.push(conflict('automation.plan.dependencies-invalid', `${location}.dependsOn must be an array.`, [location]));
  } else {
    const dependencies = new Set();
    for (const dependency of task.dependsOn) {
      if (!isStableId(dependency)) {
        conflicts.push(conflict('automation.plan.dependency-id-invalid', `${location}.dependsOn contains an invalid task id.`, [location]));
      }
      if (dependencies.has(dependency)) {
        conflicts.push(conflict('automation.plan.dependency-duplicate', `${location}.dependsOn contains duplicate task id ${dependency}.`, [location]));
      }
      dependencies.add(dependency);
    }
  }
  if (!Number.isInteger(task.priority) || task.priority < 0 || task.priority > 1000) {
    conflicts.push(conflict('automation.plan.priority-invalid', `${location}.priority must be an integer from 0 to 1000.`, [location]));
  }
  if (!RISKS.has(task.risk)) {
    conflicts.push(conflict('automation.plan.risk-invalid', `${location}.risk is invalid.`, [location]));
  }
  if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
    if (!Array.isArray(task.acceptanceCriteria)) {
      conflicts.push(conflict('automation.plan.criteria-invalid', `${location}.acceptanceCriteria must be an array.`, [location]));
    } else {
      warnings.push(warning('automation.plan.criteria-missing', `${location}.acceptanceCriteria is empty.`, [location]));
    }
  } else {
    const criterionIds = new Set();
    for (const [criterionIndex, criterion] of task.acceptanceCriteria.entries()) {
      const criterionLocation = `${location}.acceptanceCriteria[${criterionIndex}]`;
      if (!isRecord(criterion) || !isStableId(criterion.id)) {
        conflicts.push(conflict('automation.plan.criterion-id-invalid', `${criterionLocation}.id must be a stable lowercase hyphenated id.`, [location]));
      } else if (criterionIds.has(criterion.id)) {
        conflicts.push(conflict('automation.plan.criterion-id-duplicate', `${location}.acceptanceCriteria contains duplicate id ${criterion.id}.`, [location]));
      }
      if (!isRecord(criterion) || !hasText(criterion.text)) {
        conflicts.push(conflict('automation.plan.criterion-text-invalid', `${criterionLocation}.text must be a non-empty string.`, [location]));
      }
      if (isRecord(criterion)) criterionIds.add(criterion.id);
    }
  }
  if (!Array.isArray(task.verificationCommands)) {
    conflicts.push(conflict('automation.plan.verification-invalid', `${location}.verificationCommands must be an array.`, [location]));
  } else if (task.verificationCommands.length === 0) {
    warnings.push(warning('automation.plan.verification-missing', `${location}.verificationCommands is empty.`, [location]));
  } else {
    const commandIds = new Set();
    for (const command of task.verificationCommands) {
      if (!isRecord(command) || !isStableId(command.id) || !isSafeArgv(command.argv)) {
        conflicts.push(conflict('automation.plan.verification-invalid', `${location}.verificationCommands must contain safe { id, argv } objects.`, [location]));
        continue;
      }
      if (commandIds.has(command.id)) {
        conflicts.push(conflict('automation.plan.verification-id-duplicate', `${location}.verificationCommands contains duplicate id ${command.id}.`, [location]));
      }
      commandIds.add(command.id);
    }
  }
  if (!isStableId(task.deliveryGroup)) {
    conflicts.push(conflict('automation.plan.delivery-group-invalid', `${location}.deliveryGroup must be a stable lowercase hyphenated id.`, [location]));
  }
  if (typeof task.remoteEligible !== 'boolean') {
    conflicts.push(conflict('automation.plan.remote-eligibility-invalid', `${location}.remoteEligible must be boolean.`, [location]));
  }
  const source = normalizeTaskSource(task.source, location, conflicts);

  const paths = task.paths === undefined ? [] : task.paths;
  if (!Array.isArray(paths)) {
    conflicts.push(conflict('automation.plan.path-unsafe', `${location}.paths must be an array of safe project-relative paths.`, [location]));
  } else {
    for (const taskPath of paths) {
      if (!isSafeRelativePath(taskPath)) {
        conflicts.push(conflict('automation.plan.path-unsafe', `${location}.paths contains an unsafe path.`, [location]));
      }
    }
  }

  return {
    ...task,
    dependsOn: Array.isArray(task.dependsOn) ? [...task.dependsOn] : [],
    acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? structuredClone(task.acceptanceCriteria) : [],
    verificationCommands: Array.isArray(task.verificationCommands) ? structuredClone(task.verificationCommands) : [],
    source,
    paths: Array.isArray(paths) ? paths.map((value) => normalizePortablePath(value)) : []
  };
}

function normalizeTaskSource(value, location, conflicts) {
  if (value === undefined || value === null) return null;
  if (
    !isRecord(value) ||
    value.kind !== 'forge-issue' ||
    value.source !== 'forge' ||
    value.trust !== 'untrusted-data' ||
    value.promptPolicy !== 'data-only' ||
    !Number.isInteger(value.issueNumber) ||
    value.issueNumber < 1
  ) {
    conflicts.push(conflict('automation.plan.task-source-invalid', `${location}.source must be a tagged forge-issue data source.`, [location]));
    return null;
  }
  const snapshot = isRecord(value.snapshot) ? value.snapshot : {};
  return {
    kind: 'forge-issue',
    source: 'forge',
    trust: 'untrusted-data',
    promptPolicy: 'data-only',
    provider: ['github', 'gitea'].includes(value.provider) ? value.provider : null,
    repository: hasText(value.repository) ? String(value.repository).slice(0, 240) : null,
    issueNumber: value.issueNumber,
    remoteTaskId: isStableId(value.remoteTaskId) ? value.remoteTaskId : null,
    requiresLocalExecutionMapping: value.requiresLocalExecutionMapping === true,
    criteriaSource: hasText(value.criteriaSource) ? String(value.criteriaSource).slice(0, 80) : null,
    labels: Array.isArray(value.labels)
      ? value.labels.filter(hasText).slice(0, 100).map((label) => String(label).slice(0, 100))
      : [],
    snapshot: {
      title: hasText(snapshot.title) ? String(snapshot.title).slice(0, 1000) : '',
      body: typeof snapshot.body === 'string' ? snapshot.body.slice(0, 16_000) : '',
      acceptanceCriteria: Array.isArray(snapshot.acceptanceCriteria)
        ? snapshot.acceptanceCriteria.filter(hasText).slice(0, 50).map((item) => String(item).slice(0, 1000))
        : [],
      updatedAt: hasText(snapshot.updatedAt) ? String(snapshot.updatedAt).slice(0, 80) : null
    }
  };
}

function validateTaskGraph(tasks, conflicts) {
  const ids = new Set();
  for (const task of tasks) {
    if (ids.has(task.id)) {
      conflicts.push(conflict('automation.plan.task-id-duplicate', `Duplicate task id: ${task.id}.`, [`tasks.${task.id}`]));
    }
    ids.add(task.id);
  }
  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!ids.has(dependency)) {
        conflicts.push(conflict('automation.plan.dependency-unknown', `Task ${task.id} depends on unknown task ${dependency}.`, [`tasks.${task.id}`]));
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  let cycleFound = false;
  function visit(taskId) {
    if (visiting.has(taskId)) {
      cycleFound = true;
      return;
    }
    if (visited.has(taskId)) return;
    visiting.add(taskId);
    for (const dependency of tasksById.get(taskId)?.dependsOn ?? []) {
      if (tasksById.has(dependency)) visit(dependency);
    }
    visiting.delete(taskId);
    visited.add(taskId);
  }
  for (const task of tasks) visit(task.id);
  if (cycleFound) {
    conflicts.push(conflict('automation.plan.dependency-cycle', 'Task dependencies must form an acyclic graph.'));
  }
}

function taskById(state, taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error(`Unknown task id: ${taskId}.`);
  return task;
}

function transitionRun(state, allowed, nextStatus, event) {
  if (!allowed.includes(state.runStatus)) {
    throw new Error(`Invalid run transition for ${event.type}: ${state.runStatus} -> ${nextStatus}.`);
  }
  state.runStatus = nextStatus;
}

function transitionTask(task, allowed, nextStatus, event) {
  if (!task) throw new Error(`${event.type} requires taskId.`);
  if (!allowed.includes(task.status)) {
    throw new Error(`Invalid task transition for ${event.type}: ${task.status} -> ${nextStatus}.`);
  }
  task.status = nextStatus;
  task.updatedAt = hasText(event.timeUtc) ? event.timeUtc : task.updatedAt;
}

function updateCriterion(task, event, status) {
  if (!task) throw new Error(`${event.type} requires taskId.`);
  if (!['verifying', 'review'].includes(task.status)) {
    throw new Error(`${event.type} requires task ${task.id} to be verifying or in review.`);
  }
  const criterion = task.criteria.find((item) => item.id === event.criterionId);
  if (!criterion) throw new Error(`Unknown criterion id ${event.criterionId} for task ${task.id}.`);
  criterion.status = status;
  criterion.updatedAt = hasText(event.timeUtc) ? event.timeUtc : null;
  criterion.evidence = Array.isArray(event.evidence) ? structuredClone(event.evidence) : criterion.evidence;
}

function normalizeDeliveryCheckpoint(value, event) {
  if (!isRecord(value) || !['committed', 'succeeded'].includes(value.status)) {
    throw new Error('task.delivery-recorded requires a committed or succeeded delivery object.');
  }
  const bounded = (item, maximum) => {
    if (item === null || item === undefined) return null;
    if (typeof item !== 'string' || /[\u0000\r\n]/.test(item) || item.length > maximum) {
      throw new Error('task.delivery-recorded contains unsafe delivery text.');
    }
    return item;
  };
  if (!Array.isArray(value.operations) || !value.operations.every((item) => typeof item === 'string' && /^[a-z0-9-]{1,80}$/.test(item))) {
    throw new Error('task.delivery-recorded contains invalid delivery operations.');
  }
  const baselineHead = normalizeCheckpointOid(value.baselineHead);
  const commitHead = normalizeCheckpointOid(value.commitHead);
  if (value.status === 'committed' && (!baselineHead || !commitHead)) {
    throw new Error('A committed delivery checkpoint requires baselineHead and commitHead OIDs.');
  }
  return {
    status: value.status,
    attemptNumber: Number.isInteger(value.attemptNumber) && value.attemptNumber > 0 ? value.attemptNumber : 1,
    workspace: bounded(value.workspace, 4096),
    branch: bounded(value.branch, 240),
    baseBranch: bounded(value.baseBranch, 240),
    baselineHead,
    commitHead,
    remoteUrl: bounded(value.remoteUrl, 2048),
    preexistingChanges: normalizePreexistingChanges(value.preexistingChanges),
    skipped: value.skipped === true,
    reason: bounded(value.reason, 240),
    operations: [...new Set(value.operations)],
    recordedAt: hasText(event.timeUtc) ? event.timeUtc : null
  };
}

function normalizeWorkspaceCheckpoint(value, event) {
  if (!isRecord(value)) throw new Error('task.workspace-prepared requires workspace identity.');
  const bounded = (item, maximum, name) => {
    if (item === null || item === undefined) return null;
    if (typeof item !== 'string' || /[\u0000\r\n]/.test(item) || item.length > maximum) {
      throw new Error(`task.workspace-prepared contains invalid ${name}.`);
    }
    return item;
  };
  const workspace = bounded(value.workspace, 4096, 'workspace path');
  const branch = bounded(value.branch, 240, 'branch');
  const baseBranch = bounded(value.baseBranch, 240, 'base branch');
  const remoteUrl = bounded(value.remoteUrl, 2048, 'remote URL');
  const baselineHead = normalizeCheckpointOid(value.baselineHead);
  if (!workspace || !branch || !branch.startsWith('aapb/') || branch.includes('..') || !baselineHead) {
    throw new Error('task.workspace-prepared requires an aapb/ branch, workspace path, and baseline HEAD OID.');
  }
  return {
    workspace,
    branch,
    baseBranch,
    baselineHead,
    remoteUrl,
    preexistingChanges: normalizePreexistingChanges(value.preexistingChanges),
    attemptNumber: Number.isInteger(value.attemptNumber) && value.attemptNumber > 0 ? value.attemptNumber : 1,
    preparedAt: hasText(event.timeUtc) ? event.timeUtc : null
  };
}

function normalizePreexistingChanges(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 500) throw new Error('task.workspace-prepared contains invalid pre-existing change fingerprints.');
  const seen = new Set();
  return value.map((entry) => {
    if (!isRecord(entry) || !isSafeRelativePath(entry.path) || !/^[0-9a-f]{64}$/.test(entry.fingerprint ?? '') || seen.has(entry.path)) {
      throw new Error('task.workspace-prepared contains an invalid pre-existing change fingerprint.');
    }
    seen.add(entry.path);
    return { path: normalizePortablePath(entry.path), fingerprint: entry.fingerprint };
  });
}

function normalizeCheckpointOid(value) {
  if (value === null || value === undefined) return null;
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(normalized)) {
    throw new Error('task.delivery-recorded contains an invalid Git OID.');
  }
  return normalized;
}

function reconcileTaskRequirements(task, event) {
  if (!task || !['planned', 'ready', 'paused'].includes(task.status)) {
    throw new Error('task.requirements-reconciled requires an unclaimed planned, ready, or paused task.');
  }
  if (task.source?.kind !== 'forge-issue' || task.source?.trust !== 'untrusted-data') {
    throw new Error('task.requirements-reconciled requires a tagged forge issue source.');
  }
  if (!hasText(event.title) || !Array.isArray(event.acceptanceCriteria) || event.acceptanceCriteria.length === 0) {
    throw new Error('task.requirements-reconciled requires a title and acceptance criteria.');
  }
  const ids = new Set();
  const criteria = event.acceptanceCriteria.map((criterion) => {
    if (!isRecord(criterion) || !isStableId(criterion.id) || !hasText(criterion.text) || ids.has(criterion.id)) {
      throw new Error('task.requirements-reconciled contains invalid acceptance criteria.');
    }
    ids.add(criterion.id);
    return {
      id: criterion.id,
      text: String(criterion.text).slice(0, 2000),
      status: 'pending',
      evidence: [],
      updatedAt: hasText(event.timeUtc) ? event.timeUtc : null
    };
  });
  const snapshot = isRecord(event.remoteSnapshot) ? event.remoteSnapshot : {};
  task.title = String(event.title).slice(0, 1000);
  task.criteria = criteria;
  task.source.snapshot = {
    title: hasText(snapshot.title) ? String(snapshot.title).slice(0, 1000) : '',
    body: typeof snapshot.body === 'string' ? snapshot.body.slice(0, 16_000) : '',
    acceptanceCriteria: Array.isArray(snapshot.acceptanceCriteria)
      ? snapshot.acceptanceCriteria.filter(hasText).slice(0, 50).map((item) => String(item).slice(0, 1000))
      : [],
    updatedAt: hasText(snapshot.updatedAt) ? String(snapshot.updatedAt).slice(0, 80) : null
  };
  task.updatedAt = hasText(event.timeUtc) ? event.timeUtc : task.updatedAt;
}

function refreshReadyTasks(state) {
  const completed = new Set(state.tasks.filter((task) => task.status === 'completed').map((task) => task.id));
  for (const task of state.tasks) {
    if (task.status === 'planned' && task.dependsOn.every((dependency) => completed.has(dependency))) {
      task.status = 'ready';
      task.updatedAt = state.updatedAt;
    }
  }
}

function dependenciesCompleted(state, task) {
  const completed = new Set(state.tasks.filter((item) => item.status === 'completed').map((item) => item.id));
  return task.dependsOn.every((dependency) => completed.has(dependency));
}

function progressPart(completed, total, completedKey = 'completed') {
  return {
    [completedKey]: completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100)
  };
}

function legacyRunStatus(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (['active', 'running', 'in-progress'].includes(normalized)) return 'running';
  if (['done', 'complete', 'completed'].includes(normalized)) return 'completed';
  if (['paused', 'blocked', 'cancelled'].includes(normalized)) return normalized;
  if (normalized === 'stopped') return 'cancelled';
  return 'planned';
}

function isSafeRelativePath(value) {
  if (!hasText(value)) return false;
  const raw = String(value).trim();
  if (/[\u0000-\u001f\u007f]/.test(raw)) return false;
  const normalized = normalizePortablePath(raw);
  if (path.isAbsolute(raw) || path.posix.isAbsolute(normalized) || /^[A-Za-z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) {
    return false;
  }
  const parts = normalized.split('/');
  return parts.every((part) => part && part !== '.' && part !== '..');
}

function isSafeArgv(argv) {
  if (!Array.isArray(argv) || argv.length === 0) return false;
  if (typeof argv[0] !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._+/-]*$/.test(argv[0]) || argv[0].includes('..')) {
    return false;
  }
  return argv.every((part) => typeof part === 'string' && part.length > 0 && !/[\u0000\r\n]/.test(part));
}

function taskIsComplete(task) {
  return (
    Array.isArray(task?.acceptanceCriteria) && task.acceptanceCriteria.length > 0 &&
    Array.isArray(task?.verificationCommands) && task.verificationCommands.length > 0
  );
}

function normalizePortablePath(value) {
  return String(value).replace(/\\/g, '/');
}

function isStableId(value) {
  return typeof value === 'string' && STABLE_ID.test(value) && !value.includes('..');
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function conflict(id, message, paths = []) {
  return { id, level: 'fail', message, paths };
}

function warning(id, message, paths = []) {
  return { id, level: 'warn', message, paths };
}
