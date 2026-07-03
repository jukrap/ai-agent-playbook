---
name: ci-failure-triage
description: Use when diagnosing failing CI jobs, build pipelines, deployment checks, flaky tests, environment drift, or release automation failures.
---

# CI Failure Triage

Use this as the primary DevOps skill for pipeline failures.

## Workflow

1. Capture the failing job, command, environment, recent diff, and first meaningful error.
2. Classify the failure as code, test, dependency, environment, cache, secret, or external service.
3. Reproduce locally when feasible, then make the narrowest fix.
4. Verify with the failing command or nearest reliable equivalent.

## Reference

Read `references/failure-signal-triage.md` for log ordering, root-cause classification, cache/dependency handling, and rerun rules.
