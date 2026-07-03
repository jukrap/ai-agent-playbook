import { mkdir, mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../src/cli.mjs';
import { validateSourceRegistry } from '../src/runtime/schemas.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('bootstrap dry-run does not write files', async () => {
  const target = await tempRepo();
  const io = capture(target);
  const code = await runCli(['bootstrap', '.', '--dry-run'], io);

  assert.equal(code, 0);
  assert.match(io.out(), /copy README\.md/);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  await cleanup(target);
});

test('bootstrap writes playbook and thin root agent bootstrap without overwriting', async () => {
  const target = await tempRepo();
  const io = capture(target);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], io), 0);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'SKILLS.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'GIT.md')), true);
  assert.equal(existsSync(path.join(target, 'AGENTS.md')), true);
  assert.equal(existsSync(path.join(target, 'SKILLS.md')), false);
  assert.equal(existsSync(path.join(target, 'GIT.md')), false);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /\.ai-playbook\//);

  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.ai-playbook\/$/m);

  const second = capture(target);
  assert.equal(await runCli(['bootstrap', '.'], second), 2);
  assert.match(second.err(), /Conflicts:/);
  await cleanup(target);
});

test('all bundled workflow recipes preview with required manifest sections', async () => {
  const target = await tempRepo('workflow all recipes-공백-');
  const list = capture(target);
  assert.equal(await runCli(['workflow', 'list', '--json'], list), 0);
  const listed = JSON.parse(list.out());
  assert.equal(listed.summary.workflows, 20);

  const before = await listRelativeFiles(target);
  for (const recipe of listed.workflows) {
    const preview = capture(target);
    assert.equal(await runCli(['workflow', 'run-preview', '.', '--recipe', recipe.id, '--json'], preview), 0);
    const report = JSON.parse(preview.out());
    assert.equal(report.ok, true, `${recipe.id} should preview successfully`);
    assert.equal(report.mode.writes, false);
    assert.equal(report.recipe.source, 'bundled');
    assert.equal(report.conflicts.length, 0);
    assert.ok(report.manifest.inputs.length > 0, `${recipe.id} should define inputs`);
    assert.ok(report.manifest.outputs.length > 0, `${recipe.id} should define outputs`);
    assert.ok(report.manifest.skills.length > 0, `${recipe.id} should define skills`);
    assert.ok(report.manifest.tools.length > 0, `${recipe.id} should define tools`);
    assert.ok(report.manifest.stopConditions.length > 0, `${recipe.id} should define stop conditions`);
    assert.ok(report.manifest.verification.length > 0, `${recipe.id} should define verification`);
  }
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('harness os v2 commands expose layout, catalog, index, and write-gate flows', async () => {
  const bareWorkflowTarget = await tempRepo('workflow preview bare-공백-');
  const bareWorkflowPreview = capture(bareWorkflowTarget);
  assert.equal(await runCli(['workflow', 'run-preview', '.', '--recipe', 'backend-contract-change', '--json'], bareWorkflowPreview), 0);
  const bareWorkflowPreviewReport = JSON.parse(bareWorkflowPreview.out());
  assert.equal(bareWorkflowPreviewReport.recipe.source, 'bundled');
  assert.equal(bareWorkflowPreviewReport.mode.writes, false);
  const missingPlaybookRunStart = capture(bareWorkflowTarget);
  assert.equal(await runCli(['workflow', 'run-start', '.', '--recipe', 'backend-contract-change', '--apply', '--json'], missingPlaybookRunStart), 1);
  const missingPlaybookRunStartReport = JSON.parse(missingPlaybookRunStart.out());
  assert.equal(missingPlaybookRunStartReport.conflicts.some((conflict) => conflict.id === 'workflow-run-start.playbook-missing'), true);
  await cleanup(bareWorkflowTarget);

  const target = await tempRepo('harness os-v2-공백-');
  await mkdir(path.join(target, 'src'), { recursive: true });
  await mkdir(path.join(target, 'src', 'runtime'), { recursive: true });
  await mkdir(path.join(target, 'db', 'migrations'), { recursive: true });
  await mkdir(path.join(target, '.github', 'workflows'), { recursive: true });
  await writeFile(path.join(target, 'src', 'feature.ts'), 'export const featureFlag = "harness-os";\nexport function calculateFeature() {\n  return featureFlag;\n}\nexport const DashboardPanel = () => null;\n');
  await writeFile(path.join(target, 'src', 'runtime', 'index.ts'), 'export const runtimeSource = true;\n');
  await writeFile(path.join(target, 'src', 'routes.ts'), 'router.get("/api/users", handler);\nfetch("/api/profile");\nconst message = "Update matching managed file";\n');
  await writeFile(path.join(target, 'src', 'service.py'), 'def process_event(value):\n    return value\n');
  await writeFile(path.join(target, 'src', 'App.java'), 'public class App {\n  public void handle() {}\n}\n');
  await writeFile(path.join(target, 'db', 'migrations', '001_create_users.sql'), 'CREATE TABLE users (id int primary key);\nSELECT id FROM users;\n');
  await writeFile(path.join(target, 'package.json'), `${JSON.stringify({
    name: 'fixture-app',
    packageManager: 'pnpm@10.0.0',
    scripts: { build: 'vite build', test: 'vitest run' },
    dependencies: { express: '^5.0.0' },
    devDependencies: { vite: '^7.0.0' }
  }, null, 2)}\n`);
  await writeFile(path.join(target, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
  await writeFile(path.join(target, 'Dockerfile'), 'FROM node:22-alpine AS runtime\n');
  await writeFile(path.join(target, '.github', 'workflows', 'ci.yml'), 'name: ci\njobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);

  const beforeMissingHistory = await listRelativeFiles(target);
  const missingHistory = capture(target);
  assert.equal(await runCli(['runtime', 'capability-history', '.', '--json'], missingHistory), 0);
  const missingHistoryReport = JSON.parse(missingHistory.out());
  assert.equal(missingHistoryReport.kind, 'runtime.capability-history');
  assert.equal(missingHistoryReport.exists, false);
  assert.equal(missingHistoryReport.mode.writes, false);
  assert.equal(missingHistoryReport.summary.entries, 0);
  assert.deepEqual(await listRelativeFiles(target), beforeMissingHistory);

  const catalog = capture(target);
  assert.equal(await runCli(['catalog', 'list', '--json'], catalog), 0);
  const catalogReport = JSON.parse(catalog.out());
  assert.equal(catalogReport.taxonomyVersion, '2');
  assert.equal(catalogReport.summary.categories, 12);
  assert.equal(catalogReport.summary.skills, 82);

  const catalogCheck = capture(target);
  assert.equal(await runCli(['catalog', 'check', '--json'], catalogCheck), 0);
  const catalogCheckReport = JSON.parse(catalogCheck.out());
  assert.equal(catalogCheckReport.summary.warnings, 0);
  assert.equal(catalogCheckReport.summary.conflicts, 0);
  for (const expectedSkill of [
    'requirements-prd-scope-review',
    'issue-planning-triage',
    'release-notes-changelog',
    'documentation-artifact-package',
    'eval-harness-design',
    'agent-orchestration-handoff',
    'capability-witness-history',
    'pre-action-fact-gate',
    'knowledge-source-registry',
    'security-compliance-gate'
  ]) {
    assert.equal(catalogCheckReport.skills.some((skill) => skill.name === expectedSkill), true);
  }

  const workflow = capture(target);
  assert.equal(await runCli(['workflow', 'list', '--json'], workflow), 0);
  const workflowReport = JSON.parse(workflow.out());
  assert.equal(workflowReport.summary.workflows, 20);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'deployment-release'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'package-release-readiness'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'ci-quality-gate'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'architecture-boundary-review'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'frontend-quality-review'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'data-integrity-review'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'eval-driven-change'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'knowledge-source-onboarding'), true);
  assert.equal(workflowReport.workflows.some((item) => item.id === 'agent-orchestration-handoff'), true);

  const databaseWorkflowPreview = capture(target);
  assert.equal(await runCli(['workflow', 'run-preview', '.', '--recipe', 'database-migration', '--json'], databaseWorkflowPreview), 0);
  const databaseWorkflowPreviewReport = JSON.parse(databaseWorkflowPreview.out());
  assert.equal(databaseWorkflowPreviewReport.manifest.skills.some((skill) => skill.includes('schema migration plan')), true);
  assert.equal(databaseWorkflowPreviewReport.manifest.skills.some((skill) => skill.includes('query performance review')), true);
  assert.equal(databaseWorkflowPreviewReport.manifest.skills.some((skill) => skill.includes('data integrity constraints')), true);
  assert.equal(databaseWorkflowPreviewReport.manifest.verification.some((item) => item.includes('rendered report/export/dashboard')), true);

  const beforeWorkflowPreview = await listRelativeFiles(target);
  const workflowPreview = capture(target);
  assert.equal(await runCli(['workflow', 'run-preview', '.', '--recipe', 'backend-contract-change', '--json'], workflowPreview), 0);
  const workflowPreviewReport = JSON.parse(workflowPreview.out());
  assert.equal(workflowPreviewReport.kind, 'runtime.workflow-run-preview');
  assert.equal(workflowPreviewReport.mode.writes, false);
  assert.equal(workflowPreviewReport.recipe.id, 'backend-contract-change');
  assert.equal(workflowPreviewReport.recipe.source, 'target');
  assert.equal(workflowPreviewReport.manifest.skills.some((skill) => skill.includes('API contract boundary')), true);
  assert.equal(workflowPreviewReport.manifest.tools.includes('operator map'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeWorkflowPreview);

  const beforeWorkflowStart = await listRelativeFiles(target);
  const workflowStartDryRun = capture(target);
  assert.equal(await runCli(['workflow', 'run-start', '.', '--recipe', 'deployment-release', '--json'], workflowStartDryRun), 0);
  const workflowStartDryRunReport = JSON.parse(workflowStartDryRun.out());
  assert.equal(workflowStartDryRunReport.kind, 'runtime.workflow-run-start');
  assert.equal(workflowStartDryRunReport.applied, false);
  assert.equal(workflowStartDryRunReport.mode.writes, false);
  assert.equal(workflowStartDryRunReport.runPath.startsWith('.ai-playbook/workflows/runs/'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeWorkflowStart);

  const workflowStartApply = capture(target);
  assert.equal(await runCli(['workflow', 'run-start', '.', '--recipe', 'deployment-release', '--apply', '--json'], workflowStartApply), 0);
  const workflowStartApplyReport = JSON.parse(workflowStartApply.out());
  assert.equal(workflowStartApplyReport.applied, true);
  assert.equal(workflowStartApplyReport.mode.writes, true);
  assert.equal(workflowStartApplyReport.runPath.startsWith('.ai-playbook/workflows/runs/'), true);
  assert.equal(existsSync(path.join(target, workflowStartApplyReport.runPath, 'manifest.json')), true);
  assert.equal(existsSync(path.join(target, workflowStartApplyReport.runPath, 'criteria.md')), true);
  assert.equal(existsSync(path.join(target, workflowStartApplyReport.runPath, 'evidence.md')), true);
  assert.equal(existsSync(path.join(target, workflowStartApplyReport.runPath, 'handoff.md')), true);

  await mkdir(path.join(target, '.ai-playbook', 'workflows', 'recipes'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'workflows', 'recipes', 'backend-contract-change.md'), '# Local Backend Contract Change\n\nInputs: local input\n\nOutputs: local output\n\nSkills: local skill\n\nTools: local tool\n\nStop conditions: local blocker\n\nVerification: local verification\n');
  const beforeLocalWorkflowPreview = await listRelativeFiles(target);
  const localWorkflowPreview = capture(target);
  assert.equal(await runCli(['workflow', 'run-preview', '.', '--recipe', 'backend-contract-change', '--json'], localWorkflowPreview), 0);
  const localWorkflowPreviewReport = JSON.parse(localWorkflowPreview.out());
  assert.equal(localWorkflowPreviewReport.recipe.source, 'target');
  assert.equal(localWorkflowPreviewReport.manifest.inputs.includes('local input'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeLocalWorkflowPreview);

  const layout = capture(target);
  assert.equal(await runCli(['layout', 'status', '.', '--json'], layout), 0);
  const layoutReport = JSON.parse(layout.out());
  assert.equal(layoutReport.layout.version, '2');
  assert.equal(layoutReport.summary.missingDirectories, 0);

  const migration = capture(target);
  assert.equal(await runCli(['migrate', 'layout', '.', '--to', 'v2', '--json'], migration), 0);
  const migrationReport = JSON.parse(migration.out());
  assert.equal(migrationReport.ok, true);

  const preview = capture(target);
  assert.equal(await runCli(['index', 'build', '.', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'file-inventory.json')), false);

  const applied = capture(target);
  assert.equal(await runCli(['index', 'build', '.', '--apply', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  assert.equal(appliedReport.applied, true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'file-inventory.json')), true);

  const status = capture(target);
  assert.equal(await runCli(['index', 'status', '.', '--json'], status), 0);
  const statusReport = JSON.parse(status.out());
  assert.equal(statusReport.exists, true);
  assert.equal(statusReport.indexes.some((item) => item.kind === 'file-inventory' && item.exists === true), true);
  assert.equal(statusReport.indexes.some((item) => item.kind === 'symbol-outline' && item.previewOnly === true), true);
  assert.equal(statusReport.indexes.some((item) => item.kind === 'dependency-inventory' && item.previewOnly === true), true);
  assert.equal(statusReport.indexes.some((item) => item.kind === 'route-api-hints' && item.previewOnly === true), true);

  const search = capture(target);
  assert.equal(await runCli(['index', 'search', '.', '--query', 'harness-os', '--json'], search), 0);
  const searchReport = JSON.parse(search.out());
  assert.equal(searchReport.summary.matches >= 1, true);

  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'indexes'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'generated.ts'), 'export const generatedIgnored = true;\n');
  const symbolOutline = capture(target);
  assert.equal(await runCli(['index', 'symbol-outline', '.', '--json'], symbolOutline), 0);
  const symbolOutlineReport = JSON.parse(symbolOutline.out());
  assert.equal(symbolOutlineReport.kind, 'runtime.symbol-outline');
  assert.equal(symbolOutlineReport.mode.writes, false);
  assert.equal(symbolOutlineReport.summary.entries >= 6, true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'symbol-outline.json')), false);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.file === 'src/feature.ts' && entry.kind === 'constant' && entry.name === 'featureFlag'), true);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.file === 'src/feature.ts' && entry.kind === 'function' && entry.name === 'calculateFeature'), true);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.file === 'src/feature.ts' && entry.kind === 'component' && entry.name === 'DashboardPanel'), true);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.file === 'src/runtime/index.ts' && entry.name === 'runtimeSource'), true);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.file === 'src/service.py' && entry.kind === 'function' && entry.name === 'process_event'), true);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.file === 'src/App.java' && entry.kind === 'class' && entry.name === 'App'), true);
  assert.equal(symbolOutlineReport.entries.some((entry) => entry.name === 'generatedIgnored'), false);

  const dependencyInventory = capture(target);
  assert.equal(await runCli(['index', 'dependency-inventory', '.', '--json'], dependencyInventory), 0);
  const dependencyInventoryReport = JSON.parse(dependencyInventory.out());
  assert.equal(dependencyInventoryReport.kind, 'runtime.dependency-inventory');
  assert.equal(dependencyInventoryReport.mode.writes, false);
  assert.equal(dependencyInventoryReport.summary.manifests >= 1, true);
  assert.equal(dependencyInventoryReport.manifests.some((manifest) => manifest.path === 'package.json' && manifest.scripts.includes('build')), true);
  assert.equal(dependencyInventoryReport.lockfiles.some((lockfile) => lockfile.path === 'pnpm-lock.yaml'), true);
  assert.equal(dependencyInventoryReport.containers.some((container) => container.path === 'Dockerfile' && container.baseImages.some((image) => image.image === 'node:22-alpine')), true);
  assert.equal(dependencyInventoryReport.ci.some((ci) => ci.path === '.github/workflows/ci.yml' && ci.uses.includes('actions/checkout@v4')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'dependency-inventory.json')), false);

  const routeApiHints = capture(target);
  assert.equal(await runCli(['index', 'route-api-hints', '.', '--json'], routeApiHints), 0);
  const routeApiHintsReport = JSON.parse(routeApiHints.out());
  assert.equal(routeApiHintsReport.kind, 'runtime.route-api-hints');
  assert.equal(routeApiHintsReport.mode.writes, false);
  assert.equal(routeApiHintsReport.hints.some((hint) => hint.kind === 'route' && hint.framework === 'express' && hint.method === 'GET' && hint.path === '/api/users'), true);
  assert.equal(routeApiHintsReport.hints.some((hint) => hint.kind === 'client-api' && hint.client === 'fetch' && hint.path === '/api/profile'), true);
  assert.equal(routeApiHintsReport.hints.some((hint) => hint.kind === 'data' && hint.operation === 'create-table' && hint.name === 'users'), true);
  assert.equal(routeApiHintsReport.hints.some((hint) => hint.kind === 'data' && hint.operation === 'update' && hint.name === 'matching'), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'route-api-hints.json')), false);

  const beforeGraph = await listRelativeFiles(target);
  const repoGraph = capture(target);
  assert.equal(await runCli(['graph', 'preview', '.', '--max-results', '100', '--json'], repoGraph), 0);
  const repoGraphReport = JSON.parse(repoGraph.out());
  assert.equal(repoGraphReport.kind, 'runtime.repo-graph');
  assert.equal(repoGraphReport.mode.writes, false);
  assert.equal(repoGraphReport.summary.nodes > 0, true);
  assert.equal(repoGraphReport.summary.edges > 0, true);
  assert.equal(repoGraphReport.nodes.some((node) => node.kind === 'file' && node.path === 'src/feature.ts'), true);
  assert.equal(repoGraphReport.nodes.some((node) => node.kind === 'symbol' && node.label === 'calculateFeature'), true);
  assert.equal(repoGraphReport.nodes.some((node) => node.kind === 'route' && node.label === '/api/users'), true);
  assert.equal(repoGraphReport.nodes.some((node) => node.kind === 'package' && node.path === 'package.json'), true);
  assert.equal(repoGraphReport.edges.some((edge) => edge.kind === 'contains'), true);
  assert.equal(repoGraphReport.edges.some((edge) => edge.kind === 'defines-route'), true);
  assert.equal(repoGraphReport.nodes.some((node) => node.label === 'generatedIgnored'), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'runtime', 'graphs', 'repo-graph.json')), false);
  assert.deepEqual(await listRelativeFiles(target), beforeGraph);

  const gate = capture(target);
  assert.equal(await runCli(['write-gate', 'preview', '.', '--intent', 'edit runtime report', '--path', '.ai-playbook/runtime/indexes/file-inventory.json', '--json'], gate), 1);
  const gateReport = JSON.parse(gate.out());
  assert.equal(gateReport.ok, false);
  assert.match(gateReport.transaction.invocationId, /^[0-9a-f-]{36}$/);
  assert.equal(gateReport.transaction.lifecycle, 'pre-write-preview');
  assert.match(gateReport.transaction.advisoryPath, /^\.ai-playbook\/runtime\/reports\/write-gate\/pre-write-advisory\.[0-9a-f-]{36}\.json$/);
  assert.equal(gateReport.transaction.applied, false);
  assert.equal(gateReport.blockers.some((blocker) => blocker.id === 'write-gate.runtime-target'), true);

  const sourceGate = capture(target);
  assert.equal(await runCli(['write-gate', 'preview', '.', '--intent', 'edit runtime source module', '--path', 'src/runtime/index.ts', '--json'], sourceGate), 0);
  const sourceGateReport = JSON.parse(sourceGate.out());
  assert.equal(sourceGateReport.ok, true);
  assert.equal(sourceGateReport.blockers.some((blocker) => blocker.id === 'write-gate.runtime-target'), false);

  const beforeAdvisory = await listRelativeFiles(target);
  const advisoryDryRun = capture(target);
  assert.equal(await runCli(['write-gate', 'advisory', '.', '--intent', 'edit runtime source module', '--path', 'src/runtime/index.ts', '--json'], advisoryDryRun), 0);
  const advisoryDryRunReport = JSON.parse(advisoryDryRun.out());
  assert.equal(advisoryDryRunReport.ok, true);
  assert.equal(advisoryDryRunReport.transaction.lifecycle, 'pre-write-advisory-preview');
  assert.equal(advisoryDryRunReport.transaction.applied, false);
  assert.equal(advisoryDryRunReport.advisory.written, false);
  assert.match(advisoryDryRunReport.advisory.path, /^\.ai-playbook\/runtime\/reports\/write-gate\/pre-write-advisory\.[0-9a-f-]{36}\.json$/);
  assert.deepEqual(await listRelativeFiles(target), beforeAdvisory);

  const advisoryApply = capture(target);
  assert.equal(await runCli(['write-gate', 'advisory', '.', '--intent', 'edit runtime source module', '--path', 'src/runtime/index.ts', '--apply', '--json'], advisoryApply), 0);
  const advisoryApplyReport = JSON.parse(advisoryApply.out());
  assert.equal(advisoryApplyReport.ok, true);
  assert.equal(advisoryApplyReport.transaction.lifecycle, 'pre-write-advisory');
  assert.equal(advisoryApplyReport.transaction.applied, true);
  assert.equal(advisoryApplyReport.advisory.written, true);
  assert.equal(advisoryApplyReport.operations[0].applied, true);
  const advisoryFile = path.join(target, ...advisoryApplyReport.advisory.path.split('/'));
  assert.equal(existsSync(advisoryFile), true);
  const advisoryJson = JSON.parse(await readFile(advisoryFile, 'utf8'));
  assert.equal(advisoryJson.kind, 'write-gate.pre-write-advisory');
  assert.equal(advisoryJson.manifest.kind, 'write-gate.pre-write-advisory');
  assert.equal(advisoryJson.transaction.invocationId, advisoryApplyReport.transaction.invocationId);
  assert.equal(advisoryJson.intent, 'edit runtime source module');
  assert.equal(advisoryJson.snapshot.files.length > 0, true);

  const cleanPostCheck = capture(target);
  assert.equal(await runCli(['write-gate', 'post-check', '.', '--advisory', advisoryApplyReport.advisory.path, '--json'], cleanPostCheck), 0);
  const cleanPostCheckReport = JSON.parse(cleanPostCheck.out());
  assert.equal(cleanPostCheckReport.summary.added, 0);
  assert.equal(cleanPostCheckReport.summary.modified, 0);
  assert.equal(cleanPostCheckReport.summary.deleted, 0);
  assert.equal(cleanPostCheckReport.warnings.some((warning) => warning.id === 'write-gate.post-check.playbook-change'), false);

  await mkdir(path.join(target, 'src', 'runtime'), { recursive: true });
  await writeFile(path.join(target, 'src', 'runtime', 'index.ts'), 'export const runtimeSource = "changed";\n');
  await writeFile(path.join(target, 'src', 'outside.ts'), 'export const outside = true;\n');
  const postCheck = capture(target);
  assert.equal(await runCli(['write-gate', 'post-check', '.', '--advisory', advisoryApplyReport.advisory.path, '--json'], postCheck), 0);
  const postCheckReport = JSON.parse(postCheck.out());
  assert.equal(postCheckReport.ok, true);
  assert.equal(postCheckReport.mode.writes, false);
  assert.equal(postCheckReport.summary.status, 'checked');
  assert.equal(postCheckReport.changes.modified.some((item) => item.path === 'src/runtime/index.ts'), true);
  assert.equal(postCheckReport.changes.added.some((item) => item.path === 'src/outside.ts'), true);
  assert.equal(postCheckReport.warnings.some((warning) => warning.id === 'write-gate.post-check.intent-outside-change'), true);

  const missingPostCheck = capture(target);
  assert.equal(await runCli(['write-gate', 'post-check', '.', '--advisory', '.ai-playbook/runtime/reports/write-gate/missing.json', '--json'], missingPostCheck), 1);
  const missingPostCheckReport = JSON.parse(missingPostCheck.out());
  assert.equal(missingPostCheckReport.summary.status, 'unknown');

  await cleanup(target);
});

