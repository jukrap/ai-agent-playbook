---
name: data-migration-integrity
description: Use when planning, reviewing, or verifying data migrations, backfills, warehouse transformations, reconciliation queries, idempotency, batching, rollback, or data repair.
---

# Data Migration Integrity

Use this as the primary data skill for migration and backfill correctness.

## Workflow

1. Identify source/target datasets, ownership, volume, write paths, readers, schedule, migration order, and rollback or repair path.
2. Classify the change as schema migration, backfill, transform, reconciliation, data repair, or warehouse/reporting migration.
3. Check idempotency, batching, locking, constraints, late data, duplicates, partial failure, and compatibility with old/new code.
4. Verify with dry runs, before/after counts, reconciliation queries, samples, and post-migration monitors when possible.

## Reference

Read `references/migration-integrity-checks.md` for migration planning, idempotency, compatibility, locking, and rollback checks.

Read `references/backfill-reconciliation.md` for backfill, sampling, counts, reconciliation queries, and data repair handoff.
