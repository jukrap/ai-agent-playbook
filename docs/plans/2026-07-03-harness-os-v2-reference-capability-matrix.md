# AI Agent Playbook v2 Reference Capability Matrix

**Goal:** Add a read-only `reference capability-matrix` surface that groups local `_reference` collections by reusable AI Agent Playbook capability areas.

**Why now:** `reference inventory`, `reference adoption-queue`, and `reference inspect` can find and open candidates, but adoption work still needs a compact matrix that shows which references support ai-harness, delivery, backend, security, foundation, and other capability areas before choosing the next implementation slice.

**Architecture:** Reuse the adoption queue scoring and optional ledger status annotation. Build a bounded matrix keyed by recommended and candidate capability ids, with priority counts, ledger status counts, top references, signal highlights, representative files, and next actions. Keep the command local-only, no-network, no-write, and free of raw source contents.

## Scope

- `reference capability-matrix <reference-dir>` CLI command.
- `buildReferenceCapabilityMatrix` helper exported through the public harness facade.
- Default read-only MCP tool `reference_capability_matrix`.
- Optional `--capability <id>` filter and optional `--ledger <ledger.md>` status annotation.
- English and Korean command/MCP documentation.
- CLI/MCP/module-boundary tests for no-write behavior, grouping, filtering, and ledger status propagation.

## Non-Goals

- Do not read or emit raw reference source contents.
- Do not write ledger rows, source registry entries, memory maps, or runtime reports.
- Do not decide which reference is adopted; the matrix is triage evidence only.
- Do not introduce embeddings or network metadata.

## Implementation Checklist

- [x] Add matrix builder on top of `buildReferenceAdoptionQueue`.
- [x] Include bounded top references per capability with portable paths only.
- [x] Add CLI routing, help text, and JSON/non-JSON output.
- [x] Add MCP read-only tool registration.
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
