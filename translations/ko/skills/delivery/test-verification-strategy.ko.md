# Test Verification Strategy

Verification coverage를 선택하고 설명하기 위한 primary delivery skill입니다.

## Workflow

1. Change risk, user, code path, data shape, external system, release/rollback pressure를 확인합니다.
2. Static, unit, integration, contract, E2E, visual, migration, smoke, manual, monitor 기반 check 중 가장 싸고 신뢰 가능한 check를 risk에 맞춥니다.
3. Required check와 nice-to-have check를 분리하고, 검증되지 않은 부분을 명명합니다.
4. Project-defined command를 먼저 실행한 뒤 실제 check와 remaining risk를 handoff에 기록합니다.

## Reference

Test scope, blast radius, release confidence planning에는 `references/risk-based-test-plan.md`를 읽습니다.

Change type을 구체적인 verification command와 evidence로 매핑할 때는 `references/verification-matrix.md`를 읽습니다.

