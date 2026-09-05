# Spec Worklog Promotion

## Inventory

- Source material: worklog, active plan, completed run, handoff, runtime report, review finding, ADR, spec, or map.
- Destination: current context, map, runbook, contract, glossary, decision record, project spec, archive, or monthly summary.
- Durability: current rule, stable fact, completed milestone, open question, blocker, historical note, or generated evidence.
- Audience: future agent, human maintainer, reviewer, operator, product owner, or auditor.

## Review

- Promote durable facts, not raw transcript text.
- Keep generated evidence under runtime until reviewed; memory should contain human-trusted conclusions.
- Current rules belong in policy or `AGENTS.md`; product facts belong in specs; operational procedures belong in runbooks.
- Worklogs should explain why and what changed, while maps/specs should describe the current state.
- Archive stale notes instead of leaving them in active guidance.
- Preserve uncertainty as open questions rather than presenting guesses as facts.

## Verification

- Cross-check promoted facts against code, config, tests, docs, or reviewed runtime reports.
- Confirm destination path is allowed by local-only/public-doc policy.
- Update links or references when moving a fact from plan/worklog into map/spec/runbook.
- Run public-doc hygiene checks when the destination is committed documentation.
- Leave a short handoff note when follow-up work remains.

## Stop Conditions

- The source evidence has not been reviewed.
- The target document's role is unclear.
- Promotion would duplicate or contradict existing current guidance.
- The note contains secrets, personal paths, internal URLs, branch names, or PR numbers.
