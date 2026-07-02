# Harness OS v2 Data Analytics Depth Pack Plan

> **For implementers:** Continue after the AI harness governance prompt slice. The current `data` category has useful broad skills, but it is still thin for modern analytics, ingestion, quality, lineage, and retrieval-heavy systems.

**Goal:** Expand data guidance beyond generic pipeline/report review into first-class capability skills for data contracts and lineage, data quality observability, analytics instrumentation/experiments, and retrieval/knowledge ingestion pipelines.

**Reference inputs:** The refreshed local reference inventory shows recurring patterns around workflow-node data contracts, credential indirection, SQL agents, document loaders, structured output parsers, vector/retrieval stores, data quality tests, visual/report QA, and generated evidence ledgers. Adopt these as local capabilities and validation rules. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Skill catalog currently has 66 skills.
- The `data` category has 3 skills: `data-pipeline-review`, `analytics-reporting-review`, and `data-migration-integrity`.
- The `database` category now covers schema, query performance, and constraint integrity; data skills should not duplicate those database responsibilities.
- Existing workflow support has `data-integrity-review`, but it does not yet distinguish contracts, lineage, observability, instrumentation, experiments, or retrieval pipelines.
- MCP prompts include `data_integrity_review`; they do not yet route data pipeline, analytics instrumentation, or retrieval/knowledge ingestion reviews as first-class briefs.

## Reference-Derived Rules To Adopt

- **Separate storage from data product behavior:** Database schema safety is not the same as dataset grain, lineage, freshness, metric ownership, or consumer contract safety.
- **Make data grain explicit:** Every dataset, metric, report, event, document chunk, and vector record needs grain, owner, source, freshness, and caveat rules.
- **Keep credentials indirect:** Data sources, warehouses, APIs, BI tools, vector stores, and document loaders should be referenced by configuration or environment names, not secrets or private URLs.
- **Treat generated evidence as provisional:** Sample rows, query outputs, index summaries, and retrieval matches support decisions but do not become trusted memory without review.
- **Prefer bounded checks:** Quality checks should state scope, sample size, reconciliation window, null/duplicate/orphan rules, and freshness thresholds.
- **Avoid default network providers:** Embedding, vector, warehouse, and BI provider integrations remain opt-in and documented with privacy, cost, and invalidation rules.

## Workstream A: Data Contract And Lineage

### Task A1: Data Contract Lineage Review Skill

**Candidate skill:** `data/data-contract-lineage-review`

**References:**

- `dataset-contract-checks.md`
- `lineage-and-consumer-impact.md`

**Coverage:**

- Dataset grain, owner, source of truth, freshness target, schema shape, partition/window, consumer list, caveats, and retention.
- Event schemas, warehouse tables, marts, export files, BI datasets, workflow-node payloads, and API-ingested records.
- Lineage from producer to transformation to consumer, including report/dashboard/export/API consumers.

**Acceptance:**

- Skill routes contract and lineage work away from generic pipeline review.
- References include owner/grain/freshness/consumer checklist and stale-contract handling.
- Docs and translations list the new skill under the `data` map.

## Workstream B: Data Quality Observability

### Task B1: Data Quality Observability Skill

**Candidate skill:** `data/data-quality-observability`

**References:**

- `quality-check-design.md`
- `freshness-anomaly-and-alerts.md`

**Coverage:**

- Null, duplicate, orphan, range, enum, referential, volume, distribution, freshness, completeness, and drift checks.
- Batch job, stream, import/export, dashboard source, and warehouse quality signals.
- Alert thresholds, owner handoff, known caveats, quarantine/repair path, and incident worklog.

**Acceptance:**

- Skill avoids pretending to run warehouse checks by itself; it defines evidence to request and verify.
- References separate source checks, transformation checks, consumer checks, and alert checks.
- `data-integrity-review` recipe can point to this skill for quality-heavy work.

## Workstream C: Analytics Instrumentation And Experiments

