import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  buildProjectContext,
  DEFAULT_CONTEXT_MAX_CHARS,
  parseMaxChars
} from '../../src/harness.mjs';

const DEFAULT_CONTEXT_EVENTS = ['SessionStart', 'PostCompact'];
const OPTIONAL_REMINDER_EVENTS = ['UserPromptSubmit', 'PostToolUse'];
const EDIT_LIKE_TOOL_PATTERN = /\b(apply_patch|edit|write|create|delete|move|rename|replace)\b/i;
const PATH_KEYS = new Set([
  'destination',
  'file',
  'file_path',
  'filePath',
  'filename',
  'path',
  'paths',
  'source',
  'target_path',
  'targetPath'
]);

export async function runContextHook(input, options = {}) {
  const env = options.env ?? process.env;
  const allowedEvents = enabledHookEvents(options.allowedEvents ?? DEFAULT_CONTEXT_EVENTS, options.hookEvents ?? env.AI_PLAYBOOK_HOOK_EVENTS);
  const hookEventName = typeof input?.hook_event_name === 'string' ? input.hook_event_name : '';
  if (!allowedEvents.includes(hookEventName)) return '';

  const target = typeof input.cwd === 'string' && input.cwd.trim()
    ? input.cwd
    : options.cwd ?? process.cwd();
  const maxChars = safeMaxChars(options.maxChars ?? env.AI_PLAYBOOK_CONTEXT_MAX_CHARS);

  try {
    if (hookEventName === 'UserPromptSubmit') {
      return promptReminderOutput(input, target, hookEventName, maxChars);
    }
    if (hookEventName === 'PostToolUse') {
      return postToolUseReminderOutput(input, target, hookEventName, maxChars);
    }

    const context = await buildProjectContext({ target, maxChars });
    if (!context.ok || !context.additionalContext) return '';
    return hookOutput(hookEventName, context.additionalContext);
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

function enabledHookEvents(defaultEvents, value) {
  const optionalEvents = parseHookEvents(value).filter((eventName) => OPTIONAL_REMINDER_EVENTS.includes(eventName));
  return Array.from(new Set([...defaultEvents, ...optionalEvents]));
}

function parseHookEvents(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  const raw = value.trim();
  if (raw === '*') return OPTIONAL_REMINDER_EVENTS;
  return raw.split(/[,\s;]+/).map((item) => item.trim()).filter(Boolean);
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

function promptReminderOutput(input, target, hookEventName, maxChars) {
  if (!hasPlaybook(target)) return '';
  const prompt = promptText(input);
  const reminders = promptReminders(prompt);
  if (reminders.length === 0) return '';
  return hookOutput(hookEventName, limitReminder([
    '<ai-playbook-reminder>',
    'The current prompt looks like it touches repository handoff or guardrail work.',
    ...reminders,
    '</ai-playbook-reminder>'
  ].join('\n'), maxChars));
}

function postToolUseReminderOutput(input, target, hookEventName, maxChars) {
  if (!hasPlaybook(target)) return '';
  if (!isEditLikeTool(input)) return '';
  const changedPaths = Array.from(new Set(extractToolPaths(input))).slice(0, 8);
  if (changedPaths.length === 0) return '';
  const reminders = pathReminders(changedPaths);
  if (reminders.length === 0) return '';
  return hookOutput(hookEventName, limitReminder([
    '<ai-playbook-reminder>',
    `Edit-like tool output referenced: ${changedPaths.join(', ')}`,
    ...reminders,
    '</ai-playbook-reminder>'
  ].join('\n'), maxChars));
}

function promptText(input) {
  const candidates = [
    input?.prompt,
    input?.user_prompt,
    input?.userPrompt,
    input?.message,
    input?.text
  ];
  return candidates.find((candidate) => typeof candidate === 'string') ?? '';
}

function promptReminders(prompt) {
  const text = prompt.toLowerCase();
  const reminders = [];
  if (/(^|\W)(commit|push|pr|pull request|merge)(\W|$)|커밋|푸시|풀\s*리퀘|피알|머지|병합/i.test(text)) {
    reminders.push('- Git guardrail: check branch/status, stage only task files, and mention only verification that actually ran.');
  }
  if (/(^|\W)worklog(\W|$)|워크로그|작업\s*로그/i.test(text)) {
    reminders.push('- Worklog guardrail: record decisions, blockers, and durable facts; promote still-current facts into CURRENT.md, maps, or runbooks.');
  }
  if (/(^|\W)doctor(\W|$)|닥터|하네스\s*점검|playbook\s*check/i.test(text)) {
    reminders.push('- Doctor guardrail: prefer JSON output for automation and keep failures visible instead of hiding them in hook behavior.');
  }
  return reminders;
}

function isEditLikeTool(input) {
  const toolName = [
    input?.tool_name,
    input?.toolName,
    input?.name
  ].find((candidate) => typeof candidate === 'string') ?? '';
  return EDIT_LIKE_TOOL_PATTERN.test(toolName);
}

function extractToolPaths(input) {
  const values = [
    input?.tool_input,
    input?.toolInput,
    input?.arguments,
    input?.input
  ];
  return values.flatMap((value) => extractPaths(value)).map(normalizePath).filter(Boolean);
}

function extractPaths(value, key = '', seen = new Set()) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    if (key === 'patch' || key === 'diff' || value.includes('*** Begin Patch')) {
      return extractPatchPaths(value);
    }
    return PATH_KEYS.has(key) && looksLikePath(value) ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractPaths(item, key, seen));
  }
  if (typeof value !== 'object') return [];
  if (seen.has(value)) return [];
  seen.add(value);
  return Object.entries(value).flatMap(([entryKey, entryValue]) => {
    const normalizedKey = entryKey.replace(/[-\s]/g, '_');
    if (PATH_KEYS.has(normalizedKey) || normalizedKey === 'patch' || normalizedKey === 'diff') {
      return extractPaths(entryValue, normalizedKey, seen);
    }
    return extractPaths(entryValue, '', seen);
  });
}

