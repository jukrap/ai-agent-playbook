---
name: query-performance-review
description: Use when reviewing slow SQL, reporting queries, dashboard queries, API list/detail queries, exports, aggregates, joins, sort/pagination, full scans, N+1 patterns, or index choices.
---

# Query Performance Review

Use this as the primary database skill for SQL/query performance and rendered consumer checks.

## Workflow

1. Identify the query, caller, consumer, representative parameters, expected row count, timeout budget, and correctness requirements.
2. Gather available evidence: explain plan, indexes, filters, joins, sort/pagination, aggregates, N+1 behavior, cache behavior, and rendered output.
3. Propose the smallest safe change: query rewrite, index, pagination, pre-aggregation, projection reduction, batching, or consumer-level change.
4. Verify with explain/estimate, before/after query results, application behavior, report/export/dashboard output, and project-defined performance checks.

## Reference

Read `references/query-plan-and-index-checks.md` for plan, index, cardinality, and query-shape checks.

Read `references/reporting-query-cost-controls.md` for dashboard, export, reporting, and data-source consumer checks.
