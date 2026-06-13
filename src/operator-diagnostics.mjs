import { readdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { INSTALL_MANIFEST_FILE, checkGuides, doctorProject, SCHEMA_VERSION, validateManagedManifest } from './harness.mjs';

const RULE_DIRECTORY_SOURCES = [
  ['.ai-playbook/rules', '.ai-playbook/rules'],
  ['.github/instructions', '.github/instructions'],
  ['.cursor/rules', '.cursor/rules'],
  ['.claude/rules', '.claude/rules']
];

const RULE_FILE_SOURCES = [
  ['.github/copilot-instructions.md', '.github/copilot-instructions.md'],
  ['CONTEXT.md', 'CONTEXT.md']
];

const RULE_EXTENSIONS = new Set(['.md', '.mdc']);
const RULE_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage']);
const SEARCH_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage']);
const MAP_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.ai-playbook', 'ai-playbook', '_reference']);
const SEARCH_MAX_BYTES = 1_000_000;
const MAP_MAX_BYTES = 1_000_000;
const PACKAGE_SCRIPT_ORDER = ['check', 'test', 'test:run', 'lint', 'typecheck', 'build'];
const PACKAGE_MANAGER_LOCKFILES = [
  ['pnpm', 'pnpm-lock.yaml'],
  ['yarn', 'yarn.lock'],
  ['npm', 'package-lock.json'],
  ['bun', 'bun.lockb'],
  ['bun', 'bun.lock']
];
const CORE_CONTEXT_FILES = ['START_HERE.md', 'CURRENT.md', 'SKILLS.md', 'GIT.md'];
const PLAYBOOK_DIR_CANDIDATES = ['.ai-playbook', 'ai-playbook'];
const RELATED_CONTEXT_DIRS = ['maps', 'runbooks', 'decisions', 'guides'];
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdc']);
const PLAYBOOK_AUDIT_DIRS = ['context', 'maps', 'runbooks', 'decisions', 'guides', 'plans', 'worklogs'];
const SOURCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx',
  '.py', '.go', '.rs', '.java', '.kt', '.kts',
  '.rb', '.php', '.dart', '.cs', '.swift',
  '.cpp', '.cc', '.cxx', '.c', '.h', '.hpp',
  '.vue', '.svelte'
]);
const TEST_FILE_PATTERN = /(^|[/.\\])(__tests__|tests?|specs?)([/.\\]|$)|[._-](test|spec)\.[^.]+$/i;
const CONFIG_CANDIDATES = [
  'tsconfig.json',
  'jsconfig.json',
  'vitest.config.ts',
  'vitest.config.js',
  'jest.config.js',
  'jest.config.ts',
  'playwright.config.ts',
  'playwright.config.js',
  'eslint.config.js',
  '.eslintrc',
  '.eslintrc.json',
  '.prettierrc',
  'ruff.toml',
  'pytest.ini',
  'mypy.ini',
  'sgconfig.yml',
  'sgconfig.yaml',
  'ast-grep.config.yml',
  'ast-grep.config.yaml',
  'ast-grep.config.json',
  'Dockerfile',
  'docker-compose.yml'
];
const STACK_MANIFESTS = [
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lock',
  'bun.lockb',
  'pyproject.toml',
  'requirements.txt',
  'Pipfile',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'Gemfile',
  'Makefile',
  'Dockerfile'
];
const FRAMEWORK_DEPENDENCIES = [
  ['react', ['react', '@vitejs/plugin-react', 'next']],
  ['nextjs', ['next']],
  ['vue', ['vue', 'nuxt']],
  ['vite', ['vite', '@vitejs/plugin-react']],
  ['express', ['express']],
  ['nestjs', ['@nestjs/core']],
  ['fastify', ['fastify']],
  ['prisma', ['prisma', '@prisma/client']],
  ['vitest', ['vitest']],
  ['jest', ['jest']],
  ['playwright', ['@playwright/test', 'playwright']],
  ['typescript', ['typescript']]
];
const MODULE_BOUNDARY_DIRS = [
  'src',
  'src/app',
  'src/pages',
  'src/features',
  'src/entities',
  'src/shared',
  'app',
  'pages',
  'components',
  'server',
  'packages',
  'apps'
];
const ENTRYPOINT_BASENAMES = new Set(['main', 'index', 'app', 'server', 'client']);
const CONCERN_PATTERNS = {
  todos: /\b(TODO|FIXME|HACK|XXX|DEPRECATED)\b/gi,
  debugArtifacts: /\b(console\.log|debugger|binding\.pry|pdb\.set_trace|import pdb)\b/gi,
  securitySignals: /\b(eval\s*\(|dangerouslySetInnerHTML|innerHTML\s*=|document\.write\s*\()/gi
};

export async function checkOperator(options) {
  const {
    repoRoot,
    target,
    filePath,
    includeDiff = false
  } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const [doctor, guides, diagnostics, rules] = await Promise.all([
    doctorProject({ target: resolvedTarget }),
    checkGuides({ repoRoot, target: resolvedTarget, includeDiff }),
    checkDiagnostics({ target: resolvedTarget }),
    checkRules({ target: resolvedTarget, filePath })
  ]);

  const checks = [
    operatorCheckForDoctor(doctor),
    operatorCheckForGuides(guides),
    operatorCheckForDiagnostics(diagnostics),
    operatorCheckForRules(rules)
  ];
  const summary = summarizeChecks(checks);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    ...(rules.path === undefined ? {} : { path: rules.path }),
    summary: {
      sections: checks.length,
      ...summary
    },
    checks,
    sections: {
      doctor,
      guides,
      diagnostics,
      rules
    }
  };
}

export async function searchOperator(options) {
  const {
    target,
    query,
    filePath,
    maxResults = 20
  } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!query || !query.trim()) throw new Error('Missing --query.');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const files = await walkSearchFiles(resolvedTarget);
  const results = [];
  const normalizedQuery = query.trim().toLowerCase();

  for (const file of files) {
    const result = await searchFile({ target: resolvedTarget, file, normalizedQuery });
    if (result) results.push(result);
  }

  results.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  const limited = results.slice(0, maxResults);
  const diagnostics = await checkDiagnostics({ target: resolvedTarget });
  const related = {
    diagnostics: {
      summary: diagnostics.summary,
      packageManager: diagnostics.packageManager,
      commands: diagnostics.commands
    }
  };
  if (relativePath !== undefined) {
    const rules = await checkRules({ target: resolvedTarget, filePath: relativePath });
    related.rules = {
      summary: rules.summary,
      rules: rules.rules.filter((rule) => rule.applies),
      warnings: rules.warnings
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    query: query.trim(),
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      matches: results.length,
      returned: limited.length,
      searchedFiles: files.length
    },
    results: limited,
    related
  };
}

