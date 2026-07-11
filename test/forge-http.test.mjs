import test from 'node:test';
import assert from 'node:assert/strict';
import { createFetchForgeTransport, createDefaultForgeTransport, probeGiteaCapabilities } from '../src/forge/http-transport.mjs';

test('fetch transport sends structured REST requests and never exposes tokens in errors', async () => {
  const calls = [];
  const transport = createFetchForgeTransport({
    provider: 'github',
    baseUrl: 'https://api.github.com',
    token: 'github_pat_supersecret123456',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(201, { id: 1 }, { 'x-test': 'ok' });
    }
  });
  const result = await transport.request({
    method: 'POST',
    path: '/repos/owner/repo/issues',
    query: { page: 1, per_page: 100 },
    headers: { accept: 'application/vnd.github+json' },
    body: { title: '안전한 제목' }
  });
  assert.equal(result.status, 201);
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/repo/issues?page=1&per_page=100');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.authorization, 'Bearer github_pat_supersecret123456');
  assert.deepEqual(JSON.parse(calls[0].options.body), { title: '안전한 제목' });

  const failing = createFetchForgeTransport({
    provider: 'github',
    baseUrl: 'https://api.github.com',
    token: 'github_pat_supersecret123456',
    fetchImpl: async () => response(401, { message: 'token=github_pat_supersecret123456 denied' })
  });
  await assert.rejects(() => failing.request({ method: 'GET', path: '/user', headers: {} }), (error) => {
    assert.doesNotMatch(error.message, /supersecret/);
    assert.match(error.message, /\[REDACTED\]/);
    return true;
  });
});

test('fetch transport retries rate limits at most three total attempts', async () => {
  let attempts = 0;
  const sleeps = [];
  const transport = createFetchForgeTransport({
    provider: 'gitea',
    baseUrl: 'https://gitea.example/api/v1',
    token: 'gitea-secret',
    sleep: async (milliseconds) => sleeps.push(milliseconds),
    fetchImpl: async () => {
      attempts += 1;
      if (attempts < 3) return response(429, { message: 'slow down' }, { 'retry-after': '1' });
      return response(200, []);
    }
  });
  const result = await transport.request({ method: 'GET', path: '/repos/o/r/issues', headers: {} });
  assert.equal(result.status, 200);
  assert.equal(attempts, 3);
  assert.deepEqual(sleeps, [1000, 1000]);
});

test('fetch transport never replays a mutation after an ambiguous server failure', async () => {
  let calls = 0;
  const transport = createFetchForgeTransport({
    provider: 'github',
    baseUrl: 'https://api.github.com',
    token: 'github_pat_mutation_boundary_123456',
    fetchImpl: async () => {
      calls += 1;
      return response(503, { message: 'response lost after a possible commit' });
    },
    sleep: async () => {}
  });

  await assert.rejects(() => transport.request({ method: 'POST', path: '/repos/example/project/issues', body: { title: 'One' } }));
  assert.equal(calls, 1);
});

test('default GitHub transport loads auth with argv only and never refreshes scopes', async () => {
  const calls = [];
  const result = await createDefaultForgeTransport({
    provider: 'github',
    repository: { host: 'github.com', owner: 'owner', name: 'repo' },
    env: {},
    runCommand: async (call) => {
      calls.push(call);
      return { exitCode: 0, stdout: 'token-value\n', stderr: '' };
    },
    fetchImpl: async () => response(200, [])
  });
  assert.equal(typeof result.transport.request, 'function');
  assert.deepEqual(calls[0].args, ['auth', 'token', '--hostname', 'github.com']);
  assert.equal(calls[0].shell, false);
  assert.equal(calls.some((call) => call.args.includes('refresh')), false);
});

