# Nondeterminism Sources

Use this checklist before changing production code for a flaky test.

## Evidence To Collect

- Exact test command, seed, shard, worker count, retry count, and environment.
- First failing assertion and earliest relevant warning or error.
- Recent diff touching test setup, shared fixtures, clocks, queues, cache, config, or external services.
- Whether the failure reproduces alone, in file, in shard, and in full suite.
- Whether reruns fail at the same step or drift to different symptoms.

## Common Causes

- Time: real timers, date boundaries, time zones, debounce, animation, polling, or eventual consistency.
- Async: missing await, race between render/fetch/cleanup, stale promise, or listener leak.
- Order: global state, shared database, singleton cache, random data collision, or test pollution.
- Environment: port conflict, filesystem path, case sensitivity, locale, browser/device difference, CPU/resource pressure.
- External: network, third-party API, registry, container startup, background job, or queue timing.

## Rule

Treat retries as diagnostic evidence, not as the fix, unless the project explicitly accepts retry policy for that layer.

