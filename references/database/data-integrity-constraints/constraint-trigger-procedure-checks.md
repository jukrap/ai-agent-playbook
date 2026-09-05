# Constraint Trigger Procedure Checks

Use this when a change enforces or changes an invariant through constraints, triggers, stored procedures, generated columns, or application/database validation boundaries.

## Invariant Evidence

- State the invariant in business terms and database terms.
- Identify the enforcement layer today: database constraint, trigger, stored procedure, ORM validation, application service, batch repair, or manual process.
- Name affected tables, callers, write paths, imports, reports, and background jobs.
- Check existing data violations before adding or validating stricter rules.

## Constraint And Routine Safety

- Unique constraints require duplicate detection and a repair plan.
- Foreign keys require orphan detection, delete/update behavior, and import ordering review.
- Not-null/check constraints require current null/invalid counts and default/backfill plan.
- Triggers and procedures require side-effect inventory, transaction behavior, caller compatibility, and rollback notes.
- Application-only validation should be explicit when database enforcement is not feasible.

## Verification

- Positive and negative write cases.
- Duplicate, orphan, null, invalid enum/range, and cross-table reconciliation queries.
- Application write/read smoke checks for affected paths.
- Report/export/dashboard smoke checks when existing invalid data may have shaped output.

## Stop Conditions

- The invariant owner is unknown.
- Existing violations are unknown before enforcement.
- A trigger or procedure side effect can change data outside the named scope.
- Tightening a rule can break imports, queues, or legacy writers without a compatibility plan.
