import test from 'node:test';
import assert from 'node:assert/strict';
import { automationDoctor } from '../src/automation/doctor.mjs';

test('doctor reports GitHub capability degradation without refreshing auth scopes', async () => {
  const calls = [];
  const result = await automationDoctor({
    target: 'C:/repo',
    config: { automation: { profile: 'deliver' }, forge: { provider: 'auto', remote: 'origin' }, executor: { provider: 'codex' } },
    credentialStatus: { codex: true, claude: false },
    which: async (name) => ({ git: 'git', gh: 'gh', codex: 'codex' })[name] ?? null,
    runCommand: async (call) => {
      calls.push(call);
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://github.com/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'gh --version') return { exitCode: 0, stdout: 'gh version 2.96.0\n', stderr: '' };
      if (key === 'gh auth status --hostname github.com') return { exitCode: 0, stdout: "Token scopes: 'repo', 'workflow'\n", stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'not found' };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.forge.provider, 'github');
  assert.equal(result.forge.repository.slug, 'owner/repo');
  assert.equal(result.forge.tooling.gh.version, '2.96.0');
  assert.equal(result.executor.selection.provider, 'codex');
  assert.equal(result.warnings.some((warning) => warning.id === 'forge.scope.projects-missing'), true);
  assert.equal(calls.some((call) => call.args.includes('refresh')), false);
  assert.equal(calls.every((call) => call.shell === false), true);
});

test('doctor separates policy permission from verified forge writes when GitHub authentication fails', async () => {
  const result = await automationDoctor({
    target: 'C:/repo',
    config: { automation: { profile: 'deliver' }, forge: { provider: 'auto', remote: 'origin' }, executor: { provider: 'command', command: ['worker'] } },
    which: async (name) => ({ git: 'git', gh: 'gh' })[name] ?? null,
    runCommand: async (call) => {
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://github.com/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'gh --version') return { exitCode: 0, stdout: 'gh version 2.96.0\n', stderr: '' };
      if (key === 'gh auth status --hostname github.com') return { exitCode: 1, stdout: '', stderr: 'not logged in' };
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'unexpected command' };
    }
  });

  assert.equal(result.forge.mode.policyWrites, true);
  assert.equal(result.forge.mode.verifiedWrites, false);
  assert.equal(result.forge.mode.writes, false);
  assert.equal(result.forge.auth.authenticated, false);
  assert.equal(result.forge.permissions.repositoryWrite, false);
  assert.equal(result.forge.warnings.some((warning) => warning.id === 'forge.auth.github-missing'), true);
});

test('doctor reports unverified GitHub authentication when gh is unavailable', async () => {
  const result = await automationDoctor({
    target: 'C:/repo',
    config: { automation: { profile: 'deliver' }, forge: { provider: 'auto', remote: 'origin' }, executor: { provider: 'command', command: ['worker'] } },
    which: async (name) => name === 'git' ? 'git' : null,
    runCommand: async (call) => {
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://github.com/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'unexpected command' };
    }
  });

  assert.equal(result.forge.auth.status, 'not-checked');
  assert.equal(result.forge.mode.writes, false);
  assert.equal(result.forge.warnings.some((warning) => warning.id === 'forge.tool.gh-missing'), true);
});

test('doctor verifies GitHub repository permission and removes Projects without project scope', async () => {
  const calls = [];
  const result = await automationDoctor({
    target: 'C:/repo',
    config: { automation: { profile: 'deliver' }, forge: { provider: 'auto', remote: 'origin' }, executor: { provider: 'command', command: ['worker'] } },
    which: async (name) => ({ git: 'git', gh: 'gh' })[name] ?? null,
    runCommand: async (call) => {
      calls.push(call);
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://github.com/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'gh --version') return { exitCode: 0, stdout: 'gh version 2.96.0\n', stderr: '' };
      if (key === 'gh auth status --hostname github.com') return { exitCode: 0, stdout: "Token scopes: 'repo', 'workflow'\n", stderr: '' };
      if (key === 'gh api --hostname github.com repos/owner/repo --method GET --header X-GitHub-Api-Version:2026-03-10') {
        return {
          exitCode: 0,
          stdout: JSON.stringify({ full_name: 'owner/repo', permissions: { pull: true, push: true, admin: false, maintain: false } }),
          stderr: ''
        };
      }
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'unexpected command' };
    }
  });

  assert.equal(result.forge.mode.policyWrites, true);
  assert.equal(result.forge.mode.verifiedWrites, true);
  assert.equal(result.forge.mode.writes, true);
  assert.equal(result.forge.permissions.repositoryRead, true);
  assert.equal(result.forge.permissions.repositoryWrite, true);
  assert.equal(result.forge.capabilities.issues, 'supported');
  assert.equal(result.forge.capabilities.milestones, 'supported');
  assert.equal(result.forge.capabilities.projects, 'unavailable');
  assert.equal(result.forge.capabilities.views, 'unavailable');
  assert.equal(result.forge.server.apiVersion, '2026-03-10');
  assert.equal(result.forge.probe.evidence.some((evidence) => evidence.id === 'github.repository'), true);
  assert.equal(result.forge.warnings.some((warning) => warning.id === 'forge.scope.projects-missing'), true);
  assert.equal(calls.some((call) => call.args.includes('refresh')), false);
});

