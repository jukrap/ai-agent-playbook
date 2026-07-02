# Acceptance Criteria And Open Questions

Acceptance criteria는 범위를 확인 가능하게 만들고, open question은 빈틈을 추측으로 채우지 않게 합니다.

## Acceptance Criteria 형태

각 기준은 다음을 말해야 합니다.

- 관련 actor 또는 system.
- Starting condition.
- Action 또는 trigger.
- Expected observable result.
- 관련된 error, empty, loading, permission, rollback, degraded state.
- Verification method: automated test, manual QA, data query, log/metric check, design review, stakeholder review.

## 피해야 할 기준

- Observable behavior 또는 contract source 없이 "API 구현"이라고만 쓰는 기준.
- Measurable target 또는 reviewer 없이 "개선"이라고만 쓰는 기준.
- 저장소가 이미 해당 architecture를 선택하지 않았는데 "framework X 사용"이라고 쓰는 기준.
- Ownership, migration order, compatibility window, rollback expectation 없이 "DB 업데이트"라고 쓰는 기준.
- 채택할 portable behavior를 추출하지 않고 "reference와 맞춤"이라고 쓰는 기준.

## Open Question 분류

- Product: user, workflow, priority, success measure, non-goal, release scope.
- Design: layout, copy, empty/error state, accessibility, responsive behavior, visual evidence.
- API/backend: endpoint, payload, DTO, auth, rate limit, error shape, idempotency.
- Data: source of truth, grain, schema, retention, quality, lineage, migration/backfill.
- Security/compliance: secret handling, privacy, authorization, audit, license, legal review.
- Operations: deploy gate, rollback, monitoring, support path, migration timing, owner.

## Promotion 규칙

검토된 criteria와 답변된 question만 durable project memory로 승격합니다. 해결되지 않은 question은 owner가 해결할 때까지 active plan, issue, `.ai-playbook/questions.md`에 둡니다.
