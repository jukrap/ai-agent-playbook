---
name: capability-witness-history
description: Use when capability status needs witnesses, baselines, skipped states, or reliability history.
---

# Capability Witness History

Append-only capability evidence, baseline comparison, reliability history를 다루는 기본 AI harness skill입니다.

## Workflow

1. Capability id, command 또는 check, environment, expected status, baseline source, comparable scope를 정합니다.
2. Timestamp, version, runtime, status, duration, artifact, caveat, skipped/degraded reason을 append-only entry로 기록합니다.
3. OS, runtime, capability baseline과 비교할 때는 run이 비교 가능한 경우로 제한합니다.
4. Witness output은 검토 전까지 `runtime/`에 두고 failed, skipped, degraded, unknown status를 명시합니다.

## Reference

Witness entry, status field, artifact rule, privacy boundary는 `references/capability-ledger-schema.ko.md`를 읽습니다.

Comparable baseline, rolling history, regression threshold, stop condition은 `references/regression-baseline-policy.ko.md`를 읽습니다.
