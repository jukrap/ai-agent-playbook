# Harness OS v2 Repo Ops Graph And Quality Gates Plan

> **For implementers:** Continue after the eval/witness/source-registry runtime schema and MCP reader surface. Keep each batch reviewable, verified, translated, and committed.

**Goal:** Turn the current runtime indexes into a higher-level repo intelligence layer and add operational quality gates for CI, release, security, compliance, and evidence locator integrity. The harness should help an agent answer "what is connected?", "what evidence proves this?", and "what gate must pass before this change ships?" without writing project source files or trusting generated summaries as durable memory.

**Reference inputs:** Local reference collections repeatedly show four useful patterns: graph-shaped repo understanding, source locator contracts, CI/release gate discipline, and security/compliance checks that stay separate from implementation edits. Adopt those patterns as local schemas, runtime reports, MCP read tools, workflow recipes, and skills. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Runtime indexes already provide file inventory, symbol outline, dependency inventory, route/API/data hints, capability history, schema checks, and generic runtime artifact validation.
- MCP exposes read-only catalog, layout, index, runtime schema-check, operator, contract, managed-state, QA, and LSP/AST analysis tools.
- Skills cover many domains, but operational gates are still distributed across CI triage, release readiness, security review, and package/dependency checks.
- Generated evidence can be validated, but evidence locator integrity is not first-class yet.
- Runtime artifacts exist independently, but there is no graph report that connects files, symbols, routes, packages, docs, contracts, workflows, and evidence records into one reviewable view.

## Design Principles

- **Graph is evidence, not truth:** Repo graph output stays under `.ai-playbook/runtime/` and names source indexes, scan range, timestamp, and confidence.
- **Locator before claim:** Any cited file, source, report, or registry item should be reopenable through a target-relative locator or a declared external source boundary.
- **Gate before ship:** CI, release, security, license, dependency, migration, and documentation gates should be explicit workflow steps with stop conditions.
- **No hidden writes:** Runtime graph and gate checks are read-only by default. Any future write uses existing `--apply`/write-gate patterns and remains inside managed playbook paths.
- **No network by default:** SBOM, CVE, registry, deployment, or remote issue tracker checks are modeled as optional source adapters, not default scans.
- **Promote intentionally:** Repo graph facts, locator checks, and gate results do not become memory maps or canon facts without review and promotion.

## Workstream A: Runtime Repo Graph

### Task A1: Repo Graph Builder

**Candidate runtime surface:** `graph preview <target>` and optional future `graph build <target> --apply`

**Purpose:** Combine existing runtime indexes into a compact graph report that shows relationships between files, symbols, routes, package manifests, contracts, rules, docs, and runtime evidence.

**Planned files:**

- Create: `src/runtime/repo-graph.mjs`
- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Behavior:**

- Default command is read-only preview.
- It can consume existing index artifacts when present, otherwise it may generate preview-only input by calling the read-only index builders.
- Output includes `schemaVersion`, `kind: runtime.repo-graph`, `target`, `mode`, `generatedAt`, `scanRange`, `sources`, `nodes`, `edges`, `summary`, `warnings`, `conflicts`.
- Nodes include `file`, `symbol`, `route`, `package`, `contract`, `rule`, `doc`, `runtime-report`, and `workflow` kinds.
- Edges include `contains`, `exports`, `mentions`, `defines-route`, `uses-package`, `covered-by-contract`, `related-doc`, and `evidence-for`.
- Each edge records source path, confidence, and source pattern.
- Graph is compact by default: cap output counts and report truncation in `summary`.

**Acceptance:**

- Works without writing files.
- Skips generated runtime folders as source inputs unless reading declared runtime index/report artifacts.
- Uses target-relative portable paths only.
- Does not infer ownership or architecture boundaries without source evidence.

### Task A2: Repo Graph Schema Validation

**Purpose:** Make repo graph artifacts eligible for runtime schema-check and future MCP inspection.

