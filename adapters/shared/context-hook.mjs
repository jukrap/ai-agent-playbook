import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  buildProjectContext,
  DEFAULT_CONTEXT_MAX_CHARS,
  parseMaxChars
} from '../../src/harness.mjs';

export async function runContextHook(input, options = {}) {
  const allowedEvents = options.allowedEvents ?? ['SessionStart', 'PostCompact'];
  const hookEventName = typeof input?.hook_event_name === 'string' ? input.hook_event_name : '';
  if (!allowedEvents.includes(hookEventName)) return '';

  const target = typeof input.cwd === 'string' && input.cwd.trim()
    ? input.cwd
    : options.cwd ?? process.cwd();
  const maxChars = safeMaxChars(options.maxChars ?? process.env.AI_PLAYBOOK_CONTEXT_MAX_CHARS);

  try {
    const context = await buildProjectContext({ target, maxChars });
    if (!context.ok || !context.additionalContext) return '';
    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName,
        additionalContext: context.additionalContext
      }
    });
  } catch (error) {
    debug(options.label, error);
    return '';
  }
}

export async function runContextHookCli(options) {
  const input = parseHookInput(readAllStdin());
  if (!input) return;
  const output = await options.runner(input, options);
  if (output) {
    process.stdout.write(`${output}\n`);
  }
}

export function isDirectCli(importMetaUrl) {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}

function safeMaxChars(value) {
  try {
    return parseMaxChars(value);
  } catch {
    return DEFAULT_CONTEXT_MAX_CHARS;
  }
}

function parseHookInput(raw) {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function readAllStdin() {
  return readFileSync(0, 'utf8');
}

function debug(label, error) {
  if (!process.env.AI_PLAYBOOK_DEBUG) return;
  const prefix = label ? `[ai-playbook ${label}]` : '[ai-playbook hook]';
  process.stderr.write(`${prefix} ${error instanceof Error ? error.message : String(error)}\n`);
}
