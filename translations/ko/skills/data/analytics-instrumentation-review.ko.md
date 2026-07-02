---
name: analytics-instrumentation-review
description: Use when reviewing tracking plans, event schemas, analytics instrumentation, funnels, cohorts, experiments, attribution, consent, or downstream metric impact.
---

# Analytics Instrumentation Review

Event tracking, analytics instrumentation, funnel, cohort, experiment를 위한 primary data skill입니다.

## Workflow

1. business question, event owner, user/account/session grain, event name, property, identity stitching, downstream metric을 확인합니다.
2. client/server event boundary, retry/dedup behavior, consent/privacy rule, sampling, attribution, offline/mobile behavior, dashboard consumer를 확인합니다.
3. Instrumentation correctness를 UI state, backend connector, reporting presentation concern과 분리합니다.
4. 가능하면 tracking plan, sample payload, event test, route/API hint, dashboard impact, experiment assignment check로 검증합니다.

## Reference

event naming, property, identity, consent, payload check는 `references/event-tracking-plan.md`를 읽습니다.

funnel, cohort, experiment, attribution, downstream metric check는 `references/funnel-cohort-experiment-checks.md`를 읽습니다.
