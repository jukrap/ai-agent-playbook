import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { runPythonWritingNaturalness } from './python-engine.mjs';

const MAX_FILE_BYTES = 200_000;
const MAX_REPORT_FILES = 50;
const VALID_LANGUAGES = new Set(['auto', 'ko', 'en']);
const VALID_ENGINES = new Set(['auto', 'js', 'python']);
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
const REPORT_EXTENSIONS = new Set(['.md', '.mdx', '.txt']);
const REPORT_EXCLUDED_DIRS = new Set([
  '.git',
  '.ai-agent-playbook',
  '.ai-playbook',
  'ai-playbook',
  '.venv',
  '.next',
  '.turbo',
  '_reference',
  '_work',
  'build',
  'coverage',
  'dist',
  'node_modules'
]);

const COMMON_PATTERNS = [
  {
    id: 'writing.promotional-intensity.en',
    lang: 'en',
    category: 'tone',
    severity: 'medium',
    pattern: /\b(crucial|pivotal|transformative|game[- ]changing|seamless|robust|comprehensive|cutting[- ]edge|powerful|unlock|elevate|leverage)\b/gi,
    message: 'Promotional or generic intensity words may make the text feel less specific.',
    suggestion: 'Replace broad praise with concrete behavior, evidence, or a plainer verb.'
  },
  {
    id: 'writing.promotional-intensity.ko',
    lang: 'ko',
    category: 'tone',
    severity: 'medium',
    pattern: /(강력한|혁신적인|완벽한|압도적인|극대화|최적의|획기적인|매끄러운|종합적인|탁월한)/g,
    message: '과한 강조어가 반복되면 홍보문이나 AI식 요약처럼 보일 수 있습니다.',
    suggestion: '주장보다 실제 기능, 한계, 조건, 검증 근거를 짧게 적으세요.'
  },
  {
    id: 'writing.ai-phrase.en',
    lang: 'en',
    category: 'naturalness',
    severity: 'medium',
    pattern: /\b(in today's (?:fast[- ]paced|digital) (?:world|landscape)|serves as a testament|it is important to note|delve into|tapestry|realm|landscape|underscores|highlights the importance)\b/gi,
    message: 'Common AI-writing phrases are present.',
    suggestion: 'Use the direct subject and the specific claim instead of a broad framing phrase.'
  },
  {
    id: 'writing.parallel-cliche.en',
    lang: 'en',
    category: 'rhythm',
    severity: 'low',
    pattern: /\bnot only\b[\s\S]{0,120}\bbut also\b/gi,
    message: 'The “not only ... but also” construction can sound formulaic when overused.',
    suggestion: 'Split the two claims or keep only the stronger one.'
  },
  {
    id: 'writing.participle-padding.en',
    lang: 'en',
    category: 'sentence-shape',
    severity: 'low',
    pattern: /,\s+(highlighting|underscoring|ensuring|reflecting|showcasing|enabling|allowing)\b/gi,
    message: 'Comma-led participle clauses can pad sentences without adding precision.',
    suggestion: 'Turn the clause into a concrete verb, or remove it when the meaning is already clear.'
  },
  {
    id: 'writing.translationese.ko',
    lang: 'ko',
    category: 'translationese',
    severity: 'medium',
    pattern: /(중요한 역할을 합니다|기여합니다|이를 통해|뿐만 아니라|바탕으로|관점에서|측면에서|것으로 보입니다|할 수 있습니다)/g,
    message: '한국어 문서에서 자주 보이는 번역투/템플릿 표현이 있습니다.',
    suggestion: '주어와 행동을 앞에 두고, 조건과 결과를 더 짧은 문장으로 나누세요.'
  },
  {
    id: 'writing.passive-nominalization.ko',
    lang: 'ko',
    category: 'sentence-shape',
    severity: 'low',
    pattern: /(제공됩니다|수행됩니다|진행됩니다|구성됩니다|처리됩니다|되어집니다)/g,
    message: '수동형이나 명사화가 많으면 문장이 멀어지고 딱딱해집니다.',
    suggestion: '가능하면 누가 무엇을 하는지 드러나는 능동형으로 바꾸세요.'
  }
];

export async function checkWritingNaturalness(options) {
  const target = path.resolve(options.target ?? '.');
  const requestedLanguage = options.lang ?? 'auto';
  const requestedEngine = options.engine ?? 'auto';
  const filePath = options.filePath ?? options.path;
  const conflicts = [];
  const warnings = [];

  if (!VALID_LANGUAGES.has(requestedLanguage)) {
    conflicts.push(conflict('writing-naturalness.invalid-language', `Invalid language: ${requestedLanguage}. Use auto, ko, or en.`));
  }
  if (!VALID_ENGINES.has(requestedEngine)) {
    conflicts.push(conflict('writing-naturalness.invalid-engine', `Invalid engine: ${requestedEngine}. Use auto, js, or python.`));
  }
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    conflicts.push(conflict('writing-naturalness.missing-path', 'Missing target-relative file path.'));
  }

  const resolved = filePath ? resolveInsideTarget(target, filePath) : { ok: false, path: target, relativePath: '' };
  if (filePath && !resolved.ok) {
    conflicts.push(conflict('writing-naturalness.path-boundary', 'Path must stay inside the target project.'));
  }

  if (conflicts.length) {
    return emptyReport({ target, filePath: filePath ?? '', requestedLanguage, requestedEngine, conflicts, warnings });
  }

  let info;
  try {
    info = await stat(resolved.path);
  } catch {
    conflicts.push(conflict('writing-naturalness.file-missing', `File does not exist: ${resolved.relativePath}`));
    return emptyReport({ target, filePath: resolved.relativePath, requestedLanguage, requestedEngine, conflicts, warnings });
  }

  if (!info.isFile()) {
    conflicts.push(conflict('writing-naturalness.not-file', `Path is not a file: ${resolved.relativePath}`));
  }
  if (info.size > MAX_FILE_BYTES) {
    conflicts.push(conflict('writing-naturalness.file-too-large', `File is too large for naturalness check: ${info.size} bytes.`));
  }
  if (conflicts.length) {
    return emptyReport({ target, filePath: resolved.relativePath, requestedLanguage, requestedEngine, conflicts, warnings });
  }

  const text = await readFile(resolved.path, 'utf8');
  if (CONTROL_CHAR_RE.test(text)) {
    conflicts.push(conflict('writing-naturalness.binary-or-control', 'File appears to contain binary or control characters.'));
    return emptyReport({ target, filePath: resolved.relativePath, requestedLanguage, requestedEngine, conflicts, warnings });
  }

  const analysisText = normalizeProseForAnalysis(text);
  const detectedLanguage = detectLanguage(analysisText || text);
  const analyzedLanguage = requestedLanguage === 'auto' ? detectedLanguage : requestedLanguage;
  const jsFindings = [
    ...patternFindings(analysisText, analyzedLanguage),
    ...shapeFindings(analysisText, analyzedLanguage)
  ].map((finding) => ({ engine: 'js', ...finding }));
  const engineState = {
    requested: requestedEngine,
    used: ['js'],
    unavailable: []
  };
  let findings = jsFindings;
  if (requestedEngine !== 'js') {
    const python = await runPythonWritingNaturalness({
      repoRoot: options.repoRoot,
      text: analysisText,
      lang: analyzedLanguage,
      filePath: resolved.relativePath
    });
    if (python.ok && python.result?.ok) {
      engineState.used.push('python');
      findings = [
        ...findings,
        ...normalizePythonFindings(python.result.findings)
      ];
    } else {
      const unavailable = python.unavailable ?? {
        id: 'python-engine.unavailable',
        message: 'Python engine is unavailable.'
      };
      engineState.unavailable.push(unavailable);
      warnings.push({
        id: unavailable.id,
        message: unavailable.message
      });
    }
  }
  findings = findings.slice(0, 40);

  return {
    schemaVersion: '1',
    kind: 'runtime.writing-naturalness-check',
    ok: true,
    target,
    path: resolved.relativePath,
    language: {
      requested: requestedLanguage,
      detected: detectedLanguage,
      analyzed: analyzedLanguage
    },
    mode: {
      writes: false,
      network: false,
      localOnly: true
    },
    engines: engineState,
    summary: summarize(text, findings, analysisText),
    findings,
    warnings,
    conflicts
  };
}

