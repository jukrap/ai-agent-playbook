---
name: data-pipeline-review
description: Use when reviewing analytics pipelines, ETL jobs, batch processing, data contracts, quality checks, dashboards, or reporting datasets.
---

# Data Pipeline Review

pipeline과 analytics reliability를 위한 primary data skill입니다.

## Workflow

1. source system, transformation step, schedule, ownership, consumer, freshness expectation을 확인합니다.
2. schema drift, null handling, dedupe, late-arriving data, idempotency, backfill, metric definition을 확인합니다.
3. source-of-truth data와 derived report/generated artifact를 분리합니다.
4. 가능하면 row count, reconciliation query, sample record, dashboard check로 검증합니다.

