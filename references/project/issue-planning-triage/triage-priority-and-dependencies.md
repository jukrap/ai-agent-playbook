# Triage Priority And Dependencies

Use this to decide what should happen next and what must be unblocked first.

## Priority Inputs

- User impact: severity, frequency, affected audience, revenue/support impact, accessibility, legal, or operational risk.
- Time sensitivity: release deadline, incident, migration window, deprecation date, compliance date, dependency deadline.
- Confidence: reproduction quality, source evidence, unknowns, owner availability, test coverage.
- Blast radius: shared component, API contract, data migration, security boundary, infrastructure, release artifact.
- Effort shape: quick fix, bounded implementation, multi-owner project, research needed, blocked decision.

## Dependency Checks

- Product decision before implementation.
- Design decision before UI or copy work.
- API/data contract before frontend or analytics work.
- Migration/backfill plan before schema or data changes.
- Security/privacy review before sensitive data or authorization changes.
- Release/rollback path before high-risk deployment.

## Status Language

- Ready: scope, owner, acceptance criteria, and verification are clear.
- Blocked: named blocker and unblock owner are known.
- Needs triage: impact, scope, or owner is unclear.
- Research: decision cannot be made without timeboxed evidence.
- Deferred: valid work, but not in current priority window.
- Duplicate or superseded: point to the surviving issue or decision.

## Stop Conditions

- Priority is being inferred from urgency words alone.
- A task is marked ready while required API, data, security, or design decisions are still unknown.
- The issue duplicates a plan/worklog without adding owner, scope, acceptance criteria, or next action.
