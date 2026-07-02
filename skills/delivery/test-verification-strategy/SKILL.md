---
name: test-verification-strategy
description: Use when planning, reviewing, or repairing verification strategy, test scope, unit/integration/e2e/contract/manual checks, coverage gaps, risk-based test selection, or release confidence.
---

# Test Verification Strategy

Use this as the primary delivery skill for choosing and defending verification coverage.

## Workflow

1. Identify the change risk, users, code paths, data shape, external systems, and release or rollback pressure.
2. Map risk to the cheapest reliable checks: static, unit, integration, contract, E2E, visual, migration, smoke, manual, or monitor-based.
3. Separate required checks from nice-to-have checks, and name what remains unverified.
4. Verify with project-defined commands first, then record actual checks and remaining risk in the handoff.

## Reference

Read `references/risk-based-test-plan.md` for test scope, blast radius, and release confidence planning.

Read `references/verification-matrix.md` for mapping change types to concrete verification commands and evidence.

