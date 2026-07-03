---
name: data-integrity-constraints
description: Use when changing database constraints, keys, triggers, stored procedures, repair scripts, reconciliation queries, or application/database invariants.
---

# Data Integrity Constraints

Use this as the primary database skill for enforcing, repairing, or reviewing data invariants.

## Workflow

1. Identify the invariant, owner, current enforcement layer, affected data, callers, reports, jobs, and repair/rollback needs.
2. Check existing violations before enforcing a new constraint or trigger.
3. Plan repair, backfill, dedupe, orphan cleanup, partial rollout, and application compatibility before tightening rules.
4. Verify with reconciliation queries, before/after counts, negative cases, app behavior, and post-deploy monitoring when available.

## Reference

Read `references/constraint-trigger-procedure-checks.md` for database-enforced invariants and routine safety.

Read `references/reconciliation-and-backfill-checks.md` for repair, dedupe, orphan, and backfill verification.
