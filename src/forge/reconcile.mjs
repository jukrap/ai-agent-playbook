import { redactPublicArgv } from './public-redaction.mjs';
import { getForgeCapabilities } from './capabilities.mjs';
import { planForgeBootstrap } from './plan.mjs';

const SCHEMA_VERSION = '1';

export function planForgePresentationReconcile(options = {}) {
  const provider = text(options.provider)?.toLowerCase() ?? 'none';
  const planId = safeId(options.planId, 'planId');
  const coordination = record(options.coordination);
  const tasks = Array.isArray(options.tasks) ? options.tasks.filter(isRecord) : [];
  const remoteIssues = Array.isArray(options.remoteIssues) ? options.remoteIssues.filter(isRecord) : [];
  const remotePullRequests = Array.isArray(options.remotePullRequests) ? options.remotePullRequests.filter(isRecord) : [];
  const groups = Array.isArray(coordination.groups) ? coordination.groups.filter(isRecord) : [];
  const reconcile = record(coordination.reconcile);
  const capabilities = isRecord(options.capabilities) ? options.capabilities : getForgeCapabilities(provider);
  const projectTitle = text(options.projectTitle) ?? text(coordination.program?.title);
  const projectRequested = provider === 'github' && coordination.projectMode !== 'milestone' && coordination.projectMode !== 'off';
  const missingProjectCapabilities = ['projects', 'views'].filter((capability) => capabilities[capability] !== 'supported');
  const projectEnabled = projectRequested && (missingProjectCapabilities.length === 0 || options.allowProjectFallback !== true);
  const conflicts = [];
  const operations = [];

  if (coordination.issueMode !== 'delivery-group') {
    conflicts.push(problem('forge.reconcile.issue-mode', 'Presentation consolidation requires delivery-group issue mode.'));
  }
  if (
    provider === 'github' && coordination.projectMode === 'preferred' &&
    missingProjectCapabilities.length > 0 && options.allowProjectFallback !== true
  ) {
    conflicts.push({
      ...problem(
        'forge.scope.projects-missing',
        'GitHub Projects is preferred but required Project or View capabilities are unavailable. No remote writes are allowed; run `gh auth refresh -s project`, then `aapb forge status .`, or explicitly allow the projects,views fallback.'
      ),
      unavailableFeatures: missingProjectCapabilities,
      fallback: 'milestone',
      remediations: [
        { argv: ['gh', 'auth', 'refresh', '-s', 'project'], interactive: true },
        { argv: ['aapb', 'forge', 'status', '.'], interactive: false }
      ]
    });
  }
  if (groups.length === 0) conflicts.push(problem('forge.reconcile.groups-missing', 'Presentation consolidation requires coordination groups.'));

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const issueByTaskId = new Map();
  const issueByGroupId = new Map();
  let parent = null;
  for (const issue of remoteIssues) {
    const body = String(issue.body ?? '');
    if (body.startsWith(`<!-- aapb:plan:${planId} -->`)) parent = issue;
    const match = body.match(/<!-- aapb:task:([a-z0-9][a-z0-9._-]{0,99}) -->/);
    if (match) issueByTaskId.set(match[1], issue);
    const groupMatch = body.match(/<!-- aapb:group:([a-z0-9][a-z0-9._-]{0,99}) -->/);
    if (groupMatch) issueByGroupId.set(groupMatch[1], issue);
  }

  if (!parent) conflicts.push(problem('forge.reconcile.parent-missing', `No marker-owned parent issue was found for plan ${planId}.`));

  let superseded = 0;
  const survivorByGroup = new Map();
  const classificationByGroup = new Map();
  for (const group of groups) {
    const groupId = safeId(group.id, 'coordination group id');
    const groupTasks = (Array.isArray(group.taskIds) ? group.taskIds : []).map((taskId) => taskById.get(taskId)).filter(Boolean);
    const belongsToParent = (issue) => provider === 'github'
      ? Array.isArray(issue?.parentIssueNumbers) && issue.parentIssueNumbers.includes(parent?.number)
      : String(issue?.body ?? '').includes(`<!-- aapb:plan-owner:${planId} -->`);
    const existingGroupIssue = issueByGroupId.get(groupId);
    const legacyTaskIssues = groupTasks.map((task) => issueByTaskId.get(task.id)).filter((issue) => (
      Boolean(issue) && issue.state !== 'closed' && belongsToParent(issue)
    ));
    const candidateIssues = [existingGroupIssue, ...legacyTaskIssues].filter((issue) => Boolean(issue) && belongsToParent(issue))
      .filter((issue, index, values) => values.findIndex((candidate) => candidate.number === issue.number) === index)
      .sort((left, right) => positiveInteger(left.number, 'issue number') - positiveInteger(right.number, 'issue number'));
    const survivor = candidateIssues[0];
    if (!survivor) {
      conflicts.push(problem('forge.reconcile.group-issue-missing', `No existing task issue can represent coordination group ${groupId}.`, [groupId]));
      continue;
    }
    survivorByGroup.set(groupId, survivor);
    classificationByGroup.set(groupId, classificationFromIssues(candidateIssues, groupTasks));

    operations.push({
      id: `group:${groupId}:issue`,
      groupId,
      action: 'update',
      resource: 'issue',
      payload: {
        issueNumber: positiveInteger(survivor.number, 'issue number'),
        expectedUpdatedAt: updatedAt(survivor),
        title: requiredText(group.title, 'coordination group title'),
        body: renderGroupBody(planId, group, groupTasks),
        state: 'open',
        labels: [],
        preserveNonManagedLabels: true,
        removeClassificationLabels: projectEnabled,
        preserveManagedBody: true,
        milestoneTitle: text(options.milestoneTitle) ?? null
      }
    });

    for (const obsolete of candidateIssues.slice(1)) {
      superseded += 1;
      const obsoleteNumber = positiveInteger(obsolete.number, 'issue number');
      if (provider === 'github' && parent) {
        operations.push({
          id: `group:${groupId}:unlink:${obsoleteNumber}`,
          groupId,
          action: 'remove',
          resource: 'sub-issue',
          requiresApproval: 'supersede',
          payload: {
            parentIssueNumber: positiveInteger(parent.number, 'parent issue number'),
            childIssueId: positiveInteger(obsolete.id, 'child issue id'),
            childIssueNumber: obsoleteNumber
          }
        });
      }
      operations.push({
        id: `group:${groupId}:comment:${obsoleteNumber}`,
        groupId,
        action: 'ensure',
        resource: 'marker-comment',
        requiresApproval: 'supersede',
        payload: {
          issueNumber: obsoleteNumber,
          marker: `<!-- aapb:superseded:${planId}:${groupId}:${obsoleteNumber} -->`,
          body: `이 작업은 #${survivor.number} 이슈로 통합되었습니다. 기존 기록은 보존합니다.`
        }
      });
      operations.push({
        id: `group:${groupId}:supersede:${obsoleteNumber}`,
        groupId,
        action: 'update',
        resource: 'issue',
        requiresApproval: 'supersede',
        payload: {
          issueNumber: obsoleteNumber,
          expectedUpdatedAt: updatedAt(obsolete),
          state: 'closed',
          labels: [],
          preserveNonManagedLabels: true,
          removeClassificationLabels: projectEnabled
        }
      });
    }
  }

  const supportingIssues = Array.isArray(reconcile.supportingIssues) ? reconcile.supportingIssues.filter(isRecord) : [];
  const coordinationIssueNumbers = new Set([
    ...(parent ? [parent.number] : []),
    ...[...survivorByGroup.values()].map((issue) => issue.number)
  ]);
  for (const supporting of supportingIssues) {
    const id = safeId(supporting.id, 'supporting issue id');
    const issueNumber = positiveInteger(supporting.number, 'supporting issue number');
    const remote = remoteIssues.find((issue) => issue.number === issueNumber);
    if (coordinationIssueNumbers.has(issueNumber)) {
      conflicts.push(problem('forge.reconcile.issue-role-conflict', `Issue #${issueNumber} cannot be both a roadmap or delivery-group issue and a supporting issue.`, [`coordination.reconcile.supportingIssues.${id}`]));
      continue;
    }
    const belongsToParent = provider === 'github'
      ? Array.isArray(remote?.parentIssueNumbers) && remote.parentIssueNumbers.includes(parent?.number)
      : String(remote?.body ?? '').includes(`<!-- aapb:plan-owner:${planId} -->`);
    const identityMarker = /^<!-- aapb:(?:task|group):[a-z0-9][a-z0-9._-]{0,99} -->/i.exec(String(remote?.body ?? ''))?.[0];
    if (!remote || !belongsToParent || !identityMarker) {
      conflicts.push(problem('forge.reconcile.supporting-issue-unowned', `Supporting issue #${issueNumber} is missing or is not owned by program ${planId}.`, [`coordination.reconcile.supportingIssues.${id}`]));
      continue;
    }
    operations.push({
      id: `supporting:${id}:issue`,
      action: 'update',
      resource: 'issue',
      payload: {
        issueNumber,
        expectedUpdatedAt: updatedAt(remote),
        title: requiredText(supporting.title, 'supporting issue title'),
        body: renderSupportingIssueBody(planId, identityMarker, supporting),
        state: 'open',
        labels: [],
        preserveNonManagedLabels: true,
        removeClassificationLabels: projectEnabled,
        preserveManagedBody: true,
        milestoneTitle: text(options.milestoneTitle) ?? null
      }
    });
  }

  const pullRequests = Array.isArray(reconcile.pullRequests) ? reconcile.pullRequests.filter(isRecord) : [];
  for (const pull of pullRequests) {
    const pullNumber = positiveInteger(pull.number, 'pull request number');
    const remote = remotePullRequests.find((candidate) => candidate.number === pullNumber);
    if (!remote || remote.state === 'closed' || remote.draft !== true) {
      conflicts.push(problem('forge.reconcile.pull-request-unavailable', `Draft pull request #${pullNumber} is missing, closed, or no longer a draft.`, [`coordination.reconcile.pullRequests.${pullNumber}`]));
      continue;
    }
    const marker = `<!-- aapb:pr-reconcile:${planId}:${pullNumber} -->`;
    operations.push({
      id: `pull-request:${pullNumber}`,
      action: 'update',
      resource: 'draft-pull-request',
      payload: {
        pullRequestNumber: pullNumber,
        expectedUpdatedAt: updatedAt(remote),
        expectedTitle: requiredText(remote.title, 'observed pull request title'),
        adoptExisting: true,
        head: requiredText(remote.head, 'pull request head'),
        base: requiredText(remote.base, 'pull request base'),
        title: requiredText(pull.title, 'pull request title'),
        marker,
        body: renderPullRequestBody(marker, pull)
      }
    });
  }

  if (parent) {
    operations.unshift({
      id: `plan:${planId}:issue`,
      action: 'update',
      resource: 'issue',
      payload: {
        issueNumber: positiveInteger(parent.number, 'parent issue number'),
        expectedUpdatedAt: updatedAt(parent),
        title: requiredText(coordination.program?.title, 'program title'),
        body: renderProgramBody(planId, coordination.program, groups, tasks),
        state: 'open',
        labels: [],
        preserveNonManagedLabels: true,
        removeClassificationLabels: projectEnabled,
        preserveManagedBody: true,
        milestoneTitle: text(options.milestoneTitle) ?? null
      }
    });
  }

  const milestoneTitle = text(options.milestoneTitle);
  if (milestoneTitle && capabilities.milestones === 'supported') {
    operations.unshift({
      id: `milestone:${milestoneTitle}`,
      action: 'ensure',
      resource: 'milestone',
      capability: 'milestones',
      payload: { title: milestoneTitle, description: renderMilestoneBody(coordination.program, tasks) }
    });
  }

  if (projectEnabled && projectTitle) {
    const bootstrap = planForgeBootstrap({
      provider,
      capabilities: {
        ...capabilities,
        projects: 'supported',
        views: capabilities.views === 'supported' || options.allowProjectFallback !== true ? 'supported' : capabilities.views
      },
      projectTitle,
      projectMode: coordination.projectMode,
      language: options.language,
      milestoneTitle: null
    });
    const bootstrapOperations = bootstrap.operations
      .filter((operation) => ['label', 'project', 'view'].includes(operation.resource))
      .map((operation) => ['project', 'view'].includes(operation.resource) ? { ...operation, critical: true } : operation);
    const projectItemOperations = [];
    if (parent) projectItemOperations.push(projectItemOperation({
      operationId: `program:${planId}`, taskId: planId, projectTitle, issueNumber: parent.number,
      phase: 'program', status: aggregateStatus(tasks), tasks,
      classification: classificationFromIssues(remoteIssues, tasks)
    }));
    for (const group of groups) {
      const survivor = survivorByGroup.get(group.id);
      if (!survivor) continue;
      const groupTasks = group.taskIds.map((taskId) => taskById.get(taskId)).filter(Boolean);
      projectItemOperations.push(projectItemOperation({
        operationId: `group:${group.id}`, taskId: group.id, projectTitle, issueNumber: survivor.number,
        phase: group.id, status: aggregateStatus(groupTasks), tasks: groupTasks,
        classification: classificationByGroup.get(group.id)
      }));
    }
    for (const supporting of supportingIssues) {
      const remote = remoteIssues.find((issue) => issue.number === supporting.number);
      projectItemOperations.push(projectItemOperation({
        operationId: `supporting:${supporting.id}`, taskId: supporting.id, projectTitle, issueNumber: supporting.number,
        phase: 'baseline', status: 'review', tasks: [], classification: classificationFromIssues(remote ? [remote] : [], [])
      }));
    }
    for (const pull of pullRequests) {
      projectItemOperations.push(projectItemOperation({
        operationId: `pr:${pull.number}`, taskId: `pr-${pull.number}`, projectTitle, pullRequestNumber: pull.number,
        phase: 'baseline', status: 'review', tasks: [], classification: { priority: 1000, risk: 'high', area: 'baseline' }
      }));
    }
    operations.unshift(...bootstrapOperations, ...projectItemOperations);
  }

  const summaryArtifacts = artifactSummary(operations);
  const publicTitles = [
    text(coordination.program?.title),
    ...groups.map((group) => text(group.title)),
    ...supportingIssues.map((issue) => text(issue.title)),
    ...pullRequests.map((pull) => text(pull.title))
  ].filter(Boolean);
  const reviewableBodies = (parent ? 1 : 0) + groups.length + supportingIssues.length + pullRequests.length + (milestoneTitle ? 1 : 0);
  const executableOperations = conflicts.length === 0 ? operations : [];

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'forge.presentation-reconcile-plan',
    ok: conflicts.length === 0,
    provider,
    mode: { apply: false, writes: false, requiresAllowSupersede: superseded > 0 },
    summary: {
      groups: groups.length,
      superseded,
      operations: executableOperations.length,
      plannedOperations: operations.length,
      conflicts: conflicts.length,
      artifacts: summaryArtifacts,
      publicTitles,
      bodyCompleteness: { complete: reviewableBodies, total: reviewableBodies }
    },
    operations: executableOperations,
    warnings: [],
    conflicts
  };
}

