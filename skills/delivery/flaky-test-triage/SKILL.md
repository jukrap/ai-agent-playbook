---
name: flaky-test-triage
description: Use when diagnosing, reproducing, stabilizing, quarantining, or documenting flaky, nondeterministic, timing-dependent, or intermittent tests.
---

# Flaky Test Triage

Use this as the primary delivery skill for nondeterministic test failures.

## Workflow

1. Collect failure logs, seed/order, environment, changed files, timing, retries, and pass/fail frequency.
2. Classify likely cause: time, concurrency, async wait, order dependence, shared state, network, filesystem, data fixture, browser/device, or resource limit.
3. Reproduce with the smallest command and stabilize the assertion or setup before broad rewrites.
4. Quarantine only with owner, reason, expiration or follow-up, and a replacement signal.

## Reference

Read `references/nondeterminism-sources.md` for common flaky failure causes and evidence to collect.

Read `references/stabilization-and-quarantine.md` for safe fixes, retry policy, and quarantine handoff.
