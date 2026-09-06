# AI Agent Playbook 1.1.0

This release restores read-only AST source search while keeping the small 1.0 skill and record structure. Structural parsing provides a concrete code-search capability; it is separate from the general process instructions removed during the redesign. The old deep-analysis pipeline, language service, scheduler and rewrite commands remain retired.

## What changes

- `ai-agent-playbook ast search` finds source patterns with an explicit language and optional project-relative path.
- Starting MCP with `--with-ast` adds `aapb_ast_search`. The default connection retains the four record tools, and the development skill profile remains five skills.
- The optional `@ast-grep/napi` dependency is loaded only during AST calls. Normal npm installation includes its supported native binary; `--omit=optional` keeps record tools usable without AST.
- Results include exact source locations, bounded snippets, continuation pages and explicit scan coverage. Changed-source cursors and linked paths are rejected; discovered links are skipped without reading their targets.

## Update and use

```powershell
npm install -g ai-agent-playbook@1.1.0 --include=optional
ai-agent-playbook --version
ai-agent-playbook ast search --lang javascript --pattern 'console.log($$$ARGS)' --path src --json
```

Run the search in the intended project. Single quotes preserve pattern metavariables in PowerShell and POSIX shells. See [AST search](ast-search.md) for languages, exclusions, file limits, continuation and missing-engine handling.

Existing MCP registrations continue to expose the default four tools. To use AST, add `--with-ast` after `mcp`, add `aapb_ast_search` to an explicit tool allowlist, and reload the connection once. An existing `npx -y ai-agent-playbook@latest mcp` registration can keep its package selector. A running process continues using its loaded version until restarted; registry availability and actual host loading are separate checks. [MCP setup](mcp-permission-model.md) gives the full instructions.

No skill reinstall, record migration, architecture rewrite, or new global policy is required. Package installation does not automatically change MCP configuration. Existing 1.0 records and Forge coordination remain compatible.

## Validation and limits

Local Windows validation passed 154 tests on Node.js 22.22.3 and 16 focused AST/MCP tests on Node.js 18.20.8, plus syntax, type, Python, documentation and installation-preview checks. Package installations with and without the optional engine were exercised. CLI and SDK stdio searches returned matching results in two existing projects without changing their source or records. Node 18 testing found and fixed a Windows junction discovery difference.

This is structural matching, not type-aware reference resolution or proof of runtime behavior. It does not establish automatic tool selection in every host, native compatibility on every platform, or a measured speed/token improvement. The full search contract and verified limits are in [AST search](ast-search.md).

## Recovery

To return to the previous runtime, install `ai-agent-playbook@1.0.0`. Remove `--with-ast` and `aapb_ast_search` from that older server's registration before restarting it. Existing records and unchanged skill files do not need restoration merely because the runtime version changed. Use an exact `npx` version if the MCP package selector also needs to remain on the previous release.
