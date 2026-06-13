---
name: review-work-light
description: Use when doing a lightweight review of recent implementation work, local diffs, or a completed change before handoff without starting a blocking multi-agent review process.
---

# Review Work Light

Review the change for likely misses before handoff.

## Workflow

1. Inspect the current diff, touched files, and relevant tests or docs.
2. Review behavior first: regressions, edge cases, data contracts, state transitions, errors, and cleanup safety.
3. Review maintainability second: duplication, naming, local style, documentation drift, and overbroad changes.
4. Check whether the verification evidence matches the risk of the change.
5. Report findings first. If there are no findings, state remaining test gaps or residual risk.

## Reference

Read `references/review-work-light-checklist.md` for review angles and output guidance.
