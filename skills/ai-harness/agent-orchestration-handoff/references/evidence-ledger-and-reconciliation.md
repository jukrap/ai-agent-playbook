# Evidence Ledger And Reconciliation

Multi-agent work is useful only when the coordinator can trust, compare, and merge outputs. Use an append-only evidence ledger while work is active, then promote only reviewed conclusions.

## Ledger Entry Shape

Each entry should include:

- `taskId`: worker contract id.
- `workerRole`: implementer, researcher, reviewer, tester, doc writer, security reviewer, or release checker.
- `status`: `ready`, `blocked`, `advisory`, `conflict`, `superseded`, or `accepted`.
- `claim`: one factual claim or change summary.
- `locator`: project-relative file, line, symbol, runtime report, command summary, screenshot, source registry item, or manual observation record.
- `scanRange`: what paths, commands, indexes, or sources were searched.
- `verification`: commands or checks actually run.
- `risk`: remaining uncertainty, skipped check, privacy caveat, stale fact, or reviewer concern.
- `review`: accepted, rejected, needs follow-up, or promoted with destination.

## Reconciliation Checklist

- Compare worker claims against source files, current docs, runtime indexes, and project rules.
- Check whether two workers changed or advised the same file, contract, data shape, command, or release gate.
- Treat absence claims as unsafe unless scan range and freshness are recorded.
- Separate generated evidence from trusted memory.
- Keep raw traces, long logs, private outputs, and unreviewed generated summaries out of public docs.
- Convert unresolved conflicts into blockers, follow-up issues, or explicit accepted-risk notes.

## Promotion Rules

- Promote stable facts only after a reviewer can reopen the evidence.
- Promote to `memory/` only when the fact is durable project knowledge.
- Promote to `.ai-agent-playbook/workflows/worklogs/` when the value is historical decision path or milestone evidence.
- Promote to `.ai-agent-playbook/memory/contracts/` when future work must obey the boundary.
- Keep tool output in `runtime/` when it is generated, stale-prone, large, or not yet reviewed.

## Handoff Summary

A final handoff should include:

- worker task ids and final statuses,
- accepted conclusions,
- rejected or superseded claims,
- unresolved conflicts,
- verification evidence,
- skipped checks and residual risk,
- files changed or intentionally not changed, and
- next action with owner or stop reason.