test('doctor probes explicit Gitea anonymously before verifying token and repository permission', async () => {
  const requests = [];
  const result = await automationDoctor({
    target: 'C:/repo',
    config: {
      automation: { profile: 'deliver' },
      forge: {
        provider: 'gitea',
        remote: 'origin',
        apiBaseUrl: 'https://code.example.test:3443/gitea/api/v1'
      },
      executor: { provider: 'command', command: ['worker'] }
    },
    env: { GITEA_TOKEN: 'gitea-status-token' },
    fetchImpl: async (url, options) => {
      requests.push({ url, authorization: options.headers.authorization });
      if (url.endsWith('/version')) return forgeResponse(200, { version: '1.26.4' });
      if (url.endsWith('/swagger.v1.json')) return forgeResponse(200, giteaDoctorOpenApi());
      if (url.endsWith('/user')) return forgeResponse(200, { login: 'operator' });
      if (url.endsWith('/repos/owner/repo')) {
        return forgeResponse(200, { full_name: 'owner/repo', permissions: { pull: true, push: true, admin: false } });
      }
      return forgeResponse(404, { message: 'not found' });
    },
    which: async (name) => name === 'git' ? 'git' : null,
    runCommand: async (call) => {
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://code.example.test:3443/gitea/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'unexpected command' };
    }
  });

  assert.equal(result.forge.provider, 'gitea');
  assert.equal(result.forge.repository.owner, 'owner');
  assert.equal(result.forge.server.version, '1.26.4');
  assert.equal(result.forge.auth.authenticated, true);
  assert.equal(result.forge.auth.principal, 'operator');
  assert.equal(result.forge.permissions.repositoryWrite, true);
  assert.equal(result.forge.capabilities.issues, 'supported');
  assert.equal(result.forge.capabilities.labels, 'supported');
  assert.equal(result.forge.mode.policyWrites, true);
  assert.equal(result.forge.mode.verifiedWrites, true);
  assert.equal(result.forge.mode.writes, true);
  assert.equal(result.forge.warnings.some((warning) => warning.id === 'forge.tool.tea-missing'), true);
  assert.deepEqual(requests.slice(0, 2), [
    { url: 'https://code.example.test:3443/gitea/api/v1/version', authorization: undefined },
    { url: 'https://code.example.test:3443/gitea/swagger.v1.json', authorization: undefined }
  ]);
  assert.equal(requests.slice(2).every((request) => request.authorization === 'token gitea-status-token'), true);
});