export async function researchOperator(options) {
  const {
    target,
    query,
    filePath,
    maxResults = 50
  } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!query || !query.trim()) throw new Error('Missing --query.');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid --max-results; expected an integer from 1 to 100.');
  }

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const axes = buildResearchAxes({ query: query.trim(), relativePath });
  const allTerms = [...new Set(axes.flatMap((axis) => axis.terms))];
  const files = await walkSearchFiles(resolvedTarget);
  const evidence = [];

  for (const file of files) {
    const result = await researchFile({
      target: resolvedTarget,
      file,
      axes,
      allTerms
    });
    if (result) evidence.push(result);
  }

  evidence.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  const limited = evidence.slice(0, maxResults);
  const [diagnostics, map, rules, context] = await Promise.all([
    checkDiagnostics({ target: resolvedTarget }),
    mapOperator({ target: resolvedTarget }),
    relativePath === undefined ? null : checkRules({ target: resolvedTarget, filePath: relativePath }),
    relativePath === undefined ? null : previewOperatorContext({ target: resolvedTarget, filePath: relativePath })
  ]);
  const gaps = buildResearchGaps({ evidence, relativePath, rules, context, map });
  const nextSteps = buildResearchNextSteps({ query: query.trim(), relativePath, evidence, gaps, diagnostics });
  const summary = {
    axes: axes.length,
    searchedFiles: files.length,
    evidence: evidence.length,
    returned: limited.length,
    categories: summarizeEvidenceCategories(evidence),
    gaps: gaps.length,
    commands: diagnostics.summary.commands
  };
  const result = {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    query: query.trim(),
    ...(relativePath === undefined ? {} : { path: relativePath }),
    mode: {
      localOnly: true,
      network: false,
      writes: false
    },
    summary,
    axes,
    evidence: limited,
    gaps,
    nextSteps,
    related: {
      diagnostics: {
        summary: diagnostics.summary,
        packageManager: diagnostics.packageManager,
        commands: diagnostics.commands
      },
      map: {
        summary: map.summary,
        stack: map.stack,
        architecture: map.architecture,
        quality: map.quality,
        concerns: map.concerns
      },
      ...(rules ? {
        rules: {
          summary: rules.summary,
          rules: rules.rules.filter((rule) => rule.applies),
          warnings: rules.warnings
        }
      } : {}),
      ...(context ? {
        context: {
          summary: context.summary,
          coreSources: context.coreSources,
          matches: context.contexts.filter((item) => item.applies),
          related: context.related,
          warnings: context.warnings
        }
      } : {})
    }
  };
  return {
    ...result,
    reportMarkdown: buildResearchMarkdown(result)
  };
}

export async function previewOperatorContext(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');
  if (!filePath || typeof filePath !== 'string') throw new Error('Missing --path.');

  const resolvedTarget = path.resolve(target);
  const relativePath = normalizeTargetRelativePath(resolvedTarget, filePath);
  const warnings = [];
  const playbook = await findPlaybookRoot(resolvedTarget);
  if (!playbook) {
    warnings.push({
      id: 'operator.context.playbook-missing',
      message: 'No .ai-playbook/ or legacy ai-playbook/ folder found.',
      paths: ['.ai-playbook/']
    });
  }

  const [coreSources, contexts, rules, related] = await Promise.all([
    playbook ? collectCoreContextSources({ target: resolvedTarget, playbook }) : [],
    playbook ? collectPathContextFiles({ target: resolvedTarget, playbook, relativePath, warnings }) : [],
    checkRules({ target: resolvedTarget, filePath: relativePath }),
    playbook ? collectRelatedContextFiles({ target: resolvedTarget, playbook, relativePath }) : []
  ]);

  const matchingContexts = contexts.filter((item) => item.applies);
  const matchingRules = rules.rules.filter((rule) => rule.applies);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    path: relativePath,
    summary: {
      coreSources: coreSources.length,
      contextFiles: contexts.length,
      matchingContextFiles: matchingContexts.length,
      ruleMatches: matchingRules.length,
      relatedFiles: related.length,
      warnings: warnings.length + rules.warnings.length
    },
    coreSources,
    contexts,
    rules: {
      summary: rules.summary,
      rules: matchingRules,
      warnings: rules.warnings
    },
    related,
    warnings
  };
}

export async function analyzeOperator(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const [diagnostics, map, rules, context] = await Promise.all([
    checkDiagnostics({ target: resolvedTarget }),
    mapOperator({ target: resolvedTarget }),
    checkRules({ target: resolvedTarget, filePath: relativePath }),
    relativePath === undefined ? null : previewOperatorContext({ target: resolvedTarget, filePath: relativePath })
  ]);
  const optionalTools = buildOptionalAnalysisSignals({ map, diagnostics });
  const matchingRules = rules.rules.filter((rule) => rule.applies);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      sourceFiles: map.summary.sourceFiles,
      commands: diagnostics.summary.commands,
      ruleMatches: matchingRules.length,
      contextMatches: context ? context.summary.matchingContextFiles : 0,
      optionalToolSignals: optionalTools.filter((tool) => ['detected', 'project-signals'].includes(tool.status)).length,
      warnings: diagnostics.summary.warn + rules.warnings.length + (context ? context.warnings.length : 0)
    },
    diagnostics: {
      packageManager: diagnostics.packageManager,
      summary: diagnostics.summary,
      commands: diagnostics.commands
    },
    map: {
      summary: map.summary,
      stack: map.stack,
      architecture: map.architecture,
      quality: map.quality,
      concerns: map.concerns
    },
    rules: {
      summary: rules.summary,
      matches: matchingRules,
      warnings: rules.warnings
    },
    ...(context ? {
      context: {
        summary: context.summary,
        coreSources: context.coreSources,
        matches: context.contexts.filter((item) => item.applies),
        related: context.related,
        warnings: context.warnings
      }
    } : {}),
    optionalTools
  };
}

export async function mapOperator(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const files = await walkProjectFiles(resolvedTarget, MAP_EXCLUDED_DIRS);
  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()));
  const [diagnostics, packageInfo, topLevelEntries] = await Promise.all([
    checkDiagnostics({ target: resolvedTarget }),
    readPackageInfo(resolvedTarget),
    collectTopLevelEntries(resolvedTarget)
  ]);
  const stack = buildStackMap({ target: resolvedTarget, files, sourceFiles, diagnostics, packageInfo });
  const architecture = await buildArchitectureMap({ target: resolvedTarget, files, sourceFiles, topLevelEntries });
  const quality = buildQualityMap({ target: resolvedTarget, files, diagnostics });
  const concerns = await buildConcernsMap({ target: resolvedTarget, sourceFiles });

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    summary: {
      files: files.length,
      sourceFiles: sourceFiles.length,
      manifests: stack.manifests.length,
      testFiles: quality.testFiles.count,
      concerns: concerns.todos.count + concerns.debugArtifacts.count + concerns.securitySignals.count
    },
    stack,
    architecture,
    quality,
    concerns,
    warnings: []
  };
}

export async function auditOperator(options) {
  const { target } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const findings = [];
  const playbook = await findPlaybookRoot(resolvedTarget);
  const dotPlaybook = path.join(resolvedTarget, '.ai-playbook');
  const legacyPlaybook = path.join(resolvedTarget, 'ai-playbook');
  const bothPlaybookPathsExist = existsSync(dotPlaybook) && existsSync(legacyPlaybook);
  if (!playbook) {
    findings.push(operatorFinding(
      'fail',
      'operator.audit.playbook-missing',
      'playbook',
      'No .ai-playbook/ or legacy ai-playbook/ folder found.',
      ['.ai-playbook/']
    ));
  }
  if (bothPlaybookPathsExist) {
    findings.push(operatorFinding(
      'warn',
      'operator.audit.legacy-playbook',
      'playbook',
      'Both .ai-playbook/ and legacy ai-playbook/ exist; review legacy cleanup after migration.',
      ['.ai-playbook/', 'ai-playbook/']
    ));
  }

  const sections = {
    links: { checked: 0, broken: 0, findings: [] },
    context: { files: 0, orphaned: 0, warnings: 0, findings: [] },
    duplicates: { groups: 0, items: [] },
    managed: { manifest: playbook ? `${playbook.name}/${INSTALL_MANIFEST_FILE}` : null, status: 'missing-playbook', total: 0, modified: 0, missing: 0 }
  };

  if (playbook) {
    const markdownFiles = await collectPlaybookMarkdownFiles(playbook.absolutePath);
    const projectFiles = await walkProjectFiles(resolvedTarget, MAP_EXCLUDED_DIRS);
    const linkFindings = await auditMarkdownLinks({ target: resolvedTarget, markdownFiles });
    sections.links.checked = markdownFiles.length;
    sections.links.broken = linkFindings.length;
    sections.links.findings = linkFindings;
    findings.push(...linkFindings);

    const contextFindings = await auditContextGlobs({
      target: resolvedTarget,
      playbook,
      projectFiles: projectFiles.map((file) => toPortablePath(path.relative(resolvedTarget, file)))
    });
    sections.context.files = contextFindings.files;
    sections.context.orphaned = contextFindings.orphaned;
    sections.context.warnings = contextFindings.warnings;
    sections.context.findings = contextFindings.findings;
    findings.push(...contextFindings.findings);

    const duplicateFindings = await auditDuplicateMarkdown({ target: resolvedTarget, markdownFiles });
    sections.duplicates.groups = duplicateFindings.length;
    sections.duplicates.items = duplicateFindings.map((finding) => ({ paths: finding.paths }));
    findings.push(...duplicateFindings);

    const managed = await auditManagedManifest({ target: resolvedTarget, playbook });
    sections.managed = managed.section;
    findings.push(...managed.findings);
  }

  const summary = summarizeChecks(findings);
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: summary.fail === 0,
    target: resolvedTarget,
    summary: {
      findings: findings.length,
      ...summary
    },
    findings,
    sections,
    warnings: findings.filter((finding) => finding.level === 'warn')
  };
}

