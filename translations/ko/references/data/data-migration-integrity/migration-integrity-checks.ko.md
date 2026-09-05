# Migration Integrity Checks

## Inventory

- Change type: schema, data transform, backfill, denormalization, partition change, dedupe, repair, retention, warehouse model update.
- System: source database, target database, warehouse, cache, search index, queue, file export, downstream report.
- Runtime shape: online migration, offline job, dual write, read switch, shadow table, materialized view, scheduled batch.
- Safety: backup, rollback, lock risk, batch size, idempotency, retry, observability, owner.

## Review

- Destructive change 전에 additive compatible step을 우선합니다.
- Deploy가 atomic하지 않으면 rollout 중 old/new application version이 compatibility를 가져야 합니다.
- Data migration은 idempotent하거나 명확한 resume/retry marker가 있어야 합니다.
- Lock, long transaction, index build, foreign key, trigger, replication lag를 확인합니다.
- Default, nullability, constraint, generated column은 existing data review가 필요합니다.
- Destructive change에는 backup/restore 또는 compensating repair plan이 필요합니다.

## Verification

- 지원되는 경우 dry-run 또는 migration plan output.
- Key segment, status, date partition별 before/after row count.
- Migration 이후 constraint와 null check.
- Old/new reader/writer에 대한 application compatibility check.
- Error rate, latency, queue lag, data freshness에 대한 post-migration monitor.

## Stop Conditions

- Rollback이 previous value를 추측해야 합니다.
- Migration이 resume 또는 repair strategy 없이 partially apply될 수 있습니다.
- 예상 data volume에서 lock 또는 runtime impact가 불명확합니다.
- Downstream report 또는 integration이 old shape에 의존하는데 확인되지 않았습니다.