test('doctor preserves a successful Gitea probe when token authentication fails', async () => {
  const result = await automationDoctor({
    target: 'C:/repo',
    config: {
      automation: { profile: 'deliver' },
      forge: { provider: 'gitea', remote: 'origin', apiBaseUrl: 'https://code.example.test/api/v1' },
      executor: { provider: 'command', command: ['worker'] }
    },
    env: { GITEA_TOKEN: 'invalid-token' },
    fetchImpl: async (url) => {
      if (url.endsWith('/version')) return forgeResponse(200, { version: '1.26.4' });
      if (url.endsWith('/swagger.v1.json')) return forgeResponse(200, giteaDoctorOpenApi());
      return forgeResponse(401, { message: 'unauthorized' });
    },
    which: async (name) => name === 'git' ? 'git' : null,
    runCommand: async (call) => {
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://code.example.test/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'unexpected command' };
    }
  });

  assert.equal(result.forge.server.version, '1.26.4');
  assert.equal(result.forge.probe.status, 'verified');
  assert.equal(result.forge.auth.status, 'unauthenticated');
  assert.equal(result.forge.mode.writes, false);
  assert.equal(result.forge.warnings.some((warning) => warning.id === 'forge.auth.gitea-invalid'), true);
  assert.equal(result.forge.conflicts.some((conflict) => conflict.id === 'forge.gitea.probe-failed'), false);
});

test('doctor never sends a Gitea token to a cross-host API base from project config', async () => {
  const requests = [];
  const result = await automationDoctor({
    target: 'C:/repo',
    config: {
      automation: { profile: 'deliver' },
      forge: { provider: 'gitea', remote: 'origin', apiBaseUrl: 'https://evil.example/api/v1' },
      executor: { provider: 'command', command: ['worker'] }
    },
    env: { GITEA_TOKEN: 'must-stay-on-trusted-host' },
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), authorization: options.headers.authorization });
      if (String(url).endsWith('/version')) return forgeResponse(200, { version: '1.26.4' });
      if (String(url).endsWith('/swagger.v1.json')) return forgeResponse(200, giteaDoctorOpenApi());
      if (String(url).endsWith('/user')) return forgeResponse(200, { login: 'operator' });
      if (String(url).endsWith('/repos/owner/repo')) return forgeResponse(200, { permissions: { pull: true, push: true } });
      return forgeResponse(404, { message: 'not found' });
    },
    which: async (name) => name === 'git' ? 'git' : null,
    runCommand: async (call) => {
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://trusted.example/owner/repo.git\n', stderr: '' };
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.55.0\n', stderr: '' };
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: 'unexpected command' };
    }
  });

  assert.equal(result.forge.conflicts.some((conflict) => conflict.id === 'forge.api-base.host-mismatch'), true);
  assert.equal(requests.length > 0, true);
  assert.equal(requests.every((request) => new URL(request.url).hostname === 'trusted.example'), true);
});

test('doctor degrades to local-only without a remote or forge transport call', async () => {
  const calls = [];
  const result = await automationDoctor({
    target: '/repo',
    config: { automation: { profile: 'deliver' }, forge: { provider: 'auto', remote: 'origin' }, executor: { provider: 'command', command: ['worker'] } },
    which: async (name) => (name === 'git' ? 'git' : null),
    runCommand: async (call) => {
      calls.push(call);
      if (call.args[0] === 'remote') return { exitCode: 2, stdout: '', stderr: 'No such remote' };
      if (call.args[0] === '--version') return { exitCode: 0, stdout: 'git version 2.39.0', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: '' };
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.forge.mode.remote, 'local-only');
  assert.equal(result.executor.selection.provider, 'command');
  assert.equal(calls.some((call) => call.command === 'gh' || call.command === 'tea'), false);
});

test('doctor requires executor configuration when auto selection is ambiguous', async () => {
  const result = await automationDoctor({
    target: '/repo',
    config: { automation: { profile: 'deliver' }, forge: { provider: 'auto', remote: 'origin' }, executor: { provider: 'auto' } },
    env: { OPENAI_API_KEY: 'sk-proj-test-model-123456789', ANTHROPIC_API_KEY: 'sk-ant-test-model-123456789' },
    which: async (name) => (['git', 'codex', 'claude'].includes(name) ? name : null),
    runCommand: async (call) => call.args[0] === 'remote'
      ? { exitCode: 2, stdout: '', stderr: '' }
      : { exitCode: 0, stdout: 'git version 2.55.0', stderr: '' }
  });
  assert.equal(result.ok, false);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'executor.selection.ambiguous'), true);
});