export async function gcOperator(options) {
  const { repoRoot, target, apply = false } = options;
  await assertDirectory(repoRoot, 'Repository root does not exist');
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedTarget = path.resolve(target);
  const playbook = await findPlaybookRoot(resolvedTarget);
  const operations = [];
  const warnings = [];
  const conflicts = [];
  if (!playbook) {
    conflicts.push({
      id: 'operator.gc.playbook-missing',
      message: 'No .ai-playbook/ or legacy ai-playbook/ folder found.',
      paths: ['.ai-playbook/']
    });
    return operatorGcResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts });
  }

  const manifestResult = await readOperatorManagedManifest(playbook);
  if (!manifestResult.ok) {
    conflicts.push(manifestResult.conflict);
    return operatorGcResult({ target: resolvedTarget, apply, applied: false, operations, warnings, conflicts });
  }

  const removedPaths = [];
  const files = manifestResult.manifest.files;
  for (const entry of files) {
    if (!isRecord(entry) || typeof entry.path !== 'string' || typeof entry.source !== 'string') continue;
    const sourcePath = safeJoin(resolvedRepoRoot, entry.source);
    if (sourcePath && existsSync(sourcePath)) continue;

    const targetPath = safeJoin(resolvedTarget, entry.path);
    if (!targetPath) {
      conflicts.push({
        id: 'operator.gc.unsafe-managed-path',
        message: `${entry.path} is outside the target repository and will not be removed.`,
        paths: [entry.path]
      });
      continue;
    }
    if (!entry.path.startsWith(`${playbook.name}/`)) {
      conflicts.push({
        id: 'operator.gc.protected-managed-file',
        message: `${entry.path} is outside ${playbook.name}/ and will not be removed by operator gc.`,
        paths: [entry.path]
      });
      continue;
    }
    if (!existsSync(targetPath)) {
      warnings.push({
        id: 'operator.gc.missing-obsolete-managed-file',
        message: `${entry.path} is already missing.`,
        paths: [entry.path]
      });
      continue;
    }
    const currentHash = await hashFile(targetPath);
    if (currentHash !== entry.targetHash) {
      conflicts.push({
        id: 'operator.gc.modified-obsolete-managed-file',
        message: `${entry.path} has local edits and will not be removed.`,
        paths: [entry.path]
      });
      continue;
    }
    operations.push({
      id: 'operator.gc.remove-obsolete-managed-file',
      action: 'remove',
      message: `Remove obsolete managed file ${entry.path}.`,
      paths: [entry.path]
    });
    removedPaths.push(entry.path);
  }

  let applied = false;
  if (apply && removedPaths.length > 0) {
    for (const relativePath of removedPaths) {
      const targetPath = safeJoin(resolvedTarget, relativePath);
      if (!targetPath) continue;
      await rm(targetPath, { force: true });
      await removeEmptyParents(path.dirname(targetPath), playbook.absolutePath);
    }
    const updatedManifest = {
      ...manifestResult.manifest,
      updatedAtUtc: new Date().toISOString(),
      files: files.filter((entry) => !removedPaths.includes(entry.path))
    };
    await writeFile(manifestResult.path, `${JSON.stringify(updatedManifest, null, 2)}\n`);
    applied = true;
  }

  return operatorGcResult({ target: resolvedTarget, apply, applied, operations, warnings, conflicts });
}

export async function checkRules(options) {
  const { target, filePath } = options;
  await assertDirectory(target, 'Target repository does not exist');

  const resolvedTarget = path.resolve(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const warnings = [];
  const rules = [];

  for (const [relativeRoot, source] of RULE_DIRECTORY_SOURCES) {
    const root = path.join(resolvedTarget, ...relativeRoot.split('/'));
    const files = await walkRuleFiles(root);
    for (const file of files) {
      rules.push(await buildRuleEntry({
        target: resolvedTarget,
        file,
        source,
        relativePath,
        isSingleFile: false,
        warnings
      }));
    }
  }

  for (const [relativeFile, source] of RULE_FILE_SOURCES) {
    const file = path.join(resolvedTarget, ...relativeFile.split('/'));
    if (!existsSync(file)) continue;
    rules.push(await buildRuleEntry({
      target: resolvedTarget,
      file,
      source,
      relativePath,
      isSingleFile: true,
      warnings
    }));
  }

  rules.sort((left, right) => sourcePriority(left.source) - sourcePriority(right.source) || left.path.localeCompare(right.path));
  const summary = {
    total: rules.length,
    applies: rules.filter((rule) => rule.applies).length,
    warnings: warnings.length
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary,
    rules,
    warnings
  };
}

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

async function walkSearchFiles(root) {
  const files = [];
  await walkSearch(root, files);
  files.sort();
  return files;
}

async function walkProjectFiles(root, excludedDirs) {
  const files = [];
  await walkProject(root, files, excludedDirs);
  files.sort();
  return files;
}

async function walkProject(current, files, excludedDirs) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      await walkProject(path.join(current, entry.name), files, excludedDirs);
      continue;
    }
    if (!entry.isFile()) continue;
    const fullPath = path.join(current, entry.name);
    const info = await stat(fullPath);
    if (info.size > MAP_MAX_BYTES) continue;
    files.push(fullPath);
  }
}

async function walkSearch(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SEARCH_EXCLUDED_DIRS.has(entry.name)) continue;
      await walkSearch(path.join(current, entry.name), files);
      continue;
    }
    if (!entry.isFile()) continue;
    const fullPath = path.join(current, entry.name);
    const info = await stat(fullPath);
    if (info.size > SEARCH_MAX_BYTES) continue;
    files.push(fullPath);
  }
}

async function searchFile(options) {
  const { target, file, normalizedQuery } = options;
  let raw;
  try {
    raw = await readFile(file);
  } catch {
    return null;
  }
  if (raw.includes(0)) return null;
  const text = raw.toString('utf8');
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const snippets = [];
  let occurrenceCount = 0;

  for (const [index, line] of lines.entries()) {
    const lineLower = line.toLowerCase();
    const count = occurrences(lineLower, normalizedQuery);
    if (count === 0) continue;
    occurrenceCount += count;
    if (snippets.length < 3) {
      snippets.push({
        line: index + 1,
        text: trimSnippet(line)
      });
    }
  }
  if (occurrenceCount === 0) return null;

  const relativePath = toPortablePath(path.relative(target, file));
  const category = searchCategory(relativePath);
  return {
    path: relativePath,
    category,
    score: occurrenceCount * 10 + categoryWeight(category),
    matches: occurrenceCount,
    snippets
  };
}

