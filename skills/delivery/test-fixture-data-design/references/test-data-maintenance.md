# Test Data Maintenance

Use this when fixtures start hiding failures or producing noisy updates.

## Maintenance Checks

- Does the fixture still describe the real contract, schema, or user behavior?
- Can a reader understand why each required field exists?
- Are generated IDs, dates, order, randomness, and locale deterministic?
- Are snapshots small enough to review and specific enough to catch regressions?
- Do golden files have an update command and review expectation?
- Does cleanup remove state created by the test without touching unrelated data?

## Update Rules

- Update fixtures in the same change as the behavior or contract they document.
- Explain large snapshot/golden diffs in the PR or worklog.
- Prefer adding a focused fixture over making a shared fixture more complex.
- Delete stale fixtures only after confirming no test still relies on their signal.

