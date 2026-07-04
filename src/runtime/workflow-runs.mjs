import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  todayIso
} from '../harness/core.mjs';

const RECIPE_DIR = 'workflows/recipes';
const BUNDLED_RECIPE_DIR = 'templates/project-playbook/workflows/recipes';
const SECTION_KEYS = new Map([
  ['inputs', 'inputs'],
  ['outputs', 'outputs'],
  ['skills', 'skills'],
  ['tools', 'tools'],
  ['stop conditions', 'stopConditions'],
  ['stop condition', 'stopConditions'],
  ['verification', 'verification']
]);

export async function previewWorkflowRun({ repoRoot, target, recipeId }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const normalizedRecipeId = normalizeRecipeId(recipeId);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const recipe = await readRecipe({
    repoRoot,
    target: resolvedTarget,
    playbook,
    recipeId: normalizedRecipeId
  });

  if (!recipe) {
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: 'runtime.workflow-run-preview',
      ok: false,
      target: resolvedTarget,
      mode: { localOnly: true, network: false, writes: false },
      generatedAt: new Date().toISOString(),
      recipe: {
        id: normalizedRecipeId,
        title: null,
        source: null,
        path: null
      },
      summary: {
        inputs: 0,
        outputs: 0,
        skills: 0,
        tools: 0,
        stopConditions: 0,
        verification: 0,
        warnings: 0,
        conflicts: 1
      },
      manifest: null,
      warnings: [],
      conflicts: [{
        id: 'workflow-run.recipe-missing',
        message: `Workflow recipe not found: ${normalizedRecipeId}.`,
        paths: [
          `${playbook.dir}/${RECIPE_DIR}/${normalizedRecipeId}.md`,
          `${BUNDLED_RECIPE_DIR}/${normalizedRecipeId}.md`
        ]
      }]
    };
  }

  const manifest = parseRecipeMarkdown(recipe.text);
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.workflow-run-preview',
    ok: true,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: false },
    generatedAt: new Date().toISOString(),
    recipe: {
      id: normalizedRecipeId,
      title: manifest.title,
      source: recipe.source,
      path: recipe.relativePath
    },
    summary: summarizeManifest(manifest, recipe.warnings),
    manifest,
    warnings: recipe.warnings,
    conflicts: []
  };
}

export async function startWorkflowRun({ repoRoot, target, recipeId, apply = false }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const normalizedRecipeId = normalizeRecipeId(recipeId);
  const preview = await previewWorkflowRun({ repoRoot, target: resolvedTarget, recipeId: normalizedRecipeId });
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const generatedAt = new Date().toISOString();
  const warnings = [...preview.warnings];
  const conflicts = [...preview.conflicts];

  if (!existsSync(playbook.root)) {
    conflicts.push({
      id: 'workflow-run-start.playbook-missing',
      message: `Missing ${playbook.dir}/. Bootstrap or migrate the playbook before starting a workflow run.`,
      paths: [`${playbook.dir}/`]
    });
  }

  if (preview.ok && !manifestComplete(preview.manifest)) {
    conflicts.push({
      id: 'workflow-run-start.manifest-incomplete',
      message: `Workflow recipe ${normalizedRecipeId} is missing required run manifest sections.`,
      paths: [preview.recipe.path].filter(Boolean)
    });
  }

  const planned = preview.ok && conflicts.length === 0
    ? buildRunStartPlan({
      target: resolvedTarget,
      playbook,
      recipeId: normalizedRecipeId,
      preview,
      generatedAt
    })
    : { runId: null, runPath: null, files: [], operations: [] };

  const result = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'runtime.workflow-run-start',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    mode: { localOnly: true, network: false, writes: Boolean(apply) },
    generatedAt,
    applied: false,
    recipe: preview.recipe,
    runId: planned.runId,
    runPath: planned.runPath,
    summary: {
      operations: planned.operations.length,
      files: planned.files.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations: planned.operations,
    warnings,
    conflicts
  };

  if (!result.ok || !apply) return result;

  const writeConflict = firstUnsafeDestination({ target: resolvedTarget, playbook, files: planned.files });
  if (writeConflict) {
    result.ok = false;
    result.mode.writes = false;
    result.summary.conflicts += 1;
    result.conflicts.push(writeConflict);
    return result;
  }

  for (const file of planned.files) {
    if (existsSync(file.fullPath)) {
      result.ok = false;
      result.mode.writes = false;
      result.summary.conflicts += 1;
      result.conflicts.push({
        id: 'workflow-run-start.file-exists',
        message: `Refusing to overwrite existing run file ${file.relativePath}.`,
        paths: [file.relativePath]
      });
      return result;
    }
  }

  for (const file of planned.files) {
    await mkdir(path.dirname(file.fullPath), { recursive: true });
    await writeFile(file.fullPath, file.content);
  }

  return {
    ...result,
    applied: true
  };
}

