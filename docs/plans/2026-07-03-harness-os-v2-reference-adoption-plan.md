# AI Agent Playbook v2 Reference Adoption Plan

**Goal:** Add a read-only `reference adoption-plan` surface that turns a capability-focused reference matrix into a compact implementation planning packet.

**Why now:** `reference capability-matrix` shows which local reference projects support each capability, but an operator still has to open each candidate with `reference inspect` and manually combine read order, surfaces, stop conditions, ledger status, and verification. The next useful step is a bounded plan packet that selects top references for one capability and summarizes what to read and what to adopt without copying source contents.

**Architecture:** Reuse `buildReferenceCapabilityMatrix` for scoring, filtering, and optional ledger annotation. For the selected references, reuse the existing single-project inspect packet to attach read order and adoption questions. Keep the result local-only, no-network, no-write, and explicit that it is triage evidence, not an adoption decision.

## Scope

- `reference adoption-plan <reference-dir> --capability <id>` CLI command.
- `buildReferenceAdoptionPlan` helper exported through the public harness facade.
- Default read-only MCP tool `reference_adoption_plan`.
- Bounded selected references with priority, ledger status, useful surfaces, read order, questions, and next actions.
- English and Korean command/MCP documentation.
- CLI/MCP/module-boundary tests for required capability, no-write behavior, selection, ledger status propagation, and prompt routing.

## Non-Goals

- Do not write ledger rows, source registry entries, memory maps, runtime reports, skills, workflows, or MCP files.
- Do not decide that a reference is adopted; the plan is a review packet only.
- Do not copy raw reference source contents, large excerpts, private paths, internal URLs, credentials, branch names, or PR numbers.
- Do not introduce embeddings, network lookup, or telemetry.

## Output Contract

- `summary.selectedReferences` counts the bounded references included in the plan.
- `plan.references[]` contains portable project ids and representative file paths only.
- `plan.references[].readOrder[]` uses the existing inspect reasons and does not include file contents.
- `plan.references[].suggestedSurfaces[]` maps detected signals to possible local surfaces such as skill reference, MCP tier review, workflow recipe, runtime index, validator, connector contract, or docs update.
- `plan.stopConditions[]` and `plan.verification[]` state reusable gates before any write-capable follow-up work.
- `mode.writes` is always `false`.

## Implementation Checklist

- [x] Add adoption plan builder on top of `buildReferenceCapabilityMatrix` and `inspectReferenceProject`.
- [x] Add bounded reference selection and portable no-content plan items.
- [x] Add CLI routing, help text, JSON/non-JSON output, and required capability handling.
- [x] Add MCP read-only tool registration.
- [x] Update command docs, MCP permission docs, prompts, and Korean translations.
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
