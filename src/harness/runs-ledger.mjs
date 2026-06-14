import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  RUN_SUMMARY_MARKER,
  SCHEMA_VERSION,
  assertDirectory,
  buildRunSummaryMarkdown,
  emptyRunSummary,
  isUnsafeRecordText,
  isUserEditedRunSummary,
  latestRunId,
  memoryConflict,
  mergeCriteriaWithLedgerEvents,
  normalizePortableUserPath,
  normalizeRunId,
  readCriteria,
  readLedgerEvents,
  requireTitle,
  resolvePlaybookLayout,
  result,
  runStatusResult,
  slugifyTitle,
  summarizeRunState,
  writeMemoryFiles
} from './core.mjs';

export async function startRun(options) {
  const { target, title, dryRun = false } = options;
  await assertDirectory(target, 'Target repository does not exist');
  requireTitle(title);
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const runId = slugifyTitle(title);
  const runRoot = `${playbook.dir}/runs/${runId}`;
  const startedAt = new Date().toISOString();
  const files = [
    {
      path: `${runRoot}/brief.md`,
      content: `# ${title}\n\nStarted: ${startedAt}\n\n## Goal\n\nRecord the requested outcome.\n\n## Constraints\n\n- Keep evidence local and redact secrets.\n`
    },
    {
      path: `${runRoot}/criteria.json`,
      content: `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, criteria: [] }, null, 2)}\n`
    },
    {
      path: `${runRoot}/ledger.jsonl`,
      content: `${JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        timeUtc: startedAt,
        type: 'note',
        status: 'info',
        message: `Run started: ${title}`,
        evidence: null,
        paths: []
      })}\n`
    },
    {
      path: `${runRoot}/summary.md`,
      content: `${RUN_SUMMARY_MARKER}\n# ${title} Run Summary\n\nStatus: active\nRun ID: ${runId}\n\n## Evidence\n\n- No evidence recorded yet.\n`
    }
  ];
  const result = await writeMemoryFiles({ target: resolvedTarget, files, dryRun, command: 'run.start' });
  const evidenceDir = path.join(resolvedTarget, playbook.dir, 'runs', runId, 'evidence');
  if (!dryRun && result.ok) {
    await mkdir(evidenceDir, { recursive: true });
  } else {
    result.operations.push({
      id: 'run.mkdir-evidence',
      action: 'mkdir',
      path: `${runRoot}/evidence/`,
      message: `Create ${runRoot}/evidence/.`
    });
    result.summary.operations += 1;
  }
  return {
    ...result,
    runId,
    runPath: runRoot
  };
}

