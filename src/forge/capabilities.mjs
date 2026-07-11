const CAPABILITY_IDS = [
  'issues',
  'labels',
  'milestones',
  'pullRequests',
  'actions',
  'subIssues',
  'projects',
  'views',
  'discussions',
  'agentTask'
];

const SHARED_CAPABILITIES = {
  issues: 'supported',
  labels: 'supported',
  milestones: 'supported',
  pullRequests: 'supported',
  actions: 'supported'
};

const PROVIDER_CAPABILITIES = {
  github: {
    ...SHARED_CAPABILITIES,
    subIssues: 'supported',
    projects: 'supported',
    views: 'supported',
    discussions: 'supported',
    agentTask: 'preview'
  },
  gitea: {
    ...SHARED_CAPABILITIES,
    subIssues: 'fallback',
    projects: 'fallback',
    views: 'fallback',
    discussions: 'fallback',
    agentTask: 'unsupported'
  }
};

/**
 * Return an immutable-by-copy capability matrix for one forge provider.
 * Capability states are supported, fallback, preview, or unsupported.
 *
 * @param {string | null | undefined} provider
 */
export function getForgeCapabilities(provider) {
  const matrix = PROVIDER_CAPABILITIES[normalizeProvider(provider)];
  if (matrix) return { ...matrix };
  return Object.fromEntries(CAPABILITY_IDS.map((id) => [id, 'unsupported']));
}

/**
 * Overlay provider defaults with facts discovered from authentication and
 * server capability probes. Unavailable features are omitted by forge plans.
 */
export function getEffectiveForgeCapabilities(provider, context = {}) {
  const normalized = normalizeProvider(provider);
  const capabilities = getForgeCapabilities(normalized);
  if (normalized === 'github') {
    const auth = context.auth && typeof context.auth === 'object' ? context.auth : {};
    if (auth.status !== 'not-checked') {
      const scopes = new Set(Array.isArray(auth.scopes) ? auth.scopes : []);
      if (scopes.has('project')) {
        capabilities.projects = 'supported';
        capabilities.views = 'supported';
      } else if (scopes.has('read:project')) {
        capabilities.projects = 'read-only';
        capabilities.views = 'read-only';
      } else {
        capabilities.projects = 'unavailable';
        capabilities.views = 'unavailable';
      }
    }
  }
  if (normalized === 'gitea' && context.requireProbe !== false) {
    const probed = context.probe?.capabilities;
    for (const capability of Object.keys(SHARED_CAPABILITIES)) {
      capabilities[capability] = typeof probed?.[capability] === 'string'
        ? probed[capability]
        : 'unavailable';
    }
  }
  return capabilities;
}

function normalizeProvider(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : 'none';
}