function renderSupportingIssueBody(planId, identityMarker, issue) {
  return [
    identityMarker,
    `<!-- aapb:plan-owner:${planId} -->`,
    '',
    '<!-- aapb:managed:start -->',
    '',
    '## 목적',
    '',
    requiredText(issue.summary, 'supporting issue summary'),
    '',
    '## 완료 범위',
    ...bulletLines(issue.completedScope),
    '',
    '## 남은 gate',
    ...bulletLines(issue.remainingGates),
    '',
    '## 현재 상태',
    '',
    '- 기준선 결과 검토 대기',
    '',
    '<!-- aapb:managed:end -->'
  ].join('\n');
}

function renderPullRequestBody(marker, pull) {
  return [
    marker,
    '',
    '## 요약',
    '',
    requiredText(pull.summary, 'pull request summary'),
    '',
    '## 실제 변경',
    ...bulletLines(pull.actualChanges),
    '',
    '## 검증 결과',
    ...bulletLines(pull.verification),
    '',
    '## 증거 공백',
    ...bulletLines(pull.evidenceGaps),
    '',
    '## 위험',
    ...bulletLines(pull.risks),
    '',
    '## 롤백',
    ...bulletLines(pull.rollback),
    '',
    '## 남은 작업',
    ...bulletLines(pull.remainingWork)
  ].join('\n');
}