export async function checkWritingNaturalnessReport(options) {
  const target = path.resolve(options.target ?? '.');
  const requestedLanguage = options.lang ?? 'auto';
  const requestedEngine = options.engine ?? 'auto';
  const rootPath = options.rootPath ?? options.path ?? '.';
  const maxFiles = normalizeMaxFiles(options.maxFiles);
  const warnings = [];
  const conflicts = [];

  if (!VALID_LANGUAGES.has(requestedLanguage)) {
    conflicts.push(conflict('writing-naturalness.invalid-language', `Invalid language: ${requestedLanguage}. Use auto, ko, or en.`));
  }
  if (!VALID_ENGINES.has(requestedEngine)) {
    conflicts.push(conflict('writing-naturalness.invalid-engine', `Invalid engine: ${requestedEngine}. Use auto, js, or python.`));
  }

  const resolved = resolveReportRoot(target, rootPath);
  if (!resolved.ok) {
    conflicts.push(conflict('writing-naturalness.path-boundary', 'Report root must stay inside the target project.'));
  }
  if (conflicts.length) {
    return emptyReportSet({ target, rootPath, requestedLanguage, requestedEngine, conflicts, warnings });
  }

  let info;
  try {
    info = await stat(resolved.path);
  } catch {
    conflicts.push(conflict('writing-naturalness.file-missing', `Report root does not exist: ${resolved.relativePath}`));
    return emptyReportSet({ target, rootPath: resolved.relativePath, requestedLanguage, requestedEngine, conflicts, warnings });
  }
  if (!info.isDirectory()) {
    conflicts.push(conflict('writing-naturalness.not-directory', `Report root is not a directory: ${resolved.relativePath}`));
    return emptyReportSet({ target, rootPath: resolved.relativePath, requestedLanguage, requestedEngine, conflicts, warnings });
  }

  const files = await collectReportFiles(resolved.path, target, maxFiles + 1);
  const truncated = files.length > maxFiles;
  const selectedFiles = files.slice(0, maxFiles);
  if (truncated) {
    warnings.push({
      id: 'writing-naturalness.report-truncated',
      message: `Report limited to ${maxFiles} file(s). Narrow --root or raise --max-files.`
    });
  }

  const reports = [];
  for (const file of selectedFiles) {
    const report = await checkWritingNaturalness({
      repoRoot: options.repoRoot,
      target,
      filePath: file,
      lang: requestedLanguage,
      engine: requestedEngine
    });
    reports.push(report);
  }

  const enginesUsed = unique(reports.flatMap((report) => report.engines.used));
  const engineUnavailable = uniqueById(reports.flatMap((report) => report.engines.unavailable));
  const reportWarnings = reports.flatMap((report) => report.warnings ?? []);
  const fileConflicts = reports.flatMap((report) => report.conflicts ?? []);
  const severity = { high: 0, medium: 0, low: 0 };
  const categories = {};
  const languages = {};
  for (const report of reports) {
    for (const [level, count] of Object.entries(report.summary.severity)) {
      severity[level] += count;
    }
    for (const [category, count] of Object.entries(report.summary.categories)) {
      categories[category] = (categories[category] ?? 0) + count;
    }
    languages[report.language.analyzed] = (languages[report.language.analyzed] ?? 0) + 1;
  }

  return {
    schemaVersion: '1',
    kind: 'runtime.writing-naturalness-report',
    ok: reports.every((report) => report.ok),
    target,
    root: resolved.relativePath,
    language: {
      requested: requestedLanguage,
      analyzed: languages
    },
    mode: {
      writes: false,
      network: false,
      localOnly: true
    },
    engines: {
      requested: requestedEngine,
      used: enginesUsed,
      unavailable: engineUnavailable
    },
    summary: {
      files: reports.length,
      candidateFiles: files.length,
      truncated,
      findings: reports.reduce((sum, report) => sum + report.summary.findings, 0),
      severity,
      categories
    },
    files: reports.map((report) => ({
      path: report.path,
      ok: report.ok,
      language: report.language,
      engines: report.engines,
      summary: report.summary,
      topFindings: report.findings.slice(0, 5),
      warnings: report.warnings,
      conflicts: report.conflicts
    })),
    warnings: [...warnings, ...reportWarnings],
    conflicts: [...conflicts, ...fileConflicts]
  };
}

