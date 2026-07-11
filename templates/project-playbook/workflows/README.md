# Workflows

Repeatable work patterns live here.

Use `recipes/` for reusable procedures, `runbooks/` for project-specific operations, `plans/` for upcoming work, `runs/` for active run ledgers, `worklogs/` for completed work, and `handoffs/` for transfer notes.

Structured automation plans pair Markdown with a `workflow.plan.v2` JSON sidecar. Schema v2 run directories and their append-only ledger are controller-managed; inspect them with `automation status` and do not rewrite derived state to hide prior attempts.
