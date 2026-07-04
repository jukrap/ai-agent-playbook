# Observability Incident Triage

Active incident와 production signal review를 위한 primary DevOps skill입니다.

## Workflow

1. Symptom, start time, impacted users/services, severity, recent changes, available logs/metrics/traces를 캡처합니다.
2. User impact가 active이면 완벽한 root cause보다 containment와 rollback을 우선합니다.
3. Code를 바꾸기 전에 deploy, dependency, queue, job, resource, error boundary 전반의 signal을 상관시킵니다.
4. Incident를 보여준 같은 signal로 recovery를 검증한 뒤 follow-up action과 durable runbook update를 기록합니다.

## Reference

Active incident intake, containment, handoff에는 `references/incident-evidence.md`를 읽습니다.

Observability evidence를 해석할 때는 `references/logs-metrics-traces.md`를 읽습니다.
