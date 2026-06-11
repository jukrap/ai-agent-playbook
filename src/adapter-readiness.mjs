import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { runClaudeCodeHook } from '../adapters/claude-code/hook.mjs';
import { runCodexHook } from '../adapters/codex/hook.mjs';
import {
  buildProjectContext,
  DEFAULT_CONTEXT_MAX_CHARS,
  resolvePlaybookLayout,
  SCHEMA_VERSION
} from './harness.mjs';

const ADAPTERS = {
  codex: {
    hookPath: 'adapters/codex/hook.mjs',
    examplePath: 'adapters/codex/hooks.example.json',
    runner: runCodexHook
  },
  'claude-code': {
    hookPath: 'adapters/claude-code/hook.mjs',
    examplePath: 'adapters/claude-code/settings.example.json',
    runner: runClaudeCodeHook
  }
};

export function supportedAdapterNames() {
  return Object.keys(ADAPTERS);
}

export async function renderAdapterConfig(options) {
  const {
    repoRoot,
    target,
    adapter
  } = options;

  const adapterConfig = adapterConfigFor(adapter);
  const resolvedTarget = path.resolve(target);
  if (!await isDirectory(resolvedTarget)) {
    throw new Error(`Target path is missing or is not a directory: ${resolvedTarget}`);
  }

  const warnings = [];
  const preferredPlaybookRoot = path.join(resolvedTarget, '.ai-playbook');
  if (!existsSync(preferredPlaybookRoot) || !await isDirectory(preferredPlaybookRoot)) {
    const hasLegacyPlaybook = existsSync(path.join(resolvedTarget, 'ai-playbook'))
      && await isDirectory(path.join(resolvedTarget, 'ai-playbook'));
    warnings.push({
      id: 'config.playbook.missing',
      message: hasLegacyPlaybook
        ? 'Missing .ai-playbook/; legacy ai-playbook/ remains compatible, but rendered config should be reviewed before manual setup.'
        : 'Missing .ai-playbook/; rendered config is still available for manual setup.',
      paths: ['.ai-playbook/']
    });
  }

  const hookCommand = adapterHookCommand(repoRoot, adapterConfig);
  const config = await adapterExampleWithCommand(repoRoot, adapterConfig, hookCommand);
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    adapter,
    hookCommand,
    config,
    warnings
  };
}

