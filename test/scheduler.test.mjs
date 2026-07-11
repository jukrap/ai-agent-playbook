import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleAutomation } from '../src/automation/scheduler.mjs';

test('GitHub and Gitea schedules are preview-first repeatable tick workflows', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-schedule-preview-'));

  const github = await scheduleAutomation({ target, platform: 'github-actions' });
  const gitea = await scheduleAutomation({ target, platform: 'gitea-actions' });

  assert.equal(github.ok, true);
  assert.equal(github.applied, false);
  assert.equal(github.path, '.github/workflows/aapb-automation.yml');
  assert.match(github.content, /workflow_dispatch:/);
  assert.match(github.content, /concurrency:/);
  assert.match(github.content, /ai-agent-playbook@0\.5\.4 automation tick \. --no-interactive/);
  assert.match(github.content, /persist-credentials: false/);
  assert.match(github.content, /actions\/cache@1bd1e32a3bdc45362d1e726936510720a7c30a57/);
  assert.match(github.content, /\.ai-agent-playbook\/workflows\/runs/);
  assert.match(github.content, /~\/\.cache\/ai-agent-playbook\/checkouts/);
  assert.match(github.content, /key: aapb-ledger-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  assert.match(github.content, /restore-keys: aapb-ledger-/);
  assert.doesNotMatch(github.content, /continue-on-error:/);
  assert.doesNotMatch(github.content, /uses: [^\n]+@v\d/);
  assert.equal(gitea.path, '.gitea/workflows/aapb-automation.yml');
  assert.match(gitea.content, /GITEA_TOKEN/);
  assert.match(gitea.content, /persist-credentials: false/);
  assert.match(gitea.content, /actions\/cache@1bd1e32a3bdc45362d1e726936510720a7c30a57/);
  assert.match(gitea.content, /key: aapb-ledger-\$\{\{ gitea\.run_id \}\}-\$\{\{ gitea\.run_attempt \}\}/);
  assert.equal(existsSync(path.join(target, '.github')), false);
  assert.equal(existsSync(path.join(target, '.gitea')), false);
  await rm(target, { recursive: true, force: true });
});

test('hosted generators and copyable templates initialize a configured plan before ticking', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-schedule-initialize-'));
  const github = await scheduleAutomation({ target, platform: 'github-actions' });
  const gitea = await scheduleAutomation({ target, platform: 'gitea-actions' });
  const workflows = [
    { name: 'generated GitHub workflow', content: github.content },
    { name: 'generated Gitea workflow', content: gitea.content },
    {
      name: 'copyable GitHub workflow',
      content: await readFile(path.resolve('templates/project-playbook/integrations/actions/github-automation.yml'), 'utf8')
    },
    {
      name: 'copyable Gitea workflow',
      content: await readFile(path.resolve('templates/project-playbook/integrations/actions/gitea-automation.yml'), 'utf8')
    }
  ];

  for (const workflow of workflows) {
    assert.match(workflow.content, /AAPB_AUTOMATION_PLAN: \$\{\{ vars\.AAPB_AUTOMATION_PLAN \}\}/, workflow.name);
    assert.match(workflow.content, /if \[ -n "\$AAPB_AUTOMATION_PLAN" \]; then/, workflow.name);
    assert.match(
      workflow.content,
      /automation start \. --plan "\$AAPB_AUTOMATION_PLAN" --json/,
      workflow.name
    );
    assert.doesNotMatch(workflow.content, /--plan \$AAPB_AUTOMATION_PLAN/, workflow.name);
    assert.ok(workflow.content.indexOf('actions/cache@') < workflow.content.indexOf('automation start .'), workflow.name);
    assert.ok(workflow.content.indexOf('automation start .') < workflow.content.indexOf('automation tick .'), workflow.name);
  }

  await rm(target, { recursive: true, force: true });
});

test('remote schedule writes only with apply and preserves differing existing workflows', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-schedule-apply-'));
  const applied = await scheduleAutomation({ target, platform: 'github-actions', apply: true });
  assert.equal(applied.ok, true);
  assert.equal(applied.applied, true);
  assert.match(await readFile(path.join(target, '.github', 'workflows', 'aapb-automation.yml'), 'utf8'), /AAPB_AUTOMATION_ENABLED/);

  const conflict = await scheduleAutomation({
    target,
    platform: 'github-actions',
    apply: true,
    content: 'name: user workflow\n'
  });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.conflicts[0].id, 'schedule.workflow.exists');
  await rm(target, { recursive: true, force: true });
});

