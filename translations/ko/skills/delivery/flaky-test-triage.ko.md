# Flaky Test Triage

Nondeterministic test failure를 다루기 위한 primary delivery skill입니다.

## Workflow

1. Failure log, seed/order, environment, changed file, timing, retry, pass/fail frequency를 모읍니다.
2. 원인을 time, concurrency, async wait, order dependence, shared state, network, filesystem, data fixture, browser/device, resource limit로 분류합니다.
3. 가장 작은 command로 재현하고 broad rewrite 전에 assertion 또는 setup을 안정화합니다.
4. Quarantine은 owner, reason, expiration/follow-up, replacement signal이 있을 때만 사용합니다.

## Reference

Common flaky failure cause와 수집할 evidence에는 `references/nondeterminism-sources.md`를 읽습니다.

Safe fix, retry policy, quarantine handoff에는 `references/stabilization-and-quarantine.md`를 읽습니다.