test('doctor allows an explicit no-git local ledger mode when Git is unavailable', async () => {
  const result = await automationDoctor({
    target: '/repo',
    noGit: true,
    noRemote: true,
    config: {
      automation: { profile: 'deliver' },
      forge: { provider: 'auto', remote: 'origin' },
      git: { unattendedWorkspace: 'isolated-checkout' },
      executor: { provider: 'command', command: ['worker'] }
    },
    which: async () => null,
    runCommand: async () => ({ exitCode: 1, stdout: '', stderr: 'missing' })
  });

  assert.equal(result.ok, true);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'git.tool.missing'), false);
  assert.equal(result.git.required, false);
  assert.equal(result.scheduler.modes.some((mode) => mode.id === 'windows-task'), true);
  assert.equal(result.scheduler.modes.some((mode) => mode.id === 'systemd-user'), true);
});

test('doctor enforces supported Git and GitHub CLI minimum versions when they are required', async () => {
  const result = await automationDoctor({
    target: '/repo',
    config: {
      automation: { profile: 'deliver' },
      forge: { provider: 'auto', remote: 'origin' },
      git: { unattendedWorkspace: 'isolated-checkout' },
      executor: { provider: 'codex' }
    },
    which: async (name) => ({ git: 'git', gh: 'gh', codex: 'codex' })[name] ?? null,
    runCommand: async (call) => {
      const key = `${call.command} ${call.args.join(' ')}`;
      if (key === 'git --version') return { exitCode: 0, stdout: 'git version 2.38.1', stderr: '' };
      if (key === 'gh --version') return { exitCode: 0, stdout: 'gh version 2.79.0', stderr: '' };
      if (key === 'git remote get-url origin') return { exitCode: 0, stdout: 'https://github.com/owner/repo.git', stderr: '' };
      if (key === 'gh auth status --hostname github.com') return { exitCode: 0, stdout: "Token scopes: 'repo'", stderr: '' };
      if (key === 'git status --porcelain=v1') return { exitCode: 0, stdout: '', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'git.version.unsupported'), true);
  assert.equal(result.conflicts.some((conflict) => conflict.id === 'forge.tool.gh-version-unsupported'), true);
  assert.equal(result.forge.conflicts.some((conflict) => conflict.id === 'forge.tool.gh-version-unsupported'), true);
});

test('doctor reports a dirty user checkout as safe for isolated unattended work', async () => {
  const result = await automationDoctor({
    target: '/repo',
    noRemote: true,
    config: {
      automation: { profile: 'deliver' },
      forge: { provider: 'auto', remote: 'origin' },
      git: { unattendedWorkspace: 'isolated-checkout' },
      executor: { provider: 'command', command: ['worker'] }
    },
    which: async (name) => name === 'git' ? 'git' : null,
    runCommand: async (call) => {
      if (call.args[0] === '--version') return { exitCode: 0, stdout: 'git version 2.55.0', stderr: '' };
      if (call.args.join(' ') === 'status --porcelain=v1') return { exitCode: 0, stdout: ' M src/user-change.mjs\n', stderr: '' };
      return { exitCode: 1, stdout: '', stderr: '' };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.git.userCheckout.dirty, true);
  assert.equal(result.git.unattended.safe, true);
  assert.equal(result.git.unattended.mode, 'isolated-checkout');
});

function giteaDoctorOpenApi() {
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

function forgeResponse(status, data, headers = {}) {
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
