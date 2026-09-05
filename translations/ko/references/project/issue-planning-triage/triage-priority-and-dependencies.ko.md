# Triage Priority And Dependencies

다음에 무엇을 해야 하고 무엇을 먼저 풀어야 하는지 정할 때 사용합니다.

## Priority 입력

- User impact: severity, frequency, affected audience, revenue/support impact, accessibility, legal, operational risk.
- Time sensitivity: release deadline, incident, migration window, deprecation date, compliance date, dependency deadline.
- Confidence: reproduction quality, source evidence, unknown, owner availability, test coverage.
- Blast radius: shared component, API contract, data migration, security boundary, infrastructure, release artifact.
- Effort shape: quick fix, bounded implementation, multi-owner project, research needed, blocked decision.

## Dependency 확인

- Implementation 전 product decision.
- UI 또는 copy work 전 design decision.
- Frontend 또는 analytics work 전 API/data contract.
- Schema 또는 data change 전 migration/backfill plan.
- Sensitive data 또는 authorization change 전 security/privacy review.
- High-risk deployment 전 release/rollback path.

## Status 언어

- Ready: scope, owner, acceptance criteria, verification이 명확합니다.
- Blocked: blocker와 unblock owner가 명확합니다.
- Needs triage: impact, scope, owner가 불명확합니다.
- Research: timeboxed evidence 없이는 decision을 내릴 수 없습니다.
- Deferred: 유효한 작업이지만 현재 priority window에 없습니다.
- Duplicate 또는 superseded: 살아남는 issue 또는 decision을 가리킵니다.

## 중단 조건

- Priority를 urgency 표현만으로 추론하고 있습니다.
- 필수 API, data, security, design decision이 아직 불명확한데 task를 ready로 표시합니다.
- Issue가 owner, scope, acceptance criteria, next action 없이 plan/worklog를 중복합니다.
