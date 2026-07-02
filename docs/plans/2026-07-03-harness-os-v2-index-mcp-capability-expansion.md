# Harness OS v2 Index, MCP, And Capability Expansion Plan

> **For implementers:** Continue from the completed transaction/canon and backend/security slices. Keep every batch separately reviewable, verified, and committed.

**Goal:** Turn Harness OS from a cataloged skill/playbook toolkit into a broader development operating surface: richer local runtime indexes, more useful read-only MCP resources/prompts, workflow run records, and additional capability packs across devops, frontend quality, mobile, data, documentation, and harness extension.

**Architecture:** Keep trusted memory, generated runtime evidence, and integration settings separate. Runtime index outputs remain local generated artifacts under `.ai-playbook/runtime/`; promoted facts require explicit canon promotion. MCP remains read-only by default, with scaffold/write behavior opt-in and auditable.

**Reference Inputs:** Use the local `_reference/` collection as pattern input only. Adopt contracts, schemas, validation ideas, workflow boundaries, and skill-authoring style. Do not copy large upstream excerpts, upstream branding, personal absolute paths, internal URLs, or noisy reference-specific names into public docs.

---

## Current Baseline

- `.ai-playbook` layout v2 exists with memory/runtime/integration separation.
- Catalog checks understand taxonomy v2 and compatibility wrappers.
- Reference inventory and ledger validation exist.
- Write-gate advisory/post-check and canon draft/check/promote exist with read-only defaults.
- MCP exposes read-only catalog, layout, reference, write-gate, and canon surfaces.
- Backend and security capability packs now include primary skills plus stack/profile references.

## Design Principles

- Evidence first: every generated map or fact should name its source files, scan range, confidence, and timestamp.
- Runtime before memory: generated indexes never become trusted maps without explicit review and promotion.
- Capability before stack: stack profiles support skills, but primary skill names describe problem types.
- MCP as reader surface first: add resources and prompts before expanding write-capable tools.
- Validation is part of the feature: every new artifact shape gets schema checks, fixtures, and command tests.
- Reference adoption stays clean: use external examples to shape local contracts, not to import noise.

## Workstream A: Runtime Index v2

### Task A1: Symbol And Function Outline Index

**Purpose:** Add a small language-tolerant outline that helps agents understand where functions, classes, exported components, controllers, and jobs live.

**Planned files:**

- Create: `src/runtime/symbol-outline.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/harness.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Behavior:**

- Command: `index symbol-outline <target>`
- Default mode is preview/read-only.
- Output schema includes `schemaVersion`, `target`, `scanRange`, `generatedAt`, `entries`, `warnings`.
- Entries include `file`, `language`, `kind`, `name`, `line`, `confidence`, `source`.
- Use lightweight extractors for common text patterns first; do not require AST packages or network access.
- Mark uncertain findings as `low` confidence rather than pretending exact coverage.

**Acceptance:**

- Works on JS/TS, Java/Kotlin/C#/PHP/Python/Go fixtures at basic pattern level.
- Skips `.ai-playbook/runtime/`, dependency directories, binary files, and large generated files.
- Does not write files unless an explicit future `--apply` command is added.

### Task A2: Route/API/Data Map Hints

**Purpose:** Extract route, API endpoint, query, migration, and data-flow hints as generated evidence for later canon promotion.

**Planned files:**

- Create: `src/runtime/route-api-hints.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `index route-api-hints <target>`
- Detect lightweight hints for Express/Fastify/Nest, Spring MVC, ASP.NET, Django/FastAPI, Laravel/PHP, Next/React routes where visible.
- Detect SQL/migration/query file hints without interpreting credentials or connecting to databases.
- Output confidence and matched pattern names.

**Acceptance:**

- Generated output is clearly labeled as hints, not canonical architecture.
- Each hint has source file and line information where available.
- Sensitive strings are redacted from snippets.

### Task A3: Dependency And Supply-Chain Inventory

**Purpose:** Provide read-only package/lock/container inventory that supports dependency review and SBOM workflows without becoming a vulnerability scanner by default.

**Planned files:**

