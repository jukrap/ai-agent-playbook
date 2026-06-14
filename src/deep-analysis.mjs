import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { Lang, parse } from '@ast-grep/napi';
import ts from 'typescript';
import { SCHEMA_VERSION } from './harness.mjs';

const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage']);
const TEXT_MAX_BYTES = 1_000_000;
const DEFAULT_MAX_RESULTS = 20;
const MIN_FUNCTION_CLONE_BODY_CHARS = 40;
const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SCANNER_TRIVIA_KINDS = new Set([
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.NewLineTrivia,
  ts.SyntaxKind.WhitespaceTrivia,
  ts.SyntaxKind.ShebangTrivia,
  ts.SyntaxKind.ConflictMarkerTrivia
]);
const AST_LANGUAGE_BY_EXTENSION = new Map([
  ['.js', Lang.JavaScript],
  ['.mjs', Lang.JavaScript],
  ['.cjs', Lang.JavaScript],
  ['.ts', Lang.TypeScript],
  ['.tsx', Lang.Tsx],
  ['.jsx', Lang.Tsx],
  ['.css', Lang.Css],
  ['.html', Lang.Html]
]);
const AST_LANGUAGE_ALIASES = new Map([
  ['javascript', Lang.JavaScript],
  ['js', Lang.JavaScript],
  ['typescript', Lang.TypeScript],
  ['ts', Lang.TypeScript],
  ['tsx', Lang.Tsx],
  ['jsx', Lang.Tsx],
  ['css', Lang.Css],
  ['html', Lang.Html]
]);

export async function runDeepAnalysis(options) {
  const {
    target,
    filePath,
    query,
    maxResults = DEFAULT_MAX_RESULTS
  } = options;
  const resolvedTarget = await assertTarget(target);
  const relativePath = filePath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, filePath);
  const astPattern = query && query.trim()
    ? query.trim()
    : 'function $NAME($$$) { $$$ }';

  const [astGrep, statusReport, diagnosticsReport, symbolsReport, functionClones] = await Promise.all([
    runAstGrepSearch({
      target: resolvedTarget,
      pattern: astPattern,
      path: relativePath,
      maxResults
    }),
    lspStatus({ target: resolvedTarget }),
    lspDiagnostics({ target: resolvedTarget, path: relativePath }),
    relativePath === undefined
      ? lspSymbols({ target: resolvedTarget, maxResults })
      : lspSymbols({ target: resolvedTarget, path: relativePath, maxResults }),
    sourceFunctionClones({ target: resolvedTarget, path: relativePath, maxResults })
  ]);

  return {
    enabled: true,
    mode: {
      localOnly: true,
      network: false,
      writes: false
    },
    summary: {
      astGrepMatches: astGrep.summary.matches,
      lspServers: statusReport.summary.available,
      lspDiagnostics: diagnosticsReport.summary.total,
      lspErrors: diagnosticsReport.summary.errors,
      lspSymbols: symbolsReport.summary.symbols,
      functionCloneGroups: functionClones.summary.groups,
      warnings: astGrep.warnings.length
        + statusReport.warnings.length
        + diagnosticsReport.warnings.length
        + symbolsReport.warnings.length
        + functionClones.warnings.length
    },
    astGrep,
    functionClones,
    lsp: {
      status: statusReport,
      diagnostics: diagnosticsReport,
      symbols: symbolsReport
    }
  };
}