test('local scheduler registration is an argv-only apply operation', async () => {
  const calls = [];
  const preview = await scheduleAutomation({
    target: 'C:/Project With Space',
    platform: 'windows-task',
    register: async (call) => calls.push(call)
  });
  assert.equal(preview.applied, false);
  assert.equal(calls.length, 0);
  assert.equal(preview.registration.shell, false);
  assert.equal(preview.registration.command, 'schtasks.exe');
  assert.equal(preview.registration.args.includes('C:/Project With Space'), false);
  assert.equal(preview.registration.args.includes('/F'), false);
  const taskAction = preview.registration.args[preview.registration.args.indexOf('/TR') + 1];
  assert.match(taskAction, new RegExp(process.execPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.match(taskAction, /bin[\\/]aapb\.mjs/);
  const taskNameIndex = preview.registration.args.indexOf('/TN');
  assert.match(preview.registration.args[taskNameIndex + 1], /^AI Agent Playbook [a-f0-9]{12}$/);

  const otherProject = await scheduleAutomation({
    target: 'C:/Other Project',
    platform: 'windows-task'
  });
  assert.notEqual(
    otherProject.registration.args[otherProject.registration.args.indexOf('/TN') + 1],
    preview.registration.args[taskNameIndex + 1]
  );

  const applied = await scheduleAutomation({
    target: 'C:/Project With Space',
    platform: 'windows-task',
    apply: true,
    register: async (call) => {
      calls.push(call);
      return { exitCode: 0, stdout: 'SUCCESS', stderr: '' };
    }
  });
  assert.equal(applied.ok, true);
  assert.equal(applied.applied, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].shell, false);
});

test('systemd user schedule previews then writes service and timer before registration', async () => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-systemd-target-'));
  const configRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-systemd-config-'));
  await rm(configRoot, { recursive: true, force: true });
  const calls = [];
  const preview = await scheduleAutomation({ target, platform: 'systemd-user', configRoot });
  assert.equal(preview.applied, false);
  assert.equal(preview.files.length, 2);
  assert.match(preview.files[0].content, /ExecStart=.*automation tick/);
  assert.doesNotMatch(preview.files[0].content, /\bnpx\b/);
  assert.equal(existsSync(configRoot), false);

  const applied = await scheduleAutomation({
    target,
    platform: 'systemd-user',
    configRoot,
    apply: true,
    register: async (call) => { calls.push(call); return { exitCode: 0, stdout: '', stderr: '' }; }
  });
  assert.equal(applied.ok, true);
  assert.equal(applied.applied, true);
  assert.equal(existsSync(path.join(configRoot, 'aapb-automation.service')), true);
  assert.equal(existsSync(path.join(configRoot, 'aapb-automation.timer')), true);
  assert.deepEqual(calls.map((call) => call.args), [
    ['--user', 'daemon-reload'],
    ['--user', 'enable', '--now', 'aapb-automation.timer']
  ]);
  await rm(target, { recursive: true, force: true });
  await rm(configRoot, { recursive: true, force: true });
});

test('local schedules persist narrowed tick policy and reject unusable offline apply', async () => {
  const windows = await scheduleAutomation({
    target: 'C:/Policy Project',
    platform: 'windows-task',
    tickFlags: ['--no-remote', '--no-git']
  });
  const taskAction = windows.registration.args[windows.registration.args.indexOf('/TR') + 1];
  assert.match(taskAction, /--no-remote --no-git$/);

  const offline = await scheduleAutomation({
    target: 'C:/Policy Project',
    platform: 'windows-task',
    apply: true,
    tickFlags: ['--offline'],
    register: async () => { throw new Error('must not register'); }
  });
  assert.equal(offline.ok, false);
  assert.equal(offline.conflicts[0].id, 'schedule.offline.execution-disabled');
});

test('hosted schedules persist narrowed policy in both start and tick commands', async () => {
  for (const platform of ['github-actions', 'gitea-actions']) {
    const preview = await scheduleAutomation({
      target: 'C:/Hosted Policy Project',
      platform,
      tickFlags: ['--no-remote', '--no-git']
    });
    assert.equal(preview.ok, true);
    assert.match(preview.content, /automation start .*--no-remote --no-git/);
    assert.match(preview.content, /automation tick .*--no-remote --no-git/);

    const applied = await scheduleAutomation({
      target: 'C:/Hosted Policy Project',
      platform,
      apply: true,
      tickFlags: ['--no-git']
    });
    assert.equal(applied.ok, false);
    assert.equal(applied.conflicts[0].id, 'schedule.hosted.no-git-unsupported');
  }
});