function extractPatchPaths(value) {
  const paths = [];
  const filePattern = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm;
  const movePattern = /^\*\*\* Move to: (.+)$/gm;
  for (const match of value.matchAll(filePattern)) paths.push(match[1]);
  for (const match of value.matchAll(movePattern)) paths.push(match[1]);
  return paths;
}

function pathReminders(paths) {
  const reminders = new Set();
  if (paths.some((item) => item === 'AGENTS.md' || item.endsWith('/AGENTS.md') || item.startsWith('ai-playbook/'))) {
    reminders.add('- Project policy reminder: durable rules and memory should stay visible in AGENTS.md, ai-playbook/, or project docs.');
  }
  if (paths.some((item) => item.startsWith('skills/'))) {
    reminders.add('- Skill reminder: keep SKILL.md concise and trigger-focused; put longer reusable detail in references/ and validate skills.');
  }
  if (paths.some((item) => item.startsWith('docs/') || item.startsWith('templates/') || item.startsWith('adapters/'))) {
    reminders.add('- Documentation reminder: update matching Korean translations when English source docs change and validate translations.');
  }
  if (paths.some((item) => item.startsWith('adapters/'))) {
    reminders.add('- Adapter reminder: keep hooks opt-in, read-only by default, no-network, and covered by adapter readiness checks before local activation.');
  }
  return Array.from(reminders);
}

function normalizePath(value) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^a\//, '')
    .replace(/^b\//, '');
}

function looksLikePath(value) {
  return /[\\/]/.test(value) || /\.[A-Za-z0-9]{1,8}$/.test(value);
}

function hasPlaybook(target) {
  return existsSync(path.join(target, 'ai-playbook'));
}

function hookOutput(hookEventName, additionalContext) {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName,
      additionalContext
    }
  });
}

function limitReminder(text, maxChars) {
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() : text;
}

function debug(label, error) {
  if (!process.env.AI_PLAYBOOK_DEBUG) return;
  const prefix = label ? `[ai-playbook ${label}]` : '[ai-playbook hook]';
  process.stderr.write(`${prefix} ${error instanceof Error ? error.message : String(error)}\n`);
}