export async function checkAdapterReadiness(options) {
  const {
    repoRoot,
    target,
    adapter,
    maxChars = DEFAULT_CONTEXT_MAX_CHARS,
    settingsPath
  } = options;

  const adapterConfig = adapterConfigFor(adapter);

  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const playbookRoot = playbook.root;
  const checks = [];

  const targetIsDirectory = await isDirectory(resolvedTarget);
  checks.push(check(
    targetIsDirectory ? 'pass' : 'fail',
    'target.directory',
    'setup',
    'target directory',
    targetIsDirectory ? 'Target path is a directory.' : 'Target path is missing or is not a directory.',
    ['.']
  ));

  const hasPlaybook = targetIsDirectory && existsSync(playbookRoot) && await isDirectory(playbookRoot);
  checks.push(check(
    hasPlaybook ? 'pass' : 'fail',
    'playbook.directory',
    'setup',
    `${playbook.dir} directory`,
    hasPlaybook ? `Found ${playbook.relativeRoot}.` : `Missing ${playbook.relativeRoot}.`,
    [playbook.relativeRoot]
  ));

  const context = await safeBuildContext(resolvedTarget, maxChars);
  checks.push(check(
    context.ok && Boolean(context.additionalContext) ? 'pass' : 'fail',
    'context.non-empty',
    'context',
    'core context',
    context.ok && context.additionalContext
      ? `Built context from ${context.sources.length} source file(s).`
      : messageFromWarnings(context.warnings, 'No hook context could be built.'),
    context.sources?.map((source) => source.path) ?? [playbook.relativeRoot]
  ));

  checks.push(await fileCheck(repoRoot, adapterConfig.hookPath, 'adapter.hook-file', 'adapter hook file'));
  checks.push(await fileCheck(repoRoot, adapterConfig.examplePath, 'adapter.example-config', 'adapter example config'));

  checks.push(await hookJsonCheck(adapterConfig.runner, 'SessionStart', resolvedTarget, maxChars));
  checks.push(await hookJsonCheck(adapterConfig.runner, 'PostCompact', resolvedTarget, maxChars));
  checks.push(await quietHookCheck(adapterConfig.runner, 'PostToolUse', resolvedTarget, maxChars, {
    id: 'hook.unsupported-event-silent',
    name: 'unsupported event quiet path',
    message: 'Unsupported hook events produce no stdout.'
  }));
  checks.push(await quietHookCheck(adapterConfig.runner, 'Stop', resolvedTarget, maxChars, {
    id: 'hook.stop-silent-by-default',
    name: 'Stop hook quiet by default',
    message: 'Stop produces no stdout unless explicitly opted in.'
  }));

  const missingPlaybookTarget = hasPlaybook ? playbookRoot : resolvedTarget;
  checks.push(await quietHookCheck(adapterConfig.runner, 'SessionStart', missingPlaybookTarget, maxChars, {
    id: 'hook.missing-playbook-silent',
    name: 'missing playbook quiet path',
    message: 'Missing playbook context produces no stdout.'
  }));

  if (settingsPath) {
    checks.push(...await settingsValidationChecks(repoRoot, adapterConfig, settingsPath));
  }

  const summary = summarize(checks);
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    adapter,
    summary,
    checks
  };
}

function adapterConfigFor(adapter) {
  const adapterConfig = ADAPTERS[adapter];
  if (!adapterConfig) {
    const adapterName = adapter ?? '<missing>';
    throw new Error(`Unsupported adapter: ${adapterName}. Expected one of: ${supportedAdapterNames().join(', ')}.`);
  }
  return adapterConfig;
}

function adapterHookCommand(repoRoot, adapterConfig) {
  const hookPath = path.resolve(repoRoot, ...adapterConfig.hookPath.split('/'));
  return `node "${hookPath.replace(/"/g, '\\"')}"`;
}

async function adapterExampleWithCommand(repoRoot, adapterConfig, hookCommand) {
  const examplePath = path.join(repoRoot, ...adapterConfig.examplePath.split('/'));
  const config = JSON.parse(await readFile(examplePath, 'utf8'));
  return replaceExampleHookCommands(config, hookCommand);
}

function replaceExampleHookCommands(value, hookCommand) {
  if (Array.isArray(value)) {
    return value.map((item) => replaceExampleHookCommands(item, hookCommand));
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (key === 'command' && typeof item === 'string' && item.includes('<path-to-ai-agent-playbook>')) {
      return [key, hookCommand];
    }
    return [key, replaceExampleHookCommands(item, hookCommand)];
  }));
}

async function settingsValidationChecks(repoRoot, adapterConfig, settingsPath) {
  const resolvedSettingsPath = path.resolve(settingsPath);
  const checks = [];
  const hasSettings = existsSync(resolvedSettingsPath) && await isFile(resolvedSettingsPath);
  checks.push(check(
    hasSettings ? 'pass' : 'fail',
    'settings.file',
    'settings',
    'settings file',
    hasSettings ? 'Found.' : 'Missing settings file.',
    [resolvedSettingsPath]
  ));
  if (!hasSettings) return checks;

  let settings;
  try {
    settings = JSON.parse(await readFile(resolvedSettingsPath, 'utf8'));
    checks.push(check(
      'pass',
      'settings.json',
      'settings',
      'settings JSON',
      'Parsed settings JSON.',
      [resolvedSettingsPath]
    ));
  } catch (error) {
    checks.push(check(
      'fail',
      'settings.json',
      'settings',
      'settings JSON',
      error instanceof Error ? error.message : 'Malformed settings JSON.',
      [resolvedSettingsPath]
    ));
    return checks;
  }

  const expectedCommand = adapterHookCommand(repoRoot, adapterConfig);
  for (const eventName of ['SessionStart', 'PostCompact']) {
    const found = settingsHasHookCommand(settings, eventName, expectedCommand);
    checks.push(check(
      found ? 'pass' : 'fail',
      `settings.hook.${eventId(eventName)}.command`,
      'settings',
      `${eventName} settings hook command`,
      found ? 'Settings point to the local adapter hook command.' : 'Settings do not point to the local adapter hook command.',
      [resolvedSettingsPath]
    ));
  }

  return checks;
}