function renderMilestoneBody(program, tasks) {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const criteria = tasks.flatMap((task) => Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : []);
  const passed = criteria.filter((criterion) => criterion?.status === 'pass').length;
  return [
    '## 목적',
    requiredText(program?.summary, 'program summary'),
    '',
    '## 완료 정의',
    ...bulletLines(program?.successCriteria),
    '',
    '## 현재 단계와 blocker',
    `- 실행 task ${completed}/${tasks.length} 완료`,
    `- 수용 기준 ${passed}/${criteria.length} 통과`,
    `- ${completed === tasks.length ? '최종 검수 대기' : '승인된 계획의 실행 원장 시작 또는 재개 필요'}`
  ].join('\n');
}

function projectItemOperation({ operationId, taskId, projectTitle, issueNumber = null, pullRequestNumber = null, phase, status, tasks, classification = null }) {
  return {
    id: `${operationId}:project-item`,
    action: 'ensure',
    resource: 'project-item',
    capability: 'projects',
    critical: true,
    payload: {
      projectTitle,
      ...(pullRequestNumber ? { pullRequestNumber } : { issueNumber: positiveInteger(issueNumber, 'project issue number') }),
      taskId: safeId(taskId, 'project item id'),
      phase,
      status,
      priority: classification?.priority ?? (tasks.length ? Math.max(...tasks.map((task) => Number.isInteger(task.priority) ? task.priority : 50)) : 1000),
      risk: classification?.risk ?? (tasks.some((task) => task.risk === 'high') ? 'high' : tasks.some((task) => task.risk === 'medium') ? 'medium' : 'medium'),
      area: classification?.area ?? '',
      progress: tasks.length ? Math.round(tasks.filter((task) => task.status === 'completed').length / tasks.length * 100) : 0
    }
  };
}

