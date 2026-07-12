const SCHEMA_VERSION = '1';
const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const SAFE_REPOSITORY_PART = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,99})$/;
const STABLE_ID = /^[a-z0-9][a-z0-9._-]{0,99}$/;
const OWNED_TASK_MARKER = /^<!-- aapb:task:([a-z0-9][a-z0-9._-]{0,99}) -->(?:\r?\n|$)/;
const OWNED_PLAN_MARKER = /^<!-- aapb:plan:[A-Za-z0-9][A-Za-z0-9._-]{0,99} -->(?:\r?\n|$)/;
const OWNED_GROUP_MARKER = /^<!-- aapb:group:[A-Za-z0-9][A-Za-z0-9._-]{0,99} -->(?:\r?\n|$)/;
const DEFAULT_PAUSE_LABELS = Object.freeze(['aapb:paused', 'aapb:automation-paused']);

/**
 * Read existing open issues that are explicitly queued with `aapb:ready`.
 * This function is read-only and returns remote text tagged as untrusted data.
 */
export async function queryReadyForgeIssues(options = {}) {
  const provider = normalizeProvider(options.provider);
  if (options.noRemote || options.offline) {
    return queueResult({
      provider,
      issues: [],
      warnings: [],
      conflicts: [],
      skipped: true,
      reason: options.offline ? 'offline' : 'no-remote'
    });
  }

  const conflicts = [];
  const warnings = [];
  if (provider !== 'github' && provider !== 'gitea') {
    conflicts.push(problem('forge.queue.provider-unsafe', 'Ready issue queries require an identified GitHub or Gitea provider.'));
    return queueResult({ provider, issues: [], warnings, conflicts });
  }
  let repository;
  try {
    repository = validateRepository(options.repository);
  } catch (error) {
    conflicts.push(problem('forge.queue.repository-invalid', redact(error.message)));
    return queueResult({ provider, issues: [], warnings, conflicts });
  }
  if (!options.transport || typeof options.transport.request !== 'function') {
    conflicts.push(problem('forge.queue.transport-missing', 'Ready issue queries require a request transport.'));
    return queueResult({ provider, issues: [], warnings, conflicts });
  }

  let readyLabels;
  let pauseLabels;
  try {
    readyLabels = [...new Set([
      requiredLabel(options.readyLabel ?? 'aapb:ready'),
      ...(Array.isArray(options.readyAliases) ? options.readyAliases.map(requiredLabel) : [])
    ])];
    pauseLabels = new Set(
      (Array.isArray(options.pauseLabels) ? options.pauseLabels : DEFAULT_PAUSE_LABELS)
        .map(requiredLabel)
        .map((label) => label.toLowerCase())
    );
  } catch (error) {
    conflicts.push(problem('forge.queue.label-invalid', redact(error.message)));
    return queueResult({ provider, repository, issues: [], warnings, conflicts });
  }
  const path = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues`;
  const byNumber = new Map();
  for (const readyLabel of readyLabels) {
    let exhausted = false;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      let response;
      try {
        response = normalizeResponse(await options.transport.request({
          method: 'GET',
          path,
          headers: provider === 'github'
            ? { accept: 'application/vnd.github+json', 'x-github-api-version': '2026-03-10' }
            : { accept: 'application/json' },
          query: {
            state: 'open',
            labels: readyLabel,
            page,
            [provider === 'gitea' ? 'limit' : 'per_page']: PAGE_SIZE
          }
        }));
      } catch (error) {
        conflicts.push(problem('forge.queue.request-failed', `Ready issue query failed: ${redact(error?.message ?? 'remote request error')}`));
        return queueResult({ provider, repository, issues: [], warnings, conflicts });
      }
      if (response.status >= 400) {
        conflicts.push(problem('forge.queue.request-failed', `Ready issue query failed with HTTP ${response.status}.`));
        return queueResult({ provider, repository, issues: [], warnings, conflicts });
      }
      const pageItems = Array.isArray(response.data) ? response.data : [];
      for (const remote of pageItems) {
        const normalized = normalizeRemoteIssue(remote, provider, repository, readyLabel, pauseLabels);
        if (normalized.issue && !byNumber.has(normalized.issue.number)) byNumber.set(normalized.issue.number, normalized.issue);
        if (normalized.warning) warnings.push(normalized.warning);
      }
      if (!hasNextPage(response.headers, pageItems.length, page)) {
        exhausted = true;
        break;
      }
    }
    if (!exhausted) {
      conflicts.push(problem('forge.queue.pagination-limit', 'Ready issue pagination exceeded the 100 page safety limit.'));
      return queueResult({ provider, repository, issues: [], warnings, conflicts });
    }
  }
  const issues = [...byNumber.values()].sort((left, right) => left.number - right.number);
  return queueResult({ provider, repository, issues, warnings, conflicts });
}

export async function queryManagedForgeIssues(options = {}) {
  const provider = normalizeProvider(options.provider);
  const warnings = [];
  const conflicts = [];
  if (options.noRemote || options.offline) {
    return managedIssueResult({ provider, issues: [], warnings, conflicts, skipped: true, reason: options.offline ? 'offline' : 'no-remote' });
  }
  if (provider !== 'github' && provider !== 'gitea') {
    conflicts.push(problem('forge.managed-issues.provider-unsafe', 'Managed issue inspection requires an identified GitHub or Gitea provider.'));
    return managedIssueResult({ provider, issues: [], warnings, conflicts });
  }
  let repository;
  try {
    repository = validateRepository(options.repository);
  } catch (error) {
    conflicts.push(problem('forge.managed-issues.repository-invalid', error.message));
    return managedIssueResult({ provider, issues: [], warnings, conflicts });
  }
  if (!options.transport || typeof options.transport.request !== 'function') {
    conflicts.push(problem('forge.managed-issues.transport-missing', 'Managed issue inspection requires a request transport.'));
    return managedIssueResult({ provider, repository, issues: [], warnings, conflicts });
  }

  const path = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues`;
  const issues = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    let response;
    try {
      response = normalizeResponse(await options.transport.request({
        method: 'GET',
        path,
        headers: provider === 'github'
          ? { accept: 'application/vnd.github+json', 'x-github-api-version': '2026-03-10' }
          : { accept: 'application/json' },
        query: { state: 'all', page, [provider === 'gitea' ? 'limit' : 'per_page']: PAGE_SIZE }
      }));
    } catch (error) {
      conflicts.push(problem('forge.managed-issues.request-failed', `Managed issue inspection failed: ${error?.message ?? 'remote request error'}`));
      return managedIssueResult({ provider, repository, issues: [], warnings, conflicts });
    }
    if (response.status >= 400) {
      conflicts.push(problem('forge.managed-issues.request-failed', `Managed issue inspection failed with HTTP ${response.status}.`));
      return managedIssueResult({ provider, repository, issues: [], warnings, conflicts });
    }
    const pageItems = Array.isArray(response.data) ? response.data : [];
    for (const remote of pageItems) {
      if (remote?.pull_request || remote?.pullRequest) continue;
      const body = sanitizeMultiline(remote?.body, 200_000);
      if (!/^<!-- aapb:(?:plan|task|group):[A-Za-z0-9][A-Za-z0-9._-]{0,99} -->(?:\r?\n|$)/.test(body)) continue;
      const number = Number(remote?.number ?? remote?.index);
      const id = Number(remote?.id);
      const observedAt = typeof (remote?.updated_at ?? remote?.updatedAt) === 'string'
        ? String(remote.updated_at ?? remote.updatedAt).trim()
        : '';
      if (!Number.isInteger(number) || number < 1 || !Number.isInteger(id) || id < 1 || !Number.isFinite(Date.parse(observedAt))) continue;
      issues.push({
        id,
        number,
        title: sanitizeMultiline(remote?.title, 1000),
        body,
        state: String(remote?.state ?? '').toLowerCase() === 'closed' ? 'closed' : 'open',
        labels: normalizeLabels(remote?.labels),
        updatedAt: observedAt
      });
    }
    if (!hasNextPage(response.headers, pageItems.length, page)) {
      issues.sort((left, right) => left.number - right.number);
      if (provider === 'github') {
        const annotation = await annotateManagedSubIssueParents({ issues, repository, transport: options.transport });
        conflicts.push(...annotation.conflicts);
      }
      return managedIssueResult({ provider, repository, issues, warnings, conflicts });
    }
  }
  conflicts.push(problem('forge.managed-issues.pagination-limit', 'Managed issue inspection exceeded the 100 page safety limit.'));
  return managedIssueResult({ provider, repository, issues: [], warnings, conflicts });
}

