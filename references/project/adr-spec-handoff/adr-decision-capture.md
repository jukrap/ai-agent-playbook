# ADR Decision Capture

## Inventory

- Decision: architecture, data model, integration, deployment, security, performance, UX, process, or documentation policy.
- Context: problem, constraints, affected systems, current behavior, options considered, and forcing function.
- Status: proposed, accepted, superseded, deprecated, rejected, or needs review.
- Readers: maintainers, reviewers, future agents, release owners, auditors, or downstream teams.

## Review

- ADRs should capture decisions that constrain future work, not every implementation detail.
- State the decision in one or two direct sentences before background detail.
- Alternatives should be real options that were considered, not strawmen.
- Consequences include tradeoffs, follow-up work, migration steps, and risks.
- Status and supersession links matter more than a long narrative.
- Keep volatile operational status in worklogs or run notes until it becomes stable policy.

## Verification

- Check that the ADR does not contradict current code, current docs, or latest accepted plan.
- Link to durable local docs or portable evidence rather than raw chat logs.
- Confirm sensitive values, personal paths, internal URLs, branch names, and PR numbers are absent.
- If the decision changes rules, update the relevant `AGENTS.md`, playbook policy, spec, or runbook.

## Stop Conditions

- The decision is not actually settled.
- The document would become a transcript summary instead of a decision record.
- Alternatives, consequences, or affected boundaries are unknown.
- The ADR would encode private operational details that belong in local-only notes.