function classificationFromIssues(issues, tasks) {
  const labels = issues.flatMap((issue) => Array.isArray(issue?.labels)
    ? issue.labels.map((label) => typeof label === 'string' ? label : label?.name).filter(Boolean)
    : []);
  const normalized = labels.map((label) => String(label).trim().toLowerCase());
  const priority = normalized.includes('priority:p0') || normalized.includes('aapb:priority:p0')
    ? 1000
    : normalized.includes('priority:p1') || normalized.includes('aapb:priority:p1')
      ? 750
      : normalized.includes('priority:p2') || normalized.includes('aapb:priority:p2')
        ? 500
        : normalized.includes('priority:p3') || normalized.includes('aapb:priority:p3')
          ? 250
          : tasks.length ? Math.max(...tasks.map((task) => Number.isInteger(task.priority) ? task.priority : 50)) : 50;
  const risk = normalized.includes('risk:high') || normalized.includes('aapb:risk:high')
    ? 'high'
    : normalized.includes('risk:medium') || normalized.includes('aapb:risk:medium')
      ? 'medium'
      : normalized.includes('risk:low') || normalized.includes('aapb:risk:low')
        ? 'low'
        : tasks.some((task) => task.risk === 'high') ? 'high' : tasks.some((task) => task.risk === 'low') ? 'low' : 'medium';
  const areas = [...new Set(normalized.flatMap((label) => {
    const match = /^(?:aapb:)?area:(.+)$/.exec(label);
    return match ? [match[1]] : [];
  }))].sort();
  return { priority, risk, area: areas.join(', ') };
}

