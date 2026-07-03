import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../src/cli.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('skills install dry-run reports operations without writing roots', async () => {
  const root = await tempRepo('skills dry-run-공백-한글-');
  const codexRoot = path.join(root, 'codex skills');
  const agentsRoot = path.join(root, 'agents skills');
  const before = await listRelativeFiles(root);

  const io = capture(root);
  assert.equal(await runCli([
    'skills', 'install',
    '--dry-run',
    '--json',
    '--codex-root', codexRoot,
    '--agents-root', agentsRoot
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.applied, false);
  assert.equal(report.summary.skills, 84);
  assert.equal(report.operations.some((operation) => operation.action === 'install'), true);
  assert.deepEqual(await listRelativeFiles(root), before);
  await cleanup(root);
});

test('skills check reports missing installs as a no-write failure', async () => {
  const root = await tempRepo('skills check-공백-한글-');
  const codexRoot = path.join(root, 'codex skills');
  const agentsRoot = path.join(root, 'agents skills');
  const before = await listRelativeFiles(root);

  const io = capture(root);
  assert.equal(await runCli([
    'skills', 'check',
    '--json',
    '--codex-root', codexRoot,
    '--agents-root', agentsRoot
  ], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.applied, false);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'skills.missing'), true);
  assert.deepEqual(await listRelativeFiles(root), before);
  await cleanup(root);
});

test('skills install writes managed skill markers to Codex and Agents roots', async () => {
  const root = await tempRepo('skills install-공백-한글-');
  const codexRoot = path.join(root, 'codex');
  const agentsRoot = path.join(root, 'agents');

  const io = capture(root);
  assert.equal(await runCli([
    'skills', 'install',
    '--json',
    '--codex-root', codexRoot,
    '--agents-root', agentsRoot
  ], io), 0);
  const report = JSON.parse(io.out());

  assert.equal(report.ok, true);
  assert.equal(report.applied, true);
  assert.equal(existsSync(path.join(codexRoot, 'project-bootstrap', 'SKILL.md')), true);
  assert.equal(existsSync(path.join(agentsRoot, 'project-bootstrap', 'SKILL.md')), true);
  assert.equal(existsSync(path.join(agentsRoot, 'legacys', 'legacy-general', 'SKILL.md')), true);

  const marker = JSON.parse(await readFile(path.join(codexRoot, 'project-bootstrap', '.ai-agent-playbook-install.json'), 'utf8'));
  assert.equal(marker.source, 'ai-agent-playbook');
  assert.equal(marker.skillName, 'project-bootstrap');
  assert.equal(marker.category, 'project');
  assert.equal(typeof marker.sourceHash, 'string');
  await cleanup(root);
});

test('PowerShell sync accepts Node-managed skill markers', async (t) => {
  const pwsh = resolvePowerShell();
  if (!pwsh) {
    t.skip('PowerShell is not available');
    return;
  }

  const root = await tempRepo('skills ps compat-공백-한글-');
  const codexRoot = path.join(root, 'codex');
  const agentsRoot = path.join(root, 'agents');

  assert.equal(await runCli(['skills', 'install', '--codex-root', codexRoot, '--agents-root', agentsRoot], capture(root)), 0);

  const result = spawnSync(pwsh, [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.join(repoRoot, 'scripts', 'sync-skills.ps1'),
    '-SourceSkillsRoot',
    path.join(repoRoot, 'skills'),
    '-CodexSkillsRoot',
    codexRoot,
    '-AgentsSkillsRoot',
    agentsRoot,
    '-WhatIf'
  ], {
    encoding: 'utf8',
    cwd: repoRoot
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Would update managed skill project-bootstrap/);
  await cleanup(root);
});

test('skills update refuses modified managed skills unless forced', async () => {
  const root = await tempRepo('skills modified-공백-한글-');
  const codexRoot = path.join(root, 'codex');
  const agentsRoot = path.join(root, 'agents');
  assert.equal(await runCli(['skills', 'install', '--codex-root', codexRoot, '--agents-root', agentsRoot], capture(root)), 0);

  const modified = path.join(codexRoot, 'project-bootstrap', 'SKILL.md');
  await writeFile(modified, `${await readFile(modified, 'utf8')}\nlocal edit\n`);

  const refused = capture(root);
  assert.equal(await runCli(['skills', 'update', '--json', '--codex-root', codexRoot, '--agents-root', agentsRoot], refused), 1);
  const refusedReport = JSON.parse(refused.out());
  assert.equal(refusedReport.conflicts.some((conflict) => conflict.id === 'skills.modified-managed'), true);
  assert.match(await readFile(modified, 'utf8'), /local edit/);

  const forced = capture(root);
  assert.equal(await runCli(['skills', 'update', '--force-managed', '--json', '--codex-root', codexRoot, '--agents-root', agentsRoot], forced), 0);
  assert.doesNotMatch(await readFile(modified, 'utf8'), /local edit/);
  await cleanup(root);
});

test('skills install adopts matching unmanaged skills and rejects differing unmanaged skills', async () => {
  const root = await tempRepo('skills unmanaged-공백-한글-');
  const codexRoot = path.join(root, 'codex');
  const agentsRoot = path.join(root, 'agents');
  await mkdir(path.join(codexRoot, 'project-bootstrap'), { recursive: true });
  await mkdir(path.join(codexRoot, 'repo-onboarding'), { recursive: true });
  await copyDir(path.join(repoRoot, 'skills', 'project', 'project-bootstrap'), path.join(codexRoot, 'project-bootstrap'));
  await writeFile(path.join(codexRoot, 'repo-onboarding', 'SKILL.md'), '# Local repo onboarding\n');

  const io = capture(root);
  assert.equal(await runCli(['skills', 'install', '--json', '--codex-root', codexRoot, '--agents-root', agentsRoot], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.conflicts.some((conflict) => conflict.id === 'skills.unmanaged-conflict'), true);
  assert.equal(existsSync(path.join(codexRoot, 'project-bootstrap', '.ai-agent-playbook-install.json')), true);
  assert.equal(existsSync(path.join(codexRoot, 'repo-onboarding', '.ai-agent-playbook-install.json')), false);
  await cleanup(root);
});

test('skills uninstall removes unmodified managed skills and preserves modified managed skills', async () => {
  const root = await tempRepo('skills uninstall-공백-한글-');
  const codexRoot = path.join(root, 'codex');
  const agentsRoot = path.join(root, 'agents');
  assert.equal(await runCli(['skills', 'install', '--codex-root', codexRoot, '--agents-root', agentsRoot], capture(root)), 0);
  const modified = path.join(codexRoot, 'project-bootstrap', 'SKILL.md');
  await writeFile(modified, `${await readFile(modified, 'utf8')}\nlocal edit\n`);
  const before = await listRelativeFiles(root);

  const preview = capture(root);
  assert.equal(await runCli(['skills', 'uninstall', '--dry-run', '--json', '--codex-root', codexRoot, '--agents-root', agentsRoot], preview), 1);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.conflicts.some((conflict) => conflict.id === 'skills.modified-managed'), true);
  assert.deepEqual(await listRelativeFiles(root), before);

  const removed = capture(root);
  assert.equal(await runCli(['skills', 'uninstall', '--json', '--codex-root', codexRoot, '--agents-root', agentsRoot], removed), 1);
  const removedReport = JSON.parse(removed.out());
  assert.equal(removedReport.applied, true);
  assert.equal(existsSync(path.join(codexRoot, 'commit-worklog-guardrails')), false);
  assert.equal(existsSync(path.join(codexRoot, 'project-bootstrap')), true);
  assert.match(await readFile(modified, 'utf8'), /local edit/);
  await cleanup(root);
});

test('skills lint --json reports trigger and reference quality without writing files', async () => {
  const root = await tempRepo('skills lint-공백-한글-');
  await mkdir(path.join(root, 'skills', 'project', 'good-skill', 'references'), { recursive: true });
  await mkdir(path.join(root, 'skills', 'project', 'bad-skill'), { recursive: true });
  await writeFile(path.join(root, 'skills', 'project', 'good-skill', 'SKILL.md'), [
    '---',
    'name: good-skill',
    'description: Use when checking a focused project bootstrap edge case.',
    '---',
    '# Good Skill',
    '',
    'Read [details](references/details.md).'
  ].join('\n'));
  await writeFile(path.join(root, 'skills', 'project', 'good-skill', 'references', 'details.md'), '# Details\n');
  await writeFile(path.join(root, 'skills', 'project', 'bad-skill', 'SKILL.md'), [
    '---',
    'name: bad-skill',
    'description: This skill helps you do many things by following a long workflow that should have been reference material instead of a trigger.',
    'owner: local',
    '---',
    '# Bad Skill',
    '',
    'Read [missing](references/missing.md).'
  ].join('\n'));
  const before = await listRelativeFiles(root);

  const io = capture(root, root);
  assert.equal(await runCli(['skills', 'lint', '--json'], io), 1);
  const report = JSON.parse(io.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.summary.skills, 2);
  assert.equal(report.skills.some((skill) => skill.name === 'good-skill' && skill.status === 'pass'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'skills.lint.description-trigger'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'skills.lint.description-length'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'skills.lint.reference-missing'), true);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'skills.lint.frontmatter-keys'), true);
  assert.deepEqual(await listRelativeFiles(root), before);
  await cleanup(root);
});

function capture(cwd, overrideRepoRoot = repoRoot) {
  let stdout = '';
  let stderr = '';
  return {
    cwd,
    repoRoot: overrideRepoRoot,
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    out: () => stdout,
    err: () => stderr
  };
}

async function tempRepo(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function copyDir(source, destination) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await writeFile(destinationPath, await readFile(sourcePath));
    }
  }
}

async function listRelativeFiles(root) {
  const files = [];
  await walk(root, '');
  files.sort();
  return files;

  async function walk(current, rel) {
    if (!existsSync(current)) return;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, entryRel);
      } else if (entry.isFile()) {
        files.push(entryRel);
      }
    }
  }
}

async function cleanup(target) {
  await rm(target, { recursive: true, force: true });
}

function resolvePowerShell() {
  for (const command of ['pwsh', 'powershell']) {
    const result = spawnSync(command, ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], {
      encoding: 'utf8'
    });
    if (result.status === 0) return command;
  }
  return null;
}
