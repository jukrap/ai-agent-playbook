# Schema Migration Plan

Migration order, rollout compatibility, rollback planning을 위한 primary database skill입니다.

## Workflow

1. Owner, reader, writer, deployment order, expected volume, compatibility window, rollback need를 확인합니다.
2. 각 변경을 additive, compatible, destructive, backfill, constraint, index, seed, view, trigger, procedure 작업으로 분류합니다.
3. Expand/contract step, dual-read/write compatibility, lock scope, backfill batch, post-deploy check를 계획합니다.
4. 가능하면 migration dry run, before/after query, application compatibility check, rendered consumer check로 검증합니다.

## Reference

Expand/contract, backfill, rollback, destructive-change planning에는 `references/migration-order-and-rollback.md`를 읽습니다.

Lock scope, deployment window, batching, operational stop condition에는 `references/lock-and-deployment-window.md`를 읽습니다.
