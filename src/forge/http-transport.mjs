import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { retryWithBackoff } from './transport.mjs';

const execFileAsync = promisify(execFile);

export function createFetchForgeTransport(options) {
  const provider = normalizeProvider(options.provider);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const token = options.anonymous === true ? nonEmpty(options.token) : requiredToken(options.token);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const now = options.now ?? Date.now;
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for forge REST transport.');

  async function performRequest(request, requestBaseUrl = baseUrl) {
      validateRequest(request);
      const url = buildUrl(requestBaseUrl, request.path, request.query, provider);
      const headers = normalizeHeaders(request.headers);
      if (token) headers.authorization = `${provider === 'gitea' ? 'token' : 'Bearer'} ${token}`;
      headers['content-type'] ??= 'application/json';
      headers['user-agent'] ??= 'ai-agent-playbook/0.5.4';
      const body = request.body === undefined ? undefined : JSON.stringify(request.body);
      return retryWithBackoff(async () => {
        const timeoutMs = requestTimeoutMs(options, now);
        const linkedSignal = requestAbortSignal(timeoutMs, request.signal ?? options.signal);
        try {
          const response = await fetchImpl(url, {
            method: request.method,
            headers,
            ...(body === undefined ? {} : { body }),
            signal: linkedSignal.signal
          });
          const responseHeaders = Object.fromEntries(response.headers?.entries?.() ?? []);
          const text = await response.text();
          const data = parseResponseBody(text);
          if (!response.ok) {
            const message = typeof data?.message === 'string' ? data.message : `Forge request failed with HTTP ${response.status}.`;
            throw Object.assign(new Error(redact(message, token)), {
              name: 'ForgeHttpError',
              status: response.status,
              statusCode: response.status,
              headers: responseHeaders,
              retryAfter: response.headers?.get?.('retry-after') ?? undefined
            });
          }
          return { status: response.status, data, headers: responseHeaders };
        } finally {
          linkedSignal.dispose();
        }
      }, {
        // A timed-out mutation may already have committed remotely. Re-query
        // the operation marker at the adapter boundary instead of replaying it.
        maxAttempts: request.method === 'GET' ? 3 : 1,
        baseDelayMs: options.baseDelayMs ?? 1000,
        sleep: options.sleep,
        now,
        deadlineAt: options.deadlineAt
      });
  }

  return {
    request(request) {
      return performRequest(request);
    },
    requestOpenApi() {
      const root = provider === 'gitea'
        ? baseUrl.replace(/\/api\/v1$/i, '')
        : new URL(baseUrl).origin;
      return performRequest({ method: 'GET', path: '/swagger.v1.json', headers: {} }, root);
    }
  };
}

export async function createDefaultForgeTransport(options) {
  const provider = normalizeProvider(options.provider);
  const repository = validateRepository(options.repository);
  const env = options.env ?? process.env;
  const runCommand = options.runCommand ?? runGh;
  let token;
  let baseUrl;
  let probe = null;
  if (provider === 'github') {
    token = nonEmpty(env.GH_TOKEN) ?? nonEmpty(env.GITHUB_TOKEN);
    if (!token) {
      const result = await runCommand({
        command: 'gh',
        args: ['auth', 'token', '--hostname', repository.host],
        shell: false,
        timeoutMs: requestTimeoutMs(options, options.now ?? Date.now)
      });
      if (result.exitCode !== 0 || !nonEmpty(result.stdout)) throw new Error('GitHub authentication token is unavailable; run gh auth login or provide GH_TOKEN.');
      token = String(result.stdout).trim();
    }
    baseUrl = repository.host === 'github.com'
      ? 'https://api.github.com'
      : `https://${repository.host}/api/v3`;
  } else {
    baseUrl = repository.apiBaseUrl ?? `https://${repository.host}/api/v1`;
    const probeTransport = createFetchForgeTransport({
      provider,
      baseUrl,
      anonymous: true,
      fetchImpl: options.fetchImpl,
      sleep: options.sleep,
      now: options.now,
      timeoutMs: options.timeoutMs,
      deadlineAt: options.deadlineAt,
      signal: options.signal
    });
    probe = await probeGiteaCapabilities({ transport: probeTransport });
    if (!probe.confirmed || !probe.openapiAvailable) {
      throw new Error('Gitea identity or OpenAPI capabilities could not be verified; authenticated forge access is disabled.');
    }
    token = nonEmpty(env.GITEA_TOKEN) ?? nonEmpty(env.AAPB_FORGE_TOKEN);
    if (!token) throw new Error('Gitea authentication token is unavailable; provide GITEA_TOKEN.');
  }
  return {
    provider,
    repository,
    probe,
    transport: createFetchForgeTransport({
      provider,
      baseUrl,
      token,
      fetchImpl: options.fetchImpl,
      sleep: options.sleep,
      now: options.now,
      timeoutMs: options.timeoutMs,
      deadlineAt: options.deadlineAt,
      signal: options.signal
    })
  };
}

