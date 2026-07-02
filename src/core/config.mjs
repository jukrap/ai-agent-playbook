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

const KNOWN_SECTIONS = new Set(['context', 'workflow', 'runtime', 'mcp']);
const KNOWN_KEYS = {
  context: new Set(['maxChars']),
  workflow: new Set(['defaultRecipe']),
  runtime: new Set(['cacheDir', 'indexMaxFiles']),
  mcp: new Set(['enableWriteTools'])
};

export async function previewHarnessConfig(options) {
  const {
    target,
    userConfigPath,
    env = process.env
  } = options;
  const resolvedTarget = path.resolve(target);
  const playbook = resolvePlaybookLayout(resolvedTarget);
  const config = defaultConfig(playbook);
  const sourceMap = defaultSourceMap();
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
    }
  };
}

function defaultSourceMap() {
  return {
    'context.maxChars': 'defaults',
    'workflow.defaultRecipe': 'defaults',
    'runtime.cacheDir': 'defaults',
    'runtime.indexMaxFiles': 'defaults',
    'mcp.enableWriteTools': 'defaults'
  };
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
    const sectionValue = raw[section];
    if (!isPlainObject(sectionValue)) {
      conflicts.push(configConflict('config.section.invalid-shape', `${sourcePath}.${section} must be an object.`, [sourcePath]));
      continue;
    }
    for (const key of Object.keys(sectionValue)) {
      if (!KNOWN_KEYS[section].has(key)) {
        warnings.push(configWarning('config.unknown-key', `${sourcePath}.${section}.${key} is not a known Harness OS config key.`, [sourcePath]));
        continue;
      }
      const value = normalizeKnownValue({
        section,
        key,
        value: sectionValue[key],
        sourcePath,
        playbook,
        conflicts
      });
      if (value.valid) {
        setNested(normalized, [section, key], value.value);
      }
    }
  }
  return normalized;
}

function normalizeKnownValue(options) {
  const { section, key, value, sourcePath, playbook, conflicts } = options;
  const fullKey = `${section}.${key}`;
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

  if (fullKey === 'mcp.enableWriteTools') {
    if (typeof value !== 'boolean') {
      conflicts.push(configConflict('config.value.invalid', `${sourcePath}.${fullKey} must be boolean.`, [sourcePath]));
      return { valid: false };
    }
    return { valid: true, value };
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

  readIntegerEnv(env, 'AI_PLAYBOOK_CONTEXT_MAX_CHARS', 'context.maxChars', values, conflicts, 500);
  readStringEnv(env, 'AI_PLAYBOOK_DEFAULT_RECIPE', 'workflow.defaultRecipe', values);
  readRuntimePathEnv(env, 'AI_PLAYBOOK_RUNTIME_CACHE_DIR', 'runtime.cacheDir', values, conflicts, playbook);
  readIntegerEnv(env, 'AI_PLAYBOOK_INDEX_MAX_FILES', 'runtime.indexMaxFiles', values, conflicts, 1);
  readBooleanEnv(env, 'AI_PLAYBOOK_ENABLE_WRITE_TOOLS', 'mcp.enableWriteTools', values, conflicts);

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
