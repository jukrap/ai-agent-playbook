# Runtime Harness V10 Operator Check

**Goal:** Add a combined read-only operator checkpoint that lets a human review harness health, guide freshness, local verification command candidates, and rule matching from one command.

**Architecture:** Keep the document and CLI harness as the default path. `operator check` aggregates existing read-only checks and does not install hooks, run project commands, write files, or call the network.

## Scope

- Add `operator check <target> [--path <file>] [--diff] [--json]`.
- Reuse existing `doctor`, `guides sync --check`, `diagnostics check`, and `rules check` logic.
- Keep warnings visible but non-blocking when they are review signals, such as stale guides.
- Fail the combined check only when one of the underlying sections has a failure, such as missing playbook files.
- Document the command in source docs and Korean translations.

## JSON Contract

`operator check --json` returns:

- `schemaVersion`
- `ok`
- `target`
- optional `path`
- `summary`
- `checks`
- `sections`

`sections` contains the original section reports:

- `doctor`
- `guides`
- `diagnostics`
- `rules`

## Non-goals

- No blocking hooks.
- No continuation.
- No automatic doctor execution.
- No project verification command execution.
- No settings writes.
- No network calls.

## Tests

- Aggregates all four sections for a path without writing files.
- Reports stale guides as a warning without failing.
- Fails when the playbook is missing while still reporting diagnostics candidates and writing nothing.

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

Also run public documentation searches for external harness names and fixed local absolute paths before merge.
