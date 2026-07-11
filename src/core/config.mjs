import { existsSync } from 'node:fs';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_CONTEXT_MAX_CHARS,
  DEFAULT_PLAYBOOK_DIR,
  SCHEMA_VERSION,
  normalizePortablePath,
  resolvePlaybookLayout
} from '../harness/core.mjs';

const CONFIG_FILE = 'config.json';
const LOCAL_CONFIG_FILE = 'config.local.json';

const KNOWN_SECTIONS = new Set(['context', 'workflow', 'runtime', 'mcp', 'automation', 'forge', 'git', 'executor']);
const KNOWN_PATHS = new Set([
  'context.maxChars',
  'workflow.defaultRecipe',
  'runtime.cacheDir',
  'runtime.indexMaxFiles',
  'mcp.enableWriteTools',
  'automation.profile',
  'automation.killSwitch',
  'automation.queue.readyLabel',
  'automation.queue.pauseLabel',
  'automation.queue.maxParallel',
  'automation.budget.tickMinutes',
  'automation.budget.maxAttempts',
  'automation.budget.maxStalled',
  'automation.budget.maxWallMinutes',
  'forge.provider',
  'forge.remote',
  'forge.apiBaseUrl',
  'forge.sync',
  'forge.language',
  'forge.autoBootstrap',
  'git.strategy',
  'git.unattendedWorkspace',
  'git.branchPrefix',
  'git.autoCommit',
  'git.autoPush',
  'git.allowForcePush',
  'executor.provider',
  'executor.command'
]);

export async function previewHarnessConfig(options) {
  const {
    target,
    userConfigPath,
    env = process.env
  } = options;
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const config = defaultConfig(playbook);
  const sourceMap = defaultSourceMap(config);
  const warnings = [];
  const conflicts = [];
  const sources = [
    {
      id: 'defaults',
      kind: 'built-in',
      path: null,
      status: 'applied',
      keys: Object.keys(sourceMap)
    }
  ];

  const plannedSources = [
    userConfigPath
      ? {
          id: 'user',
          kind: 'user',
          file: path.resolve(userConfigPath),
          displayPath: path.resolve(userConfigPath),
          trustedTargetBounded: false
        }
      : {
          id: 'user',
          kind: 'user',
          file: null,
          displayPath: null,
          trustedTargetBounded: false
        },
    {
      id: 'target',
      kind: 'target',
      file: path.join(playbook.root, CONFIG_FILE),
      displayPath: `${playbook.dir}/${CONFIG_FILE}`,
      trustedTargetBounded: true
    },
    {
      id: 'target-local',
      kind: 'target-local',
      file: path.join(playbook.root, LOCAL_CONFIG_FILE),
      displayPath: `${playbook.dir}/${LOCAL_CONFIG_FILE}`,
      trustedTargetBounded: true
    }
  ];

  for (const planned of plannedSources) {
    const source = await readConfigSource({
      target: resolvedTarget,
      playbook,
      ...planned
    });
    sources.push(source.summary);
    warnings.push(...source.warnings);
    conflicts.push(...source.conflicts);
    if (source.values) {
      applyConfigValues({ config, sourceMap, values: source.values, sourceId: source.summary.id });
    }
  }

  const envSource = readEnvOverrides(env, playbook);
  sources.push(envSource.summary);
  warnings.push(...envSource.warnings);
  conflicts.push(...envSource.conflicts);
  if (envSource.values) {
    applyConfigValues({ config, sourceMap, values: envSource.values, sourceId: envSource.summary.id });
  }
  conflicts.push(...validateEffectiveConfig(config));

  const appliedSources = sources.filter((source) => source.status === 'applied').length;
  const overriddenKeys = Object.values(sourceMap).filter((source) => source !== 'defaults').length;

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'core.config-preview',
    ok: conflicts.length === 0,
    target: resolvedTarget,
    playbook: {
      dir: playbook.dir,
      root: playbook.relativeRoot
    },
    mode: {
      writes: false,
      readsUserConfig: Boolean(userConfigPath)
    },
    precedence: [
      'built-in defaults',
      '--user-config',
      `${playbook.dir}/${CONFIG_FILE}`,
      `${playbook.dir}/${LOCAL_CONFIG_FILE}`,
      'environment overrides'
    ],
    summary: {
      sources: appliedSources,
      overriddenKeys,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    config,
    sourceMap,
    sources,
    warnings,
    conflicts
  };
}

