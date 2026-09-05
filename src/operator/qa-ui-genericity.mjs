import { lstat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { LEGACY_PLAYBOOK_DIRS, SCHEMA_VERSION } from '../harness/core.mjs';
import { noLinks, readText } from '../fs-safety.mjs';

export const UI_GENERICITY_RULE_IDS = Object.freeze([
  'visual.gradient-text',
  'visual.ambient-glow',
  'visual.glass-surface',
  'shape.pill-taxonomy',
  'layout.nested-cards',
  'shape.radius-shadow-stack',
  'content.decorative-stats',
  'motion.uniform-hover-transform',
  'content.repeated-kicker',
  'copy.generic-marketing-claims'
]);

const UI_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less', '.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const EXCLUDED_DIRECTORIES = new Set([
  '.git', '.ai-agent-playbook', ...LEGACY_PLAYBOOK_DIRS,
  'node_modules', 'vendor', 'dist', 'build', 'out', 'coverage',
  '.next', '.nuxt', '.svelte-kit', '.turbo', '.vite', '.cache',
  '_reference', '_work'
]);
const LOCKFILES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb',
  'composer.lock', 'poetry.lock', 'cargo.lock'
]);
const MAX_SOURCE_BYTES = 1_000_000;

export async function checkUiGenericity(options) {
  const target = path.resolve(options.target);
  const maxFiles = parseUiMaxFiles(options.maxFiles);
  const requestedRoot = options.root ? String(options.root) : '.';
  const root = path.resolve(target, requestedRoot);
  const warnings = [];
  const conflicts = [];
  const findings = [];
  const suppressions = [];
  const skipped = [];

  if (!isInside(target, root)) {
    conflicts.push(conflict('qa.ui.root-outside-target', 'Scan root must stay inside the target project.', [requestedRoot]));
    return uiResult({ target, root, maxFiles, findings, suppressions, skipped, warnings, conflicts, scannedFiles: 0, candidateFiles: 0, truncated: false });
  }
  try { await noLinks(root); }
  catch {
    conflicts.push(conflict('qa.ui.root-symlink', 'Scan root cannot contain a symbolic link or junction.', [requestedRoot]));
    return uiResult({ target, root, maxFiles, findings, suppressions, skipped, warnings, conflicts, scannedFiles: 0, candidateFiles: 0, truncated: false });
  }
  if (!existsSync(root)) {
    conflicts.push(conflict('qa.ui.root-missing', 'Scan root does not exist.', [portable(path.relative(target, root) || '.')]));
    return uiResult({ target, root, maxFiles, findings, suppressions, skipped, warnings, conflicts, scannedFiles: 0, candidateFiles: 0, truncated: false });
  }
  const rootInfo = await lstat(root);
  if (rootInfo.isSymbolicLink()) {
    conflicts.push(conflict('qa.ui.root-symlink', 'Scan root cannot be a symbolic link.', [portable(path.relative(target, root) || '.')]));
    return uiResult({ target, root, maxFiles, findings, suppressions, skipped, warnings, conflicts, scannedFiles: 0, candidateFiles: 0, truncated: false });
  }
  if (!rootInfo.isDirectory()) {
    conflicts.push(conflict('qa.ui.root-not-directory', 'Scan root must be a directory.', [portable(path.relative(target, root) || '.')]));
    return uiResult({ target, root, maxFiles, findings, suppressions, skipped, warnings, conflicts, scannedFiles: 0, candidateFiles: 0, truncated: false });
  }

  const candidates = [];
  await collectUiFiles(root, target, candidates, skipped);
  candidates.sort((left, right) => left.localeCompare(right));
  const selected = candidates.slice(0, maxFiles);
  const truncated = candidates.length > selected.length;
  if (truncated) {
    warnings.push({
      id: 'qa.ui.file-limit',
      message: `Scanned the first ${selected.length} of ${candidates.length} candidate files. Increase --max-files to review the rest.`,
      paths: []
    });
  }

  for (const file of selected) {
    const rel = portable(path.relative(target, file));
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) {
      skipped.push({ path: rel, reason: info.isSymbolicLink() ? 'symlink' : 'not-file' });
      continue;
    }
    if (info.size > MAX_SOURCE_BYTES) {
      skipped.push({ path: rel, reason: 'file-too-large' });
      continue;
    }
    const text = await readText(file, MAX_SOURCE_BYTES);
    if (/^.{0,120}(?:@generated|generated file|do not edit)/i.test(text.slice(0, 500))) {
      skipped.push({ path: rel, reason: 'generated' });
      continue;
    }
    const fileSuppressions = parseSuppressions(text, rel, warnings);
    suppressions.push(...fileSuppressions.map((ruleId) => ({ path: rel, ruleId })));
    const suppressed = new Set(fileSuppressions);
    for (const finding of analyzeUiFile(text, rel)) {
      if (!suppressed.has(finding.ruleId)) findings.push(finding);
    }
  }
  findings.sort((left, right) => left.path.localeCompare(right.path) || left.line - right.line || left.ruleId.localeCompare(right.ruleId));
  return uiResult({
    target,
    root,
    maxFiles,
    findings,
    suppressions,
    skipped,
    warnings,
    conflicts,
    scannedFiles: selected.length,
    candidateFiles: candidates.length,
    truncated
  });
}

