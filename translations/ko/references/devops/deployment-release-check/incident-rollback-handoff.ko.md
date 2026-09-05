# 장애와 롤백 인수인계

Release, hotfix, rollback, production issue를 다른 operator에게 간결히 넘겨야 할 때 사용합니다.

## 인수인계 항목

- Current state: deployed version, affected environment, affected users, start time, severity.
- Trigger: release, config change, migration, dependency outage, traffic spike, data issue, unknown.
- Evidence: failing check, dashboard signal, log, trace, support report, reproduction path.
- Containment: feature flag, rollback, traffic shift, queue pause, rate limit, config revert, manual repair.
- Data risk: incident 중 write, replay need, backfill need, cache/index repair, audit requirement.
- Owner와 next checkpoint: 누가 언제 다음 결정을 하는지.

## 롤백 검토

- Rollback artifact 또는 이전 version이 알려져 있고 deploy 가능한지 확인합니다.
- Config, feature flag, migration, queue, cached data가 안전한 상태로 돌아갈 수 있는지 확인합니다.
- Rollback이 job, payment, email, webhook, data migration을 중복 적용하지 않는지 확인합니다.
- Monitoring으로 rollback이 성공했음을 증명할 수 있어야 합니다.
- Rollback이 위험하면 containment와 forward-fix 기준을 정의합니다.

## 검증

- Pre-rollback과 post-rollback signal 비교.
- 실패했던 user/service path smoke test.
- Async work가 관련되었으면 queue/job status.
- Data가 바뀌었으면 reconciliation 또는 repair note.
- Permanent fix와 test gap을 위한 follow-up issue 또는 worklog.
