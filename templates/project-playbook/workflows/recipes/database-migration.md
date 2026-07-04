# Database Migration

Inputs: schema delta, data volume, lock budget, compatibility window, rollback path, backfill plan, owner, dependent services, reporting consumers.

Outputs: migration plan, expand/contract rollout notes, risk note, verification query list, rollback note, rendered consumer check notes, post-deploy monitor notes.

Skills: database change safety, schema migration plan, query performance review, data integrity constraints, backend contract boundary when application contracts change, data migration integrity for warehouse or cross-system moves, legacy risk check when applicable.

Tools: `operator search`, `operator map`, `operator preflight`, `route API hints`, `contracts check`, `workflow run-preview`, `write-gate preview`.

Stop conditions: unknown production data shape, unknown lock impact, no rollback path for destructive change, unbounded backfill, unreviewed destructive cleanup, unknown report/export/dashboard consumer impact, credentials or secrets appear in reusable docs.

Verification: migration dry run, explain or estimate for heavy DDL/query work, before/after query checks, duplicate/orphan/null reconciliation checks, application compatibility checks, rendered report/export/dashboard checks, post-deploy monitoring or owner handoff.