export async function queryReviewedForgePullRequests(options = {}) {
  const provider = normalizeProvider(options.provider);
  const warnings = [];
  const conflicts = [];
  if (provider !== 'github' && provider !== 'gitea') {
    conflicts.push(problem('forge.reviewed-pulls.provider-unsafe', 'Reviewed pull request inspection requires an identified GitHub or Gitea provider.'));
    return reviewedPullResult({ provider, pullRequests: [], warnings, conflicts });
  }
  let repository;
  try {
    repository = validateRepository(options.repository);
  } catch (error) {
    conflicts.push(problem('forge.reviewed-pulls.repository-invalid', error.message));
    return reviewedPullResult({ provider, pullRequests: [], warnings, conflicts });
  }
  if (!options.transport || typeof options.transport.request !== 'function') {
    conflicts.push(problem('forge.reviewed-pulls.transport-missing', 'Reviewed pull request inspection requires a request transport.'));
    return reviewedPullResult({ provider, repository, pullRequests: [], warnings, conflicts });
  }
  const numbers = [...new Set(Array.isArray(options.pullRequestNumbers) ? options.pullRequestNumbers : [])];
  if (numbers.length > 20 || numbers.some((number) => !Number.isInteger(number) || number < 1)) {
    conflicts.push(problem('forge.reviewed-pulls.numbers-invalid', 'Reviewed pull request numbers must contain at most 20 unique positive integers.'));
    return reviewedPullResult({ provider, repository, pullRequests: [], warnings, conflicts });
  }
  const pullRequests = [];
  for (const number of numbers.sort((left, right) => left - right)) {
    let response;
    try {
      response = normalizeResponse(await options.transport.request({
        method: 'GET',
        path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pulls/${number}`,
        headers: provider === 'github'
          ? { accept: 'application/vnd.github+json', 'x-github-api-version': '2026-03-10' }
          : { accept: 'application/json' }
      }));
    } catch (error) {
      conflicts.push(problem('forge.reviewed-pulls.request-failed', `Pull request #${number} inspection failed: ${error?.message ?? 'remote request error'}`));
      continue;
    }
    if (response.status >= 400 || !response.data || typeof response.data !== 'object') {
      conflicts.push(problem('forge.reviewed-pulls.request-failed', `Pull request #${number} inspection failed with HTTP ${response.status}.`));
      continue;
    }
    const remote = response.data;
    const updatedAt = typeof (remote.updated_at ?? remote.updatedAt) === 'string' ? String(remote.updated_at ?? remote.updatedAt).trim() : '';
    if (!Number.isFinite(Date.parse(updatedAt))) {
      conflicts.push(problem('forge.reviewed-pulls.snapshot-invalid', `Pull request #${number} did not provide a valid updatedAt snapshot.`));
      continue;
    }
    pullRequests.push({
      number,
      title: sanitizeMultiline(remote.title, 1000),
      body: sanitizeMultiline(remote.body, 200_000),
      state: String(remote.state ?? '').toLowerCase() === 'closed' ? 'closed' : 'open',
      draft: remote.draft === true || (provider === 'gitea' && /^(?:WIP:|\[WIP\])/i.test(String(remote.title ?? ''))),
      updatedAt,
      nodeId: sanitizeInline(remote.node_id ?? remote.nodeId, 512),
      head: sanitizeInline(remote.head?.ref ?? remote.head, 256),
      base: sanitizeInline(remote.base?.ref ?? remote.base, 256)
    });
  }
  return reviewedPullResult({ provider, repository, pullRequests, warnings, conflicts });
}

async function annotateManagedSubIssueParents({ issues, repository, transport }) {
  const parents = issues.filter((issue) => OWNED_PLAN_MARKER.test(issue.body));
  const conflicts = [];
  for (const parent of parents) {
    const response = normalizeResponse(await transport.request({
      method: 'GET',
      path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${parent.number}/sub_issues`,
      headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2026-03-10' },
      query: { per_page: PAGE_SIZE, page: 1 }
    }));
    if (response.status >= 400) {
      conflicts.push(problem(
        'forge.managed-issues.parent-annotation-failed',
        `Could not verify sub-issue ownership for parent issue #${parent.number}; presentation reconcile is blocked.`
      ));
      continue;
    }
    const childIds = new Set((Array.isArray(response.data) ? response.data : []).map((child) => Number(child?.id)).filter(Number.isInteger));
    for (const issue of issues) {
      if (childIds.has(issue.id)) issue.parentIssueNumbers = [...new Set([...(issue.parentIssueNumbers ?? []), parent.number])];
    }
  }
  return { conflicts };
}

/**
 * Read one issue snapshot for tick-time pause and requirement reconciliation.
 * No mutation is performed, and remote text remains explicitly untrusted.
 */
export async function inspectForgeIssue(options = {}) {
  const provider = normalizeProvider(options.provider);
  if (options.noRemote || options.offline) {
    return issueInspectionResult({
      provider,
      issue: null,
      warnings: [],
      conflicts: [],
      skipped: true,
      reason: options.offline ? 'offline' : 'no-remote'
    });
  }
  const conflicts = [];
  const warnings = [];
  if (provider !== 'github' && provider !== 'gitea') {
    conflicts.push(problem('forge.issue.provider-unsafe', 'Issue inspection requires an identified GitHub or Gitea provider.'));
    return issueInspectionResult({ provider, issue: null, warnings, conflicts });
  }
  let repository;
  let readyLabel;
  let pauseLabels;
  try {
    repository = validateRepository(options.repository);
    readyLabel = requiredLabel(options.readyLabel ?? 'aapb:ready');
    pauseLabels = new Set(
      (Array.isArray(options.pauseLabels) ? options.pauseLabels : DEFAULT_PAUSE_LABELS)
        .map(requiredLabel)
        .map((label) => label.toLowerCase())
    );
  } catch (error) {
    conflicts.push(problem('forge.issue.inspect-invalid', redact(error.message)));
    return issueInspectionResult({ provider, issue: null, warnings, conflicts });
  }
  if (!Number.isInteger(options.issueNumber) || options.issueNumber <= 0) {
    conflicts.push(problem('forge.issue.number-invalid', 'Issue inspection requires a positive issue number.'));
    return issueInspectionResult({ provider, repository, issue: null, warnings, conflicts });
  }
  if (!options.transport || typeof options.transport.request !== 'function') {
    conflicts.push(problem('forge.issue.transport-missing', 'Issue inspection requires a request transport.'));
    return issueInspectionResult({ provider, repository, issue: null, warnings, conflicts });
  }
  const path = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${options.issueNumber}`;
  let response;
  try {
    response = normalizeResponse(await options.transport.request({
      method: 'GET',
      path,
      headers: provider === 'github'
        ? { accept: 'application/vnd.github+json', 'x-github-api-version': '2026-03-10' }
        : { accept: 'application/json' },
      ...(options.signal ? { signal: options.signal } : {})
    }));
  } catch (error) {
    conflicts.push(problem('forge.issue.inspect-failed', `Issue inspection failed: ${redact(error?.message ?? 'remote request error')}`));
    return issueInspectionResult({ provider, repository, issue: null, warnings, conflicts });
  }
  if (response.status >= 400) {
    conflicts.push(problem('forge.issue.inspect-failed', `Issue inspection failed with HTTP ${response.status}.`));
    return issueInspectionResult({ provider, repository, issue: null, warnings, conflicts });
  }
  const remote = response.data;
  const number = Number(remote?.number ?? remote?.index);
  if (!Number.isInteger(number) || number !== options.issueNumber) {
    conflicts.push(problem('forge.issue.identity-mismatch', 'The remote issue response did not match the requested issue number.'));
    return issueInspectionResult({ provider, repository, issue: null, warnings, conflicts });
  }
  const labels = normalizeLabels(remote.labels);
  const labelSet = new Set(labels.map((label) => label.toLowerCase()));
  const ready = labelSet.has(readyLabel.toLowerCase());
  const paused = [...pauseLabels].some((label) => labelSet.has(label));
  const state = typeof remote.state === 'string' && remote.state.toLowerCase() === 'closed' ? 'closed' : 'open';
  const isPullRequest = Boolean(remote.pull_request || remote.pullRequest);
  if (isPullRequest) warnings.push(problem('forge.issue.is-pull-request', 'The requested number resolves to a pull request and is not queue eligible.'));
  const issue = {
    provider,
    repository: `${repository.owner}/${repository.name}`,
    number,
    title: sanitizeMultiline(remote.title, 1000),
    body: sanitizeMultiline(remote.body, 16_000),
    state,
    labels,
    updatedAt: sanitizeTimestamp(remote.updated_at ?? remote.updatedAt),
    ready,
    paused,
    isPullRequest,
    queueEligible: ready && !paused && !isPullRequest && state === 'open',
    source: 'forge',
    trust: 'untrusted-data',
    promptPolicy: 'data-only'
  };
  return issueInspectionResult({ provider, repository, issue, warnings, conflicts });
}

/**
 * Query and convert ready issues into complete workflow.plan.v2 task records.
 */
export async function collectReadyForgeTasks(options = {}) {
  const queried = await queryReadyForgeIssues(options);
  if (!queried.ok || queried.skipped) {
    return {
      ...queried,
      kind: 'forge.ready-task-queue',
      tasks: []
    };
  }
  const tasks = queried.issues.map((issue) => forgeIssueToAutomationTask(issue, options));
  return {
    ...queried,
    kind: 'forge.ready-task-queue',
    tasks
  };
}

/**
 * Convert one normalized ready issue into a safe automation task. Remote
 * verification commands and file paths are intentionally never consumed.
 */
export function forgeIssueToAutomationTask(issue, options = {}) {
  if (!issue || typeof issue !== 'object' || !Number.isInteger(issue.number) || issue.number <= 0) {
    throw new TypeError('A normalized forge issue with a positive number is required.');
  }
  const markerTaskId = OWNED_TASK_MARKER.exec(issue.body ?? '')?.[1] ?? null;
  const id = markerTaskId ?? `forge-issue-${issue.number}`;
  const rawCriteria = extractAcceptanceCriteria(issue.body ?? '');
  const criteriaSource = rawCriteria.length > 0 ? 'remote-checklist' : 'safe-default';
  const criteriaValues = rawCriteria.length > 0
    ? rawCriteria
    : ['complete the reviewed issue outcome and satisfy fresh controller verification'];
  const acceptanceCriteria = criteriaValues.map((value, index) => ({
    id: boundedId(id, `criterion-${index + 1}`),
    text: `Remote issue #${issue.number} acceptance data: ${sanitizeInline(value, 1000)}`
  }));
  const verificationCommands = normalizeVerificationCommands(options.verificationCommands, id);
  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  return {
    id,
    title: `Forge issue #${issue.number}: ${sanitizeInline(issue.title || `Issue ${issue.number}`, 300)}`,
    dependsOn: [],
    priority: priorityFromLabels(labels, options.defaultPriority),
    risk: riskFromLabels(labels, options.defaultRisk),
    acceptanceCriteria,
    verificationCommands,
    paths: [],
    deliveryGroup: STABLE_ID.test(options.deliveryGroup ?? '') ? options.deliveryGroup : id,
    remoteEligible: true,
    source: {
      kind: 'forge-issue',
      source: 'forge',
      trust: 'untrusted-data',
      promptPolicy: 'data-only',
      provider: issue.provider,
      repository: issue.repository,
      issueNumber: issue.number,
      remoteTaskId: markerTaskId,
      requiresLocalExecutionMapping: true,
      criteriaSource,
      labels: [...labels],
      snapshot: {
        title: issue.title,
        body: issue.body,
        acceptanceCriteria: rawCriteria,
        updatedAt: issue.updatedAt
      }
    }
  };
}

