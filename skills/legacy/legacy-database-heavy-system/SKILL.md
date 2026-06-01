---
name: legacy-database-heavy-system
description: Use when maintaining legacy systems where business rules live in stored procedures, triggers, views, direct SQL, scheduled jobs, or database-shaped contracts.
---

# Legacy Database Heavy System

Treat the database as active application code, not passive storage.

## Workflow

1. Identify tables, views, stored procedures, triggers, jobs, and direct SQL call sites involved in the change.
2. Trace both application code and database-side behavior before editing.
3. Check transaction boundaries, locking, isolation, rollback behavior, and batch volume.
4. Preserve existing data shape unless migration and compatibility are explicit.
5. Verify with representative data and a rollback path.

## Guardrails

- Do not rename columns, change procedure parameters, or alter result sets without checking every caller.
- Do not assume ORM models capture all database behavior.
- Do not treat trigger side effects as invisible implementation details.
- Record schema, migration, data backfill, and operational risks in PR/worklog.
