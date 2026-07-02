import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  assertDirectory,
  DEFAULT_PLAYBOOK_DIR,
  normalizePortablePath,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from '../harness/core.mjs';

export const PLAYBOOK_LAYOUT_VERSION = '2';

export const PLAYBOOK_V2_DIRECTORIES = [
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

export const PLAYBOOK_V2_FILES = {
  'manifest.json': `${JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    source: 'ai-agent-playbook',
    layoutVersion: PLAYBOOK_LAYOUT_VERSION,
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
  'memory/glossary.md': [
    '# Glossary',
    '',
    'Use this file for stable terms, domain names, and project-specific vocabulary.',
    ''
  ].join('\n'),
  'knowledge/sources.json': `${JSON.stringify({
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

const V1_TO_V2_COPY_TARGETS = [
  ['SKILLS.md', 'policy/SKILLS.md'],
  ['GIT.md', 'policy/GIT.md'],
  ['context/README.md', 'memory/context/README.md'],
  ['maps/README.md', 'memory/maps/README.md'],
  ['maps/doc-map.md', 'memory/maps/doc-map.md'],
  ['decisions/README.md', 'memory/decisions/README.md'],
  ['contracts/README.md', 'memory/contracts/README.md'],
  ['runbooks/README.md', 'workflows/runbooks/README.md'],
  ['plans/README.md', 'workflows/plans/README.md'],
  ['runs/README.md', 'workflows/runs/README.md'],
  ['worklogs/README.md', 'workflows/worklogs/README.md'],
  ['guides/README.md', 'knowledge/references/guides.md']
];

export async function describePlaybookLayout({ target }) {
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const checks = [];
  const missingDirectories = [];
  const missingFiles = [];

  for (const directory of PLAYBOOK_V2_DIRECTORIES) {
    const exists = existsSync(path.join(playbook.root, ...directory.split('/')));
    checks.push({ type: 'directory', path: `${playbook.dir}/${directory}`, exists });
    if (!exists) missingDirectories.push(directory);
  }

  for (const file of Object.keys(PLAYBOOK_V2_FILES)) {
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
      version: missingDirectories.length === 0 && missingFiles.length === 0 ? PLAYBOOK_LAYOUT_VERSION : '1-compatible'
    },
    summary: {
      directories: PLAYBOOK_V2_DIRECTORIES.length,
      files: Object.keys(PLAYBOOK_V2_FILES).length,
      missingDirectories: missingDirectories.length,
      missingFiles: missingFiles.length,
      warnings: 0,
      conflicts: 0
    },
    missingDirectories,
    missingFiles,
    checks,
    warnings: [],
    conflicts: []
  };
}

export async function migratePlaybookLayout({ target, to = PLAYBOOK_LAYOUT_VERSION, apply = false }) {
  if (String(to) !== PLAYBOOK_LAYOUT_VERSION && String(to).toLowerCase() !== `v${PLAYBOOK_LAYOUT_VERSION}`) {
    throw new Error(`Unsupported layout migration target: ${to}`);
  }
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const operations = [];
  const warnings = [];
  const conflicts = [];

  if (!existsSync(playbook.root)) {
    conflicts.push({
      id: 'layout.playbook-missing',
      message: `Missing ${DEFAULT_PLAYBOOK_DIR}/; run bootstrap first.`,
      paths: [DEFAULT_PLAYBOOK_DIR]
    });
  }

  if (conflicts.length === 0) {
    for (const directory of PLAYBOOK_V2_DIRECTORIES) {
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

    for (const [file, content] of Object.entries(PLAYBOOK_V2_FILES)) {
      const fullPath = path.join(playbook.root, ...file.split('/'));
      if (!existsSync(fullPath)) {
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

    for (const [source, destination] of V1_TO_V2_COPY_TARGETS) {
      const sourcePath = path.join(playbook.root, ...source.split('/'));
      const destinationPath = path.join(playbook.root, ...destination.split('/'));
      if (!existsSync(sourcePath) || existsSync(destinationPath)) continue;
      operations.push({
        id: 'layout.copy-v1',
        action: 'copy',
        message: `Copy ${playbook.dir}/${source} to ${playbook.dir}/${destination}.`,
        paths: [`${playbook.dir}/${source}`, `${playbook.dir}/${destination}`]
      });
      if (apply) {
        await mkdir(path.dirname(destinationPath), { recursive: true });
        await copyFile(sourcePath, destinationPath);
      }
    }

    warnings.push({
      id: 'layout.v1-retained',
      message: 'v1 files are retained for compatibility; no source files are moved or deleted.',
      paths: [playbook.dir]
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    applied: Boolean(apply && conflicts.length === 0 && operations.length > 0),
    to: PLAYBOOK_LAYOUT_VERSION,
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
