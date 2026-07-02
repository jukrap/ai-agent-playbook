---
name: ci-quality-gate
description: Use when deciding CI quality gates before merge, release, handoff, or publication.
---

# CI Quality Gate

Use this as the primary delivery skill for deciding whether checks are sufficient to merge, release, or hand off work.

## Workflow

1. Identify the change scope, target branch or release surface, gate owner, required checks, optional checks, and allowed skip policy.
2. Inventory project-defined checks from package scripts, CI config, docs, workflow recipes, and prior run evidence.
3. Classify every relevant check as pass, fail, skipped, unavailable, stale, or not applicable, with a locator back to the source.
4. Treat missing or failing required checks as blocked unless the owner explicitly accepts the residual risk.
5. Record the gate summary, blocked checks, skipped checks, verification commands, evidence locators, and remaining risk in the handoff.

## Reference

Read `references/gate-model.md` when deciding gate scope, status, and stop conditions.

Read `references/evidence-package.md` when packaging check evidence for a handoff, PR, release, or audit note.