**Planned files:**

- Modify: `src/runtime/schemas.mjs`
- Modify: `test/runtime-schemas.test.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations

**Behavior:**

- Add `runtime.repo-graph` to known runtime schema kinds.
- Validate graph envelope fields, allowed node/edge kinds, portable paths, capped arrays, and evidence source references.
- Reject absolute paths, credential-looking values, and oversized inline text.

**Acceptance:**

- Valid graph fixture passes.
- Invalid edge kind, absolute path, and oversized evidence field fail.
- Generic runtime artifact validation stays backwards-compatible.

## Workstream B: Evidence Locator Integrity

### Task B1: Evidence Locator Contract

**Candidate skill/reference:** `ai-harness/evidence-locator-integrity`

**Purpose:** Teach agents to cite evidence that can be reopened, distinguish generated evidence from durable memory, and avoid structural or absence claims without scan ranges.

**Planned files:**

- Create skill: `skills/ai-harness/evidence-locator-integrity/SKILL.md`
- Create references:
  - `skills/ai-harness/evidence-locator-integrity/references/locator-contract.md`
  - `skills/ai-harness/evidence-locator-integrity/references/claim-scan-range-rules.md`
- Modify: `docs/classification.md`
- Modify matching Korean translations
- Test: skill validation and catalog check

**Coverage:**

- Path-range, symbol, runtime-artifact, source-registry, command-output, URL, issue, database, and manual-observation locator shapes.
- Required fields for scan range, freshness, source boundary, confidence, and caveats.
- Anti-patterns: "no usages found" without scan range, copied absolute local paths, secret-bearing evidence, uncapped excerpts, stale generated summaries.

**Acceptance:**

- Skill has concise trigger-focused frontmatter.
- References carry reusable details, not a long SKILL body.
- Catalog places it under `ai-harness` without adding a stack-specific primary skill.

### Task B2: Locator Check CLI

**Candidate CLI surface:** `evidence locator-check <target> --path <json-or-md>`

**Purpose:** Validate whether a runtime report, source registry entry, or markdown evidence note contains reopenable locators and safe source boundaries.

**Planned files:**

- Create: `src/runtime/evidence-locators.mjs`
- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/commands.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Read-only by default.
- Accepts target-relative JSON or Markdown.
- For JSON, validates known locator fields recursively.
- For Markdown, validates fenced evidence blocks or simple locator table rows if present.
- Reports missing scan range, non-portable path, credential-looking values, and unknown source boundary.

**Acceptance:**

- No file writes.
- Missing file and malformed JSON report safe conflicts without echoing absolute local paths.
- Markdown without locator blocks returns an advisory warning, not a hard failure.

## Workstream C: Operational Quality Gates

### Task C1: CI Quality Gate Skill And Recipe

**Candidate skill:** `delivery/ci-quality-gate`

**Candidate recipe:** `ci-quality-gate`

**Purpose:** Move from "fix the failing command" to a gate model: identify required checks, optional checks, skipped checks, failure owners, retry policy, and merge/release stop conditions.

**Coverage:**

- Lint/type/test/build/package/docs/translation/schema checks.
- Flake handling, retry limits, environment parity, dependency cache caveats, and artifact retention.
- Separating local reproduction from CI-only environment issues.

**Acceptance:**

- Recipe inputs include target branch, change type, required checks, optional checks, environment, artifacts, and owner.
- Outputs include gate summary, blocked checks, skipped checks, residual risks, and next verification commands.
- Prompt and workflow guidance require evidence before claiming CI is clean.

### Task C2: Release And Deployment Gate Skill

**Candidate skill:** `devops/release-deployment-gate`

**Purpose:** Strengthen deployment and release checks beyond package readiness by requiring artifact identity, rollback path, migration gates, configuration diff, monitoring hooks, and release notes status.

**Coverage:**

- Web/app/backend/package deployment.
- Feature flags, config/env changes, database migrations, background workers, queue consumers, cron jobs, observability, rollback, and post-release verification.
- Local-only boundaries for credentials and deployment endpoints.

**Acceptance:**

- Skill complements existing deployment/release skills without duplicating them.
- Reference defines release gate checklist and rollback evidence contract.
- Recipe or prompt routes through `dependency_inventory`, `diagnostics_check`, `operator_search`, `route_api_hints`, `runtime_schema_check`, `write_gate_preview`, and `canon_check` where relevant.

### Task C3: Security Compliance Gate Skill

**Candidate skill:** `security/security-compliance-gate`

**Purpose:** Add a gate for secrets, auth/access control, dependency/license notice, data exposure, generated artifacts, and runtime evidence safety before merging or publishing.

**Coverage:**

- Secret-like values, local absolute paths, private URLs, credential boundaries, license/notice files, dependency manifests, authz-sensitive routes, and generated report hygiene.
- No live vulnerability database calls by default; source adapters can be modeled later.

**Acceptance:**

- Skill routes to existing security, dependency, license, and runtime schema capabilities.
- Reference defines "block", "warn", and "document" severities.
- Validation guidance includes public-doc hygiene and translation coverage where relevant.

## Workstream D: MCP Reader Surface

### Task D1: Repo Graph And Locator MCP Tools

**Candidate MCP tools:**

- `repo_graph_preview`
- `evidence_locator_check`

**Purpose:** Let MCP-capable apps inspect graph and locator integrity without direct filesystem traversal.

**Acceptance:**

- Tools are read-only annotated.
- Tests prove tool listing, successful call, conflict call, and no-write behavior.
- No write-capable graph build or source rewrite is exposed.

### Task D2: Gate Review Prompts

**Candidate MCP prompts:**

- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`
- `repo_graph_review`

