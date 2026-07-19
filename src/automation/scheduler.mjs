import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { PACKAGE_SPECIFIER } from '../version.mjs';

const REMOTE_PLATFORMS = new Set(['github-actions', 'gitea-actions']);
const LOCAL_PLATFORMS = new Set(['windows-task', 'systemd-user']);
const CLI_ENTRYPOINT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/aapb.mjs');
const SAFE_TICK_FLAGS = new Set(['--no-remote', '--remote-read-only', '--no-git', '--offline']);

export async function scheduleAutomation(options) {
  const {
    target,
    platform,
    apply = false,
    content,
    register = runRegistration,
    remoteAllowed = true
  } = options;
  if (!REMOTE_PLATFORMS.has(platform) && !LOCAL_PLATFORMS.has(platform)) {
    throw new Error('Invalid --platform; expected github-actions, gitea-actions, windows-task, or systemd-user.');
  }
  const tickFlags = normalizeTickFlags(options.tickFlags);
  if (apply && tickFlags.includes('--offline')) {
    return scheduleResult({
      target,
      platform,
      applied: false,
      operations: [],
      conflicts: [{ id: 'schedule.offline.execution-disabled', message: 'Offline ticks fail closed because executor network isolation cannot be enforced; do not register an unattended offline schedule.', paths: [] }]
    });
  }
  if (apply && REMOTE_PLATFORMS.has(platform) && tickFlags.includes('--no-git')) {
    return scheduleResult({
      target,
      platform,
      applied: false,
      operations: [],
      conflicts: [{ id: 'schedule.hosted.no-git-unsupported', message: 'Hosted automation requires branch delivery; do not install a hosted --no-git schedule.', paths: [] }]
    });
  }
  if (REMOTE_PLATFORMS.has(platform)) {
    if (!remoteAllowed) return deniedRemoteSchedule(target, platform);
    return scheduleRemoteWorkflow({ target, platform, apply, content, tickFlags });
  }
  return scheduleLocalService({ target, platform, apply, register, configRoot: options.configRoot, tickFlags });
}

async function scheduleRemoteWorkflow(options) {
  const { target, platform, apply, content, tickFlags } = options;
  const relativePath = platform === 'github-actions'
    ? '.github/workflows/aapb-automation.yml'
    : '.gitea/workflows/aapb-automation.yml';
  const file = path.join(path.resolve(target), ...relativePath.split('/'));
  const rendered = content ?? (platform === 'github-actions' ? githubWorkflow(tickFlags) : giteaWorkflow(tickFlags));
  const operations = [{ id: 'schedule.workflow.write', action: 'write', path: relativePath }];
  if (!apply) {
    return scheduleResult({ target, platform, applied: false, path: relativePath, content: rendered, operations });
  }
  if (existsSync(file)) {
    const existing = await readFile(file, 'utf8');
    if (existing !== rendered) {
      return scheduleResult({
        target,
        platform,
        applied: false,
        path: relativePath,
        content: rendered,
        operations: [],
        conflicts: [{ id: 'schedule.workflow.exists', message: `${relativePath} already exists with different content.`, paths: [relativePath] }]
      });
    }
    return scheduleResult({
      target,
      platform,
      applied: true,
      path: relativePath,
      content: rendered,
      operations: [{ id: 'schedule.workflow.keep', action: 'keep', path: relativePath }]
    });
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, rendered);
  return scheduleResult({ target, platform, applied: true, path: relativePath, content: rendered, operations });
}

async function scheduleLocalService(options) {
  const { target, platform, apply, register } = options;
  const resolvedTarget = path.resolve(target);
  assertSchedulerTarget(resolvedTarget);
  if (platform === 'systemd-user') return scheduleSystemdUser({ ...options, target: resolvedTarget });
  const registration = platform === 'windows-task'
    ? windowsRegistration(resolvedTarget, options.tickFlags)
    : null;
  const operations = [{ id: 'schedule.registration', action: 'register', platform }];
  if (!apply) {
    return scheduleResult({ target: resolvedTarget, platform, applied: false, operations, registration });
  }
  const result = await register(registration);
  const conflicts = result?.exitCode === 0
    ? []
    : [{ id: 'schedule.registration.failed', message: result?.stderr || `Could not register ${platform} schedule.`, paths: [] }];
  return scheduleResult({
    target: resolvedTarget,
    platform,
    applied: conflicts.length === 0,
    operations: conflicts.length ? [] : operations,
    conflicts,
    registration
  });
}

