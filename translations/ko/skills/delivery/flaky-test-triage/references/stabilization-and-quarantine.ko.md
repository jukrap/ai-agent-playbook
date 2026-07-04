# Stabilization And Quarantine

Flaky test를 fix, retry, quarantine, delete 중 어떻게 다룰지 결정할 때 사용합니다.

## Stabilization

- Sleep을 state-based wait, deterministic clock, controlled queue, explicit readiness check로 바꿉니다.
- Unique data, transaction cleanup, temp directory, fresh browser context, reset hook으로 shared state를 격리합니다.
- Assertion은 incidental timing보다 durable user-visible state 또는 contract output을 대상으로 합니다.
- Production behavior가 실제로 잘못된 것이 아니라면 fix를 failing test 근처에 둡니다.

## Quarantine

Quarantine은 failure가 delivery를 막고 즉시 안정화할 수 없을 때만 허용합니다.

기록할 항목:

- owner와 follow-up date;
- failure signature와 reproduction command;
- deletion보다 quarantine이 안전한 이유;
- release를 계속 보호할 replacement signal;
- test를 다시 켤 조건.

## Avoid

- 조사 없는 blanket retry.
- 잃는 signal을 기록하지 않은 coverage 삭제.
- wait condition이 잘못되었는지 확인하기 전 timeout 확대.

