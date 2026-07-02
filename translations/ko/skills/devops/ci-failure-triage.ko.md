---
name: ci-failure-triage
description: Use when diagnosing failing CI jobs, build pipelines, deployment checks, flaky tests, environment drift, or release automation failures.
---

# CI Failure Triage

pipeline failure를 위한 primary DevOps skill입니다.

## Workflow

1. failing job, command, environment, recent diff, first meaningful error를 확보합니다.
2. failure를 code, test, dependency, environment, cache, secret, external service로 분류합니다.
3. 가능하면 로컬에서 재현하고 가장 좁은 fix를 만듭니다.
4. failing command 또는 신뢰 가능한 nearest equivalent로 검증합니다.