export async function sourceFunctionClones(options) {
  const resolvedTarget = await assertTarget(options.target);
  const relativePath = options.path === undefined && options.filePath === undefined
    ? undefined
    : normalizeTargetRelativePath(resolvedTarget, options.path ?? options.filePath);
  const project = await loadTypeScriptProject(resolvedTarget, relativePath);
  const files = filterByRelativePath(project.files, resolvedTarget, relativePath);
  const limit = parseMaxResults(options.maxResults ?? DEFAULT_MAX_RESULTS);
  const warnings = [];
  const collected = [];

  for (const file of files) {
    const text = await readTextFile(file);
    if (text === null) continue;
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKindForPath(file));
    collectFunctionCloneCandidates({ target: resolvedTarget, file, sourceFile, collected });
  }
  if (project.files.length === 0) {
    warnings.push({
      id: 'source.function-clones.no-files',
      message: 'No TypeScript or JavaScript files were available for function clone analysis.',
      paths: []
    });
  }

  const buckets = new Map();
  for (const candidate of collected) {
    const items = buckets.get(candidate.normalizedBody) ?? [];
    items.push(candidate.item);
    buckets.set(candidate.normalizedBody, items);
  }

  const allGroups = [...buckets.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([normalizedBody, items]) => ({
      kind: 'exact-normalized-function-body',
      hash: hashNormalizedBody(normalizedBody),
      count: items.length,
      bodyChars: normalizedBody.length,
      items: items.sort(compareCloneItems)
    }))
    .sort(compareCloneGroups);
  const groups = allGroups.slice(0, limit);

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    mode: {
      localOnly: true,
      network: false,
      writes: false
    },
    summary: {
      files: files.length,
      functions: collected.length,
      groups: allGroups.length,
      returned: groups.length,
      warnings: warnings.length
    },
    groups,
    warnings,
    conflicts: []
  };
}

export async function runAstGrepSearch(options) {
  const {
    target,
    pattern,
    language,
    path: requestedPath,
    filePath,
    maxResults = DEFAULT_MAX_RESULTS
  } = options;
  const resolvedTarget = await assertTarget(target);
  const searchPath = requestedPath ?? filePath;
  const relativePath = searchPath === undefined ? undefined : normalizeTargetRelativePath(resolvedTarget, searchPath);
  if (!pattern || !String(pattern).trim()) throw new Error('Missing AST-grep pattern.');
  const limit = parseMaxResults(maxResults);
  const requestedLanguage = language === undefined ? undefined : String(language).toLowerCase();
  const explicitLanguage = requestedLanguage === undefined ? undefined : AST_LANGUAGE_ALIASES.get(requestedLanguage);
  const warnings = [];
  if (requestedLanguage && !explicitLanguage) {
    warnings.push({
      id: 'ast-grep.language-unsupported',
      message: `Unsupported AST-grep language: ${language}.`,
      paths: []
    });
  }

  const files = await collectTextFiles({
    target: resolvedTarget,
    relativePath,
    extensions: new Set(AST_LANGUAGE_BY_EXTENSION.keys())
  });
  const results = [];
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const astLanguage = explicitLanguage ?? AST_LANGUAGE_BY_EXTENSION.get(extension);
    if (!astLanguage) continue;
    const text = await readTextFile(file);
    if (text === null) continue;
    const matches = findAstMatches({ text, pattern: String(pattern), language: astLanguage, fallbackLanguage: extension });
    for (const match of matches) {
      results.push({
        path: toPortablePath(path.relative(resolvedTarget, file)),
        line: match.line,
        column: match.column,
        language: languageName(astLanguage),
        snippet: match.snippet
      });
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: warnings.some((warning) => warning.id === 'ast-grep.language-unsupported') ? false : true,
    target: resolvedTarget,
    pattern: String(pattern),
    ...(language === undefined ? {} : { language: String(language) }),
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      matches: results.length,
      returned: results.length,
      searchedFiles: files.length
    },
    results,
    warnings,
    conflicts: []
  };
}

export async function lspStatus(options) {
  const resolvedTarget = await assertTarget(options.target);
  const project = await loadTypeScriptProject(resolvedTarget);
  const available = project.files.length > 0;
  const servers = [
    {
      language: 'typescript',
      status: available ? 'available' : 'missing-project-files',
      engine: available ? 'typescript-compiler-api' : null,
      files: project.files.length,
      config: project.configPath ? toPortablePath(path.relative(resolvedTarget, project.configPath)) : null
    }
  ];
  const warnings = available ? [] : [{
    id: 'lsp.typescript.missing',
    message: 'No TypeScript or JavaScript project files were found.',
    paths: []
  }];

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    summary: {
      servers: servers.length,
      available: servers.filter((server) => server.status === 'available').length,
      warnings: warnings.length
    },
    servers,
    warnings,
    conflicts: []
  };
}

