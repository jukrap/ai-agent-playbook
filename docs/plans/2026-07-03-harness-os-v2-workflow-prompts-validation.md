# AI Agent Playbook v2 Workflow, Prompt, And Verification Hardening Plan

> **For implementers:** Continue after the runtime index and MCP reader slices. This plan turns the new evidence surfaces into repeatable runs, safer prompts, and stronger validation gates.

**Goal:** Make AI Agent Playbook more operational: agents should be able to select a recipe, preview the run contract, collect relevant evidence, follow MCP prompts, and leave verification-ready artifacts without relying on chat history.

**Reference inputs:** The local reference set showed recurring patterns worth adopting: machine-evidence contracts with scan ranges, repo-local configuration precedence, no-write and no-data-loss guards, graph-style one-hop impact context, append-only capability history, SBOM/SCA gates, third-party notice checks, and cached bootstrap behavior. Adopt those patterns as local contracts and validators, not as copied upstream prose.

---

## Baseline

- Runtime preview indexes now exist for symbols, dependency inventory, and route/API/data hints.
- MCP exposes read-only index tools plus catalog, layout, write-gate, canon, operator, context, contract, and managed-state surfaces.
- Project playbook v2 already has `workflows/recipes`, `workflows/runs`, `runtime/indexes`, `runtime/reports`, `memory`, `contracts`, and `knowledge` separation.
- Existing recipes are Markdown files with Inputs, Outputs, Skills, Tools, Stop conditions, and Verification fields.
- Public docs and Korean translations are maintained together, but public-doc leak validation is still mostly manual.

## Reference-Derived Rules To Adopt

- **Evidence contract:** structural claims need source files, scan range, confidence, and generated time.
- **Absence contract:** "not found" is only valid with the searched roots, skipped directories, and degraded/unknown state.
- **Repo-local precedence:** target-local config should beat user-level defaults, while env flags can override both.
- **Symlink and path safety:** local config and generated artifact reads should reject traversal and symlink surprises where writes or trust boundaries are involved.
- **No-data-loss writes:** apply-mode features must reject empty outputs, identical no-op rewrites, malformed JSON, and unverifiable backup paths.
- **Graph-aware impact:** changed files should map to known nodes and one-hop neighbors when graph/index evidence exists; unmapped files should stay visible.
- **Append-only history:** performance, capability, and run evidence should be append-only when possible and never silently replace reviewed facts.
- **Packaging compliance:** shipped artifacts need dry-run pack checks, notice/license presence checks, and explicit generated-file boundaries.

## Workstream A: Workflow Run Preview

### Task A1: Recipe Parser And Run Manifest Preview

**Purpose:** Convert existing Markdown recipes into a stable, inspectable run manifest without writing files.

**Planned files:**

