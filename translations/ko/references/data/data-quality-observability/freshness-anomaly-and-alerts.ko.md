# Freshness Anomaly And Alerts

Freshness check, anomaly detection, quality monitor, data incident alert를 검토할 때 사용합니다.

## Freshness

- Expected arrival time, allowed delay, timezone, source clock, batch/stream mode, consumer SLA를 정의합니다.
- Last successful load, latest source event time, latest transformed event time, latest consumer-visible time을 추적합니다.
- Upstream delay, transformation failure, dashboard cache delay를 분리합니다.
- Backfill과 replay가 normal freshness처럼 보이지 않게 표시합니다.

## Alerting

- Severity, owner, routing, quiet hour, escalation, runbook link를 정의합니다.
- Anomaly라고 판단하기 전에 historical baseline, business calendar, deployment window, known seasonal pattern을 확인합니다.
- Credential이나 sensitive row를 노출하지 않으면서 triage 가능한 evidence를 포함합니다.
- Consumer impact가 있으면 data incident outcome을 worklog 또는 handoff에 기록합니다.

## Stop Conditions

- Alert에 owner, threshold, runbook, consumer impact가 없습니다.
- Freshness source가 모호하거나 stale cache에서 파생되었습니다.
- Anomaly detection에 baseline이나 known exclusion handling이 없습니다.
- Incident evidence가 private data를 public docs로 유출합니다.