test('GitHub Enterprise GraphQL uses api/graphql instead of api/v3/graphql', async () => {
  const calls = [];
  const prepared = await createDefaultForgeTransport({
    provider: 'github',
    repository: { host: 'github.example.com', owner: 'owner', name: 'repo' },
    env: { GH_TOKEN: 'enterprise-token' },
    fetchImpl: async (url) => { calls.push(url); return response(200, { data: {} }); }
  });
  await prepared.transport.request({ method: 'POST', path: '/graphql', headers: {}, body: { query: 'query { viewer { id } }' } });
  assert.equal(calls[0], 'https://github.example.com/api/graphql');
});

test('Gitea verifies version and OpenAPI without a token before authenticated requests', async () => {
  const calls = [];
  const prepared = await createDefaultForgeTransport({
    provider: 'gitea',
    repository: {
      host: 'gitea.example.com:3443',
      owner: 'owner',
      name: 'repo',
      apiBaseUrl: 'https://gitea.example.com:3443/root/api/v1'
    },
    env: { GITEA_TOKEN: 'gitea-token' },
    fetchImpl: async (url, options) => {
      calls.push({ url, authorization: options.headers.authorization });
      return url.endsWith('/version')
        ? response(200, { version: '1.26.4' })
        : url.endsWith('/swagger.v1.json')
          ? response(200, giteaOpenApi())
          : response(200, { login: 'owner' });
    }
  });
  assert.equal(prepared.probe.version, '1.26.4');
  assert.equal(prepared.probe.capabilities.issues, 'supported');
  assert.deepEqual(calls, [
    { url: 'https://gitea.example.com:3443/root/api/v1/version', authorization: undefined },
    { url: 'https://gitea.example.com:3443/root/swagger.v1.json', authorization: undefined }
  ]);

  await prepared.transport.request({ method: 'GET', path: '/user', headers: {} });
  assert.deepEqual(calls.at(-1), {
    url: 'https://gitea.example.com:3443/root/api/v1/user',
    authorization: 'token gitea-token'
  });
});

test('Gitea capability probe fails closed when the version response cannot establish identity', async () => {
  const transport = {
    async request(request) {
      assert.equal(request.path, '/version');
      return { status: 200, data: { version: 'not-a-version' }, headers: {} };
    },
    async requestOpenApi() {
      return { status: 200, data: giteaOpenApi(), headers: {} };
    }
  };

  const probed = await probeGiteaCapabilities({ transport });
  assert.equal(probed.confirmed, false);
  assert.equal(probed.openapiAvailable, true);
  assert.equal(Object.values(probed.capabilities).every((state) => state === 'unavailable'), true);
});

test('default Gitea transport refuses a cross-host repository API base before token use', async () => {
  const requests = [];
  await assert.rejects(
    createDefaultForgeTransport({
      provider: 'gitea',
      repository: {
        host: 'trusted.example',
        owner: 'owner',
        name: 'repo',
        apiBaseUrl: 'https://evil.example/api/v1'
      },
      env: { GITEA_TOKEN: 'must-not-leave-process' },
      fetchImpl: async (...args) => { requests.push(args); throw new Error('must not request'); }
    }),
    /hostname must match/i
  );
  assert.equal(requests.length, 0);
});

function giteaOpenApi() {
  return {
    info: { title: 'Gitea API', version: '1.26.4' },
    paths: {
      '/repos/{owner}/{repo}/issues': { get: {}, post: {} },
      '/repos/{owner}/{repo}/issues/{index}': { get: {}, patch: {} },
      '/repos/{owner}/{repo}/labels': { get: {}, post: {} },
      '/repos/{owner}/{repo}/milestones': { get: {}, post: {} },
      '/repos/{owner}/{repo}/pulls': { get: {}, post: {} },
      '/repos/{owner}/{repo}/pulls/{index}': { get: {}, patch: {} },
      '/repos/{owner}/{repo}/actions/runs': { get: {} }
    }
  };
}

function response(status, data, headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      entries: () => Object.entries(headers),
      get: (name) => Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null
    },
    text: async () => JSON.stringify(data)
  };
}
