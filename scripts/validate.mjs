#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pythonEngineStatus, runPythonWritingNaturalness } from '../src/runtime/python-engine.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const command = process.argv[2] ?? 'all';
const options = parseOptions(process.argv.slice(3));

try {
  if (command === 'all') {
    await validateNaming();
    await validateSkills();
    await validateTranslations();
    await validateMcpDocs();
    await validatePublicDocs();
  } else if (command === 'naming') {
    await validateNaming();
  } else if (command === 'skills') {
    await validateSkills();
  } else if (command === 'translations') {
    await validateTranslations();
  } else if (command === 'mcp-docs') {
    await validateMcpDocs();
  } else if (command === 'public-docs') {
    await validatePublicDocs();
  } else if (command === 'python') {
    await validatePython();
  } else {
    throw new Error(`Unknown validator: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function validateNaming() {
  const root = resolveRoot();
  const files = (await gitLsFiles(root))
    .filter((file) => !/^(docs\/plans|translations\/ko\/docs\/plans)\//.test(file))
    .filter((file) => !/^(_reference|_work|node_modules)\//.test(file))
    .filter((file) => !['scripts/validate.mjs', 'scripts/validate-naming.ps1'].includes(file));

  const allowedLegacyFiles = new Set([
    'src/harness/core.mjs',
    'src/harness/bootstrap.mjs',
    'src/layout/structured-playbook-layout.mjs',
    'src/runtime/python-engine.mjs',
    'src/runtime/writing-naturalness.mjs',
    'src/operator/shared.mjs',
    'adapters/shared/context-hook.mjs',
    'scripts/validate-translations.ps1',
    'test/adapters.test.mjs',
    'test/cli.test.mjs',
    'test/operator-diagnostics.test.mjs'
  ]);
  const findings = [];

  for (const file of files) {
    const fullPath = path.join(root, ...file.split('/'));
    if (!existsSync(fullPath) || !(await stat(fullPath)).isFile()) continue;
    const lines = (await readFile(fullPath, 'utf8')).split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const location = `${file}:${index + 1}`;
      const legacyAllowed = allowedLegacyFiles.has(file) ||
        /\blegacy\b|\bmigrate path\b|\bmigration\b|\bcompatibility\b|\bconflict\b/i.test(line) ||
        /기존|레거시|전환|마이그레이션|충돌|conflict/.test(line);

      if (/ai-playbook:\/\//.test(line)) {
        findings.push(`${location} uses legacy MCP URI scheme ai-playbook://.`);
      }
      if (/bin[\\/]+ai-playbook\.mjs/.test(line)) {
        findings.push(`${location} references removed bin/ai-playbook.mjs.`);
      }
      if (/\bai_playbook_engine\b/.test(line)) {
        findings.push(`${location} references old Python module ai_playbook_engine.`);
      }
      if (/\bAI_PLAYBOOK_[A-Z0-9_]*\b/.test(line) && file !== 'src/runtime/python-engine.mjs') {
        findings.push(`${location} references old AI_PLAYBOOK_* environment variable.`);
      }
      if ((/\.ai-playbook\//.test(line) || /(^|[^A-Za-z0-9_.-])ai-playbook\//.test(line)) && !legacyAllowed) {
        findings.push(`${location} references legacy playbook path outside a migration context.`);
      }
      if (/(^|[^A-Za-z0-9_.-])ai-playbook(?=[\s`"'.,:)\]]|$)/.test(line) && !legacyAllowed) {
        findings.push(`${location} references removed ai-playbook command/name outside a migration context.`);
      }
    }
  }

  failIfFindings(findings, `Naming validation failed with ${findings.length} finding(s).`);
  console.log('Naming validation passed.');
}

async function validateSkills() {
  const skillsRoot = path.resolve(options.skillsRoot ?? options['skills-root'] ?? path.join(resolveRoot(), 'skills'));
  const skillFiles = await findFiles(skillsRoot, (file) => path.basename(file) === 'SKILL.md');
  if (skillFiles.length === 0) throw new Error(`No SKILL.md files found under ${skillsRoot}`);

  const errors = [];
  for (const file of skillFiles) {
    const skillDir = path.dirname(file);
    const skillName = path.basename(skillDir);
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    if (lines.length < 4 || lines[0] !== '---') {
      errors.push(`${skillName}: missing opening frontmatter`);
      continue;
    }

    const end = lines.findIndex((line, index) => index > 0 && line === '---');
    if (end < 0) {
      errors.push(`${skillName}: missing closing frontmatter`);
      continue;
    }

    const keys = [];
    let nameValue = null;
    let descriptionValue = null;
    for (let index = 1; index < end; index += 1) {
      const match = /^([^:#]+):\s*(.*)$/.exec(lines[index]);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim();
      keys.push(key);
      if (key === 'name') nameValue = value;
      if (key === 'description') descriptionValue = value;
    }

    const extra = keys.filter((key) => !['name', 'description'].includes(key));
    if (extra.length) errors.push(`${skillName}: extra frontmatter keys ${extra.join(',')}`);
    if (!nameValue) errors.push(`${skillName}: missing name`);
    if (!descriptionValue) errors.push(`${skillName}: missing description`);
    if (nameValue && nameValue !== skillName) errors.push(`${skillName}: name does not match folder (${nameValue})`);
    if (nameValue && !/^[a-z0-9-]+$/.test(nameValue)) errors.push(`${skillName}: invalid skill name`);
    if (descriptionValue && !descriptionValue.startsWith('Use when')) {
      errors.push(`${skillName}: description should start with 'Use when'`);
    }
  }

  failIfFindings(errors, `Skill validation failed with ${errors.length} finding(s).`);
  console.log(`Validated ${skillFiles.length} skills.`);
}

async function validateTranslations() {
  const root = resolveRoot();
  const locale = options.locale ?? 'ko';
  const translationRoot = path.join(root, 'translations', locale);
  if (!existsSync(translationRoot)) throw new Error(`Translation root does not exist: ${translationRoot}`);

  const errors = [];
  const translatedSkillFiles = await findFiles(translationRoot, (file) => path.basename(file) === 'SKILL.md');
  for (const file of translatedSkillFiles) {
    errors.push(`Translation tree must not contain installable SKILL.md: ${file}`);
  }

  const excludedDirs = new Set([
    '.git',
    '.ai-agent-playbook',
    '.ai-playbook',
    'ai-playbook',
    '.venv',
    '.next',
    '.turbo',
    '_reference',
    '_work',
    'build',
    'coverage',
    'dist',
    'node_modules'
  ]);
  const sourceMdFiles = await findFiles(root, (file) => path.extname(file) === '.md' &&
    !normalizePath(file).startsWith(`${normalizePath(translationRoot)}/`) &&
    !hasExcludedPart(path.relative(root, file), excludedDirs));

  for (const file of sourceMdFiles) {
    const rel = normalizePath(path.relative(root, file));
    let content = await readFile(file, 'utf8');
    if (rel === 'README.md') content = content.replace('Korean (한국어)', 'Korean');
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(content)) {
      errors.push(`English source contains Hangul: ${rel}`);
    }
  }

  for (const file of sourceMdFiles) {
    const rel = normalizePath(path.relative(root, file));
    const parts = rel.split('/');
    let expected;
    if (parts[0] === 'skills' && path.basename(file) === 'SKILL.md') {
      const skillName = parts.at(-2);
      const skillCategory = parts[1];
      expected = path.join(translationRoot, 'skills', skillCategory, `${skillName}.${locale}.md`);
    } else {
      const dir = path.dirname(rel);
      const base = path.basename(file, '.md');
      expected = dir === '.'
        ? path.join(translationRoot, `${base}.${locale}.md`)
        : path.join(translationRoot, ...dir.split('/'), `${base}.${locale}.md`);
    }
    if (!existsSync(expected)) {
      errors.push(`Missing translation for ${rel} -> ${normalizePath(path.relative(translationRoot, expected))}`);
    }
  }

  failIfFindings(errors, `Translation validation failed with ${errors.length} finding(s).`);
  console.log(`Validated translation safety and coverage for ${sourceMdFiles.length} source markdown files.`);
}

async function validateMcpDocs() {
  const root = resolveRoot();
  const errors = [];
  const mcpSourcePath = 'src/mcp-tools.mjs';
  const mcpSource = await readRepoFile(root, mcpSourcePath);

  const resourceUris = unique([...mcpSource.matchAll(/resource\('([^']+)',\s*'([^']+)'/g)].map((match) => match[2])).sort();
  if (resourceUris.length === 0) {
    errors.push(`${mcpSourcePath}: No MCP resources were discovered.`);
  }

  const writeBlock = /const writeTools = enableWriteTools \? \[([\s\S]*?)\]\s*:\s*\[\];/.exec(mcpSource);
  const managedWriteToolNames = writeBlock
    ? unique([...writeBlock[1].matchAll(/tool\('([^']+)'/g)].map((match) => match[1])).sort()
    : [];
  if (!writeBlock) {
    errors.push(`${mcpSourcePath}: Could not locate opt-in write tool registration block.`);
  }
  const forgeWriteBlock = /const forgeWriteTools = enableForgeWriteTools \? \[([\s\S]*?)\]\s*:\s*\[\];/.exec(mcpSource);
  const forgeWriteToolNames = forgeWriteBlock
    ? unique([...forgeWriteBlock[1].matchAll(/tool\('([^']+)'/g)].map((match) => match[1])).sort()
    : [];
  if (!forgeWriteBlock) {
    errors.push(`${mcpSourcePath}: Could not locate opt-in forge write tool registration block.`);
  }
  const writeToolNames = unique([...managedWriteToolNames, ...forgeWriteToolNames]).sort();

  const requiredPreviewTools = [
    'reference_source_registry_update_preview',
    'reference_ledger_update_preview',
    'reference_ledger_decision_preview'
  ];
  const requiredAutomationReadTools = [
    'automation_status',
    'automation_plan_validate',
    'forge_status',
    'forge_bootstrap_plan',
    'forge_sync_plan'
  ];
  for (const toolName of requiredAutomationReadTools) {
    if (!mcpSource.includes(`tool('${toolName}'`)) {
      errors.push(`${mcpSourcePath}: Missing required read-only forge/automation tool: ${toolName}`);
    }
  }
  const docsToCheck = [
    'docs/commands.md',
    'docs/mcp-permission-model.md',
    'translations/ko/docs/commands.ko.md',
    'translations/ko/docs/mcp-permission-model.ko.md'
  ];

  for (const docPath of docsToCheck) {
    const content = await readRepoFile(root, docPath);
    for (const uri of resourceUris) {
      if (!content.includes(uri)) errors.push(`${docPath}: Missing MCP resource URI: ${uri}`);
    }
    for (const toolName of writeToolNames) {
      if (!content.includes(toolName)) errors.push(`${docPath}: Missing opt-in write tool: ${toolName}`);
    }
    for (const toolName of requiredAutomationReadTools) {
      if (!content.includes(toolName)) errors.push(`${docPath}: Missing read-only forge/automation tool: ${toolName}`);
    }
    if (!content.includes('--enable-forge-write-tools')) {
      errors.push(`${docPath}: Missing separate forge write opt-in flag: --enable-forge-write-tools`);
    }
    if (docPath.includes('mcp-permission-model')) {
      for (const toolName of requiredPreviewTools) {
        if (!content.includes(toolName)) errors.push(`${docPath}: Missing read-only preview tool: ${toolName}`);
      }
    }
  }

  failIfFindings(errors, `MCP docs validation failed with ${errors.length} finding(s).`);
  console.log(`Validated MCP docs for ${resourceUris.length} resources, ${requiredAutomationReadTools.length} forge/automation read tools, and ${writeToolNames.length} opt-in write tools.`);
}

async function validatePublicDocs() {
  const root = resolveRoot();
  await validateMcpDocs();
  const errors = [];
  const excludedDirs = new Set([
    '.git',
    '.ai-agent-playbook',
    '.venv',
    '.next',
    '.turbo',
    '_reference',
    '_work',
    'build',
    'coverage',
    'dist',
    'node_modules'
  ]);
  const scanRoots = [
    'AGENTS.md',
    'CONTEXT.md',
    'README.md',
    'adapters',
    'docs',
    'examples',
    'skills',
    'templates',
    'translations/ko'
  ];
  const files = [];
  for (const scanRoot of scanRoots) {
    const fullPath = path.join(root, ...scanRoot.split('/'));
    if (!existsSync(fullPath)) continue;
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      files.push(...await findFiles(fullPath, (file) => path.extname(file) === '.md' &&
        !hasExcludedPart(path.relative(root, file), excludedDirs)));
    } else if (info.isFile() && path.extname(fullPath) === '.md') {
      files.push(fullPath);
    }
  }
  const uniqueFiles = unique(files.map((file) => path.resolve(file))).sort();

  const patternChecks = [
    ['local Windows absolute path', /(?<![A-Za-z0-9_])[A-Za-z]:[\\/][^\s)`">]+/g],
    ['local Unix absolute path', /(?<![A-Za-z0-9_])\/(?:Users|home)\/[^\s)`">]+/g],
    ['local file URI', /file:\/\/[^\s)`">]+/g],
    ['internal or local URL', /https?:\/\/(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|[A-Za-z0-9.-]*(?:internal|intranet|corp|local)[A-Za-z0-9.-]*(?::\d+)?)(?:\/[^\s)`">]*)?/g],
    ['local reference directory mention', /(?<![A-Za-z0-9_-])_reference[\\/]/g]
  ];
  const secretAssignmentPattern = /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|secret|password|passwd|private[_-]?key)\b\s*[:=]\s*["']?([A-Za-z0-9_./+=:-]{12,})/gim;
  const placeholderPattern = /example|placeholder|redacted|replace-me|your-|xxx|\*\*\*/i;
  const fencedBlockPattern = /```[\s\S]*?```/g;
  const maxFencedBlockChars = 6000;

  for (const file of uniqueFiles) {
    const rel = normalizePath(path.relative(root, file));
    const content = await readFile(file, 'utf8');
    for (const [kind, pattern] of patternChecks) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) {
        errors.push(`${rel}:${lineNumber(content, match.index ?? 0)}: ${kind} -> ${match[0]}`);
      }
    }
    secretAssignmentPattern.lastIndex = 0;
    for (const match of content.matchAll(secretAssignmentPattern)) {
      if (placeholderPattern.test(match[1])) continue;
      errors.push(`${rel}:${lineNumber(content, match.index ?? 0)}: secret-like assignment -> ${match[0]}`);
    }
    fencedBlockPattern.lastIndex = 0;
    for (const match of content.matchAll(fencedBlockPattern)) {
      if (match[0].length > maxFencedBlockChars) {
        errors.push(`${rel}:${lineNumber(content, match.index ?? 0)}: oversized fenced excerpt (${match[0].length} chars)`);
      }
    }
  }

  failIfFindings(errors, `Public docs validation failed with ${errors.length} finding(s).`);
  console.log(`Validated public documentation hygiene for ${uniqueFiles.length} markdown files.`);
}

async function validatePython() {
  const root = resolveRoot();
  const status = await pythonEngineStatus({ repoRoot: root });
  if (!status.selected) {
    throw new Error('Python was not found or ai_agent_playbook_engine is unavailable. Install Python 3.11+ or set AI_AGENT_PLAYBOOK_PYTHON.');
  }
  const result = await runPythonWritingNaturalness({
    repoRoot: root,
    lang: 'ko',
    filePath: 'sample.md',
    text: '이 문서는 중요한 역할을 합니다. 이를 통해 사용자는 더 강력한 결과를 얻을 수 있습니다.'
  });
  if (!result.ok || !result.result?.ok) {
    throw new Error('Python writing naturalness check failed.');
  }
  if (!Array.isArray(result.result.findings) || result.result.findings.length < 1) {
    throw new Error('Python writing naturalness check did not report expected findings.');
  }
  console.log('Python engine validation passed.');
}

function resolveRoot() {
  return path.resolve(options.root ?? repoRoot);
}

async function readRepoFile(root, rel) {
  return readFile(path.join(root, ...rel.split('/')), 'utf8');
}

async function gitLsFiles(root) {
  const result = await execFileAsync('git', ['ls-files'], { cwd: root });
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function execFileAsync(commandName, args, options) {
  return new Promise((resolve, reject) => {
    execFile(commandName, args, { ...options, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function findFiles(root, predicate) {
  const files = [];
  await walk(root);
  return files;

  async function walk(current) {
    if (!existsSync(current)) return;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && predicate(fullPath)) {
        files.push(fullPath);
      }
    }
  }
}

function hasExcludedPart(rel, excludedDirs) {
  return normalizePath(rel).split('/').some((part) => excludedDirs.has(part));
}

function lineNumber(content, index) {
  if (index <= 0) return 1;
  return content.slice(0, index).split('\n').length;
}

function failIfFindings(findings, message) {
  if (findings.length === 0) return;
  for (const finding of findings) console.error(finding);
  throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

function normalizePath(value) {
  return value.replaceAll(path.sep, '/');
}

function parseOptions(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const raw = arg.slice(2);
    const [key, inlineValue] = raw.split('=', 2);
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      parsed[toCamelCase(key)] = inlineValue;
      continue;
    }
    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      parsed[toCamelCase(key)] = next;
      index += 1;
    } else {
      parsed[key] = true;
      parsed[toCamelCase(key)] = true;
    }
  }
  return parsed;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Keep at least one crypto import live when packagers tree-shake this script.
void createHash;
