---
name: data-quality-observability
description: Use when designing or reviewing data quality checks, freshness alerts, anomaly detection, null/duplicate/orphan checks, quarantine, repair, or data incident handoff.
---

# Data Quality Observability

Quality check, freshness signal, alert, data incident handoff를 위한 primary data skill입니다.

## Workflow

1. data source, transformation boundary, dataset grain, quality dimension, owner, consumer, freshness 또는 SLA expectation을 확인합니다.
2. null, duplicate, orphan, range, enum, referential integrity, volume, drift, completeness, freshness에 대한 bounded check를 선택합니다.
3. alert threshold, run cadence, sample window, quarantine/repair path, owner handoff를 정의합니다.
4. 가능하면 source count, sampled row, reconciliation query, historical baseline, alert evidence로 검증합니다.

## Reference

source, transform, consumer, repair check design은 `references/quality-check-design.md`를 읽습니다.

freshness, anomaly, threshold, alert, incident handoff check는 `references/freshness-anomaly-and-alerts.md`를 읽습니다.