/**
 * Append queue tasks without allowing remote task IDs to replace approved plan
 * tasks. ID collisions are warnings and retain the approved local definition.
 */
export function mergeForgeQueueIntoPlan(inputPlan, queuedTasks) {
  const plan = inputPlan && typeof inputPlan === 'object' ? structuredClone(inputPlan) : {};
  plan.tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  const warnings = [];
  const conflicts = [];
  const addedTaskIds = [];
  const existingTasks = new Map(plan.tasks
    .filter((task) => task && typeof task === 'object' && typeof task.id === 'string')
    .map((task) => [task.id, task]));
  for (const task of Array.isArray(queuedTasks) ? queuedTasks : []) {
    if (!task || typeof task !== 'object' || !STABLE_ID.test(task.id ?? '') || task.source?.trust !== 'untrusted-data') {
      warnings.push(problem('forge.queue.task-invalid', 'A malformed or untagged remote queue task was ignored.'));
      continue;
    }
    if (existingTasks.has(task.id)) {
      const approvedTask = existingTasks.get(task.id);
      if (
        !approvedTask.source &&
        task.source?.kind === 'forge-issue' &&
        Number.isInteger(task.source.issueNumber) &&
        task.source.issueNumber > 0
      ) {
        approvedTask.source = {
          ...structuredClone(task.source),
          requiresLocalExecutionMapping: false
        };
      }
      warnings.push(problem('forge.queue.task-id-collision', `Remote queue task ${task.id} did not replace an existing approved task.`, [task.id]));
      continue;
    }
    plan.tasks.push(structuredClone(task));
    existingTasks.set(task.id, task);
    addedTaskIds.push(task.id);
  }
  return {
    schemaVersion: '2',
    kind: 'forge.queue-plan-merge',
    ok: conflicts.length === 0,
    plan,
    addedTaskIds,
    warnings,
    conflicts
  };
}