export async function probeGiteaCapabilities(options) {
  const transport = options.transport;
  if (!transport || typeof transport.request !== 'function') throw new Error('Gitea capability probe requires a transport.');
  const versionResponse = await transport.request({ method: 'GET', path: '/version', headers: {} });
  const version = normalizedGiteaVersion(versionResponse?.data);
  let openapi = null;
  try {
    openapi = typeof transport.requestOpenApi === 'function'
      ? await transport.requestOpenApi()
      : await transport.request({ method: 'GET', path: '/swagger.v1.json', headers: {} });
  } catch (error) {
    if (error?.name === 'AbortError' || ['automation.tick.deadline-exceeded', 'automation.control.requested'].includes(error?.code)) throw error;
    // A version response is sufficient to establish Gitea; unavailable OpenAPI narrows capabilities.
  }
  const openapiPaths = validOpenApiPaths(openapi?.data);
  const openapiAvailable = openapiPaths !== null;
  const paths = openapiAvailable ? Object.keys(openapiPaths) : [];
  return {
    provider: 'gitea',
    confirmed: version !== null,
    version,
    openapiAvailable,
    paths,
    capabilities: version ? deriveGiteaCapabilities(openapiPaths) : deriveGiteaCapabilities(null),
    evidence: [
      { id: 'gitea.version', kind: 'identity', status: version ? 'pass' : 'fail', endpoint: '/api/v1/version' },
      { id: 'gitea.openapi', kind: 'capability', status: openapiAvailable ? 'pass' : 'fail', endpoint: '/swagger.v1.json', pathCount: paths.length }
    ]
  };
}

function normalizedGiteaVersion(value) {
  const version = value && typeof value === 'object' && !Array.isArray(value) ? value.version : null;
  return typeof version === 'string' && /^\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?$/.test(version.trim())
    ? version.trim()
    : null;
}

function validOpenApiPaths(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (!value.paths || typeof value.paths !== 'object' || Array.isArray(value.paths)) return null;
  return value.paths;
}

function deriveGiteaCapabilities(paths) {
  const unavailable = {
    issues: 'unavailable',
    labels: 'unavailable',
    milestones: 'unavailable',
    pullRequests: 'unavailable',
    actions: 'unavailable'
  };
  if (!paths) return unavailable;
  return {
    issues: hasPathOperations(paths, /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/issues$/, ['get', 'post']) &&
      hasPathOperations(paths, /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/issues\/\{[^}]+\}$/, ['get', 'patch'])
      ? 'supported' : 'unavailable',
    labels: hasPathOperations(paths, /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/labels$/, ['get', 'post'])
      ? 'supported' : 'unavailable',
    milestones: hasPathOperations(paths, /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/milestones$/, ['get', 'post'])
      ? 'supported' : 'unavailable',
    pullRequests: hasPathOperations(paths, /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/pulls$/, ['get', 'post']) &&
      hasPathOperations(paths, /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/pulls\/\{[^}]+\}$/, ['get', 'patch'])
      ? 'supported' : 'unavailable',
    actions: Object.entries(paths).some(([path, operations]) => (
      /^\/repos\/\{[^}]+\}\/\{[^}]+\}\/actions(?:\/|$)/.test(path) && hasMethods(operations, ['get'])
    )) ? 'supported' : 'unavailable'
  };
}

function hasPathOperations(paths, pattern, methods) {
  return Object.entries(paths).some(([path, operations]) => pattern.test(path) && hasMethods(operations, methods));
}

function hasMethods(operations, methods) {
  if (!operations || typeof operations !== 'object' || Array.isArray(operations)) return false;
  return methods.every((method) => operations[method] && typeof operations[method] === 'object');
}

