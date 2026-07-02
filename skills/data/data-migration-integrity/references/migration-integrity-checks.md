# Migration Integrity Checks

## Inventory

- Change type: schema, data transform, backfill, denormalization, partition change, dedupe, repair, retention, or warehouse model update.
- Systems: source database, target database, warehouse, cache, search index, queue, file export, and downstream report.
- Runtime shape: online migration, offline job, dual write, read switch, shadow table, materialized view, or scheduled batch.
- Safety: backup, rollback, lock risk, batch size, idempotency, retry, observability, and owner.

## Review

- Prefer additive compatible steps before destructive changes.
- Old and new application versions should be compatible during rollout when deploys are not atomic.
- Data migrations should be idempotent or have clear resume/retry markers.
- Check locks, long transactions, index builds, foreign keys, triggers, and replication lag.
- Defaults, nullability, constraints, and generated columns need existing data review.
- Destructive changes need backup/restore or a compensating repair plan.

## Verification

- Dry-run or migration plan output when supported.
- Before/after row counts by key segment, status, and date partition.
- Constraint and null checks after migration.
- Application compatibility checks for old and new readers/writers.
- Post-migration monitor for error rate, latency, queue lag, and data freshness.

## Stop Conditions

- Rollback requires guessing previous values.
- Migration can partially apply without resume or repair strategy.
- Lock or runtime impact is unknown for the expected data volume.
- Downstream reports or integrations depend on the old shape and have not been checked.