function defaultConfig(playbook) {
  return {
    context: {
      maxChars: DEFAULT_CONTEXT_MAX_CHARS
    },
    workflow: {
      defaultRecipe: null
    },
    runtime: {
      cacheDir: `${playbook.dir}/runtime/cache`,
      indexMaxFiles: 10000
    },
    mcp: {
      enableWriteTools: false
    },
    automation: {
      profile: 'deliver',
      killSwitch: false,
      queue: {
        readyLabel: 'aapb:ready',
        pauseLabel: 'aapb:paused',
        maxParallel: 1
      },
      budget: {
        tickMinutes: 30,
        maxAttempts: 3,
        maxStalled: 3,
        maxWallMinutes: 480
      }
    },
    forge: {
      provider: 'auto',
      remote: 'origin',
      apiBaseUrl: null,
      sync: 'hybrid',
      language: 'auto',
      autoBootstrap: true
    },
    git: {
      strategy: 'branch',
      unattendedWorkspace: 'isolated-checkout',
      branchPrefix: 'aapb/',
      autoCommit: true,
      autoPush: true,
      allowForcePush: false
    },
    executor: {
      provider: 'auto',
      command: null
    }
  };
}

function defaultSourceMap(config) {
  return Object.fromEntries(Object.keys(flattenConfig(config)).map((key) => [key, 'defaults']));
}

