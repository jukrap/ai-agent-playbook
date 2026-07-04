import { copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  DEFAULT_PLAYBOOK_DIR,
  LEGACY_PLAYBOOK_DIR,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION,
  walkFiles
} from '../harness/core.mjs';

export const PLAYBOOK_LAYOUT_KIND = 'structured';

export const STRUCTURED_PLAYBOOK_DIRECTORIES = [
  'policy',
  'policy/rules',
  'memory',
  'memory/context',
  'memory/maps',
  'memory/decisions',
  'memory/contracts',
  'workflows',
  'workflows/recipes',
  'workflows/runbooks',
  'workflows/plans',
  'workflows/runs',
  'workflows/worklogs',
  'workflows/handoffs',
  'knowledge',
  'knowledge/references',
  'knowledge/research',
  'runtime',
  'runtime/cache',
  'runtime/indexes',
  'runtime/graphs',
  'runtime/reports',
  'runtime/snapshots',
  'runtime/tmp',
  'integrations',
  'integrations/mcp',
  'integrations/adapters',
  'integrations/hooks',
  'integrations/commands',
  'archive'
];

export const STRUCTURED_PLAYBOOK_FILES = {
  'manifest.json': `${JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    source: 'ai-agent-playbook',
    layoutKind: PLAYBOOK_LAYOUT_KIND,
    runtimePolicy: {
      defaultLocalOnly: true,
      runtimeIsGenerated: true,
      memoryRequiresExplicitPromotion: true
    },
    permissions: {
      mcpDefaultTier: 'read',
      writeToolsRequireOptIn: true
    }
  }, null, 2)}\n`,
  'policy/SAFETY.md': [
    '# Safety',
    '',
    '- Treat `memory/` as long-lived project knowledge.',
    '- Treat `runtime/` as generated local tool output.',
    '- Do not promote runtime output into memory without an explicit human-facing decision.',
    '- Keep write-capable integrations disabled unless a runbook enables them for a bounded task.',
    ''
  ].join('\n'),
  'memory/README.md': [
    '# Memory',
    '',
    'Stable project knowledge lives here.',
    '',
    'Use `context/` for applicable guidance, `maps/` for system maps, `decisions/` for durable decisions, `contracts/` for cross-boundary agreements, and `glossary.md` for shared vocabulary.',
    ''
  ].join('\n'),
  'memory/glossary.md': [
    '# Glossary',
    '',
    'Use this file for stable terms, domain names, and project-specific vocabulary.',
    ''
  ].join('\n'),
  'workflows/README.md': [
    '# Workflows',
    '',
    'Repeatable work patterns live here.',
    '',
    'Use `recipes/` for reusable procedures, `runbooks/` for project-specific operations, `plans/` for upcoming work, `runs/` for active run ledgers, `worklogs/` for completed work, and `handoffs/` for transfer notes.',
    ''
  ].join('\n'),
  'workflows/recipes/README.md': [
    '# Recipes',
    '',
    'Recipes define inputs, outputs, skills to read, useful MCP or CLI tools, stop conditions, and verification criteria.',
    ''
  ].join('\n'),
  'knowledge/sources.json': `${JSON.stringify({
    schemaVersion: '1',
    sources: []
  }, null, 2)}\n`,
  'runtime/README.md': [
    '# Runtime',
    '',
    'Generated cache, index, graph, report, snapshot, and temporary files live here.',
    '',
    'Runtime files are local-first and should not be treated as project memory until explicitly reviewed and promoted.',
    ''
  ].join('\n'),
  'integrations/README.md': [
    '# Integrations',
    '',
    'MCP, adapter, hook, and command configuration lives here.',
    '',
    'Write-capable integrations should be opt-in and documented by a runbook.',
    ''
  ].join('\n')
};

const LEGACY_LAYOUT_FILE_TARGETS = [
  ['SKILLS.md', 'policy/SKILLS.md'],
  ['GIT.md', 'policy/GIT.md']
];

const LEGACY_LAYOUT_DIRECTORY_TARGETS = [
  ['context', 'memory/context'],
  ['maps', 'memory/maps'],
  ['decisions', 'memory/decisions'],
  ['contracts', 'memory/contracts'],
  ['rules', 'policy/rules'],
  ['runbooks', 'workflows/runbooks'],
  ['plans', 'workflows/plans'],
  ['runs', 'workflows/runs'],
  ['worklogs', 'workflows/worklogs'],
  ['handoffs', 'workflows/handoffs'],
  ['guides', 'knowledge/references/guides']
];

