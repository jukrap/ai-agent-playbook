import { createGithubProvider, redactSecrets } from './providers/github.mjs';
import { createGiteaProvider } from './providers/gitea.mjs';

const SCHEMA_VERSION = '1';
const WRITE_PROFILES = new Set(['coordinate', 'deliver', 'release']);
const ACTIVE_STATES = new Set(['claimed', 'running', 'verifying', 'review']);

/**
 * Apply a provider-neutral forge operation plan through an injected transport.
 * `apply: false` is a strict preview: provider construction and transport calls
 * are intentionally skipped.
 *
 * @param {{
 *   plan?: object,
 *   provider?: string,
 *   repository?: {owner: string, name: string},
 *   transport?: {request(request: object): Promise<unknown>},
 *   profile?: string,
 *   remoteReadOnly?: boolean,
 *   noRemote?: boolean,
 *   offline?: boolean,
 *   allowSupersede?: boolean,
 *   signal?: AbortSignal,
 *   apply?: boolean
 * }} options
 */
export async function applyForgePlan(options = {}) {
  assertNotAborted(options.signal);
  const plan = normalizePlan(options.plan);
  const provider = normalizedText(options.provider)?.toLowerCase() ?? normalizedText(plan.provider)?.toLowerCase() ?? 'none';
  const profile = normalizedText(options.profile)?.toLowerCase() ?? 'deliver';
  const apply = options.apply === true;
  const warnings = sanitizeCollection(plan.warnings);
  const conflicts = sanitizeCollection(plan.conflicts);

  if (plan.ok === false || conflicts.length > 0) {
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  if (!apply) {
    const results = plan.operations.map((operation) => ({
      operationId: operationId(operation),
      resource: normalizedText(operation?.resource),
      status: 'planned'
    }));
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results });
  }

  if (!WRITE_PROFILES.has(profile)) {
    conflicts.push({
      id: 'forge.apply.profile-denied',
      message: `Forge writes are not allowed by the ${profile} permission profile.`,
      profile
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  if (options.remoteReadOnly || options.noRemote || options.offline) {
    conflicts.push({
      id: 'forge.apply.remote-denied',
      message: 'Forge writes are disabled by the effective remote policy.'
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  const supersede = plan.operations.find((operation) => (
    operation?.requiresApproval === 'supersede' ||
    (operation?.action === 'remove' && ['project-item', 'sub-issue'].includes(operation?.resource))
  ));
  if (supersede && options.allowSupersede !== true) {
    conflicts.push({
      id: 'forge.apply.supersede-approval-required',
      message: 'Closing or unlinking superseded issues and removing obsolete Project associations requires explicit allowSupersede approval.',
      operationId: operationId(supersede)
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  if (provider !== 'github' && provider !== 'gitea') {
    conflicts.push({
      id: 'forge.apply.provider-unsafe',
      message: 'Forge writes require an explicitly identified GitHub or Gitea provider.',
      provider
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }


  const destructive = plan.operations.find((operation) => (
    operation?.action === 'delete' || operation?.action === 'force-push'
  ));
  if (destructive) {
    conflicts.push({
      id: 'forge.apply.destructive-denied',
      message: 'Delete and force-push operations are never enabled by a forge permission profile.',
      operationId: operationId(destructive)
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  const deliveryOperation = profile === 'coordinate' && plan.operations.find((operation) => (
    operation?.resource === 'pull-request' || operation?.resource === 'draft-pull-request'
  ));
  if (deliveryOperation) {
    conflicts.push({
      id: 'forge.apply.profile-resource-denied',
      message: 'The coordinate profile cannot create or update pull requests; use deliver or release.',
      profile,
      operationId: operationId(deliveryOperation)
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  let adapter;
  try {
    adapter = provider === 'github'
      ? createGithubProvider({ transport: options.transport, repository: options.repository })
      : createGiteaProvider({ transport: options.transport, repository: options.repository });
  } catch (error) {
    conflicts.push({
      id: 'forge.apply.invalid-context',
      message: redactSecrets(error?.message ?? 'Forge apply context is invalid.')
    });
    return applyResult({ provider, apply: false, operations: plan.operations, warnings, conflicts, results: [] });
  }

  const results = [];
  const blockedTaskKeys = new Set();
  let criticalPrerequisiteFailed = false;
  for (const operation of plan.operations) {
    const operationIdValue = operationId(operation);
    const taskKey = operationTaskKey(operation);
    if (criticalPrerequisiteFailed) {
      results.push({
        operationId: operationIdValue,
        resource: normalizedText(operation?.resource),
        status: 'skipped',
        reason: 'critical-prerequisite-failed'
      });
      continue;
    }
    if (taskKey && blockedTaskKeys.has(taskKey)) {
      results.push({
        operationId: operationIdValue,
        resource: normalizedText(operation?.resource),
        status: 'skipped',
        reason: 'authoritative-issue-operation-failed'
      });
      continue;
    }
    try {
      assertNotAborted(options.signal);
      const outcome = await adapter.applyOperation(operation);
      assertNotAborted(options.signal);
      results.push({
        operationId: operationIdValue,
        resource: normalizedText(operation?.resource),
        ...sanitizeValue(outcome)
      });
      if (operation?.critical === true && outcome?.status === 'fallback') criticalPrerequisiteFailed = true;
      if (outcome?.status === 'fallback' || outcome?.fallback) {
        warnings.push({
          id: 'forge.apply.documented-fallback',
          operationId: operationIdValue,
          resource: normalizedText(operation?.resource),
          message: outcome.fallback
        });
      }
    } catch (error) {
      if (isAbortError(error, options.signal)) throw error;
      results.push({
        operationId: operationIdValue,
        resource: normalizedText(operation?.resource),
        status: 'failed',
        error: serializeError(error)
      });
      if (operation?.critical === true) criticalPrerequisiteFailed = true;
      if (taskKey && (operation?.resource === 'issue' || operation?.requiresApproval === 'supersede')) blockedTaskKeys.add(taskKey);
    }
  }

  return applyResult({ provider, apply: true, operations: plan.operations, warnings, conflicts, results });
}

/**
 * Resolve provider-confirmed no-op operations without allowing a remote write.
 * Operations that would mutate remain in the returned plan.
 */
export async function previewForgePlan(options = {}) {
  const plan = normalizePlan(options.plan);
  const provider = normalizedText(options.provider)?.toLowerCase() ?? normalizedText(plan.provider)?.toLowerCase() ?? 'none';
  if (plan.ok === false || plan.conflicts.length > 0) return plan;
  if (provider !== 'github' && provider !== 'gitea') return plan;

  const previewTransport = createPreviewTransport(options.transport);
  const adapter = provider === 'github'
    ? createGithubProvider({ transport: previewTransport, repository: options.repository })
    : createGiteaProvider({ transport: previewTransport, repository: options.repository });
  const operations = [];
  const noOps = [];
  const conflicts = sanitizeCollection(plan.conflicts);
  for (const operation of plan.operations) {
    try {
      const outcome = await adapter.applyOperation(operation);
      if (outcome?.status === 'reused') {
        noOps.push({ operationId: operationId(operation), resource: normalizedText(operation?.resource), status: 'reused' });
      } else {
        operations.push(operation);
      }
    } catch (error) {
      if (error?.code === 'forge.preview.write-required') {
        operations.push(operation);
        continue;
      }
      conflicts.push({
        id: 'forge.preview.read-failed',
        operationId: operationId(operation),
        resource: normalizedText(operation?.resource),
        message: redactSecrets(error?.message ?? 'Forge preview inspection failed.')
      });
    }
  }
  const summary = {
    ...(plan.summary && typeof plan.summary === 'object' ? plan.summary : {}),
    operations: conflicts.length === 0 ? operations.length : 0,
    plannedOperations: Number.isInteger(plan.summary?.plannedOperations) ? plan.summary.plannedOperations : plan.operations.length,
    noOps: noOps.length,
    ...(plan.summary?.artifacts && typeof plan.summary.artifacts === 'object'
      ? { artifacts: previewArtifactCounts(operations, Object.keys(plan.summary.artifacts)) }
      : {})
  };
  return {
    ...plan,
    ok: conflicts.length === 0,
    mode: { ...(plan.mode ?? {}), apply: false, writes: false },
    summary,
    operations: conflicts.length === 0 ? operations : [],
    noOps,
    conflicts
  };
}

function previewArtifactCounts(operations, keys) {
  const issueOperations = operations.filter((operation) => operation?.resource === 'issue');
  const counts = {
    issuesUpdated: issueOperations.filter((operation) => operation?.action === 'update' && operation?.payload?.state !== 'closed').length,
    issuesClosed: issueOperations.filter((operation) => operation?.payload?.state === 'closed' || operation?.action === 'close').length,
    parentIssues: issueOperations.filter((operation) => String(operation?.id ?? '').startsWith('plan:')).length,
    groupIssues: issueOperations.filter((operation) => String(operation?.id ?? '').startsWith('group:')).length,
    taskIssues: issueOperations.filter((operation) => String(operation?.id ?? '').startsWith('task:')).length,
    subIssueLinks: operations.filter((operation) => operation?.resource === 'sub-issue').length,
    projects: operations.filter((operation) => operation?.resource === 'project').length,
    views: operations.filter((operation) => ['view', 'project-view'].includes(operation?.resource)).length,
    labels: operations.filter((operation) => operation?.resource === 'label').length,
    milestones: operations.filter((operation) => operation?.resource === 'milestone').length,
    pullRequests: operations.filter((operation) => ['pull-request', 'draft-pull-request'].includes(operation?.resource)).length,
    projectItems: operations.filter((operation) => operation?.resource === 'project-item' && operation?.action !== 'remove').length,
    projectItemsRemoved: operations.filter((operation) => operation?.resource === 'project-item' && operation?.action === 'remove').length
  };
  return Object.fromEntries(keys.map((key) => [key, counts[key] ?? 0]));
}

function createPreviewTransport(transport) {
  if (!transport || typeof transport.request !== 'function') throw new TypeError('Forge preview requires an injected transport.');
  return {
    async request(request) {
      const method = normalizedText(request?.method)?.toUpperCase() ?? 'GET';
      const query = typeof request?.body?.query === 'string' ? request.body.query.trimStart() : '';
      const isRead = method === 'GET' || method === 'HEAD' ||
        (method === 'POST' && request?.path === '/graphql' && query.startsWith('query '));
      if (!isRead) {
        throw Object.assign(new Error('Remote mutation is required for this forge operation.'), {
          name: 'ForgePreviewWriteRequired',
          code: 'forge.preview.write-required'
        });
      }
      return transport.request(request);
    }
  };
}

function operationTaskKey(operation) {
  const id = operationId(operation);
  const match = /^(task|group):([^:]+):/.exec(id);
  if (match) return `${match[1]}:${match[2]}`;
  const childMatch = /^plan:[^:]+:child:([^:]+)$/.exec(id);
  if (!childMatch) return null;
  const marker = normalizedText(operation?.payload?.childMarker) ?? '';
  if (marker.includes('aapb:task:')) return `task:${childMatch[1]}`;
  return `group:${childMatch[1]}`;
}

function assertNotAborted(signal) {
  if (!signal?.aborted) return;
  throw Object.assign(new Error('Forge apply was aborted before the next remote mutation.'), {
    name: 'AbortError',
    code: signal.reason?.code ?? 'automation.operation.aborted'
  });
}

function isAbortError(error, signal) {
  return signal?.aborted === true || error?.name === 'AbortError' || error?.code === 'automation.tick.deadline-exceeded' || error?.code === 'automation.control.requested';
}

/**
 * Compare the last synchronized requirements snapshot with the current issue.
 * Active tasks pause on requirement drift; pre-run tasks can safely import the
 * latest remote requirements before they are claimed.
 */
export function reconcileForgeTask(options = {}) {
  const localTask = options.localTask && typeof options.localTask === 'object' ? options.localTask : {};
  const remoteIssue = options.remoteIssue && typeof options.remoteIssue === 'object' ? options.remoteIssue : {};
  const baselineValue = options.baseline ?? localTask.remoteSnapshot ?? localTask.remote ?? localTask;
  const baseline = requirementSnapshot(baselineValue);
  const remote = requirementSnapshot(remoteIssue);
  const changed = [];

  if (baseline.title !== remote.title) changed.push('title');
  if (baseline.body !== remote.body) changed.push('body');
  if (!sameStrings(baseline.acceptanceCriteria, remote.acceptanceCriteria)) changed.push('acceptanceCriteria');
  changed.sort((left, right) => left.localeCompare(right));

  const state = normalizedText(localTask.status)?.toLowerCase() ?? 'planned';
  const taskId = normalizedText(localTask.id);
  if (changed.length === 0) {
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: 'forge.reconcile-result',
      ok: true,
      taskId,
      action: 'none',
      state,
      changed: [],
      remote
    };
  }

  if (ACTIVE_STATES.has(state) || normalizedText(localTask.source?.groupId ?? baselineValue.groupId)) {
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: 'forge.reconcile-result',
      ok: false,
      taskId,
      action: 'pause',
      state: 'paused:needs-reconcile',
      changed,
      remote,
      conflict: {
        id: 'forge.reconcile.requirements-changed',
        message: 'Remote title, body, or acceptance criteria changed while the task was active.'
      }
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.reconcile-result',
    ok: true,
    taskId,
    action: 'sync-from-remote',
    state,
    changed,
    remote
  };
}

function applyResult({ provider, apply, operations, warnings, conflicts, results }) {
  const failed = results.filter((result) => result.status === 'failed').length;
  const applied = results.filter((result) => ['created', 'updated', 'removed'].includes(result.status)).length;
  const reused = results.filter((result) => result.status === 'reused').length;
  const fallback = results.filter((result) => result.status === 'fallback').length;
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.apply-result',
    ok: conflicts.length === 0 && failed === 0,
    provider,
    mode: {
      apply,
      writes: apply && conflicts.length === 0
    },
    summary: {
      planned: operations.length,
      applied,
      reused,
      fallback,
      failed
    },
    results,
    warnings: sanitizeCollection(warnings),
    conflicts: sanitizeCollection(conflicts)
  };
}

function normalizePlan(value) {
  const plan = value && typeof value === 'object' ? value : {};
  return {
    ...plan,
    ok: plan.ok !== false,
    operations: Array.isArray(plan.operations) ? plan.operations : [],
    warnings: Array.isArray(plan.warnings) ? plan.warnings : [],
    conflicts: Array.isArray(plan.conflicts) ? plan.conflicts : []
  };
}

function operationId(operation) {
  return normalizedText(operation?.id) ?? normalizedText(operation?.idempotencyKey) ?? 'unknown-operation';
}

function serializeError(error) {
  const code = typeof error?.code === 'string' && error.code.startsWith('forge.')
    ? error.code
    : 'forge.operation.failed';
  return {
    code,
    message: redactSecrets(error?.message ?? 'Forge operation failed.'),
    details: sanitizeValue(error?.details ?? {})
  };
}

function requirementSnapshot(value) {
  const snapshot = value && typeof value === 'object' ? value : {};
  const body = typeof snapshot.body === 'string' ? snapshot.body : '';
  return {
    source: 'forge',
    trust: 'untrusted-data',
    title: typeof snapshot.title === 'string' ? snapshot.title : '',
    body,
    acceptanceCriteria: Array.isArray(snapshot.acceptanceCriteria)
      ? normalizedStringList(snapshot.acceptanceCriteria)
      : extractAcceptanceCriteria(body),
    updatedAt: normalizedText(snapshot.updatedAt ?? snapshot.updated_at)
  };
}

function extractAcceptanceCriteria(body) {
  const match = /<!-- aapb:acceptance:start -->([\s\S]*?)<!-- aapb:acceptance:end -->/.exec(body);
  const searchable = match?.[1] ?? body;
  return normalizedStringList([...searchable.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+)$/gm)].map((item) => item[1]));
}

function normalizedStringList(values) {
  return values
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim());
}

function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sanitizeCollection(values) {
  return Array.isArray(values) ? values.map((value) => sanitizeValue(value)) : [];
}

function sanitizeValue(value) {
  if (typeof value === 'string') return redactSecrets(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (!value || typeof value !== 'object') return value;
  const sanitized = {};
  for (const [key, item] of Object.entries(value)) {
    if (/token|password|passwd|secret|authorization|api[-_]?key/i.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeValue(item);
    }
  }
  return sanitized;
}

function normalizedText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
