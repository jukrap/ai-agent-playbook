# Runtime Harness V27-V30: MCP Tools and Deep Analysis

## Summary

V27-V30 adds an MCP tool surface beside the existing CLI. The CLI stays the operator-facing command line. MCP is the AI-facing surface so an agent app can call playbook diagnostics, search, contracts, context, and QA helpers without the user memorizing every command.

The first MCP layer is read-only. It does not install hooks, write settings, rename files, rewrite code, run project tests, call the network, block work, or request continuation.

Deep analysis adds explicit AST-grep and TypeScript/JavaScript language signals. The light `operator analyze` path stays unchanged unless `--deep` is requested.

## Goals

- Add `aapb mcp` as a local stdio MCP server.
- Expose read-only playbook tools for context, operator diagnostics, rules, contracts, managed state, and QA.
- Add `operator analyze --deep` with shared AST and language-analysis logic.
- Provide individual MCP tools for AST search and TypeScript/JavaScript diagnostics, symbols, references, and definitions.
- Keep all default behavior explicit, local-only, and no-write.
- Document how CLI, MCP, skills, adapters, and `.ai-agent-playbook/` relate.

## Non-Goals

- No slash-command package.
- No Codex plugin packaging.
- No remote MCP server or hosted service.
- No AST rewrite/apply.
- No LSP rename.
- No automatic doctor execution.
- No blocking hooks, continuation, approval cache, or LLM judge.

## Public Interfaces

### CLI

```powershell
npx ai-agent-playbook mcp
npx ai-agent-playbook operator analyze <target> --deep --path src/example.ts --json
```

`aapb mcp` starts a local stdio MCP server. It is meant to be launched by an MCP-capable AI app, not by a human expecting terminal output.

`operator analyze --deep` keeps the existing analyze schema and adds a `deep` section with:

- `astGrep`
- `lsp.status`
- `lsp.diagnostics`
- `lsp.symbols`

### MCP Tools

The first read-only MCP tool set:

- `playbook_context`
- `operator_check`
- `operator_search`
- `operator_research`
- `operator_preflight`
- `operator_delta`
- `operator_map`
- `operator_audit`
- `rules_check`
- `context_status`
- `context_list`
- `contracts_check`
- `contracts_list`
- `managed_check`
- `managed_catalog`
- `diagnostics_check`
- `qa_image_diff`
- `operator_analyze_deep`
- `ast_grep_search`
- `lsp_status`
- `lsp_diagnostics`
- `lsp_symbols`
- `lsp_references`
- `lsp_definition`

Every tool is registered with a read-only annotation. Tool handlers reuse existing CLI result builders where possible and return structured JSON plus a short text summary.

## Deep Analysis Shape

AST search uses local source files only and returns relative paths, line, column, language, and snippet. Rewrite and apply are intentionally excluded.

TypeScript/JavaScript language analysis uses the TypeScript compiler API as a read-only local engine. It reports status, diagnostics, symbols, references, and definitions. When no project files or config are available, the result is a warning signal rather than a blocker.

Other languages may be detected by `operator map`, but dedicated LSP support starts with TypeScript/JavaScript.

## Adapter Config

`adapter config <target> --adapter codex --json` includes an MCP setup example:

```json
{
  "mcpServers": {
    "aapb": {
      "command": "npx",
      "args": ["ai-agent-playbook", "mcp"]
    }
  }
}
```

Global install users may use `aapb mcp` instead. Rendering this config does not write settings files.

## Test Plan

- MCP tools/list exposes the expected read-only tool names.
- MCP tool calls return `schemaVersion`, `ok`, and summary-shaped structured content.
- MCP list and calls are no-write.
- `operator analyze --deep --json` adds a `deep` section without changing the light analyze path.
- AST search works on TypeScript fixtures and reports relative paths.
- TypeScript diagnostics, symbols, references, and definitions work on Windows paths, paths with spaces, and non-ASCII paths.
- Missing language tooling returns warnings instead of blocking the command.
- Adapter config includes MCP setup examples without placeholders or personal paths.
- Documentation and Korean translations are updated together.

## Verification

Required final verification:

```powershell
npm run check
npm test
npm pack --dry-run --json
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Also run public documentation denylist and local absolute path searches, plus a smoke test in a real target project for MCP config rendering and deep analysis.
