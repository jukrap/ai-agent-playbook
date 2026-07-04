import path from 'node:path';
import {
  SCHEMA_VERSION,
  assertDirectory,
  collectContextEntries,
  CONTEXT_DIR,
  MAPS_DIR,
  normalizeTargetRelativePath,
  readDocMap,
  resolvePlaybookLayout,
  todayIso,
  writeMemoryFiles
} from './core.mjs';

export async function listContexts(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const warnings = [];
  const contexts = await collectContextEntries({ target: resolvedTarget, playbook, warnings });
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    summary: {
      total: contexts.length,
      warnings: warnings.length
    },
    contexts,
    warnings,
    conflicts: []
  };
}

export async function contextStatus(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!filePath || typeof filePath !== 'string') throw new Error('Missing --path.');
  const resolvedTarget = path.resolve(target);
  const relativePath = normalizeTargetRelativePath(resolvedTarget, filePath);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const warnings = [];
  const contexts = await collectContextEntries({ target: resolvedTarget, playbook, relativePath, warnings });
  const docMap = await readDocMap({ target: resolvedTarget, playbook });
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    path: relativePath,
    summary: {
      total: contexts.length,
      applies: contexts.filter((context) => context.applies).length,
      warnings: warnings.length
    },
    contexts,
    docMap,
    warnings,
    conflicts: []
  };
}

export async function initContext(options) {
  const { target, dryRun = false } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const files = [
    {
      path: `${playbook.dir}/${CONTEXT_DIR}/root.md`,
      content: [
        '---',
        'id: root',
        'alwaysApply: true',
        `freshness: ${todayIso()}`,
        'priority: high',
        '---',
        '# Root Context',
        '',
        '## When to read',
        '',
        'Read for project-wide conventions that apply to every path.',
        '',
        '## Current facts',
        '',
        '- Replace with durable project-wide facts after repo inspection.',
        '',
        '## Do not assume',
        '',
        '- Do not treat this template as adapted until project facts are added.',
        '',
        '## Verification hints',
        '',
        '- Record project-specific verification commands after discovery.',
        ''
      ].join('\n')
    },
    {
      path: `${playbook.dir}/${CONTEXT_DIR}/_registry.json`,
      content: `${JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        contexts: [
          {
            id: 'root',
            file: 'root.md',
            alwaysApply: true,
            priority: 'high'
          }
        ]
      }, null, 2)}\n`
    },
    {
      path: `${playbook.dir}/${MAPS_DIR}/doc-map.md`,
      content: [
        '# Documentation Map',
        '',
        'Use this map to find the right project memory or public documentation quickly.',
        '',
        '## Start here',
        '',
        '- README.md',
        `- ${playbook.dir}/START_HERE.md`,
        `- ${playbook.dir}/CURRENT.md`,
        '',
        '## Commands and setup',
        '',
        '- docs/commands.md',
        '- docs/lifecycle.md',
        '',
        '## Runtime harness',
        '',
        '- docs/harness-runtime.md',
        '- docs/runtime-roadmap.md',
        '',
        '## Project memory',
        '',
        `- ${playbook.dir}/memory/maps/`,
        `- ${playbook.dir}/workflows/runbooks/`,
        `- ${playbook.dir}/memory/decisions/`,
        `- ${playbook.dir}/workflows/plans/`,
        `- ${playbook.dir}/workflows/worklogs/`,
        ''
      ].join('\n')
    }
  ];
  return writeMemoryFiles({ target: resolvedTarget, files, dryRun, command: 'context.init' });
}
