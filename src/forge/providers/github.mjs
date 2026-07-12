const DEFAULT_PER_PAGE = 100;
const MAX_PAGES = 100;
const ACTIVE_TASK_MARKER = /^<!-- aapb:[a-zA-Z0-9:._-]+ -->$/;
const SAFE_REPOSITORY_PART = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,99})$/;
const PROJECT_LAYOUTS = new Set(['table', 'board', 'roadmap']);
const PROJECT_FIELD_TYPES = new Set(['text', 'number', 'date', 'single_select']);
const PROJECT_FIELD_COLORS = new Set(['BLUE', 'GRAY', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']);
const MANAGED_STATUS_LABELS = new Set([
  'status:ready', 'status:in-progress', 'status:blocked', 'status:review', 'status:paused',
  'aapb:ready', 'aapb:running', 'aapb:blocked', 'aapb:review', 'aapb:paused'
]);

const MANAGED_PROJECT_FIELDS = Object.freeze([
  {
    name: 'AAPB Status',
    data_type: 'single_select',
    single_select_options: [
      { name: 'Planned', color: 'GRAY', description: 'Approved but not yet executable' },
      { name: 'Ready', color: 'GREEN', description: 'Eligible for execution' },
      { name: 'In Progress', color: 'BLUE', description: 'Currently being implemented or verified' },
      { name: 'In Review', color: 'PURPLE', description: 'Awaiting review' },
      { name: 'Blocked', color: 'RED', description: 'Cannot currently progress' },
      { name: 'Done', color: 'GREEN', description: 'Completed with required evidence' }
    ]
  },
  { name: 'AAPB Task ID', data_type: 'text' },
  { name: 'AAPB Phase', data_type: 'text' },
  {
    name: 'AAPB Priority',
    data_type: 'single_select',
    single_select_options: [
      { name: 'P0', color: 'RED', description: 'Critical priority' },
      { name: 'P1', color: 'ORANGE', description: 'High priority' },
      { name: 'P2', color: 'YELLOW', description: 'Normal priority' },
      { name: 'P3', color: 'GRAY', description: 'Low priority' }
    ]
  },
  {
    name: 'AAPB Risk',
    data_type: 'single_select',
    single_select_options: [
      { name: 'low', color: 'GREEN', description: 'Low delivery risk' },
      { name: 'medium', color: 'YELLOW', description: 'Medium delivery risk' },
      { name: 'high', color: 'RED', description: 'High delivery risk' }
    ]
  },
  { name: 'AAPB Progress', data_type: 'number' },
  { name: 'AAPB Area', data_type: 'text' }
]);

const PROJECT_CONTEXT_QUERY = `
query AapbProjectContext($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    id
    owner {
      __typename
      ... on Organization {
        id
        login
        projectsV2(first: 100, after: $after) {
          nodes { id number title }
          pageInfo { hasNextPage endCursor }
        }
      }
      ... on User {
        id
        login
        databaseId
        projectsV2(first: 100, after: $after) {
          nodes { id number title }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }
}`;

const CREATE_PROJECT_MUTATION = `
mutation AapbCreateProject($ownerId: ID!, $repositoryId: ID!, $title: String!, $clientMutationId: String!) {
  createProjectV2(input: {
    ownerId: $ownerId,
    repositoryId: $repositoryId,
    title: $title,
    clientMutationId: $clientMutationId
  }) {
    projectV2 { id number title }
  }
}`;

const PROJECT_VIEWS_QUERY = `
query AapbProjectViews($id: ID!, $after: String) {
  node(id: $id) {
    ... on ProjectV2 {
      views(first: 100, after: $after) {
        nodes { id number name layout }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

const PROJECT_FIELDS_QUERY = `
query AapbProjectFields($id: ID!, $after: String) {
  node(id: $id) {
    ... on ProjectV2 {
      fields(first: 100, after: $after) {
        nodes {
          __typename
          ... on ProjectV2Field { id name dataType }
          ... on ProjectV2SingleSelectField {
            id
            name
            options { id name }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

const PROJECT_ITEMS_QUERY = `
query AapbProjectItems($id: ID!, $after: String) {
  node(id: $id) {
    ... on ProjectV2 {
      items(first: 100, after: $after) {
        nodes {
          id
          content {
            __typename
            ... on Issue { id number }
            ... on PullRequest { id number }
          }
          fieldValues(first: 100) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldTextValue {
                text
                field { ... on ProjectV2FieldCommon { id name } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
                field { ... on ProjectV2FieldCommon { id name } }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                optionId
                name
                field { ... on ProjectV2FieldCommon { id name } }
              }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

const ADD_PROJECT_ITEM_MUTATION = `
mutation AapbAddProjectItem($projectId: ID!, $contentId: ID!, $clientMutationId: String!) {
  addProjectV2ItemById(input: {
    projectId: $projectId,
    contentId: $contentId,
    clientMutationId: $clientMutationId
  }) {
    item { id }
  }
}`;

const UPDATE_PROJECT_ITEM_FIELD_VALUE_MUTATION = `
mutation AapbUpdateProjectItemFieldValue(
  $projectId: ID!,
  $itemId: ID!,
  $fieldId: ID!,
  $value: ProjectV2FieldValue!,
  $clientMutationId: String!
) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId,
    itemId: $itemId,
    fieldId: $fieldId,
    value: $value,
    clientMutationId: $clientMutationId
  }) {
    projectV2Item { id }
  }
}`;

const DISCUSSION_CONTEXT_QUERY = `
query AapbDiscussionContext($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    id
    discussionCategories(first: 25) {
      nodes { id name slug }
    }
    discussions(first: 100, after: $after) {
      nodes {
        id
        number
        title
        body
        category { id name slug }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const CREATE_DISCUSSION_MUTATION = `
mutation AapbCreateDiscussion(
  $repositoryId: ID!,
  $categoryId: ID!,
  $title: String!,
  $body: String!,
  $clientMutationId: String!
) {
  createDiscussion(input: {
    repositoryId: $repositoryId,
    categoryId: $categoryId,
    title: $title,
    body: $body,
    clientMutationId: $clientMutationId
  }) {
    discussion { id number title body category { id name slug } }
  }
}`;

const UPDATE_DISCUSSION_MUTATION = `
mutation AapbUpdateDiscussion(
  $discussionId: ID!,
  $categoryId: ID!,
  $title: String!,
  $body: String!,
  $clientMutationId: String!
) {
  updateDiscussion(input: {
    discussionId: $discussionId,
    categoryId: $categoryId,
    title: $title,
    body: $body,
    clientMutationId: $clientMutationId
  }) {
    discussion { id number title body category { id name slug } }
  }
}`;

/**
 * Create a GitHub REST provider backed by an injected request transport.
 * The transport receives structured request objects; no shell command is built.
 *
 * @param {{transport: {request(request: object): Promise<unknown>}, repository: {owner: string, name: string}}} options
 */
export function createGithubProvider(options) {
  return createRestProvider({
    ...options,
    provider: 'github',
    labelsAsIds: false,
    milestoneIdentity: (milestone) => milestone?.number,
    headers: {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2026-03-10'
    }
  });
}

/**
 * Shared public REST implementation used by the GitHub and Gitea adapters.
 * Provider differences are passed as data so request paths and payloads remain
 * auditable structured values.
 */
export function createRestProvider(options) {
  const transport = validateTransport(options?.transport);
  const repository = validateRepository(options?.repository);
  const provider = options?.provider === 'gitea' ? 'gitea' : 'github';
  const labelsAsIds = Boolean(options?.labelsAsIds);
  const milestoneIdentity = options?.milestoneIdentity ?? ((milestone) => milestone?.number);
  const pageSizeParameter = options?.pageSizeParameter === 'limit' ? 'limit' : 'per_page';
  const headers = Object.freeze({ ...(options?.headers ?? {}) });
  const repositoryPath = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const projectCache = new Map();

  async function apiRequest(method, path, requestOptions = {}) {
    const request = {
      method,
      path,
      headers: { ...headers, ...(requestOptions.headers ?? {}) }
    };
    if (requestOptions.query && Object.keys(requestOptions.query).length > 0) {
      request.query = { ...requestOptions.query };
    }
    if (requestOptions.body !== undefined) request.body = structuredClone(requestOptions.body);
    try {
      const response = normalizeResponse(await transport.request(request));
      if (response.status >= 400) {
        throw forgeError('forge.request.failed', `Forge request failed with HTTP ${response.status}.`, {
          provider,
          method,
          path,
          status: response.status
        });
      }
      return response;
    } catch (error) {
      if (isForgeError(error)) throw error;
      throw forgeError(
        'forge.request.failed',
        `Forge request failed: ${redactSecrets(error?.message ?? 'remote request error')}`,
        {
          provider,
          method,
          path,
          status: numericStatus(error)
        }
      );
    }
  }

  async function graphqlRequest(operationName, query, variables) {
    if (provider !== 'github') {
      throw forgeError('forge.graphql.unsupported', 'GraphQL project operations are only available for GitHub.', { provider });
    }
    const response = await apiRequest('POST', '/graphql', {
      body: {
        operationName,
        query,
        variables: structuredClone(variables)
      }
    });
    const envelope = response.data && typeof response.data === 'object' ? response.data : {};
    if (Array.isArray(envelope.errors) && envelope.errors.length > 0) {
      throw forgeError(
        'forge.graphql.failed',
        `GitHub GraphQL request failed: ${envelope.errors.map((item) => redactSecrets(item?.message ?? 'unknown error')).join('; ')}`,
        {
          provider,
          operationName,
          errorTypes: envelope.errors
            .map((item) => normalizedText(item?.type ?? item?.extensions?.code))
            .filter(Boolean)
        }
      );
    }
    return envelope.data && typeof envelope.data === 'object' ? envelope.data : {};
  }

  async function listAll(path, query = {}) {
    const items = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await apiRequest('GET', path, {
        query: { ...query, page, [pageSizeParameter]: DEFAULT_PER_PAGE }
      });
      const pageItems = Array.isArray(response.data) ? response.data : [];
      items.push(...pageItems);
      if (!hasNextPage(response, pageItems.length, page)) return items;
    }
    throw forgeError('forge.pagination.limit', 'Forge pagination exceeded the 100 page safety limit.', {
      provider,
      path,
      maxPages: MAX_PAGES
    });
  }

  async function listCursorAll(path, query = {}) {
    const items = [];
    let after = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await apiRequest('GET', path, {
        query: {
          ...query,
          per_page: DEFAULT_PER_PAGE,
          ...(after ? { after } : {})
        }
      });
      const pageItems = Array.isArray(response.data) ? response.data : [];
      items.push(...pageItems);
      const next = nextCursor(response.headers);
      if (!next) return items;
      after = next;
    }
    throw forgeError('forge.pagination.limit', 'Forge cursor pagination exceeded the 100 page safety limit.', {
      provider,
      path,
      maxPages: MAX_PAGES
    });
  }

  async function ensureLabel(payload = {}) {
    const name = requiredText(payload.name, 'Label name');
    const labels = await listAll(`${repositoryPath}/labels`);
    const existing = labels.find((label) => normalizedText(label?.name)?.toLowerCase() === name.toLowerCase());
    if (existing) return resourceResult('reused', 'label', existing);

    const body = { name };
    const color = normalizedText(payload.color);
    const description = normalizedOptionalText(payload.description);
    if (color) body.color = color.replace(/^#/, '');
    if (description !== undefined) body.description = description;
    const response = await apiRequest('POST', `${repositoryPath}/labels`, { body });
    return resourceResult('created', 'label', response.data);
  }

  async function ensureMilestone(payload = {}) {
    const title = requiredText(payload.title, 'Milestone title');
    const milestones = await listAll(`${repositoryPath}/milestones`, { state: 'all' });
    const existing = milestones.find((milestone) => normalizedText(milestone?.title) === title);
    const body = { title };
    const description = normalizedOptionalText(payload.description);
    const dueOn = normalizedText(payload.dueOn ?? payload.due_on);
    if (description !== undefined) body.description = description;
    if (dueOn) body.due_on = dueOn;
    if (existing) {
      const desiredDescription = description ?? normalizedOptionalText(existing.description) ?? '';
      const existingDueOn = normalizedText(existing.due_on ?? existing.dueOn);
      if ((normalizedOptionalText(existing.description) ?? '') === desiredDescription && (!dueOn || existingDueOn === dueOn)) {
        return resourceResult('reused', 'milestone', existing);
      }
      const milestoneId = positiveInteger(milestoneIdentity(existing), 'Milestone identity');
      const response = await apiRequest('PATCH', `${repositoryPath}/milestones/${milestoneId}`, { body });
      return resourceResult('updated', 'milestone', response.data);
    }
    const response = await apiRequest('POST', `${repositoryPath}/milestones`, { body });
    return resourceResult('created', 'milestone', response.data);
  }

  async function resolveLabels(labelNames) {
    const names = uniqueStrings(labelNames);
    if (!labelsAsIds || names.length === 0) return names;
    const labels = await listAll(`${repositoryPath}/labels`);
    const ids = [];
    const missing = [];
    for (const name of names) {
      const label = labels.find((candidate) => normalizedText(candidate?.name)?.toLowerCase() === name.toLowerCase());
      if (Number.isInteger(label?.id) && label.id > 0) ids.push(label.id);
      else missing.push(name);
    }
    if (missing.length > 0) {
      throw forgeError('forge.issue.label-missing', 'One or more requested issue labels do not exist.', {
        provider,
        labels: missing
      });
    }
    return ids;
  }

  async function resolveMilestone(title) {
    const normalized = normalizedText(title);
    if (!normalized) return undefined;
    const result = await ensureMilestone({ title: normalized });
    const identity = milestoneIdentity(result.resource);
    if (!Number.isInteger(identity) || identity <= 0) {
      throw forgeError('forge.milestone.identity-missing', 'The forge milestone response did not contain a stable numeric identity.', {
        provider,
        title: normalized
      });
    }
    return identity;
  }

  async function buildIssueBody(payload, options = {}) {
    const body = {};
    if (payload.title !== undefined) body.title = requiredText(payload.title, 'Issue title');
    if (payload.state !== undefined) body.state = normalizeIssueState(payload.state);
    if (payload.body !== undefined || payload.marker || Array.isArray(payload.acceptanceCriteria)) {
      body.body = composeIssueBody(payload);
    }
    if (Array.isArray(payload.labels)) body.labels = await resolveLabels(payload.labels);
    if (normalizedText(payload.milestoneTitle)) {
      body.milestone = await resolveMilestone(payload.milestoneTitle);
    } else if (options.allowMilestoneClear && payload.milestoneTitle === null) {
      body.milestone = null;
    }
    return body;
  }

  async function updateIssue(payload = {}) {
    const issueNumber = positiveInteger(payload.issueNumber, 'Issue number');
    const expectedUpdatedAt = normalizedText(payload.expectedUpdatedAt);
    if (!expectedUpdatedAt) {
      const requirementsMutation = hasIssueRequirementsMutation(payload);
      throw forgeError(
        requirementsMutation ? 'forge.issue.requirements-cas-required' : 'forge.issue.cas-required',
        requirementsMutation
          ? 'Updating an existing issue title, body, or acceptance criteria requires an expectedUpdatedAt snapshot.'
          : 'Updating existing issue coordination state requires an expectedUpdatedAt snapshot.',
        { provider, issueNumber }
      );
    }
    const currentResponse = await apiRequest('GET', `${repositoryPath}/issues/${issueNumber}`);
    const current = currentResponse.data ?? {};
    let issuePayload = payload.preserveNonManagedLabels === true && Array.isArray(payload.labels)
      ? {
          ...payload,
          labels: uniqueStrings([
            ...currentIssueLabelNames(current).filter((name) => (
              !MANAGED_STATUS_LABELS.has(name.toLowerCase()) &&
              !(payload.removeClassificationLabels === true && isClassificationLabel(name))
            )),
            ...payload.labels
          ])
        }
      : payload;
    if (payload.preserveManagedBody === true && payload.body !== undefined) {
      issuePayload = {
        ...issuePayload,
        body: mergeManagedIssueBody(current.body, payload.body)
      };
    }
    const desired = await buildIssueBody(issuePayload);
    if (issueMatches(current, desired, labelsAsIds)) {
      return resourceResult('reused', 'issue', current);
    }
    const actualUpdatedAt = normalizedText(current.updated_at ?? current.updatedAt);
    if (expectedUpdatedAt && actualUpdatedAt !== expectedUpdatedAt) {
      throw forgeError(
        'forge.issue.updated-at-conflict',
        'The remote issue changed after the local snapshot was recorded.',
        { provider, issueNumber, expectedUpdatedAt, actualUpdatedAt }
      );
    }
    const response = await apiRequest('PATCH', `${repositoryPath}/issues/${issueNumber}`, { body: desired });
    return resourceResult('updated', 'issue', response.data);
  }

  async function ensureIssue(payload = {}) {
    if (Number.isInteger(payload.issueNumber) && payload.issueNumber > 0) {
      return updateIssue(payload);
    }
    const marker = validateMarker(payload.marker);
    requiredText(payload.title, 'Issue title');
    const issues = await listAll(`${repositoryPath}/issues`, { state: 'all' });
    const existing = issues.find((issue) => (
      !issue?.pull_request &&
      hasOwnedMarker(issue?.body, marker)
    ));
    if (existing) {
      // Marker discovery alone is not an authority grant. A plan-only sync may
      // create a missing issue, but it must not overwrite requirements or
      // coordination state on an issue that already exists remotely. Explicit
      // reconcile paths supply the observed updatedAt value and use CAS.
      if (!normalizedText(payload.expectedUpdatedAt)) {
        const desiredTitle = requiredText(payload.title, 'Issue title');
        const desiredBody = composeIssueBody({ ...payload, marker });
        if (normalizedText(existing.title) !== desiredTitle || String(existing.body ?? '') !== desiredBody) {
          throw forgeError(
            'forge.issue.reconcile-required',
            'The existing marker-owned issue requirements differ from the approved local plan; review and reconcile the remote issue before synchronization.',
            {
              provider,
              issueNumber: positiveInteger(existing.number, 'Issue number'),
              actualUpdatedAt: normalizedText(existing.updated_at ?? existing.updatedAt)
            }
          );
        }
        return resourceResult('reused', 'issue', existing);
      }
      return updateIssue({
        ...payload,
        marker,
        issueNumber: positiveInteger(existing.number, 'Issue number')
      });
    }
    const desired = await buildIssueBody({ ...payload, marker });
    const response = await apiRequest('POST', `${repositoryPath}/issues`, { body: desired });
    return resourceResult('created', 'issue', response.data);
  }

  async function upsertMarkerComment(payload = {}) {
    const issueNumber = positiveInteger(payload.issueNumber, 'Issue number');
    const marker = validateMarker(payload.marker);
    const requestedBody = normalizedOptionalText(payload.body) ?? '';
    const body = hasOwnedMarker(requestedBody, marker) ? requestedBody : `${marker}\n${requestedBody}`.trimEnd();
    const comments = await listAll(`${repositoryPath}/issues/${issueNumber}/comments`);
    const existing = comments.find((comment) => hasOwnedMarker(comment?.body, marker));
    if (!existing) {
      const response = await apiRequest('POST', `${repositoryPath}/issues/${issueNumber}/comments`, { body: { body } });
      return resourceResult('created', 'comment', response.data);
    }
    if (existing.body === body) return resourceResult('reused', 'comment', existing);
    const commentId = positiveInteger(existing.id, 'Comment id');
    const response = await apiRequest('PATCH', `${repositoryPath}/issues/comments/${commentId}`, { body: { body } });
    return resourceResult('updated', 'comment', response.data);
  }

  async function discoverProject(title) {
    let after = null;
    let repositoryId = null;
    let ownerContext = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await graphqlRequest('AapbProjectContext', PROJECT_CONTEXT_QUERY, {
        owner: repository.owner,
        name: repository.name,
        after
      });
      const remoteRepository = data.repository;
      if (!remoteRepository || typeof remoteRepository !== 'object') {
        throw forgeError('forge.project.repository-missing', 'GitHub could not resolve the configured repository for project bootstrap.', {
          provider,
          repository: `${repository.owner}/${repository.name}`
        });
      }
      repositoryId = requiredGraphQlId(remoteRepository.id, 'Repository node ID');
      const owner = remoteRepository.owner;
      const ownerType = owner?.__typename;
      if (ownerType !== 'Organization' && ownerType !== 'User') {
        throw forgeError('forge.project.owner-unsupported', 'GitHub project bootstrap requires a user or organization repository owner.', {
          provider,
          ownerType: normalizedText(ownerType)
        });
      }
      ownerContext = {
        type: ownerType,
        id: requiredGraphQlId(owner.id, 'Project owner node ID'),
        login: repository.owner,
        databaseId: Number.isInteger(owner.databaseId) && owner.databaseId > 0 ? owner.databaseId : null
      };
      const connection = owner.projectsV2;
      const projects = Array.isArray(connection?.nodes) ? connection.nodes : [];
      const project = projects.find((candidate) => normalizedText(candidate?.title) === title);
      if (project) {
        return {
          found: true,
          repositoryId,
          owner: ownerContext,
          project: normalizeProject(project)
        };
      }
      if (!connection?.pageInfo?.hasNextPage) break;
      after = normalizedText(connection.pageInfo.endCursor);
      if (!after) {
        throw forgeError('forge.pagination.cursor-missing', 'GitHub reported another project page without a continuation cursor.', {
          provider,
          operationName: 'AapbProjectContext'
        });
      }
    }
    return { found: false, repositoryId, owner: ownerContext, project: null };
  }

  async function listProjectViews(projectId) {
    const views = [];
    let after = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await graphqlRequest('AapbProjectViews', PROJECT_VIEWS_QUERY, {
        id: requiredGraphQlId(projectId, 'Project node ID'),
        after
      });
      const connection = data.node?.views;
      views.push(...(Array.isArray(connection?.nodes) ? connection.nodes : []));
      if (!connection?.pageInfo?.hasNextPage) return views;
      after = normalizedText(connection.pageInfo.endCursor);
      if (!after) {
        throw forgeError('forge.pagination.cursor-missing', 'GitHub reported another project view page without a continuation cursor.', {
          provider,
          operationName: 'AapbProjectViews'
        });
      }
    }
    throw forgeError('forge.pagination.limit', 'GitHub project view pagination exceeded the 100 page safety limit.', {
      provider,
      maxPages: MAX_PAGES
    });
  }

  async function ensureManagedProjectFields(context, requestedFields) {
    if (context.managedFields) return { fields: context.managedFields, created: 0 };
    const fields = normalizeManagedProjectFields(requestedFields);
    const path = projectFieldsPath(context);
    const existingFields = await listCursorAll(path);
    const managed = [];
    let created = 0;
    for (const field of fields) {
      const existing = existingFields.find((candidate) => normalizedText(candidate?.name) === field.name);
      if (existing) {
        managed.push(existing);
        continue;
      }
      const response = await apiRequest('POST', path, { body: field });
      managed.push(response.data);
      created += 1;
    }
    context.managedFields = managed;
    return { fields: managed, created };
  }

  async function ensureProject(payload = {}) {
    if (provider !== 'github') {
      return fallbackResult('project', provider);
    }
    const title = requiredText(payload.title, 'Project title');
    let context = projectCache.get(title);
    let projectStatus = 'reused';
    if (!context) {
      const discovered = await discoverProject(title);
      if (!discovered.owner || !discovered.repositoryId) {
        throw forgeError('forge.project.context-missing', 'GitHub project owner or repository identity could not be resolved.', {
          provider,
          title
        });
      }
      let project = discovered.project;
      if (!project) {
        const data = await graphqlRequest('AapbCreateProject', CREATE_PROJECT_MUTATION, {
          ownerId: discovered.owner.id,
          repositoryId: discovered.repositoryId,
          title,
          clientMutationId: mutationId('project-create', repository, title)
        });
        project = normalizeProject(data.createProjectV2?.projectV2);
        projectStatus = 'created';
      }
      context = {
        owner: discovered.owner,
        repositoryId: discovered.repositoryId,
        project,
        views: projectStatus === 'created' ? [] : await listProjectViews(project.id),
        managedFields: null
      };
      projectCache.set(title, context);
    }

    const fieldResult = await ensureManagedProjectFields(context, payload.fields);
    const status = projectStatus === 'created'
      ? 'created'
      : fieldResult.created > 0 ? 'updated' : 'reused';
    return resourceResult(status, 'project', {
      ...context.project,
      owner: { type: context.owner.type, login: context.owner.login },
      managedFields: fieldResult.fields
    });
  }

  async function ensureProjectView(payload = {}) {
    if (provider !== 'github') {
      return fallbackResult('view', provider);
    }
    const projectTitle = requiredText(payload.projectTitle, 'Project title');
    const name = requiredText(payload.name, 'Project view name');
    const layout = requiredText(payload.layout, 'Project view layout').toLowerCase();
    if (!PROJECT_LAYOUTS.has(layout)) throw new TypeError('Project view layout must be table, board, or roadmap.');
    await ensureProject({ title: projectTitle, fields: payload.fields });
    const context = projectCache.get(projectTitle);
    const existing = context.views.find((view) => normalizedText(view?.name) === name);
    if (existing) return resourceResult('reused', 'view', existing);

    const body = { name, layout };
    const filter = normalizedOptionalText(payload.filter);
    if (filter !== undefined && filter !== '') body.filter = filter;
    if (layout !== 'roadmap') {
      const visibleFields = context.managedFields
        .map((field) => Number(field?.id))
        .filter((id) => Number.isInteger(id) && id > 0);
      if (visibleFields.length > 0) body.visible_fields = visibleFields;
    }
    const response = await apiRequest('POST', projectViewsPath(context), { body });
    const view = response.data?.value ?? response.data;
    context.views.push(view);
    return resourceResult('created', 'view', view);
  }

  async function listProjectFields(projectId) {
    const fields = [];
    let after = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await graphqlRequest('AapbProjectFields', PROJECT_FIELDS_QUERY, {
        id: requiredGraphQlId(projectId, 'Project node ID'),
        after
      });
      const connection = data.node?.fields;
      fields.push(...(Array.isArray(connection?.nodes) ? connection.nodes : []));
      if (!connection?.pageInfo?.hasNextPage) return fields;
      after = normalizedText(connection.pageInfo.endCursor);
      if (!after) {
        throw forgeError('forge.pagination.cursor-missing', 'GitHub reported another project field page without a continuation cursor.', {
          provider,
          operationName: 'AapbProjectFields'
        });
      }
    }
    throw forgeError('forge.pagination.limit', 'GitHub project field pagination exceeded the 100 page safety limit.', {
      provider,
      maxPages: MAX_PAGES
    });
  }

  async function listProjectItems(projectId) {
    const items = [];
    let after = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await graphqlRequest('AapbProjectItems', PROJECT_ITEMS_QUERY, {
        id: requiredGraphQlId(projectId, 'Project node ID'),
        after
      });
      const connection = data.node?.items;
      items.push(...(Array.isArray(connection?.nodes) ? connection.nodes : []));
      if (!connection?.pageInfo?.hasNextPage) return items;
      after = normalizedText(connection.pageInfo.endCursor);
      if (!after) {
        throw forgeError('forge.pagination.cursor-missing', 'GitHub reported another project item page without a continuation cursor.', {
          provider,
          operationName: 'AapbProjectItems'
        });
      }
    }
    throw forgeError('forge.pagination.limit', 'GitHub project item pagination exceeded the 100 page safety limit.', {
      provider,
      maxPages: MAX_PAGES
    });
  }

  async function resolveProjectContent(payload) {
    if (Number.isInteger(payload.pullRequestNumber) && payload.pullRequestNumber > 0) {
      const response = await apiRequest('GET', `${repositoryPath}/pulls/${payload.pullRequestNumber}`);
      return response.data ?? {};
    }
    if (Number.isInteger(payload.issueNumber) && payload.issueNumber > 0) {
      const response = await apiRequest('GET', `${repositoryPath}/issues/${payload.issueNumber}`);
      if (response.data?.pull_request) {
        throw forgeError('forge.project-item.issue-required', 'The requested issue number resolved to a pull request; use pullRequestNumber explicitly.', { provider, issueNumber: payload.issueNumber });
      }
      return response.data ?? {};
    }
    const marker = validateMarker(payload.issueMarker);
    const issues = await listAll(`${repositoryPath}/issues`, { state: 'all' });
    const issue = issues.find((candidate) => !candidate?.pull_request && hasOwnedMarker(candidate?.body, marker));
    if (!issue) {
      throw forgeError('forge.project-item.issue-missing', 'The synchronized child issue must exist before it can be added to the Project.', {
        provider,
        marker
      });
    }
    return issue;
  }

  async function ensureProjectItem(payload = {}) {
    if (provider !== 'github') return fallbackResult('project-item', provider);
    const projectTitle = requiredText(payload.projectTitle, 'Project title');
    const taskId = validateTaskId(payload.taskId ?? payload.groupId);
    await ensureProject({ title: projectTitle });
    const context = projectCache.get(projectTitle);
    const projectId = requiredGraphQlId(context?.project?.id, 'Project node ID');
    const content = await resolveProjectContent(payload);
    const contentNumber = positiveInteger(content.number ?? content.index, 'Project content number');
    const contentNodeId = requiredGraphQlId(content.node_id ?? content.nodeId, 'Project content node ID');
    const fields = await listProjectFields(projectId);
    // Validate all managed fields/options before the first item mutation so a
    // pre-existing incompatible Project cannot receive a partial task item.
    const desiredValues = managedProjectItemFieldValues(fields, {
      taskId,
      phase: payload.phase,
      status: payload.status,
      priority: payload.priority,
      risk: payload.risk,
      progress: payload.progress
    });
    const items = await listProjectItems(projectId);
    let item = items.find((candidate) => candidate?.content?.id === contentNodeId);
    let created = false;
    if (!item) {
      const data = await graphqlRequest('AapbAddProjectItem', ADD_PROJECT_ITEM_MUTATION, {
        projectId,
        contentId: contentNodeId,
        clientMutationId: mutationId('project-item-add', repository, `${projectTitle}:${taskId}`)
      });
      item = data.addProjectV2ItemById?.item;
      created = true;
    }
    const itemId = requiredGraphQlId(item?.id, 'Project item node ID');
    const currentValues = projectItemFieldValues(item);
    let updated = 0;
    for (const desired of desiredValues) {
      if (projectFieldValueMatches(currentValues.get(desired.field.id), desired.value)) continue;
      await graphqlRequest('AapbUpdateProjectItemFieldValue', UPDATE_PROJECT_ITEM_FIELD_VALUE_MUTATION, {
        projectId,
        itemId,
        fieldId: desired.field.id,
        value: desired.value,
        clientMutationId: mutationId(
          'project-item-field',
          repository,
          `${projectTitle}:${taskId}:${desired.field.name}:${JSON.stringify(desired.value)}`
        )
      });
      currentValues.set(desired.field.id, desired.value);
      updated += 1;
    }
    return resourceResult(created ? 'created' : updated > 0 ? 'updated' : 'reused', 'project-item', {
      id: itemId,
      contentNumber,
      ...(payload.pullRequestNumber ? { pullRequestNumber: contentNumber } : { issueNumber: contentNumber }),
      project: { id: projectId, number: context.project.number, title: context.project.title },
      fieldsUpdated: updated
    });
  }

  async function ensureDiscussion(payload = {}) {
    if (provider !== 'github') return fallbackResult('discussion', provider);
    const marker = validateMarker(payload.marker);
    const title = requiredText(payload.title, 'Discussion title');
    const requestedBody = normalizedOptionalText(payload.body) ?? '';
    const body = hasOwnedMarker(requestedBody, marker)
      ? requestedBody
      : `${marker}${requestedBody ? `\n\n${requestedBody}` : ''}`;
    const requestedCategoryId = normalizedText(payload.categoryId);
    const requestedCategoryName = normalizedText(payload.categoryName) ?? 'General';
    let after = null;
    let repositoryId = null;
    let category = null;
    let existing = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await graphqlRequest('AapbDiscussionContext', DISCUSSION_CONTEXT_QUERY, {
        owner: repository.owner,
        name: repository.name,
        after
      });
      const remoteRepository = data.repository;
      if (!remoteRepository || typeof remoteRepository !== 'object') {
        throw forgeError('forge.discussion.repository-missing', 'GitHub could not resolve the repository for discussion synchronization.', {
          provider,
          repository: `${repository.owner}/${repository.name}`
        });
      }
      repositoryId = requiredGraphQlId(remoteRepository.id, 'Repository node ID');
      const categories = Array.isArray(remoteRepository.discussionCategories?.nodes)
        ? remoteRepository.discussionCategories.nodes
        : [];
      category ??= categories.find((candidate) => (
        requestedCategoryId
          ? candidate?.id === requestedCategoryId
          : normalizedText(candidate?.name)?.toLowerCase() === requestedCategoryName.toLowerCase() ||
            normalizedText(candidate?.slug)?.toLowerCase() === requestedCategoryName.toLowerCase()
      ));
      const connection = remoteRepository.discussions;
      const discussions = Array.isArray(connection?.nodes) ? connection.nodes : [];
      existing ??= discussions.find((discussion) => hasOwnedMarker(discussion?.body, marker));
      if (existing || !connection?.pageInfo?.hasNextPage) break;
      after = normalizedText(connection.pageInfo.endCursor);
      if (!after) {
        throw forgeError('forge.pagination.cursor-missing', 'GitHub reported another discussion page without a continuation cursor.', {
          provider,
          operationName: 'AapbDiscussionContext'
        });
      }
    }
    if (!category) {
      throw forgeError('forge.discussion.category-missing', 'The requested GitHub discussion category does not exist.', {
        provider,
        categoryId: requestedCategoryId,
        categoryName: requestedCategoryName
      });
    }
    const categoryId = requiredGraphQlId(category.id, 'Discussion category node ID');
    if (existing) {
      if (existing.title === title && existing.body === body && existing.category?.id === categoryId) {
        return resourceResult('reused', 'discussion', existing);
      }
      const data = await graphqlRequest('AapbUpdateDiscussion', UPDATE_DISCUSSION_MUTATION, {
        discussionId: requiredGraphQlId(existing.id, 'Discussion node ID'),
        categoryId,
        title,
        body,
        clientMutationId: mutationId('discussion-update', repository, marker)
      });
      return resourceResult('updated', 'discussion', data.updateDiscussion?.discussion);
    }
    const data = await graphqlRequest('AapbCreateDiscussion', CREATE_DISCUSSION_MUTATION, {
      repositoryId,
      categoryId,
      title,
      body,
      clientMutationId: mutationId('discussion-create', repository, marker)
    });
    return resourceResult('created', 'discussion', data.createDiscussion?.discussion);
  }

  async function ensureDraftPullRequest(payload = {}) {
    const head = validateBranch(payload.head, 'Pull request head');
    const base = validateBranch(payload.base, 'Pull request base');
    const requestedTitle = requiredText(payload.title, 'Pull request title');
    const title = provider === 'gitea' && !/^(?:WIP:|\[WIP\])/i.test(requestedTitle)
      ? `WIP: ${requestedTitle}`
      : requestedTitle;
    const body = normalizedOptionalText(payload.body) ?? '';
    const marker = validateMarker(payload.marker ?? /^<!-- aapb:[^\r\n]+ -->/.exec(body)?.[0]);
    if (!hasOwnedMarker(body, marker)) throw new TypeError('Pull request body must begin with its AAPB ownership marker.');
    const explicitNumber = Number.isInteger(payload.pullRequestNumber) && payload.pullRequestNumber > 0
      ? payload.pullRequestNumber
      : null;
    const existing = explicitNumber
      ? (await apiRequest('GET', `${repositoryPath}/pulls/${explicitNumber}`)).data
      : (await listAll(`${repositoryPath}/pulls`, { state: 'open' })).find((pull) => (
          normalizedText(pull?.head?.ref ?? pull?.head) === head &&
          normalizedText(pull?.base?.ref ?? pull?.base) === base
        ));
    if (existing) {
      const existingHead = normalizedText(existing?.head?.ref ?? existing?.head);
      const existingBase = normalizedText(existing?.base?.ref ?? existing?.base);
      if (existingHead !== head || existingBase !== base) {
        throw forgeError('forge.pull-request.branch-conflict', 'The reviewed pull request head or base changed after the local plan was approved.', {
          provider, pullNumber: existing.number, expectedHead: head, actualHead: existingHead, expectedBase: base, actualBase: existingBase
        });
      }
      const owned = hasOwnedMarker(existing.body ?? '', marker);
      if (!owned && !(explicitNumber && payload.adoptExisting === true)) {
        throw forgeError(
          'forge.pull-request.ownership-conflict',
          'An existing pull request for this branch is not owned by the current automation plan.',
          { provider, pullNumber: existing.number, head, base }
        );
      }
      if (explicitNumber) {
        const expectedUpdatedAt = normalizedText(payload.expectedUpdatedAt);
        const expectedTitle = normalizedText(payload.expectedTitle);
        if (!expectedUpdatedAt || !expectedTitle) {
          throw forgeError('forge.pull-request.cas-required', 'Adopting or updating a numbered pull request requires expectedUpdatedAt and expectedTitle snapshots.', {
            provider, pullNumber: explicitNumber
          });
        }
        const actualUpdatedAt = normalizedText(existing.updated_at ?? existing.updatedAt);
        if (expectedUpdatedAt !== actualUpdatedAt || expectedTitle !== normalizedText(existing.title)) {
          throw forgeError('forge.pull-request.updated-at-conflict', 'The reviewed pull request changed after the local snapshot was recorded.', {
            provider, pullNumber: explicitNumber, expectedUpdatedAt, actualUpdatedAt
          });
        }
      }
      const draftLike = provider === 'gitea'
        ? /^(?:WIP:|\[WIP\])/i.test(existing.title ?? '')
        : existing.draft !== false;
      if (!draftLike) {
        throw forgeError(
          'forge.pull-request.not-draft',
          'An existing pull request for this branch is no longer a draft; it requires review instead of replacement.',
          { provider, pullNumber: existing.number, head, base }
        );
      }
      if (existing.title === title && (existing.body ?? '') === body) {
        return {
          ...resourceResult('reused', 'pull-request', existing),
          ...(provider === 'gitea' ? { fallback: 'Gitea draft review is represented by its documented WIP title convention.' } : {})
        };
      }
      const pullNumber = positiveInteger(existing.number ?? existing.index, 'Pull request number');
      const response = await apiRequest('PATCH', `${repositoryPath}/pulls/${pullNumber}`, {
        body: { title, body }
      });
      return {
        ...resourceResult('updated', 'pull-request', response.data),
        ...(provider === 'gitea' ? { fallback: 'Gitea draft review is represented by its documented WIP title convention.' } : {})
      };
    }
    const response = await apiRequest('POST', `${repositoryPath}/pulls`, {
      body: provider === 'gitea' ? { title, body, head, base } : { title, body, head, base, draft: true }
    });
    return {
      ...resourceResult('created', 'pull-request', response.data),
      ...(provider === 'gitea' ? { fallback: 'Gitea draft review is represented by its documented WIP title convention.' } : {})
    };
  }

  async function ensureSubIssue(payload = {}) {
    if (provider !== 'github') return fallbackResult('sub-issue', provider);
    const parentMarker = validateMarker(payload.parentMarker);
    const childMarker = validateMarker(payload.childMarker);
    const issues = await listAll(`${repositoryPath}/issues`, { state: 'all' });
    const parent = issues.find((issue) => !issue?.pull_request && hasOwnedMarker(issue?.body, parentMarker));
    const child = issues.find((issue) => !issue?.pull_request && hasOwnedMarker(issue?.body, childMarker));
    if (!parent || !child) {
      throw forgeError('forge.sub-issue.issue-missing', 'Parent and child issues must exist before their relationship is created.', {
        provider,
        parentFound: Boolean(parent),
        childFound: Boolean(child)
      });
    }
    const parentNumber = positiveInteger(parent.number, 'Parent issue number');
    const childId = positiveInteger(child.id, 'Child issue id');
    const path = `${repositoryPath}/issues/${parentNumber}/sub_issues`;
    const existing = await listAll(path);
    if (existing.some((issue) => issue?.id === childId || issue?.number === child.number)) {
      return resourceResult('reused', 'sub-issue', child);
    }
    const response = await apiRequest('POST', path, { body: { sub_issue_id: childId } });
    return resourceResult('created', 'sub-issue', response.data ?? child);
  }

  async function removeSubIssue(payload = {}) {
    if (provider !== 'github') return fallbackResult('sub-issue', provider);
    const parentIssueNumber = positiveInteger(payload.parentIssueNumber, 'Parent issue number');
    const childIssueId = positiveInteger(payload.childIssueId, 'Child issue id');
    const path = `${repositoryPath}/issues/${parentIssueNumber}/sub_issues`;
    const existing = await listAll(path);
    if (!existing.some((issue) => Number(issue?.id) === childIssueId)) {
      return resourceResult('reused', 'sub-issue', {
        id: childIssueId,
        number: Number.isInteger(payload.childIssueNumber) ? payload.childIssueNumber : undefined
      });
    }
    const response = await apiRequest('DELETE', `${repositoryPath}/issues/${parentIssueNumber}/sub_issue`, {
      body: { sub_issue_id: childIssueId }
    });
    return resourceResult('removed', 'sub-issue', response.data ?? {
      id: childIssueId,
      number: Number.isInteger(payload.childIssueNumber) ? payload.childIssueNumber : undefined
    });
  }

  async function applyOperation(operation = {}) {
    if (operation.mode === 'fallback' || operation.action === 'use') {
      return {
        status: 'fallback',
        resourceType: operation.resource,
        fallback: documentedFallback(operation.resource, provider)
      };
    }
    switch (operation.resource) {
      case 'label':
        return ensureLabel(operation.payload);
      case 'milestone':
        return ensureMilestone(operation.payload);
      case 'issue':
        return ensureIssue(operation.payload);
      case 'project':
        return provider === 'gitea'
          ? fallbackResult('project', provider)
          : ensureProject(operation.payload);
      case 'project-field':
        return provider === 'gitea'
          ? fallbackResult('project-field', provider)
          : ensureProject({
              title: operation.payload?.projectTitle,
              fields: [operation.payload]
            });
      case 'view':
      case 'project-view':
        return provider === 'gitea'
          ? fallbackResult('view', provider)
          : ensureProjectView(operation.payload);
      case 'project-item':
        return ensureProjectItem(operation.payload);
      case 'discussion':
        if (provider === 'gitea') {
          return ensureIssue({
            ...operation.payload,
            marker: operation.payload?.marker ?? discussionOperationMarker(operation),
            state: operation.payload?.state ?? 'open'
          });
        }
        return ensureDiscussion({
          ...operation.payload,
          marker: operation.payload?.marker ?? discussionOperationMarker(operation)
        });
      case 'comment':
      case 'marker-comment':
        return upsertMarkerComment(operation.payload);
      case 'pull-request':
      case 'draft-pull-request':
        return ensureDraftPullRequest(operation.payload);
      case 'sub-issue':
        return operation.action === 'remove'
          ? removeSubIssue(operation.payload)
          : ensureSubIssue(operation.payload);
      default:
        throw forgeError('forge.operation.unsupported', `Unsupported ${provider} forge operation resource: ${String(operation.resource)}.`, {
          provider,
          resource: normalizedText(operation.resource)
        });
    }
  }

  return Object.freeze({
    provider,
    repository: { ...repository },
    ensureLabel,
    ensureMilestone,
    ensureIssue,
    updateIssue,
    upsertMarkerComment,
    ensureProject,
    ensureProjectView,
    ensureProjectItem,
    ensureDiscussion,
    ensureDraftPullRequest,
    ensureSubIssue,
    applyOperation
  });
}

function mergeManagedIssueBody(currentValue, desiredValue) {
  const current = String(currentValue ?? '');
  const desired = String(desiredValue ?? '');
  const startMarker = '<!-- aapb:managed:start -->';
  const endMarker = '<!-- aapb:managed:end -->';
  const currentStart = current.indexOf(startMarker);
  const currentEndStart = current.indexOf(endMarker, currentStart + startMarker.length);
  const desiredStart = desired.indexOf(startMarker);
  const desiredEndStart = desired.indexOf(endMarker, desiredStart + startMarker.length);
  if (desiredStart < 0 || desiredEndStart < 0) {
    throw new TypeError('Managed issue body updates require start and end markers.');
  }
  if (currentStart < 0 || currentEndStart < 0) {
    const desiredPrefix = desired.slice(0, desiredStart).trimEnd();
    const currentWithoutOwnedIdentity = current
      .replace(/<!--\s*aapb:(?:plan|task|group):[a-z0-9][a-z0-9._-]{0,99}\s*-->/gi, '')
      .trim();
    const managed = desired.slice(desiredStart, desiredEndStart + endMarker.length).trim();
    return [desiredPrefix, currentWithoutOwnedIdentity, managed].filter(Boolean).join('\n\n');
  }
  const currentEnd = currentEndStart + endMarker.length;
  const desiredEnd = desiredEndStart + endMarker.length;
  const prefix = current.slice(0, currentStart).trimEnd();
  const managed = desired.slice(desiredStart, desiredEnd).trim();
  const suffix = current.slice(currentEnd).trimStart();
  return [prefix, managed, suffix].filter(Boolean).join('\n\n');
}

export function forgeError(code, message, details = {}) {
  return Object.assign(new Error(redactSecrets(message)), {
    name: code.includes('conflict') ? 'ForgeConflictError' : 'ForgeError',
    code,
    details: structuredClone(details)
  });
}

export function redactSecrets(value) {
  return String(value)
    .replace(/\b(?:gh[pousr]|github_pat)_[a-zA-Z0-9_]{12,}\b/g, '[REDACTED]')
    .replace(/\b(Bearer|Basic)\s+[a-zA-Z0-9._~+/=-]+/gi, '$1 [REDACTED]')
    .replace(/\b(token|password|passwd|secret|authorization|api[-_]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]');
}

function normalizeResponse(response) {
  if (Array.isArray(response)) return { status: 200, data: response, headers: {} };
  if (!response || typeof response !== 'object') return { status: 200, data: response, headers: {} };
  const hasEnvelope = 'data' in response || 'status' in response || 'statusCode' in response || 'headers' in response;
  if (!hasEnvelope) return { status: 200, data: response, headers: {} };
  return {
    status: Number(response.status ?? response.statusCode ?? 200),
    data: 'data' in response ? response.data : response.body,
    headers: response.headers ?? {}
  };
}

function currentIssueLabelNames(issue) {
  if (!Array.isArray(issue?.labels)) return [];
  return issue.labels
    .map((label) => typeof label === 'string' ? label : label?.name)
    .filter((label) => typeof label === 'string' && label.trim())
    .map((label) => label.trim());
}

function isClassificationLabel(value) {
  const label = String(value ?? '').trim().toLowerCase();
  return /^(?:priority|risk|area):/.test(label) || /^aapb:(?:priority|risk|area):/.test(label);
}

function hasNextPage(response, itemCount, page) {
  const link = readHeader(response.headers, 'link');
  if (link) return /rel\s*=\s*["']?next["']?/i.test(link);
  const total = Number(readHeader(response.headers, 'x-total-count'));
  if (Number.isFinite(total) && total >= 0) return page * DEFAULT_PER_PAGE < total;
  return itemCount === DEFAULT_PER_PAGE;
}

function readHeader(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) return value;
  }
  return null;
}

function issueMatches(current, desired, labelsAsIds) {
  for (const [key, value] of Object.entries(desired)) {
    if (key === 'labels') {
      const currentLabels = Array.isArray(current.labels)
        ? current.labels.map((label) => labelsAsIds ? label?.id ?? label : label?.name ?? label)
        : [];
      if (!sameSet(currentLabels, value)) return false;
      continue;
    }
    if (key === 'milestone') {
      const currentMilestone = labelsAsIds
        ? current.milestone?.id ?? current.milestone
        : current.milestone?.number ?? current.milestone;
      if ((currentMilestone ?? null) !== (value ?? null)) return false;
      continue;
    }
    if ((current[key] ?? '') !== (value ?? '')) return false;
  }
  return true;
}

function hasIssueRequirementsMutation(payload) {
  return payload.title !== undefined ||
    payload.body !== undefined ||
    payload.marker !== undefined ||
    payload.acceptanceHeading !== undefined ||
    payload.acceptanceCriteria !== undefined;
}

function composeIssueBody(payload) {
  const marker = payload.marker ? validateMarker(payload.marker) : null;
  let body = normalizedOptionalText(payload.body) ?? '';
  if (marker && !hasOwnedMarker(body, marker)) body = `${marker}${body ? `\n\n${body}` : ''}`;
  if (Array.isArray(payload.acceptanceCriteria)) {
    const criteria = uniqueStrings(payload.acceptanceCriteria);
    const acceptanceHeading = normalizedOptionalText(payload.acceptanceHeading) ?? 'Acceptance criteria';
    if (acceptanceHeading.length > 80 || /[\r\n]/.test(acceptanceHeading)) {
      throw new TypeError('Acceptance heading must be a single line with at most 80 characters.');
    }
    const block = [
      '<!-- aapb:acceptance:start -->',
      `## ${acceptanceHeading}`,
      ...criteria.map((criterion) => `- [ ] ${criterion.replace(/[\r\n]+/g, ' ')}`),
      '<!-- aapb:acceptance:end -->'
    ].join('\n');
    const pattern = /<!-- aapb:acceptance:start -->[\s\S]*?<!-- aapb:acceptance:end -->/;
    body = pattern.test(body) ? body.replace(pattern, block) : `${body}${body ? '\n\n' : ''}${block}`;
  }
  return body;
}

function documentedFallback(resource, provider) {
  if (provider !== 'gitea') return `No remote mutation is defined for ${resource}; the operation remains a local coordination record.`;
  if (resource === 'draft-pull-request') {
    return 'The stable Gitea API cannot guarantee draft pull request creation because work-in-progress prefixes are server-configurable; leave the pushed branch for explicit operator review without creating a regular pull request.';
  }
  if (resource === 'decision-issue' || resource === 'discussion') return 'Represent the discussion as a decision issue using the stable Issues API.';
  return 'Use managed status labels and milestone filters instead of project or view mutations.';
}

function fallbackResult(resource, provider) {
  return {
    status: 'fallback',
    resourceType: resource,
    fallback: documentedFallback(resource, provider)
  };
}

function hasOwnedMarker(body, marker) {
  return typeof body === 'string' && (
    body === marker ||
    body.startsWith(`${marker}\n`) ||
    body.startsWith(`${marker}\r\n`)
  );
}

function normalizeProject(value) {
  const project = value && typeof value === 'object' ? value : {};
  return {
    ...project,
    id: requiredGraphQlId(project.id, 'Project node ID'),
    number: positiveInteger(project.number, 'Project number'),
    title: requiredText(project.title, 'Project title')
  };
}

function requiredGraphQlId(value, label) {
  const id = requiredText(value, label);
  if (/[\r\n]/.test(id) || id.length > 512) throw new TypeError(`${label} is not a valid GraphQL node ID.`);
  return id;
}

function normalizeManagedProjectFields(requested) {
  const source = Array.isArray(requested) && requested.length > 0 ? requested : MANAGED_PROJECT_FIELDS;
  const names = new Set();
  return source.map((value) => {
    const field = value && typeof value === 'object' ? value : {};
    const name = requiredText(field.name, 'Project field name');
    if (names.has(name)) throw new TypeError(`Project field name is duplicated: ${name}.`);
    names.add(name);
    const dataType = requiredText(field.data_type ?? field.dataType, 'Project field data type').toLowerCase();
    if (!PROJECT_FIELD_TYPES.has(dataType)) {
      throw new TypeError('Project field data type must be text, number, date, or single_select.');
    }
    const normalized = { name, data_type: dataType };
    if (dataType === 'single_select') {
      if (!Array.isArray(field.single_select_options) || field.single_select_options.length === 0) {
        throw new TypeError('Single-select project fields require at least one option.');
      }
      normalized.single_select_options = field.single_select_options.map((option) => {
        const color = requiredText(option?.color, 'Project field option color').toUpperCase();
        if (!PROJECT_FIELD_COLORS.has(color)) throw new TypeError(`Unsupported project field option color: ${color}.`);
        return {
          name: requiredText(option?.name, 'Project field option name'),
          color,
          description: normalizedOptionalText(option?.description) ?? ''
        };
      });
    }
    return normalized;
  });
}

function managedProjectItemFieldValues(fields, payload) {
  const normalizedFields = Array.isArray(fields) ? fields : [];
  const status = normalizedText(payload.status)?.toLowerCase() ?? 'planned';
  const priority = Number.isFinite(Number(payload.priority)) ? Number(payload.priority) : 0;
  const risk = ['low', 'medium', 'high'].includes(normalizedText(payload.risk)?.toLowerCase())
    ? normalizedText(payload.risk).toLowerCase()
    : 'medium';
  const progress = normalizedProjectProgress(payload.progress, status);
  const specifications = [
    { name: 'AAPB Status', type: 'single_select', options: [projectStatusOption(status)] },
    { name: 'AAPB Task ID', type: 'text', value: { text: payload.taskId } },
    { name: 'AAPB Phase', type: 'text', value: { text: normalizedText(payload.phase) ?? '' } },
    { name: 'AAPB Priority', type: 'single_select', options: [projectPriorityOption(priority)] },
    { name: 'AAPB Risk', type: 'single_select', options: [risk] },
    { name: 'AAPB Progress', type: 'number', value: { number: progress } },
    { name: 'AAPB Area', type: 'text', value: { text: normalizedText(payload.area) ?? '' } }
  ];
  return specifications.map((specification) => {
    const field = normalizedFields.find((candidate) => (
      normalizedText(candidate?.name)?.toLowerCase() === specification.name.toLowerCase()
    ));
    if (!field) {
      throw forgeError('forge.project.field-missing', `GitHub Project field is missing: ${specification.name}.`, {
        field: specification.name
      });
    }
    const fieldId = requiredGraphQlId(field.id, `${specification.name} field node ID`);
    if (specification.type === 'single_select') {
      if (field.__typename !== 'ProjectV2SingleSelectField' || !Array.isArray(field.options)) {
        throw forgeError('forge.project.field-type-mismatch', `GitHub Project field has an incompatible type: ${specification.name}.`, {
          field: specification.name,
          expectedType: 'single_select'
        });
      }
      const option = specification.options
        .map((name) => field.options.find((candidate) => normalizedText(candidate?.name)?.toLowerCase() === name.toLowerCase()))
        .find(Boolean);
      if (!option) {
        throw forgeError('forge.project.field-option-missing', `GitHub Project field has no compatible option for ${specification.name}.`, {
          field: specification.name,
          requestedOptions: specification.options
        });
      }
      return {
        field: { id: fieldId, name: specification.name },
        value: { singleSelectOptionId: requiredGraphQlId(option.id, `${specification.name} option node ID`) }
      };
    }
    const dataType = normalizedText(field.dataType ?? field.data_type)?.toLowerCase();
    if (field.__typename !== 'ProjectV2Field' || dataType !== specification.type) {
      throw forgeError('forge.project.field-type-mismatch', `GitHub Project field has an incompatible type: ${specification.name}.`, {
        field: specification.name,
        expectedType: specification.type,
        actualType: dataType
      });
    }
    return {
      field: { id: fieldId, name: specification.name },
      value: specification.value
    };
  });
}

function projectItemFieldValues(item) {
  const values = new Map();
  const nodes = Array.isArray(item?.fieldValues?.nodes) ? item.fieldValues.nodes : [];
  for (const node of nodes) {
    const fieldId = normalizedText(node?.field?.id);
    if (!fieldId) continue;
    if (node.__typename === 'ProjectV2ItemFieldTextValue') {
      values.set(fieldId, { text: typeof node.text === 'string' ? node.text : '' });
    } else if (node.__typename === 'ProjectV2ItemFieldNumberValue') {
      values.set(fieldId, { number: Number(node.number) });
    } else if (node.__typename === 'ProjectV2ItemFieldSingleSelectValue') {
      const optionId = normalizedText(node.optionId);
      if (optionId) values.set(fieldId, { singleSelectOptionId: optionId });
    }
  }
  return values;
}

function projectFieldValueMatches(current, desired) {
  if (!current || !desired) return false;
  if ('text' in desired) return current.text === desired.text;
  if ('number' in desired) return Number.isFinite(current.number) && current.number === desired.number;
  if ('singleSelectOptionId' in desired) return current.singleSelectOptionId === desired.singleSelectOptionId;
  return false;
}

function projectStatusOption(status) {
  if (status === 'completed' || status === 'cancelled') return 'Done';
  if (status === 'review') return 'In Review';
  if (status === 'claimed' || status === 'running' || status === 'verifying') return 'In Progress';
  if (status === 'ready') return 'Ready';
  if (status === 'blocked' || status === 'paused') return 'Blocked';
  return 'Planned';
}

function projectPriorityOption(priority) {
  if (priority >= 1000) return 'P0';
  if (priority >= 750) return 'P1';
  if (priority >= 500) return 'P2';
  return 'P3';
}

function normalizedProjectProgress(value, status) {
  const explicit = Number(value);
  if (Number.isFinite(explicit) && explicit >= 0 && explicit <= 100) return explicit;
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

function projectFieldsPath(context) {
  const projectNumber = positiveInteger(context?.project?.number, 'Project number');
  const owner = encodeURIComponent(requiredText(context?.owner?.login, 'Project owner login'));
  const prefix = context?.owner?.type === 'Organization' ? `/orgs/${owner}` : `/users/${owner}`;
  return `${prefix}/projectsV2/${projectNumber}/fields`;
}

function projectViewsPath(context) {
  const projectNumber = positiveInteger(context?.project?.number, 'Project number');
  if (context?.owner?.type === 'Organization') {
    const owner = encodeURIComponent(requiredText(context.owner.login, 'Project owner login'));
    return `/orgs/${owner}/projectsV2/${projectNumber}/views`;
  }
  const userId = positiveInteger(context?.owner?.databaseId, 'Project owner user ID');
  return `/users/${userId}/projectsV2/${projectNumber}/views`;
}

function mutationId(kind, repository, value) {
  const normalizedKind = requiredText(kind, 'Mutation kind').replace(/[^a-zA-Z0-9._-]/g, '-');
  const input = `${normalizedKind}\0${repository.owner}/${repository.name}\0${value}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `aapb-${normalizedKind}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function discussionOperationMarker(operation) {
  const id = requiredText(operation?.id ?? operation?.idempotencyKey, 'Discussion operation ID');
  const safe = id.replace(/[^a-zA-Z0-9:._-]/g, '-').slice(0, 160);
  return validateMarker(`<!-- aapb:discussion:${safe} -->`);
}

function nextCursor(headers) {
  const link = readHeader(headers, 'link');
  if (!link) return null;
  const match = /<([^>]+)>\s*;\s*rel\s*=\s*["']?next["']?/i.exec(String(link));
  if (!match) return null;
  try {
    return normalizedText(new URL(match[1], 'https://api.github.invalid').searchParams.get('after'));
  } catch {
    return null;
  }
}

function resourceResult(status, resourceType, resource) {
  return { status, resourceType, resource: structuredClone(resource ?? null) };
}

function validateTransport(transport) {
  if (!transport || typeof transport.request !== 'function') {
    throw new TypeError('Forge transport must expose an async request(request) function.');
  }
  return transport;
}

function validateRepository(repository) {
  const owner = normalizedText(repository?.owner);
  const name = normalizedText(repository?.name);
  if (!owner || !name || !SAFE_REPOSITORY_PART.test(owner) || !SAFE_REPOSITORY_PART.test(name) || owner === '..' || name === '..') {
    throw new TypeError('Forge repository owner and name must be safe path components.');
  }
  return { owner, name };
}

function validateMarker(value) {
  const marker = requiredText(value, 'Idempotency marker');
  if (!ACTIVE_TASK_MARKER.test(marker)) {
    throw new TypeError('Forge idempotency markers must use the <!-- aapb:... --> format without whitespace or line breaks.');
  }
  return marker;
}

function validateBranch(value, label) {
  const branch = requiredText(value, label);
  if (branch.includes('\0') || /[\r\n]/.test(branch) || branch.startsWith('-') || branch.includes('..')) {
    throw new TypeError(`${label} is not a safe Git branch name.`);
  }
  return branch;
}

function validateTaskId(value) {
  const taskId = requiredText(value, 'Project task ID');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(taskId)) {
    throw new TypeError('Project task ID must use letters, numbers, dot, underscore, or hyphen and begin with a letter or number.');
  }
  return taskId;
}

function normalizeIssueState(value) {
  const state = requiredText(value, 'Issue state').toLowerCase();
  if (state !== 'open' && state !== 'closed') throw new TypeError('Issue state must be open or closed.');
  return state;
}

function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) throw new TypeError(`${label} must be a positive integer.`);
  return value;
}

function requiredText(value, label) {
  const text = normalizedText(value);
  if (!text || text.includes('\0')) throw new TypeError(`${label} must be a non-empty string without null bytes.`);
  return text;
}

function normalizedText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizedOptionalText(value) {
  if (value === null || value === undefined) return value === null ? '' : undefined;
  if (typeof value !== 'string' || value.includes('\0')) throw new TypeError('Forge text values must be strings without null bytes.');
  return value.trim();
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => requiredText(value, 'Forge list value')))];
}

function sameSet(left, right) {
  return [...new Set(left)].sort().join('\0') === [...new Set(right)].sort().join('\0');
}

function numericStatus(error) {
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
  return Number.isFinite(status) && status > 0 ? status : null;
}

function isForgeError(error) {
  return typeof error?.code === 'string' && error.code.startsWith('forge.');
}
