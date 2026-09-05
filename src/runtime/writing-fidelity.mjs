import { createHash } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { noLinks, readBytes } from '../fs-safety.mjs';

const VALID_LANGUAGES = new Set(['auto', 'ko', 'en']);
const MAX_FILE_BYTES = 500_000;
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

export async function checkWritingFidelity(options) {
  const target = path.resolve(options.target ?? '.');
  const requestedLanguage = options.lang ?? 'auto';
  const warnings = [];
  const conflicts = [];
  if (!VALID_LANGUAGES.has(requestedLanguage)) {
    conflicts.push(conflict('writing-fidelity.invalid-language', `Invalid language: ${requestedLanguage}. Use auto, ko, or en.`));
  }
  const before = resolveDocument(target, options.before, 'before', conflicts);
  const after = resolveDocument(target, options.after, 'after', conflicts);
  if (conflicts.length) return emptyFidelityResult({ target, before, after, requestedLanguage, warnings, conflicts });

  const beforeText = await readDocument(before, conflicts);
  const afterText = await readDocument(after, conflicts);
  if (conflicts.length) return emptyFidelityResult({ target, before, after, requestedLanguage, warnings, conflicts });

  const detectedLanguage = detectLanguage(`${beforeText}\n${afterText}`);
  const language = requestedLanguage === 'auto' ? detectedLanguage : requestedLanguage;
  if (beforeText === afterText) {
    return fidelityResult({
      target,
      before,
      after,
      requestedLanguage,
      detectedLanguage,
      language,
      beforeText,
      afterText,
      changes: emptyChanges(),
      register: compareRegister(beforeText, afterText, language),
      rhetoric: compareRhetoric(beforeText, afterText, language),
      metrics: compareTextMetrics(beforeText, afterText, language),
      warnings,
      conflicts,
      status: 'not-applicable',
      reviewRequired: false,
      reviewReasons: []
    });
  }

  const changes = compareProtectedContent(beforeText, afterText);
  const register = compareRegister(beforeText, afterText, language);
  const rhetoric = compareRhetoric(beforeText, afterText, language);
  const metrics = compareTextMetrics(beforeText, afterText, language);
  const reviewReasons = protectedChangeReasons(changes);
  if (register.shifted) reviewReasons.push('register-shift');
  if (rhetoric.annihilated.length > 0) reviewReasons.push('rhetorical-structure-removed');
  const reviewRequired = reviewReasons.length > 0;

  return fidelityResult({
    target,
    before,
    after,
    requestedLanguage,
    detectedLanguage,
    language,
    beforeText,
    afterText,
    changes,
    register,
    rhetoric,
    metrics,
    warnings,
    conflicts,
    status: reviewRequired ? 'review' : 'pass',
    reviewRequired,
    reviewReasons: [...new Set(reviewReasons)]
  });
}

function resolveDocument(target, value, role, conflicts) {
  if (typeof value !== 'string' || value.trim() === '') {
    conflicts.push(conflict(`writing-fidelity.${role}-missing`, `Missing --${role} path.`));
    return { path: target, relativePath: '' };
  }
  if (path.isAbsolute(value)) {
    conflicts.push(conflict(`writing-fidelity.${role}-boundary`, `--${role} must be a target-relative path.`));
    return { path: value, relativePath: value };
  }
  const resolved = path.resolve(target, value.replaceAll('\\', '/'));
  const relative = path.relative(target, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    conflicts.push(conflict(`writing-fidelity.${role}-boundary`, `--${role} must stay inside the target project.`));
  }
  return { path: resolved, relativePath: portable(relative) };
}