async function readRecipe({ repoRoot, target, playbook, recipeId }) {
  const targetRelative = `${playbook.dir}/${RECIPE_DIR}/${recipeId}.md`;
  const targetFile = path.join(playbook.root, ...RECIPE_DIR.split('/'), `${recipeId}.md`);
  if (existsSync(targetFile)) {
    return {
      source: 'target',
      relativePath: targetRelative,
      text: await readFile(targetFile, 'utf8'),
      warnings: []
    };
  }

  const bundledRelative = `${BUNDLED_RECIPE_DIR}/${recipeId}.md`;
  const bundledFile = path.join(repoRoot, ...BUNDLED_RECIPE_DIR.split('/'), `${recipeId}.md`);
  if (existsSync(bundledFile)) {
    return {
      source: 'bundled',
      relativePath: bundledRelative,
      text: await readFile(bundledFile, 'utf8'),
      warnings: [{
        id: 'workflow-run.recipe-bundled-fallback',
        message: `Using bundled workflow recipe because target recipe is missing: ${targetRelative}.`,
        paths: [targetRelative, bundledRelative]
      }]
    };
  }

  return null;
}

function buildRunStartPlan({ target, playbook, recipeId, preview, generatedAt }) {
  const runId = chooseRunId({ playbook, recipeId, generatedAt });
  const runPath = `${playbook.dir}/workflows/runs/${runId}`;
  const runRoot = path.join(playbook.root, 'workflows', 'runs', runId);
  const runManifest = {
    schemaVersion: SCHEMA_VERSION,
    kind: 'workflow.run',
    runId,
    status: 'active',
    target,
    recipe: preview.recipe,
    startedAt: generatedAt,
    manifest: preview.manifest,
    evidence: {
      generated: true,
      promotedToMemory: false
    }
  };
  const files = [
    {
      relativePath: `${runPath}/manifest.json`,
      fullPath: path.join(runRoot, 'manifest.json'),
      content: `${JSON.stringify(runManifest, null, 2)}\n`
    },
    {
      relativePath: `${runPath}/criteria.md`,
      fullPath: path.join(runRoot, 'criteria.md'),
      content: buildCriteriaMarkdown(preview)
    },
    {
      relativePath: `${runPath}/evidence.md`,
      fullPath: path.join(runRoot, 'evidence.md'),
      content: buildEvidenceMarkdown(preview)
    },
    {
      relativePath: `${runPath}/handoff.md`,
      fullPath: path.join(runRoot, 'handoff.md'),
      content: buildHandoffMarkdown(preview)
    }
  ];
  return {
    runId,
    runPath,
    files,
    operations: files.map((file) => ({
      id: 'workflow-run-start.write-file',
      action: 'write',
      path: file.relativePath,
      message: `Write ${file.relativePath}.`
    }))
  };
}

function chooseRunId({ playbook, recipeId, generatedAt }) {
  const stamp = generatedAt
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-')
    .toLowerCase();
  const base = `${todayIso()}-${recipeId}-${stamp}`;
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const candidatePath = path.join(playbook.root, 'workflows', 'runs', candidate);
    if (!existsSync(candidatePath)) return candidate;
  }
  return `${base}-${process.pid}`;
}

