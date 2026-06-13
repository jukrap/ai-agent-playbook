import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

test('package metadata exposes ai-playbook bin and is publishable', async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.name, 'ai-agent-playbook');
  assert.notEqual(packageJson.private, true);
  assert.deepEqual(packageJson.bin, {
    'ai-playbook': 'bin/ai-playbook.mjs'
  });
  assert.equal(packageJson.license, 'MIT');
  assert.equal(packageJson.repository.type, 'git');
});

test('npm pack dry-run includes runtime files and excludes local/test payloads', async () => {
  const { stdout } = await execFileAsync(npmCommand, ['pack', '--dry-run', '--json'], {
    cwd: repoRoot,
    shell: process.platform === 'win32'
  });
  const [pack] = JSON.parse(stdout);
  const files = pack.files.map((file) => file.path);

  assert.equal(files.includes('bin/ai-playbook.mjs'), true);
  assert.equal(files.includes('src/cli.mjs'), true);
  assert.equal(files.includes('src/skills-lifecycle.mjs'), true);
  assert.equal(files.includes('skills/project/project-bootstrap/SKILL.md'), true);
  assert.equal(files.includes('templates/project-playbook/README.md'), true);
  assert.equal(files.includes('adapters/codex/hook.mjs'), true);

  assert.equal(files.some((file) => file.startsWith('test/')), false);
  assert.equal(files.some((file) => file.startsWith('translations/')), false);
  assert.equal(files.some((file) => file.startsWith('docs/assets/')), false);
  assert.equal(files.some((file) => file.startsWith('_reference/')), false);
});