async function readDocument(document, conflicts) {
  try { await noLinks(document.path); }
  catch {
    conflicts.push(conflict('writing-fidelity.file-symlink', `Linked input paths are not supported: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  if (!existsSync(document.path)) {
    conflicts.push(conflict('writing-fidelity.file-missing', `File does not exist: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  const info = await lstat(document.path);
  if (info.isSymbolicLink()) {
    conflicts.push(conflict('writing-fidelity.file-symlink', `Symbolic-link inputs are not supported: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  if (!info.isFile()) {
    conflicts.push(conflict('writing-fidelity.not-file', `Path is not a file: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  if (info.size > MAX_FILE_BYTES) {
    conflicts.push(conflict('writing-fidelity.file-too-large', `File exceeds ${MAX_FILE_BYTES} bytes: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  const content = await readBytes(document.path, MAX_FILE_BYTES);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(content);
  } catch {
    conflicts.push(conflict('writing-fidelity.invalid-utf8', `File must be valid UTF-8: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  if (CONTROL_CHAR_RE.test(text)) {
    conflicts.push(conflict('writing-fidelity.binary-or-control', `File appears to contain binary or control characters: ${document.relativePath}`, [document.relativePath]));
    return '';
  }
  return text;
}

function compareProtectedContent(before, after) {
  const beforeFacts = extractProtectedContent(before);
  const afterFacts = extractProtectedContent(after);
  return {
    numbers: compareValues(beforeFacts.numbers, afterFacts.numbers),
    versions: compareValues(beforeFacts.versions, afterFacts.versions),
    urls: compareValues(beforeFacts.urls, afterFacts.urls),
    commands: compareValues(beforeFacts.commands, afterFacts.commands),
    paths: compareValues(beforeFacts.paths, afterFacts.paths),
    codeSpans: compareValues(beforeFacts.codeSpans, afterFacts.codeSpans),
    codeFences: compareValues(beforeFacts.codeFences, afterFacts.codeFences),
    identifiers: compareValues(beforeFacts.identifiers, afterFacts.identifiers),
    warnings: compareValues(beforeFacts.warnings, afterFacts.warnings),
    structure: compareStructure(beforeFacts.structure, afterFacts.structure)
  };
}

function extractProtectedContent(text) {
  const versions = matches(text, /\bv?\d+\.\d+(?:\.\d+)+(?:-[A-Za-z0-9.-]+)?\b/g);
  const versionRanges = matchRanges(text, /\bv?\d+\.\d+(?:\.\d+)+(?:-[A-Za-z0-9.-]+)?\b/g);
  const numbers = [];
  const numberPattern = /(?<![A-Za-z0-9_.])\d[\d,]*(?:\.\d+)?\s*(?:만|천|백)?(?![A-Za-z0-9_.])/g;
  for (const match of text.matchAll(numberPattern)) {
    const index = match.index ?? 0;
    if (!versionRanges.some((range) => index >= range.start && index < range.end)) numbers.push(normalizeNumber(match[0]));
  }
  const urls = matches(text, /https?:\/\/[^\s)\]}>"']+/g).map((value) => value.replace(/[.,;:!?]+$/, ''));
  const codeSpans = matches(text, /`[^`\r\n]+`/g).map((value) => value.slice(1, -1));
  const codeFences = [...text.matchAll(/```([^\r\n`]*)\r?\n([\s\S]*?)```|~~~([^\r\n~]*)\r?\n([\s\S]*?)~~~/g)].map((match) => {
    const language = (match[1] ?? match[3] ?? '').trim().toLowerCase();
    const body = match[2] ?? match[4] ?? '';
    return `${language || 'plain'}:${body.length}:${sha256(body).slice(0, 16)}`;
  });
  const commandPattern = /^(?:\s*(?:\$|PS>|>)\s*)?(?:npm|pnpm|yarn|bun|node|python|py|aapb|npx|git|gh|tea|rg|pwsh|powershell|curl)\s+.+$/gim;
  const commands = matches(text, commandPattern).map(normalizeWhitespace);
  for (const span of codeSpans) {
    if (/^(?:npm|pnpm|yarn|bun|node|python|py|aapb|npx|git|gh|tea|rg|pwsh|powershell|curl)\s+/i.test(span)) {
      commands.push(normalizeWhitespace(span));
    }
  }
  const pathPattern = /(?:[A-Za-z]:[\\/](?:[^\s`"'<>|:*?]+[\\/])*[^\s`"'<>|:*?]+|(?:\.{0,2}[\\/])?(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.[A-Za-z0-9_-]+)/g;
  const paths = matches(text, pathPattern).filter((value) => !urls.some((url) => url.includes(value))).map((value) => value.replaceAll('\\', '/'));
  const identifiers = matches(text, /\b(?:[A-Za-z_$][A-Za-z0-9_$]*\.)+[A-Za-z_$][A-Za-z0-9_$]*\b|\b[A-Z][A-Za-z0-9]*(?:API|SDK|CLI|URL|JSON|HTTP|MCP)\b/g);
  const warnings = text.split(/\r?\n|\r/)
    .filter((line) => /(?:\bWARNING\b|\bCAUTION\b|\bIMPORTANT\b|경고|주의|중요)/i.test(line))
    .map((line) => normalizeWhitespace(line).slice(0, 240));
  return {
    numbers: sortedUnique(numbers),
    versions: sortedUnique(versions),
    urls: sortedUnique(urls),
    commands: sortedUnique(commands),
    paths: sortedUnique(paths),
    codeSpans: sortedUnique(codeSpans),
    codeFences: sortedUnique(codeFences),
    identifiers: sortedUnique(identifiers),
    warnings: sortedUnique(warnings),
    structure: structureCounts(text)
  };
}

function compareTextMetrics(before, after, language) {
  const beforeSentences = splitSentenceUnits(before, language);
  const afterSentences = splitSentenceUnits(after, language);
  const matches = matchSentenceUnits(beforeSentences, afterSentences);
  const unchangedCharacters = matches.reduce((sum, pair) => sum + Math.min(pair.before.length, pair.after.length), 0);
  const denominator = before.length + after.length;
  const changedCharacters = Math.max(0, denominator - (2 * unchangedCharacters));
  const sentenceDenominator = beforeSentences.length + afterSentences.length;
  const touchedSentences = Math.max(0, sentenceDenominator - (2 * matches.length));
  return {
    beforeCharacters: before.length,
    afterCharacters: after.length,
    characterChangeRate: round(denominator === 0 ? 0 : changedCharacters / denominator),
    beforeSentences: beforeSentences.length,
    afterSentences: afterSentences.length,
    sentenceTouchRatio: round(sentenceDenominator === 0 ? 0 : touchedSentences / sentenceDenominator)
  };
}

function matchSentenceUnits(before, after) {
  const queues = new Map();
  after.forEach((sentence) => {
    const key = normalizeWhitespace(sentence);
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key).push(sentence);
  });
  const pairs = [];
  for (const sentence of before) {
    const queue = queues.get(normalizeWhitespace(sentence));
    if (queue?.length) pairs.push({ before: sentence, after: queue.shift() });
  }
  return pairs;
}

function compareRegister(before, after, language) {
  if (language !== 'ko') return { applicable: false, before: 'not-applicable', after: 'not-applicable', shifted: false };
  const beforeRegister = koreanRegister(before);
  const afterRegister = koreanRegister(after);
  return {
    applicable: true,
    before: beforeRegister.dominant,
    after: afterRegister.dominant,
    shifted: !['unknown', 'mixed'].includes(beforeRegister.dominant) &&
      !['unknown', 'mixed'].includes(afterRegister.dominant) &&
      beforeRegister.dominant !== afterRegister.dominant,
    counts: { before: beforeRegister.counts, after: afterRegister.counts }
  };
}

function koreanRegister(text) {
  const counts = {
    formal: count(text, /(?:합니다|됩니다|있습니다|없습니다|하십시오|하세요)(?:[.!?]|\s|$)/g),
    plain: count(text, /(?:한다|된다|이다|있다|없다|했다)(?:[.!?]|\s|$)/g),
    conversational: count(text, /(?:해요|돼요|예요|이에요|죠)(?:[.!?]|\s|$)/g)
  };
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (total < 3) return { dominant: 'unknown', counts };
  const [dominant, value] = Object.entries(counts).sort((left, right) => right[1] - left[1])[0];
  return { dominant: value / total >= 0.6 ? dominant : 'mixed', counts };
}

function compareRhetoric(before, after, language) {
  const patterns = language === 'ko'
    ? {
        'contrast-pair': /(?:뿐만 아니라|반면(?:에)?|그러나|하지만)/g,
        'negative-positive-pair': /(?:아니라[^.!?\n]{0,80}(?:이다|한다|된다))/g,
        'explicit-result-frame': /(?:때문에|따라서|결과적으로)/g
      }
    : {
        'contrast-pair': /\b(?:not only|but also|however|whereas)\b/gi,
        'negative-positive-pair': /\bnot\b[^.!?\n]{0,80}\bbut\b/gi,
        'explicit-result-frame': /\b(?:because|therefore|as a result)\b/gi
      };
  const beforeCounts = Object.fromEntries(Object.entries(patterns).map(([id, pattern]) => [id, count(before, pattern)]));
  const afterCounts = Object.fromEntries(Object.entries(patterns).map(([id, pattern]) => [id, count(after, pattern)]));
  const annihilated = Object.keys(patterns).filter((id) => beforeCounts[id] >= 2 && afterCounts[id] === 0);
  return { before: beforeCounts, after: afterCounts, annihilated };
}

function protectedChangeReasons(changes) {
  const reasons = [];
  for (const [name, change] of Object.entries(changes)) {
    if (name === 'structure') {
      if (change.changed) reasons.push('document-structure-changed');
    } else if (change.added.length > 0 || change.removed.length > 0) {
      reasons.push(`${name}-changed`);
    }
  }
  return reasons;
}

function fidelityResult(options) {
  return {
    schemaVersion: '1',
    kind: 'runtime.writing-fidelity-check',
    ok: options.conflicts.length === 0,
    status: options.status,
    reviewRequired: options.reviewRequired,
    target: options.target,
    before: options.before.relativePath,
    after: options.after.relativePath,
    language: {
      requested: options.requestedLanguage,
      detected: options.detectedLanguage,
      analyzed: options.language
    },
    mode: { writes: false, network: false, localOnly: true, evidenceOnly: true },
    metrics: options.metrics,
    changes: options.changes,
    register: options.register,
    rhetoric: options.rhetoric,
    reviewReasons: options.reviewReasons,
    warnings: options.warnings,
    conflicts: options.conflicts,
    guidance: 'This report is comparison evidence. Change-rate values do not automatically accept or reject an edit.'
  };
}

function emptyFidelityResult(options) {
  return fidelityResult({
    ...options,
    detectedLanguage: 'unknown',
    language: options.requestedLanguage === 'auto' ? 'unknown' : options.requestedLanguage,
    metrics: { beforeCharacters: 0, afterCharacters: 0, characterChangeRate: 0, beforeSentences: 0, afterSentences: 0, sentenceTouchRatio: 0 },
    changes: emptyChanges(),
    register: { applicable: false, before: 'unknown', after: 'unknown', shifted: false },
    rhetoric: { before: {}, after: {}, annihilated: [] },
    reviewReasons: [],
    status: 'not-applicable',
    reviewRequired: false
  });
}

function emptyChanges() {
  const empty = () => ({ added: [], removed: [], changed: false });
  return {
    numbers: empty(), versions: empty(), urls: empty(), commands: empty(), paths: empty(),
    codeSpans: empty(), codeFences: empty(), identifiers: empty(), warnings: empty(),
    structure: { before: structureCounts(''), after: structureCounts(''), changed: false }
  };
}

function compareValues(before, after) {
  const added = after.filter((value) => !before.includes(value));
  const removed = before.filter((value) => !after.includes(value));
  return { added, removed, changed: added.length > 0 || removed.length > 0 };
}

function structureCounts(text) {
  const lines = text.split(/\r?\n|\r/);
  return {
    headings: lines.filter((line) => /^#{1,6}\s+/.test(line)).length,
    listItems: lines.filter((line) => /^\s*(?:[-*+] |\d+\. )/.test(line)).length,
    blockquotes: lines.filter((line) => /^\s*>\s?/.test(line)).length,
    tableRows: lines.filter((line) => /^\s*\|.*\|\s*$/.test(line)).length,
    codeFences: lines.filter((line) => /^\s*(?:```|~~~)/.test(line)).length / 2
  };
}

function compareStructure(before, after) {
  return { before, after, changed: JSON.stringify(before) !== JSON.stringify(after) };
}

function splitSentenceUnits(text, language) {
  const pattern = language === 'ko' ? /(?<=[.!?。])\s+|\r?\n+/ : /(?<=[.!?])\s+|\r?\n+/;
  return text.split(pattern).map((value) => value.trim()).filter(Boolean);
}

function normalizeNumber(value) {
  const normalized = value.replace(/\s+/g, '').replace(/,/g, '');
  const unit = normalized.match(/(만|천|백)$/)?.[1];
  const base = Number(unit ? normalized.slice(0, -1) : normalized);
  const multiplier = unit === '만' ? 10_000 : unit === '천' ? 1_000 : unit === '백' ? 100 : 1;
  return Number.isFinite(base) ? String(base * multiplier) : normalized;
}

function matches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[0]);
}

function matchRanges(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => ({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }));
}

function count(text, pattern) {
  return matches(text, new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)).length;
}

function detectLanguage(text) {
  const hangul = count(text, /[\uAC00-\uD7AF]/g);
  const latin = count(text, /[A-Za-z]/g);
  return hangul >= 20 && hangul >= latin / 2 ? 'ko' : 'en';
}

function normalizeWhitespace(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function portable(value) {
  return String(value).split(path.sep).join('/');
}

function round(value) {
  return Number(value.toFixed(6));
}

function conflict(id, message, paths = []) {
  return { id, message, paths };
}
