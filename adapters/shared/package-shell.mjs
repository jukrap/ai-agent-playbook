import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAdapterReadiness, renderAdapterConfig } from '../../src/adapter-readiness.mjs';
import { parseMaxChars } from '../../src/harness.mjs';

export async function runAdapterShell(argv, io = {}, options) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const env = io.env ?? process.env;
  const repoRoot = io.repoRoot ?? options.repoRoot;

  try {
    const parsed = parseArgs(argv);
    if (parsed.positionals.length === 0 || parsed.flags.help) {
      write(stdout, helpText(options.adapter));
      return 0;
    }

    const [command, targetArg] = parsed.positionals;
    if (command === 'hook') {
      const input = parseHookInput((io.readStdin ?? readAllStdin)());
      if (!input) return 0;
      const output = await options.runner(input, {
        env,
        maxChars: parseMaxChars(parsed.flags['max-chars']),
        label: options.adapter
      });
      if (output) write(stdout, `${output}\n`);
      return 0;
    }

    if (command === 'config') {
      const result = await renderAdapterConfig({
        repoRoot,
        target: resolveTarget(cwd, targetArg),
        adapter: options.adapter
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

    if (command === 'check') {
      const result = await checkAdapterReadiness({
        repoRoot,
        target: resolveTarget(cwd, targetArg),
        adapter: options.adapter,
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

    write(stderr, `Unknown adapter shell command: ${command}\n\n${helpText(options.adapter)}`);
    return 1;
  } catch (error) {
    write(stderr, `${error.message}\n`);
    return 1;
  }
}

export function isDirectAdapterShellCli(importMetaUrl) {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}

function parseArgs(argv) {
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
  return ['max-chars', 'settings'].includes(key);
}

function resolveTarget(cwd, value) {
  if (!value) throw new Error('Missing target path.');
  return path.resolve(cwd, value);
}

function parseHookInput(raw) {
  if (!raw.trim()) return null;
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === 'object' ? parsed : null;
}

function readAllStdin() {
  return readFileSync(0, 'utf8');
}

function write(stream, text) {
  stream.write(text);
}

function writeJson(stream, value) {
  write(stream, `${JSON.stringify(value, null, 2)}\n`);
}

function helpText(adapter) {
  return [
    `ai-agent-playbook ${adapter} adapter shell`,
    '',
    'Usage:',
    `  node adapters/${adapter}/package.mjs hook [--max-chars N]`,
    `  node adapters/${adapter}/package.mjs config <target> [--json]`,
    `  node adapters/${adapter}/package.mjs check <target> [--json] [--max-chars N] [--settings <path>]`,
    ''
  ].join('\n');
}
