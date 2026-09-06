import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { treeSnapshot } from '../src/fs-safety.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));

test('Git checkout preserves installable skill hashes with either autocrlf setting', async () => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'aapb-checkout-'));
  try {
    const source = path.join(scratch, 'source');
    await mkdir(source);
    await cp(path.join(repository, 'skills'), path.join(source, 'skills'), { recursive: true });
    await writeFile(path.join(source, '.gitattributes'), await readFile(path.join(repository, '.gitattributes')));
    const git = (...args) => execFileSync('git', args, { cwd: source, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q');
    git('-c', 'core.autocrlf=true', 'add', '--', '.gitattributes', 'skills');
    const before = await treeSnapshot(path.join(source, 'skills'));
    for (const autocrlf of ['false', 'true']) {
      const checkout = path.join(scratch, autocrlf);
      await mkdir(checkout);
      git('-c', `core.autocrlf=${autocrlf}`, 'checkout-index', `--prefix=${checkout.replaceAll('\\', '/')}/`, '--all');
      const after = await treeSnapshot(path.join(checkout, 'skills'));
      assert.deepEqual(after.files, before.files, `Skill bytes changed with core.autocrlf=${autocrlf}`);
      assert.equal(after.hash, before.hash);
    }
  } finally {
    const relative = path.relative(tmpdir(), scratch);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    await rm(scratch, { recursive: true, force: true });
  }
});
