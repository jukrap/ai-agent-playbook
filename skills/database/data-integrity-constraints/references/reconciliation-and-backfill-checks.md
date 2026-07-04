# Reconciliation And Backfill Checks

Use this when data must be repaired, deduplicated, reconciled, backfilled, or verified after a migration or rule change.

## Repair Plan

- Define the source of truth for each field or relationship being repaired.
- Make repair scripts idempotent and restartable. Record batch key, checkpoint, retry behavior, and skip rules.
- Keep destructive cleanup separate from detection and repair.
- Use temp files, generated reports, or runtime output only for evidence; do not promote them into durable memory without review.

## Reconciliation Queries

- Before count: total affected rows and grouped violation counts.
- Repair count: rows changed, skipped, failed, or requiring manual review.
- After count: remaining duplicates, orphans, nulls, invalid ranges, invalid statuses, and mismatched totals.
- Consumer count: representative API, report, dashboard, export, or job output when data shape affects user-visible behavior.

## Backfill Safety

- Prefer deterministic ordering and bounded batches.
- Avoid mixing schema changes, repair logic, and destructive cleanup in one irreversible step.
- Record how the backfill can be paused, resumed, retried, or rolled back.
- Watch for locks, replication lag, queue backlog, and report refresh timing when available.

## Stop Conditions

- The source of truth is unclear or contested.
- The repair script is not idempotent.
- A backfill has no checkpoint or expected volume.
- Reconciliation output cannot distinguish fixed, skipped, failed, and still-invalid rows.
