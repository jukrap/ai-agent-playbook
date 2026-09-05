# 관측성 기반 릴리스 루프

Release readiness가 pre-merge check뿐 아니라 deploy 이후 runtime evidence에 달려 있을 때 사용합니다.

## 신호 목록

- Service health: uptime, readiness, startup error, crash loop, restart count.
- User path: request rate, error rate, latency, saturation, key business metric.
- Async path: queue depth, queue age, retry count, dead-letter count, worker lag, job duration.
- Data path: migration status, backfill progress, data freshness, reconciliation count, cache invalidation.
- Client path: frontend error log, asset load failure, WebSocket reconnect, mobile crash rate, support signal.

## 릴리스 루프

1. Release 전에 예상되는 signal movement를 정의합니다.
2. 변경 surface를 볼 수 있는 dashboard나 query가 있는지 확인합니다.
3. Version identity를 기록한 상태로 artifact를 deploy 또는 dry-run합니다.
4. Startup, config, migration, queue, error burst 같은 leading indicator를 먼저 봅니다.
5. Latency, critical flow success, support-visible failure 같은 user-impact indicator를 봅니다.
6. Evidence 기준으로 continue, pause, rollback, accepted risk를 결정합니다.

## Alert와 log 규칙

- Alert는 deploy regression, dependency outage, data-specific repair, expected migration noise를 구분해야 합니다.
- Log에는 version, route/job, operation id, sanitized error code를 포함하고 tenant/workspace는 안전할 때만 넣습니다.
- Metric은 민감한 high-cardinality value를 피합니다.
- Post-deploy check는 HTTP traffic만이 아니라 변경된 runtime mode를 포함합니다.

## 증거

- Release version 또는 artifact digest.
- Dashboard/query link 또는 portable하지 않을 때 command output.
- Observation time window.
- Decision: continue, rollback, pause, accepted risk.