export async function lspDiagnostics(options) {
  const resolvedTarget = await assertTarget(options.target);
  const relativePath = options.path === undefined && options.filePath === undefined
    ? undefined
    : normalizeTargetRelativePath(resolvedTarget, options.path ?? options.filePath);
  const project = await loadTypeScriptProject(resolvedTarget, relativePath);
  const warnings = [];
  if (project.files.length === 0) {
    warnings.push({
      id: 'lsp.diagnostics.no-files',
      message: 'No TypeScript or JavaScript files were available for diagnostics.',
      paths: []
    });
    return lspDiagnosticsResult({ target: resolvedTarget, relativePath, diagnostics: [], warnings });
  }

  const selectedFiles = filterProjectFiles(project.files, resolvedTarget, relativePath);
  const program = ts.createProgram(project.files, project.options);
  const allDiagnostics = ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file && selectedFiles.has(path.resolve(diagnostic.file.fileName)))
    .map((diagnostic) => formatTsDiagnostic(resolvedTarget, diagnostic));

  return lspDiagnosticsResult({
    target: resolvedTarget,
    relativePath,
    diagnostics: allDiagnostics,
    warnings
  });
}

export async function lspSymbols(options) {
  const resolvedTarget = await assertTarget(options.target);
  const relativePath = options.path === undefined && options.filePath === undefined
    ? undefined
    : normalizeTargetRelativePath(resolvedTarget, options.path ?? options.filePath);
  const project = await loadTypeScriptProject(resolvedTarget, relativePath);
  const files = filterByRelativePath(project.files, resolvedTarget, relativePath);
  const limit = parseMaxResults(options.maxResults ?? 100, 1, 500);
  const symbols = [];
  const warnings = [];

  for (const file of files) {
    const text = await readTextFile(file);
    if (text === null) continue;
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKindForPath(file));
    collectSymbolsFromSource({ target: resolvedTarget, file, sourceFile, symbols, limit });
    if (symbols.length >= limit) break;
  }
  if (project.files.length === 0) {
    warnings.push({
      id: 'lsp.symbols.no-files',
      message: 'No TypeScript or JavaScript files were available for symbols.',
      paths: []
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      symbols: symbols.length,
      files: files.length,
      warnings: warnings.length
    },
    symbols,
    warnings,
    conflicts: []
  };
}

export async function lspReferences(options) {
  const resolvedTarget = await assertTarget(options.target);
  const symbol = typeof options.symbol === 'string' ? options.symbol.trim() : '';
  if (!symbol) throw new Error('Missing symbol.');
  const relativePath = options.path === undefined && options.filePath === undefined
    ? undefined
    : normalizeTargetRelativePath(resolvedTarget, options.path ?? options.filePath);
  const project = await loadTypeScriptProject(resolvedTarget, relativePath);
  const files = filterByRelativePath(project.files, resolvedTarget, relativePath);
  const references = [];
  const pattern = new RegExp(`\\b${escapeRegExp(symbol)}\\b`, 'g');

  for (const file of files) {
    const text = await readTextFile(file);
    if (text === null) continue;
    const lines = normalizeNewlines(text).split('\n');
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        references.push({
          path: toPortablePath(path.relative(resolvedTarget, file)),
          line: index + 1,
          column: match.index + 1,
          symbol,
          snippet: line.trim()
        });
      }
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    symbol,
    summary: {
      references: references.length,
      files: files.length
    },
    references,
    warnings: [],
    conflicts: []
  };
}

export async function lspDefinition(options) {
  const resolvedTarget = await assertTarget(options.target);
  const symbol = typeof options.symbol === 'string' ? options.symbol.trim() : '';
  if (!symbol) throw new Error('Missing symbol.');
  const symbols = await lspSymbols({
    target: resolvedTarget,
    path: options.path ?? options.filePath,
    maxResults: 500
  });
  const definition = symbols.symbols.find((item) => item.name === symbol) ?? null;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    target: resolvedTarget,
    ...(symbols.path === undefined ? {} : { path: symbols.path }),
    symbol,
    summary: {
      definitions: definition ? 1 : 0
    },
    definitions: definition ? [definition] : [],
    warnings: definition ? [] : [{
      id: 'lsp.definition.not-found',
      message: `No definition was found for ${symbol}.`,
      paths: symbols.path ? [symbols.path] : []
    }],
    conflicts: []
  };
}

