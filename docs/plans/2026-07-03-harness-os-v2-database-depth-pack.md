# Harness OS v2 Database Depth Pack Plan

> **For implementers:** Continue after the architecture boundary pack. This plan covers the next weak catalog surface: database currently has one broad change-safety skill and one migration recipe, while the reference inventory shows richer patterns around migration order, credential handling, read-only estimates, reporting queries, connector syncs, and reconciliation.

**Goal:** Add capability-first database guidance for schema migration planning, query performance review, and data integrity constraints without making any DBMS, ORM, migration tool, reporting platform, or warehouse the primary taxonomy axis.

**Reference inputs:** The refreshed local reference inventory shows repeatable database practices around dry-run first execution, env/file credential indirection, connector/job status checks, destructive-operation confirmation, SQL field verification, reporting query pitfalls, and reconciliation evidence. Adopt those patterns as local skills and references. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Skill catalog contains 60 skills after the architecture boundary pack.
- The `database` category currently has only `database/database-change-safety`.
- The existing `database-migration` recipe is useful but too thin for production-style schema, lock, backfill, query-plan, and reconciliation work.
- Data migration guidance exists under `data/data-migration-integrity`, but operational database work needs its own schema, SQL, and constraint-focused skills.

## Reference-Derived Rules To Adopt

- **Read before write:** Prefer inventory, schema inspection, migration dry-run, explain plan, sample query, and estimated impact before proposing writes.
- **Separate generated output from trusted memory:** Query reports, runtime index hints, connector status, and dry-run output are evidence candidates until reviewed.
- **Protect credentials:** Use env/file indirection and never place plaintext secrets in reusable docs, temp configs, worklogs, or reports.
- **Classify database changes:** Additive compatible changes, backfills, constraints, index changes, destructive changes, and reporting-only query changes have different deployment and rollback paths.
- **Confirm destructive operations:** Drops, deletes, truncates, reindex/full re-embed, and irreversible migrations require explicit confirmation, rollback notes, and evidence capture.
- **Verify rendered consumers:** Reporting queries, dashboards, exports, API DTOs, and background jobs can be broken by schema or SQL changes even when the migration succeeds.

## Workstream A: Schema Migration Planning

### Task A1: Schema Migration Plan Skill

**Skill:** `database/schema-migration-plan`

**References:**

- `migration-order-and-rollback.md`
- `lock-and-deployment-window.md`

**Coverage:**

- Tables, columns, indexes, foreign keys, defaults, nullability, constraints, enum changes, stored procedures, triggers, views, and seed changes.
- Expand/contract migrations, dual-write/read compatibility, backfill ordering, lock scope, deployment windows, rollback notes, and post-deploy checks.
- Compatibility with ORMs, migration tools, direct SQL scripts, legacy schema files, and manual DBA-reviewed deployment flows.

## Workstream B: Query Performance Review

### Task B1: Query Performance Review Skill

**Skill:** `database/query-performance-review`

**References:**

- `query-plan-and-index-checks.md`
- `reporting-query-cost-controls.md`

**Coverage:**

- Slow queries, reporting SQL, dashboard queries, API list/detail queries, exports, aggregates, joins, sort/pagination, full scans, N+1 query patterns, and index selection.
- Explain plan evidence, representative parameters, row counts, cardinality, query timeout/cost limits, cache behavior, and rendered consumer checks.
- Safe performance iteration without inventing production metrics or running live destructive commands.

## Workstream C: Data Integrity Constraints

### Task C1: Data Integrity Constraints Skill

**Skill:** `database/data-integrity-constraints`

**References:**

- `constraint-trigger-procedure-checks.md`
- `reconciliation-and-backfill-checks.md`

**Coverage:**

- Unique, foreign key, check, not-null, exclusion, generated-column, trigger, stored procedure, scheduled repair, and application-level invariant changes.
- Duplicate detection, orphan detection, repair scripts, reconciliation queries, idempotent backfills, partial rollout, and rollback constraints.
- Separation between database-enforced invariants and application-only validation.

## Workstream D: Workflow And MCP Follow-Up

### Task D1: Database Migration Recipe Expansion

**Candidate recipe update:** `database-migration`

**Acceptance:**

- Inputs include volume, lock budget, compatibility window, rollback path, backfill plan, owner, dependent services, and reporting consumers.
- Stop conditions cover unknown data shape, unknown lock impact, missing rollback, unbounded backfill, and unreviewed destructive changes.
- Verification includes dry-run, explain/estimate, before/after queries, application compatibility, rendered report/export checks, and post-deploy monitoring.

### Task D2: Database Change Review Prompt

**Candidate prompt:** `database_change_review`

**Acceptance for a later slice:**

- Prompt remains read-only and routes through `workflow_run_preview`, `operator_search`, `operator_map`, `route_api_hints`, `write_gate_preview`, and existing index/search tools.
- Prompt asks for schema, query, migration, integrity, rollback, and consumer evidence before recommending a write.

## Workstream E: Docs, Tests, And Catalog

**Acceptance:**

- README skill list and category summaries include the new database skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the database depth map.
- Korean translations are updated in the same change.
- Skill count expectations are updated from 60 to 63.
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
2. Add `schema-migration-plan`, `query-performance-review`, and `data-integrity-constraints` skills with references and translations.
3. Update catalog docs and skill-count tests, then commit the database skill pack.
4. Expand `database-migration` workflow recipe and smoke coverage.
5. Add `database_change_review` MCP prompt and prompt contract tests.
6. Re-run full verification and select the next weak surface, likely AI-harness extension governance or deeper runtime index/report promotion.

## Non-Goals

- No DBMS-specific primary taxonomy such as Postgres-first, MySQL-first, Oracle-first, Mongo-first, or warehouse-first skills.
- No live database mutation through MCP.
- No secret collection or credential storage inside reusable docs.
- No automatic production migration execution, reindex, truncate, delete, or drop.