function settingsHasHookCommand(settings, eventName, expectedCommand) {
  const groups = settings?.hooks?.[eventName];
  if (!Array.isArray(groups)) return false;
  return groups.some((group) => Array.isArray(group?.hooks)
    && group.hooks.some((hook) => hook?.type === 'command' && hook.command === expectedCommand));
}

async function fileCheck(repoRoot, relPath, id, name) {
  const fullPath = path.join(repoRoot, ...relPath.split('/'));
  const exists = existsSync(fullPath) && await isFile(fullPath);
  return check(
    exists ? 'pass' : 'fail',
    id,
    'adapter',
    name,
    exists ? 'Found.' : 'Missing.',
    [relPath]
  );
}

async function hookJsonCheck(runner, eventName, target, maxChars) {
  const output = await runner({ hook_event_name: eventName, cwd: target }, { maxChars, env: {} });
  const parsed = parseHookOutput(output);
  const valid = Boolean(
    parsed?.hookSpecificOutput
      && parsed.hookSpecificOutput.hookEventName === eventName
      && typeof parsed.hookSpecificOutput.additionalContext === 'string'
      && parsed.hookSpecificOutput.additionalContext.length > 0
  );
  return check(
    valid ? 'pass' : 'fail',
    `hook.${eventId(eventName)}.json`,
    'hook',
    `${eventName} hook JSON`,
    valid ? 'Emits valid hook JSON with additionalContext.' : 'Did not emit valid hook JSON.',
    []
  );
}

async function quietHookCheck(runner, eventName, target, maxChars, details) {
  const output = await runner({ hook_event_name: eventName, cwd: target }, { maxChars, env: {} });
  const quiet = output === '';
  return check(
    quiet ? 'pass' : 'fail',
    details.id,
    'hook',
    details.name,
    quiet ? details.message : 'Expected no stdout, but hook emitted output.',
    []
  );
}

async function safeBuildContext(target, maxChars) {
  try {
    return await buildProjectContext({ target, maxChars });
  } catch (error) {
    return {
      ok: false,
      sources: [],
      additionalContext: '',
      warnings: [
        {
          id: 'context.error',
          message: error instanceof Error ? error.message : String(error),
          paths: []
        }
      ]
    };
  }
}

function parseHookOutput(output) {
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function eventId(eventName) {
  return eventName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function isDirectory(value) {
  try {
    return (await stat(value)).isDirectory();
  } catch {
    return false;
  }
}

async function isFile(value) {
  try {
    return (await stat(value)).isFile();
  } catch {
    return false;
  }
}

function messageFromWarnings(warnings, fallback) {
  const messages = warnings?.map((warning) => warning.message).filter(Boolean) ?? [];
  return messages.length ? messages.join(' ') : fallback;
}

function check(level, id, category, name, message, paths = []) {
  return { id, level, category, name, message, paths };
}

function summarize(checks) {
  return {
    total: checks.length,
    pass: checks.filter((item) => item.level === 'pass').length,
    warn: checks.filter((item) => item.level === 'warn').length,
    fail: checks.filter((item) => item.level === 'fail').length
  };
}
