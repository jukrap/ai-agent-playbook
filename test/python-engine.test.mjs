import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import assert from 'node:assert/strict';
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

function successfulPythonChild(command) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => {};
  queueMicrotask(() => {
    child.stdout.end(JSON.stringify({
      executable: command,
      version: '3.13.0',
      engineAvailable: true,
      engineVersion: '0.5.10'
    }));
    child.stderr.end();
    child.emit('close', 0);
  });
  return child;
}