function manifestComplete(manifest) {
  return Boolean(
    manifest &&
    manifest.inputs.length &&
    manifest.outputs.length &&
    manifest.skills.length &&
    manifest.tools.length &&
    manifest.stopConditions.length &&
    manifest.verification.length
  );
}

function firstUnsafeDestination({ target, playbook, files }) {
  const runsRoot = path.resolve(target, playbook.dir, 'workflows', 'runs');
  for (const file of files) {
    const resolved = path.resolve(file.fullPath);
    const relative = path.relative(runsRoot, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return {
        id: 'workflow-run-start.unsafe-destination',
        message: `Refusing to write outside ${playbook.dir}/workflows/runs/.`,
        paths: [file.relativePath]
      };
    }
  }
  return null;
}

function buildCriteriaMarkdown(preview) {
  return [
    `# ${preview.recipe.title} Criteria`,
    '',
    '## Verification',
    ...preview.manifest.verification.map((item) => `- [ ] ${item}`),
    '',
    '## Stop Conditions',
    ...preview.manifest.stopConditions.map((item) => `- [ ] ${item}`),
    ''
  ].join('\n');
}

function buildEvidenceMarkdown(preview) {
  return [
    `# ${preview.recipe.title} Evidence`,
    '',
    'Generated runtime evidence belongs here while the run is active.',
    '',
    '## Required Tools',
    ...preview.manifest.tools.map((item) => `- [ ] ${item}`),
    '',
    '## Notes',
    '',
    '- No evidence recorded yet.',
    ''
  ].join('\n');
}

function buildHandoffMarkdown(preview) {
  return [
    `# ${preview.recipe.title} Handoff`,
    '',
    '## Outcome',
    '',
    '- Pending.',
    '',
    '## Durable Memory Promotion',
    '',
    '- No facts promoted. Review before moving anything into memory, contracts, maps, decisions, or runbooks.',
    '',
    '## Remaining Risk',
    '',
    '- Pending.',
    ''
  ].join('\n');
}

function parseRecipeMarkdown(text) {
  const manifest = {
    title: extractTitle(text),
    inputs: [],
    outputs: [],
    skills: [],
    tools: [],
    stopConditions: [],
    verification: []
  };
  let currentKey = null;

  for (const rawLine of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^#{2,6}\s+(.+)$/);
    if (heading) {
      currentKey = sectionKeyFor(heading[1]);
      continue;
    }

    const inline = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.*)$/);
    if (inline) {
      currentKey = sectionKeyFor(inline[1]);
      if (currentKey && inline[2]) addItems(manifest[currentKey], inline[2]);
      continue;
    }

    if (!currentKey) continue;
    const listItem = line.match(/^[-*]\s+(.+)$/);
    addItems(manifest[currentKey], listItem?.[1] ?? line);
  }

  return manifest;
}

function extractTitle(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? 'Workflow Run';
}

function sectionKeyFor(value) {
  return SECTION_KEYS.get(String(value).trim().toLowerCase()) ?? null;
}

function addItems(target, value) {
  for (const item of splitItems(value)) {
    if (!target.includes(item)) target.push(item);
  }
}

function splitItems(value) {
  return String(value)
    .split(/[,;]\s+/)
    .map(cleanItem)
    .filter(Boolean);
}

function cleanItem(value) {
  return normalizePortablePath(String(value))
    .replace(/[.;]$/g, '')
    .replace(/^`|`$/g, '')
    .trim();
}

function summarizeManifest(manifest, warnings) {
  return {
    inputs: manifest.inputs.length,
    outputs: manifest.outputs.length,
    skills: manifest.skills.length,
    tools: manifest.tools.length,
    stopConditions: manifest.stopConditions.length,
    verification: manifest.verification.length,
    warnings: warnings.length,
    conflicts: 0
  };
}

function normalizeRecipeId(value) {
  const recipeId = String(value ?? '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(recipeId)) {
    throw new Error('Invalid --recipe; expected a lowercase hyphenated recipe id.');
  }
  return recipeId;
}
