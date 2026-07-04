# AI Agent Playbook v2 Reference Ledger Decision Update

**Goal:** Add a preview-first `reference ledger-decision` command that updates one reference adoption ledger row to `reviewed`, `adopted`, `deferred`, or `rejected` without manual markdown editing.

**Why now:** `reference adoption-status` can show source registration and ledger state, but operators still have to edit the ledger table by hand to record decisions. A narrow decision update path makes reference adoption resumable while preserving the ledger as the durable source of truth.

**Architecture:** Reuse the existing markdown ledger table shape. Read and validate the target ledger, locate one row by reference id, preview the exact row replacement, and write only when `--apply` is present. Keep MCP write access behind `--enable-write-tools` and `apply: true`, while also exposing a default read-only preview tool.

## Scope

- `reference ledger-decision <target> --reference <id> --status <status>` CLI command.
- `updateReferenceLedgerDecision` helper exported through the public harness facade.
- Optional `--capability`, `--pattern`, `--adoption`, `--risk`, and `--decision-date` fields for the selected row.
- Read-only MCP preview tool plus opt-in write MCP tool.
- Tests for preview, apply, idempotent no-op, invalid status, missing ledger, missing reference row, path safety, and MCP permission behavior.
- English and Korean command/MCP documentation.

## Non-Goals

- Do not create the ledger; use `reference ledger-init` first.
- Do not append missing queue rows; use `reference ledger-update` for that.
- Do not write source registry entries, memory maps, runtime reports, skills, workflows, MCP files, or project code.
- Do not copy raw reference source contents, large excerpts, private paths, internal URLs, credentials, branch names, or PR numbers into ledger cells.
- Do not auto-decide adoption from queue score, source registration, or capability matrix output.

## Output Contract

- `summary.changed` is `true` only when the selected row content would change.
- `decision.before` and `decision.after` contain compact table row objects, not raw upstream content.
- `operations[]` contains a `preview` or `write` row replacement operation when a change exists.
- `applied` is `true` only after `--apply` writes the ledger.
- `mode.writes` mirrors `--apply`.
- Unsafe cell values produce conflicts before any write.

## Implementation Checklist

- [x] Add decision update helper in a ledger-focused catalog module.
- [x] Parse and render the existing ledger table without reordering unrelated rows.
- [x] Add CLI routing, help text, JSON/non-JSON output, and validation.
- [x] Add MCP read-only preview and opt-in write tool registration.
- [x] Update command docs, MCP permission docs, and Korean translations.
- [x] Add CLI/MCP/module-boundary tests.
- [x] Run validation.
- [x] Commit and push this slice.

## Verification

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
