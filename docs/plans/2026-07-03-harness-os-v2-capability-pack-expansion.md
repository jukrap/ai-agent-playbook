# Harness OS v2 Capability Pack Expansion Plan

> **For implementers:** Continue after workflow/prompt/config/public-validation/runtime-history hardening. This plan expands the skill surface while keeping the v2 taxonomy capability-first and reference-noise-free.

**Goal:** Fill the broad engineering gaps that remain after the backend/security/runtime work: devops and release safety, frontend quality, data integrity, analytics, and durable documentation handoff.

**Reference inputs:** The local reference inventory currently has strong signals across skills, workflows, MCP surfaces, hooks, runtime indexes, security validation, compliance checks, tests, and documentation. Adopt the recurring patterns as local skills and references. Do not copy raw upstream prose, project names, internal paths, or large source excerpts into public docs or prompts.

## Baseline

- The v2 taxonomy already separates capability categories from stack profiles.
- Backend, database, security, delivery, quality, project, legacy, mobile, and AI-harness skills exist.
- Existing workflow recipes cover onboarding, feature delivery, legacy changes, backend contracts, database migrations, CI triage, security audit, frontend polish, mobile release, documentation package, and harness extension.
- Runtime evidence now includes index previews, workflow run preview, write-gate advisory/post-check, canon promotion gates, config preview, public-doc hygiene checks, artifact schema checks, and capability-history preview.

## Reference-Derived Rules To Adopt

- **Capability first:** Primary skills should describe a problem space, not a vendor or stack.
- **Trigger concise, procedure rich:** `SKILL.md` stays short and trigger-focused; reusable detail goes into one-level references.
- **Evidence first:** Skills should name expected evidence, stop conditions, and verification rather than promising broad expertise.
- **No hidden writes:** Any scaffold/apply behavior must be documented separately from read-only review guidance.
- **Operational rollback:** Release, deployment, migration, and incident guidance must include rollback or containment checks.
- **Portable notes:** Do not store machine-local paths, upstream branding, internal URLs, credentials, branch names, or PR numbers in public docs.

## Workstream A: Devops And Release Pack

### Task A1: Container Change Safety

**Skill:** `devops/container-change-safety`

**References:**

- `container-image-change.md`
- `compose-kubernetes-change.md`

**Coverage:**

- Dockerfile base image and layer risk.
- Compose/Kubernetes service, env, volume, network, healthcheck, and resource changes.
- Build context, secret mount, cache, and artifact boundary checks.
- Rollback, smoke test, and runtime log verification.

### Task A2: Deployment Release Check

**Skill:** `devops/deployment-release-check`

**References:**

- `release-gates.md`
- `rollback-readiness.md`

**Coverage:**

- CI status, package/build artifact, migration, config, feature flag, and release note gates.
- Rollback ownership, previous artifact availability, and post-deploy verification.
- Version, tag, changelog, and package dry-run checks where the project supports them.

### Task A3: Observability Incident Triage

**Skill:** `devops/observability-incident-triage`

**References:**

- `incident-evidence.md`
- `logs-metrics-traces.md`

**Coverage:**

- Symptoms, blast radius, recent changes, logs, metrics, traces, queues, jobs, and dependency status.
- Mitigation before root-cause depth when user impact is active.
- Follow-up worklog and durable runbook promotion.

## Workstream B: Frontend Quality Pack

### Task B1: Frontend State And Data Flow

**Skill:** `frontend/frontend-state-data-flow`

**References:**

- `state-ownership.md`
- `server-client-cache-boundaries.md`

**Coverage:**

- State ownership, derived state, server cache, optimistic updates, stale data, invalidation, and URL state.
- Loading, empty, error, retry, race, and cancellation paths.
- Framework-agnostic guidance with stack-specific notes in references only when needed.

### Task B2: Frontend Accessibility Review

**Skill:** `frontend/frontend-accessibility-review`

**References:**

- `keyboard-focus-review.md`
- `semantic-interaction-review.md`

**Coverage:**

- Keyboard paths, focus order, focus traps, dialog/menu/listbox semantics, form errors, labels, and announcements.
- Color contrast and reduced motion as review points, without turning the skill into visual style guidance.

### Task B3: Visual Regression QA

**Skill:** `frontend/visual-regression-qa`

**References:**

- `visual-snapshot-checks.md`
- `responsive-overflow-checks.md`

**Coverage:**

- Desktop/mobile viewport checks, screenshot diffs, overflow, clipping, font-size consistency, and dynamic text states.
- Browser verification and artifact naming without assuming one test runner.

## Workstream C: Data And Documentation Pack

### Task C1: Analytics Reporting Review

**Skill:** `data/analytics-reporting-review`

**References:**

- `metric-definition-review.md`
- `dashboard-report-review.md`

**Coverage:**

- Metric definitions, grain, filters, denominators, source freshness, segmentation, and chart/table consistency.
- Report caveats and evidence boundaries.

### Task C2: Data Migration Integrity

**Skill:** `data/data-migration-integrity`

**References:**

- `migration-integrity-checks.md`
- `backfill-reconciliation.md`

**Coverage:**

- Backfill, idempotency, batching, locks, rollback, reconciliation queries, and sampling.
- Separates application migration from analytics/warehouse migration when necessary.

### Task C3: ADR Spec Handoff

**Skill:** `project/adr-spec-handoff`

**References:**

- `adr-decision-capture.md`
- `spec-worklog-promotion.md`

**Coverage:**

- Turn important decisions, constraints, and completed milestones into durable ADR/spec/worklog material.
- Preserve what changed and why without copying chat transcripts or raw reference text.

## Workstream D: Workflow And Catalog Follow-Through

### Task D1: Recipe Coverage Review

**Purpose:** Decide whether existing recipes are enough for the new packs or whether to add narrowly scoped recipes.

**Candidate recipes:**

- `deployment-release`
- `frontend-quality-review`
- `data-integrity-review`

**Acceptance:**

- Add recipes only if they describe repeatable multi-step runs, not simple skill invocation.
- Each recipe lists inputs, outputs, skills, tools, stop conditions, and verification.

### Task D2: Taxonomy And Translation Checks

**Purpose:** Keep capability pack additions installable and discoverable.

**Acceptance:**

- New skills pass frontmatter and one-level reference validation.
- Korean translations are added in the same change.
- `catalog check` reports the expected skill count and no wrapper drift.
- Packaging and public-doc hygiene checks stay green.

## Implementation Order

1. Add and commit this plan.
2. Implement Devops And Release Pack.
3. Validate, translate, and commit Devops And Release Pack.
4. Implement Frontend Quality Pack.
5. Validate, translate, and commit Frontend Quality Pack.
6. Implement Data And Documentation Pack.
7. Validate, translate, and commit Data And Documentation Pack.
8. Review workflow recipe coverage and add only the recipes that remove real ambiguity.
9. Run the full verification set and record remaining gaps.

## Verification Per Pack

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Non-Goals

- No default network scanning or telemetry.
- No vendor-specific primary skills.
- No raw reference dumps in public docs.
- No MCP project-write expansion in this batch.
- No automatic memory promotion.
