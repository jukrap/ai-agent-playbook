import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateCapabilityWitness,
  validateEvalDefinition,
  validateEvalRunReport,
  validateEvidenceEnvelope,
  validateRuntimeArtifact,
  validateSourceRegistry
} from '../src/runtime/schemas.mjs';

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

test('runtime schemas accept eval, witness, source registry, and evidence shapes', () => {
  const evalDefinition = validateEvalDefinition({
    schemaVersion: '1',
    kind: 'runtime.eval-definition',
    id: 'prompt-regression',
    target: 'mcp prompt behavior',
    behavior: 'Prompt names required evidence before suggestions.',
    riskClass: 'medium',
    baseline: 'accepted prompt contract',
    fixtures: ['fixtures/prompt-regression.json'],
    graders: [{ type: 'rule', command: 'node test/prompt-contracts.test.mjs' }],
    successCriteria: { requiredSections: ['Required evidence', 'Stop conditions'] },
    budgets: { maxRuntimeMs: 30000, maxExternalCalls: 0 },
    storage: { runtimePath: '.ai-playbook/runtime/reports/evals/prompt-regression.json' }
  }, { path: 'runtime/reports/evals/prompt-regression.json' });
  assert.equal(evalDefinition.ok, true);

  const evalRun = validateEvalRunReport({
    schemaVersion: '1',
    kind: 'runtime.eval-run-report',
    evalId: 'prompt-regression',
    targetVersion: 'commit abc123',
    environment: { os: 'windows', node: '22.x' },
    attempts: { count: 1, retryPolicy: 'none' },
    results: [{ grader: 'rule', status: 'pass' }],
    artifacts: ['.ai-playbook/runtime/reports/evals/prompt-regression-run.json'],
    caveats: [],
    decision: 'accepted'
  }, { path: 'runtime/reports/evals/prompt-regression-run.json' });
  assert.equal(evalRun.ok, true);

  const witness = validateCapabilityWitness({
    schemaVersion: '1',
    kind: 'runtime.capability-witness',
    capabilityId: 'mcp-prompts',
    checkId: 'prompt-contract',
    timestamp: '2026-07-03T00:00:00.000Z',
    targetVersion: 'commit abc123',
    environment: { os: 'windows', node: '22.x' },
    status: 'pass',
    durationMs: 1200,
    summary: 'Prompt contract test passed.',
    artifacts: ['.ai-playbook/runtime/reports/witness/prompt-contract.json'],
    baseline: 'previous pass',
    caveats: []
  }, { path: 'runtime/reports/witness/prompt-contract.json' });
  assert.equal(witness.ok, true);

  const registry = validateSourceRegistry({
    schemaVersion: '1',
    sources: [{
      id: 'local-reference',
      type: 'docs',
      title: 'Local reference docs',
      owner: 'repository',
      status: 'available',
      privacyTier: 'internal',
      credentialBoundary: 'none',
      updateCadence: 'manual',
      freshness: '2026-07-03',
      locatorTypes: ['path-range'],
      searchModes: ['keyword'],
      browse: 'open project-relative path and line',
      promotionPolicy: 'reviewed facts may become knowledge references',
      caveats: []
    }]
  }, { path: 'knowledge/sources.json' });
  assert.equal(registry.ok, true);

  const envelope = validateEvidenceEnvelope({
    schemaVersion: '1',
    kind: 'runtime.evidence-envelope',
    sourceId: 'local-reference',
    locator: { type: 'path-range', path: 'docs/commands.md', startLine: 1 },
    query: 'schema-check',
    scanRange: 'docs/*.md',
    freshness: '2026-07-03',
    evidenceType: 'structured field',
    summary: 'Command docs mention runtime schema-check.',
    caveats: [],
    promotionStatus: 'candidate'
  }, { path: 'runtime/reports/evidence/schema-check.json' });
  assert.equal(envelope.ok, true);
});

test('runtime schemas reject credential values, absolute paths, and invalid enum values', () => {
  const validation = validateEvidenceEnvelope({
    schemaVersion: '1',
    kind: 'runtime.evidence-envelope',
    sourceId: 'local-reference',
    locator: { type: 'path-range', path: 'C:\\Users\\home\\secret.txt' },
    query: 'schema-check',
    scanRange: 'all docs',
    freshness: '2026-07-03',
    evidenceType: 'direct quote',
    summary: 'sk-proj-this-is-not-a-valid-example-but-is-secret-shaped-1234567890',
    caveats: [],
    promotionStatus: 'trusted'
  }, { path: 'runtime/reports/evidence/bad.json' });

  assert.equal(validation.ok, false);
  assert.equal(validation.conflicts.some((conflict) => conflict.id === 'runtime.schema.locator-path'), true);
  assert.equal(validation.conflicts.some((conflict) => conflict.id === 'runtime.schema.absolute-path'), true);
  assert.equal(validation.conflicts.some((conflict) => conflict.id === 'runtime.schema.credential-value'), true);
  assert.equal(validation.conflicts.some((conflict) => conflict.id === 'runtime.schema.enum-field'), true);
});