- Create: `src/runtime/dependency-inventory.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `index dependency-inventory <target>`
- Read manifests and lockfiles for npm/pnpm/yarn, Maven/Gradle, NuGet, Composer, pip/Poetry, Go modules, Dockerfile, Compose, and GitHub Actions where present.
- Report ecosystems, manifest paths, lockfile paths, script hooks, container base images, and missing lockfile warnings.
- Do not fetch vulnerability databases or licenses over the network in this batch.

**Acceptance:**

- No package scripts are executed.
- Lockfile absence is a warning, not a failure.
- Findings can feed `dependency-supply-chain-review` and future MCP resources.

## Workstream B: MCP v2 Reader Surface

### Task B1: Index Resources

**Purpose:** Make runtime indexes inspectable from MCP without requiring direct filesystem navigation.

**Planned files:**

- Modify: `src/mcp-tools.mjs`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations
- Test: `test/mcp.test.mjs`

**Resources/tools:**

- `index_status`: list available runtime index artifacts and schema versions.
- `index_search`: search generated index entries by kind, file, name, or confidence.
- `symbol_outline`: read the latest symbol outline artifact when present.
- `dependency_inventory`: read the latest dependency inventory artifact when present.

**Acceptance:**

- MCP reads only `.ai-playbook/runtime/indexes` and `.ai-playbook/runtime/reports`.
- Missing indexes return actionable empty states.
- No MCP write tool is exposed by default.

### Task B2: Prompt Packs For Review Workflows

**Purpose:** Add reusable prompts that route agents through the new skills and runtime evidence.

**Planned files:**

- Modify: `src/mcp-prompts.mjs` if prompts are separated, otherwise `src/mcp-tools.mjs`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations
- Test: `test/mcp.test.mjs`

**Prompts:**

- Backend change review
- Auth/access-control review
- Dependency/supply-chain review
- Canon promotion review
- Index interpretation and promotion candidate review

**Acceptance:**

- Prompts name required evidence and stop conditions.
- Prompts distinguish generated hints from trusted memory.
- Prompt text stays generic and avoids reference-specific noise.

## Workstream C: Workflow Runs

### Task C1: Run Manifest Preview

**Purpose:** Let long-running harness work produce inspectable run records without relying on conversation history.

**Planned files:**

- Create: `src/runtime/workflow-runs.mjs`
- Modify: `src/cli.mjs`
- Modify: `templates/project-playbook/workflows/`
- Modify: `docs/playbook-layout-v2.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `workflow run-preview <recipe> <target>`
- Output includes recipe id, inputs, selected skill categories, planned artifacts, verification, blockers, and handoff notes.
- Preview is read-only. Future apply writes only under `.ai-playbook/workflows/runs/`.

**Acceptance:**

- Run manifests can be inspected without reading the full chat.
- Worklog promotion remains explicit and separate.

### Task C2: Recipe Expansion

**Purpose:** Add recipes that bind skills, indexes, and MCP prompts into repeatable flows.

**Recipes:**

- backend change
- auth/access-control audit
- dependency/supply-chain review
- CI/deployment triage
- frontend visual/accessibility review
- mobile release QA
- documentation package
- harness extension

**Acceptance:**

- Each recipe names inputs, outputs, required skills, optional runtime indexes, stop conditions, and verification.
- Recipes avoid stack lock-in and reference stack profiles only when needed.

## Workstream D: Capability Pack Expansion

### Task D1: Devops Pack

**Primary skills:**

- `container-change-safety`
- `deployment-release-check`
- `observability-incident-triage`

**References:**

- Docker/Compose, Kubernetes, GitHub Actions, Jenkins, Vercel/Netlify-style deployments, logs/metrics/traces, rollback planning.

**Acceptance:**

- Skills stay trigger-focused.
- Detailed procedures live in one-level references.
- Korean translations are included in the same change.

### Task D2: Frontend Quality Pack

**Primary skills:**

- `frontend-state-data-flow`
- `frontend-accessibility-review`
- `visual-regression-qa`

**References:**

- React/Vue/Svelte/Angular profiles, accessibility checklist, responsive overflow checks, design token review, browser verification.

**Acceptance:**

- Existing UI polish skills are not duplicated; new skills cover distinct problem spaces.
- Browser verification expectations are explicit for visible UI work.

### Task D3: Data And Documentation Pack

**Primary skills:**

- `analytics-reporting-review`
- `data-migration-integrity`
- `adr-spec-handoff`

**References:**

- Metric definition, ETL boundaries, migration rollback, reporting validation, ADR/spec/worklog handoff.

**Acceptance:**

- Data skills separate analytical evidence from source-of-truth records.
- Documentation skills avoid project-specific assumptions.

## Workstream E: Validators And Documentation Hygiene

### Task E1: Public Doc Leak Check

**Purpose:** Guard against personal paths, internal URLs, credentials, and noisy reference imports in public docs.

**Planned files:**

- Create: `scripts/validate-public-docs.ps1`
- Modify: `package.json`
- Modify: `docs/maintenance.md`
- Modify matching Korean translations if docs change
- Test: script smoke checks where practical

**Acceptance:**

- Fails on personal absolute paths, obvious secrets, large raw excerpts, and internal URL markers.
- Allows documented placeholders and safe examples.

### Task E2: Artifact Schema Checks

**Purpose:** Make runtime index artifacts consistent before MCP exposes them.

**Planned files:**

- Create or modify: `src/runtime/schemas.mjs`
- Modify: relevant runtime modules
- Test: runtime and CLI fixtures

**Acceptance:**

- Index artifacts declare schema version and required top-level fields.
- Invalid artifacts fail cleanly with actionable messages.

## Implementation Order

1. Add this plan and commit it.
2. Implement symbol outline index preview with tests and docs.
3. Add MCP index status/search over existing runtime artifacts.
4. Add dependency inventory index preview.
5. Add route/API/data hint index preview.
6. Add backend/security MCP prompts that use the new capability pack.
7. Add workflow run-preview and first recipe expansions.
8. Add devops capability pack.
9. Add frontend quality capability pack.
10. Add data/documentation capability pack.
11. Add public doc leak validation.
12. Re-run full verification and summarize remaining gaps.

## Verification Per Batch

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- targeted CLI/MCP/runtime tests for changed behavior
- `git diff --check`

## Non-goals For This Batch

- No default embeddings.
- No network vulnerability lookups.
- No automatic code edits through MCP.
- No automatic promotion from runtime to memory.
- No broad stack-specific skill sprawl.
- No raw upstream reference dumps in public docs.