function buildResearchAxes(options) {
  const { query, relativePath } = options;
  const queryTerms = researchTerms(query);
  const axes = [
    {
      id: 'query',
      description: 'Direct matches for the requested research topic.',
      terms: queryTerms
    }
  ];
  if (relativePath !== undefined) {
    axes.push({
      id: 'path',
      description: 'Path-scoped terms from the file or area under review.',
      terms: searchTermsForPath(relativePath)
    });
  }
  axes.push({
    id: 'quality',
    description: 'Verification, tests, risks, and follow-up evidence around the topic.',
    terms: ['test', 'tests', 'spec', 'check', 'verify', 'risk', 'todo', 'fixme', 'warning']
  });
  return axes.map((axis) => ({
    ...axis,
    terms: [...new Set(axis.terms.map((term) => term.toLowerCase()).filter((term) => term.length >= 3))]
  })).filter((axis) => axis.terms.length > 0);
}

function researchTerms(query) {
  const normalized = query.trim().toLowerCase();
  const parts = normalized
    .split(/[^\p{L}\p{N}_-]+/gu)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
  const phrase = normalized.length >= 3 ? [normalized] : [];
  return [...new Set([...phrase, ...parts])];
}

async function researchFile(options) {
  const { target, file, axes, allTerms } = options;
  let raw;
  try {
    raw = await readFile(file);
  } catch {
    return null;
  }
  if (raw.includes(0)) return null;

  const text = raw.toString('utf8');
  const lowerText = text.toLowerCase();
  const relativePath = toPortablePath(path.relative(target, file));
  const lowerPath = relativePath.toLowerCase();
  const matchedTerms = [];
  const matchedAxes = [];
  let score = categoryWeight(searchCategory(relativePath));
  let matches = 0;
  let anchored = false;

  for (const axis of axes) {
    let axisMatches = 0;
    for (const term of axis.terms) {
      const textMatches = occurrences(lowerText, term);
      const pathMatches = occurrences(lowerPath, term);
      const total = textMatches + pathMatches;
      if (total === 0) continue;
      axisMatches += total;
      matches += total;
      score += textMatches * (term.includes(' ') ? 30 : 8);
      score += pathMatches * 5;
      matchedTerms.push(term);
    }
    if (axisMatches > 0) {
      if (axis.id !== 'quality') anchored = true;
      matchedAxes.push({
        id: axis.id,
        matches: axisMatches
      });
    }
  }
  if (matches === 0 || !anchored) return null;

  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const snippets = researchSnippets(lines, allTerms);
  return {
    path: relativePath,
    category: searchCategory(relativePath),
    score,
    matches,
    matchedTerms: [...new Set(matchedTerms)].slice(0, 20),
    axes: matchedAxes,
    snippets
  };
}

function researchSnippets(lines, terms) {
  const snippets = [];
  for (const [index, line] of lines.entries()) {
    const lineLower = line.toLowerCase();
    const lineTerms = terms.filter((term) => lineLower.includes(term));
    if (lineTerms.length === 0) continue;
    snippets.push({
      line: index + 1,
      text: trimSnippet(line),
      terms: lineTerms.slice(0, 8)
    });
    if (snippets.length >= 4) break;
  }
  return snippets;
}

function summarizeEvidenceCategories(evidence) {
  const categories = {};
  for (const item of evidence) {
    categories[item.category] = (categories[item.category] ?? 0) + 1;
  }
  return categories;
}

function buildResearchGaps(options) {
  const { evidence, relativePath, rules, context, map } = options;
  const categories = summarizeEvidenceCategories(evidence);
  const gaps = [];
  if (evidence.length === 0) {
    gaps.push({
      id: 'research.no-local-evidence',
      message: 'No local files matched the research query.',
      severity: 'info'
    });
  }
  if (!relativePath) {
    gaps.push({
      id: 'research.path-not-provided',
      message: 'No --path was provided, so path-scoped rules and context were not evaluated.',
      severity: 'info'
    });
  }
  if ((categories.tests ?? 0) === 0 && map.summary.testFiles > 0) {
    gaps.push({
      id: 'research.no-matching-tests',
      message: 'The repository has tests, but no matching test evidence was found for this query.',
      severity: 'warn'
    });
  }
  if ((categories.rules ?? 0) === 0 && rules && rules.summary.applies > 0) {
    gaps.push({
      id: 'research.no-matching-rule-text',
      message: 'Path-scoped rules apply, but their text did not strongly match the query terms.',
      severity: 'info'
    });
  }
  if (context && context.summary.matchingContextFiles === 0) {
    gaps.push({
      id: 'research.no-path-context',
      message: 'No path-scoped playbook context matched the requested path.',
      severity: 'info'
    });
  }
  return gaps;
}

function buildResearchNextSteps(options) {
  const { query, relativePath, evidence, gaps, diagnostics } = options;
  const steps = [];
  if (evidence.length === 0) {
    steps.push({
      id: 'research.refine-query',
      command: `operator research <target> --query "${query}" --path <file> --json`,
      reason: 'Add a path or narrower term to connect the query to local evidence.'
    });
  }
  if (relativePath) {
    steps.push({
      id: 'research.inspect-context',
      command: `operator context <target> --path ${relativePath} --json`,
      reason: 'Review the exact path-scoped context and rules before changing code.'
    });
  }
  if (diagnostics.commands.length > 0) {
    steps.push({
      id: 'research.verify-locally',
      command: diagnostics.commands[0].command,
      reason: 'Run the most relevant local verification command after any implementation change.'
    });
  }
  if (gaps.some((gap) => gap.id === 'research.no-matching-tests')) {
    steps.push({
      id: 'research.find-tests',
      command: `operator search <target> --query "${query}" --max-results 50 --json`,
      reason: 'Broaden local search before deciding that no test coverage exists.'
    });
  }
  return steps;
}

