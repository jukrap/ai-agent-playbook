import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  requireTitle,
  resolvePlaybookLayout,
  slugifyTitle,
  todayIso,
  writeScaffold
} from './core.mjs';

export async function createPlan(options) {
  const { target, title, date = todayIso(), dryRun = false, force = false } = options;
  requireTitle(title);
  const file = path.join(resolvePlaybookLayout(target).root, 'plans', `${date}-${slugifyTitle(title)}.md`);
  const content = `# ${title}\n\nStatus: active\nDate: ${date}\n\n## Goal\n\nDescribe the outcome this plan should produce.\n\n## Approach\n\nRecord the chosen implementation path and important constraints.\n\n## Steps\n\n- [ ] First implementation slice.\n- [ ] Verification and cleanup.\n\n## Verification\n\n- Record commands or manual checks here after they are known.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

export async function createWorklog(options) {
  const { target, title, date = todayIso(), dryRun = false, force = false } = options;
  requireTitle(title);
  const month = date.slice(0, 7);
  const file = path.join(resolvePlaybookLayout(target).root, 'worklogs', month, `${date}-${slugifyTitle(title)}.md`);
  const content = `# ${title}\n\nDate: ${date}\n\n## Context\n\nExplain what prompted the work.\n\n## Decision Path\n\nRecord the reasoning, alternatives considered, and evidence.\n\n## Changes\n\nSummarize the important changes without reducing this to a file list.\n\n## Verification\n\nRecord only checks that were actually run.\n\n## Remaining Risk\n\nCapture follow-up risk or note none after verification.\n`;
  return writeScaffold(file, content, { dryRun, force });
}

export async function summarizeWorklogs(options) {
  const { target, month, dryRun = false, force = false } = options;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Missing or invalid --month YYYY-MM.');
  }
  const playbook = resolvePlaybookLayout(target);
  const monthDir = path.join(playbook.root, 'worklogs', month);
  const files = existsSync(monthDir)
    ? (await readdir(monthDir, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort()
    : [];
  const file = path.join(playbook.root, 'worklogs', 'summaries', `${month}.md`);
  const lines = files.length
    ? files.map((name) => `- ${name}: summarize durable facts, decisions, verification, and follow-up risk.`)
    : ['- No worklog files found for this month yet.'];
  const content = `# ${month} Worklog Summary\n\n## Durable Facts\n\n- Promote still-current facts into CURRENT.md, maps, runbooks, or decisions.\n\n## Entries\n\n${lines.join('\n')}\n\n## Follow-up\n\n- Record unresolved risks or cleanup items.\n`;
  return writeScaffold(file, content, { dryRun, force });
}