export async function recordRun(options) {
  const { target, runId, type, message, status = 'info', evidence } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const normalizedRunId = normalizeRunId(runId);
  const conflicts = [];
  const warnings = [];
  const allowedTypes = new Set(['note', 'criterion', 'evidence', 'blocker', 'cleanup']);
  const allowedStatuses = new Set(['pass', 'fail', 'blocked', 'info']);
  if (!allowedTypes.has(type)) {
    conflicts.push(memoryConflict('run.record.invalid-type', `Invalid --type ${type}.`, []));
  }
  if (!allowedStatuses.has(status)) {
    conflicts.push(memoryConflict('run.record.invalid-status', `Invalid --status ${status}.`, []));
  }
  if (!message || !String(message).trim()) {
    conflicts.push(memoryConflict('run.record.missing-message', 'Missing --message.', []));
  }
  if (isUnsafeRecordText(message)) {
    conflicts.push(memoryConflict('run.record.unsafe-message', 'Refusing to record a message that looks like a local absolute path or secret.', []));
  }
  const evidencePath = evidence === undefined || evidence === false ? null : normalizePortableUserPath(evidence);
  if (evidencePath === false) {
    conflicts.push(memoryConflict('run.record.unsafe-evidence', `Refusing non-portable evidence path: ${evidence}`, []));
  }
  const ledgerPath = path.join(playbook.root, 'runs', normalizedRunId, 'ledger.jsonl');
  const relativeLedgerPath = `${playbook.dir}/runs/${normalizedRunId}/ledger.jsonl`;
  if (!existsSync(ledgerPath)) {
    conflicts.push(memoryConflict('run.record.missing-ledger', `Missing run ledger ${relativeLedgerPath}.`, [relativeLedgerPath]));
  }
  if (conflicts.length === 0) {
    const event = {
      schemaVersion: SCHEMA_VERSION,
      timeUtc: new Date().toISOString(),
      type,
      status,
      message: String(message).trim(),
      evidence: evidencePath,
      paths: evidencePath ? [evidencePath] : []
    };
    await appendFile(ledgerPath, `${JSON.stringify(event)}\n`);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target: resolvedTarget,
    runId: normalizedRunId,
    applied: conflicts.length === 0,
    summary: {
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations: conflicts.length === 0 ? [{
      id: 'run.record.append-ledger',
      action: 'append',
      path: relativeLedgerPath,
      message: `Append ${type} event to ${relativeLedgerPath}.`
    }] : [],
    warnings,
    conflicts
  };
}

export async function runStatus(options) {
  const { target, runId } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const selectedRunId = runId ? normalizeRunId(runId) : await latestRunId(playbook.root);
  const warnings = [];
  const conflicts = [];
  if (!selectedRunId) {
    conflicts.push(memoryConflict('run.status.missing-run', 'No run id was provided and no runs exist.', [`${playbook.dir}/runs/`]));
    return runStatusResult({ target: resolvedTarget, runId: null, summary: emptyRunSummary(), criteria: [], events: [], warnings, conflicts });
  }
  const runRoot = path.join(playbook.root, 'runs', selectedRunId);
  const ledgerPath = path.join(runRoot, 'ledger.jsonl');
  const criteriaPath = path.join(runRoot, 'criteria.json');
  if (!existsSync(ledgerPath)) {
    conflicts.push(memoryConflict('run.status.missing-ledger', `Missing ${playbook.dir}/runs/${selectedRunId}/ledger.jsonl.`, [`${playbook.dir}/runs/${selectedRunId}/ledger.jsonl`]));
  }
  const events = existsSync(ledgerPath) ? await readLedgerEvents(ledgerPath, warnings, `${playbook.dir}/runs/${selectedRunId}/ledger.jsonl`) : [];
  const criteriaFile = existsSync(criteriaPath) ? await readCriteria(criteriaPath, warnings, `${playbook.dir}/runs/${selectedRunId}/criteria.json`) : [];
  const criteria = mergeCriteriaWithLedgerEvents(criteriaFile, events);
  return runStatusResult({
    target: resolvedTarget,
    runId: selectedRunId,
    summary: summarizeRunState({ events, criteria, warnings, conflicts }),
    criteria,
    events,
    warnings,
    conflicts
  });
}

export async function summarizeRun(options) {
  const { target, runId, dryRun = false, force = false } = options;
  await assertDirectory(target, 'Target repository does not exist');
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const normalizedRunId = normalizeRunId(runId);
  const status = await runStatus({ target: resolvedTarget, runId: normalizedRunId });
  const runRoot = `${playbook.dir}/runs/${normalizedRunId}`;
  const file = path.join(playbook.root, 'runs', normalizedRunId, 'summary.md');
  const content = buildRunSummaryMarkdown({ runId: normalizedRunId, events: status.events, criteria: status.criteria });
  if (existsSync(file) && !force && !dryRun) {
    const existing = await readFile(file, 'utf8');
    if (isUserEditedRunSummary(existing, normalizedRunId)) {
      return {
        schemaVersion: SCHEMA_VERSION,
        ok: false,
        target: resolvedTarget,
        runId: normalizedRunId,
        applied: false,
        summary: { operations: 0, warnings: 0, conflicts: 1 },
        operations: [],
        warnings: [],
        conflicts: [memoryConflict('run.summarize.exists', `Refusing to overwrite edited ${runRoot}/summary.md without --force.`, [`${runRoot}/summary.md`])]
      };
    }
  }
  const operations = [{
    id: 'run.summarize.write-summary',
    action: 'write',
    path: `${runRoot}/summary.md`,
    message: `Write ${runRoot}/summary.md.`
  }];
  if (!dryRun) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    runId: normalizedRunId,
    applied: !dryRun,
    summary: {
      operations: operations.length,
      warnings: 0,
      conflicts: 0
    },
    operations,
    warnings: [],
    conflicts: []
  };
}