- Create: `src/runtime/workflow-runs.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/harness.mjs`
- Modify: `docs/commands.md`
- Modify: `docs/playbook-layout-v2.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Behavior:**

- Command: `workflow run-preview <target> --recipe <recipe-id> [--json]`
- Reads recipes from the target playbook first, then bundled templates.
- Parses known sections into `inputs`, `outputs`, `skills`, `tools`, `stopConditions`, and `verification`.
- Returns `schemaVersion`, `kind`, `target`, `recipe`, `mode`, `generatedAt`, `summary`, `manifest`, `warnings`, and `conflicts`.
- Preview is read-only and does not create `workflows/runs` artifacts.

**Acceptance:**

- Works with existing Markdown recipes without requiring a migration.
- Missing recipes return actionable conflicts.
- Output marks bundled fallback recipes versus target-local recipes.
- No recipe text becomes trusted memory automatically.

### Task A2: Run Apply Contract Draft

**Purpose:** Define the future apply-mode contract before enabling writes.

**Planned files:**

- Modify: `docs/harness-runtime.md`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations

**Behavior:**

- Document future `workflow run-start` as scaffold-tier, not project-write.
- It may write only under `.ai-playbook/workflows/runs/`.
- It must write a manifest, criteria file, append-only ledger, and handoff stub.

**Acceptance:**

- No apply command is implemented in this slice.
- The permission model clearly separates preview, scaffold, managed-write, and project-write.

## Workstream B: MCP Prompt Packs

### Task B1: Evidence-First Review Prompts

**Purpose:** Give agents reusable, narrow prompts that use runtime indexes and stop conditions consistently.

**Planned files:**

- Modify: `src/mcp-tools.mjs`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations
- Test: `test/mcp.test.mjs`

**Prompts:**

- `backend_change_review`
- `auth_access_control_review`
- `dependency_supply_chain_review`
- `workflow_run_review`
- `canon_promotion_review`
- `index_interpretation_review`

**Acceptance:**

- Each prompt names required evidence, optional evidence, stop conditions, and verification expectations.
- Prompt text distinguishes generated hints from trusted memory.
- Prompts do not grant write access and do not ask users to hand-author JSON.

### Task B2: Prompt Drift Tests

**Purpose:** Keep prompt mappings current as tools and recipes evolve.

**Planned files:**

- Modify: `test/mcp.test.mjs`
- Modify or create: `test/prompt-contracts.test.mjs`

**Acceptance:**

- Tests assert new prompts mention the relevant read-only tools.
- Tests fail when prompts teach stale tool names or obsolete write behavior.

## Workstream C: Config And Public Validation

### Task C1: Repo-Local Harness Config Preview

**Purpose:** Allow projects to declare local AI Agent Playbook defaults without coupling them to user-level machine settings.

**Planned files:**

- Create: `src/core/config.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/config.test.mjs`

**Behavior:**

- Read `.ai-playbook/config.json` and `.ai-playbook/config.local.json` in a documented order.
- Env overrides remain explicit and narrow.
- Preview command reports resolved values and source files without writing.
- Unsafe paths, traversal, malformed JSON, and symlinked trusted config produce warnings or conflicts.

**Acceptance:**

- Target-local config wins over user defaults.
- Missing or malformed config falls back safely.
- No personal home config is read during tests.

### Task C2: Public Doc Leak And Notice Check

**Purpose:** Turn current manual hygiene into a repeatable validation gate.

**Planned files:**

- Create: `scripts/validate-public-docs.ps1`
- Modify: `package.json`
- Modify: `docs/maintenance.md`
- Modify matching Korean translations
- Test: script smoke in `test/packaging.test.mjs` or a dedicated test.

**Behavior:**

- Fail on personal absolute paths, internal URLs, obvious secret assignments, oversized raw excerpts, and local reference directory mentions in public docs.
- Allow safe test fixtures, documented placeholders, and intentionally scrubbed examples.
- Optionally check that notice/license files included by `package.json` remain present in `npm pack --dry-run`.

**Acceptance:**

- Validation has an allowlist for test fixture files.
- The script is included in the standard verification checklist.
- False positives are explainable and localized.

## Workstream D: Capability History And Artifact Schemas

### Task D1: Runtime Artifact Schema Checks

**Purpose:** Make runtime evidence consistent before it is exposed to MCP or promoted to memory.

**Planned files:**

- Create: `src/runtime/schemas.mjs`
- Modify: runtime index modules
- Modify: `src/memory/canon.mjs`
- Test: runtime and canon fixtures

**Acceptance:**

- Runtime artifacts require `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, and `conflicts`.
- Invalid artifacts fail with actionable errors.
- Canon promotion refuses malformed runtime artifacts.

### Task D2: Capability History Preview

**Purpose:** Track repeated verification and performance evidence without making telemetry or network calls a default.

**Planned files:**

- Create: `src/runtime/capability-history.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `runtime capability-history <target> [--json]`
- Reads local append-only JSONL history if present.
- Summarizes capability, latest status, duration, baseline, and drift.
- Does not run benchmarks in this slice.

**Acceptance:**

- Missing history is an empty read-only state.
- History entries are portable and do not expose machine-local paths.

## Workstream E: Capability Pack Follow-Through

### Task E1: Devops And Release Pack

**Primary skills:**

- `container-change-safety`
- `deployment-release-check`
- `observability-incident-triage`

**References:**

- Container image changes, Compose/Kubernetes deployment risk, CI release gates, rollback, logs/metrics/traces, SBOM/SCA handoff.

### Task E2: Frontend Quality Pack

**Primary skills:**

- `frontend-state-data-flow`
- `frontend-accessibility-review`
- `visual-regression-qa`

**References:**

- State ownership, server/client cache boundaries, keyboard/focus flows, responsive overflow, browser verification, visual snapshots.

### Task E3: Data And Documentation Pack

**Primary skills:**

- `analytics-reporting-review`
- `data-migration-integrity`
- `adr-spec-handoff`

**References:**

- Metric definitions, ETL contracts, migration rollback, report validation, ADR/spec/worklog promotion.

**Acceptance for all packs:**

- Skills stay trigger-focused.
- Long procedures live in one-level references.
- Korean translations are included in the same change.
- Existing skills are wrapped or referenced rather than duplicated.

## Implementation Order

1. Add and commit this plan.
2. Implement workflow run-preview over existing recipe Markdown.
3. Add MCP prompt pack and prompt drift tests.
4. Add repo-local config preview.
5. Add public doc leak validation.
6. Add runtime artifact schema checks.
7. Add capability history preview.
8. Add devops/release capability pack.
9. Add frontend quality capability pack.
10. Add data/documentation capability pack.
11. Run the full verification set and update remaining gaps.

## Verification Per Batch

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- targeted CLI/MCP/script tests for changed behavior
- `git diff --check`

## Non-Goals

- No default embeddings.
- No network SCA or CVE lookup by default.
- No MCP project-write tools.
- No automatic memory promotion.
- No raw reference dumps in public docs.
- No hidden telemetry or long-running background loops.
