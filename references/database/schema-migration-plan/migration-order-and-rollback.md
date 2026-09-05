# Migration Order And Rollback

Use this when a schema, seed, index, view, trigger, stored procedure, or migration script change can affect application compatibility or production data.

## Change Classification

- Additive compatible: new nullable columns, new tables, new indexes, non-required views, or optional seed data.
- Compatibility-sensitive: renames, type changes, enum changes, non-null defaults, unique constraints, foreign keys, generated columns, stored procedure signatures, or trigger logic.
- Destructive: drops, deletes, truncates, irreversible transformations, data rewrites, or one-way migrations.
- Backfill: any change that updates existing rows, repairs missing values, recomputes derived values, or needs batching.

## Plan Shape

- Name affected tables, columns, routines, jobs, application modules, reports, exports, and external consumers.
- Split expand and contract phases when old and new application versions may overlap.
- Keep backfills idempotent and restartable. Record batch size, ordering key, expected volume, and retry behavior.
- Keep destructive cleanup behind a later step after read paths, writes, reports, and jobs have moved.
- Prefer dry-run and preview output before execution. Treat generated output as evidence candidates until reviewed.

## Rollback Evidence

- Record whether rollback means reverting DDL, restoring from backup, running a compensating migration, disabling a feature flag, or stopping a job.
- For destructive changes, name the backup/export/restore evidence and the latest point where rollback is still possible.
- For application compatibility, verify old app against new schema and new app against old schema when overlapping deploys are possible.
- For reporting consumers, verify representative report/export/dashboard output, not only migration success.

## Stop Conditions

- Production data shape, table size, or dependent consumers are unknown.
- A destructive change has no explicit confirmation and rollback note.
- A backfill is unbounded, non-idempotent, or lacks a recovery marker.
- Old and new application versions cannot both tolerate the intermediate schema.
