---
name: pre-action-fact-gate
description: Use when risky edits need importers, schemas, owner search, blast radius, or rollback facts first.
---

# Pre Action Fact Gate

Use this as the primary AI harness skill for gathering concrete facts before broad, destructive, owner-creating, or high-blast-radius actions.

## Workflow

1. Restate the latest user intent, target action, target paths, risk type, and whether the action is advisory or applied.
2. Gather bounded facts: existing owners, importers/callers, public APIs, data schemas, contracts, nearby patterns, verification commands, and rollback path.
3. For new files or ownership changes, search for existing domain clusters, naming patterns, lifecycle owners, and deletion path before creating a new surface.
4. For destructive or applied actions, require explicit instruction, dry-run or write-gate preview evidence, resolved target list, and rollback evidence.

## Reference

Read `references/fact-gate-checks.md` for bounded fact sets by action type and evidence standards.

Read `references/destructive-action-review.md` for deletes, moves, rewrites, migrations, publish/deploy actions, and write-tier escalation.