function normalizeRemoteIssue(remote, provider, repository, readyLabel, pauseLabels) {
  if (!remote || typeof remote !== 'object' || remote.pull_request || remote.pullRequest) return {};
  const number = Number(remote.number ?? remote.index);
  if (!Number.isInteger(number) || number <= 0) {
    return { warning: problem('forge.queue.issue-number-invalid', 'A remote issue with an invalid number was ignored.') };
  }
  if (typeof remote.state === 'string' && remote.state.toLowerCase() === 'closed') return {};
  const labels = normalizeLabels(remote.labels);
  const normalizedLabels = new Set(labels.map((label) => label.toLowerCase()));
  if (!normalizedLabels.has(readyLabel.toLowerCase())) return {};
  if ([...pauseLabels].some((label) => normalizedLabels.has(label))) return {};
  const body = sanitizeMultiline(remote.body, 16_000);
  if (OWNED_PLAN_MARKER.test(body) || OWNED_GROUP_MARKER.test(body)) return {};
  return {
    issue: {
      provider,
      repository: `${repository.owner}/${repository.name}`,
      number,
      title: sanitizeMultiline(remote.title, 1000),
      body,
      state: 'open',
      labels,
      updatedAt: sanitizeTimestamp(remote.updated_at ?? remote.updatedAt),
      source: 'forge',
      trust: 'untrusted-data',
      promptPolicy: 'data-only'
    }
  };
}

