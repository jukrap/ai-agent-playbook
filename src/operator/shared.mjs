import { readdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { PNG } from 'pngjs';
import { INSTALL_MANIFEST_FILE, checkContracts, checkGuides, doctorProject, SCHEMA_VERSION, validateManagedManifest } from '../harness.mjs';
import { runDeepAnalysis } from '../deep-analysis.mjs';

export const RULE_DIRECTORY_SOURCES = [
  ['.ai-playbook/rules', '.ai-playbook/rules'],
  ['.github/instructions', '.github/instructions'],
  ['.cursor/rules', '.cursor/rules'],
  ['.claude/rules', '.claude/rules']
];

export const RULE_FILE_SOURCES = [
  ['.github/copilot-instructions.md', '.github/copilot-instructions.md'],
  ['CONTEXT.md', 'CONTEXT.md']
];

export const RULE_EXTENSIONS = new Set(['.md', '.mdc']);
export const RULE_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage']);
export const SEARCH_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage']);
export const MAP_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.ai-playbook', 'ai-playbook', '_reference']);
export const SEARCH_MAX_BYTES = 1_000_000;
export const MAP_MAX_BYTES = 1_000_000;
export const PACKAGE_SCRIPT_ORDER = ['check', 'test', 'test:run', 'lint', 'typecheck', 'build'];
export const PACKAGE_MANAGER_LOCKFILES = [
  ['pnpm', 'pnpm-lock.yaml'],
  ['yarn', 'yarn.lock'],
  ['npm', 'package-lock.json'],
  ['bun', 'bun.lockb'],
  ['bun', 'bun.lock']
];
export const CORE_CONTEXT_FILES = ['START_HERE.md', 'CURRENT.md', 'SKILLS.md', 'GIT.md'];
export const PLAYBOOK_DIR_CANDIDATES = ['.ai-playbook', 'ai-playbook'];
export const RELATED_CONTEXT_DIRS = ['maps', 'runbooks', 'decisions', 'guides'];
export const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdc']);
export const PLAYBOOK_AUDIT_DIRS = ['context', 'maps', 'runbooks', 'decisions', 'guides', 'plans', 'worklogs'];
export const SOURCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx',
  '.py', '.go', '.rs', '.java', '.kt', '.kts',
  '.rb', '.php', '.dart', '.cs', '.swift',
  '.cpp', '.cc', '.cxx', '.c', '.h', '.hpp',
  '.vue', '.svelte'
]);
export const TEST_FILE_PATTERN = /(^|[/.\\])(__tests__|tests?|specs?)([/.\\]|$)|[._-](test|spec)\.[^.]+$/i;
export const CONFIG_CANDIDATES = [
  'tsconfig.json',
  'jsconfig.json',
  'vitest.config.ts',
  'vitest.config.js',
  'jest.config.js',
  'jest.config.ts',
  'playwright.config.ts',
  'playwright.config.js',
  'eslint.config.js',
  '.eslintrc',
  '.eslintrc.json',
  '.prettierrc',
  'ruff.toml',
  'pytest.ini',
  'mypy.ini',
  'sgconfig.yml',
  'sgconfig.yaml',
  'ast-grep.config.yml',
  'ast-grep.config.yaml',
  'ast-grep.config.json',
  'Dockerfile',
  'docker-compose.yml'
];
export const STACK_MANIFESTS = [
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lock',
  'bun.lockb',
  'pyproject.toml',
  'requirements.txt',
  'Pipfile',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'Gemfile',
  'Makefile',
  'Dockerfile'
];
export const FRAMEWORK_DEPENDENCIES = [
  ['react', ['react', '@vitejs/plugin-react', 'next']],
  ['nextjs', ['next']],
  ['vue', ['vue', 'nuxt']],
  ['vite', ['vite', '@vitejs/plugin-react']],
  ['express', ['express']],
  ['nestjs', ['@nestjs/core']],
  ['fastify', ['fastify']],
  ['prisma', ['prisma', '@prisma/client']],
  ['vitest', ['vitest']],
  ['jest', ['jest']],
  ['playwright', ['@playwright/test', 'playwright']],
  ['typescript', ['typescript']]
];
export const MODULE_BOUNDARY_DIRS = [
  'src',
  'src/app',
  'src/pages',
  'src/features',
  'src/entities',
  'src/shared',
  'app',
  'pages',
  'components',
  'server',
  'packages',
  'apps'
];
export const ENTRYPOINT_BASENAMES = new Set(['main', 'index', 'app', 'server', 'client']);
export const CONCERN_PATTERNS = {
  todos: /\b(TODO|FIXME|HACK|XXX|DEPRECATED)\b/gi,
  debugArtifacts: /\b(console\.log|debugger|binding\.pry|pdb\.set_trace|import pdb)\b/gi,
  securitySignals: /\b(eval\s*\(|dangerouslySetInnerHTML|innerHTML\s*=|document\.write\s*\()/gi
};

export async function preflightContextSummary(options) {
  const { target } = options;
  const warnings = [];
  const playbook = await findPlaybookRoot(target);
  if (!playbook) {
    warnings.push({
      id: 'operator.context.playbook-missing',
      message: 'No .ai-playbook/ or legacy ai-playbook/ folder found.',
      paths: ['.ai-playbook/']
    });
  }
  const coreSources = playbook ? await collectCoreContextSources({ target, playbook }) : [];
  const docMap = playbook ? await readOperatorDocMap({ target, playbook }) : null;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target,
    summary: {
      coreSources: coreSources.length,
      contextFiles: 0,
      matchingContextFiles: coreSources.length,
      ruleMatches: 0,
      relatedFiles: 0,
      docMap: docMap?.exists ? 1 : 0,
      warnings: warnings.length
    },
    coreSources,
    contexts: [],
    docMap,
    rules: {
      summary: { total: 0, applies: 0, warnings: 0 },
      rules: [],
      warnings: []
    },
    related: [],
    warnings
  };
}

export async function buildPreflightSnapshot(options) {
  const { target, intent, relativePath } = options;
  const files = await walkProjectFiles(target, SEARCH_EXCLUDED_DIRS);
  const snapshotFiles = [];
  for (const file of files) {
    const info = await stat(file);
    snapshotFiles.push({
      path: toPortablePath(path.relative(target, file)),
      hash: await hashFile(file),
      size: info.size,
      mtimeMs: Math.trunc(info.mtimeMs),
      category: searchCategory(toPortablePath(path.relative(target, file)))
    });
  }
  snapshotFiles.sort((left, right) => left.path.localeCompare(right.path));
  return {
    scanRange: {
      root: '.',
      totalFiles: files.length,
      includedFiles: snapshotFiles.length,
      excludedDirs: [...SEARCH_EXCLUDED_DIRS].sort()
    },
    intentTerms: researchTerms(intent),
    ...(relativePath === undefined ? {} : { path: relativePath }),
    files: snapshotFiles
  };
}

export function buildPreflightCandidates(options) {
  const { searchResults, relativePath, rules, context, contracts, maxResults } = options;
  const byPath = new Map();
  for (const item of searchResults) {
    byPath.set(item.path, item);
  }
  if (relativePath) {
    addPreflightCandidate(byPath, relativePath, 'explicit path', 100);
  }
  for (const rule of rules.rules.filter((rule) => rule.applies)) {
    addPreflightCandidate(byPath, rule.path, 'matching rule', 80);
  }
  for (const item of context.contexts.filter((entry) => entry.applies)) {
    addPreflightCandidate(byPath, item.path, 'matching context', 70);
  }
  for (const item of context.coreSources ?? []) {
    addPreflightCandidate(byPath, item.path, 'core playbook source', 50);
  }
  for (const contract of contracts.contracts) {
    addPreflightCandidate(byPath, contract.path, 'matching contract', 75);
  }
  return [...byPath.values()]
    .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
    .slice(0, maxResults);
}

export function addPreflightCandidate(byPath, candidatePath, reason, score) {
  if (!candidatePath || byPath.has(candidatePath)) return;
  byPath.set(candidatePath, {
    path: candidatePath,
    category: searchCategory(candidatePath),
    score,
    matches: 0,
    snippets: [],
    reason
  });
}

export async function readPreflightFile(beforeFile) {
  if (!beforeFile || beforeFile === true) {
    return {
      ok: false,
      conflict: {
        id: 'operator.delta.before-missing',
        message: 'Missing --before preflight JSON path.',
        paths: []
      }
    };
  }
  const resolved = path.resolve(beforeFile);
  if (!existsSync(resolved)) {
    return {
      ok: false,
      conflict: {
        id: 'operator.delta.before-file-missing',
        message: 'Preflight JSON file does not exist.',
        paths: [beforeFile]
      }
    };
  }
  try {
    return { ok: true, value: JSON.parse(await readFile(resolved, 'utf8')) };
  } catch (error) {
    return {
      ok: false,
      conflict: {
        id: 'operator.delta.snapshot-malformed',
        message: `Preflight JSON is malformed: ${error.message}`,
        paths: [beforeFile]
      }
    };
  }
}

export function validatePreflightSnapshot(value) {
  if (!isRecord(value) || !isRecord(value.snapshot) || !Array.isArray(value.snapshot.files)) {
    return {
      ok: false,
      conflict: {
        id: 'operator.delta.snapshot-malformed',
        message: 'Preflight JSON does not contain snapshot.files.',
        paths: []
      }
    };
  }
  for (const file of value.snapshot.files) {
    if (!isRecord(file) || typeof file.path !== 'string' || !isPortableSnapshotPath(file.path)) {
      return {
        ok: false,
        conflict: {
          id: 'operator.delta.snapshot-path-invalid',
          message: 'Preflight snapshot contains an unsafe or non-portable path.',
          paths: [isRecord(file) && typeof file.path === 'string' ? file.path : '']
        }
      };
    }
    if (typeof file.hash !== 'string' || !/^[a-f0-9]{64}$/i.test(file.hash)) {
      return {
        ok: false,
        conflict: {
          id: 'operator.delta.snapshot-malformed',
          message: `Preflight snapshot entry for ${file.path} has an invalid hash.`,
          paths: [file.path]
        }
      };
    }
  }
  return { ok: true };
}

export function isPortableSnapshotPath(value) {
  if (!value || path.isAbsolute(value) || value.includes('\\')) return false;
  const normalized = normalizePortablePath(value);
  if (normalized !== value) return false;
  return !normalized.split('/').includes('..');
}

export function operatorDeltaError({ target, beforeFile, conflict }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    target,
    before: {
      file: beforeFile
    },
    summary: {
      added: 0,
      deleted: 0,
      modified: 0,
      warnings: 0,
      conflicts: 1
    },
    changes: {
      added: [],
      deleted: [],
      modified: []
    },
    warnings: [],
    conflicts: [conflict]
  };
}