test('canon draft and check keep runtime evidence read-only until promotion', async () => {
  const target = await tempRepo('canon lifecycle-한글-');
  await mkdir(path.join(target, 'src'), { recursive: true });
  await writeFile(path.join(target, 'src', 'changed.ts'), 'export const changed = "before";\n');
  await writeFile(path.join(target, 'src', 'stale.ts'), 'export const stale = true;\n');
  await writeFile(path.join(target, 'src', 'ok.ts'), 'export const ok = true;\n');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);

  const index = capture(target);
  assert.equal(await runCli(['index', 'build', '.', '--apply', '--json'], index), 0);
  const indexReport = JSON.parse(index.out());
  assert.equal(indexReport.kind, 'runtime.file-inventory');
  assert.equal(indexReport.mode.writes, true);

  const advisory = capture(target);
  assert.equal(await runCli([
    'write-gate',
    'advisory',
    '.',
    '--intent',
    'edit changed source',
    '--path',
    'src/changed.ts',
    '--apply',
    '--json'
  ], advisory), 0);
  const advisoryReport = JSON.parse(advisory.out());
  const advisoryPath = advisoryReport.advisory.path;
  const advisoryJson = JSON.parse(await readFile(path.join(target, ...advisoryPath.split('/')), 'utf8'));
  const beforeDraft = await listRelativeFiles(target);

  const draft = capture(target);
  assert.equal(await runCli(['canon', 'draft', '.', '--json'], draft), 0);
  const draftReport = JSON.parse(draft.out());
  assert.equal(draftReport.ok, true);
  assert.equal(draftReport.mode.writes, false);
  assert.equal(draftReport.facts.some((fact) => fact.kind === 'file-inventory'), true);
  assert.equal(draftReport.facts.some((fact) => fact.kind === 'write-gate-advisory'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeDraft);

  const promotedMemoryPath = '.ai-playbook/memory/maps/promoted-canon.json';
  const promotePreview = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', advisoryPath, '--to', promotedMemoryPath, '--json'], promotePreview), 0);
  const promotePreviewReport = JSON.parse(promotePreview.out());
  assert.equal(promotePreviewReport.applied, false);
  assert.equal(promotePreviewReport.mode.writes, false);
  assert.equal(promotePreviewReport.summary.facts > 0, true);
  assert.equal(existsSync(path.join(target, ...promotedMemoryPath.split('/'))), false);
  assert.deepEqual(await listRelativeFiles(target), beforeDraft);

  const blockedPromotion = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', advisoryPath, '--to', 'docs/canon.json', '--json'], blockedPromotion), 1);
  const blockedPromotionReport = JSON.parse(blockedPromotion.out());
  assert.equal(blockedPromotionReport.conflicts.some((conflict) => conflict.id === 'canon.promote.destination-not-allowed'), true);

  const blockedSource = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', '.ai-playbook/runtime/tmp/loose.json', '--to', promotedMemoryPath, '--json'], blockedSource), 1);
  const blockedSourceReport = JSON.parse(blockedSource.out());
  assert.equal(blockedSourceReport.conflicts.some((conflict) => conflict.id === 'canon.promote.source-not-runtime'), true);

  const invalidArtifactPath = '.ai-playbook/runtime/reports/invalid-artifact.json';
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'reports'), { recursive: true });
  await writeFile(path.join(target, ...invalidArtifactPath.split('/')), `${JSON.stringify({
    schemaVersion: '1',
    target: path.resolve(target),
    summary: {},
    warnings: [],
    conflicts: []
  }, null, 2)}\n`);
  const invalidArtifact = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', invalidArtifactPath, '--to', promotedMemoryPath, '--json'], invalidArtifact), 1);
  const invalidArtifactReport = JSON.parse(invalidArtifact.out());
  assert.equal(invalidArtifactReport.conflicts.some((conflict) => conflict.id === 'canon.promote.source-invalid-artifact'), true);

  const blockedDestinationType = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', advisoryPath, '--to', '.ai-playbook/memory/maps/promoted-canon.md', '--json'], blockedDestinationType), 1);
  const blockedDestinationTypeReport = JSON.parse(blockedDestinationType.out());
  assert.equal(blockedDestinationTypeReport.conflicts.some((conflict) => conflict.id === 'canon.promote.destination-not-json'), true);

  const unreviewedPromotion = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', advisoryPath, '--to', promotedMemoryPath, '--apply', '--json'], unreviewedPromotion), 1);
  const unreviewedPromotionReport = JSON.parse(unreviewedPromotion.out());
  assert.equal(unreviewedPromotionReport.conflicts.some((conflict) => conflict.id === 'canon.promote.review-required'), true);
  assert.equal(existsSync(path.join(target, ...promotedMemoryPath.split('/'))), false);

  const promotedReferencePath = '.ai-playbook/knowledge/references/promoted-canon.json';
  const appliedPromotion = capture(target);
  assert.equal(await runCli(['canon', 'promote', '.', '--source', advisoryPath, '--to', promotedReferencePath, '--apply', '--reviewed', '--json'], appliedPromotion), 0);
  const appliedPromotionReport = JSON.parse(appliedPromotion.out());
  assert.equal(appliedPromotionReport.applied, true);
  assert.equal(appliedPromotionReport.mode.writes, true);
  assert.equal(existsSync(path.join(target, ...promotedReferencePath.split('/'))), true);
  const promotedJson = JSON.parse(await readFile(path.join(target, ...promotedReferencePath.split('/')), 'utf8'));
  assert.equal(promotedJson.kind, 'canon.fact-set');
  assert.equal(promotedJson.audit.reviewed, true);
  assert.equal(promotedJson.facts.length, appliedPromotionReport.summary.facts);

  const promotedCheck = capture(target);
  assert.equal(await runCli(['canon', 'check', '.', '--path', promotedReferencePath, '--json'], promotedCheck), 0);
  const promotedCheckReport = JSON.parse(promotedCheck.out());
  assert.equal(promotedCheckReport.summary.verified, promotedJson.facts.length);

  await writeFile(path.join(target, 'src', 'changed.ts'), 'export const changed = "after";\n');
  await mkdir(path.join(target, '.ai-playbook', 'memory', 'maps'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'memory', 'maps', 'canon.json'), `${JSON.stringify({
    schemaVersion: '1',
    facts: [
      {
        id: 'fact.changed',
        kind: 'write-gate-advisory',
        sourceReport: advisoryPath,
        scanRange: ['src/changed.ts'],
        confidence: 'medium',
        observedAt: advisoryJson.generatedAt.slice(0, 10)
      },
      {
        id: 'fact.stale',
        kind: 'file-inventory',
        sourceReport: indexReport.index,
        scanRange: ['src/stale.ts'],
        confidence: 'medium',
        observedAt: '2000-01-01'
      },
      {
        id: 'fact.missing',
        kind: 'route-api-hint',
        sourceReport: '.ai-playbook/runtime/reports/missing.json',
        scanRange: ['src/missing.ts'],
        confidence: 'medium',
        observedAt: '2026-07-03'
      },
      {
        id: 'fact.unverified',
        kind: 'manual-note',
        scanRange: ['src/ok.ts'],
        confidence: 'low',
        observedAt: '2026-07-03'
      }
    ]
  }, null, 2)}\n`);
  const beforeCheck = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['canon', 'check', '.', '--json'], checked), 1);
  const checkReport = JSON.parse(checked.out());
  assert.equal(checkReport.mode.writes, false);
  assert.equal(checkReport.summary.facts, 4);
  assert.equal(checkReport.summary.changed, 1);
  assert.equal(checkReport.summary.stale, 1);
  assert.equal(checkReport.summary.missing, 1);
  assert.equal(checkReport.summary.unverified, 1);
  assert.equal(checkReport.facts.find((fact) => fact.id === 'fact.changed').status, 'changed');
  assert.equal(checkReport.facts.find((fact) => fact.id === 'fact.stale').status, 'stale');
  assert.equal(checkReport.facts.find((fact) => fact.id === 'fact.missing').status, 'missing');
  assert.equal(checkReport.facts.find((fact) => fact.id === 'fact.unverified').status, 'unverified');
  assert.deepEqual(await listRelativeFiles(target), beforeCheck);
  await cleanup(target);
});