**Purpose:** Convert operational gates into reusable task briefs with required evidence, optional evidence, stop conditions, and verification expectations.

**Acceptance:**

- Prompt tests verify required tool names and stop conditions.
- Prompts do not include `apply: true`.
- Prompts route through existing read-only tools first, with `write_gate_preview` only for future write proposals.

## Workstream E: Documentation, Translation, And Validation

### Task E1: Runtime And Permission Docs

**Planned files:**

- `docs/harness-runtime.md`
- `docs/mcp-permission-model.md`
- `docs/commands.md`
- Matching Korean translations

**Acceptance:**

- Docs state graph and locator outputs are generated runtime evidence.
- Docs state MCP remains read-only.
- Docs distinguish runtime graph, memory maps, and canon promotion.

### Task E2: Validation Matrix

**Commands:**

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\validate-public-docs.ps1
node bin\ai-playbook.mjs catalog check --json
node bin\ai-playbook.mjs skills lint --json
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

**Acceptance:**

- Every committed batch includes targeted tests for changed behavior.
- Public docs contain no personal paths, credentials, internal URLs, noisy source labels, branch names, or PR numbers.
- Staged files match the intended batch before each commit.

## Initial Execution Order

1. Add this plan and Korean translation.
2. Implement repo graph preview over existing runtime index builders.
3. Add runtime repo-graph schema validation.
4. Add evidence locator skill and reference contract.
5. Add locator-check CLI.
6. Add MCP read tools for graph and locator checks.
7. Add CI quality gate skill and recipe.
8. Add release/deployment gate skill and reference.
9. Add security compliance gate skill and reference.
10. Add MCP gate review prompts and prompt contract tests.
11. Update docs, translations, validation scripts or schemas where needed.
12. Commit in small, verified batches.

## Explicit Non-Goals

- No MCP project-write tools.
- No automatic code rewrite, rename, migration, deployment, package publish, or remote issue update.
- No default network calls for CVE, package registry, deployment, analytics, or documentation crawling.
- No direct promotion of generated graph facts into `.ai-playbook/memory/`.
- No raw reference-project prose, branding, or large excerpts in public docs.
