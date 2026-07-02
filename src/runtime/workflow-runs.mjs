import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
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