test('index status reports invalid runtime artifacts without writing files', async () => {
  const target = await tempRepo('runtime schema invalid-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'indexes'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'file-inventory.json'), `${JSON.stringify({
    schemaVersion: '1',
    target: path.resolve(target),
    generatedAt: '2026-07-03T00:00:00.000Z',
    summary: {},
    warnings: [],
    conflicts: []
  }, null, 2)}\n`);
  const before = await listRelativeFiles(target);
  const status = capture(target);

  assert.equal(await runCli(['index', 'status', '.', '--json'], status), 1);
  const report = JSON.parse(status.out());
  assert.equal(report.ok, false);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'runtime.artifact.missing-field'), true);
  assert.equal(report.indexes.some((index) => index.kind === 'file-inventory' && index.valid === false), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('index status reports malformed runtime artifact JSON without throwing', async () => {
  const target = await tempRepo('runtime schema malformed-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'indexes'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'indexes', 'file-inventory.json'), '{not-json');
  const before = await listRelativeFiles(target);
  const status = capture(target);

  assert.equal(await runCli(['index', 'status', '.', '--json'], status), 1);
  const report = JSON.parse(status.out());
  assert.equal(report.ok, false);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'runtime.artifact.malformed-json'), true);
  assert.equal(report.indexes.some((index) => index.kind === 'file-inventory' && index.valid === false), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('runtime schema-check validates known runtime and source schemas without writing files', async () => {
  const target = await tempRepo('runtime schema check-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evals'), { recursive: true });
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evidence'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evals', 'prompt-regression.json'), `${JSON.stringify({
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
  }, null, 2)}\n`);
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evidence', 'bad.json'), `${JSON.stringify({
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
  }, null, 2)}\n`);
  const before = await listRelativeFiles(target);

  const evalCheck = capture(target);
  assert.equal(await runCli(['runtime', 'schema-check', '.', '--path', '.ai-playbook/runtime/reports/evals/prompt-regression.json', '--json'], evalCheck), 0);
  const evalReport = JSON.parse(evalCheck.out());
  assert.equal(evalReport.kind, 'runtime.schema-check');
  assert.equal(evalReport.mode.writes, false);
  assert.equal(evalReport.expectedKind, 'runtime.eval-definition');
  assert.equal(evalReport.summary.conflicts, 0);

  const sourceCheck = capture(target);
  assert.equal(await runCli(['runtime', 'schema-check', '.', '--path', '.ai-playbook/knowledge/sources.json', '--json'], sourceCheck), 0);
  const sourceReport = JSON.parse(sourceCheck.out());
  assert.equal(sourceReport.expectedKind, 'runtime.source-registry');
  assert.equal(sourceReport.summary.conflicts, 0);

  const missingCheck = capture(target);
  assert.equal(await runCli(['runtime', 'schema-check', '.', '--path', '.ai-playbook/runtime/reports/evidence/missing.json', '--json'], missingCheck), 1);
  const missingReport = JSON.parse(missingCheck.out());
  assert.equal(missingReport.conflicts.some((conflict) => conflict.id === 'runtime.schema.file-unreadable'), true);
  assert.equal(JSON.stringify(missingReport.conflicts).includes(target), false);

  const badCheck = capture(target);
  assert.equal(await runCli(['runtime', 'schema-check', '.', '--path', '.ai-playbook/runtime/reports/evidence/bad.json', '--kind', 'runtime.evidence-envelope', '--json'], badCheck), 1);
  const badReport = JSON.parse(badCheck.out());
  assert.equal(badReport.conflicts.some((conflict) => conflict.id === 'runtime.schema.credential-value'), true);
  assert.equal(badReport.conflicts.some((conflict) => conflict.id === 'runtime.schema.locator-path'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('evidence locator-check validates JSON and Markdown locators without writing files', async () => {
  const target = await tempRepo('evidence locator check-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evidence'), { recursive: true });
  await mkdir(path.join(target, 'docs'), { recursive: true });
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evidence', 'ok.json'), `${JSON.stringify({
    schemaVersion: '1',
    kind: 'runtime.evidence-envelope',
    sourceId: 'local-reference',
    sourceBoundary: 'local-file',
    locator: { type: 'path-range', path: 'src/app.ts#L1-L5' },
    query: 'locator-check',
    scanRange: 'src/**/*.ts',
    freshness: '2026-07-03',
    evidenceType: 'summary',
    summary: 'The route is defined in src/app.ts.',
    caveats: [],
    promotionStatus: 'runtime-only'
  }, null, 2)}\n`);
  await writeFile(path.join(target, '.ai-playbook', 'runtime', 'reports', 'evidence', 'bad.json'), `${JSON.stringify({
    locator: { type: 'path-range', path: 'C:\\Users\\home\\secret.txt' },
    sourceBoundary: 'unknown-boundary',
    summary: 'sk-proj-this-is-not-a-valid-example-but-is-secret-shaped-1234567890'
  }, null, 2)}\n`);
  await writeFile(path.join(target, 'docs', 'notes.md'), '# Notes\n\nGeneral implementation notes without locator blocks.\n');
  await writeFile(path.join(target, 'docs', 'locators.md'), [
    '| locatorType | locator | scanRange | sourceBoundary | freshness |',
    '| --- | --- | --- | --- | --- |',
    '| path-range | src/app.ts#L1-L5 | src/**/*.ts | local-file | 2026-07-03 |',
    ''
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const okCheck = capture(target);
  assert.equal(await runCli(['evidence', 'locator-check', '.', '--path', '.ai-playbook/runtime/reports/evidence/ok.json', '--json'], okCheck), 0);
  const okReport = JSON.parse(okCheck.out());
  assert.equal(okReport.kind, 'runtime.evidence-locator-check');
  assert.equal(okReport.mode.writes, false);
  assert.equal(okReport.summary.locators, 1);
  assert.equal(okReport.summary.conflicts, 0);

  const badCheck = capture(target);
  assert.equal(await runCli(['evidence', 'locator-check', '.', '--path', '.ai-playbook/runtime/reports/evidence/bad.json', '--json'], badCheck), 1);
  const badReport = JSON.parse(badCheck.out());
  assert.equal(badReport.conflicts.some((conflict) => conflict.id === 'evidence-locator.scan-range-missing'), true);
  assert.equal(badReport.conflicts.some((conflict) => conflict.id === 'evidence-locator.source-boundary-unknown'), true);
  assert.equal(badReport.conflicts.some((conflict) => conflict.id === 'evidence-locator.portable-path'), true);
  assert.equal(badReport.conflicts.some((conflict) => conflict.id === 'evidence-locator.credential-value'), true);

  const missingCheck = capture(target);
  assert.equal(await runCli(['evidence', 'locator-check', '.', '--path', '.ai-playbook/runtime/reports/evidence/missing.json', '--json'], missingCheck), 1);
  const missingReport = JSON.parse(missingCheck.out());
  assert.equal(missingReport.conflicts.some((conflict) => conflict.id === 'evidence-locator.file-unreadable'), true);
  assert.equal(JSON.stringify(missingReport.conflicts).includes(target), false);

  const notesCheck = capture(target);
  assert.equal(await runCli(['evidence', 'locator-check', '.', '--path', 'docs/notes.md', '--json'], notesCheck), 0);
  const notesReport = JSON.parse(notesCheck.out());
  assert.equal(notesReport.warnings.some((warning) => warning.id === 'evidence-locator.markdown-none'), true);

  const tableCheck = capture(target);
  assert.equal(await runCli(['evidence', 'locator-check', '.', '--path', 'docs/locators.md', '--json'], tableCheck), 0);
  const tableReport = JSON.parse(tableCheck.out());
  assert.equal(tableReport.summary.locators, 1);
  assert.equal(tableReport.summary.conflicts, 0);

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('runtime capability-history summarizes append-only JSONL without writing files', async () => {
  const target = await tempRepo('capability history-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'reports'), { recursive: true });
  const absoluteEvidence = path.join(target, 'secret-evidence.log');
  const entries = [
    {
      capability: 'runtime-index-canon',
      status: 'pass',
      generatedAt: '2026-07-03T00:00:00.000Z',
      durationMs: 800,
      baselineMs: 1000,
      evidence: ['.ai-playbook/runtime/indexes/file-inventory.json']
    },
    {
      capability: 'runtime-index-canon',
      status: 'fail',
      generatedAt: '2026-07-03T01:00:00.000Z',
      durationMs: 1200,
      baselineMs: 1000,
      evidence: [absoluteEvidence, 'docs/safe.md']
    },
    {
      capability: 'security-review',
      status: 'warn',
      generatedAt: 'not-a-date',
      durationMs: 50,
      baselineMs: 100
    }
  ];
  await writeFile(
    path.join(target, '.ai-playbook', 'runtime', 'reports', 'capability-history.jsonl'),
    `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`
  );
  const before = await listRelativeFiles(target);
  const history = capture(target);

  assert.equal(await runCli(['runtime', 'capability-history', '.', '--json'], history), 0);
  assert.equal(history.out().includes('secret-evidence.log'), false);
  const report = JSON.parse(history.out());
  assert.equal(report.ok, true);
  assert.equal(report.exists, true);
  assert.equal(report.mode.writes, false);
  assert.equal(report.summary.entries, 3);
  assert.equal(report.summary.capabilities, 2);
  assert.equal(report.summary.latestStatuses.fail, 1);
  assert.equal(report.summary.latestStatuses.warn, 1);
  assert.equal(report.warnings.some((warning) => warning.id === 'capability-history.non-portable-evidence'), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'capability-history.invalid-timestamp'), true);
  const runtimeCapability = report.capabilities.find((item) => item.capability === 'runtime-index-canon');
  assert.equal(runtimeCapability.latestStatus, 'fail');
  assert.equal(runtimeCapability.latestDurationMs, 1200);
  assert.equal(runtimeCapability.baselineMs, 1000);
  assert.equal(runtimeCapability.driftMs, 200);
  assert.equal(runtimeCapability.driftPercent, 20);
  assert.deepEqual(runtimeCapability.evidence, ['docs/safe.md']);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('runtime capability-history reports malformed JSONL lines', async () => {
  const target = await tempRepo('capability history malformed-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await mkdir(path.join(target, '.ai-playbook', 'runtime', 'reports'), { recursive: true });
  await writeFile(
    path.join(target, '.ai-playbook', 'runtime', 'reports', 'capability-history.jsonl'),
    '{"capability":"runtime-index-canon","status":"pass"}\n{bad-json\n'
  );
  const before = await listRelativeFiles(target);
  const history = capture(target);

  assert.equal(await runCli(['runtime', 'capability-history', '.', '--json'], history), 1);
  const report = JSON.parse(history.out());
  assert.equal(report.ok, false);
  assert.equal(report.summary.entries, 1);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'capability-history.malformed-line'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('reference inventory summarizes local reference collections without writing files', async () => {
  const target = await tempRepo('reference inventory-한글-');
  const referenceRoot = path.join(target, '_reference');
  await mkdir(path.join(referenceRoot, 'repo-lens-like', 'skills', 'write-gate'), { recursive: true });
  await mkdir(path.join(referenceRoot, 'repo-lens-like', 'src', 'mcp-server'), { recursive: true });
  await mkdir(path.join(referenceRoot, 'connector-pack', 'reference', 'connectors'), { recursive: true });
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'README.md'), '# Repo Lens\n');
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'skills', 'write-gate', 'SKILL.md'), '---\nname: write-gate\n---\n# Write Gate\n');
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'src', 'mcp-server', 'index.ts'), 'export const mcpServer = true;\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'package.json'), '{"name":"connector-pack"}\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'SECURITY.md'), '# Security\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'reference', 'connectors', 'postgres.md'), '# Postgres\n');
  const before = await listRelativeFiles(target);

  const inventory = capture(target);
  assert.equal(await runCli(['reference', 'inventory', referenceRoot, '--json'], inventory), 0);
  const report = JSON.parse(inventory.out());
  assert.equal(report.ok, true);
  assert.equal(report.mode.writes, false);
  assert.equal(report.summary.projects, 2);
  assert.equal(report.summary.files, 6);
  assert.equal(report.summary.projectsWithSignals.skills, 1);
  assert.equal(report.summary.projectsWithSignals.connectors, 1);

  const repoLens = report.projects.find((project) => project.id === 'repo-lens-like');
  assert.equal(repoLens.signals.skills, 1);
  assert.equal(repoLens.signals.mcp, 1);
  assert.equal(repoLens.candidateCapabilities.includes('skill-pack'), true);
  assert.equal(repoLens.candidateCapabilities.includes('mcp-integration'), true);

  const connectorPack = report.projects.find((project) => project.id === 'connector-pack');
  assert.equal(connectorPack.candidateCapabilities.includes('connector-reference'), true);
  assert.equal(connectorPack.candidateCapabilities.includes('security-validation'), true);

  const queue = capture(target);
  assert.equal(await runCli(['reference', 'adoption-queue', referenceRoot, '--max-results', '1', '--json'], queue), 0);
  const queueReport = JSON.parse(queue.out());
  assert.equal(queueReport.ok, true);
  assert.equal(queueReport.mode.writes, false);
  assert.equal(queueReport.summary.queueItems, 1);
  assert.equal('ledgerStatuses' in queueReport.summary, false);
  assert.equal(queueReport.queue[0].project, 'repo-lens-like');
  assert.equal(queueReport.queue[0].recommendedCapabilities.includes('ai-harness'), true);
  assert.equal(queueReport.queue[0].signalHighlights.some((item) => item.signal === 'mcp'), true);
  assert.equal(queueReport.queue[0].nextActions.some((item) => item.includes('MCP surfaces')), true);

  const matrix = capture(target);
  assert.equal(await runCli(['reference', 'capability-matrix', referenceRoot, '--max-results', '2', '--json'], matrix), 0);
  const matrixReport = JSON.parse(matrix.out());
  assert.equal(matrixReport.ok, true);
  assert.equal(matrixReport.kind, 'reference.capability-matrix');
  assert.equal(matrixReport.mode.writes, false);
  assert.equal(matrixReport.summary.queueItems, 2);
  assert.equal(matrixReport.capabilities['ai-harness'].projects, 1);
  assert.equal(matrixReport.capabilities.security.projects, 1);
  assert.equal(matrixReport.capabilities['ai-harness'].topReferences[0].project, 'repo-lens-like');
  assert.equal(matrixReport.capabilities.security.topReferences[0].project, 'connector-pack');
  assert.deepEqual(await listRelativeFiles(target), before);

  const filteredMatrix = capture(target);
  assert.equal(await runCli(['reference', 'capability-matrix', referenceRoot, '--capability', 'security', '--max-results', '2', '--json'], filteredMatrix), 0);
  const filteredMatrixReport = JSON.parse(filteredMatrix.out());
  assert.deepEqual(Object.keys(filteredMatrixReport.capabilities), ['security']);
  assert.equal(filteredMatrixReport.capabilities.security.projects, 1);
  assert.equal(filteredMatrixReport.summary.capabilities, 1);
  assert.deepEqual(await listRelativeFiles(target), before);

  const missingPlanCapability = capture(target);
  assert.equal(await runCli(['reference', 'adoption-plan', referenceRoot, '--json'], missingPlanCapability), 1);
  const missingPlanCapabilityReport = JSON.parse(missingPlanCapability.out());
  assert.equal(missingPlanCapabilityReport.conflicts.some((conflict) => conflict.id === 'reference-adoption-plan.capability-required'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const adoptionPlan = capture(target);
  assert.equal(await runCli(['reference', 'adoption-plan', referenceRoot, '--capability', 'ai-harness', '--max-results', '2', '--json'], adoptionPlan), 0);
  const adoptionPlanReport = JSON.parse(adoptionPlan.out());
  assert.equal(adoptionPlanReport.ok, true);
  assert.equal(adoptionPlanReport.kind, 'reference.adoption-plan');
  assert.equal(adoptionPlanReport.mode.writes, false);
  assert.equal(adoptionPlanReport.summary.selectedReferences, 1);
  assert.equal(adoptionPlanReport.plan.capability, 'ai-harness');
  assert.equal(adoptionPlanReport.plan.references[0].project, 'repo-lens-like');
  assert.equal(adoptionPlanReport.plan.references[0].readOrder.some((entry) => entry.path === 'README.md'), true);
  assert.equal(adoptionPlanReport.plan.references[0].suggestedSurfaces.some((surface) => surface.surface === 'skill-reference'), true);
  assert.equal(adoptionPlanReport.plan.references[0].suggestedSurfaces.some((surface) => surface.surface === 'mcp-permission-tier'), true);
  assert.equal(adoptionPlanReport.plan.stopConditions.length > 0, true);
  assert.equal(adoptionPlanReport.plan.verification.some((item) => item.includes('npm run check')), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const inspect = capture(target);
  assert.equal(await runCli(['reference', 'inspect', referenceRoot, '--project', 'repo-lens-like', '--json'], inspect), 0);
  const inspectReport = JSON.parse(inspect.out());
  assert.equal(inspectReport.ok, true);
  assert.equal(inspectReport.kind, 'reference.inspect');
  assert.equal(inspectReport.mode.writes, false);
  assert.equal(inspectReport.project, 'repo-lens-like');
  assert.equal(inspectReport.summary.files, 3);
  assert.equal(inspectReport.recommendedCapabilities.includes('ai-harness'), true);
  assert.equal(inspectReport.review.readOrder.some((entry) => entry.path === 'README.md'), true);
  assert.equal(inspectReport.review.adoptionQuestions.length >= 3, true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const unsafeInspect = capture(target);
  assert.equal(await runCli(['reference', 'inspect', referenceRoot, '--project', '../outside', '--json'], unsafeInspect), 1);
  const unsafeInspectReport = JSON.parse(unsafeInspect.out());
  assert.equal(unsafeInspectReport.conflicts.some((conflict) => conflict.id === 'reference-inspect.project-path-invalid'), true);

  const missingInspect = capture(target);
  assert.equal(await runCli(['reference', 'inspect', referenceRoot, '--project', 'missing-pack', '--json'], missingInspect), 1);
  const missingInspectReport = JSON.parse(missingInspect.out());
  assert.equal(missingInspectReport.conflicts.some((conflict) => conflict.id === 'reference-inspect.project-missing'), true);

  const sourcePreview = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-preview', referenceRoot, '--max-results', '2', '--json'], sourcePreview), 0);
  const sourceReport = JSON.parse(sourcePreview.out());
  assert.equal(sourceReport.ok, true);
  assert.equal(sourceReport.mode.writes, false);
  assert.equal(sourceReport.candidatePath, '.ai-playbook/knowledge/sources.json');
  assert.equal(sourceReport.summary.schemaValid, true);
  assert.equal(sourceReport.registry.sources.length, 2);
  assert.equal(sourceReport.registry.sources.every((source) => source.id.startsWith('reference-')), true);
  assert.equal(sourceReport.registry.sources.some((source) => source.recommendedCapabilities.includes('ai-harness')), true);
  assert.equal(validateSourceRegistry(sourceReport.registry, { path: 'knowledge/sources.json' }).ok, true);
  assert.deepEqual(await listRelativeFiles(target), before);

  await mkdir(path.join(target, '.ai-playbook', 'knowledge'), { recursive: true });
  const sourcesPath = path.join(target, '.ai-playbook', 'knowledge', 'sources.json');
  await writeFile(sourcesPath, `${JSON.stringify({ schemaVersion: '1', sources: [] }, null, 2)}\n`);
  const beforeSourceUpdate = await listRelativeFiles(target);
  const sourceUpdatePreview = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-update', '.', '--reference-dir', referenceRoot, '--max-results', '2', '--json'], sourceUpdatePreview), 0);
  const sourceUpdatePreviewReport = JSON.parse(sourceUpdatePreview.out());
  assert.equal(sourceUpdatePreviewReport.ok, true);
  assert.equal(sourceUpdatePreviewReport.applied, false);
  assert.equal(sourceUpdatePreviewReport.mode.writes, false);
  assert.equal(sourceUpdatePreviewReport.summary.existing, 0);
  assert.equal(sourceUpdatePreviewReport.summary.added, 2);
  assert.equal(sourceUpdatePreviewReport.summary.operations, 1);
  assert.equal(sourceUpdatePreviewReport.registry.sources.some((source) => source.id === 'reference-repo-lens-like'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeSourceUpdate);
  assert.deepEqual(JSON.parse(await readFile(sourcesPath, 'utf8')).sources, []);

  const sourceUpdateApply = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-update', '.', '--reference-dir', referenceRoot, '--max-results', '2', '--apply', '--json'], sourceUpdateApply), 0);
  const sourceUpdateApplyReport = JSON.parse(sourceUpdateApply.out());
  assert.equal(sourceUpdateApplyReport.ok, true);
  assert.equal(sourceUpdateApplyReport.applied, true);
  assert.equal(sourceUpdateApplyReport.mode.writes, true);
  const writtenSources = JSON.parse(await readFile(sourcesPath, 'utf8'));
  assert.equal(writtenSources.sources.length, 2);

  const sourceUpdateSecondRun = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-update', '.', '--reference-dir', referenceRoot, '--max-results', '2', '--apply', '--json'], sourceUpdateSecondRun), 0);
  const sourceUpdateSecondRunReport = JSON.parse(sourceUpdateSecondRun.out());
  assert.equal(sourceUpdateSecondRunReport.summary.added, 0);
  assert.equal(sourceUpdateSecondRunReport.summary.operations, 0);
  assert.equal(sourceUpdateSecondRunReport.applied, false);
  assert.deepEqual(JSON.parse(await readFile(sourcesPath, 'utf8')), writtenSources);

  const unsafeSourceUpdatePath = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-update', '.', '--reference-dir', referenceRoot, '--path', '../outside.json', '--json'], unsafeSourceUpdatePath), 1);
  const unsafeSourceUpdatePathReport = JSON.parse(unsafeSourceUpdatePath.out());
  assert.equal(unsafeSourceUpdatePathReport.conflicts.some((conflict) => conflict.id === 'reference-source-registry-update.path-invalid'), true);

  const fileReferenceDirPath = path.join(target, 'not-a-source-reference-dir.txt');
  await writeFile(fileReferenceDirPath, 'not a directory\n');
  const fileReferenceDir = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-update', '.', '--reference-dir', fileReferenceDirPath, '--json'], fileReferenceDir), 1);
  const fileReferenceDirReport = JSON.parse(fileReferenceDir.out());
  assert.equal(fileReferenceDirReport.conflicts.some((conflict) => conflict.id === 'reference-source-registry-update.reference-dir-missing'), true);

  const ledgerPath = path.join(target, '.ai-playbook', 'knowledge', 'reference-adoption-ledger.md');
  await writeFile(ledgerPath, [
    '# Reference Adoption Ledger',
    '',
    '| Status | Reference ID | Capability | Useful Pattern | Local Adoption | Risk/Noise | Decision Date |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| adopted | repo-lens-like | ai-harness | MCP surface pattern | local queue annotation | none | 2026-07-03 |',
    ''
  ].join('\n'));
  const beforeLedgerQueue = await listRelativeFiles(target);
  const ledgerQueue = capture(target);
  assert.equal(await runCli(['reference', 'adoption-queue', referenceRoot, '--max-results', '2', '--ledger', ledgerPath, '--json'], ledgerQueue), 0);
  const ledgerQueueReport = JSON.parse(ledgerQueue.out());
  assert.equal(ledgerQueueReport.ok, true);
  assert.equal(ledgerQueueReport.summary.ledgerStatuses.adopted, 1);
  assert.equal(ledgerQueueReport.summary.ledgerStatuses.new, 1);
  const adoptedQueueItem = ledgerQueueReport.queue.find((item) => item.project === 'repo-lens-like');
  assert.equal(adoptedQueueItem.ledgerStatus, 'adopted');
  assert.equal(adoptedQueueItem.ledgerCapability, 'ai-harness');
  assert.equal(adoptedQueueItem.ledgerDecisionDate, '2026-07-03');

  const ledgerMatrix = capture(target);
  assert.equal(await runCli(['reference', 'capability-matrix', referenceRoot, '--max-results', '2', '--ledger', ledgerPath, '--json'], ledgerMatrix), 0);
  const ledgerMatrixReport = JSON.parse(ledgerMatrix.out());
  assert.equal(ledgerMatrixReport.ok, true);
  assert.equal(ledgerMatrixReport.mode.writes, false);
  assert.equal(ledgerMatrixReport.capabilities['ai-harness'].ledgerStatuses.adopted, 1);
  assert.equal(ledgerMatrixReport.capabilities.security.ledgerStatuses.new, 1);
  const adoptedMatrixItem = ledgerMatrixReport.capabilities['ai-harness'].topReferences.find((item) => item.project === 'repo-lens-like');
  assert.equal(adoptedMatrixItem.ledgerStatus, 'adopted');
  assert.equal(adoptedMatrixItem.ledgerCapability, 'ai-harness');
  assert.equal(adoptedMatrixItem.ledgerDecisionDate, '2026-07-03');

  const filteredLedgerMatrix = capture(target);
  assert.equal(await runCli(['reference', 'capability-matrix', referenceRoot, '--capability', 'ai-harness', '--max-results', '2', '--ledger', ledgerPath, '--json'], filteredLedgerMatrix), 0);
  const filteredLedgerMatrixReport = JSON.parse(filteredLedgerMatrix.out());
  assert.deepEqual(Object.keys(filteredLedgerMatrixReport.capabilities), ['ai-harness']);
  assert.equal(filteredLedgerMatrixReport.capabilities['ai-harness'].ledgerStatuses.adopted, 1);

  const ledgerPlan = capture(target);
  assert.equal(await runCli(['reference', 'adoption-plan', referenceRoot, '--capability', 'ai-harness', '--ledger', ledgerPath, '--json'], ledgerPlan), 0);
  const ledgerPlanReport = JSON.parse(ledgerPlan.out());
  assert.equal(ledgerPlanReport.ok, true);
  assert.equal(ledgerPlanReport.plan.references[0].project, 'repo-lens-like');
  assert.equal(ledgerPlanReport.plan.references[0].ledger.status, 'adopted');
  assert.equal(ledgerPlanReport.plan.references[0].ledger.capability, 'ai-harness');
  assert.equal(ledgerPlanReport.matrix.ledgerStatuses.adopted, 1);
  assert.deepEqual(await listRelativeFiles(target), beforeLedgerQueue);

  await writeFile(path.join(target, '.ai-playbook', 'knowledge', 'sources.json'), `${JSON.stringify(sourceReport.registry, null, 2)}\n`);
  const beforeSourceCheck = await listRelativeFiles(target);
  const sourceCheck = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-check', '.', '--reference-dir', referenceRoot, '--json'], sourceCheck), 0);
  const sourceCheckReport = JSON.parse(sourceCheck.out());
  assert.equal(sourceCheckReport.ok, true);
  assert.equal(sourceCheckReport.mode.writes, false);
  assert.equal(sourceCheckReport.summary.entries, 2);
  assert.equal(sourceCheckReport.summary.schemaValid, true);
  assert.equal(sourceCheckReport.summary.missingReferencePaths, 0);
  assert.equal(sourceCheckReport.summary.missingRepresentativeFiles, 0);
  assert.deepEqual(await listRelativeFiles(target), beforeSourceCheck);

  const driftRegistry = {
    ...sourceReport.registry,
    sources: [{
      ...sourceReport.registry.sources[0],
      referencePath: 'missing-reference-pack'
    }]
  };
  await writeFile(path.join(target, '.ai-playbook', 'knowledge', 'sources.json'), `${JSON.stringify(driftRegistry, null, 2)}\n`);
  const beforeDriftCheck = await listRelativeFiles(target);
  const driftCheck = capture(target);
  assert.equal(await runCli(['reference', 'source-registry-check', '.', '--reference-dir', referenceRoot, '--json'], driftCheck), 1);
  const driftReport = JSON.parse(driftCheck.out());
  assert.equal(driftReport.ok, false);
  assert.equal(driftReport.conflicts.some((conflict) => conflict.id === 'reference-source-registry.reference-path-missing'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeDriftCheck);
  await cleanup(target);
});

test('reference inventory default scans more than twenty top-level projects', async () => {
  const target = await tempRepo('reference inventory many-한글-');
  const referenceRoot = path.join(target, '_reference');
  for (let index = 1; index <= 24; index += 1) {
    const id = `reference-${String(index).padStart(2, '0')}`;
    await mkdir(path.join(referenceRoot, id), { recursive: true });
    await writeFile(path.join(referenceRoot, id, 'README.md'), `# ${id}\n`);
  }
  const before = await listRelativeFiles(target);

  const inventory = capture(target);
  assert.equal(await runCli(['reference', 'inventory', referenceRoot, '--json'], inventory), 0);
  const report = JSON.parse(inventory.out());
  assert.equal(report.summary.projects, 24);
  assert.equal(report.summary.totalProjects, 24);
  assert.equal(report.summary.warnings, 0);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('reference ledger init previews and writes queue ledger safely', async () => {
  const target = await tempRepo('reference ledger init-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const referenceRoot = path.join(target, '_reference');
  await mkdir(path.join(referenceRoot, 'repo-lens-like', 'skills', 'write-gate'), { recursive: true });
  await mkdir(path.join(referenceRoot, 'connector-pack', 'reference', 'connectors'), { recursive: true });
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'README.md'), '# Repo Lens\n');
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'skills', 'write-gate', 'SKILL.md'), '---\nname: write-gate\n---\n# Write Gate\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'package.json'), '{"name":"connector-pack"}\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'reference', 'connectors', 'postgres.md'), '# Postgres\n');

  const before = await listRelativeFiles(target);
  const defaultPathPreview = capture(target);
  assert.equal(await runCli(['reference', 'ledger-init', '.', '--reference-dir', referenceRoot, '--json'], defaultPathPreview), 1);
  const defaultPathReport = JSON.parse(defaultPathPreview.out());
  assert.equal(defaultPathReport.conflicts.some((conflict) => conflict.id === 'reference-ledger-init.file-exists'), true);
  assert.equal(defaultPathReport.summary.operations, 0);
  assert.deepEqual(await listRelativeFiles(target), before);

  const customPath = '.ai-playbook/knowledge/generated-reference-ledger.md';
  const preview = capture(target);
  assert.equal(await runCli(['reference', 'ledger-init', '.', '--reference-dir', referenceRoot, '--path', customPath, '--max-results', '2', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.ok, true);
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.mode.writes, false);
  assert.equal(previewReport.summary.entries, 2);
  assert.equal(previewReport.summary.operations, 1);
  assert.equal(previewReport.path, customPath);
  assert.equal(previewReport.ledger.content.includes('reference-repo-lens-like'), true);
  assert.equal(previewReport.ledger.content.includes(target), false);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['reference', 'ledger-init', '.', '--reference-dir', referenceRoot, '--path', customPath, '--max-results', '2', '--apply', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  assert.equal(appliedReport.ok, true);
  assert.equal(appliedReport.applied, true);
  assert.equal(appliedReport.mode.writes, true);
  const ledgerPath = path.join(target, ...customPath.split('/'));
  const ledgerText = await readFile(ledgerPath, 'utf8');
  assert.equal(ledgerText.includes('reference-connector-pack'), true);

  const check = capture(target);
  assert.equal(await runCli(['reference', 'ledger-check', '.', '--path', customPath, '--json'], check), 0);
  const checkReport = JSON.parse(check.out());
  assert.equal(checkReport.ok, true);
  assert.equal(checkReport.summary.statuses.new, 2);

  const overwrite = capture(target);
  assert.equal(await runCli(['reference', 'ledger-init', '.', '--reference-dir', referenceRoot, '--path', customPath, '--apply', '--json'], overwrite), 1);
  const overwriteReport = JSON.parse(overwrite.out());
  assert.equal(overwriteReport.conflicts.some((conflict) => conflict.id === 'reference-ledger-init.file-exists'), true);

  const unsafePath = capture(target);
  assert.equal(await runCli(['reference', 'ledger-init', '.', '--reference-dir', referenceRoot, '--path', '../outside.md', '--json'], unsafePath), 1);
  const unsafePathReport = JSON.parse(unsafePath.out());
  assert.equal(unsafePathReport.conflicts.some((conflict) => conflict.id === 'reference-ledger-init.path-invalid'), true);
  await cleanup(target);
});

