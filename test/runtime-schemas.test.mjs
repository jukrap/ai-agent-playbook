import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRuntimeArtifact } from '../src/runtime/schemas.mjs';

test('runtime artifact schema accepts the required evidence envelope', () => {
  const artifact = {
    schemaVersion: '1',
    kind: 'runtime.example',
    ok: true,
    target: 'fixture-target',
    mode: { localOnly: true, network: false, writes: false },
    generatedAt: '2026-07-03T00:00:00.000Z',
    summary: { entries: 0 },
    warnings: [],
    conflicts: []
  };

  const validation = validateRuntimeArtifact(artifact, { path: 'runtime/example.json', expectedKind: 'runtime.example' });

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.conflicts, []);
});

test('runtime artifact schema rejects missing fields and stale kinds', () => {
  const validation = validateRuntimeArtifact({
    schemaVersion: '1',
    kind: 'runtime.old',
    target: 'fixture-target',
    summary: {},
    warnings: [],
    conflicts: []
  }, {
    path: 'runtime/bad.json',
    expectedKind: 'runtime.example'
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.conflicts.some((conflict) => conflict.id === 'runtime.artifact.missing-field'), true);
  assert.equal(validation.conflicts.some((conflict) => conflict.id === 'runtime.artifact.kind-mismatch'), true);
});
