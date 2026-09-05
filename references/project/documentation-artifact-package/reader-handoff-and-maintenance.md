# Reader Handoff And Maintenance

Shape documentation packages around what the next reader must decide or do.

## Reader Modes

- Stakeholder: outcome, scope, status, risk, decision needed, timeline, next action.
- Developer: architecture, contracts, setup, changed surfaces, commands, verification, open questions.
- Operator: runbook, deploy, rollback, monitoring, incident symptoms, escalation, data repair.
- Analyst: metric definitions, source data, grain, caveats, freshness, lineage, dashboard/report usage.
- Maintainer: ownership, update cadence, archive path, stale markers, related decisions, cleanup debt.

## Handoff Sections

- Current state: what is true now and when it was reviewed.
- Decision path: important alternatives, why one was chosen, and consequences.
- How to verify: commands, checks, manual review, dashboards, logs, or source files.
- How to update: owner, cadence, required reviewers, translation needs, and related files.
- How to archive: conditions that make the artifact obsolete and where history belongs.
- Remaining risk: skipped checks, open questions, dependencies, and reader-specific caveats.

## Maintenance Rules

- Do not let a one-time report become active guidance without promotion.
- Put status changes in worklogs or release notes before editing durable policy.
- If a package changes current project rules, update the canonical docs it references.
- If translated docs exist, update translations in the same change or mark the gap explicitly.

## Common Mistakes

- Writing one artifact for every audience.
- Hiding open questions in prose instead of listing owner and next action.
- Copying raw generated text into durable docs.
- Leaving screenshots, reports, or exports without freshness and source context.
