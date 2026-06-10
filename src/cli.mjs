import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAdapterReadiness } from './adapter-readiness.mjs';
import {
  buildProjectContext,
  bootstrapProject,
  checkGuides,
  createPlan,
  createWorklog,
  doctorProject,
  parseMaxChars,
  syncGuides,
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
          target: resolveTarget(cwd, targetArg)
        });
        if (parsed.flags.json) {
          writeJson(stdout, result);
        } else {
          for (const guide of result.guides) {
            write(stdout, `[${guide.status.toUpperCase()}] ${guide.path}\n`);
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

    if (command === 'adapter' && subcommand === 'check') {
      const result = await checkAdapterReadiness({
        repoRoot: root,
        target: resolveTarget(cwd, targetArg),
        adapter: parsed.flags.adapter,
        maxChars: parseMaxChars(parsed.flags['max-chars'])
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
  return ['profile', 'title', 'date', 'month', 'max-chars', 'adapter'].includes(key);
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

function helpText() {
  return `ai-playbook\n\nUsage:\n  ai-playbook bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]\n  ai-playbook doctor <target> [--strict] [--json]\n  ai-playbook guides sync <target> [--dry-run] [--force]\n  ai-playbook guides sync <target> --check [--json]\n  ai-playbook context <target> [--json] [--max-chars N]\n  ai-playbook adapter check <target> --adapter codex|claude-code [--json] [--max-chars N]\n  ai-playbook plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]\n  ai-playbook worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]\n  ai-playbook worklog summarize <target> --month YYYY-MM [--dry-run] [--force]\n`;
}
