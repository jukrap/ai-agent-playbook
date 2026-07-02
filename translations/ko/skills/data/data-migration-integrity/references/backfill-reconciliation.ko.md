# Backfill Reconciliation

## Inventory

- Backfill source, target, key, partition, expected volume, time window, completion criteria.
- Batch plan: ordering, batch size, retry marker, rate limit, pause/resume, failure handling.
- Data quality: duplicate, null, missing key, deleted record, late-arriving data, status change, timezone boundary.
- Consumer: application reader, analytics model, dashboard, export, alert, downstream job.

## Review

- 실행 전에 success를 정의합니다: exact count, tolerated difference, sampled field, known exclusion.
- Backfill은 repeatable하거나 안전하게 idempotent해야 합니다.
- Batch job은 progress, skipped record, failed record, retry count를 볼 수 있어야 합니다.
- Reconciliation은 같은 grain과 time boundary에서 source와 target을 비교해야 합니다.
- Sampling은 random happy-path row만이 아니라 edge case를 포함해야 합니다.
- Data repair는 durable note 없이 historical anomaly를 숨기면 안 됩니다.

## Verification

- Partition과 중요 segment별 source vs target row count.
- Row-by-row comparison이 비싸면 checksum 또는 aggregate total.
- Boundary date, null, deleted/merged record, retry, high-value record sample.
- Analytics consumer가 결과에 의존하면 dashboard/report check.
- Remaining gap, rerun command, owner, follow-up monitor에 대한 handoff note.

## Stop Conditions

- Expected count 또는 completion criteria가 불명확합니다.
- Backfill을 안전하게 pause, resume, retry할 수 없습니다.
- Reconciliation이 서로 다른 grain 또는 time window를 비교합니다.
- Failed/skipped record가 조용히 무시됩니다.