function extractAcceptanceCriteria(body) {
  const block = /<!-- aapb:acceptance:start -->([\s\S]*?)<!-- aapb:acceptance:end -->/.exec(body)?.[1] ?? body;
  return [...block.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+)$/gm)]
    .slice(0, 50)
    .map((match) => sanitizeInline(match[1], 1000))
    .filter(Boolean);
}

function normalizeVerificationCommands(input, taskId) {
  if (input === undefined) {
    return [{ id: boundedId(taskId, 'verify'), argv: ['git', 'diff', '--check'] }];
  }
  if (!Array.isArray(input) || input.length === 0) throw new TypeError('Queue verificationCommands must be a non-empty trusted local array.');
  return input.map((command, index) => {
    if (!command || typeof command !== 'object' || !Array.isArray(command.argv) || command.argv.length === 0) {
      throw new TypeError('Queue verification commands must use safe argv arrays.');
    }
    const argv = command.argv.map((value) => {
      if (typeof value !== 'string' || !value || /[\0\r\n]/.test(value)) throw new TypeError('Queue verification argv contains an unsafe value.');
      return value;
    });
    const id = STABLE_ID.test(command.id ?? '') ? command.id : boundedId(taskId, `verify-${index + 1}`);
    return { id, argv };
  });
}

function riskFromLabels(labels, fallback) {
  const values = new Set(labels.map((label) => label.toLowerCase()));
  if (values.has('risk:high') || values.has('aapb:risk:high')) return 'high';
  if (values.has('risk:low') || values.has('aapb:risk:low')) return 'low';
  return ['low', 'medium', 'high'].includes(fallback) ? fallback : 'medium';
}

