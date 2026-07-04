---
name: schema-migration-plan
description: Use when planning or reviewing database schema migrations, DDL, indexes, constraints, defaults, nullability, seeds, views, triggers, or expand/contract rollout.
---

# Schema Migration Plan

Use this as the primary database skill for migration order, rollout compatibility, and rollback planning.

## Workflow

1. Identify owners, readers, writers, deployment order, expected volume, compatibility window, and rollback needs.
2. Classify each change as additive, compatible, destructive, backfill, constraint, index, seed, view, trigger, or procedure work.
3. Plan expand/contract steps, dual-read/write compatibility, lock scope, backfill batches, and post-deploy checks.
4. Verify with migration dry runs, before/after queries, application compatibility checks, and rendered consumer checks when available.

## Reference

Read `references/migration-order-and-rollback.md` for expand/contract, backfill, rollback, and destructive-change planning.

Read `references/lock-and-deployment-window.md` for lock scope, deployment window, batching, and operational stop conditions.