function aggregateStatus(tasks) {
  const statuses = tasks.map((task) => String(task.status ?? 'planned').toLowerCase());
  if (statuses.length && statuses.every((status) => status === 'completed')) return 'completed';
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.includes('paused')) return 'paused';
  if (statuses.some((status) => ['claimed', 'running', 'verifying'].includes(status))) return 'running';
  if (statuses.includes('review')) return 'review';
  if (statuses.includes('ready')) return 'ready';
  return 'planned';
}

function artifactSummary(operations) {
  return {
    issuesUpdated: operations.filter((operation) => operation.resource === 'issue' && operation.action === 'update' && operation.payload?.state !== 'closed').length,
    issuesClosed: operations.filter((operation) => operation.resource === 'issue' && operation.payload?.state === 'closed').length,
    projects: operations.filter((operation) => operation.resource === 'project').length,
    views: operations.filter((operation) => operation.resource === 'view').length,
    labels: operations.filter((operation) => operation.resource === 'label').length,
    milestones: operations.filter((operation) => operation.resource === 'milestone').length,
    pullRequests: operations.filter((operation) => ['pull-request', 'draft-pull-request'].includes(operation.resource)).length,
    projectItems: operations.filter((operation) => operation.resource === 'project-item').length
  };
}

function renderProgramBody(planId, program, groups, tasks) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const lines = [
    `<!-- aapb:plan:${planId} -->`,
    '',
    '<!-- aapb:managed:start -->',
    '',
    '## 목표',
    '',
    requiredText(program?.summary, 'program summary'),
    '',
    '## 범위',
    ...bulletLines(program?.scope),
    '',
    '## 제외 범위',
    ...bulletLines(program?.nonGoals),
    '',
    '## 완료 조건',
    ...checkLines(program?.successCriteria),
    '',
    '## 진행 현황'
  ];
  for (const group of groups) {
    const groupTasks = (group.taskIds ?? []).map((taskId) => taskById.get(taskId)).filter(Boolean);
    const completed = groupTasks.filter((task) => task.status === 'completed').length;
    lines.push(`- ${group.title}: ${completed}/${groupTasks.length}`);
  }
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  lines.push(
    '',
    '## 현재 gate',
    `- ${completedTasks === tasks.length ? '모든 실행 task 검증 완료' : `실행 원장 시작 전 또는 진행 중 (${completedTasks}/${tasks.length})`}`,
    '',
    '## 다음 행동',
    `- ${completedTasks === tasks.length ? '최종 검증과 merge 승인 검토' : '의존성을 충족한 다음 task를 실행하고 controller 검증 기록'}`,
    '',
    '## 관련 PR',
    '- 연결된 PR은 marker 상태 댓글과 Project에서 갱신'
  );
  lines.push('', '<!-- aapb:managed:end -->');
  return lines.join('\n');
}

