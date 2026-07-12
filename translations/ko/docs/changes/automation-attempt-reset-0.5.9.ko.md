# Automation Attempt Reset 복구 0.5.9

0.5.9는 기존 run ledger를 다시 쓰지 않고 blocked automation task의 retry 복구 결함을 고칩니다.

## 변경 사항

- Runtime task에서 reset 가능한 retry budget 사용량(`attempts`)과 단조 증가 claim 횟수(`attemptSerial`)를 분리합니다.
- Reducer는 기존 `task.claimed` event를 재생해 `attemptSerial`을 복원하므로 0.5.9 이전 schema v2 run도 migration이나 ledger rewrite가 필요하지 않습니다.
- `automation resume --reset-attempts`는 retry budget과 마지막 실패를 계속 reset하지만, 다음 tick은 claim, workspace, evidence, delivery, failure, recovery event ID에 아직 사용하지 않은 다음 serial을 사용합니다.
- 중단된 attempt 복구 event ID도 단조 증가 serial을 기준으로 만듭니다.

## 호환성과 안전성

- 기존 append-only ledger는 변경 없이 권위 있는 기준으로 유지됩니다.
- Derived `state.json`, `summary.md`, `handoff.md`는 이전처럼 기존 plan과 ledger에서 다시 만들 수 있습니다.
- 검토 후 blocked run을 원래 run ID로 재개할 수 있으며, attempt event ID 충돌을 피하려는 이유만으로 대체 run을 만들 필요가 없습니다.

## 검증 초점

- 실패 3회가 retry budget을 소진합니다.
- 명시적 reset은 budget 사용량을 0으로 돌리면서 serial 3을 보존합니다.
- 다음 tick은 이전 event를 재사용하거나 충돌하지 않고 `attempt:4`와 새 실패를 기록합니다.