async function readConfigSource(options) {
  const {
    target,
    playbook,
    id,
    kind,
    file,
    displayPath,
    trustedTargetBounded
  } = options;
  const summary = {
    id,
    kind,
    path: displayPath,
    status: file ? 'missing' : 'skipped',
    keys: []
  };
  const warnings = [];
  const conflicts = [];

  if (!file) {
    return { summary, warnings, conflicts, values: null };
  }

  if (!existsSync(file)) {
    return { summary, warnings, conflicts, values: null };
  }

  const link = await lstat(file);
  if (link.isSymbolicLink()) {
    summary.status = 'conflict';
    conflicts.push(configConflict('config.source.symlink', `${displayPath} is a symlink and is not trusted as harness config.`, [displayPath]));
    return { summary, warnings, conflicts, values: null };
  }

  if (trustedTargetBounded) {
    const realTarget = await realpath(target);
    const realFile = await realpath(file);
    if (!isInside(realTarget, realFile)) {
      summary.status = 'conflict';
      conflicts.push(configConflict('config.source.outside-target', `${displayPath} resolves outside the target project.`, [displayPath]));
      return { summary, warnings, conflicts, values: null };
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    summary.status = 'conflict';
    conflicts.push(configConflict('config.source.malformed-json', `${displayPath} is not valid JSON: ${error.message}`, [displayPath]));
    return { summary, warnings, conflicts, values: null };
  }

  if (!isPlainObject(parsed)) {
    summary.status = 'conflict';
    conflicts.push(configConflict('config.source.invalid-shape', `${displayPath} must contain a JSON object.`, [displayPath]));
    return { summary, warnings, conflicts, values: null };
  }

  const normalized = normalizeConfigObject(parsed, {
    playbook,
    sourcePath: displayPath,
    warnings,
    conflicts
  });

  summary.status = conflicts.length ? 'conflict' : 'applied';
  summary.keys = Object.keys(flattenConfig(normalized));
  return {
    summary,
    warnings,
    conflicts,
    values: conflicts.length ? null : normalized
  };
}

function normalizeConfigObject(raw, options) {
  const { playbook, sourcePath, warnings, conflicts } = options;
  const normalized = {};
  for (const section of Object.keys(raw)) {
    if (!KNOWN_SECTIONS.has(section)) {
      warnings.push(configWarning('config.unknown-section', `${sourcePath} has unknown section "${section}".`, [sourcePath]));
      continue;
    }
    normalizeConfigBranch({
      value: raw[section],
      parts: [section],
      normalized,
      playbook,
      sourcePath,
      warnings,
      conflicts
    });
  }
  return normalized;
}

function normalizeConfigBranch(options) {
  const { value, parts, normalized, playbook, sourcePath, warnings, conflicts } = options;
  const fullKey = parts.join('.');
  if (KNOWN_PATHS.has(fullKey)) {
    const checked = normalizeKnownValue({ fullKey, value, sourcePath, playbook, conflicts });
    if (checked.valid) setNested(normalized, parts, checked.value);
    return;
  }

  if (!hasKnownDescendant(fullKey)) {
    warnings.push(configWarning('config.unknown-key', `${sourcePath}.${fullKey} is not a known AI Agent Playbook config key.`, [sourcePath]));
    return;
  }

  if (!isPlainObject(value)) {
    conflicts.push(configConflict('config.section.invalid-shape', `${sourcePath}.${fullKey} must be an object.`, [sourcePath]));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    normalizeConfigBranch({
      value: child,
      parts: [...parts, key],
      normalized,
      playbook,
      sourcePath,
      warnings,
      conflicts
    });
  }
}

function hasKnownDescendant(fullKey) {
  const prefix = `${fullKey}.`;
  return [...KNOWN_PATHS].some((key) => key.startsWith(prefix));
}

function normalizeKnownValue(options) {
  const { fullKey, value, sourcePath, playbook, conflicts } = options;
  if (fullKey === 'context.maxChars') {
    if (!Number.isInteger(value) || value < 500) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be an integer >= 500.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  if (fullKey === 'workflow.defaultRecipe') {
    if (value !== null && (typeof value !== 'string' || !value.trim())) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be a non-empty string or null.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value: value === null ? null : value.trim() };
  }

  if (fullKey === 'runtime.cacheDir') {
    const checked = normalizeRuntimePath(value, playbook);
    if (!checked.ok) {
      conflicts.push(configConflict('config.path.unsafe', `${sourcePath}.${fullKey} must stay under ${playbook.dir}/runtime/.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value: checked.path };
  }

  if (fullKey === 'runtime.indexMaxFiles') {
    if (value !== null && (!Number.isInteger(value) || value < 1)) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be a positive integer or null.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  if (['mcp.enableWriteTools', 'automation.killSwitch', 'forge.autoBootstrap', 'git.autoCommit', 'git.autoPush', 'git.allowForcePush'].includes(fullKey)) {
    if (typeof value !== 'boolean') {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be boolean.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  const positiveIntegers = new Set([
    'automation.queue.maxParallel',
    'automation.budget.tickMinutes',
    'automation.budget.maxAttempts',
    'automation.budget.maxStalled',
    'automation.budget.maxWallMinutes'
  ]);
  if (positiveIntegers.has(fullKey)) {
    if (!Number.isInteger(value) || value < 1) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be a positive integer.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  const enumValues = {
    'automation.profile': ['off', 'observe', 'coordinate', 'deliver', 'release'],
    'forge.provider': ['auto', 'github', 'gitea'],
    'forge.sync': ['off', 'observe', 'hybrid', 'local-to-remote', 'remote-to-local'],
    'git.strategy': ['branch'],
    'git.unattendedWorkspace': ['isolated-checkout'],
    'executor.provider': ['auto', 'codex', 'claude', 'command', 'github-agent-task']
  };
  if (Object.prototype.hasOwnProperty.call(enumValues, fullKey)) {
    if (typeof value !== 'string' || !enumValues[fullKey].includes(value)) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be one of: ${enumValues[fullKey].join(', ')}.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  if (['automation.queue.readyLabel', 'automation.queue.pauseLabel'].includes(fullKey)) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be a non-empty string no longer than 100 characters.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value: value.trim() };
  }

  if (fullKey === 'forge.remote') {
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) || value.includes('..')) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be a safe Git remote name.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  if (fullKey === 'forge.apiBaseUrl') {
    if (value === null) return { valid: true, value };
    const normalized = normalizeForgeApiBaseUrl(value);
    if (!normalized) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be a credential-free HTTPS URL ending in /api/v1; HTTP is allowed only for localhost.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value: normalized };
  }

  if (fullKey === 'forge.language') {
    if (typeof value !== 'string' || (value !== 'auto' && !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value))) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be "auto" or a language tag.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  if (fullKey === 'git.branchPrefix') {
    if (value !== 'aapb/') {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be "aapb/" so controller branch protections remain enforceable.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
  }

  if (fullKey === 'executor.command') {
    if (value === null) return { valid: true, value };
    if (!Array.isArray(value) || value.length === 0 || value.some((part) => typeof part !== 'string' || !part.trim())) {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be an argv string array or null.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value: value.map((part) => part.trim()) };
  }

  return { valid: false };
}

function readEnvOverrides(env, playbook) {
  const summary = {
    id: 'environment',
    kind: 'environment',
    path: null,
    status: 'missing',
    keys: []
  };
  const warnings = [];
  const conflicts = [];
  const values = {};

  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_CONTEXT_MAX_CHARS', 'context.maxChars', values, conflicts, 500);
  readStringEnv(env, 'AI_AGENT_PLAYBOOK_DEFAULT_RECIPE', 'workflow.defaultRecipe', values);
  readRuntimePathEnv(env, 'AI_AGENT_PLAYBOOK_RUNTIME_CACHE_DIR', 'runtime.cacheDir', values, conflicts, playbook);
  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_INDEX_MAX_FILES', 'runtime.indexMaxFiles', values, conflicts, 1);
  readBooleanEnv(env, 'AI_AGENT_PLAYBOOK_ENABLE_WRITE_TOOLS', 'mcp.enableWriteTools', values, conflicts);
  readEnumEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_PROFILE', 'automation.profile', values, conflicts, ['off', 'observe', 'coordinate', 'deliver', 'release']);
  readBooleanEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_KILL_SWITCH', 'automation.killSwitch', values, conflicts);
  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_MAX_PARALLEL', 'automation.queue.maxParallel', values, conflicts, 1);
  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_TICK_MINUTES', 'automation.budget.tickMinutes', values, conflicts, 1);
  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_MAX_ATTEMPTS', 'automation.budget.maxAttempts', values, conflicts, 1);
  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_MAX_STALLED', 'automation.budget.maxStalled', values, conflicts, 1);
  readIntegerEnv(env, 'AI_AGENT_PLAYBOOK_AUTOMATION_MAX_WALL_MINUTES', 'automation.budget.maxWallMinutes', values, conflicts, 1);
  readEnumEnv(env, 'AI_AGENT_PLAYBOOK_FORGE_PROVIDER', 'forge.provider', values, conflicts, ['auto', 'github', 'gitea']);
  readPatternEnv(env, 'AI_AGENT_PLAYBOOK_FORGE_REMOTE', 'forge.remote', values, conflicts, /^[A-Za-z0-9][A-Za-z0-9._/-]*$/, 'a safe Git remote name');
  readEnumEnv(env, 'AI_AGENT_PLAYBOOK_FORGE_SYNC', 'forge.sync', values, conflicts, ['off', 'observe', 'hybrid', 'local-to-remote', 'remote-to-local']);
  readPatternEnv(env, 'AI_AGENT_PLAYBOOK_FORGE_LANGUAGE', 'forge.language', values, conflicts, /^(?:auto|[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)$/, 'auto or a language tag');
  readBooleanEnv(env, 'AI_AGENT_PLAYBOOK_FORGE_AUTO_BOOTSTRAP', 'forge.autoBootstrap', values, conflicts);
  readBooleanEnv(env, 'AI_AGENT_PLAYBOOK_GIT_AUTO_COMMIT', 'git.autoCommit', values, conflicts);
  readBooleanEnv(env, 'AI_AGENT_PLAYBOOK_GIT_AUTO_PUSH', 'git.autoPush', values, conflicts);
  readEnumEnv(env, 'AI_AGENT_PLAYBOOK_EXECUTOR_PROVIDER', 'executor.provider', values, conflicts, ['auto', 'codex', 'claude', 'command', 'github-agent-task']);

  const flattened = flattenConfig(values);
  summary.keys = Object.keys(flattened);
  if (summary.keys.length) {
    summary.status = conflicts.length ? 'conflict' : 'applied';
  }

  return {
    summary,
    warnings,
    conflicts,
    values: conflicts.length || summary.keys.length === 0 ? null : values
  };
}

function readIntegerEnv(env, envKey, configKey, values, conflicts, minimum) {
  if (!Object.prototype.hasOwnProperty.call(env, envKey)) return;
  const raw = String(env[envKey]).trim();
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    conflicts.push(configConflict('config.env.invalid', `${envKey} must be an integer >= ${minimum}.`, []));
    return;
  }
  setByConfigKey(values, configKey, parsed);
}

function readStringEnv(env, envKey, configKey, values) {
  if (!Object.prototype.hasOwnProperty.call(env, envKey)) return;
  const raw = String(env[envKey]).trim();
  if (!raw) return;
  setByConfigKey(values, configKey, raw);
}

function readEnumEnv(env, envKey, configKey, values, conflicts, allowed) {
  if (!Object.prototype.hasOwnProperty.call(env, envKey)) return;
  const raw = String(env[envKey]).trim();
  if (!allowed.includes(raw)) {
    conflicts.push(configConflict('config.env.invalid', `${envKey} must be one of: ${allowed.join(', ')}.`, []));
    return;
  }
  setByConfigKey(values, configKey, raw);
}

function readPatternEnv(env, envKey, configKey, values, conflicts, pattern, description) {
  if (!Object.prototype.hasOwnProperty.call(env, envKey)) return;
  const raw = String(env[envKey]).trim();
  if (!pattern.test(raw) || raw.includes('..')) {
    conflicts.push(configConflict('config.env.invalid', `${envKey} must be ${description}.`, []));
    return;
  }
  setByConfigKey(values, configKey, raw);
}

function readRuntimePathEnv(env, envKey, configKey, values, conflicts, playbook) {
  if (!Object.prototype.hasOwnProperty.call(env, envKey)) return;
  const checked = normalizeRuntimePath(env[envKey], playbook);
  if (!checked.ok) {
    conflicts.push(configConflict('config.env.invalid-path', `${envKey} must stay under ${playbook.dir}/runtime/.`, []));
    return;
  }
  setByConfigKey(values, configKey, checked.path);
}

function readBooleanEnv(env, envKey, configKey, values, conflicts) {
  if (!Object.prototype.hasOwnProperty.call(env, envKey)) return;
  const raw = String(env[envKey]).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(raw)) {
    setByConfigKey(values, configKey, true);
    return;
  }
  if (['0', 'false', 'no', 'off'].includes(raw)) {
    setByConfigKey(values, configKey, false);
    return;
  }
  conflicts.push(configConflict('config.env.invalid', `${envKey} must be a boolean value.`, []));
}

function normalizeRuntimePath(value, playbook) {
  if (typeof value !== 'string' || !value.trim()) return { ok: false };
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) return { ok: false };
  const normalized = normalizePortablePath(value.trim());
  const parts = normalized.split('/');
  if (parts.some((part) => part === '..' || part === '.')) return { ok: false };
  const requiredPrefix = `${playbook.dir}/runtime/`;
  if (!normalized.startsWith(requiredPrefix)) return { ok: false };
  return { ok: true, path: normalized };
}

function normalizeForgeApiBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (!/\/api\/v1\/?$/i.test(parsed.pathname)) return null;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function validateEffectiveConfig(config) {
  const conflicts = [];
  if (config.git?.allowForcePush === true) {
    conflicts.push(configConflict(
      'config.git.force-push-forbidden',
      'git.allowForcePush cannot enable automatic force-push; force-push always requires an explicit out-of-band approval.',
      []
    ));
  }
  if (config.executor?.provider === 'command' && (!Array.isArray(config.executor.command) || config.executor.command.length === 0)) {
    conflicts.push(configConflict(
      'config.executor.command-missing',
      'executor.command must provide argv when executor.provider is "command".',
      []
    ));
  }
  return conflicts;
}

function applyConfigValues(options) {
  const { config, sourceMap, values, sourceId } = options;
  for (const [key, value] of Object.entries(flattenConfig(values))) {
    setByConfigKey(config, key, value);
    sourceMap[key] = sourceId;
  }
}

function flattenConfig(value, prefix = '') {
  const flattened = {};
  if (!isPlainObject(value)) return flattened;
  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(child)) {
      Object.assign(flattened, flattenConfig(child, nextPrefix));
    } else {
      flattened[nextPrefix] = child;
    }
  }
  return flattened;
}

function setByConfigKey(target, key, value) {
  setNested(target, key.split('.'), value);
}

function setNested(target, parts, value) {
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    current[part] ??= {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isInside(root, file) {
  const relative = path.relative(root, file);
  return relative === '' || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function configWarning(id, message, paths) {
  return { id, level: 'warn', message, paths };
}

function configConflict(id, message, paths) {
  return { id, level: 'fail', message, paths };
}

export const HARNESS_CONFIG_FILES = {
  default: `${DEFAULT_PLAYBOOK_DIR}/${CONFIG_FILE}`,
  local: `${DEFAULT_PLAYBOOK_DIR}/${LOCAL_CONFIG_FILE}`
};