function resolveInsideTarget(target, filePath) {
  if (path.isAbsolute(filePath)) return { ok: false, path: filePath, relativePath: filePath };
  const normalized = filePath.replaceAll('\\', '/');
  const resolved = path.resolve(target, normalized);
  const relativePath = path.relative(target, resolved);
  const ok = relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  return {
    ok,
    path: resolved,
    relativePath: relativePath.replaceAll('\\', '/')
  };
}

function detectLanguage(text) {
  const hangul = countMatches(text, /[\uAC00-\uD7AF]/g);
  const latin = countMatches(text, /[A-Za-z]/g);
  if (hangul >= 20 && hangul >= latin / 2) return 'ko';
  return 'en';
}

function patternFindings(text, language) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  for (const rule of COMMON_PATTERNS.filter((item) => item.lang === language)) {
    const evidence = [];
    for (let lineIndex = 0; lineIndex < lines.length && evidence.length < 5; lineIndex += 1) {
      const line = lines[lineIndex];
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        evidence.push({
          line: lineIndex + 1,
          excerpt: compactExcerpt(line)
        });
      }
    }
    if (evidence.length) {
      findings.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        message: evidence.length > 1 ? `${rule.message} (${evidence.length} occurrences shown)` : rule.message,
        evidence,
        suggestion: rule.suggestion
      });
    }
  }
  return findings;
}