function buildResearchMarkdown(result) {
  const lines = [
    `# Operator Research: ${result.query}`,
    '',
    '## Mode',
    '',
    `- Local only: ${result.mode.localOnly}`,
    `- Network: ${result.mode.network}`,
    `- Writes files: ${result.mode.writes}`,
    '',
    '## Summary',
    '',
    `- Searched files: ${result.summary.searchedFiles}`,
    `- Evidence items: ${result.summary.evidence}`,
    `- Gaps: ${result.summary.gaps}`,
    '',
    '## Evidence',
    ''
  ];
  if (result.evidence.length === 0) {
    lines.push('- No local evidence matched the query.');
  } else {
    for (const item of result.evidence.slice(0, 20)) {
      const first = item.snippets[0];
      lines.push(`- ${item.path} (${item.category}, score ${item.score})${first ? `: line ${first.line} - ${first.text}` : ''}`);
    }
  }
  lines.push('', '## Gaps', '');
  if (result.gaps.length === 0) {
    lines.push('- No major local evidence gaps found.');
  } else {
    for (const gap of result.gaps) {
      lines.push(`- ${gap.message}`);
    }
  }
  lines.push('', '## Next Steps', '');
  if (result.nextSteps.length === 0) {
    lines.push('- Review the evidence above and decide whether implementation work is warranted.');
  } else {
    for (const step of result.nextSteps) {
      lines.push(`- ${step.reason}${step.command ? ` (${step.command})` : ''}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

async function findPlaybookRoot(target) {
  for (const candidate of PLAYBOOK_DIR_CANDIDATES) {
    const root = path.join(target, candidate);
    if (!existsSync(root)) continue;
    const info = await stat(root);
    if (info.isDirectory()) {
      return { name: candidate, absolutePath: root };
    }
  }
  return null;
}

async function collectCoreContextSources(options) {
  const { target, playbook } = options;
  const sources = [];
  for (const fileName of CORE_CONTEXT_FILES) {
    const absolutePath = path.join(playbook.absolutePath, fileName);
    if (!existsSync(absolutePath)) continue;
    const info = await stat(absolutePath);
    if (!info.isFile()) continue;
    sources.push({
      path: toPortablePath(path.relative(target, absolutePath)),
      category: 'core',
      bytes: info.size
    });
  }
  return sources;
}

async function collectPathContextFiles(options) {
  const { target, playbook, relativePath, warnings } = options;
  const contextRoot = path.join(playbook.absolutePath, 'context');
  const files = await walkMarkdownFiles(contextRoot);
  const entries = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const parsed = parseRuleFile(text);
    const contextPath = toPortablePath(path.relative(target, file));
    for (const diagnostic of parsed.diagnostics) {
      warnings.push({
        id: 'operator.context.frontmatter',
        message: diagnostic,
        paths: [contextPath]
      });
    }
    const match = matchRule({ frontmatter: parsed.frontmatter, isSingleFile: false, relativePath });
    entries.push({
      path: contextPath,
      source: `${playbook.name}/context`,
      applies: match.applies,
      reason: match.reason,
      globs: parsed.frontmatter.globs,
      alwaysApply: parsed.frontmatter.alwaysApply,
      bytes: Buffer.byteLength(text, 'utf8')
    });
  }
  entries.sort((left, right) => Number(right.applies) - Number(left.applies) || left.path.localeCompare(right.path));
  return entries;
}

async function collectRelatedContextFiles(options) {
  const { target, playbook, relativePath } = options;
  const terms = searchTermsForPath(relativePath);
  const related = [];
  for (const directory of RELATED_CONTEXT_DIRS) {
    const root = path.join(playbook.absolutePath, directory);
    const files = await walkMarkdownFiles(root);
    for (const file of files) {
      const result = await scoreRelatedFile({ target, file, terms, category: directory });
      if (result) related.push(result);
    }
  }
  related.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  return related.slice(0, 10);
}

async function walkMarkdownFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  await walkMarkdown(root, files);
  files.sort();
  return files;
}

async function walkMarkdown(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdown(fullPath, files);
    } else if (entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
}

function searchTermsForPath(relativePath) {
  const normalized = normalizePortablePath(relativePath);
  const segments = normalized.split('/').filter(Boolean);
  const basename = segments.at(-1) ?? normalized;
  const stem = basename.replace(/\.[^.]+$/, '');
  const camelParts = stem.split(/(?=[A-Z])|[^A-Za-z0-9가-힣_]+/).filter((part) => part.length >= 3);
  return [...new Set([normalized, basename, stem, ...segments.slice(0, -1), ...camelParts].map((item) => item.toLowerCase()).filter((item) => item.length >= 3))];
}

async function scoreRelatedFile(options) {
  const { target, file, terms, category } = options;
  let raw;
  try {
    raw = await readFile(file);
  } catch {
    return null;
  }
  if (raw.includes(0)) return null;
  const text = raw.toString('utf8');
  const lower = text.toLowerCase();
  const pathText = normalizePortablePath(path.relative(target, file)).toLowerCase();
  let score = 0;
  for (const term of terms) {
    score += occurrences(lower, term) * 10;
    score += occurrences(pathText, term) * 4;
  }
  if (score === 0) return null;
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const snippets = [];
  for (const [index, line] of lines.entries()) {
    const lineLower = line.toLowerCase();
    if (!terms.some((term) => lineLower.includes(term))) continue;
    snippets.push({ line: index + 1, text: trimSnippet(line) });
    if (snippets.length >= 2) break;
  }
  return {
    path: toPortablePath(path.relative(target, file)),
    category,
    score,
    snippets
  };
}

async function readPackageInfo(target) {
  const file = path.join(target, 'package.json');
  if (!existsSync(file)) return { ok: false, dependencies: {}, scripts: {} };
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return {
      ok: true,
      dependencies: {
        ...(isRecord(parsed.dependencies) ? parsed.dependencies : {}),
        ...(isRecord(parsed.devDependencies) ? parsed.devDependencies : {}),
        ...(isRecord(parsed.peerDependencies) ? parsed.peerDependencies : {})
      },
      scripts: isRecord(parsed.scripts) ? parsed.scripts : {}
    };
  } catch (error) {
    return { ok: false, error: error.message, dependencies: {}, scripts: {} };
  }
}

function buildStackMap(options) {
  const { target, files, sourceFiles, diagnostics, packageInfo } = options;
  const relativeFiles = new Set(files.map((file) => toPortablePath(path.relative(target, file))));
  const manifests = STACK_MANIFESTS.filter((manifest) => relativeFiles.has(manifest)).map((manifest) => ({ path: manifest }));
  const languageCounts = new Map();
  for (const file of sourceFiles) {
    const ext = path.extname(file).toLowerCase();
    languageCounts.set(ext, (languageCounts.get(ext) ?? 0) + 1);
  }
  const languages = [...languageCounts.entries()]
    .map(([extension, count]) => ({ extension, count }))
    .sort((left, right) => right.count - left.count || left.extension.localeCompare(right.extension));
  const dependencyNames = new Set(Object.keys(packageInfo.dependencies).map((name) => name.toLowerCase()));
  const frameworks = [];
  for (const [name, candidates] of FRAMEWORK_DEPENDENCIES) {
    const matches = candidates.filter((candidate) => dependencyNames.has(candidate));
    if (matches.length > 0) frameworks.push({ name, source: 'package.json', matches });
  }
  return {
    packageManager: diagnostics.packageManager,
    manifests,
    languages,
    frameworks,
    scripts: Object.keys(packageInfo.scripts).sort()
  };
}

async function buildArchitectureMap(options) {
  const { target, files, sourceFiles, topLevelEntries } = options;
  const relativeFiles = new Set(files.map((file) => toPortablePath(path.relative(target, file))));
  const entrypoints = sourceFiles
    .map((file) => toPortablePath(path.relative(target, file)))
    .filter((file) => ENTRYPOINT_BASENAMES.has(path.basename(file, path.extname(file)).toLowerCase()))
    .map((file) => ({ path: file }))
    .slice(0, 20);
  const moduleBoundaries = [];
  for (const candidate of MODULE_BOUNDARY_DIRS) {
    const absolutePath = path.join(target, ...candidate.split('/'));
    if (!existsSync(absolutePath)) continue;
    const info = await stat(absolutePath);
    if (!info.isDirectory()) continue;
    moduleBoundaries.push({ path: candidate });
  }
  return {
    topLevel: topLevelEntries,
    entrypoints,
    moduleBoundaries,
    configFiles: ['vite.config.ts', 'vite.config.js', 'next.config.js', 'next.config.mjs'].filter((file) => relativeFiles.has(file)).map((file) => ({ path: file }))
  };
}

function buildQualityMap(options) {
  const { target, files, diagnostics } = options;
  const relativeFiles = files.map((file) => toPortablePath(path.relative(target, file)));
  const relativeSet = new Set(relativeFiles);
  const testFiles = relativeFiles.filter((file) => TEST_FILE_PATTERN.test(file) && !file.includes('node_modules/'));
  const configs = [];
  for (const candidate of CONFIG_CANDIDATES) {
    if (relativeSet.has(candidate)) configs.push({ path: candidate });
  }
  for (const file of relativeFiles) {
    if (/^\.github\/workflows\/[^/]+\.(ya?ml)$/i.test(file)) {
      configs.push({ path: file });
    }
  }
  configs.sort((left, right) => left.path.localeCompare(right.path));
  return {
    testFiles: {
      count: testFiles.length,
      samples: testFiles.slice(0, 20)
    },
    configs,
    commands: diagnostics.commands
  };
}

function buildOptionalAnalysisSignals(options) {
  const { map } = options;
  const configPaths = new Set(map.quality.configs.map((config) => config.path));
  const scripts = new Set(map.stack.scripts);
  const languageExtensions = new Set(map.stack.languages.map((language) => language.extension));
  const astEvidence = [];
  for (const config of ['sgconfig.yml', 'sgconfig.yaml', 'ast-grep.config.yml', 'ast-grep.config.yaml', 'ast-grep.config.json']) {
    if (configPaths.has(config)) astEvidence.push(config);
  }
  for (const script of scripts) {
    if (/(^|[:-])(ast-?grep|sg|structural)([:-]|$)/i.test(script)) astEvidence.push(`package.json#scripts.${script}`);
  }

  const lspEvidence = [];
  if (configPaths.has('tsconfig.json') || configPaths.has('jsconfig.json') || languageExtensions.has('.ts') || languageExtensions.has('.tsx')) {
    lspEvidence.push('typescript/javascript project signals');
  }
  if (map.stack.manifests.some((manifest) => ['pyproject.toml', 'requirements.txt'].includes(manifest.path)) || languageExtensions.has('.py')) {
    lspEvidence.push('python project signals');
  }
  if (map.stack.manifests.some((manifest) => manifest.path === 'go.mod') || languageExtensions.has('.go')) {
    lspEvidence.push('go project signals');
  }
  if (map.stack.manifests.some((manifest) => manifest.path === 'Cargo.toml') || languageExtensions.has('.rs')) {
    lspEvidence.push('rust project signals');
  }

  return [
    {
      id: 'ast-grep',
      category: 'structural-search',
      status: astEvidence.length > 0 ? 'detected' : 'not-detected',
      evidence: astEvidence,
      nextStep: astEvidence.length > 0
        ? 'Use the project AST search setup manually when structural evidence is needed; this command does not run it.'
        : 'No AST search setup was detected. Use text search or add a project-specific structural search tool before relying on structural claims.'
    },
    {
      id: 'lsp',
      category: 'language-analysis',
      status: lspEvidence.length > 0 ? 'project-signals' : 'not-detected',
      evidence: lspEvidence,
      nextStep: lspEvidence.length > 0
        ? 'Use the project language tooling explicitly for definitions, references, diagnostics, or renames; no LSP server is started here.'
        : 'No strong language-server signal was detected.'
    },
    {
      id: 'comment-checker',
      category: 'comment-quality',
      status: 'manual',
      evidence: [],
      nextStep: 'Use review-work-light or cleanup-ai-slop for comment quality review; no automatic comment checker hook is configured.'
    }
  ];
}

async function buildConcernsMap(options) {
  const { target, sourceFiles } = options;
  const aggregate = {
    todos: { count: 0, samples: [] },
    debugArtifacts: { count: 0, samples: [] },
    securitySignals: { count: 0, samples: [] }
  };
  for (const file of sourceFiles) {
    let raw;
    try {
      raw = await readFile(file);
    } catch {
      continue;
    }
    if (raw.includes(0)) continue;
    const text = raw.toString('utf8');
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const [index, line] of lines.entries()) {
      for (const [category, pattern] of Object.entries(CONCERN_PATTERNS)) {
        pattern.lastIndex = 0;
        const matches = line.match(pattern);
        if (!matches) continue;
        aggregate[category].count += matches.length;
        if (aggregate[category].samples.length < 10) {
          aggregate[category].samples.push({
            path: toPortablePath(path.relative(target, file)),
            line: index + 1,
            text: trimSnippet(line)
          });
        }
      }
    }
  }
  return aggregate;
}

async function collectTopLevelEntries(target) {
  const entries = await readdir(target, { withFileTypes: true });
  return entries
    .filter((entry) => !MAP_EXCLUDED_DIRS.has(entry.name))
    .map((entry) => ({
      path: entry.name,
      type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other'
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
    .slice(0, 40);
}

async function collectPlaybookMarkdownFiles(playbookRoot) {
  const files = [];
  for (const directory of PLAYBOOK_AUDIT_DIRS) {
    const root = path.join(playbookRoot, directory);
    files.push(...await walkMarkdownFiles(root));
  }
  for (const file of CORE_CONTEXT_FILES) {
    const fullPath = path.join(playbookRoot, file);
    if (existsSync(fullPath)) files.push(fullPath);
  }
  return [...new Set(files)].sort();
}

async function auditMarkdownLinks(options) {
  const { target, markdownFiles } = options;
  const findings = [];
  for (const file of markdownFiles) {
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    const relativeSource = toPortablePath(path.relative(target, file));
    for (const link of markdownLinks(text)) {
      const resolved = resolveMarkdownLink({ file, target, href: link.href });
      if (!resolved || existsSync(resolved.absolutePath)) continue;
      findings.push(operatorFinding(
        'fail',
        'operator.audit.broken-link',
        'references',
        `${relativeSource} links to missing ${resolved.relativePath}.`,
        [relativeSource, resolved.relativePath]
      ));
    }
  }
  return findings;
}

async function auditContextGlobs(options) {
  const { target, playbook, projectFiles } = options;
  const contextRoot = path.join(playbook.absolutePath, 'context');
  const files = await walkMarkdownFiles(contextRoot);
  const findings = [];
  let orphaned = 0;
  let warnings = 0;
  for (const file of files) {
    const relativePath = toPortablePath(path.relative(target, file));
    const text = await readFile(file, 'utf8');
    const parsed = parseRuleFile(text);
    for (const diagnostic of parsed.diagnostics) {
      warnings += 1;
      findings.push(operatorFinding(
        'warn',
        'operator.audit.context-frontmatter',
        'context',
        diagnostic,
        [relativePath]
      ));
    }
    if (parsed.frontmatter.alwaysApply || parsed.frontmatter.globs.length === 0) continue;
    const matchesAny = parsed.frontmatter.globs.some((glob) => projectFiles.some((projectFile) => globMatches(glob, projectFile)));
    if (matchesAny) continue;
    orphaned += 1;
    findings.push(operatorFinding(
      'warn',
      'operator.audit.orphan-context',
      'context',
      `${relativePath} has globs that do not match any current project file.`,
      [relativePath]
    ));
  }
  return { files: files.length, orphaned, warnings, findings };
}

async function auditDuplicateMarkdown(options) {
  const { target, markdownFiles } = options;
  const byHash = new Map();
  for (const file of markdownFiles) {
    let raw;
    try {
      raw = await readFile(file);
    } catch {
      continue;
    }
    const text = raw.toString('utf8').trim();
    if (!text) continue;
    const hash = sha256(raw);
    const relativePath = toPortablePath(path.relative(target, file));
    const paths = byHash.get(hash) ?? [];
    paths.push(relativePath);
    byHash.set(hash, paths);
  }
  return [...byHash.values()]
    .filter((paths) => paths.length > 1)
    .map((paths) => operatorFinding(
      'warn',
      'operator.audit.duplicate-content',
      'duplicates',
      `Duplicate playbook content appears in ${paths.length} files.`,
      paths
    ));
}

async function auditManagedManifest(options) {
  const { target, playbook } = options;
  const findings = [];
  const manifestResult = await readOperatorManagedManifest(playbook);
  if (!manifestResult.ok) {
    findings.push(operatorFinding(
      manifestResult.conflict.id === 'operator.gc.manifest-missing' ? 'warn' : 'fail',
      manifestResult.conflict.id.replace('operator.gc.', 'operator.audit.'),
      'managed',
      manifestResult.conflict.message,
      manifestResult.conflict.paths
    ));
    return {
      section: { manifest: `${playbook.name}/${INSTALL_MANIFEST_FILE}`, status: 'unavailable', total: 0, modified: 0, missing: 0 },
      findings
    };
  }

  let modified = 0;
  let missing = 0;
  for (const entry of manifestResult.manifest.files) {
    if (!isRecord(entry) || typeof entry.path !== 'string') continue;
    const targetPath = safeJoin(target, entry.path);
    if (!targetPath || !existsSync(targetPath)) {
      missing += 1;
      findings.push(operatorFinding(
        'warn',
        'operator.audit.managed-file-missing',
        'managed',
        `${entry.path} is listed in the managed manifest but is missing.`,
        [entry.path]
      ));
      continue;
    }
    const currentHash = await hashFile(targetPath);
    if (currentHash !== entry.targetHash) {
      modified += 1;
      findings.push(operatorFinding(
        'warn',
        'operator.audit.managed-file-modified',
        'managed',
        `${entry.path} differs from the managed manifest hash.`,
        [entry.path]
      ));
    }
  }
  return {
    section: {
      manifest: `${playbook.name}/${INSTALL_MANIFEST_FILE}`,
      status: 'present',
      total: manifestResult.manifest.files.length,
      modified,
      missing
    },
    findings
  };
}

function markdownLinks(text) {
  const links = [];
  const pattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(pattern)) {
    links.push({ href: match[1] });
  }
  return links;
}

function resolveMarkdownLink({ file, target, href }) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const withoutFragment = trimmed.split('#')[0];
  if (!withoutFragment) return null;
  let decoded = withoutFragment;
  try {
    decoded = decodeURI(withoutFragment);
  } catch {
    decoded = withoutFragment;
  }
  const absolutePath = path.resolve(path.dirname(file), decoded);
  const relativePath = normalizeTargetRelativePath(target, absolutePath);
  return { absolutePath, relativePath };
}

async function readOperatorManagedManifest(playbook) {
  const manifestPath = path.join(playbook.absolutePath, INSTALL_MANIFEST_FILE);
  const relativePath = `${playbook.name}/${INSTALL_MANIFEST_FILE}`;
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      conflict: {
        id: 'operator.gc.manifest-missing',
        message: `Missing managed manifest ${relativePath}.`,
        paths: [relativePath]
      }
    };
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const invalidReason = validateManagedManifest(manifest);
    if (invalidReason) {
      return {
        ok: false,
        conflict: {
          id: 'operator.gc.manifest-invalid',
          message: `Invalid managed manifest ${relativePath}: ${invalidReason}.`,
          paths: [relativePath]
        }
      };
    }
    return { ok: true, path: manifestPath, manifest };
  } catch (error) {
    return {
      ok: false,
      conflict: {
        id: 'operator.gc.manifest-malformed',
        message: `Could not parse ${relativePath}: ${error.message}`,
        paths: [relativePath]
      }
    };
  }
}