function priorityFromLabels(labels, fallback) {
  const values = new Set(labels.map((label) => label.toLowerCase()));
  if (values.has('priority:p0') || values.has('aapb:priority:p0')) return 1000;
  if (values.has('priority:p1') || values.has('aapb:priority:p1')) return 750;
  if (values.has('priority:p2') || values.has('aapb:priority:p2')) return 500;
  if (values.has('priority:p3') || values.has('aapb:priority:p3')) return 250;
  return Number.isInteger(fallback) && fallback >= 0 && fallback <= 1000 ? fallback : 50;
}

function normalizeLabels(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((label) => typeof label === 'string' ? label : label?.name)
    .filter((label) => typeof label === 'string' && label.trim())
    .map((label) => sanitizeInline(label, 100))
    .filter(Boolean))];
}

function boundedId(base, suffix) {
  const safeBase = STABLE_ID.test(base) ? base : 'forge-issue';
  const safeSuffix = String(suffix).toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  const available = Math.max(1, 99 - safeSuffix.length - 1);
  return `${safeBase.slice(0, available)}-${safeSuffix}`;
}

function sanitizeInline(value, limit) {
  return sanitizeMultiline(value, limit).replace(/\s+/g, ' ').trim();
}

function sanitizeMultiline(value, limit) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .slice(0, limit);
}

