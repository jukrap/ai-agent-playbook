# Database Change Review Matrix

Use this reference when a database change is broader than a single safe additive migration or when the blast radius is unclear.

## Scope Map

Identify each affected surface before editing:

- Tables, columns, indexes, constraints, views, triggers, stored procedures, functions, sequences, seed data, and scheduled jobs.
- Application readers and writers, batch jobs, reports, exports, dashboards, search indexes, caches, and external consumers.
- Data owner, operational owner, rollback owner, approval path, expected row count, and peak write/read traffic.
- Deployment shape: single deploy, rolling deploy, blue/green, multi-service overlap, mobile/client version overlap, or manual DBA execution.

## Change Classes

- Additive: nullable column, optional table, non-blocking index, new view, optional seed row.
- Compatibility-sensitive: rename, type change, enum/domain change, non-null default, unique constraint, foreign key, generated column, routine signature, trigger behavior.
- Destructive: drop, delete, truncate, irreversible rewrite, lossy transform, cleanup after migration.
- Backfill: any existing-row update, reconciliation, dedupe, derived-field recompute, or external-source repair.
- Reporting-sensitive: query, view, stored procedure, export, mart, dashboard, or metric change that can silently alter numbers.

## Expand/Contract Sequence

- Expand first: add new structures while old readers and writers still work.
- Dual-read or dual-write only when the project has a clear consistency, replay, and rollback strategy.
- Backfill with an ordering key, batch size, resume marker, retry behavior, and progress query.
- Move application reads and writes after the intermediate schema supports both old and new versions.
- Contract later: remove old columns, views, routines, and compatibility code only after consumers have moved and cleanup is explicitly approved.

## Online Safety Checks

- Estimate lock behavior, index build mode, table rewrite risk, replication lag, transaction duration, and migration timeout.
- Check whether defaults, constraints, triggers, and generated columns rewrite existing rows or block writers.
- Keep large updates bounded by batch, transaction size, sleep/pace, and retry marker.
- For stored procedures and mapper SQL, verify signature, parameter order, result shape, error behavior, and caller compatibility.
- For seed or reference data, verify idempotency and environment-specific values without embedding private data.

## Data Integrity And Reporting

- Define before/after row counts, null counts, duplicate checks, orphan checks, and reconciliation queries.
- Validate representative reports, exports, dashboards, and downstream jobs, not only migration success.
- Record metric definition changes, denominator changes, timezone/currency assumptions, and known exclusions.
- Keep generated query output as runtime evidence until a human promotes durable facts into memory or docs.

## Rollback Evidence

- State what rollback means: revert DDL, restore backup, run compensating migration, disable a feature flag, stop a job, or re-point reads.
- For destructive changes, name the last safe checkpoint and backup/export evidence before execution.
- For backfills, record how to pause, resume, repair, or undo affected batches.
- For compatibility-sensitive changes, verify old app against new schema and new app against old schema when overlapping deploys are possible.

## Stop Conditions

- Row volume, lock behavior, or dependent consumers are unknown.
- A destructive operation has no explicit approval and rollback note.
- A backfill is unbounded, non-idempotent, or has no progress marker.
- Reporting output changes without consumer review.
- Old and new application versions cannot both tolerate the intermediate schema during the deployment shape in use.
