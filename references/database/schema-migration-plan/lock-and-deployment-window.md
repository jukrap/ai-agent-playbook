# Lock And Deployment Window

Use this when migration safety depends on locks, long-running statements, deployment windows, batching, or operational coordination.

## Lock Evidence

- Identify statements that may rewrite tables, scan large tables, validate constraints, rebuild indexes, or block writes.
- Check whether the migration tool or DBMS supports concurrent index creation, online DDL, not-valid constraints, phased validation, or explicit lock timeout.
- Estimate affected row count, index size, table size, and hot-write paths from available local evidence. Do not invent production metrics.
- Prefer a dry run, explain, estimate, or DBA-reviewed plan before running high-risk DDL.

## Deployment Coordination

- Name the application version order: schema first, app first, dual-write, feature flag, queue/job pause, or maintenance window.
- Identify background jobs, scheduled imports, report generation, exports, and API writes that should be paused or watched.
- Keep runtime evidence in `.ai-agent-playbook/runtime/reports` or an equivalent generated-output area until reviewed.
- Promote only reviewed decisions or durable constraints into memory maps or contracts.

## Verification

- Migration dry run or tool preview.
- Lock timeout or online DDL option review when supported.
- Before/after row count, duplicate/orphan checks, and representative read/write smoke checks.
- Report/export/dashboard smoke checks when queries depend on the changed schema.

## Stop Conditions

- Lock behavior is unknown for a high-volume table.
- The migration requires a maintenance window but no owner or window is named.
- The change can block writes, queues, or imports and no pause/retry plan exists.
- The plan assumes a DBMS feature without evidence from project config or docs.