function renderGroupBody(planId, group, tasks) {
  const lines = [
    `<!-- aapb:group:${group.id} -->`,
    `<!-- aapb:plan-owner:${planId} -->`,
    '',
    '<!-- aapb:managed:start -->',
    '',
    '## 목적',
    '',
    requiredText(group.summary, 'coordination group summary'),
    '',
    '## 작업 구성'
  ];
  for (const task of tasks) {
    lines.push(`- ${task.status === 'completed' ? '완료' : '대기'} · ${task.title} (\`${task.id}\`)`);
  }
  lines.push('', '## 수용 기준');
  for (const task of tasks) {
    for (const criterion of task.acceptanceCriteria ?? []) {
      const value = typeof criterion === 'string' ? criterion : criterion?.text;
      if (text(value)) lines.push(`- [ ] ${singleLine(value)}`);
    }
  }
  lines.push('', '## 의존성');
  const dependencies = [...new Set(tasks.flatMap((task) => task.dependsOn ?? []))];
  lines.push(...(dependencies.length ? dependencies.map((dependency) => `- \`${dependency}\``) : ['- 없음']));
  lines.push('', '## 위험 및 복구', '', requiredText(group.rollback, 'coordination group rollback'));
  lines.push('', '## 현재 상태', '', `- ${groupState(tasks)}`);
  lines.push('', '<details>', '<summary>검증 명령과 허용 경로</summary>', '');
  for (const task of tasks) {
    for (const command of task.verificationCommands ?? []) lines.push(`- \`${redactPublicArgv(command.argv ?? []).map(singleLine).join(' ')}\``);
    for (const taskPath of task.paths ?? []) lines.push(`- 경로: \`${singleLine(taskPath)}\``);
  }
  lines.push('', '</details>');
  lines.push('', '<!-- aapb:managed:end -->');
  return lines.join('\n');
}

function groupState(tasks) {
  const statuses = tasks.map((task) => String(task.status ?? 'planned').toLowerCase());
  if (statuses.length > 0 && statuses.every((status) => status === 'completed')) return '완료';
  if (statuses.includes('blocked')) return '차단';
  if (statuses.includes('paused')) return '일시 중지';
  if (statuses.some((status) => ['claimed', 'running', 'verifying'].includes(status))) return '진행 중';
  if (statuses.includes('review')) return '검토 대기';
  if (statuses.includes('ready')) return '실행 준비';
  return '계획됨';
}

function bulletLines(values) {
  return (Array.isArray(values) ? values : []).map((value) => `- ${singleLine(value)}`);
}

function checkLines(values) {
  return (Array.isArray(values) ? values : []).map((value) => `- [ ] ${singleLine(value)}`);
}

function singleLine(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 1000);
}

function updatedAt(issue) {
  return requiredText(issue.updatedAt ?? issue.updated_at, 'issue updatedAt');
}

function safeId(value, label) {
  const normalized = requiredText(value, label);
  if (!/^[a-z0-9][a-z0-9._-]{0,99}$/.test(normalized) || normalized.includes('..')) throw new TypeError(`${label} must be a safe identifier.`);
  return normalized;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new TypeError(`${label} must be a positive integer.`);
  return number;
}

function requiredText(value, label) {
  const normalized = text(value);
  if (!normalized) throw new TypeError(`${label} is required.`);
  return normalized;
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function record(value) {
  return isRecord(value) ? value : {};
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function problem(id, message, paths = []) {
  return { id, message, paths };
}
