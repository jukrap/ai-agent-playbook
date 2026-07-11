import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { doctorProject } from '../src/harness.mjs';

const execFileAsync = promisify(execFile);

test('doctor public safety excludes reference work runtime generated and gitignored markdown', async (t) => {
  const target = await mkdtemp(path.join(os.tmpdir(), 'aapb-doctor-ignore-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  for (const directory of ['_reference', '_work', '.ai-agent-playbook/runtime/reports', 'dist', 'private-notes']) {
    await mkdir(path.join(target, ...directory.split('/')), { recursive: true });
  }
  await execFileAsync('git', ['init'], { cwd: target, windowsHide: true });
  await writeFile(path.join(target, '.gitignore'), 'private-notes/\nignored-*.md\n');
  await mkdir(path.join(target, 'docs', 'drafts'), { recursive: true });
  await writeFile(path.join(target, 'docs', '.gitignore'), 'drafts/\n');
  for (const file of [
    '_reference/source.md',
    '_work/scratch.md',
    '.ai-agent-playbook/runtime/reports/generated.md',
    'dist/output.md',
    'private-notes/local.md',
    'ignored-machine.md',
    'docs/drafts/nested-local.md'
  ]) {
    await writeFile(path.join(target, ...file.split('/')), 'private path C:\\Users\\home\\secret.txt\n');
  }
  const report = await doctorProject({ target, strict: false });
  const safety = report.checks.find((check) => check.id === 'public-safety.absolute-local-paths');
  assert.equal(safety.level, 'pass');
  assert.equal(safety.paths.length, 0);

  await mkdir(path.join(target, 'docs'), { recursive: true });
  await writeFile(path.join(target, 'docs', 'public.md'), 'private path C:\\Users\\home\\secret.txt\n');
  const failing = await doctorProject({ target, strict: false });
  const failingSafety = failing.checks.find((check) => check.id === 'public-safety.absolute-local-paths');
  assert.equal(failingSafety.level, 'fail');
  assert.deepEqual(failingSafety.paths, ['docs/public.md']);
});
