import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { checkGuides, doctorProject, SCHEMA_VERSION } from './harness.mjs';

const RULE_DIRECTORY_SOURCES = [
  ['.ai-playbook/rules', '.ai-playbook/rules'],
  ['.github/instructions', '.github/instructions'],
  ['.cursor/rules', '.cursor/rules'],
  ['.claude/rules', '.claude/rules']
];

const RULE_FILE_SOURCES = [
  ['.github/copilot-instructions.md', '.github/copilot-instructions.md'],
  ['CONTEXT.md', 'CONTEXT.md']
];

const RULE_EXTENSIONS = new Set(['.md', '.mdc']);
const RULE_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage']);
const PACKAGE_SCRIPT_ORDER = ['check', 'test', 'test:run', 'lint', 'typecheck', 'build'];
const PACKAGE_MANAGER_LOCKFILES = [
  ['pnpm', 'pnpm-lock.yaml'],
  ['yarn', 'yarn.lock'],
  ['npm', 'package-lock.json'],
  ['bun', 'bun.lockb'],
  ['bun', 'bun.lock']
];

export async function checkOperator(options) {
  const {
    repoRoot,
    target,
    filePath,
    includeDiff = false
  } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const [doctor, guides, diagnostics, rules] = await Promise.all([
    doctorProject({ target: resolvedTarget }),
    checkGuides({ repoRoot, target: resolvedTarget, includeDiff }),
    checkDiagnostics({ target: resolvedTarget }),
    checkRules({ target: resolvedTarget, filePath })
  ]);

  const checks = [
    operatorCheckForDoctor(doctor),
    operatorCheckForGuides(guides),
    operatorCheckForDiagnostics(diagnostics),
    operatorCheckForRules(rules)
  ];
  const summary = summarizeChecks(checks);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    ...(rules.path === undefined ? {} : { path: rules.path }),
    summary: {
      sections: checks.length,
      ...summary
    },
    checks,
    sections: {
      doctor,
      guides,
      diagnostics,
      rules
    }
  };
}

export async function checkRules(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const warnings = [];
  const rules = [];

  for (const [relativeRoot, source] of RULE_DIRECTORY_SOURCES) {
    const root = path.join(resolvedTarget, ...relativeRoot.split('/'));
    const files = await walkRuleFiles(root);
    for (const file of files) {
      rules.push(await buildRuleEntry({
        target: resolvedTarget,
        file,
        source,
        relativePath,
        isSingleFile: false,
        warnings
      }));
    }
  }

  for (const [relativeFile, source] of RULE_FILE_SOURCES) {
    const file = path.join(resolvedTarget, ...relativeFile.split('/'));
    if (!existsSync(file)) continue;
    rules.push(await buildRuleEntry({
      target: resolvedTarget,
      file,
      source,
      relativePath,
      isSingleFile: true,
      warnings
    }));
  }

  rules.sort((left, right) => sourcePriority(left.source) - sourcePriority(right.source) || left.path.localeCompare(right.path));
  const summary = {
    total: rules.length,
    applies: rules.filter((rule) => rule.applies).length,
    warnings: warnings.length
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary,
    rules,
    warnings
  };
}

export async function checkDiagnostics(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const packageManager = detectPackageManager(resolvedTarget);
  const checks = [
    checkResult('pass', 'diagnostics.target', 'diagnostics', 'target directory', 'Target directory exists.', ['.']),
    checkResult(
      'pass',
      'diagnostics.package-manager',
      'diagnostics',
      'package manager',
      packageManager.lockfile
        ? `Using ${packageManager.name} command syntax from ${packageManager.lockfile}.`
        : `Using ${packageManager.name} command syntax by default.`,
      packageManager.lockfile ? [packageManager.lockfile] : ['package.json']
    )
  ];
  const commands = [];

  const packageJson = path.join(resolvedTarget, 'package.json');
  if (existsSync(packageJson)) {
    try {
      const parsed = JSON.parse(await readFile(packageJson, 'utf8'));
      checks.push(checkResult('pass', 'diagnostics.package-json', 'diagnostics', 'package.json', 'Parsed package.json.', ['package.json']));
      const scripts = isRecord(parsed.scripts) ? parsed.scripts : {};
      for (const script of PACKAGE_SCRIPT_ORDER) {
        if (typeof scripts[script] !== 'string') continue;
        commands.push({
          id: `${packageManager.name}.${script.replace(/[^a-z0-9]+/gi, '-')}`,
          source: 'package.json',
          command: renderPackageScriptCommand(packageManager.name, script),
          script,
          description: scripts[script]
        });
      }
    } catch (error) {
      checks.push(checkResult('fail', 'diagnostics.package-json', 'diagnostics', 'package.json', `Could not parse package.json: ${error.message}`, ['package.json']));
    }
  } else {
    checks.push(checkResult('warn', 'diagnostics.package-json', 'diagnostics', 'package.json', 'No package.json found.', ['package.json']));
  }

  await addLanguageCommandCandidates(resolvedTarget, commands);
  checks.push(checkResult(
    commands.length > 0 ? 'pass' : 'warn',
    'diagnostics.commands',
    'diagnostics',
    'verification commands',
    commands.length > 0 ? `Found ${commands.length} local command candidate(s).` : 'No local verification command candidates found.',
    commands.map((command) => command.source)
  ));

  const summary = summarizeChecks(checks);
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    packageManager,
    summary: {
      ...summary,
      commands: commands.length
    },
    commands,
    checks
  };
}

