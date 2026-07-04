# AI Agent Playbook v2 Reference Capability Breadth

**Goal:** Expand the reference adoption classifier so local reference queues can surface frontend, database, devops, mobile, data, architecture, design, documentation, and connector capability signals instead of collapsing most projects into broad AI harness buckets.

**Why now:** The reference workflow can inventory, queue, inspect, plan, register, track status, and update ledger decisions. A review of the current reference queue showed that broad operational projects are still over-classified as `ai-harness`, `security`, `delivery`, and `foundation`; a `devops` adoption plan can return no matches even when CI, package, container, and release files are present. That makes later skill/MCP adoption less reliable.

**Architecture:** Keep the reference scanner bounded and path-based. Add domain-specific signal counters, map those counters to capability-first recommended and candidate capability ids, and teach adoption-plan objectives/surfaces/questions to use the expanded taxonomy. Do not read file contents, introduce embeddings, or copy reference prose.

## Scope

- Expand `emptySignals`, `addSignals`, `scoreSignals`, and related queue/matrix logic with capability breadth signals.
- Add path-only detection for frontend, database, devops, mobile, data, architecture, design, documentation, connectors, packages, and observability.
- Update recommended and candidate capability mapping to align with `docs/skill-taxonomy-v2.md`.
- Add adoption-plan objectives, suggested surfaces, questions, stop conditions, and verification lines for the new capability ids.
- Update command docs and Korean translations to name broader capability filters.
- Add CLI tests proving that `reference capability-matrix --capability devops`, `frontend`, `database`, `data`, and `mobile` can match bounded local fixtures without writing files.

## Non-Goals

- Do not add embeddings, network calls, telemetry, or long-running watchers.
- Do not copy raw reference source content or large excerpts into output.
- Do not mark any reference as adopted.
- Do not create new skills in this slice; this slice improves the reference selection substrate for later skill additions.
- Do not make capability scoring depend on project names alone.

## Output Contract

- `reference inventory` still reports compact signal counts only.
- `reference adoption-queue` continues to return portable representative paths and no raw contents.
- `reference capability-matrix --capability <id>` returns non-empty groups for capability-specific fixture signals.
- `reference adoption-plan --capability <id>` returns objective, surfaces, stop conditions, and verification tailored to the requested capability.
- Existing AI harness, MCP, source registry, ledger, and status behavior remains backward compatible.

## Implementation Checklist

- [x] Add signal counters and path heuristics for the expanded capability set.
- [x] Update capability recommendation, candidate capability, action, surface, question, objective, stop condition, and verification mappings.
- [x] Update command documentation and Korean translation.
- [x] Add CLI tests for new capability filters and no-write behavior.
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
