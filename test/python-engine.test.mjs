import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pythonEngineStatus } from '../src/runtime/python-engine.mjs';

test('Python candidate discovery isolates a synchronous spawn failure', async () => {
  const status = await pythonEngineStatus({
    repoRoot: process.cwd(),
    spawnImpl(command) {
      if (command === 'python3') {
        throw Object.assign(new Error('spawn UNKNOWN'), { code: 'UNKNOWN' });
      }
      return successfulPythonChild(command);
    }
  });

  assert.equal(status.ok, true);
  assert.ok(status.selected);
  assert.deepEqual(
    status.candidates.find((candidate) => candidate.id === 'python3'),
    {
      id: 'python3',
      command: 'python3',
      args: [],
      available: false,
      engineAvailable: false,
      error: 'spawn UNKNOWN'
    }
  );
});

test('Python discovery accepts a healthy interpreter that takes more than three seconds to start', async (t) => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'aapb-python-start-'));
  t.after(async () => { assert.equal(path.dirname(repoRoot), os.tmpdir()); await rm(repoRoot, { recursive: true, force: true }); });
  const status = await pythonEngineStatus({
    repoRoot,
    spawnImpl(command) {
      if (command !== 'python') throw new Error('Unavailable test candidate');
      return successfulPythonChild(command, 3500);
    }
  });
  assert.equal(status.ok, true);
  assert.equal(status.selected?.command, 'python');
});

function successfulPythonChild(command, delay = 0) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  let timer;
  child.kill = () => clearTimeout(timer);
  const complete = () => {
    child.stdout.end(JSON.stringify({
      executable: command,
      version: '3.13.0',
      engineAvailable: true,
      engineVersion: '0.5.11'
    }));
    child.stderr.end();
    child.emit('close', 0);
  };
  if (delay) timer = setTimeout(complete, delay);
  else queueMicrotask(complete);
  return child;
}