### Task C1: Analytics Instrumentation Review Skill

**Candidate skill:** `data/analytics-instrumentation-review`

**References:**

- `event-tracking-plan.md`
- `funnel-cohort-experiment-checks.md`

**Coverage:**

- Tracking plan, event names, properties, identity stitching, session/device/user/account grain, funnels, cohorts, A/B tests, attribution, sampling, consent, and privacy caveats.
- Client/server event boundaries, retry/dedup behavior, offline/mobile event handling, and dashboard downstream consumers.

**Acceptance:**

- Skill stays separate from frontend state/data flow and backend connector work.
- References require event ownership, naming convention, sample payloads, privacy review, and downstream metric impact.
- Future MCP prompt can route instrumentation reviews through route/API hints, operator search, and data-integrity review.

## Workstream D: Retrieval And Knowledge Ingestion

### Task D1: Knowledge Retrieval Pipeline Review Skill

**Candidate skill:** `data/knowledge-retrieval-pipeline-review`

**References:**

- `document-ingestion-and-chunking.md`
- `retrieval-evaluation-and-safety.md`

**Coverage:**

- Document loaders, parsing, chunking, metadata, deduplication, source freshness, access control, embedding/vector store boundaries, retrieval evaluation, and citation handoff.
- RAG or search-backed features where data freshness, permissions, and retrieval quality matter.

**Acceptance:**

- Skill states that embedding/vector providers are optional and disabled by default in the harness.
- References require source provenance, access controls, invalidation, evaluation set, hallucination/citation checks, and stale-index handling.
- Runtime/cache guidance links to `runtime-index-cache-design` when generated indexes are involved.

## Workstream E: Workflow And MCP Follow-Up

### Task E1: Data Integrity Recipe Expansion

**Candidate recipe update:** `data-integrity-review`

**Acceptance:**

- Inputs include dataset grain, contract owner, lineage scope, freshness target, quality dimensions, event/retrieval scope when relevant, and consumer list.
- Skills include the new data contract, quality observability, instrumentation, and retrieval pipeline skills when implemented.
- Verification covers source counts, sampled rows, quality checks, reconciliation queries, lineage/consumer impact, event payload samples, retrieval evaluation, and freshness caveats.

### Task E2: Data Pipeline Review Prompt

**Candidate prompt:** `data_pipeline_review`

**Acceptance:**

- Prompt remains read-only.
- Prompt routes through `workflow_run_preview` with recipe `data-integrity-review`, `operator_search`, `operator_map`, `route_api_hints`, `dependency_inventory`, `index_status`, `canon_check`, and `write_gate_preview`.
- Prompt asks whether the work is a contract/lineage review, quality observability review, reporting review, migration integrity review, instrumentation review, or retrieval ingestion review.

## Workstream F: Docs, Tests, And Catalog

**Acceptance:**

- README skill list and category summaries include the new data skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the data depth map.
- Korean translations are updated in the same change.
- Skill count expectations are updated from 66 to 70 if all four skills are implemented in one slice.
- Catalog remains warning-free.

## Workstream G: Verification

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
2. Add `data-contract-lineage-review` and `data-quality-observability` first, because they support every downstream data workflow.
3. Add `analytics-instrumentation-review` and `knowledge-retrieval-pipeline-review` with references and translations.
4. Update README, classification, taxonomy docs, and skill-count tests.
5. Expand `data-integrity-review` recipe and smoke coverage.
6. Add `data_pipeline_review` MCP prompt and prompt contract tests.
7. Re-run full verification and decide whether the next surface is documentation artifacts, project-management workflows, or managed-write tier implementation.

## Non-Goals

- No default warehouse, BI, embedding, vector, or network provider integration.
- No secrets, private connection strings, raw query outputs, or private source paths in public docs.
- No automatic promotion from sampled/generated data evidence into durable memory.
- No replacement for database schema migration and SQL performance skills.
