---
name: test-fixture-data-design
description: Use when designing, reviewing, or repairing test fixtures, factories, mocks, seeds, snapshots, golden files, sample payloads, test databases, or fixture maintenance boundaries.
---

# Test Fixture Data Design

Use this as the primary delivery skill for reliable test data and fixture boundaries.

## Workflow

1. Identify the behavior under test, fixture owner, lifecycle, scope, and cleanup requirements.
2. Choose the lightest stable fixture: inline sample, factory, builder, seed, mock, contract example, snapshot, golden file, or isolated database.
3. Keep fixtures realistic enough to catch contract drift but small enough to diagnose failures.
4. Verify that fixture updates fail loudly when behavior changes and do not hide unrelated regressions.

## Reference

Read `references/fixture-boundaries.md` for choosing fixture type, scope, isolation, and ownership.

Read `references/test-data-maintenance.md` for keeping sample data, snapshots, and golden files useful over time.

