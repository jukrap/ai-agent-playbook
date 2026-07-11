const SUPPORTED_PROVIDERS = new Set(['github', 'gitea']);

/**
 * Detect a forge provider and repository coordinates from a Git remote URL.
 * Explicit provider selection is required for self-hosted forges whose host
 * name does not identify the product.
 *
 * @param {{ remoteUrl?: string | null, provider?: string | null, apiBaseUrl?: string | null }} [options]
 */
export function detectForgeProvider(options = {}) {
  const remoteUrl = normalizeText(options.remoteUrl);
  const requestedProvider = normalizeProvider(options.provider);
  const normalizedApiBase = normalizeApiBaseUrl(options.apiBaseUrl);
  const warnings = [];
  const conflicts = [];

  if (requestedProvider === 'invalid') {
    conflicts.push({
      id: 'forge.provider.invalid',
      message: `Unsupported forge provider override: ${String(options.provider)}. Expected auto, github, or gitea.`
    });
  }
  if (options.apiBaseUrl && !normalizedApiBase) {
    conflicts.push({
      id: 'forge.api-base.invalid',
      message: 'forge.apiBaseUrl must be a credential-free HTTPS URL ending in /api/v1 (HTTP is allowed only for localhost).'
    });
  }

  if (!remoteUrl) {
    warnings.push({
      id: 'forge.remote.missing',
      message: 'No Git remote URL is configured; forge features are running in local-only mode.'
    });
    return {
      provider: requestedProvider === 'github' || requestedProvider === 'gitea'
        ? requestedProvider
        : 'none',
      source: requestedProvider === 'github' || requestedProvider === 'gitea'
        ? 'explicit'
        : 'none',
      repository: null,
      warnings,
      conflicts
    };
  }

  const remote = parseStandardRemote(remoteUrl) ?? parseScpRemote(remoteUrl);
  const apiBase = normalizedApiBase && remote && sameHost(remote.host, new URL(normalizedApiBase).host)
    ? normalizedApiBase
    : null;
  if (normalizedApiBase && remote && !apiBase) {
    conflicts.push({
      id: 'forge.api-base.host-mismatch',
      message: 'forge.apiBaseUrl must use the same hostname as the configured Git remote before any forge credential can be sent.'
    });
  }
  const repository = parseRemoteRepository(remoteUrl, apiBase);
  const inference = inferProvider(repository?.host);
  const provider = requestedProvider === 'github' || requestedProvider === 'gitea'
    ? requestedProvider
    : apiBase
      ? 'gitea'
      : inference.provider;
  const candidateProvider = provider === 'unknown' ? inference.candidateProvider : null;

  if (provider === 'unknown') {
    warnings.push(candidateProvider === 'gitea'
      ? {
          id: 'forge.provider.gitea-candidate',
          message: 'The remote hostname resembles self-hosted Gitea but is not trusted by hostname alone; configure forge.provider or forge.apiBaseUrl before remote writes.'
        }
      : {
          id: 'forge.provider.unknown',
          message: 'The Git remote host does not identify GitHub or Gitea; configure an explicit provider before remote writes.'
        });
  }
  if (!repository) {
    warnings.push({
      id: 'forge.repository.unresolved',
      message: 'The Git remote URL does not contain portable repository coordinates.'
    });
  }

  return {
    provider,
    candidateProvider,
    source: requestedProvider === 'github' || requestedProvider === 'gitea'
      ? 'explicit'
      : apiBase
        ? 'api-base'
        : candidateProvider
          ? 'remote-candidate'
          : 'remote',
    repository,
    warnings,
    conflicts
  };
}

function normalizeProvider(value) {
  const normalized = normalizeText(value)?.toLowerCase() ?? 'auto';
  if (normalized === 'auto') return 'auto';
  if (SUPPORTED_PROVIDERS.has(normalized)) return normalized;
  return 'invalid';
}

function inferProvider(host) {
  if (!host) return { provider: 'unknown', candidateProvider: null };
  const normalized = hostNameOnly(host);
  if (normalized === 'github.com' || normalized.endsWith('.github.com')) return { provider: 'github', candidateProvider: null };
  if (normalized === 'gitea.com') return { provider: 'gitea', candidateProvider: null };
  if (normalized === 'gitea.io' || normalized.startsWith('gitea.') || normalized.includes('.gitea.')) {
    return { provider: 'unknown', candidateProvider: 'gitea' };
  }
  return { provider: 'unknown', candidateProvider: null };
}

function parseRemoteRepository(remoteUrl, apiBaseUrl) {
  const parsed = parseStandardRemote(remoteUrl) ?? parseScpRemote(remoteUrl);
  if (!parsed) return null;

  const repositoryPath = stripInstanceRoot(parsed, apiBaseUrl);
  const segments = repositoryPath
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map(decodePathSegment);
  if (segments.length < 2) return null;

  const name = segments.at(-1).replace(/\.git$/i, '');
  const owner = segments.slice(0, -1).join('/');
  if (!owner || !name) return null;

  return {
    host: parsed.host.toLowerCase(),
    owner,
    name,
    slug: `${owner}/${name}`,
    remoteUrl: parsed.sanitizedUrl,
    ...(apiBaseUrl ? { apiBaseUrl } : {})
  };
}

function parseStandardRemote(remoteUrl) {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(remoteUrl)) return null;
  try {
    const parsed = new URL(remoteUrl);
    const host = parsed.host;
    if (!host) return null;
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return {
      host,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      sanitizedUrl: parsed.toString().replace(/\/$/, '')
    };
  } catch {
    return null;
  }
}

function parseScpRemote(remoteUrl) {
  const match = /^(?:([^@\s]+)@)?([^:/\s]+):(.+)$/.exec(remoteUrl);
  if (!match || /^[a-z]$/i.test(match[2])) return null;
  const [, user, host, pathname] = match;
  return {
    host,
    hostname: host,
    pathname,
    sanitizedUrl: `${user ? `${user}@` : ''}${host}:${pathname}`
  };
}

function stripInstanceRoot(remote, apiBaseUrl) {
  if (!apiBaseUrl) return remote.pathname;
  try {
    const api = new URL(apiBaseUrl);
    if (api.host.toLowerCase() !== remote.host.toLowerCase()) return remote.pathname;
    const root = api.pathname.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
    if (!root || root === '/') return remote.pathname;
    if (remote.pathname === root) return '/';
    return remote.pathname.startsWith(`${root}/`) ? remote.pathname.slice(root.length) : remote.pathname;
  } catch {
    return remote.pathname;
  }
}

function normalizeApiBaseUrl(value) {
  const text = normalizeText(value);
  if (!text) return null;
  try {
    const parsed = new URL(text);
    const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (!/\/api\/v1\/?$/i.test(parsed.pathname)) return null;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function hostNameOnly(host) {
  try {
    return new URL(`https://${host}`).hostname.toLowerCase();
  } catch {
    return String(host).replace(/:\d+$/, '').toLowerCase();
  }
}

function sameHost(left, right) {
  return hostNameOnly(left) === hostNameOnly(right);
}

function decodePathSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