test('reference ledger update appends missing queue rows without overwriting decisions', async () => {
  const target = await tempRepo('reference ledger update-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const referenceRoot = path.join(target, '_reference');
  await mkdir(path.join(referenceRoot, 'repo-lens-like', 'skills', 'write-gate'), { recursive: true });
  await mkdir(path.join(referenceRoot, 'connector-pack', 'reference', 'connectors'), { recursive: true });
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'README.md'), '# Repo Lens\n');
  await writeFile(path.join(referenceRoot, 'repo-lens-like', 'skills', 'write-gate', 'SKILL.md'), '---\nname: write-gate\n---\n# Write Gate\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'package.json'), '{"name":"connector-pack"}\n');
  await writeFile(path.join(referenceRoot, 'connector-pack', 'reference', 'connectors', 'postgres.md'), '# Postgres\n');
  const ledgerPath = path.join(target, '.ai-playbook', 'knowledge', 'reference-adoption-ledger.md');
  const before = await listRelativeFiles(target);
  const originalLedger = await readFile(ledgerPath, 'utf8');
  assert.equal(originalLedger.includes('| new |  |  |  |  |  |  |'), true);

  const preview = capture(target);
  assert.equal(await runCli(['reference', 'ledger-update', '.', '--reference-dir', referenceRoot, '--max-results', '2', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.ok, true);
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.mode.writes, false);
  assert.equal(previewReport.summary.added, 2);
  assert.equal(previewReport.summary.removedPlaceholder, true);
  assert.equal(previewReport.summary.operations, 1);
  assert.equal(previewReport.ledger.content.includes('reference-repo-lens-like'), true);
  assert.equal(previewReport.ledger.content.includes('| new |  |  |  |  |  |  |'), false);
  assert.deepEqual(await listRelativeFiles(target), before);
  assert.equal(await readFile(ledgerPath, 'utf8'), originalLedger);

  const applied = capture(target);
  assert.equal(await runCli(['reference', 'ledger-update', '.', '--reference-dir', referenceRoot, '--max-results', '2', '--apply', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  assert.equal(appliedReport.ok, true);
  assert.equal(appliedReport.applied, true);
  assert.equal(appliedReport.mode.writes, true);
  const ledgerText = await readFile(ledgerPath, 'utf8');
  assert.equal(ledgerText.includes('reference-connector-pack'), true);
  assert.equal(ledgerText.includes('| new |  |  |  |  |  |  |'), false);

  const check = capture(target);
  assert.equal(await runCli(['reference', 'ledger-check', '.', '--json'], check), 0);
  const checkReport = JSON.parse(check.out());
  assert.equal(checkReport.ok, true);
  assert.equal(checkReport.summary.statuses.new, 2);

  const secondRun = capture(target);
  assert.equal(await runCli(['reference', 'ledger-update', '.', '--reference-dir', referenceRoot, '--max-results', '2', '--apply', '--json'], secondRun), 0);
  const secondRunReport = JSON.parse(secondRun.out());
  assert.equal(secondRunReport.summary.added, 0);
  assert.equal(secondRunReport.summary.operations, 0);
  assert.equal(secondRunReport.applied, false);
  assert.equal(await readFile(ledgerPath, 'utf8'), ledgerText);

  const unsafePath = capture(target);
  assert.equal(await runCli(['reference', 'ledger-update', '.', '--reference-dir', referenceRoot, '--path', '../outside.md', '--json'], unsafePath), 1);
  const unsafePathReport = JSON.parse(unsafePath.out());
  assert.equal(unsafePathReport.conflicts.some((conflict) => conflict.id === 'reference-ledger-update.path-invalid'), true);

  const fileReferenceDirPath = path.join(target, 'not-a-reference-dir.txt');
  await writeFile(fileReferenceDirPath, 'not a directory\n');
  const fileReferenceDir = capture(target);
  assert.equal(await runCli(['reference', 'ledger-update', '.', '--reference-dir', fileReferenceDirPath, '--json'], fileReferenceDir), 1);
  const fileReferenceDirReport = JSON.parse(fileReferenceDir.out());
  assert.equal(fileReferenceDirReport.conflicts.some((conflict) => conflict.id === 'reference-ledger-update.reference-dir-missing'), true);
  await cleanup(target);
});

test('reference ledger check validates statuses and local-only leaks without writing files', async () => {
  const target = await tempRepo('reference ledger-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const customLedgerPath = path.join(target, '.ai-playbook', 'knowledge', 'custom-reference-ledger.md');
  await writeFile(customLedgerPath, [
    '# Custom Reference Adoption Ledger',
    '',
    '| Status | Reference ID | Capability | Useful Pattern | Local Adoption | Risk/Noise | Decision Date |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| reviewed | security-pack | security | summarize source pattern | local validator | none | 2026-07-03 |',
    '```text',
    ...Array.from({ length: 21 }, (_, index) => `example excerpt line ${index + 1}`),
    '```',
    ''
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const clean = capture(target);
  assert.equal(await runCli(['reference', 'ledger-check', '.', '--json'], clean), 0);
  const cleanReport = JSON.parse(clean.out());
  assert.equal(cleanReport.ok, true);
  assert.equal(cleanReport.summary.statuses.new, 1);
  assert.equal(cleanReport.summary.capabilities.uncategorized.statuses.new, 1);

  const ledgerPath = path.join(target, '.ai-playbook', 'knowledge', 'reference-adoption-ledger.md');
  await writeFile(ledgerPath, [
    '# Reference Adoption Ledger',
    '',
    '| Status | Reference ID | Capability | Useful Pattern | Local Adoption | Risk/Noise | Decision Date |',
    '| :--- | ---: | :---: | --- | --- | --- | --- |',
    '| adopted | safe-pack | runtime-index-canon | reviewed pattern | local command | none | 2026-07-03 |',
    '| maybe | unsafe-pack | security | copied from C:\\secret\\repo | none | token sk-test-123456789012 | 2026-07-03 |',
    ''
  ].join('\n'));

  const dirty = capture(target);
  assert.equal(await runCli(['reference', 'ledger-check', '.', '--json'], dirty), 1);
  const dirtyReport = JSON.parse(dirty.out());
  assert.equal(dirtyReport.ok, false);
  assert.equal(dirtyReport.conflicts.some((conflict) => conflict.id === 'reference-ledger.invalid-status'), true);
  assert.equal(dirtyReport.conflicts.some((conflict) => conflict.id === 'reference-ledger.local-absolute-path'), true);
  assert.equal(dirtyReport.conflicts.some((conflict) => conflict.id === 'reference-ledger.secret-like-token'), true);
  assert.equal(dirtyReport.summary.capabilities['runtime-index-canon'].statuses.adopted, 1);
  assert.equal(existsSync(ledgerPath), true);

  const loose = capture(target);
  assert.equal(await runCli(['reference', 'ledger-check', '.', '--path', '.ai-playbook/knowledge/custom-reference-ledger.md', '--json'], loose), 0);
  const looseReport = JSON.parse(loose.out());
  assert.equal(looseReport.ok, true);
  assert.equal(looseReport.path, '.ai-playbook/knowledge/custom-reference-ledger.md');
  assert.equal(looseReport.summary.capabilities.security.statuses.reviewed, 1);
  assert.equal(looseReport.warnings.some((warning) => warning.id === 'reference-ledger.large-excerpt'), true);

  const strict = capture(target);
  assert.equal(await runCli(['reference', 'ledger-check', '.', '--path', '.ai-playbook/knowledge/custom-reference-ledger.md', '--strict', '--json'], strict), 1);
  const strictReport = JSON.parse(strict.out());
  assert.equal(strictReport.ok, false);
  assert.equal(strictReport.conflicts.some((conflict) => conflict.id === 'reference-ledger.large-excerpt'), true);

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('bootstrap conflict preflight refuses existing AGENTS without partial writes', async () => {
  const target = await tempRepo('bootstrap conflict-한글-');
  await writeFile(path.join(target, 'AGENTS.md'), '# Existing policy\n');
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], checked), 2);
  assert.match(checked.err(), /Conflicts:/);
  assert.match(checked.err(), /AGENTS\.md/);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('doctor reports missing and bootstrapped project state', async () => {
  const target = await tempRepo();
  const missing = capture(target);
  assert.equal(await runCli(['doctor', '.'], missing), 1);
  assert.match(missing.out(), /\[FAIL\] \.ai-playbook directory/);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.'], checked), 0);
  assert.match(checked.out(), /\[PASS\] .ai-playbook\/CURRENT.md/);
  assert.match(checked.out(), /\[PASS\] root AGENTS bootstrap/);
  assert.match(checked.out(), /\[PASS\] root AGENTS reading order/);
  assert.match(checked.out(), /\[WARN\] playbook adaptation/);
  await cleanup(target);
});

test('legacy ai-playbook layout remains readable when the dot playbook is absent', async () => {
  const target = await tempRepo('legacy ai playbook-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy context signal');
  await writeFile(path.join(target, '.gitignore'), 'ai-playbook/\n');
  await writeFile(path.join(target, 'AGENTS.md'), [
    '# Root',
    '',
    'Read ai-playbook/START_HERE.md, ai-playbook/CURRENT.md, ai-playbook/SKILLS.md, and ai-playbook/GIT.md.'
  ].join('\n'));

  const doctor = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], doctor), 0);
  const doctorReport = JSON.parse(doctor.out());
  assert.equal(doctorReport.ok, true);
  assert.equal(doctorReport.checks.some((check) => check.id === 'playbook.directory' && check.paths.includes('ai-playbook/')), true);
  assert.equal(doctorReport.checks.some((check) => check.id === 'playbook.file.current.md' && check.paths.includes('ai-playbook/CURRENT.md')), true);

  const context = capture(target);
  assert.equal(await runCli(['context', '.', '--json', '--max-chars', '5000'], context), 0);
  const contextReport = JSON.parse(context.out());
  assert.equal(contextReport.ok, true);
  assert.deepEqual(contextReport.sources.map((source) => source.path), [
    'ai-playbook/START_HERE.md',
    'ai-playbook/CURRENT.md',
    'ai-playbook/SKILLS.md',
    'ai-playbook/GIT.md'
  ]);
  assert.match(contextReport.additionalContext, /Legacy context signal/);
  await cleanup(target);
});

test('write commands keep using legacy ai-playbook when the dot playbook is absent', async () => {
  const target = await tempRepo('legacy ai playbook-write-공백-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy write signal');

  assert.equal(await runCli(['guides', 'sync', '.'], capture(target)), 0);
  assert.equal(existsSync(path.join(target, 'ai-playbook', 'guides', 'runtime-harness.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);

  assert.equal(await runCli(['plan', 'new', '.', '--title', 'Legacy Path', '--date', '2026-06-08'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Legacy Path', '--date', '2026-06-08'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  await stat(path.join(target, 'ai-playbook', 'plans', '2026-06-08-legacy-path.md'));
  await stat(path.join(target, 'ai-playbook', 'worklogs', '2026-06', '2026-06-08-legacy-path.md'));
  await stat(path.join(target, 'ai-playbook', 'worklogs', 'summaries', '2026-06.md'));
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  await cleanup(target);
});

test('doctor --json reports stable schema and strict warning behavior', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  const missing = capture(target);

  assert.equal(await runCli(['doctor', '.', '--json'], missing), 1);
  const missingReport = JSON.parse(missing.out());
  assert.equal(missingReport.schemaVersion, '1');
  assert.equal(missingReport.strict, false);
  assert.equal(missingReport.summary.fail > 0, true);
  assert.equal(missingReport.checks.some((check) => check.id === 'playbook.directory' && check.category === 'setup'), true);

  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const defaultCheck = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], defaultCheck), 0);
  const defaultReport = JSON.parse(defaultCheck.out());
  assert.equal(defaultReport.ok, true);
  assert.equal(defaultReport.checks.some((check) => check.id === 'playbook.adaptation' && check.level === 'warn'), true);

  const strictCheck = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json', '--strict'], strictCheck), 1);
  const strictReport = JSON.parse(strictCheck.out());
  assert.equal(strictReport.strict, true);
  assert.equal(strictReport.ok, false);
  await cleanup(target);
});

test('doctor --json warns when a worklog month has no summary without writing files', async () => {
  const target = await tempRepo('ai playbook-worklog-공백-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-05-03'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  const warning = report.checks.find((check) => check.id === 'worklog-summary.missing.2026-05');
  assert.equal(warning.level, 'warn');
  assert.equal(warning.category, 'freshness');
  assert.deepEqual(warning.paths, [
    '.ai-playbook/worklogs/2026-05/',
    '.ai-playbook/worklogs/summaries/2026-05.md'
  ]);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('doctor --json warns when a worklog summary is older than an entry', async () => {
  const target = await tempRepo('ai playbook-worklog-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-06-04'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  const worklog = path.join(target, '.ai-playbook', 'worklogs', '2026-06', '2026-06-04-freshness-check.md');
  const summary = path.join(target, '.ai-playbook', 'worklogs', 'summaries', '2026-06.md');
  await utimes(summary, new Date('2026-06-04T00:00:00Z'), new Date('2026-06-04T00:00:00Z'));
  await utimes(worklog, new Date('2026-06-05T00:00:00Z'), new Date('2026-06-05T00:00:00Z'));
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  const warning = report.checks.find((check) => check.id === 'worklog-summary.stale.2026-06');
  assert.equal(warning.level, 'warn');
  assert.equal(warning.category, 'freshness');
  assert.deepEqual(warning.paths, [
    '.ai-playbook/worklogs/2026-06/2026-06-04-freshness-check.md',
    '.ai-playbook/worklogs/summaries/2026-06.md'
  ]);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('doctor --json passes worklog summary freshness when the summary is newest', async () => {
  const target = await tempRepo('ai playbook-worklog-fresh-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-07-04'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-07'], capture(target)), 0);

  const worklog = path.join(target, '.ai-playbook', 'worklogs', '2026-07', '2026-07-04-freshness-check.md');
  const summary = path.join(target, '.ai-playbook', 'worklogs', 'summaries', '2026-07.md');
  await utimes(worklog, new Date('2026-07-04T00:00:00Z'), new Date('2026-07-04T00:00:00Z'));
  await utimes(summary, new Date('2026-07-05T00:00:00Z'), new Date('2026-07-05T00:00:00Z'));

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.checks.some((check) => check.id === 'worklog-summary.missing.2026-07'), false);
  assert.equal(report.checks.some((check) => check.id === 'worklog-summary.stale.2026-07'), false);
  assert.equal(report.checks.some((check) => check.id === 'worklog-summary.fresh.2026-07' && check.level === 'pass'), true);
  await cleanup(target);
});

test('doctor --reminder --json reports a small no-write reminder signal', async () => {
  const missing = await tempRepo('ai playbook-reminder-missing-');
  const missingBefore = await listRelativeFiles(missing);
  const missingCheck = capture(missing);
  assert.equal(await runCli(['doctor', '.', '--reminder', '--json'], missingCheck), 0);
  const missingReport = JSON.parse(missingCheck.out());
  assert.equal(missingReport.schemaVersion, '1');
  assert.equal(missingReport.ok, false);
  assert.equal(missingReport.reminders.length, 1);
  assert.equal(missingReport.reminders[0].id, 'reminder.playbook.missing');
  assert.equal(missingReport.reminders[0].level, 'warn');
  assert.deepEqual(missingReport.reminders[0].paths, ['.ai-playbook/']);
  assert.deepEqual(await listRelativeFiles(missing), missingBefore);
  await cleanup(missing);

  const fresh = await tempRepo('ai playbook-reminder-fresh-');
  assert.equal(await runCli(['bootstrap', '.'], capture(fresh)), 0);
  const freshBefore = await listRelativeFiles(fresh);
  const freshCheck = capture(fresh);
  assert.equal(await runCli(['doctor', '.', '--reminder', '--json'], freshCheck), 0);
  const freshReport = JSON.parse(freshCheck.out());
  assert.equal(freshReport.schemaVersion, '1');
  assert.equal(freshReport.ok, true);
  assert.deepEqual(freshReport.reminders, []);
  assert.deepEqual(await listRelativeFiles(fresh), freshBefore);
  await cleanup(fresh);
});

test('doctor --reminder --json includes stale guide and worklog freshness reminders', async () => {
  const target = await tempRepo('ai playbook-reminder-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md'), '# Local guide edit\n');
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Freshness Check', '--date', '2026-08-04'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['doctor', '.', '--reminder', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.reminders.some((reminder) => reminder.id === 'reminder.guides.stale' && reminder.level === 'warn'), true);
  assert.equal(report.reminders.some((reminder) => reminder.id === 'reminder.worklog-summary.missing.2026-08' && reminder.level === 'warn'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('guides sync restores missing guides without overwriting local guide edits', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const customGuide = path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md');
  const missingGuide = path.join(target, '.ai-playbook', 'guides', 'harness-migration.md');
  await writeFile(customGuide, '# Local guide edit\n');
  await rm(missingGuide, { force: true });

  const sync = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.'], sync), 0);
  assert.match(sync.out(), /keep guides\\runtime-harness\.md|keep guides\/runtime-harness\.md/);
  assert.match(await readFile(customGuide, 'utf8'), /Local guide edit/);
  assert.match(await readFile(missingGuide, 'utf8'), /Harness Migration/);
  await cleanup(target);
});

test('guides sync --check reports missing guides without writing files', async () => {
  const target = await tempRepo('ai playbook-guides-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  const before = await listRelativeFiles(target);

  const missingGuide = path.join(target, '.ai-playbook', 'guides', 'harness-migration.md');
  await rm(missingGuide, { force: true });

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], check), 1);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.summary.missing, 1);
  assert.equal(report.summary.stale, 0);
  const guide = report.guides.find((item) => item.path === '.ai-playbook/guides/harness-migration.md');
  assert.equal(guide.status, 'missing');
  assert.match(guide.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal('targetHash' in guide, false);
  assert.equal(existsSync(missingGuide), false);
  assert.deepEqual(await listRelativeFiles(target), before.filter((file) => file !== '.ai-playbook/guides/harness-migration.md'));
  await cleanup(target);
});

test('guides sync --check reports present and stale guides without overwriting local edits', async () => {
  const target = await tempRepo('ai playbook-guides-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const localGuide = path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md');
  await writeFile(localGuide, '# Local guide edit\n');
  const before = await listRelativeFiles(target);

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], check), 0);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.missing, 0);
  assert.equal(report.summary.stale, 1);
  assert.equal(report.guides.every((guide) => ['present', 'stale'].includes(guide.status)), true);

  const stale = report.guides.find((guide) => guide.path === '.ai-playbook/guides/runtime-harness.md');
  assert.equal(stale.status, 'stale');
  assert.match(stale.sourceHash, /^[a-f0-9]{64}$/);
  assert.match(stale.targetHash, /^[a-f0-9]{64}$/);
  assert.notEqual(stale.sourceHash, stale.targetHash);

  const present = report.guides.find((guide) => guide.status === 'present');
  assert.match(present.sourceHash, /^[a-f0-9]{64}$/);
  assert.match(present.targetHash, /^[a-f0-9]{64}$/);
  assert.equal(present.sourceHash, present.targetHash);

  assert.match(await readFile(localGuide, 'utf8'), /Local guide edit/);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('guides sync --check --diff explains stale guide differences without writing files', async () => {
  const target = await tempRepo('ai playbook-guides-diff-공백-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  const localGuide = path.join(target, '.ai-playbook', 'guides', 'runtime-harness.md');
  await writeFile(localGuide, '# Local guide edit\n\nTarget-only line\n');
  const before = await listRelativeFiles(target);

  const check = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--diff', '--json'], check), 0);
  const report = JSON.parse(check.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.summary.stale, 1);
  const stale = report.guides.find((guide) => guide.path === '.ai-playbook/guides/runtime-harness.md');
  assert.equal(stale.status, 'stale');
  assert.equal(stale.diff.firstDifferenceLine, 1);
  assert.equal(typeof stale.diff.sourceLine, 'string');
  assert.equal(stale.diff.targetLine, '# Local guide edit');
  assert.equal(stale.diff.sourceLineCount > 0, true);
  assert.equal(stale.diff.targetLineCount, 3);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('context --json builds compact hook context without root AGENTS', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  await writeFile(path.join(target, '.ai-playbook', 'START_HERE.md'), '# Start\n\nStart signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nCurrent signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'SKILLS.md'), '# Skills\n\nSkill signal\n');
  await writeFile(path.join(target, '.ai-playbook', 'GIT.md'), '# Git\n\nGit signal\n');
  await writeFile(path.join(target, 'AGENTS.md'), '# Root\n\nRoot agent marker\n');

  const context = capture(target);
  assert.equal(await runCli(['context', '.', '--json', '--max-chars', '5000'], context), 0);
  const report = JSON.parse(context.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.deepEqual(report.sources.map((source) => source.path), [
    '.ai-playbook/START_HERE.md',
    '.ai-playbook/CURRENT.md',
    '.ai-playbook/SKILLS.md',
    '.ai-playbook/GIT.md'
  ]);
  assert.match(report.additionalContext, /Start signal/);
  assert.match(report.additionalContext, /Current signal/);
  assert.match(report.additionalContext, /Skill signal/);
  assert.match(report.additionalContext, /Git signal/);
  assert.doesNotMatch(report.additionalContext, /Root agent marker/);
  await cleanup(target);
});

test('adapter check reports readiness for Codex and Claude Code without writing files', async () => {
  const target = await tempRepo('ai playbook-테스트-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter readiness signal\n');
  const before = await listRelativeFiles(target);

  for (const adapter of ['codex', 'claude-code']) {
    const io = capture(target);
    assert.equal(await runCli(['adapter', 'check', '.', '--adapter', adapter, '--json', '--max-chars', '5000'], io), 0);
    const report = JSON.parse(io.out());
    assert.equal(report.schemaVersion, '1');
    assert.equal(report.ok, true);
    assert.equal(report.adapter, adapter);
    assert.equal(report.summary.fail, 0);
    assert.equal(report.checks.some((check) => check.id === 'context.non-empty' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.session-start.json' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.post-compact.json' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.unsupported-event-silent' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.stop-silent-by-default' && check.level === 'pass'), true);
    assert.equal(report.checks.some((check) => check.id === 'hook.missing-playbook-silent' && check.level === 'pass'), true);
  }

  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('adapter config --json renders local hook config without writing files', async () => {
  const target = await tempRepo('adapter config-공백-한글-');
  const before = await listRelativeFiles(target);

  for (const adapter of ['codex', 'claude-code']) {
    const io = capture(target);
    assert.equal(await runCli(['adapter', 'config', '.', '--adapter', adapter, '--json'], io), 0);
    const report = JSON.parse(io.out());
    assert.equal(report.schemaVersion, '1');
    assert.equal(report.ok, true);
    assert.equal(report.target, target);
    assert.equal(report.adapter, adapter);
    assert.match(report.hookCommand, /^node ".+"$/);
    assert.doesNotMatch(report.hookCommand, /<path-to-ai-agent-playbook>/);
    assert.doesNotMatch(JSON.stringify(report.config), /<path-to-ai-agent-playbook>/);
    assert.match(report.hookCommand, new RegExp(adapter === 'codex' ? 'adapters[/\\\\]codex[/\\\\]hook\\.mjs' : 'adapters[/\\\\]claude-code[/\\\\]hook\\.mjs'));
    assert.equal(report.config.hooks.SessionStart[0].hooks[0].command, report.hookCommand);
    assert.equal(report.config.hooks.PostCompact[0].hooks[0].command, report.hookCommand);
    assert.equal(report.mcp.command, 'npx');
    assert.deepEqual(report.mcp.args, ['ai-agent-playbook', 'mcp']);
    assert.equal(report.mcp.config.mcpServers['ai-playbook'].command, 'npx');
    assert.deepEqual(report.mcp.config.mcpServers['ai-playbook'].args, ['ai-agent-playbook', 'mcp']);
    assert.equal(report.mcp.globalCommand.command, 'ai-playbook');
    assert.deepEqual(report.mcp.globalCommand.args, ['mcp']);
    assert.doesNotMatch(JSON.stringify(report.mcp), /<path-to-ai-agent-playbook>/);
    assert.equal(report.warnings.some((warning) => warning.id === 'config.playbook.missing'), true);
  }

  assert.deepEqual(await listRelativeFiles(target), before);

  const unsupported = capture(target);
  assert.equal(await runCli(['adapter', 'config', '.', '--adapter', 'unknown', '--json'], unsupported), 1);
  assert.match(unsupported.err(), /Unsupported adapter: unknown/);
  await cleanup(target);

  const legacyTarget = await tempRepo('adapter config legacy-한글-');
  await mkdir(path.join(legacyTarget, 'ai-playbook'));
  const beforeLegacy = await listRelativeFiles(legacyTarget);
  const legacy = capture(legacyTarget);
  assert.equal(await runCli(['adapter', 'config', '.', '--adapter', 'codex', '--json'], legacy), 0);
  const legacyReport = JSON.parse(legacy.out());
  assert.equal(legacyReport.warnings.some((warning) => warning.id === 'config.playbook.missing'), true);
  assert.deepEqual(await listRelativeFiles(legacyTarget), beforeLegacy);
  await cleanup(legacyTarget);
});

test('adapter check --settings validates rendered settings without writing files', async () => {
  const target = await tempRepo('adapter settings-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter settings signal\n');

  const configIo = capture(target);
  assert.equal(await runCli(['adapter', 'config', '.', '--adapter', 'codex', '--json'], configIo), 0);
  const config = JSON.parse(configIo.out()).config;
  const settingsPath = path.join(target, 'local settings-한글.json');
  await writeFile(settingsPath, `${JSON.stringify(config, null, 2)}\n`);
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', settingsPath, '--json', '--max-chars', '5000'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.summary.fail, 0);
  assert.equal(report.checks.some((check) => check.id === 'settings.file' && check.level === 'pass'), true);
  assert.equal(report.checks.some((check) => check.id === 'settings.json' && check.level === 'pass'), true);
  assert.equal(report.checks.some((check) => check.id === 'settings.hook.session-start.command' && check.level === 'pass'), true);
  assert.equal(report.checks.some((check) => check.id === 'settings.hook.post-compact.command' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('adapter check --settings reports missing, malformed, and mismatched settings without writing files', async () => {
  const target = await tempRepo('adapter bad settings-한글-');
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAdapter settings signal\n');

  const missingPath = path.join(target, 'missing settings.json');
  const beforeMissing = await listRelativeFiles(target);
  const missing = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', missingPath, '--json'], missing), 1);
  const missingReport = JSON.parse(missing.out());
  assert.equal(missingReport.checks.some((check) => check.id === 'settings.file' && check.level === 'fail'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeMissing);

  const malformedPath = path.join(target, 'malformed settings.json');
  await writeFile(malformedPath, '{ not json');
  const beforeMalformed = await listRelativeFiles(target);
  const malformed = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', malformedPath, '--json'], malformed), 1);
  const malformedReport = JSON.parse(malformed.out());
  assert.equal(malformedReport.checks.some((check) => check.id === 'settings.json' && check.level === 'fail'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeMalformed);

  const mismatchPath = path.join(target, 'mismatch settings.json');
  const mismatchConfig = {
    hooks: {
      SessionStart: [{ hooks: [{ type: 'command', command: 'node "C:\\other\\hook.mjs"', timeout: 5 }] }],
      PostCompact: [{ matcher: 'manual|auto', hooks: [{ type: 'command', command: 'node "C:\\other\\hook.mjs"', timeout: 5 }] }]
    }
  };
  await writeFile(mismatchPath, `${JSON.stringify(mismatchConfig, null, 2)}\n`);
  const beforeMismatch = await listRelativeFiles(target);
  const mismatch = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--settings', mismatchPath, '--json'], mismatch), 1);
  const mismatchReport = JSON.parse(mismatch.out());
  assert.equal(mismatchReport.checks.some((check) => check.id === 'settings.hook.session-start.command' && check.level === 'fail'), true);
  assert.equal(mismatchReport.checks.some((check) => check.id === 'settings.hook.post-compact.command' && check.level === 'fail'), true);
  assert.deepEqual(await listRelativeFiles(target), beforeMismatch);
  await cleanup(target);
});

test('adapter check reports missing playbook and rejects unsupported adapters', async () => {
  const target = await tempRepo('ai playbook-누락-');
  const before = await listRelativeFiles(target);

  const missing = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'codex', '--json'], missing), 1);
  const report = JSON.parse(missing.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.summary.fail > 0, true);
  assert.equal(report.checks.some((check) => check.id === 'playbook.directory' && check.level === 'fail'), true);
  assert.equal(report.checks.some((check) => check.id === 'context.non-empty' && check.level === 'fail'), true);
  assert.equal(report.checks.some((check) => check.id === 'hook.missing-playbook-silent' && check.level === 'pass'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const unsupported = capture(target);
  assert.equal(await runCli(['adapter', 'check', '.', '--adapter', 'unknown'], unsupported), 1);
  assert.match(unsupported.err(), /Unsupported adapter: unknown/);
  await cleanup(target);
});

test('plan and worklog scaffold commands create dated files', async () => {
  const target = await tempRepo();
  assert.equal(await runCli(['bootstrap', '.'], capture(target)), 0);

  assert.equal(await runCli(['plan', 'new', '.', '--title', 'Runtime Harness', '--date', '2026-06-07'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'new', '.', '--title', 'Runtime Harness', '--date', '2026-06-07'], capture(target)), 0);
  assert.equal(await runCli(['worklog', 'summarize', '.', '--month', '2026-06'], capture(target)), 0);

  await stat(path.join(target, '.ai-playbook', 'plans', '2026-06-07-runtime-harness.md'));
  await stat(path.join(target, '.ai-playbook', 'worklogs', '2026-06', '2026-06-07-runtime-harness.md'));
  await stat(path.join(target, '.ai-playbook', 'worklogs', 'summaries', '2026-06.md'));
  await cleanup(target);
});

test('migrate path previews legacy ai-playbook migration without writing files', async () => {
  const target = await tempRepo('migrate path preview-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy migration signal');
  await writeFile(path.join(target, '.gitignore'), 'docs/plans/\nai-playbook/\n');
  await writeFile(path.join(target, 'AGENTS.md'), [
    '# Root',
    '',
    'Read ai-playbook/START_HERE.md and ai-playbook/CURRENT.md.'
  ].join('\n'));
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--json'], preview), 0);
  const report = JSON.parse(preview.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.applied, false);
  assert.equal(report.summary.operations > 0, true);
  assert.equal(report.operations.some((operation) => operation.id === 'playbook.move'), true);
  assert.equal(report.operations.some((operation) => operation.id === 'gitignore.add-dot-playbook'), true);
  assert.equal(report.operations.some((operation) => operation.id === 'references.update'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), false);
  await cleanup(target);
});

test('migrate path applies legacy ai-playbook migration and updates references', async () => {
  const target = await tempRepo('migrate path apply-공백-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy migration signal');
  await writeFile(path.join(target, '.gitignore'), 'docs/plans/\nai-playbook/\n');
  await writeFile(path.join(target, 'AGENTS.md'), [
    '# Root',
    '',
    'Read ai-playbook/START_HERE.md, ai-playbook/CURRENT.md, ai-playbook/SKILLS.md, and ai-playbook/GIT.md.'
  ].join('\n'));

  const applied = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.ok, true);
  assert.equal(report.applied, true);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /\.ai-playbook\/START_HERE\.md/);
  assert.doesNotMatch(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /(?<!\.)ai-playbook\//);
  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.ai-playbook\/$/m);
  assert.match(gitignore, /^ai-playbook\/$/m);

  const doctor = capture(target);
  assert.equal(await runCli(['doctor', '.', '--json'], doctor), 0);
  const doctorReport = JSON.parse(doctor.out());
  assert.equal(doctorReport.checks.some((check) => check.id === 'playbook.directory' && check.paths.includes('.ai-playbook/')), true);
  await cleanup(target);
});

test('migrate path preserves committed playbook policy when legacy path is not ignored', async () => {
  const target = await tempRepo('migrate path tracked-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Tracked migration signal');
  await writeFile(path.join(target, '.gitignore'), 'dist/\n');

  const preview = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.operations.some((operation) => operation.id === 'gitignore.add-dot-playbook'), false);

  const applied = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--apply', '--json'], applied), 0);
  const gitignore = await readFile(path.join(target, '.gitignore'), 'utf8');
  assert.doesNotMatch(gitignore, /^\.ai-playbook\/$/m);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  await cleanup(target);
});

test('migrate path cleans legacy references when dot playbook already exists', async () => {
  const target = await tempRepo('migrate path dot cleanup-한글-');
  await writePlaybookFixture(target, '.ai-playbook', 'Dot migration signal');
  await writeFile(path.join(target, 'AGENTS.md'), 'Read ai-playbook/START_HERE.md before work.\n');

  const applied = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.ok, true);
  assert.equal(report.applied, true);
  assert.equal(report.warnings.some((warning) => warning.id === 'playbook.already-dot-path'), true);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /\.ai-playbook\/START_HERE\.md/);
  assert.equal(existsSync(path.join(target, 'ai-playbook')), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook')), true);
  await cleanup(target);
});

test('migrate path reports conflicts when both playbook paths exist without writing files', async () => {
  const target = await tempRepo('migrate path conflict-한글-');
  await writePlaybookFixture(target, 'ai-playbook', 'Legacy migration signal');
  await writePlaybookFixture(target, '.ai-playbook', 'Dot migration signal');
  const before = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['migrate', 'path', '.', '--json'], checked), 1);
  const report = JSON.parse(checked.out());
  assert.equal(report.ok, false);
  assert.equal(report.conflicts.some((conflict) => conflict.id === 'playbook.destination-exists'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('bootstrap writes a managed manifest and managed check validates it', async () => {
  const dryRunTarget = await tempRepo('managed dryrun-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only', '--dry-run'], capture(dryRunTarget)), 0);
  assert.equal(existsSync(path.join(dryRunTarget, '.ai-playbook', '.ai-agent-playbook-install.json')), false);
  await cleanup(dryRunTarget);

  const target = await tempRepo('managed bootstrap-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const manifestPath = path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json');
  assert.equal(existsSync(manifestPath), true);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  assert.equal(manifest.schemaVersion, '1');
  assert.equal(manifest.source, 'ai-agent-playbook');
  assert.equal(manifest.playbookDir, '.ai-playbook');
  assert.equal(manifest.localOnly, true);
  assert.equal(manifest.files.some((file) => file.path === 'AGENTS.md'), true);
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/CURRENT.md'), true);
  assert.equal(manifest.files.some((file) => file.path === '.gitignore'), false);
  assert.equal(manifest.files.every((file) => !path.isAbsolute(file.path)), true);

  const checked = capture(target);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], checked), 0);
  const report = JSON.parse(checked.out());
  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, true);
  assert.equal(report.manifestPath, '.ai-playbook/.ai-agent-playbook-install.json');
  assert.equal(report.summary.present, manifest.files.length);
  assert.equal(report.summary.modified, 0);
  assert.equal(report.summary.missing, 0);
  await cleanup(target);
});

test('managed check reports missing, modified, and malformed manifest states without writing files', async () => {
  const missing = await tempRepo('managed missing-한글-');
  const missingBefore = await listRelativeFiles(missing);
  const missingCheck = capture(missing);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], missingCheck), 1);
  const missingReport = JSON.parse(missingCheck.out());
  assert.equal(missingReport.ok, false);
  assert.equal(missingReport.conflicts.some((conflict) => conflict.id === 'managed.manifest.missing'), true);
  assert.deepEqual(await listRelativeFiles(missing), missingBefore);
  await cleanup(missing);

  const malformed = await tempRepo('managed malformed-공백-');
  await mkdir(path.join(malformed, '.ai-playbook'), { recursive: true });
  await writeFile(path.join(malformed, '.ai-playbook', '.ai-agent-playbook-install.json'), '{not-json');
  const malformedBefore = await listRelativeFiles(malformed);
  const malformedCheck = capture(malformed);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], malformedCheck), 1);
  const malformedReport = JSON.parse(malformedCheck.out());
  assert.equal(malformedReport.ok, false);
  assert.equal(malformedReport.conflicts.some((conflict) => conflict.id === 'managed.manifest.malformed'), true);
  assert.deepEqual(await listRelativeFiles(malformed), malformedBefore);
  await cleanup(malformed);

  const modified = await tempRepo('managed modified-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(modified)), 0);
  await writeFile(path.join(modified, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited local project facts.\n');
  await rm(path.join(modified, '.ai-playbook', 'GIT.md'));
  const modifiedBefore = await listRelativeFiles(modified);
  const modifiedCheck = capture(modified);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], modifiedCheck), 1);
  const modifiedReport = JSON.parse(modifiedCheck.out());
  assert.equal(modifiedReport.ok, false);
  assert.equal(modifiedReport.summary.modified, 1);
  assert.equal(modifiedReport.summary.missing, 1);
  assert.equal(modifiedReport.files.some((file) => file.path === '.ai-playbook/CURRENT.md' && file.status === 'modified'), true);
  assert.equal(modifiedReport.files.some((file) => file.path === '.ai-playbook/GIT.md' && file.status === 'missing'), true);
  assert.deepEqual(await listRelativeFiles(modified), modifiedBefore);
  await cleanup(modified);
});

test('guides sync updates managed manifest and check mode stays read-only', async () => {
  const target = await tempRepo('managed guides-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await rm(path.join(target, '.ai-playbook', 'guides', 'harness-migration.md'));
  const beforeCheck = await listRelativeFiles(target);

  const checked = capture(target);
  assert.equal(await runCli(['guides', 'sync', '.', '--check', '--json'], checked), 1);
  assert.deepEqual(await listRelativeFiles(target), beforeCheck);

  assert.equal(await runCli(['guides', 'sync', '.'], capture(target)), 0);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));
  const guideEntry = manifest.files.find((file) => file.path === '.ai-playbook/guides/harness-migration.md');
  assert.equal(guideEntry.kind, 'guide');
  assert.match(guideEntry.sourceHash, /^[a-f0-9]{64}$/);
  assert.match(guideEntry.targetHash, /^[a-f0-9]{64}$/);
  await cleanup(target);
});

test('managed adopt previews and records matching existing playbook files only when applied', async () => {
  const target = await tempRepo('managed adopt-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await rm(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'));
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nAlready adapted.\n');
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['managed', 'adopt', '.', '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.operations.some((operation) => operation.action === 'write-manifest'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['managed', 'adopt', '.', '--apply', '--json'], applied), 0);
  const report = JSON.parse(applied.out());
  assert.equal(report.applied, true);
  assert.equal(report.summary.adopted > 0, true);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/SKILLS.md'), true);
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/CURRENT.md'), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  await cleanup(target);
});

test('managed uninstall previews removals and preserves modified managed files when applied', async () => {
  const target = await tempRepo('managed uninstall-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited facts to keep.\n');
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['managed', 'uninstall', '.', '--json'], preview), 1);
  const previewReport = JSON.parse(preview.out());
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.conflicts.some((conflict) => conflict.id === 'managed.file.modified'), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['managed', 'uninstall', '.', '--apply', '--json'], applied), 1);
  const report = JSON.parse(applied.out());
  assert.equal(report.applied, true);
  assert.equal(existsSync(path.join(target, 'AGENTS.md')), false);
  assert.equal(existsSync(path.join(target, '.ai-playbook', 'CURRENT.md')), true);
  assert.equal(existsSync(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json')), true);
  assert.equal(report.warnings.some((warning) => warning.id === 'managed.gitignore.manual-cleanup'), true);
  await cleanup(target);
});

test('managed catalog reports kind and status summaries without writing files', async () => {
  const target = await tempRepo('managed catalog-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited facts to keep.\n');
  await rm(path.join(target, '.ai-playbook', 'GIT.md'));
  const before = await listRelativeFiles(target);

  const catalog = capture(target);
  assert.equal(await runCli(['managed', 'catalog', '.', '--json'], catalog), 1);
  const report = JSON.parse(catalog.out());

  assert.equal(report.schemaVersion, '1');
  assert.equal(report.ok, false);
  assert.equal(report.target, target);
  assert.equal(report.manifestPath, '.ai-playbook/.ai-agent-playbook-install.json');
  assert.equal(report.manifest.playbookDir, '.ai-playbook');
  assert.equal(report.summary.total > 0, true);
  assert.equal(report.summary.byKind.playbook > 0, true);
  assert.equal(report.summary.byKind.guide > 0, true);
  assert.equal(report.summary.byKind.bootstrap, 1);
  assert.equal(report.summary.byStatus.modified >= 1, true);
  assert.equal(report.summary.byStatus.missing >= 1, true);
  assert.equal(report.files.some((file) => file.path === '.ai-playbook/CURRENT.md' && file.status === 'modified'), true);
  assert.equal(report.files.some((file) => file.path === '.ai-playbook/GIT.md' && file.status === 'missing'), true);
  assert.deepEqual(await listRelativeFiles(target), before);
  await cleanup(target);
});

test('managed prune previews and removes only a selected unchanged managed file', async () => {
  const target = await tempRepo('managed prune-공백-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  const selected = '.ai-playbook/guides/runtime-harness.md';
  const windowsStyleSelected = '.ai-playbook\\guides\\runtime-harness.md';
  const before = await listRelativeFiles(target);

  const preview = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', windowsStyleSelected, '--json'], preview), 0);
  const previewReport = JSON.parse(preview.out());

  assert.equal(previewReport.schemaVersion, '1');
  assert.equal(previewReport.ok, true);
  assert.equal(previewReport.applied, false);
  assert.equal(previewReport.summary.selected, 1);
  assert.equal(previewReport.summary.removable, 1);
  assert.equal(previewReport.operations.some((operation) => operation.id === 'managed.prune.remove-file' && operation.paths.includes(selected)), true);
  assert.deepEqual(await listRelativeFiles(target), before);

  const applied = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', selected, '--apply', '--json'], applied), 0);
  const appliedReport = JSON.parse(applied.out());
  const after = await listRelativeFiles(target);
  const manifest = JSON.parse(await readFile(path.join(target, '.ai-playbook', '.ai-agent-playbook-install.json'), 'utf8'));

  assert.equal(appliedReport.applied, true);
  assert.equal(after.includes(selected), false);
  assert.equal(after.includes('.ai-playbook/CURRENT.md'), true);
  assert.equal(manifest.files.some((file) => file.path === selected), false);
  assert.equal(manifest.files.some((file) => file.path === '.ai-playbook/CURRENT.md'), true);
  await cleanup(target);
});

test('managed prune refuses unmanaged modified missing and absolute paths without writing files', async () => {
  const target = await tempRepo('managed prune conflict-한글-');
  assert.equal(await runCli(['bootstrap', '.', '--local-only'], capture(target)), 0);
  await writeFile(path.join(target, '.ai-playbook', 'CURRENT.md'), '# Current\n\nEdited facts to keep.\n');
  await rm(path.join(target, '.ai-playbook', 'GIT.md'));

  const modifiedBefore = await listRelativeFiles(target);
  const modified = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', '.ai-playbook/CURRENT.md', '--json'], modified), 1);
  const modifiedReport = JSON.parse(modified.out());
  assert.equal(modifiedReport.conflicts.some((conflict) => conflict.id === 'managed.prune.file-modified'), true);
  assert.deepEqual(await listRelativeFiles(target), modifiedBefore);

  const missingBefore = await listRelativeFiles(target);
  const missing = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', '.ai-playbook/GIT.md', '--json'], missing), 1);
  const missingReport = JSON.parse(missing.out());
  assert.equal(missingReport.conflicts.some((conflict) => conflict.id === 'managed.prune.file-missing'), true);
  assert.deepEqual(await listRelativeFiles(target), missingBefore);

  const unmanagedBefore = await listRelativeFiles(target);
  const unmanaged = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', '.ai-playbook/not-managed.md', '--json'], unmanaged), 1);
  const unmanagedReport = JSON.parse(unmanaged.out());
  assert.equal(unmanagedReport.conflicts.some((conflict) => conflict.id === 'managed.prune.file-unmanaged'), true);
  assert.deepEqual(await listRelativeFiles(target), unmanagedBefore);

  const absoluteBefore = await listRelativeFiles(target);
  const absolute = capture(target);
  assert.equal(await runCli(['managed', 'prune', '.', '--path', path.join(target, '.ai-playbook', 'README.md'), '--json'], absolute), 1);
  const absoluteReport = JSON.parse(absolute.out());
  assert.equal(absoluteReport.conflicts.some((conflict) => conflict.id === 'managed.prune.path-invalid'), true);
  assert.deepEqual(await listRelativeFiles(target), absoluteBefore);
  await cleanup(target);
});

test('managed manifest rejects parent traversal paths before removal', async () => {
  const root = await tempRepo('managed traversal-공백-한글-');
  const target = path.join(root, 'target');
  const playbook = path.join(target, '.ai-playbook');
  await mkdir(playbook, { recursive: true });
  const victim = path.join(root, 'victim.txt');
  const victimContent = 'do not remove outside target\n';
  await writeFile(victim, victimContent);
  await writeFile(path.join(playbook, '.ai-agent-playbook-install.json'), JSON.stringify({
    schemaVersion: '1',
    source: 'ai-agent-playbook',
    playbookDir: '.ai-playbook',
    localOnly: true,
    installedAtUtc: '2026-06-13T00:00:00.000Z',
    updatedAtUtc: '2026-06-13T00:00:00.000Z',
    files: [
      {
        path: '../victim.txt',
        kind: 'playbook',
        source: 'templates/project-playbook/victim.txt',
        sourceHash: hashText(victimContent),
        targetHash: hashText(victimContent)
      }
    ]
  }, null, 2));

  const checked = capture(target);
  assert.equal(await runCli(['managed', 'check', '.', '--json'], checked), 1);
  const checkedReport = JSON.parse(checked.out());
  assert.equal(checkedReport.conflicts.some((conflict) => conflict.id === 'managed.manifest.invalid'), true);

  const removed = capture(target);
  assert.equal(await runCli(['managed', 'uninstall', '.', '--apply', '--json'], removed), 1);
  const removedReport = JSON.parse(removed.out());
  assert.equal(removedReport.conflicts.some((conflict) => conflict.id === 'managed.manifest.invalid'), true);
  assert.equal(existsSync(victim), true);
  await cleanup(root);
});

function capture(cwd) {
  let stdout = '';
  let stderr = '';
  return {
    cwd,
    repoRoot,
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    out: () => stdout,
    err: () => stderr
  };
}

async function tempRepo(prefix = '.ai-playbook-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function writePlaybookFixture(target, dirName, currentSignal) {
  const files = {
    'README.md': '# Playbook\n',
    'START_HERE.md': '# Start\n\nStart fixture\n',
    'CURRENT.md': `# Current\n\n${currentSignal}\n`,
    'SKILLS.md': '# Skills\n\nSkill fixture\n',
    'GIT.md': '# Git\n\nGit fixture\n',
    'questions.md': '# Questions\n\n| Status | Question | Decision | Owner | Date |\n| --- | --- | --- | --- | --- |\n',
    'maps/README.md': '# Maps\n',
    'runbooks/README.md': '# Runbooks\n',
    'plans/README.md': '# Plans\n',
    'worklogs/README.md': '# Worklogs\n',
    'worklogs/summaries/README.md': '# Summaries\n'
  };
  for (const [file, content] of Object.entries(files)) {
    const destination = path.join(target, dirName, ...file.split('/'));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
}

async function listRelativeFiles(root) {
  const files = [];
  await walk(root, '');
  files.sort();
  return files;

  async function walk(current, rel) {
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
