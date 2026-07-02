# Data Migration Integrity

Migration과 backfill correctness를 위한 primary data skill입니다.

## Workflow

1. Source/target dataset, ownership, volume, write path, reader, schedule, migration order, rollback 또는 repair path를 확인합니다.
2. 변경을 schema migration, backfill, transform, reconciliation, data repair, warehouse/reporting migration으로 분류합니다.
3. Idempotency, batching, locking, constraint, late data, duplicate, partial failure, old/new code compatibility를 확인합니다.
4. 가능한 경우 dry run, before/after count, reconciliation query, sample, post-migration monitor로 검증합니다.

## Reference

Migration planning, idempotency, compatibility, locking, rollback check에는 `references/migration-integrity-checks.md`를 읽습니다.

Backfill, sampling, count, reconciliation query, data repair handoff에는 `references/backfill-reconciliation.md`를 읽습니다.
