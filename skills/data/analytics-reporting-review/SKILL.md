---
name: analytics-reporting-review
description: Use when reviewing metrics, dashboards, reports, KPI definitions, chart/table consistency, analytics queries, segmentation, freshness, or reporting caveats.
---

# Analytics Reporting Review

Use this as the primary data skill for metrics, dashboards, and report correctness.

## Workflow

1. Identify the business question, metric owner, source tables, grain, filters, time window, denominator, and consumer.
2. Check metric definition, query logic, joins, exclusions, null handling, segmentation, freshness, and chart/table consistency.
3. Separate source data issues from transformation/reporting issues and presentation caveats.
4. Verify with source counts, reconciliation queries, sampled rows, and report/dashboard checks when possible.

## Reference

Read `references/metric-definition-review.md` for metric, grain, denominator, and query definition checks.

Read `references/dashboard-report-review.md` for chart/table consistency, caveats, freshness, and reader handoff.
