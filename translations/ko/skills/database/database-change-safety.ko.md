---
name: database-change-safety
description: Use when changing database schema, migrations, SQL, reporting queries, stored procedures, seed data, or data integrity rules.
---

# Database Change Safety

안전한 data change를 위한 primary database skill입니다.

## Workflow

1. data ownership, reader, writer, migration order, rollback needs, expected data volume을 확인합니다.
2. additive, compatible, destructive, backfill change를 분리합니다.
3. index, lock, nullability, default, constraint, reporting consumer, deployment order를 확인합니다.
4. 가능하면 migration dry run, before/after query, application compatibility check로 검증합니다.
