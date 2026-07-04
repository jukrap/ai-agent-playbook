---
name: data-quality-observability
description: Use when designing or reviewing data quality checks, freshness alerts, anomaly detection, null/duplicate/orphan checks, quarantine, repair, or data incident handoff.
---

# Data Quality Observability

Use this as the primary data skill for quality checks, freshness signals, alerts, and data incident handoff.

## Workflow

1. Identify data source, transformation boundary, dataset grain, quality dimensions, owner, consumers, and freshness or SLA expectations.
2. Choose bounded checks for nulls, duplicates, orphans, ranges, enums, referential integrity, volume, drift, completeness, and freshness.
3. Define alert threshold, run cadence, sample window, quarantine/repair path, and owner handoff.
4. Verify with source counts, sampled rows, reconciliation queries, historical baselines, and alert evidence when possible.

## Reference

Read `references/quality-check-design.md` for source, transform, consumer, and repair check design.

Read `references/freshness-anomaly-and-alerts.md` for freshness, anomaly, threshold, alert, and incident handoff checks.
