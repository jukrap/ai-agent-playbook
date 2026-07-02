# Incident Evidence

## Intake

- Symptom: 무엇이 깨졌고, 누가 영향을 받으며, user 또는 dependent service가 어떻게 보는지.
- Time: first detection, likely start, last known good state, deploy/config/migration/change window.
- Scope: service, route, tenant, region, queue, job, dependency, browser, device, data segment.
- Severity: active user impact, data risk, security risk, revenue/operational impact, workaround availability.

## Containment First

- Impact가 active이면 root-cause depth보다 rollback, feature flag disablement, traffic shift, rate limit, queue pause, cache bypass, maintenance mode를 먼저 고려합니다.
- Mitigation 중 변경은 reversible하고 작게 유지합니다.
- Blast radius를 넓히는 speculative fix를 피합니다.
- 무엇을 언제 바꿨고 recovery를 어떻게 판단할지 기록합니다.

## Investigation

- Alert, deploy, config change, migration, dependency incident, queue depth, error-rate shift로 timeline을 만듭니다.
- Affected segment와 unaffected segment를 비교해 boundary를 좁힙니다.
- Retry, backpressure, cache behavior, rate limit, downstream timeout이 symptom을 증폭하는지 확인합니다.
- Log retention, pod restart, queue drain, cleanup이 evidence를 지우기 전에 필요한 근거를 보존합니다.

## Handoff

- Current status, impact, owner, next action, rollback/mitigation state.
- Evidence link 또는 portable path만 남깁니다. Secret이나 personal machine path를 붙여넣지 않습니다.
- Follow-up item: test, monitor, runbook update, alert, dashboard, data repair, customer-facing note.