async function assertTarget(target) {
  const resolvedTarget = path.resolve(target);
  const info = await stat(resolvedTarget).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`Target repository does not exist: ${resolvedTarget}`);
  return resolvedTarget;
}

function normalizeTargetRelativePath(target, value) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('Missing path.');
  const resolved = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(target, value);
  const relative = path.relative(target, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path must stay inside target: ${value}`);
  }
  return toPortablePath(relative);
}

async function collectTextFiles(options) {
  const { target, relativePath, extensions } = options;
  const root = relativePath === undefined ? target : path.join(target, ...relativePath.split('/'));
  if (!existsSync(root)) return [];
  const info = await stat(root).catch(() => null);
  if (!info) return [];
  if (info.isFile()) {
    return shouldReadFile(root, extensions, info) ? [root] : [];
  }
  if (!info.isDirectory()) return [];
  const files = [];
  await walk(root);
  files.sort();
  return files;

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        await walk(path.join(directory, entry.name));
      } else if (entry.isFile()) {
        const file = path.join(directory, entry.name);
        const fileInfo = await stat(file).catch(() => null);
        if (fileInfo && shouldReadFile(file, extensions, fileInfo)) files.push(file);
      }
    }
  }
}

function shouldReadFile(file, extensions, info) {
  if (info.size > TEXT_MAX_BYTES) return false;
  return extensions.has(path.extname(file).toLowerCase());
}

async function readTextFile(file) {
  const raw = await readFile(file).catch(() => null);
  if (!raw || raw.includes(0)) return null;
  return raw.toString('utf8');
}

function findAstMatches(options) {
  const { text, pattern, language, fallbackLanguage } = options;
  try {
    const root = parse(language, text);
    const matches = root.root().findAll(pattern);
    return matches.map((node) => {
      const range = node.range();
      return {
        line: range.start.line + 1,
        column: range.start.column + 1,
        snippet: firstLine(node.text())
      };
    });
  } catch {
    return findAstFallbackMatches({ text, pattern, fallbackLanguage });
  }
}

function findAstFallbackMatches(options) {
  const { text, pattern, fallbackLanguage } = options;
  if (!/function\s+\$?NAME|\bfunction\b/i.test(pattern)) return [];
  const results = [];
  const lines = normalizeNewlines(text).split('\n');
  const regex = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  for (const [index, line] of lines.entries()) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      results.push({
        line: index + 1,
        column: match.index + 1,
        language: fallbackLanguage,
        snippet: line.trim()
      });
    }
  }
  return results;
}

async function loadTypeScriptProject(target, relativePath) {
  const configPath = findFirstExisting(target, ['tsconfig.json', 'jsconfig.json']);
  if (configPath) {
    const rootProject = parseTsConfig(configPath);
    if (rootProject) {
      const { parsed, config } = rootProject;
      const parsedFiles = parsed.fileNames.filter((file) => TS_EXTENSIONS.has(path.extname(file).toLowerCase()));
      if (parsedFiles.length === 0) {
        const referencedProjects = parseReferencedTsConfigs(configPath, config);
        if (referencedProjects.length > 0) {
          const selected = selectReferencedProject({
            target,
            relativePath,
            referencedProjects
          });
          if (selected) return selected;
        }
        const fallbackFiles = await collectTextFiles({ target, extensions: TS_EXTENSIONS });
        return {
          configPath,
          options: { ...parsed.options, noEmit: true, skipLibCheck: true, allowJs: true, checkJs: false },
          files: fallbackFiles
        };
      }
      return {
        configPath,
        options: { ...parsed.options, noEmit: true, skipLibCheck: true },
        files: parsedFiles
      };
    }
  }
  const files = await collectTextFiles({ target, extensions: TS_EXTENSIONS });
  return {
    configPath: null,
    options: {
      noEmit: true,
      skipLibCheck: true,
      allowJs: true,
      checkJs: false,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext
    },
    files
  };
}

function parseTsConfig(configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) return null;
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
    { noEmit: true, skipLibCheck: true, allowJs: true, checkJs: false },
    configPath
  );
  return { config: configFile.config, parsed };
}

function parseReferencedTsConfigs(configPath, config) {
  const references = Array.isArray(config?.references) ? config.references : [];
  const projects = [];
  for (const reference of references) {
    if (!reference || typeof reference.path !== 'string') continue;
    const referenceConfig = resolveReferencedConfigPath(path.dirname(configPath), reference.path);
    if (!referenceConfig) continue;
    const parsedProject = parseTsConfig(referenceConfig);
    if (!parsedProject) continue;
    const files = parsedProject.parsed.fileNames.filter((file) => TS_EXTENSIONS.has(path.extname(file).toLowerCase()));
    if (files.length === 0) continue;
    projects.push({
      configPath: referenceConfig,
      options: { ...parsedProject.parsed.options, noEmit: true, skipLibCheck: true, allowJs: true, checkJs: false },
      files
    });
  }
  return projects;
}

function resolveReferencedConfigPath(baseDir, referencePath) {
  const resolved = path.resolve(baseDir, referencePath);
  if (existsSync(resolved)) {
    const extension = path.extname(resolved).toLowerCase();
    return extension === '.json' ? resolved : path.join(resolved, 'tsconfig.json');
  }
  if (existsSync(`${resolved}.json`)) return `${resolved}.json`;
  const nested = path.join(resolved, 'tsconfig.json');
  return existsSync(nested) ? nested : null;
}

function selectReferencedProject(options) {
  const { target, relativePath, referencedProjects } = options;
  if (relativePath !== undefined) {
    const requested = path.resolve(target, ...relativePath.split('/'));
    const matching = referencedProjects.find((project) => project.files.some((file) => path.resolve(file) === requested));
    if (matching) return matching;
  }
  const files = [...new Set(referencedProjects.flatMap((project) => project.files.map((file) => path.resolve(file))))];
  return {
    configPath: referencedProjects[0].configPath,
    options: referencedProjects[0].options,
    files
  };
}

function findFirstExisting(target, candidates) {
  for (const candidate of candidates) {
    const file = path.join(target, candidate);
    if (existsSync(file)) return file;
  }
  return null;
}

function filterProjectFiles(files, target, relativePath) {
  return new Set(filterByRelativePath(files, target, relativePath).map((file) => path.resolve(file)));
}

function filterByRelativePath(files, target, relativePath) {
  if (relativePath === undefined) return files;
  const requested = path.join(target, ...relativePath.split('/'));
  return files.filter((file) => path.resolve(file) === path.resolve(requested)
    || toPortablePath(path.relative(requested, file)).startsWith('../') === false);
}

function formatTsDiagnostic(target, diagnostic) {
  const file = diagnostic.file;
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  const start = typeof diagnostic.start === 'number' && file
    ? file.getLineAndCharacterOfPosition(diagnostic.start)
    : { line: 0, character: 0 };
  return {
    path: file ? toPortablePath(path.relative(target, file.fileName)) : null,
    line: start.line + 1,
    column: start.character + 1,
    code: diagnostic.code,
    category: ts.DiagnosticCategory[diagnostic.category]?.toLowerCase() ?? 'unknown',
    message
  };
}

function lspDiagnosticsResult(options) {
  const { target, relativePath, diagnostics, warnings } = options;
  const errors = diagnostics.filter((diagnostic) => diagnostic.category === 'error').length;
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: errors === 0,
    target,
    ...(relativePath === undefined ? {} : { path: relativePath }),
    summary: {
      total: diagnostics.length,
      errors,
      warnings: diagnostics.filter((diagnostic) => diagnostic.category === 'warning').length + warnings.length
    },
    diagnostics,
    warnings,
    conflicts: []
  };
}

function collectSymbolsFromSource(options) {
  const { target, file, sourceFile, symbols, limit } = options;
  visit(sourceFile);

  function addSymbol(node, nameNode, kind) {
    if (!nameNode || symbols.length >= limit) return;
    const position = sourceFile.getLineAndCharacterOfPosition(nameNode.getStart(sourceFile));
    symbols.push({
      name: nameNode.getText(sourceFile),
      kind,
      path: toPortablePath(path.relative(target, file)),
      line: position.line + 1,
      column: position.character + 1,
      exported: hasExportModifier(node)
    });
  }

  function visit(node) {
    if (symbols.length >= limit) return;
    if (ts.isFunctionDeclaration(node)) addSymbol(node, node.name, 'function');
    else if (ts.isClassDeclaration(node)) addSymbol(node, node.name, 'class');
    else if (ts.isInterfaceDeclaration(node)) addSymbol(node, node.name, 'interface');
    else if (ts.isTypeAliasDeclaration(node)) addSymbol(node, node.name, 'type');
    else if (ts.isEnumDeclaration(node)) addSymbol(node, node.name, 'enum');
    else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) addSymbol(node, node.name, 'variable');
    ts.forEachChild(node, visit);
  }
}

function collectFunctionCloneCandidates(options) {
  const { target, file, sourceFile, collected } = options;
  visit(sourceFile);

  function addCandidate(node, body) {
    const normalizedBody = normalizeFunctionBody(body.getText(sourceFile));
    if (normalizedBody.length < MIN_FUNCTION_CLONE_BODY_CHARS) return;
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    collected.push({
      normalizedBody,
      item: {
        path: toPortablePath(path.relative(target, file)),
        line: position.line + 1,
        column: position.character + 1,
        name: functionLikeName(node, sourceFile),
        syntax: functionLikeSyntax(node),
        bodyChars: normalizedBody.length
      }
    });
  }

  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.body) {
      addCandidate(node, node.body);
    } else if (ts.isMethodDeclaration(node) && node.body) {
      addCandidate(node, node.body);
    } else if (ts.isFunctionExpression(node) && node.body) {
      addCandidate(node, node.body);
    } else if (ts.isArrowFunction(node)) {
      addCandidate(node, node.body);
    }
    ts.forEachChild(node, visit);
  }
}

function normalizeFunctionBody(bodyText) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, bodyText);
  const parts = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (!SCANNER_TRIVIA_KINDS.has(token)) parts.push(scanner.getTokenText());
    token = scanner.scan();
  }
  return parts.join('');
}

function functionLikeName(node, sourceFile) {
  if (node.name) return node.name.getText(sourceFile);
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
  if (ts.isPropertyAssignment(parent) && parent.name) return parent.name.getText(sourceFile);
  return '(anonymous)';
}

function functionLikeSyntax(node) {
  if (ts.isFunctionDeclaration(node)) return 'function-declaration';
  if (ts.isMethodDeclaration(node)) return 'method';
  if (ts.isFunctionExpression(node)) return 'function-expression';
  if (ts.isArrowFunction(node)) return 'arrow-function';
  return 'function';
}

function hashNormalizedBody(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function compareCloneItems(a, b) {
  return a.path.localeCompare(b.path)
    || a.line - b.line
    || a.column - b.column
    || a.name.localeCompare(b.name);
}

function compareCloneGroups(a, b) {
  return b.count - a.count
    || a.items[0].path.localeCompare(b.items[0].path)
    || a.items[0].line - b.items[0].line
    || a.hash.localeCompare(b.hash);
}

function hasExportModifier(node) {
  return Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
}

function scriptKindForPath(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.tsx') return ts.ScriptKind.TSX;
  if (extension === '.jsx') return ts.ScriptKind.JSX;
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function parseMaxResults(value, minimum = 1, maximum = 100) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`Invalid maxResults; expected an integer from ${minimum} to ${maximum}.`);
  }
  return parsed;
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function firstLine(text) {
  return normalizeNewlines(text).split('\n')[0].trim();
}

function languageName(language) {
  for (const [name, value] of AST_LANGUAGE_ALIASES) {
    if (value === language && name.length > 2) return name;
  }
  return String(language);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPortablePath(value) {
  return value.split(path.sep).join('/');
}
