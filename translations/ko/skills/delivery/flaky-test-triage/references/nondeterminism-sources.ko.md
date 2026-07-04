# Nondeterminism Sources

Flaky test 때문에 production code를 바꾸기 전에 사용합니다.

## Evidence To Collect

- Exact test command, seed, shard, worker count, retry count, environment.
- 첫 failing assertion과 가장 이른 관련 warning/error.
- Test setup, shared fixture, clock, queue, cache, config, external service를 건드린 recent diff.
- Failure가 단독 실행, file 단위, shard 단위, full suite에서 재현되는지.
- Rerun이 같은 단계에서 실패하는지, 다른 symptom으로 흩어지는지.

## Common Causes

- Time: real timer, date boundary, time zone, debounce, animation, polling, eventual consistency.
- Async: missing await, render/fetch/cleanup race, stale promise, listener leak.
- Order: global state, shared database, singleton cache, random data collision, test pollution.
- Environment: port conflict, filesystem path, case sensitivity, locale, browser/device difference, CPU/resource pressure.
- External: network, third-party API, registry, container startup, background job, queue timing.

## Rule

Retry는 diagnostic evidence로 취급합니다. 해당 layer에서 retry policy를 명시적으로 허용하지 않는 한 retry 자체를 fix로 보지 않습니다.