export function deltaFileSummary(file) {
  return {
    path: file.path,
    category: searchCategory(file.path),
    ...(file.hash ? { hash: file.hash } : {}),
    ...(file.beforeHash ? { beforeHash: file.beforeHash } : {}),
    ...(file.afterHash ? { afterHash: file.afterHash } : {}),
    ...(typeof file.size === 'number' ? { size: file.size } : {}),
    ...(typeof file.beforeSize === 'number' ? { beforeSize: file.beforeSize } : {}),
    ...(typeof file.afterSize === 'number' ? { afterSize: file.afterSize } : {})
  };
}

export function isIntentScopedChange(filePath, intentTerms, scopedPath) {
  if (scopedPath && (filePath === scopedPath || filePath.startsWith(`${path.posix.dirname(scopedPath)}/`))) return true;
  const lower = filePath.toLowerCase();
  return intentTerms.some((term) => lower.includes(term.toLowerCase()));
}

export function isPlaybookPath(filePath) {
  return filePath.startsWith('.ai-playbook/') ||
    filePath.startsWith('ai-playbook/') ||
    filePath.startsWith('.github/instructions/') ||
    filePath.startsWith('.cursor/rules/') ||
    filePath.startsWith('.claude/rules/');
}

export function imageDiffResult({ referencePath, actualPath, threshold, summary, hotspots, warnings, conflicts }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0 && summary.diffRatio <= threshold,
    reference: referencePath,
    actual: actualPath,
    summary,
    hotspots,
    warnings,
    conflicts
  };
}

export function emptyImageDiffSummary() {
  return {
    width: 0,
    height: 0,
    totalPixels: 0,
    changedPixels: 0,
    diffRatio: 0,
    similarityScore: 1,
    threshold: 0
  };
}

export function buildImageHotspots({ changed, width, height }) {
  const grid = Math.min(4, Math.max(1, width, height));
  const cellWidth = Math.ceil(width / grid);
  const cellHeight = Math.ceil(height / grid);
  const hotspots = [];
  for (let y = 0; y < height; y += cellHeight) {
    for (let x = 0; x < width; x += cellWidth) {
      let changedPixels = 0;
      let totalPixels = 0;
      for (let yy = y; yy < Math.min(height, y + cellHeight); yy += 1) {
        for (let xx = x; xx < Math.min(width, x + cellWidth); xx += 1) {
          totalPixels += 1;
          changedPixels += changed[yy * width + xx];
        }
      }
      if (changedPixels === 0) continue;
      hotspots.push({
        x,
        y,
        width: Math.min(width - x, cellWidth),
        height: Math.min(height - y, cellHeight),
        changedPixels,
        diffRatio: changedPixels / totalPixels
      });
    }
  }
  hotspots.sort((left, right) => right.changedPixels - left.changedPixels || left.y - right.y || left.x - right.x);
  return hotspots.slice(0, 10);
}

export async function walkSearchFiles(root) {
  const files = [];
  await walkSearch(root, files);
  files.sort();
  return files;
}

export async function walkProjectFiles(root, excludedDirs) {
  const files = [];
  await walkProject(root, files, excludedDirs);
  files.sort();
  return files;
}

export async function walkProject(current, files, excludedDirs) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      await walkProject(path.join(current, entry.name), files, excludedDirs);
      continue;
    }
    if (!entry.isFile()) continue;
    const fullPath = path.join(current, entry.name);
    const info = await stat(fullPath);
    if (info.size > MAP_MAX_BYTES) continue;
    files.push(fullPath);
  }
}

