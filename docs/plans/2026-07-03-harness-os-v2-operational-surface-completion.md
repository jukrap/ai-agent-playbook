# AI Agent Playbook v2 Operational Surface Completion Plan

> **For implementers:** Continue after capability pack and recipe expansion. The next goal is to make the new skills discoverable through MCP prompts, keep recipe contracts testable, and prepare bounded scaffold-tier run records without enabling project source writes.

**Goal:** Move AI Agent Playbook from "expanded catalog" to "operational harness": a user or agent can choose a workflow, preview required evidence, follow the right prompt, leave a bounded run record when explicitly requested, and promote only reviewed facts into durable memory.

**Reference inputs:** The local reference inventory continues to show useful recurring patterns across workflows, MCP resources/prompts, runtime evidence, compliance checks, and agent memory. Adopt the patterns as local contracts and validators. Do not copy upstream wording, project names, personal paths, internal URLs, secrets, branch names, PR numbers, or noisy source labels into public docs.

## Baseline

- Skill catalog now contains 48 skills across capability-first categories.
- Workflow catalog now contains 14 recipes, including deployment release, frontend quality review, and data integrity review.
- Runtime previews exist for workflow runs, symbol outline, dependency inventory, route/API/data hints, artifact schemas, capability history, write gate, and canon promotion checks.
- MCP exposes broad read-only tools and resources, but review prompts still concentrate on backend/security/index workflows.
- Write-capable behavior remains opt-in and must stay outside default MCP exposure.

## Reference-Derived Rules To Adopt

- **Prompt as run brief:** MCP prompts should name required evidence, optional evidence, stop conditions, and verification, not vague expertise.
- **Recipe as contract:** Every bundled recipe should parse into a stable manifest and have a smoke preview test.
- **Generated evidence stays generated:** Runtime reports can support review but must not become memory without explicit promotion.
- **Scaffold before write:** Run record creation belongs to `scaffold`, not `project-write`, and must stay under `.ai-agent-playbook/workflows/runs/`.
- **Portable public docs:** Public docs must avoid private paths, source pack names, machine-local identifiers, and raw reference excerpts.

## Workstream A: MCP Prompt Pack Follow-Through

### Task A1: DevOps Release Prompt

**Prompt:** `deployment_release_review`

**Purpose:** Route deployment, release, rollback, container, CI, and post-deploy checks through the new devops skills and runtime evidence.

**Required evidence:**

- `workflow_run_preview` with recipe `deployment-release`
- `dependency_inventory` for package, lockfile, container, and CI signals
- `diagnostics_check` for local verification candidates
- `write_gate_preview` before suggesting edits

### Task A2: Frontend Quality Prompt

**Prompt:** `frontend_quality_review`

**Purpose:** Route UI state/data, accessibility, visual regression, and responsive quality review through the new frontend skills.

**Required evidence:**

- `workflow_run_preview` with recipe `frontend-quality-review`
- `index_search` or `operator_search` for affected screens/components
- `operator_preflight` for related context and contracts
- visual/browser evidence when the target can be run

### Task A3: Data Integrity Prompt

**Prompt:** `data_integrity_review`

**Purpose:** Route analytics, dashboard, migration, backfill, and reconciliation review through the new data skills.

**Required evidence:**

- `workflow_run_preview` with recipe `data-integrity-review`
- `route_api_hints` for route/API/data hints
- `operator_search` for metric, query, migration, and dashboard references
- `contracts_check` when data contracts or durable invariants exist

### Task A4: Documentation Handoff Prompt

**Prompt:** `adr_spec_handoff_review`

**Purpose:** Route ADR/spec/worklog promotion through `adr-spec-handoff` and canon promotion rules.

**Required evidence:**

- `canon_check` for existing durable facts
- `index_status` for available generated evidence
- `write_gate_preview` if a future memory promotion write is being considered
- relevant worklog, plan, decision, or runtime artifact references

## Workstream B: Prompt And Recipe Drift Tests

### Task B1: Prompt Contract Tests

**Purpose:** Prevent prompts from drifting away from current tools, recipe IDs, or permission model.

**Acceptance:**

- Every review prompt includes `Required evidence:`, `Stop conditions:`, and `Verification expectations:`.
- Prompt tests assert the expected primary tool or recipe ID appears.
- Prompt tests reject stale `apply: true` guidance in default read-only prompts.

### Task B2: Recipe Preview Smoke Tests

**Purpose:** Make every bundled recipe parseable by `workflow run-preview`.

**Acceptance:**

- Tests iterate over `workflow list` IDs and preview each bundled recipe in a bare target.
- Each recipe returns inputs, outputs, skills, tools, stop conditions, and verification.
- Missing or malformed recipe sections fail tests.

## Workstream C: Scaffold-Tier Run Record Contract

### Task C1: Document `workflow run-start`

**Purpose:** Define future scaffold-tier behavior before implementation.

**Contract:**

- Default remains read-only preview.
- `workflow run-start` may write only under `.ai-agent-playbook/workflows/runs/`.
- It must write a run manifest, criteria checklist, evidence notes stub, and handoff stub.
- It must reject missing recipe, empty manifest, path traversal, and project-source destinations.

### Task C2: Optional First Scaffold Implementation

**Purpose:** Add the smallest useful apply behavior after the contract is documented and tested.

**Acceptance:**

- Requires explicit command and `--apply`.
- Writes only new run files; it never edits source code or trusted memory.
- Produces an audit-friendly JSON summary and leaves existing run files untouched unless a safe unique name is created.

## Workstream D: Reference Adoption Continuation

### Task D1: Refresh Reference Inventory Snapshot

**Purpose:** Keep the local reference analysis current without leaking raw reference names.

**Acceptance:**

- Run reference inventory in read-only mode.
- Record only aggregate capability signals in planning docs or local ledger.
- Identify next candidate packs without copying source prose.

### Task D2: Next Candidate Capability Packs

**Candidates:**

- testing and QA strategy pack: unit/integration/e2e, flake triage, fixture design, mutation risk.
- mobile/native hardening pack: app store release, native permissions, simulator/device diagnostics.
- language/backend profile references: Java/Spring, .NET, PHP, Node, Python, Go, Kotlin as stack references under primary skills.
- compliance/package hygiene pack: notices, licenses, SBOM/VEX handoff, release artifact checks.
- agent orchestration pack: subtask boundaries, review handoff, context budget, multi-agent evidence ledger.

## Workstream E: Verification

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

1. Add MCP prompts for deployment, frontend quality, data integrity, and ADR/spec handoff.
2. Add prompt drift tests and update MCP docs/translations.
3. Add recipe preview smoke tests across all bundled recipes.
4. Document the scaffold-tier run-start contract.
5. Implement run-start only if the contract and tests are stable.
6. Refresh reference inventory and choose the next capability pack.
7. Validate and commit each slice separately.