function shapeFindings(text, language) {
  const findings = [];
  const nonEmptyLines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  const bulletLines = nonEmptyLines.filter((line) => /^\s*[-*+]\s+/.test(line));
  if (nonEmptyLines.length >= 16 && bulletLines.length / nonEmptyLines.length > 0.6) {
    findings.push({
      id: 'writing.excessive-bullet-density',
      category: 'structure',
      severity: 'low',
      message: 'Most lines are bullets, which can flatten emphasis and make every point feel equally weighted.',
      evidence: bulletLines.slice(0, 3).map((line) => ({ line: lineNumberFor(text, line), excerpt: compactExcerpt(line) })),
      suggestion: 'Group related bullets, promote only the main decisions, and move secondary details into prose or tables.'
    });
  }

  const sentences = splitSentences(text, language);
  if (sentences.length >= 10) {
    const lengths = sentences.map((sentence) => sentence.length);
    const average = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
    const variance = lengths.reduce((sum, length) => sum + Math.pow(length - average, 2), 0) / lengths.length;
    if (Math.sqrt(variance) < average * 0.22) {
      findings.push({
        id: 'writing.uniform-sentence-rhythm',
        category: 'rhythm',
        severity: 'low',
        message: 'Sentence lengths are unusually uniform, which can make writing feel mechanically paced.',
        evidence: sentences.slice(0, 3).map((sentence) => ({ line: lineNumberFor(text, sentence), excerpt: compactExcerpt(sentence) })),
        suggestion: 'Vary sentence length by splitting dense claims and leaving short factual sentences where they help.'
      });
    }
  }

  if (language === 'ko') {
    const connectors = countMatches(text, /(?:^|[.!?\n]\s*)(또한|그리고|하지만|따라서|즉|결과적으로)/g);
    if (connectors >= 4) {
      findings.push({
        id: 'writing.connector-overuse.ko',
        category: 'flow',
        severity: 'low',
        message: '문장 시작 접속어가 반복되어 글의 리듬이 설명문처럼 굳어질 수 있습니다.',
        evidence: collectRegexEvidence(text, /(?:^|[.!?\n]\s*)(또한|그리고|하지만|따라서|즉|결과적으로)[^\n.!?]*/g, 3),
        suggestion: '연결어를 줄이고, 문단 순서나 명확한 주어로 흐름을 만들세요.'
      });
    }
    const latinWords = countMatches(text, /\b[A-Za-z][A-Za-z0-9_-]{2,}\b/g);
    const hangulWords = countMatches(text, /[\uAC00-\uD7AF]+/g);
    if (hangulWords >= 40 && latinWords / Math.max(hangulWords, 1) > 0.18) {
      findings.push({
        id: 'writing.english-density.ko',
        category: 'readability',
        severity: 'medium',
        message: '한국어 문서 안의 영어 용어 비율이 높아 독자가 문맥을 따라가기 어려울 수 있습니다.',
        evidence: collectRegexEvidence(text, /\b[A-Za-z][A-Za-z0-9_-]{2,}\b/g, 5),
        suggestion: '처음 등장하는 용어만 원문을 병기하고, 이후에는 한국어 역할명이나 더 짧은 표현을 쓰세요.'
      });
    }
  }

  if (language === 'en') {
    const emDashes = countMatches(text, /—/g);
    if (emDashes >= 3) {
      findings.push({
        id: 'writing.em-dash-overuse.en',
        category: 'punctuation',
        severity: 'low',
        message: 'Repeated em dashes can make the prose feel overly staged.',
        evidence: collectRegexEvidence(text, /[^\n]*—[^\n]*/g, 3),
        suggestion: 'Use periods, commas, or parentheses where the aside is genuinely secondary.'
      });
    }
  }

  return findings;
}