export async function walkSearch(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SEARCH_EXCLUDED_DIRS.has(entry.name)) continue;
      await walkSearch(path.join(current, entry.name), files);
      continue;
    }
    if (!entry.isFile()) continue;
    const fullPath = path.join(current, entry.name);
    const info = await stat(fullPath);
    if (info.size > SEARCH_MAX_BYTES) continue;
    files.push(fullPath);
  }
}

export async function searchFile(options) {
  const { target, file, normalizedQuery } = options;
  let raw;
  try {
    raw = await readFile(file);
  } catch {
    return null;
  }
  if (raw.includes(0)) return null;
  const text = raw.toString('utf8');
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const snippets = [];
  let occurrenceCount = 0;

  for (const [index, line] of lines.entries()) {
    const lineLower = line.toLowerCase();
    const count = occurrences(lineLower, normalizedQuery);
    if (count === 0) continue;
    occurrenceCount += count;
    if (snippets.length < 3) {
      snippets.push({
        line: index + 1,
        text: trimSnippet(line)
      });
    }
  }
  if (occurrenceCount === 0) return null;

  const relativePath = toPortablePath(path.relative(target, file));
  const category = searchCategory(relativePath);
  return {
    path: relativePath,
    category,
    score: occurrenceCount * 10 + categoryWeight(category),
    matches: occurrenceCount,
    snippets
  };
}

export function buildResearchAxes(options) {
  const { query, relativePath } = options;
  const queryTerms = researchTerms(query);
  const axes = [
    {
      id: 'query',
      description: 'Direct matches for the requested research topic.',
      terms: queryTerms
    }
  ];
  if (relativePath !== undefined) {
    axes.push({
      id: 'path',
      description: 'Path-scoped terms from the file or area under review.',
      terms: searchTermsForPath(relativePath)
    });
  }
  axes.push({
    id: 'quality',
    description: 'Verification, tests, risks, and follow-up evidence around the topic.',
    terms: ['test', 'tests', 'spec', 'check', 'verify', 'risk', 'todo', 'fixme', 'warning']
  });
  return axes.map((axis) => ({
    ...axis,
    terms: [...new Set(axis.terms.map((term) => term.toLowerCase()).filter((term) => term.length >= 3))]
  })).filter((axis) => axis.terms.length > 0);
}

export function researchTerms(query) {
  const normalized = query.trim().toLowerCase();
  const parts = normalized
    .split(/[^\p{L}\p{N}_-]+/gu)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
  const phrase = normalized.length >= 3 ? [normalized] : [];
  return [...new Set([...phrase, ...parts])];
}

export async function researchFile(options) {
  const { target, file, axes, allTerms } = options;
  let raw;
  try {
    raw = await readFile(file);
  } catch {
    return null;
  }
  if (raw.includes(0)) return null;

  const text = raw.toString('utf8');
  const lowerText = text.toLowerCase();
  const relativePath = toPortablePath(path.relative(target, file));
  const lowerPath = relativePath.toLowerCase();
  const matchedTerms = [];
  const matchedAxes = [];
  let score = categoryWeight(searchCategory(relativePath));
  let matches = 0;
  let anchored = false;

  for (const axis of axes) {
    let axisMatches = 0;
    for (const term of axis.terms) {
      const textMatches = occurrences(lowerText, term);
      const pathMatches = occurrences(lowerPath, term);
      const total = textMatches + pathMatches;
      if (total === 0) continue;
      axisMatches += total;
      matches += total;
      score += textMatches * (term.includes(' ') ? 30 : 8);
      score += pathMatches * 5;
      matchedTerms.push(term);
    }
    if (axisMatches > 0) {
      if (axis.id !== 'quality') anchored = true;
      matchedAxes.push({
        id: axis.id,
        matches: axisMatches
      });
    }
  }
  if (matches === 0 || !anchored) return null;

  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const snippets = researchSnippets(lines, allTerms);
  return {
    path: relativePath,
    category: searchCategory(relativePath),
    score,
    matches,
    matchedTerms: [...new Set(matchedTerms)].slice(0, 20),
    axes: matchedAxes,
    snippets
  };
}

export function researchSnippets(lines, terms) {
  const snippets = [];
  for (const [index, line] of lines.entries()) {
    const lineLower = line.toLowerCase();
    const lineTerms = terms.filter((term) => lineLower.includes(term));
    if (lineTerms.length === 0) continue;
    snippets.push({
      line: index + 1,
      text: trimSnippet(line),
      terms: lineTerms.slice(0, 8)
    });
    if (snippets.length >= 4) break;
  }
  return snippets;
}

export function summarizeEvidenceCategories(evidence) {
  const categories = {};
  for (const item of evidence) {
    categories[item.category] = (categories[item.category] ?? 0) + 1;
  }
  return categories;
}

export function buildResearchGaps(options) {
  const { evidence, relativePath, rules, context, map } = options;
  const categories = summarizeEvidenceCategories(evidence);
  const gaps = [];
  if (evidence.length === 0) {
    gaps.push({
      id: 'research.no-local-evidence',
      message: 'No local files matched the research query.',
      severity: 'info'
    });
  }
  if (!relativePath) {
    gaps.push({
      id: 'research.path-not-provided',
      message: 'No --path was provided, so path-scoped rules and context were not evaluated.',
      severity: 'info'
    });
  }
  if ((categories.tests ?? 0) === 0 && map.summary.testFiles > 0) {
    gaps.push({
      id: 'research.no-matching-tests',
      message: 'The repository has tests, but no matching test evidence was found for this query.',
      severity: 'warn'
    });
  }
  if ((categories.rules ?? 0) === 0 && rules && rules.summary.applies > 0) {
    gaps.push({
      id: 'research.no-matching-rule-text',
      message: 'Path-scoped rules apply, but their text did not strongly match the query terms.',
      severity: 'info'
    });
  }
  if (context && context.summary.matchingContextFiles === 0) {
    gaps.push({
      id: 'research.no-path-context',
      message: 'No path-scoped playbook context matched the requested path.',
      severity: 'info'
    });
  }
  return gaps;
}

export function buildResearchNextSteps(options) {
  const { query, relativePath, evidence, gaps, diagnostics } = options;
  const steps = [];
  if (evidence.length === 0) {
    steps.push({
      id: 'research.refine-query',
      command: `operator research <target> --query "${query}" --path <file> --json`,
      reason: 'Add a path or narrower term to connect the query to local evidence.'
    });
  }
  if (relativePath) {
    steps.push({
      id: 'research.inspect-context',
      command: `operator context <target> --path ${relativePath} --json`,
      reason: 'Review the exact path-scoped context and rules before changing code.'
    });
  }
  if (diagnostics.commands.length > 0) {
    steps.push({
      id: 'research.verify-locally',
      command: diagnostics.commands[0].command,
      reason: 'Run the most relevant local verification command after any implementation change.'
    });
  }
  if (gaps.some((gap) => gap.id === 'research.no-matching-tests')) {
    steps.push({
      id: 'research.find-tests',
      command: `operator search <target> --query "${query}" --max-results 50 --json`,
      reason: 'Broaden local search before deciding that no test coverage exists.'
    });
  }
  return steps;
}

