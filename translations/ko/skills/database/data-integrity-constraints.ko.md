# Data Integrity Constraints

Data invariant를 enforce, repair, review하기 위한 primary database skill입니다.

## Workflow

1. Invariant, owner, current enforcement layer, affected data, caller, report, job, repair/rollback need를 확인합니다.
2. 새 constraint나 trigger를 enforce하기 전에 existing violation을 확인합니다.
3. Rule을 강화하기 전에 repair, backfill, dedupe, orphan cleanup, partial rollout, application compatibility를 계획합니다.
4. 가능하면 reconciliation query, before/after count, negative case, app behavior, post-deploy monitoring으로 검증합니다.

## Reference

Database-enforced invariant와 routine safety에는 `references/constraint-trigger-procedure-checks.md`를 읽습니다.

Repair, dedupe, orphan, backfill verification에는 `references/reconciliation-and-backfill-checks.md`를 읽습니다.
