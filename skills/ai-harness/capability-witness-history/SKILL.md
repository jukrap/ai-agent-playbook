---
name: capability-witness-history
description: Use when capability status needs witnesses, baselines, skipped states, or reliability history.
---

# Capability Witness History

Use this as the primary AI harness skill for append-only capability evidence, baseline comparison, and reliability history.

## Workflow

1. Choose the capability id, command or check, environment, expected status, baseline source, and comparable scope.
2. Record an append-only entry with timestamp, version, runtime, status, duration, artifacts, caveats, and skipped/degraded reasons.
3. Compare against OS, runtime, and capability baselines only when the run is comparable.
4. Keep witness output in `runtime/` until reviewed; report failed, skipped, degraded, and unknown status explicitly.

## Reference

Read `references/capability-ledger-schema.md` for witness entries, status fields, artifact rules, and privacy boundaries.

Read `references/regression-baseline-policy.md` for comparable baselines, rolling history, regression thresholds, and stop conditions.