export function buildResearchMarkdown(result) {
  const lines = [
    `# Operator Research: ${result.query}`,
    '',
    '## Mode',
    '',
    `- Local only: ${result.mode.localOnly}`,
    `- Network: ${result.mode.network}`,
    `- Writes files: ${result.mode.writes}`,
    '',
    '## Summary',
    '',
    `- Searched files: ${result.summary.searchedFiles}`,
    `- Evidence items: ${result.summary.evidence}`,
    `- Gaps: ${result.summary.gaps}`,
    '',
    '## Evidence',
    ''
  ];
  if (result.evidence.length === 0) {
    lines.push('- No local evidence matched the query.');
  } else {
    for (const item of result.evidence.slice(0, 20)) {
      const first = item.snippets[0];
      lines.push(`- ${item.path} (${item.category}, score ${item.score})${first ? `: line ${first.line} - ${first.text}` : ''}`);
    }
  }
  lines.push('', '## Gaps', '');
  if (result.gaps.length === 0) {
    lines.push('- No major local evidence gaps found.');
  } else {
    for (const gap of result.gaps) {
      lines.push(`- ${gap.message}`);
    }
  }
  lines.push('', '## Next Steps', '');
  if (result.nextSteps.length === 0) {
    lines.push('- Review the evidence above and decide whether implementation work is warranted.');
  } else {
    for (const step of result.nextSteps) {
      lines.push(`- ${step.reason}${step.command ? ` (${step.command})` : ''}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export async function findPlaybookRoot(target) {
  for (const candidate of PLAYBOOK_DIR_CANDIDATES) {
    const root = path.join(target, candidate);
    if (!existsSync(root)) continue;
    const info = await stat(root);
    if (info.isDirectory()) {
      return { name: candidate, absolutePath: root };
    }
  }
  return null;
}

export async function collectCoreContextSources(options) {
  const { target, playbook } = options;
  const sources = [];
  for (const fileName of CORE_CONTEXT_FILES) {
    const absolutePath = path.join(playbook.absolutePath, fileName);
    if (!existsSync(absolutePath)) continue;
    const info = await stat(absolutePath);
    if (!info.isFile()) continue;
    sources.push({
      path: toPortablePath(path.relative(target, absolutePath)),
      category: 'core',
      bytes: info.size
    });
  }
  return sources;
}

export async function collectPathContextFiles(options) {
  const { target, playbook, relativePath, warnings } = options;
  const contextRoot = path.join(playbook.absolutePath, 'context');
  const files = await walkMarkdownFiles(contextRoot);
  const entries = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const parsed = parseRuleFile(text);
    const contextPath = toPortablePath(path.relative(target, file));
    for (const diagnostic of parsed.diagnostics) {
      warnings.push({
        id: 'operator.context.frontmatter',
        message: diagnostic,
        paths: [contextPath]
      });
    }
    const match = matchRule({ frontmatter: parsed.frontmatter, isSingleFile: false, relativePath });
    entries.push({
      id: parsed.frontmatter.id ?? path.basename(file, path.extname(file)),
      path: contextPath,
      source: `${playbook.name}/context`,
      applies: match.applies,
      reason: match.reason,
      globs: parsed.frontmatter.globs,
      alwaysApply: parsed.frontmatter.alwaysApply,
      freshness: parsed.frontmatter.freshness ?? null,
      priority: parsed.frontmatter.priority ?? 'normal',
      bytes: Buffer.byteLength(text, 'utf8')
    });
  }
  entries.sort((left, right) => Number(right.applies) - Number(left.applies) || left.path.localeCompare(right.path));
  return entries;
}

export async function readOperatorDocMap(options) {
  const { target, playbook } = options;
  const file = path.join(playbook.absolutePath, 'maps', 'doc-map.md');
  const relative = toPortablePath(path.relative(target, file));
  if (!existsSync(file)) {
    return { path: relative, exists: false, bytes: 0 };
  }
  const info = await stat(file);
  return { path: relative, exists: true, bytes: info.size };
}

export async function collectRelatedContextFiles(options) {
  const { target, playbook, relativePath } = options;
  const terms = searchTermsForPath(relativePath);
  const related = [];
  for (const directory of RELATED_CONTEXT_DIRS) {
    const root = path.join(playbook.absolutePath, directory);
    const files = await walkMarkdownFiles(root);
    for (const file of files) {
      const result = await scoreRelatedFile({ target, file, terms, category: directory });
      if (result) related.push(result);
    }
  }
  related.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  return related.slice(0, 10);
}

export async function walkMarkdownFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  await walkMarkdown(root, files);
  files.sort();
  return files;
}

export async function walkMarkdown(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdown(fullPath, files);
    } else if (entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
}

export function searchTermsForPath(relativePath) {
  const normalized = normalizePortablePath(relativePath);
  const segments = normalized.split('/').filter(Boolean);
  const basename = segments.at(-1) ?? normalized;
  const stem = basename.replace(/\.[^.]+$/, '');
  const camelParts = stem.split(/(?=[A-Z])|[^A-Za-z0-9가-힣_]+/).filter((part) => part.length >= 3);
  return [...new Set([normalized, basename, stem, ...segments.slice(0, -1), ...camelParts].map((item) => item.toLowerCase()).filter((item) => item.length >= 3))];
}

export async function scoreRelatedFile(options) {
  const { target, file, terms, category } = options;
  let raw;
  try {
    raw = await readFile(file);
  } catch {
    return null;
  }
  if (raw.includes(0)) return null;
  const text = raw.toString('utf8');
  const lower = text.toLowerCase();
  const pathText = normalizePortablePath(path.relative(target, file)).toLowerCase();
  let score = 0;
  for (const term of terms) {
    score += occurrences(lower, term) * 10;
    score += occurrences(pathText, term) * 4;
  }
  if (score === 0) return null;
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const snippets = [];
  for (const [index, line] of lines.entries()) {
    const lineLower = line.toLowerCase();
    if (!terms.some((term) => lineLower.includes(term))) continue;
    snippets.push({ line: index + 1, text: trimSnippet(line) });
    if (snippets.length >= 2) break;
  }
  return {
    path: toPortablePath(path.relative(target, file)),
    category,
    score,
    snippets
  };
}

export async function readPackageInfo(target) {
  const file = path.join(target, 'package.json');
  if (!existsSync(file)) return { ok: false, dependencies: {}, scripts: {} };
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return {
      ok: true,
      dependencies: {
        ...(isRecord(parsed.dependencies) ? parsed.dependencies : {}),
        ...(isRecord(parsed.devDependencies) ? parsed.devDependencies : {}),
        ...(isRecord(parsed.peerDependencies) ? parsed.peerDependencies : {})
      },
      scripts: isRecord(parsed.scripts) ? parsed.scripts : {}
    };
  } catch (error) {
    return { ok: false, error: error.message, dependencies: {}, scripts: {} };
  }
}

export function buildStackMap(options) {
  const { target, files, sourceFiles, diagnostics, packageInfo } = options;
  const relativeFiles = new Set(files.map((file) => toPortablePath(path.relative(target, file))));
  const manifests = STACK_MANIFESTS.filter((manifest) => relativeFiles.has(manifest)).map((manifest) => ({ path: manifest }));
  const languageCounts = new Map();
  for (const file of sourceFiles) {
    const ext = path.extname(file).toLowerCase();
    languageCounts.set(ext, (languageCounts.get(ext) ?? 0) + 1);
  }
  const languages = [...languageCounts.entries()]
    .map(([extension, count]) => ({ extension, count }))
    .sort((left, right) => right.count - left.count || left.extension.localeCompare(right.extension));
  const dependencyNames = new Set(Object.keys(packageInfo.dependencies).map((name) => name.toLowerCase()));
  const frameworks = [];
  for (const [name, candidates] of FRAMEWORK_DEPENDENCIES) {
    const matches = candidates.filter((candidate) => dependencyNames.has(candidate));
    if (matches.length > 0) frameworks.push({ name, source: 'package.json', matches });
  }
  return {
    packageManager: diagnostics.packageManager,
    manifests,
    languages,
    frameworks,
    scripts: Object.keys(packageInfo.scripts).sort()
  };
}

export async function buildArchitectureMap(options) {
  const { target, files, sourceFiles, topLevelEntries } = options;
  const relativeFiles = new Set(files.map((file) => toPortablePath(path.relative(target, file))));
  const entrypoints = sourceFiles
    .map((file) => toPortablePath(path.relative(target, file)))
    .filter((file) => ENTRYPOINT_BASENAMES.has(path.basename(file, path.extname(file)).toLowerCase()))
    .map((file) => ({ path: file }))
    .slice(0, 20);
  const moduleBoundaries = [];
  for (const candidate of MODULE_BOUNDARY_DIRS) {
    const absolutePath = path.join(target, ...candidate.split('/'));
    if (!existsSync(absolutePath)) continue;
    const info = await stat(absolutePath);
    if (!info.isDirectory()) continue;
    moduleBoundaries.push({ path: candidate });
  }
  return {
    topLevel: topLevelEntries,
    entrypoints,
    moduleBoundaries,
    configFiles: ['vite.config.ts', 'vite.config.js', 'next.config.js', 'next.config.mjs'].filter((file) => relativeFiles.has(file)).map((file) => ({ path: file }))
  };
}

export function buildQualityMap(options) {
  const { target, files, diagnostics } = options;
  const relativeFiles = files.map((file) => toPortablePath(path.relative(target, file)));
  const relativeSet = new Set(relativeFiles);
  const testFiles = relativeFiles.filter((file) => TEST_FILE_PATTERN.test(file) && !file.includes('node_modules/'));
  const configs = [];
  for (const candidate of CONFIG_CANDIDATES) {
    if (relativeSet.has(candidate)) configs.push({ path: candidate });
  }
  for (const file of relativeFiles) {
    if (/^\.github\/workflows\/[^/]+\.(ya?ml)$/i.test(file)) {
      configs.push({ path: file });
    }
  }
  configs.sort((left, right) => left.path.localeCompare(right.path));
  return {
    testFiles: {
      count: testFiles.length,
      samples: testFiles.slice(0, 20)
    },
    configs,
    commands: diagnostics.commands
  };
}

export function buildOptionalAnalysisSignals(options) {
  const { map } = options;
  const configPaths = new Set(map.quality.configs.map((config) => config.path));
  const scripts = new Set(map.stack.scripts);
  const languageExtensions = new Set(map.stack.languages.map((language) => language.extension));
  const astEvidence = [];
  for (const config of ['sgconfig.yml', 'sgconfig.yaml', 'ast-grep.config.yml', 'ast-grep.config.yaml', 'ast-grep.config.json']) {
    if (configPaths.has(config)) astEvidence.push(config);
  }
  for (const script of scripts) {
    if (/(^|[:-])(ast-?grep|sg|structural)([:-]|$)/i.test(script)) astEvidence.push(`package.json#scripts.${script}`);
  }

  const lspEvidence = [];
  if (configPaths.has('tsconfig.json') || configPaths.has('jsconfig.json') || languageExtensions.has('.ts') || languageExtensions.has('.tsx')) {
    lspEvidence.push('typescript/javascript project signals');
  }
  if (map.stack.manifests.some((manifest) => ['pyproject.toml', 'requirements.txt'].includes(manifest.path)) || languageExtensions.has('.py')) {
    lspEvidence.push('python project signals');
  }
  if (map.stack.manifests.some((manifest) => manifest.path === 'go.mod') || languageExtensions.has('.go')) {
    lspEvidence.push('go project signals');
  }
  if (map.stack.manifests.some((manifest) => manifest.path === 'Cargo.toml') || languageExtensions.has('.rs')) {
    lspEvidence.push('rust project signals');
  }

  return [
    {
      id: 'ast-grep',
      category: 'structural-search',
      status: astEvidence.length > 0 ? 'detected' : 'not-detected',
      evidence: astEvidence,
      nextStep: astEvidence.length > 0
        ? 'Use the project AST search setup manually when structural evidence is needed; this command does not run it.'
        : 'No AST search setup was detected. Use text search or add a project-specific structural search tool before relying on structural claims.'
    },
    {
      id: 'lsp',
      category: 'language-analysis',
      status: lspEvidence.length > 0 ? 'project-signals' : 'not-detected',
      evidence: lspEvidence,
      nextStep: lspEvidence.length > 0
        ? 'Use the project language tooling explicitly for definitions, references, diagnostics, or renames; no LSP server is started here.'
        : 'No strong language-server signal was detected.'
    },
    {
      id: 'comment-checker',
      category: 'comment-quality',
      status: 'manual',
      evidence: [],
      nextStep: 'Use review-work-light or cleanup-ai-slop for comment quality review; no automatic comment checker hook is configured.'
    }
  ];
}

export async function buildConcernsMap(options) {
  const { target, sourceFiles } = options;
  const aggregate = {
    todos: { count: 0, samples: [] },
    debugArtifacts: { count: 0, samples: [] },
    securitySignals: { count: 0, samples: [] }
  };
  for (const file of sourceFiles) {
    let raw;
    try {
      raw = await readFile(file);
    } catch {
      continue;
    }
    if (raw.includes(0)) continue;
    const text = raw.toString('utf8');
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const [index, line] of lines.entries()) {
      for (const [category, pattern] of Object.entries(CONCERN_PATTERNS)) {
        pattern.lastIndex = 0;
        const matches = line.match(pattern);
        if (!matches) continue;
        aggregate[category].count += matches.length;
        if (aggregate[category].samples.length < 10) {
          aggregate[category].samples.push({
            path: toPortablePath(path.relative(target, file)),
            line: index + 1,
            text: trimSnippet(line)
          });
        }
      }
    }
  }
  return aggregate;
}

export async function collectTopLevelEntries(target) {
  const entries = await readdir(target, { withFileTypes: true });
  return entries
    .filter((entry) => !MAP_EXCLUDED_DIRS.has(entry.name))
    .map((entry) => ({
      path: entry.name,
      type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other'
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
    .slice(0, 40);
}

export async function collectPlaybookMarkdownFiles(playbookRoot) {
  const files = [];
  for (const directory of PLAYBOOK_AUDIT_DIRS) {
    const root = path.join(playbookRoot, directory);
    files.push(...await walkMarkdownFiles(root));
  }
  for (const file of CORE_CONTEXT_FILES) {
    const fullPath = path.join(playbookRoot, file);
    if (existsSync(fullPath)) files.push(fullPath);
  }
  return [...new Set(files)].sort();
}

export async function auditMarkdownLinks(options) {
  const { target, markdownFiles } = options;
  const findings = [];
  for (const file of markdownFiles) {
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    const relativeSource = toPortablePath(path.relative(target, file));
    for (const link of markdownLinks(text)) {
      const resolved = resolveMarkdownLink({ file, target, href: link.href });
      if (!resolved || existsSync(resolved.absolutePath)) continue;
      findings.push(operatorFinding(
        'fail',
        'operator.audit.broken-link',
        'references',
        `${relativeSource} links to missing ${resolved.relativePath}.`,
        [relativeSource, resolved.relativePath]
      ));
    }
  }
  return findings;
}

export async function auditContextGlobs(options) {
  const { target, playbook, projectFiles } = options;
  const contextRoot = path.join(playbook.absolutePath, 'context');
  const files = await walkMarkdownFiles(contextRoot);
  const findings = [];
  let orphaned = 0;
  let warnings = 0;
  for (const file of files) {
    const relativePath = toPortablePath(path.relative(target, file));
    const text = await readFile(file, 'utf8');
    const parsed = parseRuleFile(text);
    for (const diagnostic of parsed.diagnostics) {
      warnings += 1;
      findings.push(operatorFinding(
        'warn',
        'operator.audit.context-frontmatter',
        'context',
        diagnostic,
        [relativePath]
      ));
    }
    if (parsed.frontmatter.alwaysApply || parsed.frontmatter.globs.length === 0) continue;
    const matchesAny = parsed.frontmatter.globs.some((glob) => projectFiles.some((projectFile) => globMatches(glob, projectFile)));
    if (matchesAny) continue;
    orphaned += 1;
    findings.push(operatorFinding(
      'warn',
      'operator.audit.orphan-context',
      'context',
      `${relativePath} has globs that do not match any current project file.`,
      [relativePath]
    ));
  }
  return { files: files.length, orphaned, warnings, findings };
}

export async function auditDocMapTargets(options) {
  const { target, playbook } = options;
  const docMap = path.join(playbook.absolutePath, 'maps', 'doc-map.md');
  if (!existsSync(docMap)) return [];
  const text = await readFile(docMap, 'utf8');
  const relativeSource = toPortablePath(path.relative(target, docMap));
  const findings = [];
  for (const link of markdownLinks(text)) {
    const resolved = resolveMarkdownLink({ file: docMap, target, href: link.href });
    if (!resolved || existsSync(resolved.absolutePath)) continue;
    findings.push(operatorFinding(
      'warn',
      'operator.audit.doc-map-target-missing',
      'memoryDrift',
      `${relativeSource} points at missing documentation ${resolved.relativePath}.`,
      [relativeSource, resolved.relativePath]
    ));
  }
  return findings;
}

export async function auditContractDrift(options) {
  const { target } = options;
  const report = await checkContracts({ target });
  return report.warnings
    .filter((warning) => warning.id === 'contracts.applies-to-missing')
    .map((warning) => operatorFinding(
      'warn',
      'operator.audit.contract-applies-to-missing',
      'memoryDrift',
      warning.message,
      warning.paths
    ));
}

export async function auditDuplicateMarkdown(options) {
  const { target, markdownFiles } = options;
  const byHash = new Map();
  for (const file of markdownFiles) {
    let raw;
    try {
      raw = await readFile(file);
    } catch {
      continue;
    }
    const text = raw.toString('utf8').trim();
    if (!text) continue;
    const hash = sha256(raw);
    const relativePath = toPortablePath(path.relative(target, file));
    const paths = byHash.get(hash) ?? [];
    paths.push(relativePath);
    byHash.set(hash, paths);
  }
  return [...byHash.values()]
    .filter((paths) => paths.length > 1)
    .map((paths) => operatorFinding(
      'warn',
      'operator.audit.duplicate-content',
      'duplicates',
      `Duplicate playbook content appears in ${paths.length} files.`,
      paths
    ));
}

export async function auditManagedManifest(options) {
  const { target, playbook } = options;
  const findings = [];
  const manifestResult = await readOperatorManagedManifest(playbook);
  if (!manifestResult.ok) {
    findings.push(operatorFinding(
      manifestResult.conflict.id === 'operator.gc.manifest-missing' ? 'warn' : 'fail',
      manifestResult.conflict.id.replace('operator.gc.', 'operator.audit.'),
      'managed',
      manifestResult.conflict.message,
      manifestResult.conflict.paths
    ));
    return {
      section: { manifest: `${playbook.name}/${INSTALL_MANIFEST_FILE}`, status: 'unavailable', total: 0, modified: 0, missing: 0 },
      findings
    };
  }

  let modified = 0;
  let missing = 0;
  for (const entry of manifestResult.manifest.files) {
    if (!isRecord(entry) || typeof entry.path !== 'string') continue;
    const targetPath = safeJoin(target, entry.path);
    if (!targetPath || !existsSync(targetPath)) {
      missing += 1;
      findings.push(operatorFinding(
        'warn',
        'operator.audit.managed-file-missing',
        'managed',
        `${entry.path} is listed in the managed manifest but is missing.`,
        [entry.path]
      ));
      continue;
    }
    const currentHash = await hashFile(targetPath);
    if (currentHash !== entry.targetHash) {
      modified += 1;
      findings.push(operatorFinding(
        'warn',
        'operator.audit.managed-file-modified',
        'managed',
        `${entry.path} differs from the managed manifest hash.`,
        [entry.path]
      ));
    }
  }
  return {
    section: {
      manifest: `${playbook.name}/${INSTALL_MANIFEST_FILE}`,
      status: 'present',
      total: manifestResult.manifest.files.length,
      modified,
      missing
    },
    findings
  };
}

export function markdownLinks(text) {
  const links = [];
  const pattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(pattern)) {
    links.push({ href: match[1] });
  }
  return links;
}

export function resolveMarkdownLink({ file, target, href }) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const withoutFragment = trimmed.split('#')[0];
  if (!withoutFragment) return null;
  let decoded = withoutFragment;
  try {
    decoded = decodeURI(withoutFragment);
  } catch {
    decoded = withoutFragment;
  }
  const absolutePath = path.resolve(path.dirname(file), decoded);
  const relativePath = normalizeTargetRelativePath(target, absolutePath);
  return { absolutePath, relativePath };
}

export async function readOperatorManagedManifest(playbook) {
  const manifestPath = path.join(playbook.absolutePath, INSTALL_MANIFEST_FILE);
  const relativePath = `${playbook.name}/${INSTALL_MANIFEST_FILE}`;
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      conflict: {
        id: 'operator.gc.manifest-missing',
        message: `Missing managed manifest ${relativePath}.`,
        paths: [relativePath]
      }
    };
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const invalidReason = validateManagedManifest(manifest);
    if (invalidReason) {
      return {
        ok: false,
        conflict: {
          id: 'operator.gc.manifest-invalid',
          message: `Invalid managed manifest ${relativePath}: ${invalidReason}.`,
          paths: [relativePath]
        }
      };
    }
    return { ok: true, path: manifestPath, manifest };
  } catch (error) {
    return {
      ok: false,
      conflict: {
        id: 'operator.gc.manifest-malformed',
        message: `Could not parse ${relativePath}: ${error.message}`,
        paths: [relativePath]
      }
    };
  }
}

