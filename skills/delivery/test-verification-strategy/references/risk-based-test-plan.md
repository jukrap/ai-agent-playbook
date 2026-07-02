# Risk-Based Test Plan

Use this checklist when deciding how much verification is enough.

## Risk Inputs

- User-visible surface: screen, API, job, workflow, report, native permission, deploy path, or data migration.
- Blast radius: shared library, shared component, schema, config, auth, cache, queue, or external integration.
- Failure mode: wrong result, downtime, data loss, privacy issue, inaccessible UI, billing impact, or silent drift.
- Change confidence: local ownership, recent churn, test coverage, typed contract, known flaky area, or legacy coupling.
- Release pressure: hotfix, behind flag, staged rollout, rollback path, or one-way migration.

## Coverage Choice

- Prefer narrow checks when the blast radius is narrow and the contract is clear.
- Add integration or contract checks when a boundary, DTO, schema, adapter, queue, or external service changes.
- Add E2E or smoke checks when the user journey, routing, auth, browser behavior, or deployment packaging changes.
- Add data reconciliation when migrations, backfills, reports, dashboards, or business metrics change.
- Add manual/browser/device checks when visual behavior, accessibility, native shells, printers, or real devices matter.

## Handoff

- Record checks actually run, not intended checks.
- Name unavailable checks and why they were skipped.
- Describe residual risk in terms of user impact and rollback or containment.

