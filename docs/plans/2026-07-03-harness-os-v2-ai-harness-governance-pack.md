# AI Agent Playbook v2 AI Harness Governance Pack Plan

> **For implementers:** Continue after the database depth pack. This plan covers the next weak catalog surface: `ai-harness` currently has MCP design guidance and meta skill authoring guidance, but it lacks first-class skills for context engineering, skill-pack governance, and runtime index/cache design.

**Goal:** Add capability-first AI harness guidance for context surfaces, durable memory promotion, skill-pack growth, reference adoption, runtime artifacts, and cache/index invalidation without turning every new idea into a core MCP tool or permanent prompt burden.

**Reference inputs:** The refreshed local reference inventory shows repeatable harness patterns around keeping the core tool surface narrow, treating prompts/skills as full-read instructions rather than paginated snippets, separating generated evidence from trusted memory, using write gates before managed changes, and keeping plugin/skill growth governed by manifests and tests. Adopt those patterns as local skills and references. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Skill catalog contains 63 skills after the database depth pack.
- The `ai-harness` canonical category currently has `mcp-server-design` and `agent-skill-authoring`.
- The runtime already has catalogs, layout v2, MCP prompts/tools, reference inventory, canon promotion, and runtime indexes.
- Existing skills explain how to add skills or MCP tools, but they do not separately guide context budget, memory promotion, skill-pack governance, cache invalidation, or runtime artifact contracts.

## Reference-Derived Rules To Adopt

- **Keep core surface narrow:** Prefer docs, recipes, CLI commands, opt-in MCP tools, or plugin surfaces before adding always-on core prompt or tool surface.
- **Protect prompt/cache budget:** Do not add noisy source lists, large reference excerpts, or mutable past context to default instructions.
- **Read selected instructions fully:** Skills, prompts, and playbooks should not rely on lazy pagination that encourages partial reading.
- **Separate evidence from memory:** Runtime reports, indexes, dry-run output, and generated graphs remain generated evidence until reviewed and promoted.
- **Make growth testable:** New skills, prompts, workflows, and resources need catalog checks, docs, translations, and no-write or dry-run validation.
- **Gate writes:** Managed writes, scaffold writes, and project writes need target validation, dry-run, audit trail, and explicit apply semantics.

## Workstream A: Context Engineering And Memory Design

### Task A1: Context Engineering Memory Design Skill

**Skill:** `ai-harness/context-engineering-memory-design`

**References:**

- `context-surface-and-cache-budget.md`
- `memory-promotion-and-staleness.md`

**Coverage:**

- Agent instructions, root policies, `.ai-playbook`, prompt/context surfaces, context compaction, durable memory, worklogs, maps, contracts, and handoffs.
- What belongs in always-on rules, project-local context, selected skill references, generated runtime reports, or archive.
- Review-before-promotion and stale-memory handling.

## Workstream B: Skill Pack Governance

### Task B1: Skill Pack Governance Skill

**Skill:** `ai-harness/skill-pack-governance`

**References:**

- `skill-taxonomy-and-wrapper-checks.md`
- `reference-adoption-noise-control.md`

**Coverage:**

- Skill taxonomy growth, wrapper compatibility, naming, trigger descriptions, reference routing, translations, install/sync behavior, and reference adoption.
- Keeping capability-first structure while still preserving useful stack profiles.
- Avoiding raw reference noise and personal/private values in reusable public docs.

## Workstream C: Runtime Index And Cache Design

### Task C1: Runtime Index Cache Design Skill

**Skill:** `ai-harness/runtime-index-cache-design`

**References:**

- `runtime-artifact-contracts.md`
- `index-cache-invalidation.md`

**Coverage:**

- Runtime reports, indexes, graphs, cache status, invalidation, artifact schemas, generated evidence, canon promotion, and stale evidence checks.
- File inventory, symbol outline, dependency inventory, route/API hints, clone cues, and future optional embedding providers.
- Keeping generated artifacts local-only until reviewed and preventing runtime output from becoming trusted memory by accident.

## Workstream D: Workflow And MCP Follow-Up

### Task D1: Harness Extension Recipe Expansion

**Candidate recipe update:** `harness-extension`

**Acceptance:**

- Inputs include capability intent, context budget, target surface, permission tier, docs/translations, tests, and rollback path.
- Stop conditions cover core tool bloat, always-on prompt noise, write path without gate, missing schema, and unreviewed memory promotion.
- Verification includes catalog checks, prompt/resource/tool listing, no-write MCP behavior, translation/public-doc hygiene, and dry-run/apply behavior when writes exist.

### Task D2: Harness Governance Prompt

**Candidate prompt:** `harness_governance_review`

**Acceptance for a later slice:**

- Prompt remains read-only and routes through `capability_catalog`, `skill_catalog`, `workflow_list`, `reference_inventory`, `reference_ledger_check`, `index_status`, and `write_gate_preview`.
- Prompt asks whether a proposed change belongs in skill, reference, recipe, runtime CLI, MCP resource, MCP prompt, MCP tool, adapter, plugin, or docs.

## Workstream E: Docs, Tests, And Catalog

**Acceptance:**

- README skill list and category summaries include the new AI harness skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the AI harness governance map.
- Korean translations are updated in the same change.
- Skill count expectations are updated from 63 to 66.
- Catalog remains warning-free and wrapper checks stay green.

## Workstream F: Verification

Run after each implementation slice:

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Suggested Order

1. Add and commit this plan.
2. Add `context-engineering-memory-design`, `skill-pack-governance`, and `runtime-index-cache-design` skills with references and translations.
3. Update catalog docs and skill-count tests, then commit the AI harness governance skill pack.
4. Expand `harness-extension` workflow recipe and smoke coverage.
5. Add `harness_governance_review` MCP prompt and prompt contract tests.
6. Re-run full verification and decide whether the next surface is data analytics depth, documentation artifacts, or runtime write-tier implementation.

## Non-Goals

- No always-on prompt expansion for every reference source.
- No automatic network indexing or embedding provider by default.
- No project source write through MCP.
- No raw upstream source dumps in public docs.
