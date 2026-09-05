# Memory Promotion And Staleness

Use this when moving generated evidence, worklogs, decisions, maps, or contracts into durable project memory.

## Promotion Criteria

- The fact is reviewed, current, portable, and useful beyond one run.
- The source is named without leaking private paths or credentials.
- The destination is appropriate: map, contract, decision, glossary, runbook, worklog, handoff, or archive.
- Conflicts with existing memory are resolved or recorded as open questions.

## Generated Evidence

- Runtime reports, indexes, dry-run output, screenshots, graphs, and tool summaries are generated evidence.
- Generated evidence can support a decision, but it is not trusted memory by itself.
- Keep raw evidence in `runtime/` or equivalent generated-output areas until reviewed.
- Promote concise facts, decisions, or contracts, not full reports.

## Staleness Checks

- Compare memory facts against current files, manifests, contracts, and worklogs when possible.
- Mark stale, missing, changed, unverified, and superseded facts explicitly.
- Preserve historical worklogs as history, but do not let old worklogs override current code and user instructions.
- If freshness cannot be checked, record remaining risk instead of claiming certainty.

## Stop Conditions

- The source evidence is unreviewed, private, generated-only, or contradictory.
- The promotion would store secrets, direct personal paths, internal URLs, branch names, PR numbers, or raw chat transcripts.
- The fact has no owner, date, source, or replacement path.
- Runtime output would be copied wholesale into memory.
