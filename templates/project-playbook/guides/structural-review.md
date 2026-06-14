# Structural Review

Use this guide when reviewing repository structure, cleanup opportunities, duplication, dead code, module size, dependency cycles, or refactor priority.

## Evidence rules

- Do not make structural claims without evidence from the current repository.
- Do not claim absence without stating scan range.
- Do not use stale audit artifacts without checking freshness.
- Treat static analysis as evidence, not a final architectural verdict.
- If evidence is incomplete, say what is unknown.

Examples:

- Good: `0 cycles in 216 scanned files from the current audit`.
- Bad: `There are no cycles`.
- Good: `No consumer was found in the scanned graph, so this helper is a cleanup candidate`.
- Bad: `This helper is definitely unused`.

## Review cadence

- Use a full audit for first checkups, stale baselines, major refactors, due diligence, or post-refactor review.
- Use quick follow-up checks after a fresh baseline for small localized questions.
- For ordinary chat, summarize the top one to three findings.
- For formal reviews, include scan range, confidence limits, and exact files or lines when useful.

## Duplicate and clone cues

- Treat `operator analyze --deep` and `source_function_clones` results as starting points for review, not proof that code is semantically equivalent.
- Before proposing cleanup, compare callers, contracts, side effects, tests, and naming intent.
- If a clone cue is useful but not immediately actionable, record the current scan range and freshness in a map or worklog instead of starting a broad rewrite.

## Refactor planning

Prefer one small next slice by default:

- name the owner file, module, or domain area
- state what stays out of scope
- include likely ripple files or consumers
- include verification commands or audit checks
- avoid broad goals such as `clean architecture` or `fix all dead code`

Keep durable structure facts in `.ai-playbook/maps/` and durable decisions in `.ai-playbook/decisions/`.
