# Quality Check Design

Use this when adding or reviewing data quality checks for pipelines, reports, imports, exports, streams, or warehouse datasets.

## Check Types

- Source checks: record count, required fields, null rate, duplicate identifiers, timestamp ranges, file completeness, and provider status.
- Transform checks: join loss, orphan records, referential integrity, enum/range rules, row-level dedupe, late data, and idempotency.
- Consumer checks: metric totals, dashboard row counts, export shape, segmentation totals, and sampled business records.
- Repair checks: before/after counts, affected window, irreversible cleanup, replay behavior, and owner approval.

## Design Rules

- State dataset grain, scan window, sample size, severity, threshold, owner, and failure action.
- Prefer deterministic checks before broad anomaly claims.
- Keep raw sampled rows out of public docs when they may contain sensitive data.
- Store generated reports under runtime output until reviewed.

## Stop Conditions

- Check scope, threshold, owner, or remediation path is missing.
- A destructive repair is proposed without dry-run evidence and rollback or compensation plan.
- Quality evidence is sampled too narrowly for the claim.
- Sensitive records would be copied into reusable docs.
