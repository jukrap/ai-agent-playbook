import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

test('package metadata exposes aapb bin and is publishable', async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.name, 'ai-agent-playbook');
  assert.notEqual(packageJson.private, true);
  assert.deepEqual(packageJson.bin, {
    aapb: 'bin/aapb.mjs'
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

  assert.equal(files.includes('bin/aapb.mjs'), true);
  assert.equal(files.includes('src/cli.mjs'), true);
  assert.equal(files.includes('src/catalog/taxonomy.mjs'), true);
  assert.equal(files.includes('src/catalog/reference-adoption.mjs'), true);
  assert.equal(files.includes('src/layout/structured-playbook-layout.mjs'), true);
  assert.equal(files.includes('src/runtime/indexes.mjs'), true);
  assert.equal(files.includes('src/runtime/python-engine.mjs'), true);
  assert.equal(files.includes('src/runtime/writing-naturalness.mjs'), true);
  assert.equal(files.includes('src/runtime/schemas.mjs'), true);
  assert.equal(files.includes('src/runtime/capability-history.mjs'), true);
  assert.equal(files.includes('pyproject.toml'), true);
  assert.equal(files.includes('engines/python/ai_agent_playbook_engine/__main__.py'), true);
  assert.equal(files.includes('scripts/bootstrap-python.ps1'), true);
  assert.equal(files.includes('scripts/validate-python.ps1'), true);
  assert.equal(files.includes('src/skills-lifecycle.mjs'), true);
  assert.equal(files.includes('skills/backend/server-rendered-change/SKILL.md'), true);
  assert.equal(files.includes('skills/project/project-bootstrap/SKILL.md'), true);
  assert.equal(files.includes('skills/project/natural-writing-humanization/SKILL.md'), true);
  assert.equal(files.includes('templates/project-playbook/manifest.json'), true);
  assert.equal(files.includes('templates/project-playbook/README.md'), true);
  assert.equal(files.includes('templates/project-playbook/knowledge/reference-adoption-ledger.md'), true);
  assert.equal(files.includes('docs/changes/structured-playbook-cutover.md'), true);
  assert.equal(files.includes('adapters/codex/hook.mjs'), true);

  assert.equal(files.some((file) => file.startsWith('test/')), false);
  assert.equal(files.some((file) => file.startsWith('translations/')), false);
  assert.equal(files.some((file) => file.startsWith('docs/assets/')), false);
  assert.equal(files.some((file) => file.startsWith('_reference/')), false);
});
