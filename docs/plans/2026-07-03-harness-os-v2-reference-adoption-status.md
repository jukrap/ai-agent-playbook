# AI Agent Playbook v2 Reference Adoption Status Board

**Goal:** Add a read-only `reference adoption-status` surface that joins local reference queue, capability matrix, adoption ledger, and source registry state into one operator status board.

**Why now:** The reference workflow can now inventory, queue, inspect, plan, seed a ledger, and preview or append source registry entries. The remaining operational gap is status reconciliation: an operator still has to manually compare the queue with `knowledge/sources.json` and the reference adoption ledger to see which candidates are registered, adopted, deferred, or still untracked.

**Architecture:** Build a small catalog module that reuses `buildReferenceAdoptionQueue` for scoring and optional ledger annotation, then reads the target project source registry as metadata only. The status board reports compact per-reference status, capability rollups, warnings, and conflicts without writing files, copying reference contents, or promoting generated evidence into memory.

## Scope

- `reference adoption-status <target> --reference-dir <dir>` CLI command.
- `buildReferenceAdoptionStatus` helper exported through the public harness facade.
- Default read-only MCP tool `reference_adoption_status`.
- Per-reference status rows with priority, score, ledger status, source registry registration state, capability hints, and next actions.
- Capability rollups that show queue count, source-registered count, source-missing count, and ledger status distribution.
- English and Korean command/MCP documentation.
- CLI/MCP/module-boundary tests for no-write behavior, source registry joins, ledger joins, capability filtering, and missing registry warnings.

## Non-Goals

- Do not write source registry entries, ledger rows, memory maps, runtime reports, skills, workflows, MCP files, or project code.
- Do not replace `reference source-registry-check`, `reference ledger-check`, `reference capability-matrix`, or `reference adoption-plan`; status board is a reconciliation view.
- Do not decide that a reference is adopted. Ledger status remains the durable decision source.
- Do not copy raw reference source contents, large excerpts, private paths, internal URLs, credentials, branch names, or PR numbers.
- Do not introduce embeddings, network lookup, telemetry, or long-running watchers.

## Output Contract

- `summary.queueItems` counts the bounded reference queue rows included in the board.
- `summary.sourceRegistered` and `summary.sourceMissing` count whether each queue row has a matching source registry entry.
- `summary.ledgerStatuses` counts ledger status values from the annotated queue; unannotated rows are reported as `untracked`.
- `items[]` contains portable reference ids and target-relative registry paths only.
- `items[].sourceRegistered` is a boolean; `sourceId` is present only when a matching source exists.
- `capabilities[]` aggregates status by recommended and candidate capability id.
- `mode.writes` is always `false`.

## Implementation Checklist

- [x] Add status board builder in `src/catalog/reference-status.mjs`.
- [x] Join queue rows with source registry entries by `referencePath` and stable reference source id.
- [x] Add CLI routing, help text, JSON/non-JSON output, and `--capability` filtering.
- [x] Add MCP read-only tool registration and prompt evidence mentions.
- [x] Update command docs, MCP permission docs, and Korean translations.
- [x] Add CLI/MCP/module-boundary tests.
- [x] Run validation.
- [ ] Commit and push this slice.

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