export function operatorGcResult(options) {
  const { target, apply, applied, operations, warnings, conflicts } = options;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    applied: Boolean(applied),
    summary: {
      removable: operations.length,
      removed: apply && applied ? operations.length : 0,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };
}

export async function hashFile(file) {
  return sha256(await readFile(file));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function safeJoin(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...normalizePortablePath(relativePath).split('/'));
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) return null;
  return resolved;
}

export async function removeEmptyParents(startDir, stopDir) {
  const resolvedStop = path.resolve(stopDir);
  let current = path.resolve(startDir);
  while (current !== resolvedStop && current.startsWith(`${resolvedStop}${path.sep}`)) {
    try {
      await rmdir(current);
    } catch {
      break;
    }
    current = path.dirname(current);
  }
}

export function operatorFinding(level, id, category, message, paths = []) {
  return { id, level, category, message, paths };
}

export function occurrences(text, search) {
  if (!search) return 0;
  let count = 0;
  let index = text.indexOf(search);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(search, index + search.length);
  }
  return count;
}

export function trimSnippet(line) {
  const normalized = line.trim();
  return normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`;
}

export function searchCategory(relativePath) {
  if (relativePath.startsWith('.ai-playbook/rules/')) return 'rules';
  if (relativePath.startsWith('.ai-playbook/worklogs/')) return 'worklogs';
  if (relativePath.startsWith('.ai-playbook/plans/')) return 'plans';
  if (relativePath.startsWith('.ai-playbook/')) return 'playbook';
  if (relativePath.startsWith('docs/') || relativePath.startsWith('translations/')) return 'docs';
  if (relativePath.startsWith('templates/')) return 'templates';
  if (TEST_FILE_PATTERN.test(relativePath)) return 'tests';
  return 'source';
}

export function categoryWeight(category) {
  if (category === 'source') return 8;
  if (category === 'rules') return 6;
  if (category === 'playbook') return 5;
  if (category === 'worklogs') return 4;
  return 1;
}

export function detectPackageManager(target) {
  for (const [name, lockfile] of PACKAGE_MANAGER_LOCKFILES) {
    if (existsSync(path.join(target, lockfile))) {
      return { name, lockfile };
    }
  }
  return { name: 'npm', lockfile: null };
}

export function renderPackageScriptCommand(packageManagerName, script) {
  if (packageManagerName === 'npm') {
    return script === 'test' ? 'npm test' : `npm run ${script}`;
  }
  if (packageManagerName === 'bun') {
    return `bun run ${script}`;
  }
  return `${packageManagerName} ${script}`;
}

export function operatorCheckForDoctor(doctor) {
  const level = doctor.ok ? summaryLevel(doctor.summary) : 'fail';
  return checkResult(
    level,
    'operator.doctor',
    'operator',
    'doctor',
    `Doctor checks: ${doctor.summary.pass} pass, ${doctor.summary.warn} warn, ${doctor.summary.fail} fail.`,
    pathsFromChecks(doctor.checks)
  );
}

export function operatorCheckForGuides(guides) {
  const level = guides.summary.missing > 0
    ? 'fail'
    : guides.summary.stale > 0
      ? 'warn'
      : 'pass';
  return checkResult(
    level,
    'operator.guides',
    'operator',
    'guides',
    `Guide templates: ${guides.summary.present} present, ${guides.summary.missing} missing, ${guides.summary.stale} stale.`,
    guides.guides.filter((guide) => guide.status !== 'present').map((guide) => guide.path)
  );
}

export function operatorCheckForDiagnostics(diagnostics) {
  const level = diagnostics.ok ? summaryLevel(diagnostics.summary) : 'fail';
  return checkResult(
    level,
    'operator.diagnostics',
    'operator',
    'diagnostics',
    `Verification command candidates: ${diagnostics.summary.commands}.`,
    pathsFromChecks(diagnostics.checks)
  );
}

export function operatorCheckForRules(rules) {
  const level = rules.ok ? (rules.summary.warnings > 0 ? 'warn' : 'pass') : 'fail';
  return checkResult(
    level,
    'operator.rules',
    'operator',
    'rules',
    `Rule matches: ${rules.summary.applies}/${rules.summary.total}; warnings: ${rules.summary.warnings}.`,
    rules.warnings.flatMap((warning) => warning.paths ?? [])
  );
}

export function summaryLevel(summary) {
  if ((summary.fail ?? 0) > 0) return 'fail';
  if ((summary.warn ?? 0) > 0) return 'warn';
  return 'pass';
}

export function pathsFromChecks(checks) {
  return [...new Set(checks
    .filter((check) => check.level !== 'pass')
    .flatMap((check) => check.paths ?? []))];
}

export async function buildRuleEntry(options) {
  const { target, file, source, relativePath, isSingleFile, warnings } = options;
  const text = await readFile(file, 'utf8');
  const parsed = parseRuleFile(text);
  for (const diagnostic of parsed.diagnostics) {
    warnings.push({
      id: 'rules.frontmatter',
      message: diagnostic,
      paths: [toPortablePath(path.relative(target, file))]
    });
  }
  const rulePath = toPortablePath(path.relative(target, file));
  const match = matchRule({ frontmatter: parsed.frontmatter, isSingleFile, relativePath });
  return {
    path: rulePath,
    source,
    applies: match.applies,
    reason: match.reason,
    globs: parsed.frontmatter.globs,
    alwaysApply: parsed.frontmatter.alwaysApply,
    bytes: Buffer.byteLength(text, 'utf8')
  };
}

export function parseRuleFile(text) {
  const frontmatter = { globs: [], alwaysApply: false };
  const diagnostics = [];
  if (!text.startsWith('---')) return { frontmatter, diagnostics };

  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closingIndex < 0) {
    diagnostics.push('Missing closing frontmatter delimiter.');
    return { frontmatter, diagnostics };
  }

  const yamlLines = lines.slice(1, closingIndex);
  for (let index = 0; index < yamlLines.length; index += 1) {
    const rawLine = yamlLines[index] ?? '';
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    if (line.startsWith('- ')) continue;

    const match = /^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (!match) {
      diagnostics.push(`Unsupported frontmatter line: ${line}`);
      continue;
    }
    const [, key, rawValue] = match;
    if (key === 'alwaysApply') {
      frontmatter.alwaysApply = rawValue.trim().toLowerCase() === 'true';
      continue;
    }
    if (key === 'globs') {
      const { globs, consumed, diagnostic } = parseGlobsValue(rawValue, yamlLines.slice(index + 1));
      frontmatter.globs.push(...globs);
      index += consumed;
      if (diagnostic) diagnostics.push(diagnostic);
      continue;
    }
    if (['id', 'freshness', 'priority', 'status', 'risk', 'approvedAt'].includes(key)) {
      frontmatter[key] = unquote(rawValue.trim());
    }
  }

  return { frontmatter, diagnostics };
}

export function parseGlobsValue(rawValue, followingLines) {
  const value = rawValue.trim();
  if (value.length === 0) {
    const globs = [];
    let consumed = 0;
    for (const line of followingLines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) break;
      globs.push(unquote(trimmed.slice(2).trim()));
      consumed += 1;
    }
    return { globs, consumed };
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return {
      globs: value.slice(1, -1).split(',').map((item) => unquote(item.trim())).filter(Boolean),
      consumed: 0
    };
  }
  if (value.startsWith('[')) {
    return { globs: [], consumed: 0, diagnostic: 'Malformed globs array in frontmatter.' };
  }
  return { globs: [unquote(value)], consumed: 0 };
}

export function matchRule({ frontmatter, isSingleFile, relativePath }) {
  if (frontmatter.alwaysApply) return { applies: true, reason: 'alwaysApply' };
  if (isSingleFile) return { applies: true, reason: 'singleFile' };
  if (relativePath === undefined) {
    return { applies: false, reason: frontmatter.globs.length > 0 ? 'requiresPath' : 'no-match' };
  }
  if (frontmatter.globs.some((glob) => globMatches(glob, relativePath))) {
    return { applies: true, reason: 'glob' };
  }
  return { applies: false, reason: 'no-match' };
}

export function globMatches(glob, relativePath) {
  return globToRegex(normalizePortablePath(glob)).test(normalizePortablePath(relativePath));
}

export function globToRegex(glob) {
  let pattern = '^';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === '*' && next === '*') {
      if (glob[index + 2] === '/') {
        pattern += '(?:.*/)?';
        index += 2;
      } else {
        pattern += '.*';
        index += 1;
      }
      continue;
    }
    if (char === '*') {
      pattern += '[^/]*';
      continue;
    }
    if (char === '?') {
      pattern += '[^/]';
      continue;
    }
    pattern += escapeRegex(char);
  }
  pattern += '$';
  return new RegExp(pattern);
}

export async function addLanguageCommandCandidates(target, commands) {
  const pyproject = path.join(target, 'pyproject.toml');
  if (existsSync(pyproject)) {
    const text = await readFile(pyproject, 'utf8');
    if (text.includes('[tool.pytest') || text.includes('[tool.pytest.ini_options]')) {
      commands.push({ id: 'python.pytest', source: 'pyproject.toml', command: 'python -m pytest', description: 'pytest project configuration detected' });
    }
    if (text.includes('[tool.ruff')) {
      commands.push({ id: 'python.ruff', source: 'pyproject.toml', command: 'python -m ruff check .', description: 'ruff project configuration detected' });
    }
    if (text.includes('[tool.mypy')) {
      commands.push({ id: 'python.mypy', source: 'pyproject.toml', command: 'python -m mypy .', description: 'mypy project configuration detected' });
    }
  }
  if (existsSync(path.join(target, 'Cargo.toml'))) {
    commands.push({ id: 'rust.cargo-check', source: 'Cargo.toml', command: 'cargo check', description: 'Rust package manifest detected' });
    commands.push({ id: 'rust.cargo-test', source: 'Cargo.toml', command: 'cargo test', description: 'Rust package manifest detected' });
  }
  if (existsSync(path.join(target, 'go.mod'))) {
    commands.push({ id: 'go.test', source: 'go.mod', command: 'go test ./...', description: 'Go module detected' });
  }
}

export async function walkRuleFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  await walk(root, files);
  files.sort();
  return files;
}

export async function walk(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (RULE_EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile() && RULE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
}

export function normalizeTargetRelativePath(target, filePath) {
  const resolved = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(target, filePath);
  const relative = path.relative(target, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return normalizePortablePath(filePath);
  }
  return toPortablePath(relative);
}

export function displayWidth(text) {
  let width = 0;
  for (const char of [...text]) {
    width += charWidth(char);
  }
  return width;
}

export function wideCharactersForLine(text, line) {
  const result = [];
  let column = 0;
  for (const char of [...text]) {
    const width = charWidth(char);
    if (width === 2) {
      result.push({ line, column, char });
    }
    column += width;
  }
  return result;
}

export function charWidth(char) {
  const code = char.codePointAt(0) ?? 0;
  if (code === 0) return 0;
  if (code < 32 || (code >= 0x7f && code < 0xa0)) return 0;
  if (isCombining(code)) return 0;
  return isWide(code) ? 2 : 1;
}

export function isCombining(code) {
  return (code >= 0x0300 && code <= 0x036f)
    || (code >= 0x1ab0 && code <= 0x1aff)
    || (code >= 0x1dc0 && code <= 0x1dff)
    || (code >= 0x20d0 && code <= 0x20ff)
    || (code >= 0xfe20 && code <= 0xfe2f);
}

export function isWide(code) {
  return (code >= 0x1100 && code <= 0x115f)
    || code === 0x2329
    || code === 0x232a
    || (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f)
    || (code >= 0xac00 && code <= 0xd7a3)
    || (code >= 0xf900 && code <= 0xfaff)
    || (code >= 0xfe10 && code <= 0xfe19)
    || (code >= 0xfe30 && code <= 0xfe6f)
    || (code >= 0xff00 && code <= 0xff60)
    || (code >= 0xffe0 && code <= 0xffe6);
}

export function stripAnsi(text) {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

export function hasBoxDrawing(text) {
  return /[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/.test(text);
}

export function checkResult(level, id, category, name, message, paths = []) {
  return { id, level, category, name, message, paths };
}

export function summarizeChecks(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.level === 'pass').length,
    warn: checks.filter((check) => check.level === 'warn').length,
    fail: checks.filter((check) => check.level === 'fail').length
  };
}

export function sourcePriority(source) {
  return [
    '.ai-playbook/rules',
    '.github/instructions',
    '.github/copilot-instructions.md',
    '.cursor/rules',
    '.claude/rules',
    'CONTEXT.md'
  ].indexOf(source);
}

export function unquote(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

export function escapeRegex(char) {
  return /[\\^$.*+?()[\]{}|]/.test(char) ? `\\${char}` : char;
}

export function normalizePortablePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function toPortablePath(value) {
  return value.split(path.sep).join('/');
}

export function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function assertDirectory(dir, message) {
  if (!existsSync(dir)) throw new Error(`${message}: ${dir}`);
  const info = await stat(dir);
  if (!info.isDirectory()) throw new Error(`Not a directory: ${dir}`);
}