function buildUrl(baseUrl, requestPath, query, provider) {
  const effectiveBase = provider === 'github' && requestPath === '/graphql' && baseUrl.endsWith('/api/v3')
    ? baseUrl.slice(0, -'/v3'.length)
    : baseUrl;
  const url = new URL(`${effectiveBase}${requestPath}`);
  if (query !== undefined) {
    if (!query || typeof query !== 'object' || Array.isArray(query)) throw new TypeError('Forge request query must be an object.');
    for (const [key, value] of Object.entries(query)) {
      if (!/^[A-Za-z0-9_.-]+$/.test(key)) throw new TypeError('Forge query key is unsafe.');
      if (value === undefined || value === null) continue;
      if (!['string', 'number', 'boolean'].includes(typeof value)) throw new TypeError('Forge query values must be scalar.');
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function validateRequest(request) {
  if (!request || typeof request !== 'object') throw new TypeError('Forge request must be an object.');
  if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) throw new TypeError('Forge request method is unsupported.');
  if (typeof request.path !== 'string' || !request.path.startsWith('/') || request.path.includes('..') || /[\0\r\n\\]/.test(request.path) || request.path.includes('://')) {
    throw new TypeError('Forge request path must be a safe API-relative path.');
  }
}

function normalizeHeaders(value) {
  const headers = {};
  for (const [key, item] of Object.entries(value ?? {})) {
    const normalized = key.toLowerCase();
    if (!/^[a-z0-9-]+$/.test(normalized) || normalized === 'authorization') continue;
    if (typeof item === 'string' && !/[\0\r\n]/.test(item)) headers[normalized] = item;
  }
  return headers;
}

function normalizeBaseUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname))) {
    throw new Error('Forge API base URL must use HTTPS except for localhost development.');
  }
  parsed.username = '';
  parsed.password = '';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function validateRepository(value) {
  if (!value || typeof value !== 'object') throw new Error('Forge repository coordinates are required.');
  const host = String(value.host ?? '').trim().toLowerCase();
  const owner = String(value.owner ?? '').trim();
  const name = String(value.name ?? '').trim();
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d+)?$/.test(host) || /\.\./.test(host)) throw new Error('Forge repository host is unsafe.');
  if (![owner, name].every((part) => /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(part) && !part.includes('..'))) throw new Error('Forge repository owner or name is unsafe.');
  const apiBaseUrl = value.apiBaseUrl ? normalizeBaseUrl(value.apiBaseUrl) : null;
  if (apiBaseUrl && new URL(apiBaseUrl).hostname.toLowerCase() !== host.replace(/:\d+$/u, '')) {
    throw new Error('Forge API base URL hostname must match the repository host.');
  }
  return { host, owner, name, ...(apiBaseUrl ? { apiBaseUrl } : {}) };
}

function normalizeProvider(value) {
  const provider = String(value ?? '').trim().toLowerCase();
  if (!['github', 'gitea'].includes(provider)) throw new Error('Forge HTTP transport requires github or gitea provider.');
  return provider;
}

function requiredToken(value) {
  const token = nonEmpty(value);
  if (!token || /[\0\r\n]/.test(token)) throw new Error('Forge token is missing or unsafe.');
  return token;
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function redact(value, token) {
  return String(value)
    .split(token).join('[REDACTED]')
    .replace(/\b(token|secret|password|api[_-]?key)\s*[:=]\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/(https?:\/\/)[^/@\s]+@/gi, '$1[REDACTED]@');
}

async function runGh(call) {
  try {
    const result = await execFileAsync(call.command, call.args, { windowsHide: true, timeout: Math.min(10_000, call.timeoutMs ?? 10_000) });
    return { exitCode: 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  } catch (error) {
    return { exitCode: Number.isInteger(error.code) ? error.code : 1, stdout: error.stdout ?? '', stderr: error.stderr ?? error.message ?? '' };
  }
}

function requestTimeoutMs(options, now) {
  const configured = Number.isFinite(Number(options.timeoutMs)) && Number(options.timeoutMs) > 0
    ? Math.floor(Number(options.timeoutMs))
    : 30_000;
  const deadlineAt = Number(options.deadlineAt);
  if (!Number.isFinite(deadlineAt)) return configured;
  const remaining = Math.floor(deadlineAt - now());
  if (remaining <= 0) {
    throw Object.assign(new Error('The tick deadline was exhausted before the forge request.'), {
      code: 'automation.tick.deadline-exceeded'
    });
  }
  return Math.max(1, Math.min(configured, remaining));
}

function requestAbortSignal(timeoutMs, externalSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abort();
  else externalSignal?.addEventListener?.('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(Object.assign(new Error('Forge request timed out.'), { code: 'automation.tick.deadline-exceeded' })), timeoutMs);
  timer.unref?.();
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.('abort', abort);
    }
  };
}
