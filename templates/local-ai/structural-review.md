# Structural Review

Use this guide when an agent reviews repository structure, cleanup opportunities, duplication, dead code, module size, dependency cycles, or refactor priority.

## Evidence rules

- Do not make structural claims without evidence from the current repository.
- Do not claim absence without stating the scan range.
- Do not use stale audit artifacts without checking freshness.
- Treat static analysis as evidence, not a final architectural verdict.
- If evidence is incomplete, say what is unknown instead of filling the gap with prose.

Examples:

- Good: `0 cycles in 216 scanned files from the current full audit`.
- Bad: `There are no cycles`.
- Good: `This helper is a cleanup candidate; no consumer was found in the scanned graph`.
- Bad: `This helper is definitely unused`.

## Review cadence

- Use a full audit for first checkups, stale baselines, major refactors, due diligence, or post-refactor review.
- Use quick follow-up checks after a fresh baseline for small localized questions.
- For ordinary chat, summarize the top one to three findings instead of dumping every artifact.
- For formal reviews, include scan range, confidence limits, and exact files or lines where useful.

## Optional tools

If the project has installed a repository audit or structural evidence tool, use it as a source of machine evidence when it fits the stack.

- Do not copy slash-command syntax from another agent runtime into Codex.
- Do not assume before-write or after-write gates are active unless the project opted into them.
- Do not ask users to hand-write machine intent JSON for normal chat.
- Keep generated audit output local unless the project explicitly tracks it.

## Refactor planning

Prefer one small next slice by default:

- name the owner file, module, or domain area
- state what stays out of scope
- include likely ripple files or consumers when splitting would leave the repo inconsistent
- include verification commands or audit checks
- avoid broad goals such as "clean architecture" or "fix all dead code"

## Output shape

For concise reviews, use:

```md
## Current State
- What is already stable or what the scan can support.

## Worth Smoothing Next
- The smallest evidence-backed improvement, with where to start.

## Keep As-Is For Now
- Protected, low-confidence, generated, public, or convention-driven surfaces.

## Confidence
- Scan range, freshness, unknowns, and next check.
```

For code review findings, lead with bugs, regressions, or risks before style and cleanup suggestions.