function operatorGcResult(options) {
  const { target, apply, applied, operations, warnings, conflicts } = options;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: conflicts.length === 0,
    target,
    applied: Boolean(applied),
    summary: {
      removable: operations.length,
      removed: apply && applied ? operations.length : 0,
      warnings: warnings.length,
      conflicts: conflicts.length
    },
    operations,
    warnings,
    conflicts
  };
}

async function hashFile(file) {
  return sha256(await readFile(file));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeJoin(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...normalizePortablePath(relativePath).split('/'));
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) return null;
  return resolved;
}

async function removeEmptyParents(startDir, stopDir) {
  const resolvedStop = path.resolve(stopDir);
  let current = path.resolve(startDir);
  while (current !== resolvedStop && current.startsWith(`${resolvedStop}${path.sep}`)) {
    try {
      await rmdir(current);
    } catch {
      break;
    }
    current = path.dirname(current);
  }
}

function operatorFinding(level, id, category, message, paths = []) {
  return { id, level, category, message, paths };
}

function occurrences(text, search) {
  if (!search) return 0;
  let count = 0;
  let index = text.indexOf(search);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(search, index + search.length);
  }
  return count;
}

function trimSnippet(line) {
  const normalized = line.trim();
  return normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`;
}

function searchCategory(relativePath) {
  if (relativePath.startsWith('.ai-playbook/rules/')) return 'rules';
  if (relativePath.startsWith('.ai-playbook/worklogs/')) return 'worklogs';
  if (relativePath.startsWith('.ai-playbook/plans/')) return 'plans';
  if (relativePath.startsWith('.ai-playbook/')) return 'playbook';
  if (relativePath.startsWith('docs/') || relativePath.startsWith('translations/')) return 'docs';
  if (relativePath.startsWith('templates/')) return 'templates';
  if (TEST_FILE_PATTERN.test(relativePath)) return 'tests';
  return 'source';
}

function categoryWeight(category) {
  if (category === 'source') return 8;
  if (category === 'rules') return 6;
  if (category === 'playbook') return 5;
  if (category === 'worklogs') return 4;
  return 1;
}

function detectPackageManager(target) {
  for (const [name, lockfile] of PACKAGE_MANAGER_LOCKFILES) {
    if (existsSync(path.join(target, lockfile))) {
      return { name, lockfile };
    }
  }
  return { name: 'npm', lockfile: null };
}

function renderPackageScriptCommand(packageManagerName, script) {
  if (packageManagerName === 'npm') {
    return script === 'test' ? 'npm test' : `npm run ${script}`;
  }
  if (packageManagerName === 'bun') {
    return `bun run ${script}`;
  }
  return `${packageManagerName} ${script}`;
}

function operatorCheckForDoctor(doctor) {
  const level = doctor.ok ? summaryLevel(doctor.summary) : 'fail';
  return checkResult(
    level,
    'operator.doctor',
    'operator',
    'doctor',
    `Doctor checks: ${doctor.summary.pass} pass, ${doctor.summary.warn} warn, ${doctor.summary.fail} fail.`,
    pathsFromChecks(doctor.checks)
  );
}

function operatorCheckForGuides(guides) {
  const level = guides.summary.missing > 0
    ? 'fail'
    : guides.summary.stale > 0
      ? 'warn'
      : 'pass';
  return checkResult(
    level,
    'operator.guides',
    'operator',
    'guides',
    `Guide templates: ${guides.summary.present} present, ${guides.summary.missing} missing, ${guides.summary.stale} stale.`,
    guides.guides.filter((guide) => guide.status !== 'present').map((guide) => guide.path)
  );
}

function operatorCheckForDiagnostics(diagnostics) {
  const level = diagnostics.ok ? summaryLevel(diagnostics.summary) : 'fail';
  return checkResult(
    level,
    'operator.diagnostics',
    'operator',
    'diagnostics',
    `Verification command candidates: ${diagnostics.summary.commands}.`,
    pathsFromChecks(diagnostics.checks)
  );
}

function operatorCheckForRules(rules) {
  const level = rules.ok ? (rules.summary.warnings > 0 ? 'warn' : 'pass') : 'fail';
  return checkResult(
    level,
    'operator.rules',
    'operator',
    'rules',
    `Rule matches: ${rules.summary.applies}/${rules.summary.total}; warnings: ${rules.summary.warnings}.`,
    rules.warnings.flatMap((warning) => warning.paths ?? [])
  );
}

function summaryLevel(summary) {
  if ((summary.fail ?? 0) > 0) return 'fail';
  if ((summary.warn ?? 0) > 0) return 'warn';
  return 'pass';
}

function pathsFromChecks(checks) {
  return [...new Set(checks
    .filter((check) => check.level !== 'pass')
    .flatMap((check) => check.paths ?? []))];
}

async function buildRuleEntry(options) {
  const { target, file, source, relativePath, isSingleFile, warnings } = options;
  const text = await readFile(file, 'utf8');
  const parsed = parseRuleFile(text);
  for (const diagnostic of parsed.diagnostics) {
    warnings.push({
      id: 'rules.frontmatter',
      message: diagnostic,
      paths: [toPortablePath(path.relative(target, file))]
    });
  }
  const rulePath = toPortablePath(path.relative(target, file));
  const match = matchRule({ frontmatter: parsed.frontmatter, isSingleFile, relativePath });
  return {
    path: rulePath,
    source,
    applies: match.applies,
    reason: match.reason,
    globs: parsed.frontmatter.globs,
    alwaysApply: parsed.frontmatter.alwaysApply,
    bytes: Buffer.byteLength(text, 'utf8')
  };
}

function parseRuleFile(text) {
  const frontmatter = { globs: [], alwaysApply: false };
  const diagnostics = [];
  if (!text.startsWith('---')) return { frontmatter, diagnostics };

  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closingIndex < 0) {
    diagnostics.push('Missing closing frontmatter delimiter.');
    return { frontmatter, diagnostics };
  }

  const yamlLines = lines.slice(1, closingIndex);
  for (let index = 0; index < yamlLines.length; index += 1) {
    const rawLine = yamlLines[index] ?? '';
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    if (line.startsWith('- ')) continue;

    const match = /^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (!match) {
      diagnostics.push(`Unsupported frontmatter line: ${line}`);
      continue;
    }
    const [, key, rawValue] = match;
    if (key === 'alwaysApply') {
      frontmatter.alwaysApply = rawValue.trim().toLowerCase() === 'true';
      continue;
    }
    if (key === 'globs') {
      const { globs, consumed, diagnostic } = parseGlobsValue(rawValue, yamlLines.slice(index + 1));
      frontmatter.globs.push(...globs);
      index += consumed;
      if (diagnostic) diagnostics.push(diagnostic);
    }
  }

  return { frontmatter, diagnostics };
}

function parseGlobsValue(rawValue, followingLines) {
  const value = rawValue.trim();
  if (value.length === 0) {
    const globs = [];
    let consumed = 0;
    for (const line of followingLines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) break;
      globs.push(unquote(trimmed.slice(2).trim()));
      consumed += 1;
    }
    return { globs, consumed };
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return {
      globs: value.slice(1, -1).split(',').map((item) => unquote(item.trim())).filter(Boolean),
      consumed: 0
    };
  }
  if (value.startsWith('[')) {
    return { globs: [], consumed: 0, diagnostic: 'Malformed globs array in frontmatter.' };
  }
  return { globs: [unquote(value)], consumed: 0 };
}

function matchRule({ frontmatter, isSingleFile, relativePath }) {
  if (frontmatter.alwaysApply) return { applies: true, reason: 'alwaysApply' };
  if (isSingleFile) return { applies: true, reason: 'singleFile' };
  if (relativePath === undefined) {
    return { applies: false, reason: frontmatter.globs.length > 0 ? 'requiresPath' : 'no-match' };
  }
  if (frontmatter.globs.some((glob) => globMatches(glob, relativePath))) {
    return { applies: true, reason: 'glob' };
  }
  return { applies: false, reason: 'no-match' };
}

function globMatches(glob, relativePath) {
  return globToRegex(normalizePortablePath(glob)).test(normalizePortablePath(relativePath));
}

function globToRegex(glob) {
  let pattern = '^';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === '*' && next === '*') {
      if (glob[index + 2] === '/') {
        pattern += '(?:.*/)?';
        index += 2;
      } else {
        pattern += '.*';
        index += 1;
      }
      continue;
    }
    if (char === '*') {
      pattern += '[^/]*';
      continue;
    }
    if (char === '?') {
      pattern += '[^/]';
      continue;
    }
    pattern += escapeRegex(char);
  }
  pattern += '$';
  return new RegExp(pattern);
}

async function addLanguageCommandCandidates(target, commands) {
  const pyproject = path.join(target, 'pyproject.toml');
  if (existsSync(pyproject)) {
    const text = await readFile(pyproject, 'utf8');
    if (text.includes('[tool.pytest') || text.includes('[tool.pytest.ini_options]')) {
      commands.push({ id: 'python.pytest', source: 'pyproject.toml', command: 'python -m pytest', description: 'pytest project configuration detected' });
    }
    if (text.includes('[tool.ruff')) {
      commands.push({ id: 'python.ruff', source: 'pyproject.toml', command: 'python -m ruff check .', description: 'ruff project configuration detected' });
    }
    if (text.includes('[tool.mypy')) {
      commands.push({ id: 'python.mypy', source: 'pyproject.toml', command: 'python -m mypy .', description: 'mypy project configuration detected' });
    }
  }
  if (existsSync(path.join(target, 'Cargo.toml'))) {
    commands.push({ id: 'rust.cargo-check', source: 'Cargo.toml', command: 'cargo check', description: 'Rust package manifest detected' });
    commands.push({ id: 'rust.cargo-test', source: 'Cargo.toml', command: 'cargo test', description: 'Rust package manifest detected' });
  }
  if (existsSync(path.join(target, 'go.mod'))) {
    commands.push({ id: 'go.test', source: 'go.mod', command: 'go test ./...', description: 'Go module detected' });
  }
}

async function walkRuleFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  await walk(root, files);
  files.sort();
  return files;
}

async function walk(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (RULE_EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile() && RULE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
}

function normalizeTargetRelativePath(target, filePath) {
  const resolved = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(target, filePath);
  const relative = path.relative(target, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return normalizePortablePath(filePath);
  }
  return toPortablePath(relative);
}

function displayWidth(text) {
  let width = 0;
  for (const char of [...text]) {
    width += charWidth(char);
  }
  return width;
}

function wideCharactersForLine(text, line) {
  const result = [];
  let column = 0;
  for (const char of [...text]) {
    const width = charWidth(char);
    if (width === 2) {
      result.push({ line, column, char });
    }
    column += width;
  }
  return result;
}

function charWidth(char) {
  const code = char.codePointAt(0) ?? 0;
  if (code === 0) return 0;
  if (code < 32 || (code >= 0x7f && code < 0xa0)) return 0;
  if (isCombining(code)) return 0;
  return isWide(code) ? 2 : 1;
}

function isCombining(code) {
  return (code >= 0x0300 && code <= 0x036f)
    || (code >= 0x1ab0 && code <= 0x1aff)
    || (code >= 0x1dc0 && code <= 0x1dff)
    || (code >= 0x20d0 && code <= 0x20ff)
    || (code >= 0xfe20 && code <= 0xfe2f);
}

function isWide(code) {
  return (code >= 0x1100 && code <= 0x115f)
    || code === 0x2329
    || code === 0x232a
    || (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f)
    || (code >= 0xac00 && code <= 0xd7a3)
    || (code >= 0xf900 && code <= 0xfaff)
    || (code >= 0xfe10 && code <= 0xfe19)
    || (code >= 0xfe30 && code <= 0xfe6f)
    || (code >= 0xff00 && code <= 0xff60)
    || (code >= 0xffe0 && code <= 0xffe6);
}

function stripAnsi(text) {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

function hasBoxDrawing(text) {
  return /[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/.test(text);
}

function checkResult(level, id, category, name, message, paths = []) {
  return { id, level, category, name, message, paths };
}

function summarizeChecks(checks) {
  return {
    total: checks.length,
    pass: checks.filter((check) => check.level === 'pass').length,
    warn: checks.filter((check) => check.level === 'warn').length,
    fail: checks.filter((check) => check.level === 'fail').length
  };
}

function sourcePriority(source) {
  return [
    '.ai-playbook/rules',
    '.github/instructions',
    '.github/copilot-instructions.md',
    '.cursor/rules',
    '.claude/rules',
    'CONTEXT.md'
  ].indexOf(source);
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

function escapeRegex(char) {
  return /[\\^$.*+?()[\]{}|]/.test(char) ? `\\${char}` : char;
}

function normalizePortablePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function toPortablePath(value) {
  return value.split(path.sep).join('/');
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function assertDirectory(dir, message) {
  if (!existsSync(dir)) throw new Error(`${message}: ${dir}`);
  const info = await stat(dir);
  if (!info.isDirectory()) throw new Error(`Not a directory: ${dir}`);
}
