# Backfill Reconciliation

## Inventory

- Backfill source, target, key, partition, expected volume, time window, and completion criteria.
- Batch plan: ordering, batch size, retry marker, rate limit, pause/resume, and failure handling.
- Data quality: duplicates, nulls, missing keys, deleted records, late-arriving data, status changes, and timezone boundaries.
- Consumers: application readers, analytics models, dashboards, exports, alerts, and downstream jobs.

## Review

- Define success before running: exact counts, tolerated differences, sampled fields, and known exclusions.
- Backfills should be repeatable or safely idempotent.
- Batch jobs need visibility into progress, skipped records, failed records, and retry counts.
- Reconciliation should compare source and target at the same grain and time boundary.
- Sampling should include edge cases, not only random happy-path rows.
- Data repair should avoid hiding historical anomalies without a durable note.

## Verification

- Source vs target row counts by partition and important segment.
- Checksums or aggregate totals when row-by-row comparison is too expensive.
- Samples for boundary dates, nulls, deleted/merged records, retries, and high-value records.
- Dashboard/report checks when analytics consumers depend on the result.
- Handoff note for remaining gaps, rerun command, owner, and follow-up monitor.

## Stop Conditions

- Expected count or completion criteria is unknown.
- Backfill cannot be paused, resumed, or retried safely.
- Reconciliation compares different grains or time windows.
- Failed/skipped records would be silently ignored.
