---
name: database-change-safety
description: Use when changing database schema, migrations, SQL, reporting queries, stored procedures, seed data, or data integrity rules.
---

# Database Change Safety

Use this as the primary database skill for safe data changes.

## Workflow

1. Identify data ownership, readers, writers, migration order, rollback needs, and expected data volume.
2. Separate additive, compatible, destructive, and backfill changes.
3. Check indexes, locks, nullability, defaults, constraints, reporting consumers, and deployment order.
4. Verify with migration dry runs, before/after queries, and application compatibility checks when possible.
