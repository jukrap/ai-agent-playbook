# Reconciliation And Backfill Checks

Migration 또는 rule change 뒤 data를 repair, deduplicate, reconcile, backfill, verify해야 할 때 사용합니다.

## Repair Plan

- Repair 대상 field 또는 relationship마다 source of truth를 정의합니다.
- Repair script는 idempotent하고 restartable하게 만듭니다. Batch key, checkpoint, retry behavior, skip rule을 기록합니다.
- Destructive cleanup은 detection과 repair에서 분리합니다.
- Temp file, generated report, runtime output은 evidence로만 사용합니다. 검토 없이 durable memory로 승격하지 않습니다.

## Reconciliation Queries

- Before count: total affected rows와 grouped violation count.
- Repair count: changed, skipped, failed, manual review가 필요한 row.
- After count: remaining duplicate, orphan, null, invalid range, invalid status, mismatched total.
- Consumer count: data shape가 user-visible behavior에 영향을 주면 대표 API, report, dashboard, export, job output.

## Backfill Safety

- Deterministic ordering과 bounded batch를 우선합니다.
- Schema change, repair logic, destructive cleanup을 하나의 irreversible step에 섞지 않습니다.
- Backfill을 pause, resume, retry, rollback하는 방식을 기록합니다.
- 가능하면 lock, replication lag, queue backlog, report refresh timing을 관찰합니다.

## Stop Conditions

- Source of truth가 불명확하거나 합의되지 않았습니다.
- Repair script가 idempotent하지 않습니다.
- Backfill에 checkpoint 또는 expected volume이 없습니다.
- Reconciliation output이 fixed, skipped, failed, still-invalid row를 구분하지 못합니다.
