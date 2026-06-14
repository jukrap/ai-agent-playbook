import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  SCHEMA_VERSION
} from '../harness.mjs';
import {
  PACKAGE_SCRIPT_ORDER,
  addLanguageCommandCandidates,
  assertDirectory,
  checkResult,
  detectPackageManager,
  displayWidth,
  hasBoxDrawing,
  isRecord,
  renderPackageScriptCommand,
  stripAnsi,
  summarizeChecks,
  wideCharactersForLine
} from './shared.mjs';

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
