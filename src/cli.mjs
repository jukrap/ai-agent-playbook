import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAdapterReadiness, renderAdapterConfig } from './adapter-readiness.mjs';
import { auditOperator, checkDiagnostics, checkOperator, checkRules, checkTuiCapture, gcOperator, mapOperator, previewOperatorContext, searchOperator } from './operator-diagnostics.mjs';
import {
  buildProjectContext,
  buildDoctorReminderSignal,
  bootstrapProject,
  checkGuides,
  checkManagedManifest,
  createPlan,
  createWorklog,
  doctorProject,
  migratePlaybookPath,
  parseMaxChars,
  adoptManagedManifest,
  syncGuides,
  uninstallManagedManifest,
  summarizeWorklogs
} from './harness.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function runCli(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const root = io.repoRoot ?? repoRoot;

  try {
    const parsed = parseArgs(argv);
    if (parsed.positionals.length === 0 || parsed.flags.help) {
      write(stdout, helpText());
      return 0;
    }

    const [command, subcommand, targetArg] = parsed.positionals;
    if (command === 'bootstrap') {
      const target = resolveTarget(cwd, subcommand);
      const result = await bootstrapProject({
        repoRoot: root,
        target,
        profile: parsed.flags.profile,
        localOnly: Boolean(parsed.flags['local-only']),
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      printOperations(stdout, result.operations);
      if (!result.ok) {
        write(stderr, `Conflicts:\n${result.conflicts.map((item) => `- ${item}`).join('\n')}\nUse --force to overwrite.\n`);
        return 2;
      }
      return 0;
    }

    if (command === 'doctor') {
      const target = resolveTarget(cwd, subcommand);
      if (parsed.flags.reminder) {
        const result = await buildDoctorReminderSignal({ repoRoot: root, target });
        if (parsed.flags.json) {
          writeJson(stdout, result);
        } else if (result.reminders.length) {
          for (const reminder of result.reminders) {
            write(stdout, `[${reminder.level.toUpperCase()}] ${reminder.message}\n`);
          }
        } else {
          write(stdout, 'No doctor reminders.\n');
        }
        return 0;
      }
      const result = await doctorProject({ target, strict: Boolean(parsed.flags.strict) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const check of result.checks) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'guides' && subcommand === 'sync') {
      if (parsed.flags.check) {
        const result = await checkGuides({
          repoRoot: root,
          target: resolveTarget(cwd, targetArg),
          includeDiff: Boolean(parsed.flags.diff)
        });
        if (parsed.flags.json) {
          writeJson(stdout, result);
        } else {
          for (const guide of result.guides) {
            const suffix = guide.diff ? ` (first diff line ${guide.diff.firstDifferenceLine})` : '';
            write(stdout, `[${guide.status.toUpperCase()}] ${guide.path}${suffix}\n`);
          }
        }
        return result.ok ? 0 : 1;
      }
      const result = await syncGuides({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      printOperations(stdout, result.operations);
      if (!result.ok) {
        write(stderr, `Conflicts:\n${result.conflicts.map((item) => `- ${item}`).join('\n')}\nUse --force to overwrite.\n`);
        return 2;
      }
      return 0;
    }

    if (command === 'context') {
      const result = await buildProjectContext({
        target: resolveTarget(cwd, subcommand),
        maxChars: parseMaxChars(parsed.flags['max-chars'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else if (result.additionalContext) {
        write(stdout, `${result.additionalContext}\n`);
      } else {
        for (const warning of result.warnings) {
          write(stderr, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'migrate' && subcommand === 'path') {
      const result = await migratePlaybookPath({
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to perform this migration.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'check') {
      const result = await checkManagedManifest({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Managed manifest: ${result.ok ? 'ok' : 'needs attention'}\n`);
        for (const file of result.files) {
          write(stdout, `[${file.status.toUpperCase()}] ${file.path}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'adopt') {
      const result = await adoptManagedManifest({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        if (!parsed.flags.apply) {
          write(stdout, 'Re-run with --apply to write the managed manifest.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'managed' && subcommand === 'uninstall') {
      const result = await uninstallManagedManifest({
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to remove unmodified managed files.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'check') {
      const result = await checkOperator({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        includeDiff: Boolean(parsed.flags.diff)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator check: ${result.ok ? 'ok' : 'needs attention'}\n`);
        for (const check of result.checks) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'search') {
      const result = await searchOperator({
        target: resolveTarget(cwd, targetArg),
        query: parsed.flags.query,
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined,
        maxResults: parseMaxResults(parsed.flags['max-results'])
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator search: ${result.summary.matches} match(es)\n`);
        for (const item of result.results) {
          const first = item.snippets[0];
          write(stdout, `[${item.category}] ${item.path}${first ? `:${first.line} ${first.text}` : ''}\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'context') {
      const result = await previewOperatorContext({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator context: ${result.summary.matchingContextFiles} context match(es), ${result.summary.ruleMatches} rule match(es)\n`);
        for (const item of result.contexts.filter((context) => context.applies)) {
          write(stdout, `[CONTEXT] ${item.path} (${item.reason})\n`);
        }
        for (const item of result.related) {
          write(stdout, `[${item.category}] ${item.path}\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'map') {
      const result = await mapOperator({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator map: ${result.summary.sourceFiles} source file(s), ${result.summary.testFiles} test file(s)\n`);
        write(stdout, `Package manager: ${result.stack.packageManager.name}\n`);
        if (result.stack.frameworks.length > 0) {
          write(stdout, `Frameworks: ${result.stack.frameworks.map((framework) => framework.name).join(', ')}\n`);
        }
        if (result.summary.concerns > 0) {
          write(stdout, `Concerns: ${result.summary.concerns}\n`);
        }
      }
      return 0;
    }

    if (command === 'operator' && subcommand === 'audit') {
      const result = await auditOperator({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Operator audit: ${result.summary.findings} finding(s)\n`);
        for (const finding of result.findings) {
          write(stdout, `[${finding.level.toUpperCase()}] ${finding.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'operator' && subcommand === 'gc') {
      const result = await gcOperator({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        apply: Boolean(parsed.flags.apply)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        for (const operation of result.operations) {
          write(stdout, `[PLAN] ${operation.message}\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        for (const conflict of result.conflicts) {
          write(stdout, `[CONFLICT] ${conflict.message}\n`);
        }
        if (!parsed.flags.apply && result.operations.length > 0) {
          write(stdout, 'Re-run with --apply to remove obsolete unmodified managed files.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'rules' && subcommand === 'check') {
      const result = await checkRules({
        target: resolveTarget(cwd, targetArg),
        filePath: typeof parsed.flags.path === 'string' ? parsed.flags.path : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Rule matches: ${result.summary.applies}/${result.summary.total}\n`);
        for (const rule of result.rules) {
          write(stdout, `[${rule.applies ? 'MATCH' : 'SKIP'}] ${rule.path} (${rule.reason})\n`);
        }
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'diagnostics' && subcommand === 'check') {
      const result = await checkDiagnostics({ target: resolveTarget(cwd, targetArg) });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Diagnostics commands: ${result.summary.commands}\n`);
        for (const commandCandidate of result.commands) {
          write(stdout, `- ${commandCandidate.command} (${commandCandidate.source})\n`);
        }
        for (const check of result.checks.filter((item) => item.level !== 'pass')) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'qa' && subcommand === 'tui-check') {
      const result = await checkTuiCapture({
        file: resolveTarget(cwd, targetArg),
        cols: parseColumns(parsed.flags.cols)
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `TUI width: max ${result.maxWidth}/${result.expectedColumns}\n`);
        for (const line of result.overflowLines) {
          write(stdout, `[OVERFLOW] line ${line.line}: ${line.width} columns (+${line.overflowBy})\n`);
        }
        if (result.borderMisaligned) {
          write(stdout, '[WARN] box-drawing borders do not match expected columns.\n');
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'adapter' && subcommand === 'check') {
      const result = await checkAdapterReadiness({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        adapter: parsed.flags.adapter,
        maxChars: parseMaxChars(parsed.flags['max-chars']),
        settingsPath: parsed.flags.settings ? path.resolve(cwd, parsed.flags.settings) : undefined
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Adapter readiness: ${result.adapter} (${result.ok ? 'ok' : 'needs attention'})\n`);
        for (const check of result.checks) {
          write(stdout, `[${check.level.toUpperCase()}] ${check.name}: ${check.message}\n`);
        }
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'adapter' && subcommand === 'config') {
      const result = await renderAdapterConfig({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        adapter: parsed.flags.adapter
      });
      if (parsed.flags.json) {
        writeJson(stdout, result);
      } else {
        write(stdout, `Adapter config: ${result.adapter}\n`);
        write(stdout, `Hook command: ${result.hookCommand}\n`);
        for (const warning of result.warnings) {
          write(stdout, `[WARN] ${warning.message}\n`);
        }
        writeJson(stdout, result.config);
      }
      return result.ok ? 0 : 1;
    }

    if (command === 'plan' && subcommand === 'new') {
      const result = await createPlan({
        target: resolveTarget(cwd, targetArg),
        title: parsed.flags.title,
        date: parsed.flags.date,
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      return printScaffoldResult(result, stdout, stderr);
    }

    if (command === 'worklog' && subcommand === 'new') {
      const result = await createWorklog({
        target: resolveTarget(cwd, targetArg),
        title: parsed.flags.title,
        date: parsed.flags.date,
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      return printScaffoldResult(result, stdout, stderr);
    }

    if (command === 'worklog' && subcommand === 'summarize') {
      const result = await summarizeWorklogs({
        target: resolveTarget(cwd, targetArg),
        month: parsed.flags.month,
        dryRun: Boolean(parsed.flags['dry-run']),
        force: Boolean(parsed.flags.force)
      });
      return printScaffoldResult(result, stdout, stderr);
    }

    write(stderr, `Unknown command: ${argv.join(' ')}\n\n${helpText()}`);
    return 1;
  } catch (error) {
    write(stderr, `${error.message}\n`);
    return 1;
  }
}

export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const raw = arg.slice(2);
    const [key, inlineValue] = raw.split('=', 2);
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--') && needsValue(key)) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = true;
    }
  }
  return { flags, positionals };
}

function needsValue(key) {
  return ['profile', 'title', 'date', 'month', 'max-chars', 'adapter', 'settings', 'path', 'cols', 'query', 'max-results'].includes(key);
}

function resolveTarget(cwd, value) {
  if (!value) throw new Error('Missing target path.');
  return path.resolve(cwd, value);
}

function printOperations(stdout, operations) {
  for (const operation of operations) {
    write(stdout, `${operation}\n`);
  }
}

function printScaffoldResult(result, stdout, stderr) {
  if (!result.ok) {
    write(stderr, `Refusing to overwrite existing file: ${result.file}\nUse --force to overwrite.\n`);
    return 2;
  }
  printOperations(stdout, result.operations);
  return 0;
}

function write(stream, text) {
  stream.write(text);
}

function writeJson(stream, value) {
  write(stream, `${JSON.stringify(value, null, 2)}\n`);
}

function parseColumns(value) {
  if (value === undefined || value === false) return 80;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid --cols; expected a positive integer.');
  }
  return parsed;
}

function parseMaxResults(value) {
  if (value === undefined || value === false) return 20;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }
  return parsed;
}

function helpText() {
  return `ai-playbook\n\nUsage:\n  ai-playbook bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]\n  ai-playbook doctor <target> [--strict] [--json]\n  ai-playbook doctor <target> --reminder [--json]\n  ai-playbook guides sync <target> [--dry-run] [--force]\n  ai-playbook guides sync <target> --check [--diff] [--json]\n  ai-playbook migrate path <target> [--apply] [--json]\n  ai-playbook managed check <target> [--json]\n  ai-playbook managed adopt <target> [--apply] [--json]\n  ai-playbook managed uninstall <target> [--apply] [--json]\n  ai-playbook context <target> [--json] [--max-chars N]\n  ai-playbook operator check <target> [--path <file>] [--diff] [--json]\n  ai-playbook operator search <target> --query <text> [--path <file>] [--max-results N] [--json]\n  ai-playbook operator context <target> --path <file> [--json]\n  ai-playbook operator map <target> [--json]\n  ai-playbook operator audit <target> [--json]\n  ai-playbook operator gc <target> [--apply] [--json]\n  ai-playbook rules check <target> [--path <file>] [--json]\n  ai-playbook diagnostics check <target> [--json]\n  ai-playbook qa tui-check <capture-file> [--cols N] [--json]\n  ai-playbook adapter config <target> --adapter codex|claude-code [--json]\n  ai-playbook adapter check <target> --adapter codex|claude-code [--json] [--max-chars N] [--settings <path>]\n  ai-playbook plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]\n  ai-playbook worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]\n  ai-playbook worklog summarize <target> --month YYYY-MM [--dry-run] [--force]\n`;
}
