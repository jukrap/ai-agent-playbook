import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { preflightOperator } from '../operator-diagnostics.mjs';
import { normalizePortablePath, normalizeTargetRelativePath, resolvePlaybookLayout, SCHEMA_VERSION } from '../harness/core.mjs';

export async function previewWriteGate({ repoRoot, target, intent, filePath, maxResults = 20 }) {
  if (!intent || !String(intent).trim()) throw new Error('Missing --intent.');
  const preflight = await preflightOperator({
    target,
    intent,
    filePath,
    maxResults
  });
  const normalizedPath = filePath ? normalizeTargetRelativePath(target, filePath) : null;
  const invocationId = randomUUID();
  const playbook = resolvePlaybookLayout(path.resolve(target));
  const advisoryPath = `${playbook.dir}/runtime/reports/write-gate/pre-write-advisory.${invocationId}.json`;
  const blockers = [];
  const rules = preflight.rules?.rules ?? [];
  const contextMatches = preflight.context?.contexts?.filter((item) => item.applies) ?? [];
  const contractMatches = preflight.contracts?.contracts?.filter((item) => item.matches) ?? [];

  if (normalizedPath && isPlaybookRuntimePath(normalizedPath)) {
    blockers.push({
      id: 'write-gate.runtime-target',
      message: 'Runtime output is generated. Promote reviewed information into memory instead of editing runtime files directly.',
      paths: [normalizedPath]
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: blockers.length === 0,
    target: path.resolve(target),
    repoRoot: repoRoot ? path.resolve(repoRoot) : null,
    mode: { localOnly: true, network: false, writes: false },
    transaction: {
      invocationId,
      lifecycle: 'pre-write-preview',
      advisoryPath,
      applied: false
    },
    intent: String(intent),
    path: normalizedPath,
    summary: {
      candidates: preflight.summary?.candidates ?? 0,
      contexts: contextMatches.length,
      contracts: contractMatches.length,
      rules: rules.filter((rule) => rule.applies).length,
      blockers: blockers.length,
      warnings: preflight.warnings?.length ?? 0,
      conflicts: preflight.conflicts?.length ?? 0
    },
    candidates: (preflight.candidates ?? []).map((item) => ({
      path: item.path,
      category: item.category,
      snippets: item.snippets
    })),
    evidence: {
      contexts: contextMatches.map((item) => ({ id: item.id, path: item.path, reason: item.reason })),
      contracts: contractMatches.map((item) => ({ id: item.id, path: item.path, status: item.status })),
      rules: rules
        .filter((rule) => rule.applies)
        .map((rule) => ({ id: rule.id, path: rule.path, reason: rule.reason }))
    },
    blockers,
    warnings: [
      ...(preflight.warnings ?? []),
      {
        id: 'write-gate.preview-only',
        message: 'This tool previews write risk only; it does not modify project files.',
        paths: normalizedPath ? [normalizePortablePath(normalizedPath)] : []
      }
    ],
    conflicts: preflight.conflicts ?? []
  };
}

function isPlaybookRuntimePath(filePath) {
  const portablePath = normalizePortablePath(filePath);
  return (
    portablePath === '.ai-playbook/runtime' ||
    portablePath.startsWith('.ai-playbook/runtime/') ||
    portablePath === 'ai-playbook/runtime' ||
    portablePath.startsWith('ai-playbook/runtime/')
  );
}
