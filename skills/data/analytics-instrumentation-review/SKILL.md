---
name: analytics-instrumentation-review
description: Use when reviewing tracking plans, event schemas, analytics instrumentation, funnels, cohorts, experiments, attribution, consent, or downstream metric impact.
---

# Analytics Instrumentation Review

Use this as the primary data skill for event tracking, analytics instrumentation, funnels, cohorts, and experiments.

## Workflow

1. Identify business question, event owner, user/account/session grain, event names, properties, identity stitching, and downstream metrics.
2. Check client/server event boundary, retry/dedup behavior, consent/privacy rules, sampling, attribution, offline/mobile behavior, and dashboard consumers.
3. Separate instrumentation correctness from UI state, backend connector, and reporting presentation concerns.
4. Verify with tracking plan, sample payloads, event tests, route/API hints, dashboard impact, and experiment assignment checks when possible.

## Reference

Read `references/event-tracking-plan.md` for event naming, property, identity, consent, and payload checks.

Read `references/funnel-cohort-experiment-checks.md` for funnel, cohort, experiment, attribution, and downstream metric checks.
