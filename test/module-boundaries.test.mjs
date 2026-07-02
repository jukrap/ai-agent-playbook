import assert from 'node:assert/strict';
import test from 'node:test';
import * as harness from '../src/harness.mjs';
import * as operator from '../src/operator-diagnostics.mjs';

test('harness facade keeps the public runtime exports', () => {
  const expected = [
    'CONTEXT_DIR',
    'CONTEXT_SOURCE_FILES',
    'CONTRACTS_DIR',
    'DEFAULT_CONTEXT_MAX_CHARS',
    'DEFAULT_PLAYBOOK_DIR',
    'GUIDE_MANIFEST_FILE',
    'INSTALL_MANIFEST_FILE',
    'INSTALL_SOURCE',
    'LEGACY_PLAYBOOK_DIR',
    'REQUIRED_PLAYBOOK_FILES',
    'RUNS_DIR',
    'SCHEMA_VERSION',
    'adoptManagedManifest',
    'buildRuntimeIndex',
    'bootstrapProject',
    'buildDoctorReminderSignal',
    'buildProjectContext',
    'capabilityCatalog',
    'catalogManagedManifest',
    'checkContracts',
    'checkGuides',
    'checkManagedManifest',
    'checkReferenceAdoptionLedger',
    'contextStatus',
    'createPlan',
    'createWorklog',
    'createWriteGateAdvisory',
    'describePlaybookLayout',
    'doctorProject',
    'initContext',
    'initContracts',
    'inventoryReferenceDirectory',
    'listContexts',
    'listContracts',
    'migratePlaybookLayout',
    'migratePlaybookPath',
    'parseMaxChars',
    'previewWriteGate',
    'pruneManagedManifest',
    'recordRun',
    'resolvePlaybookLayout',
    'runStatus',
    'runtimeIndexStatus',
    'searchRuntimeIndex',
    'skillCatalog',
    'slugifyTitle',
    'snapshotContracts',
    'startRun',
    'summarizeRun',
    'summarizeWorklogs',
    'syncGuides',
    'todayIso',
    'uninstallManagedManifest',
    'validateManagedManifest',
    'workflowCatalog'
  ];

  assert.deepEqual(Object.keys(harness).sort(), expected.sort());
});

test('operator diagnostics facade keeps the public operator exports', () => {
  const expected = [
    'analyzeOperator',
    'auditOperator',
    'checkDiagnostics',
    'checkImageDiff',
    'checkOperator',
    'checkRules',
    'checkTuiCapture',
    'deltaOperator',
    'gcOperator',
    'mapOperator',
    'preflightOperator',
    'previewOperatorContext',
    'researchOperator',
    'searchOperator'
  ];

  assert.deepEqual(Object.keys(operator).sort(), expected.sort());
});