const STRUCTURED_REFERENCE_REPLACEMENTS = [
  [/\.ai-playbook\/SKILLS\.md/g, '.ai-playbook/policy/SKILLS.md'],
  [/\.ai-playbook\/GIT\.md/g, '.ai-playbook/policy/GIT.md'],
  [/\.ai-playbook\/context\//g, '.ai-playbook/memory/context/'],
  [/\.ai-playbook\/maps\//g, '.ai-playbook/memory/maps/'],
  [/\.ai-playbook\/decisions\//g, '.ai-playbook/memory/decisions/'],
  [/\.ai-playbook\/contracts\//g, '.ai-playbook/memory/contracts/'],
  [/\.ai-playbook\/rules\//g, '.ai-playbook/policy/rules/'],
  [/\.ai-playbook\/runbooks\//g, '.ai-playbook/workflows/runbooks/'],
  [/\.ai-playbook\/plans\//g, '.ai-playbook/workflows/plans/'],
  [/\.ai-playbook\/runs\//g, '.ai-playbook/workflows/runs/'],
  [/\.ai-playbook\/worklogs\//g, '.ai-playbook/workflows/worklogs/'],
  [/\.ai-playbook\/handoffs\//g, '.ai-playbook/workflows/handoffs/'],
  [/\.ai-playbook\/guides\//g, '.ai-playbook/knowledge/references/guides/']
];

export async function describePlaybookLayout({ target }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const legacyRoot = path.join(resolvedTarget, LEGACY_PLAYBOOK_DIR);
  const checks = [];
  const missingDirectories = [];
  const missingFiles = [];
  const warnings = [];

  if (existsSync(legacyRoot)) {
    warnings.push({
      id: 'layout.legacy-path-present',
      message: `${LEGACY_PLAYBOOK_DIR}/ exists but is not an active playbook path. Use migrate path or remove it after review.`,
      paths: [`${LEGACY_PLAYBOOK_DIR}/`]
    });
  }

  for (const directory of STRUCTURED_PLAYBOOK_DIRECTORIES) {
    const exists = existsSync(path.join(playbook.root, ...directory.split('/')));
    checks.push({ type: 'directory', path: `${playbook.dir}/${directory}`, exists });
    if (!exists) missingDirectories.push(directory);
  }

  for (const file of Object.keys(STRUCTURED_PLAYBOOK_FILES)) {
    const exists = existsSync(path.join(playbook.root, ...file.split('/')));
    checks.push({ type: 'file', path: `${playbook.dir}/${file}`, exists });
    if (!exists) missingFiles.push(file);
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    layout: {
      activeRoot: normalizePortablePath(path.relative(resolvedTarget, playbook.root)),
      activeDir: playbook.dir,
      kind: missingDirectories.length === 0 && missingFiles.length === 0 ? PLAYBOOK_LAYOUT_KIND : 'missing'
    },
    summary: {
      directories: STRUCTURED_PLAYBOOK_DIRECTORIES.length,
      files: Object.keys(STRUCTURED_PLAYBOOK_FILES).length,
      missingDirectories: missingDirectories.length,
      missingFiles: missingFiles.length,
      warnings: warnings.length,
      conflicts: 0
    },
    missingDirectories,
    missingFiles,
    checks,
    warnings,
    conflicts: []
  };
}

export async function migratePlaybookLayout({ target, to = PLAYBOOK_LAYOUT_KIND, apply = false }) {
  if (to !== undefined && to !== true && String(to).toLowerCase() !== PLAYBOOK_LAYOUT_KIND) {
    throw new Error(`Unsupported layout migration target: ${to}`);
  }
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const legacyRoot = path.join(resolvedTarget, LEGACY_PLAYBOOK_DIR);
  const operations = [];
  const warnings = [];
  const conflicts = [];

  if (!existsSync(playbook.root)) {
    conflicts.push({
      id: 'layout.playbook-missing',
      message: existsSync(legacyRoot)
        ? `Missing ${DEFAULT_PLAYBOOK_DIR}/. Run migrate path before migrating the playbook layout.`
        : `Missing ${DEFAULT_PLAYBOOK_DIR}/; run bootstrap first.`,
      paths: existsSync(legacyRoot)
        ? [`${DEFAULT_PLAYBOOK_DIR}/`, `${LEGACY_PLAYBOOK_DIR}/`]
        : [`${DEFAULT_PLAYBOOK_DIR}/`]
    });
  }

  if (conflicts.length === 0) {
    if (existsSync(legacyRoot)) {
      warnings.push({
        id: 'layout.legacy-path-present',
        message: `${LEGACY_PLAYBOOK_DIR}/ exists but is not used as the active playbook path.`,
        paths: [`${LEGACY_PLAYBOOK_DIR}/`]
      });
    }

    for (const directory of STRUCTURED_PLAYBOOK_DIRECTORIES) {
      const fullPath = path.join(playbook.root, ...directory.split('/'));
      if (!existsSync(fullPath)) {
        operations.push({
          id: 'layout.mkdir',
          action: 'mkdir',
          message: `Create ${playbook.dir}/${directory}.`,
          paths: [`${playbook.dir}/${directory}`]
        });
        if (apply) await mkdir(fullPath, { recursive: true });
      }
    }

    for (const [file, content] of Object.entries(STRUCTURED_PLAYBOOK_FILES)) {
      const fullPath = path.join(playbook.root, ...file.split('/'));
      if (file === 'manifest.json' && existsSync(fullPath)) {
        const manifestUpdate = await manifestLayoutKindUpdate(fullPath);
        if (manifestUpdate.conflict) conflicts.push(manifestUpdate.conflict);
        if (manifestUpdate.updated) {
          operations.push({
            id: 'layout.update-manifest',
            action: 'write',
            message: `Update ${playbook.dir}/${file} to use layoutKind.`,
            paths: [`${playbook.dir}/${file}`]
          });
          if (apply && conflicts.length === 0) {
            await writeFile(fullPath, `${JSON.stringify(manifestUpdate.value, null, 2)}\n`);
          }
        }
      } else if (!existsSync(fullPath)) {
        operations.push({
          id: 'layout.write-template',
          action: 'write',
          message: `Write ${playbook.dir}/${file}.`,
          paths: [`${playbook.dir}/${file}`]
        });
        if (apply) {
          await mkdir(path.dirname(fullPath), { recursive: true });
          await writeFile(fullPath, content);
        }
      }
    }

    const movePlan = await legacyLayoutMovePlan({ playbook });
    conflicts.push(...movePlan.conflicts);
    operations.push(...movePlan.operations);

    const referencePlan = await structuredReferenceUpdatePlan({
      target: resolvedTarget,
      playbook
    });
    operations.push(...referencePlan.operations);

    if (apply && conflicts.length === 0) {
      for (const update of referencePlan.updates) {
        await writeFile(update.file, update.updated);
      }
      await applyLegacyLayoutMovePlan({
        playbook,
        moves: movePlan.moves
      });
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    applied: Boolean(apply && conflicts.length === 0 && operations.length > 0),
    to: PLAYBOOK_LAYOUT_KIND,
    summary: {
      operations: operations.length,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };
}

async function manifestLayoutKindUpdate(file) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    return {
      conflict: {
        id: 'layout.manifest-malformed',
        message: `Could not parse manifest.json: ${error.message}`,
        paths: [`${DEFAULT_PLAYBOOK_DIR}/manifest.json`]
      }
    };
  }
  const next = {
    ...manifest,
    layoutKind: PLAYBOOK_LAYOUT_KIND
  };
  delete next['layout' + 'Version'];
  const updated = JSON.stringify(next) !== JSON.stringify(manifest);
  return { updated, value: next };
}

async function legacyLayoutMovePlan({ playbook }) {
  const moves = [];
  const conflicts = [];
  const operations = [];

  for (const [source, destination] of LEGACY_LAYOUT_FILE_TARGETS) {
    const sourcePath = path.join(playbook.root, ...source.split('/'));
    if (!existsSync(sourcePath)) continue;
    const destinationPath = path.join(playbook.root, ...destination.split('/'));
    if (existsSync(destinationPath)) {
      conflicts.push({
        id: 'layout.destination-exists',
        message: `Refusing to overwrite ${playbook.dir}/${destination}.`,
        paths: [`${playbook.dir}/${source}`, `${playbook.dir}/${destination}`]
      });
      continue;
    }
    moves.push({ source, destination, sourcePath, destinationPath, sourceRoot: source });
  }

  for (const [sourceDirectory, destinationDirectory] of LEGACY_LAYOUT_DIRECTORY_TARGETS) {
    const sourceRoot = path.join(playbook.root, ...sourceDirectory.split('/'));
    if (!existsSync(sourceRoot)) continue;
    const info = await stat(sourceRoot);
    if (!info.isDirectory()) continue;
    const sourceFiles = await walkFiles(sourceRoot, () => true);
    for (const sourcePath of sourceFiles) {
      const relativeSource = normalizePortablePath(path.relative(sourceRoot, sourcePath));
      const destination = `${destinationDirectory}/${relativeSource}`;
      const destinationPath = path.join(playbook.root, ...destination.split('/'));
      if (existsSync(destinationPath)) {
        conflicts.push({
          id: 'layout.destination-exists',
          message: `Refusing to overwrite ${playbook.dir}/${destination}.`,
          paths: [
            `${playbook.dir}/${sourceDirectory}/${relativeSource}`,
            `${playbook.dir}/${destination}`
          ]
        });
        continue;
      }
      moves.push({
        source: `${sourceDirectory}/${relativeSource}`,
        destination,
        sourcePath,
        destinationPath,
        sourceRoot: sourceDirectory
      });
    }
  }

  for (const move of moves) {
    operations.push({
      id: 'layout.move-legacy',
      action: 'move',
      message: `Move ${playbook.dir}/${move.source} to ${playbook.dir}/${move.destination}.`,
      paths: [`${playbook.dir}/${move.source}`, `${playbook.dir}/${move.destination}`]
    });
  }

  for (const sourceRoot of [...new Set(moves.map((move) => move.sourceRoot))]) {
    operations.push({
      id: 'layout.archive-legacy',
      action: 'archive',
      message: `Archive old ${playbook.dir}/${sourceRoot} after structured layout migration.`,
      paths: [`${playbook.dir}/${sourceRoot}`, `${playbook.dir}/archive/legacy-layout/`]
    });
  }

  return { moves, operations, conflicts };
}

async function applyLegacyLayoutMovePlan({ playbook, moves }) {
  const archiveRoot = path.join(playbook.root, 'archive', 'legacy-layout', timestampForPath());
  for (const move of moves) {
    await mkdir(path.dirname(move.destinationPath), { recursive: true });
    await copyFile(move.sourcePath, move.destinationPath);
  }

  for (const sourceRoot of [...new Set(moves.map((move) => move.sourceRoot))]) {
    const sourcePath = path.join(playbook.root, ...sourceRoot.split('/'));
    if (!existsSync(sourcePath)) continue;
    const archivePath = path.join(archiveRoot, ...sourceRoot.split('/'));
    await mkdir(path.dirname(archivePath), { recursive: true });
    await rename(sourcePath, archivePath);
  }
}

async function structuredReferenceUpdatePlan({ target, playbook }) {
  const candidates = [];
  const rootAgent = path.join(target, 'AGENTS.md');
  if (existsSync(rootAgent)) candidates.push(rootAgent);
  const playbookFiles = await walkFiles(playbook.root, (file) => /\.(?:md|json)$/i.test(file));
  candidates.push(...playbookFiles.filter((file) => !normalizePortablePath(path.relative(playbook.root, file)).startsWith('archive/')));

  const updates = [];
  const operations = [];
  for (const file of [...new Set(candidates)]) {
    const text = await readFile(file, 'utf8');
    const updated = replaceStructuredPlaybookRefs(text);
    if (updated === text) continue;
    const relativePath = normalizePortablePath(path.relative(target, file));
    updates.push({ file, updated });
    operations.push({
      id: 'layout.update-references',
      action: 'replace',
      message: `Update structured playbook references in ${relativePath}.`,
      paths: [relativePath]
    });
  }
  return { updates, operations };
}

function replaceStructuredPlaybookRefs(text) {
  let updated = text;
  for (const [pattern, replacement] of STRUCTURED_REFERENCE_REPLACEMENTS) {
    updated = updated.replace(pattern, replacement);
  }
  return updated;
}

function timestampForPath() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
