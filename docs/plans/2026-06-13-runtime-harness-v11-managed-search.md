# Runtime Harness V11 Managed Manifest and Operator Search

**Goal:** Add explicit project-level ownership tracking and a local read-only search command without changing the default document/CLI harness model.

**Architecture:** Bootstrap and guide sync write a portable managed manifest after successful writes. Managed commands inspect, adopt, or remove only files proven by hashes. `operator search` scans local text files and reuses diagnostics/rules summaries without running project commands or calling the network.

## Scope

- Add `.ai-agent-playbook/.ai-agent-playbook-install.json` for copied project harness files.
- Add `managed check`, `managed adopt`, and `managed uninstall`.
- Add `operator search <target> --query <text> [--path <file>] [--max-results N] [--json]`.
- Keep `operator check` low-noise and unchanged.
- Keep hooks, slash commands, continuation, blocking, and automatic doctor execution out of scope.

## JSON Contracts

`managed check --json` returns:

- `schemaVersion`
- `ok`
- `target`
- `manifestPath`
- `summary`
- `files`
- `warnings`
- `conflicts`

`managed adopt --json` and `managed uninstall --json` return:

- `schemaVersion`
- `ok`
- `target`
- `applied`
- `summary`
- `operations`
- `warnings`
- `conflicts`

`operator search --json` returns:

- `schemaVersion`
- `ok`
- `target`
- `query`
- optional `path`
- `summary`
- `results`
- `related`

## Non-goals

- No Codex plugin packaging.
- No slash command.
- No AST or LSP dependency.
- No network search.
- No automatic cleanup.
- No hook-driven diagnostics.

## Tests

- Bootstrap creates a manifest and dry-run does not.
- Manifest paths stay portable and hash-based.
- Guide sync updates manifest entries while check mode stays read-only.
- Managed check reports missing, malformed, missing-file, and modified-file states without writing.
- Managed adopt previews by default and records only matching files when applied.
- Managed uninstall previews by default, removes only unmodified files when applied, and preserves edited files.
- Operator search finds source, playbook, rule, and worklog matches without writing.
- Operator search reports no matches as success.

## Verification

Run:

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Also run public documentation searches for external harness names and fixed local absolute paths before merge, and verify `managed check/adopt` preview plus `operator search` against a local target repository.
