# Risk-Based Test Plan

얼마나 많은 검증이 충분한지 결정할 때 사용합니다.

## Risk Inputs

- User-visible surface: screen, API, job, workflow, report, native permission, deploy path, data migration.
- Blast radius: shared library, shared component, schema, config, auth, cache, queue, external integration.
- Failure mode: wrong result, downtime, data loss, privacy issue, inaccessible UI, billing impact, silent drift.
- Change confidence: local ownership, recent churn, test coverage, typed contract, known flaky area, legacy coupling.
- Release pressure: hotfix, flag 뒤 변경, staged rollout, rollback path, one-way migration.

## Coverage Choice

- Blast radius가 좁고 contract가 명확하면 narrow check를 우선합니다.
- Boundary, DTO, schema, adapter, queue, external service가 바뀌면 integration 또는 contract check를 추가합니다.
- User journey, routing, auth, browser behavior, deployment packaging이 바뀌면 E2E 또는 smoke check를 추가합니다.
- Migration, backfill, report, dashboard, business metric이 바뀌면 data reconciliation을 추가합니다.
- Visual behavior, accessibility, native shell, printer, real device가 중요하면 manual/browser/device check를 추가합니다.

## Handoff

- 실행한 check만 기록합니다.
- 실행하지 못한 check와 이유를 명명합니다.
- Residual risk는 user impact와 rollback/containment 기준으로 설명합니다.