export async function checkTuiCapture(options) {
  const { file, cols = 80 } = options;
  if (!Number.isInteger(cols) || cols <= 0) {
    throw new Error('Invalid --cols; expected a positive integer.');
  }
  if (!existsSync(file)) throw new Error(`TUI capture file does not exist: ${file}`);
  const info = await stat(file);
  if (!info.isFile()) throw new Error(`Not a file: ${file}`);

  const raw = await readFile(file, 'utf8');
  const withoutAnsi = stripAnsi(raw);
  const clean = withoutAnsi.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.endsWith('\n') ? clean.slice(0, -1).split('\n') : clean.split('\n');
  const lineWidths = lines.map(displayWidth);
  const overflowLines = [];
  const wideCharColumns = [];
  let borderMisaligned = false;

  for (const [index, line] of lines.entries()) {
    const width = lineWidths[index] ?? 0;
    if (width > cols) {
      overflowLines.push({ line: index + 1, width, overflowBy: width - cols });
    }
    wideCharColumns.push(...wideCharactersForLine(line, index + 1));
    if (hasBoxDrawing(line) && width !== cols) {
      borderMisaligned = true;
    }
  }

  const maxWidth = lineWidths.length === 0 ? 0 : Math.max(...lineWidths);
  const ok = overflowLines.length === 0 && !borderMisaligned;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok,
    command: 'qa.tui-check',
    file: path.resolve(file),
    expectedColumns: cols,
    lineCount: lines.length,
    lineWidths,
    maxWidth,
    overflowLines,
    borderMisaligned,
    wideCharColumns,
    hasAnsi: raw !== withoutAnsi
  };
}

function detectPackageManager(target) {
  for (const [name, lockfile] of PACKAGE_MANAGER_LOCKFILES) {
    if (existsSync(path.join(target, lockfile))) {
      return { name, lockfile };
    }
  }
  return { name: 'npm', lockfile: null };
}

function renderPackageScriptCommand(packageManagerName, script) {
  if (packageManagerName === 'npm') {
    return script === 'test' ? 'npm test' : `npm run ${script}`;
  }
  if (packageManagerName === 'bun') {
    return `bun run ${script}`;
  }
  return `${packageManagerName} ${script}`;
}

function operatorCheckForDoctor(doctor) {
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

function operatorCheckForGuides(guides) {
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

function operatorCheckForDiagnostics(diagnostics) {
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

function operatorCheckForRules(rules) {
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

function summaryLevel(summary) {
  if ((summary.fail ?? 0) > 0) return 'fail';
  if ((summary.warn ?? 0) > 0) return 'warn';
  return 'pass';
}

function pathsFromChecks(checks) {
  return [...new Set(checks
    .filter((check) => check.level !== 'pass')
    .flatMap((check) => check.paths ?? []))];
}

async function buildRuleEntry(options) {
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

function parseRuleFile(text) {
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
    }
  }

  return { frontmatter, diagnostics };
}

function parseGlobsValue(rawValue, followingLines) {
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

function matchRule({ frontmatter, isSingleFile, relativePath }) {
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

function globMatches(glob, relativePath) {
  return globToRegex(normalizePortablePath(glob)).test(normalizePortablePath(relativePath));
}

function globToRegex(glob) {
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

async function addLanguageCommandCandidates(target, commands) {
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

async function walkRuleFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  await walk(root, files);
  files.sort();
  return files;
}

async function walk(current, files) {
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

function normalizeTargetRelativePath(target, filePath) {
  const resolved = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(target, filePath);
  const relative = path.relative(target, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return normalizePortablePath(filePath);
  }
  return toPortablePath(relative);
}

function displayWidth(text) {
  let width = 0;
  for (const char of [...text]) {
    width += charWidth(char);
  }
  return width;
}

function wideCharactersForLine(text, line) {
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

function charWidth(char) {
  const code = char.codePointAt(0) ?? 0;
  if (code === 0) return 0;
  if (code < 32 || (code >= 0x7f && code < 0xa0)) return 0;
  if (isCombining(code)) return 0;
  return isWide(code) ? 2 : 1;
}

function isCombining(code) {
  return (code >= 0x0300 && code <= 0x036f)
    || (code >= 0x1ab0 && code <= 0x1aff)
    || (code >= 0x1dc0 && code <= 0x1dff)
    || (code >= 0x20d0 && code <= 0x20ff)
    || (code >= 0xfe20 && code <= 0xfe2f);
}

function isWide(code) {
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

function stripAnsi(text) {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

function hasBoxDrawing(text) {
  return /[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/.test(text);
}

function checkResult(level, id, category, name, message, paths = []) {
  return { id, level, category, name, message, paths };
}

function summarizeChecks(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.level === 'pass').length,
    warn: checks.filter((check) => check.level === 'warn').length,
    fail: checks.filter((check) => check.level === 'fail').length
  };
}

function sourcePriority(source) {
  return [
    '.ai-playbook/rules',
    '.github/instructions',
    '.github/copilot-instructions.md',
    '.cursor/rules',
    '.claude/rules',
    'CONTEXT.md'
  ].indexOf(source);
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

function escapeRegex(char) {
  return /[\\^$.*+?()[\]{}|]/.test(char) ? `\\${char}` : char;
}

function normalizePortablePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function toPortablePath(value) {
  return value.split(path.sep).join('/');
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function assertDirectory(dir, message) {
  if (!existsSync(dir)) throw new Error(`${message}: ${dir}`);
  const info = await stat(dir);
  if (!info.isDirectory()) throw new Error(`Not a directory: ${dir}`);
}
