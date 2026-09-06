# Structural source search

Use AST search when code shape matters: find calls across formatting changes, or locate a particular JSX expression. Literal project-record search remains `records search`; source search uses `ast search`. This restores the structural-search capability without the old deep-analysis pipeline, language service, index, or rewrite engine. No new skill is installed.

## Search from your project

```powershell
ai-agent-playbook ast search --lang javascript --pattern 'console.log($$$ARGS)' --path src --json
ai-agent-playbook ast search --lang tsx --pattern 'useState($VALUE)' --path src --max-results 10 --json
```

The project defaults to the terminal's working directory. A positional project or `--project` selects another root. `--path` selects a literal project-relative file or directory; omit it to search the selected project. Quote patterns with single quotes in PowerShell and POSIX shells so `$VALUE` and `$$$ARGS` reach the parser unchanged. A double-quoted pattern can be altered by the shell.

| Option | Meaning |
| --- | --- |
| `--pattern` | Required ast-grep structural pattern, at most 4096 characters |
| `--lang` | Required language: `javascript`, `typescript`, `tsx`, `jsx`, `css`, or `html`; filters matching file extensions |
| `--path` | Optional literal relative file/directory; no globs or parent traversal |
| `--max-results` | Results per page, default 20, maximum 100 |
| `--max-chars` | Page content budget, default 12000, maximum 100000; not a whole-task token budget |
| `--max-files` | Files parsed per scan, default 1000, maximum 4000 |
| `--cursor` | Continue with the same project, path, language, pattern and file limit |
| `--json` | Structured output, including scan coverage and continuation |

Results contain project-relative paths, one-based lines and UTF-16 columns, exclusive end positions, and snippets capped at 500 characters. `snippetTruncated` identifies abbreviated snippets; use the source range to inspect the full match. `page.nextCursor` continues result pages. Changing inspected source content or the search scope rejects the cursor. Continuation repeats the bounded scan to validate its inputs; narrow paths reduce that repeated work.

## Read coverage before drawing a conclusion

Git repositories use tracked and non-ignored untracked paths from `git ls-files`. Tracked files are included even if a later ignore rule matches them. Without Git, a bounded filesystem walk uses the published directory exclusions; it does not interpret `.gitignore`. `scan.sourceMode` distinguishes these modes.

Generated directories, dependencies and local project records are always excluded, including `.git`, `node_modules`, `dist`, `build`, `coverage`, `.next`, `.turbo`, `.venv`, `.ai-agent-playbook`, the older hidden and unhidden playbook directories, `.refra-scope`, `_reference`, and `_work`. Linked files, directories and Windows junctions are never followed. An explicitly selected linked or excluded path is rejected.

Each file is limited to 1 MB, the total source input to 32 MB, directory/list entries to 20000, collected matches to 5000, and each search worker to 30 seconds. Hitting a limit, unreadable/oversized/binary input, or observed parser error is reported; inspect `scan.complete` and the bounded warning sample. A completed result page is not necessarily a complete source scan. Zero matches in an incomplete scan does not establish absence.

Search is read-only. It does not load project code, ast-grep configuration, custom grammars, or shell commands from the project. The worker only parses source text; Git is used for file selection. Parser failures never fall back to regex results. Tree-sitter structural matches do not prove type identity, semantic equivalence, successful compilation, or runtime behavior.

## Optional engine and MCP exposure

The npm package declares `@ast-grep/napi` as an optional dependency. Normal npm installation includes it on supported platforms; `--omit=optional` omits it. This adds native installation bytes, but its parser is loaded only during an AST call. Missing native support produces `aapb.ast-engine-unavailable`; the existing record commands and default MCP continue to work. Reinstall the intended package version with `--include=optional` to restore an omitted engine. No engine is downloaded by a search call.

The default MCP still exposes four record tools. To add the read-only `aapb_ast_search` tool, configure the server once with:

```sh
ai-agent-playbook mcp --with-ast
```

The new tool is bound to the server's project and accepts `pattern`, `lang`, `path`, `maxFiles`, `maxResults`, `maxChars`, and `cursor`. It cannot select another project or edit matches. Responses share the existing 256 KiB complete-MCP-result ceiling. Its definition is exposed when enabled; selective registration does not guarantee zero context cost or host-side lazy loading.

For a Codex registration using `npx`, add `--with-ast` after `mcp`. If `enabled_tools` is configured, also add `aapb_ast_search` while retaining the four record names. Restart the server/session after changing registration; no per-task toggle is needed. Use a package version containing this feature. A checkout implementation does not update an already installed or running registry package.

The old `ast_grep_search` MCP name, `operator analyze --deep`, AST rewrite commands and language-service tools are not restored. Use the new explicit source-search contract. [Agent use](agent-usage.md) and [MCP configuration](mcp-permission-model.md) cover the other tools.

## Verification scope

Windows checks on Node.js 22.22.3 passed all 154 tests, including 15 AST regressions, plus syntax, type, Python, documentation and installation previews. The 15 AST tests and the default MCP test also passed on Node.js 18.20.8. This exposed and fixed a Windows junction discovery difference: linked entries are skipped with incomplete coverage instead of failing the entire directory scan.

An isolated npm installation exercised CLI and actual SDK stdio calls against existing TSX and TypeScript projects. Both routes returned the same matches and preserved the project files. An installation omitting optional dependencies retained default MCP behavior and returned an explicit missing-engine error for AST. These checks do not establish automatic tool selection by every host, native compatibility on other platforms, or a measured speed/token improvement. The 30-second response deadline is implemented; a deliberately hanging native parser was not exercised.

Pattern and API reference: [ast-grep JavaScript API](https://ast-grep.github.io/guide/api-usage/js-api.html).
