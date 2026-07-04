# AI Agent Playbook v2 Reference Ledger Update

**Goal:** Add a preview-first update command that appends missing local reference queue rows to an existing reference adoption ledger without overwriting reviewed decisions.

**Why now:** `reference ledger-init` safely creates a missing ledger, but bootstrapped `.ai-playbook` layouts already include `knowledge/reference-adoption-ledger.md`. Those projects need an append-only adoption path that preserves existing `reviewed`, `adopted`, `deferred`, and `rejected` rows while adding only new reference candidates.

**Architecture:** Reuse `buildReferenceAdoptionQueue` with the existing ledger path so prior statuses are detected before any write. Generate compact Markdown table rows from queue items whose `ledgerStatus` is `new`, remove the starter blank template row when appending real rows, and write only when `--apply` is present. Keep MCP write access behind `--enable-write-tools` and `apply: true`.

## Scope

- `reference ledger-update <target> --reference-dir <dir>` CLI command.
- `updateReferenceAdoptionLedger` helper exported through the public harness facade.
- Read-only MCP preview tool plus opt-in write MCP tool.
- Tests for preview, apply, idempotent second run, placeholder cleanup, path safety, and MCP permission behavior.
- English and Korean command documentation.

## Non-Goals

- Do not copy raw upstream reference content into the ledger.
- Do not edit adopted rows or resolve statuses automatically.
- Do not add network fetching, embeddings, telemetry, or automatic project code changes.

## Implementation Checklist

- [x] Review current `reference ledger-init`, `ledger-check`, and template ledger behavior.
- [x] Add an append-only ledger update helper with structured conflicts.
- [x] Add CLI routing, help text, and JSON/non-JSON output.
- [x] Add MCP read-only preview and opt-in write tool registration.
- [x] Add CLI and MCP tests for no-write preview, apply, idempotency, and permission gating.
- [x] Update command docs and Korean translation.
- [x] Run full validation.
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