async function scheduleSystemdUser(options) {
  const configRoot = path.resolve(options.configRoot ?? path.join(os.homedir(), '.config', 'systemd', 'user'));
  const files = systemdFiles(options.target, options.tickFlags).map((file) => ({
    ...file,
    fullPath: path.join(configRoot, file.name)
  }));
  const operations = files.map((file) => ({ id: 'schedule.systemd.write', action: 'write', path: file.fullPath }));
  const registrations = [
    { command: 'systemctl', args: ['--user', 'daemon-reload'], shell: false },
    { command: 'systemctl', args: ['--user', 'enable', '--now', 'aapb-automation.timer'], shell: false }
  ];
  if (!options.apply) {
    return scheduleResult({
      target: options.target,
      platform: 'systemd-user',
      applied: false,
      operations,
      registration: registrations,
      files: files.map(({ name, fullPath, content }) => ({ name, path: fullPath, content }))
    });
  }
  await mkdir(configRoot, { recursive: true });
  for (const file of files) {
    if (existsSync(file.fullPath)) {
      const existing = await readFile(file.fullPath, 'utf8');
      if (existing !== file.content) {
        return scheduleResult({
          target: options.target,
          platform: 'systemd-user',
          applied: false,
          operations: [],
          registration: registrations,
          files: files.map(({ name, fullPath, content }) => ({ name, path: fullPath, content })),
          conflicts: [{ id: 'schedule.systemd.exists', message: `${file.fullPath} already exists with different content.`, paths: [file.fullPath] }]
        });
      }
    } else {
      await writeFile(file.fullPath, file.content);
    }
  }
  for (const registration of registrations) {
    const result = await options.register(registration);
    if (result?.exitCode !== 0) {
      return scheduleResult({
        target: options.target,
        platform: 'systemd-user',
        applied: false,
        operations,
        registration: registrations,
        files: files.map(({ name, fullPath, content }) => ({ name, path: fullPath, content })),
        conflicts: [{ id: 'schedule.registration.failed', message: result?.stderr || 'Could not register systemd user timer.', paths: [] }]
      });
    }
  }
  return scheduleResult({
    target: options.target,
    platform: 'systemd-user',
    applied: true,
    operations,
    registration: registrations,
    files: files.map(({ name, fullPath, content }) => ({ name, path: fullPath, content }))
  });
}

function githubWorkflow(tickFlags = []) {
  const policyFlags = tickFlags.length ? ` ${tickFlags.join(' ')}` : '';
  return [
    'name: AI Agent Playbook tick',
    '',
    'on:',
    '  workflow_dispatch:',
    '  schedule:',
    "    - cron: '*/15 * * * *'",
    '',
    'permissions:',
    '  contents: write',
    '  issues: write',
    '  pull-requests: write',
    '  actions: read',
    '',
    'concurrency:',
    '  group: aapb-automation-${{ github.repository }}',
    '  cancel-in-progress: false',
    '',
    'jobs:',
    '  tick:',
    "    if: ${{ vars.AAPB_AUTOMATION_ENABLED == 'true' }}",
    '    runs-on: ubuntu-latest',
    '    timeout-minutes: 35',
    '    env:',
    '      GH_TOKEN: ${{ github.token }}',
    '      AAPB_AUTOMATION_ENABLED: ${{ vars.AAPB_AUTOMATION_ENABLED }}',
    '      AAPB_AUTOMATION_PLAN: ${{ vars.AAPB_AUTOMATION_PLAN }}',
    "      NPM_CONFIG_IGNORE_SCRIPTS: 'true'",
    '    steps:',
    '      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    '        with:',
    '          fetch-depth: 0',
    '          persist-credentials: false',
    '      - name: Restore and checkpoint automation ledger',
    '        uses: actions/cache@1bd1e32a3bdc45362d1e726936510720a7c30a57',
    '        with:',
    '          path: |',
    '            .ai-agent-playbook/workflows/runs',
    '            ~/.cache/ai-agent-playbook/checkouts',
    '          key: aapb-ledger-${{ github.run_id }}-${{ github.run_attempt }}',
    '          restore-keys: aapb-ledger-',
    '      - name: Initialize or reuse the configured automation run',
    '        run: |',
    '          if [ -n "$AAPB_AUTOMATION_PLAN" ]; then',
    `            npx --yes ${PACKAGE_SPECIFIER} automation start . --plan "$AAPB_AUTOMATION_PLAN" --json${policyFlags}`,
    '          fi',
    '      - name: Run one resumable tick',
    '        id: aapb-tick',
    `        run: npx --yes ${PACKAGE_SPECIFIER} automation tick . --no-interactive --json${policyFlags}`,
    ''
  ].join('\n');
}