function splitSentences(text, language) {
  const separator = language === 'ko' ? /[.!?。]\s+|\n+/ : /[.!?]\s+|\n+/;
  return text
    .split(separator)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 20);
}

function summarize(text, findings, analysisText = text) {
  const counts = { high: 0, medium: 0, low: 0 };
  const categories = {};
  for (const finding of findings) {
    counts[finding.severity] += 1;
    categories[finding.category] = (categories[finding.category] ?? 0) + 1;
  }
  return {
    characters: text.length,
    analyzedCharacters: analysisText.length,
    lines: text.split(/\r?\n/).length,
    findings: findings.length,
    severity: counts,
    categories
  };
}

function normalizeProseForAnalysis(text) {
  const lines = text.split(/\r?\n/);
  const normalized = [];
  let fenced = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(```|~~~)/.test(trimmed)) {
      fenced = !fenced;
      normalized.push('');
      continue;
    }
    if (fenced || isNonProseLine(trimmed)) {
      normalized.push('');
      continue;
    }
    normalized.push(line
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, (_, label) => label ?? ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/<[^>]+>/g, ' '));
  }
  return normalized.join('\n');
}

function isNonProseLine(trimmed) {
  if (trimmed === '') return true;
  if (/^<\/?[a-z][^>]*>$/i.test(trimmed)) return true;
  if (/^<img\b/i.test(trimmed)) return true;
  if (/^\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)$/.test(trimmed)) return true;
  if (/^!\[[^\]]*\]\([^)]+\)$/.test(trimmed)) return true;
  if (/^\|?[\s:|.-]+\|?$/.test(trimmed)) return true;
  if (/^[-*+]\s+`[^`]+`\s*(?:-|:)/.test(trimmed)) return false;
  if (/^(?:npm|pnpm|yarn|node|python|py|aapb|npx|git|rg|pwsh|powershell|curl)\s/.test(trimmed)) return true;
  if (/^[A-Za-z]:[\\/]/.test(trimmed) || /^\.?[\\/]/.test(trimmed)) return true;
  return false;
}

function normalizePythonFindings(findings) {
  if (!Array.isArray(findings)) return [];
  return findings
    .filter((finding) => finding && typeof finding.id === 'string')
    .map((finding) => ({
      id: finding.id,
      engine: 'python',
      category: finding.category ?? 'naturalness',
      severity: ['high', 'medium', 'low'].includes(finding.severity) ? finding.severity : 'low',
      message: finding.message ?? finding.id,
      evidence: Array.isArray(finding.evidence) ? finding.evidence : [],
      suggestion: finding.suggestion ?? ''
    }));
}

function emptyReport({ target, filePath, requestedLanguage, requestedEngine = 'auto', conflicts, warnings }) {
  return {
    schemaVersion: '1',
    kind: 'runtime.writing-naturalness-check',
    ok: false,
    target,
    path: filePath,
    language: {
      requested: requestedLanguage,
      detected: 'unknown',
      analyzed: requestedLanguage === 'auto' ? 'unknown' : requestedLanguage
    },
    mode: {
      writes: false,
      network: false,
      localOnly: true
    },
    engines: {
      requested: requestedEngine,
      used: [],
      unavailable: []
    },
    summary: {
      characters: 0,
      lines: 0,
      findings: 0,
      severity: { high: 0, medium: 0, low: 0 },
      categories: {}
    },
    findings: [],
    warnings,
    conflicts
  };
}

function emptyReportSet({ target, rootPath, requestedLanguage, requestedEngine = 'auto', conflicts, warnings }) {
  return {
    schemaVersion: '1',
    kind: 'runtime.writing-naturalness-report',
    ok: false,
    target,
    root: rootPath,
    language: {
      requested: requestedLanguage,
      analyzed: {}
    },
    mode: {
      writes: false,
      network: false,
      localOnly: true
    },
    engines: {
      requested: requestedEngine,
      used: [],
      unavailable: []
    },
    summary: {
      files: 0,
      candidateFiles: 0,
      truncated: false,
      findings: 0,
      severity: { high: 0, medium: 0, low: 0 },
      categories: {}
    },
    files: [],
    warnings,
    conflicts
  };
}

function resolveReportRoot(target, rootPath) {
  if (typeof rootPath !== 'string' || rootPath.trim() === '') {
    return { ok: false, path: target, relativePath: '' };
  }
  if (path.isAbsolute(rootPath)) return { ok: false, path: rootPath, relativePath: rootPath };
  const normalized = rootPath.replaceAll('\\', '/');
  const resolved = path.resolve(target, normalized);
  const relativePath = path.relative(target, resolved);
  const ok = !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  return {
    ok,
    path: resolved,
    relativePath: relativePath === '' ? '.' : relativePath.replaceAll('\\', '/')
  };
}

async function collectReportFiles(rootPath, target, limit) {
  const files = [];
  await walk(rootPath);
  files.sort();
  return files;

  async function walk(current) {
    if (files.length >= limit) return;
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= limit) return;
      if (entry.name.startsWith('.') && entry.name !== '.ai-agent-playbook') {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      const rel = path.relative(target, fullPath).replaceAll('\\', '/');
      if (entry.isDirectory()) {
        if (REPORT_EXCLUDED_DIRS.has(entry.name)) continue;
        await walk(fullPath);
      } else if (entry.isFile() && REPORT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(rel);
      }
    }
  }
}

function normalizeMaxFiles(value) {
  if (value === undefined || value === false) return 20;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 20;
  return Math.min(parsed, MAX_REPORT_FILES);
}

function collectRegexEvidence(text, regex, limit) {
  const evidence = [];
  const lines = text.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length && evidence.length < limit; lineIndex += 1) {
    regex.lastIndex = 0;
    if (regex.test(lines[lineIndex])) {
      evidence.push({
        line: lineIndex + 1,
        excerpt: compactExcerpt(lines[lineIndex])
      });
    }
  }
  return evidence;
}

function countMatches(text, regex) {
  return Array.from(text.matchAll(regex)).length;
}

function lineNumberFor(text, excerpt) {
  const index = text.indexOf(excerpt);
  if (index < 0) return 1;
  return text.slice(0, index).split(/\r?\n/).length;
}

function compactExcerpt(value) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 180);
}

function conflict(id, message) {
  return { id, message };
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueById(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value || typeof value.id !== 'string' || seen.has(value.id)) continue;
    seen.add(value.id);
    result.push(value);
  }
  return result;
}