async function collectUiFiles(directory, target, files, skipped) {
  await noLinks(directory);
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const rel = portable(path.relative(target, fullPath));
    if (entry.isSymbolicLink()) {
      skipped.push({ path: rel, reason: 'symlink' });
      continue;
    }
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRECTORIES.has(entry.name)) {
        skipped.push({ path: `${rel}/`, reason: 'excluded-directory' });
      } else {
        await collectUiFiles(fullPath, target, files, skipped);
      }
      continue;
    }
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    if (LOCKFILES.has(lower) || /\.min\.(?:css|js)$/i.test(lower)) {
      skipped.push({ path: rel, reason: 'generated-or-lockfile' });
      continue;
    }
    if (UI_EXTENSIONS.has(path.extname(lower))) files.push(fullPath);
  }
}

function analyzeUiFile(text, file) {
  const lines = text.split(/\r?\n|\r/);
  const findings = [];
  addLineMatches(findings, lines, file, 'visual.gradient-text', (line) =>
    /(?:bg-gradient|linear-gradient|radial-gradient)/i.test(line) && /(?:bg-clip-text|background-clip\s*:\s*text|text-transparent)/i.test(line),
  'Gradient-clipped text can make product hierarchy look ornamental rather than task-led.');
  addLineMatches(findings, lines, file, 'visual.glass-surface', (line) =>
    /backdrop-(?:blur|filter)|backdrop-filter\s*:/i.test(line) && /(?:bg-|background).*(?:\/\d{1,2}|rgba?\(|hsla?\()/i.test(line),
  'Translucent blurred surfaces should be justified by the product context and rendered evidence.');
  addLineMatches(findings, lines, file, 'shape.radius-shadow-stack', (line) =>
    /rounded-(?:2xl|3xl|\[)/i.test(line) && /shadow-(?:xl|2xl|\[)/i.test(line),
  'Large radius and heavy shadow are stacked on the same surface.');

  addAggregateFinding(findings, lines, file, 'visual.ambient-glow',
    (line) => /(?:blur-(?:2xl|3xl)|filter\s*:\s*blur\([^)]{2,}\)|shadow-\[[^\]]*(?:rgba|hsla|#))/i.test(line) && /(?:absolute|fixed|pointer-events-none|before:|after:)/i.test(line),
    2, 'Multiple ambient glow decorations may compete with functional content.');
  addAggregateFinding(findings, lines, file, 'shape.pill-taxonomy',
    (line) => /rounded-full/i.test(line) && /(?:badge|chip|pill|tag|status)/i.test(line),
    4, 'Pill-shaped labels appear as a repeated taxonomy rather than an exceptional status cue.');
  addAggregateFinding(findings, lines, file, 'motion.uniform-hover-transform',
    (line) => /hover:(?:-?translate-[xy]|scale-)|:hover[^\n{]*\{?[^}]*transform\s*:/i.test(line),
    3, 'The same hover transform is repeated across several surfaces.');
  addAggregateFinding(findings, lines, file, 'content.repeated-kicker',
    (line) => /(?:uppercase[^"'\n]*tracking-(?:wide|wider|widest)|text-transform\s*:\s*uppercase[^;}]*letter-spacing)/i.test(line),
    3, 'Repeated uppercase kickers can flatten hierarchy into a template-like rhythm.');
  addAggregateFinding(findings, lines, file, 'copy.generic-marketing-claims',
    (line) => /\b(?:unlock|unleash|reimagine|seamless(?:ly)?|powerful|next[- ]generation|all[- ]in[- ]one)\b|(?:새로운 가능성|완벽한 경험|혁신적인 경험|한 차원 높은|모든 것을 한곳에서)/i.test(line),
    2, 'Generic marketing claims repeat without product-specific evidence.');

  const nested = /<(Card|Panel)\b[^>]*>[\s\S]{0,2000}<\1\b/i.exec(text);
  if (nested) {
    findings.push(finding('layout.nested-cards', file, lineAt(text, nested.index), 1,
      'A card-like component contains another component of the same surface type.', evidenceLine(lines, lineAt(text, nested.index))));
  }
  const statMatches = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /(?:stat|metric|kpi)/i.test(line) && /(?:text-(?:4|5|6|7)xl|font-size\s*:\s*(?:[3-9]|\d{2,})rem)/i.test(line));
  if (statMatches.length >= 3) {
    findings.push(finding('content.decorative-stats', file, statMatches[0].index + 1, statMatches.length,
      'Several oversized stat treatments may be decorative rather than decision-supporting.', trimEvidence(statMatches[0].line)));
  }
  return findings;
}

function addLineMatches(findings, lines, file, ruleId, predicate, message) {
  lines.forEach((line, index) => {
    if (predicate(line)) findings.push(finding(ruleId, file, index + 1, 1, message, trimEvidence(line)));
  });
}

function addAggregateFinding(findings, lines, file, ruleId, predicate, minimum, message) {
  const matches = lines.map((line, index) => ({ line, index })).filter(({ line }) => predicate(line));
  if (matches.length < minimum) return;
  findings.push(finding(ruleId, file, matches[0].index + 1, matches.length, message, trimEvidence(matches[0].line)));
}

function finding(ruleId, file, line, count, message, evidence) {
  return { ruleId, severity: 'candidate', path: file, line, count, message, evidence };
}

function parseSuppressions(text, file, warnings) {
  const found = [];
  const lines = String(text).split(/\r?\n|\r/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const anyMarkers = [...line.matchAll(/ui-review-ignore\s+([a-z0-9.-]+)/gi)];
    const validMarker = /^\s*(?:\/\/|\/\*+|\*|<!--|\{\/\*)\s*ui-review-ignore\s+([a-z0-9.-]+)/i.exec(line);
    if (validMarker) found.push(validMarker[1]);
    if (anyMarkers.length > (validMarker ? 1 : 0)) {
      warnings.push({
        id: 'qa.ui.invalid-suppression-context',
        message: `UI review suppression must be a standalone source comment at ${file}:${index + 1}.`,
        paths: [file]
      });
    }
  }
  const valid = [];
  for (const ruleId of found) {
    if (UI_GENERICITY_RULE_IDS.includes(ruleId)) valid.push(ruleId);
    else warnings.push({ id: 'qa.ui.unknown-suppression', message: `Unknown UI review rule suppression: ${ruleId}.`, paths: [file] });
  }
  return [...new Set(valid)].sort();
}

function uiResult(options) {
  const reviewRequired = options.findings.length > 0;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: options.conflicts.length === 0,
    status: options.conflicts.length > 0 ? 'blocked' : reviewRequired ? 'review' : 'pass',
    reviewRequired,
    target: options.target,
    root: portable(path.relative(options.target, options.root) || '.'),
    summary: {
      candidateFiles: options.candidateFiles,
      scannedFiles: options.scannedFiles,
      findings: options.findings.length,
      suppressed: options.suppressions.length,
      skipped: options.skipped.length,
      truncated: options.truncated
    },
    findings: options.findings,
    suppressions: options.suppressions,
    skipped: options.skipped,
    warnings: options.warnings,
    conflicts: options.conflicts,
    guidance: 'Static findings are review candidates, not confirmed defects or completion evidence. Inspect the rendered UI before changing it.'
  };
}

function parseUiMaxFiles(value) {
  if (value === undefined || value === false) return 500;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10_000) {
    throw new Error('Invalid --max-files; expected an integer from 1 to 10000.');
  }
  return parsed;
}

function isInside(target, candidate) {
  const relative = path.relative(target, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function conflict(id, message, paths) {
  return { id, message, paths };
}

function portable(value) {
  return String(value).split(path.sep).join('/');
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n|\r/).length;
}

function evidenceLine(lines, line) {
  return trimEvidence(lines[Math.max(0, line - 1)] ?? '');
}

function trimEvidence(line) {
  const normalized = String(line).trim().replace(/\s+/g, ' ');
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