function sanitizeTimestamp(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}

function normalizeResponse(response) {
  if (Array.isArray(response)) return { status: 200, data: response, headers: {} };
  if (!response || typeof response !== 'object') return { status: 200, data: [], headers: {} };
  if ('data' in response || 'status' in response || 'headers' in response) {
    return {
      status: Number(response.status ?? response.statusCode ?? 200),
      data: response.data,
      headers: response.headers ?? {}
    };
  }
  return { status: 200, data: response, headers: {} };
}

function hasNextPage(headers, itemCount, page) {
  const link = readHeader(headers, 'link');
  if (link && /rel\s*=\s*["']?next["']?/i.test(String(link))) return true;
  const total = Number(readHeader(headers, 'x-total-count'));
  if (Number.isFinite(total) && total >= 0) return page * PAGE_SIZE < total;
  return itemCount === PAGE_SIZE;
}

function readHeader(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) return value;
  }
  return null;
}

function validateRepository(value) {
  const owner = typeof value?.owner === 'string' ? value.owner.trim() : '';
  const name = typeof value?.name === 'string' ? value.name.trim() : '';
  if (!SAFE_REPOSITORY_PART.test(owner) || !SAFE_REPOSITORY_PART.test(name) || owner.includes('..') || name.includes('..')) {
    throw new TypeError('Forge repository owner and name must be safe path components.');
  }
  return { owner, name };
}

function requiredLabel(value) {
  const label = typeof value === 'string' ? value.trim() : '';
  if (!label || label.length > 100 || /[\0\r\n,]/.test(label)) throw new TypeError('Forge queue labels must be safe non-empty strings.');
  return label;
}

function normalizeProvider(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : 'none';
}

function queueResult({ provider, repository = null, issues, warnings, conflicts, skipped = false, reason = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.ready-issue-query',
    ok: conflicts.length === 0,
    provider,
    repository: repository ? `${repository.owner}/${repository.name}` : null,
    skipped,
    reason,
    issues,
    warnings,
    conflicts
  };
}

function managedIssueResult({ provider, repository = null, issues, warnings, conflicts, skipped = false, reason = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.managed-issue-query',
    ok: conflicts.length === 0,
    provider,
    repository: repository ? `${repository.owner}/${repository.name}` : null,
    skipped,
    reason,
    issues,
    warnings,
    conflicts
  };
}

function reviewedPullResult({ provider, repository = null, pullRequests, warnings, conflicts }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.reviewed-pull-query',
    ok: conflicts.length === 0,
    provider,
    repository: repository ? `${repository.owner}/${repository.name}` : null,
    pullRequests,
    warnings,
    conflicts
  };
}

function issueInspectionResult({ provider, repository = null, issue, warnings, conflicts, skipped = false, reason = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.issue-inspection',
    ok: conflicts.length === 0,
    provider,
    repository: repository ? `${repository.owner}/${repository.name}` : null,
    skipped,
    reason,
    issue,
    warnings,
    conflicts
  };
}

function problem(id, message, paths = []) {
  return { id, message: redact(message), paths };
}

function redact(value) {
  return String(value)
    .replace(/\b(?:gh[pousr]|github_pat)_[a-zA-Z0-9_]{12,}\b/g, '[REDACTED]')
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, '$1 [REDACTED]')
    .replace(/\b(token|password|passwd|secret|authorization|api[-_]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]');
}
