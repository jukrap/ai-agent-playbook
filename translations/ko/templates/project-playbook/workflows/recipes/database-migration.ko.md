# Database Migration

Inputs: schema delta, data volume, lock budget, compatibility window, rollback path, backfill plan, owner, dependent services, reporting consumers.

Outputs: migration plan, expand/contract rollout notes, risk note, verification query list, rollback note, rendered consumer check notes, post-deploy monitor notes.

Skills: database change safety, schema migration plan, query performance review, data integrity constraints, application contract가 바뀌면 backend contract boundary, warehouse 또는 cross-system move에는 data migration integrity, 필요 시 legacy risk check.

Tools: `operator search`, `operator map`, `operator preflight`, `route API hints`, `contracts check`, `workflow run-preview`, `write-gate preview`.

Stop conditions: 알 수 없는 production data shape, unknown lock impact, destructive change rollback path 없음, unbounded backfill, unreviewed destructive cleanup, 알 수 없는 report/export/dashboard consumer impact, reusable docs에 credential 또는 secret이 나타남.

Verification: migration dry run, heavy DDL/query work에 대한 explain 또는 estimate, before/after query check, duplicate/orphan/null reconciliation check, application compatibility check, rendered report/export/dashboard check, post-deploy monitoring 또는 owner handoff.