function giteaWorkflow(tickFlags = []) {
  const policyFlags = tickFlags.length ? ` ${tickFlags.join(' ')}` : '';
  return [
    'name: AI Agent Playbook tick',
    '',
    'on:',
    '  workflow_dispatch:',
    '  schedule:',
    "    - cron: '*/15 * * * *'",
    '',
    'concurrency:',
    '  group: aapb-automation-${{ gitea.repository }}',
    '  cancel-in-progress: false',
    '',
    'jobs:',
    '  tick:',
    "    if: ${{ vars.AAPB_AUTOMATION_ENABLED == 'true' }}",
    '    runs-on: ubuntu-latest',
    '    timeout-minutes: 35',
    '    env:',
    '      GITEA_TOKEN: ${{ secrets.AAPB_FORGE_TOKEN }}',
    '      AAPB_AUTOMATION_ENABLED: ${{ vars.AAPB_AUTOMATION_ENABLED }}',
    '      AAPB_AUTOMATION_PLAN: ${{ vars.AAPB_AUTOMATION_PLAN }}',
    "      NPM_CONFIG_IGNORE_SCRIPTS: 'true'",
    '    steps:',
    '      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    '        with:',
    '          fetch-depth: 0',
    '          persist-credentials: false',
    '      - name: Restore and checkpoint automation ledger',
    '        uses: actions/cache@1bd1e32a3bdc45362d1e726936510720a7c30a57',
    '        with:',
    '          path: |',
    '            .ai-agent-playbook/workflows/runs',
    '            ~/.cache/ai-agent-playbook/checkouts',
    '          key: aapb-ledger-${{ gitea.run_id }}-${{ gitea.run_attempt }}',
    '          restore-keys: aapb-ledger-',
    '      - name: Initialize or reuse the configured automation run',
    '        run: |',
    '          if [ -n "$AAPB_AUTOMATION_PLAN" ]; then',
    `            npx --yes ${PACKAGE_SPECIFIER} automation start . --plan "$AAPB_AUTOMATION_PLAN" --json${policyFlags}`,
    '          fi',
    '      - name: Run one resumable tick',
    '        id: aapb-tick',
    `        run: npx --yes ${PACKAGE_SPECIFIER} automation tick . --no-interactive --json${policyFlags}`,
    ''
  ].join('\n');
}

function windowsRegistration(target, tickFlags = []) {
  assertSchedulerTarget(process.execPath);
  assertSchedulerTarget(CLI_ENTRYPOINT);
  const taskAction = [
    quoteWindowsTaskArgument(process.execPath),
    quoteWindowsTaskArgument(CLI_ENTRYPOINT),
    'automation',
    'tick',
    quoteWindowsTaskArgument(target),
    '--no-interactive',
    '--json',
    ...tickFlags
  ].join(' ');
  const taskSuffix = createHash('sha256').update(target).digest('hex').slice(0, 12);
  return {
    command: 'schtasks.exe',
    args: ['/Create', '/TN', `AI Agent Playbook ${taskSuffix}`, '/SC', 'MINUTE', '/MO', '15', '/TR', taskAction],
    shell: false
  };
}

function systemdFiles(target, tickFlags = []) {
  const escapedTarget = JSON.stringify(target);
  const executable = JSON.stringify(process.execPath);
  const entrypoint = JSON.stringify(CLI_ENTRYPOINT);
  return [
    {
      name: 'aapb-automation.service',
      content: [
        '[Unit]',
        'Description=AI Agent Playbook automation tick',
        '',
        '[Service]',
        'Type=oneshot',
        'Environment=NPM_CONFIG_IGNORE_SCRIPTS=true',
        `ExecStart=${executable} ${entrypoint} automation tick ${escapedTarget} --no-interactive --json${tickFlags.length ? ` ${tickFlags.join(' ')}` : ''}`,
        ''
      ].join('\n')
    },
    {
      name: 'aapb-automation.timer',
      content: [
        '[Unit]',
        'Description=Run AI Agent Playbook automation tick every 15 minutes',
        '',
        '[Timer]',
        'OnBootSec=2min',
        'OnUnitActiveSec=15min',
        'Persistent=true',
        'Unit=aapb-automation.service',
        '',
        '[Install]',
        'WantedBy=timers.target',
        ''
      ].join('\n')
    }
  ];
}

function runRegistration(registration) {
  return new Promise((resolve) => {
    const child = spawn(registration.command, registration.args, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => resolve({ exitCode: 1, stdout, stderr: `${stderr}${error.message}` }));
    child.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
  });
}

function deniedRemoteSchedule(target, platform) {
  return scheduleResult({
    target,
    platform,
    applied: false,
    operations: [],
    conflicts: [{ id: 'schedule.remote.denied', message: 'Remote scheduling is disabled by effective policy.', paths: [] }]
  });
}

function scheduleResult(options) {
  const conflicts = options.conflicts ?? [];
  return {
    schemaVersion: '2',
    kind: 'automation.schedule.v2',
    ok: conflicts.length === 0,
    target: path.resolve(options.target),
    platform: options.platform,
    applied: Boolean(options.applied),
    path: options.path ?? null,
    content: options.content ?? null,
    registration: options.registration ?? null,
    files: options.files ?? [],
    operations: options.operations ?? [],
    warnings: [],
    conflicts
  };
}

function assertSchedulerTarget(target) {
  if (/[\0\r\n"]/u.test(target)) throw new Error('Target path contains unsafe scheduler characters.');
}

function normalizeTickFlags(flags) {
  if (!Array.isArray(flags)) return [];
  const normalized = [...new Set(flags.map((flag) => String(flag)))];
  if (normalized.some((flag) => !SAFE_TICK_FLAGS.has(flag))) {
    throw new Error('Scheduler tick flags contain an unsupported value.');
  }
  return normalized;
}

function quoteWindowsTaskArgument(value) {
  assertSchedulerTarget(value);
  return `"${value}"`;
}
