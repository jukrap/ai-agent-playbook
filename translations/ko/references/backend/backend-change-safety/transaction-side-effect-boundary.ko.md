# 트랜잭션과 부수 효과 경계

Database write와 event, queue, external API, file, email, billing, cache invalidation, audit가 함께 바뀔 때 사용합니다.

## 경계 목록

- durable state: table, document, object storage, queue record, ledger row, audit record, checkpoint.
- side effect: outbound API, email, notification, payment, webhook, event, file write, cache write, search index update.
- transaction owner: controller, service, repository, unit of work, ORM transaction, database procedure, workflow engine, external provider.
- recovery signal: idempotency key, unique constraint, operation id, outbox row, retry count, status field, compensation record.

## 설계 규칙

- 실제 outbox나 workflow transaction이 없다면 irreversible side effect를 DB transaction 안에 숨기지 않습니다.
- retry나 replay가 가능하면 외부 시스템 호출 전에 intent 또는 operation record를 먼저 남깁니다.
- Duplicate apply를 막기 위해 unique constraint, compare-and-set, idempotency key를 사용합니다.
- Crash point 전후로 복구할 수 있도록 state transition을 명시합니다.
- Controller, job, webhook이 서로 다른 lifecycle로 부르는 helper 안에 transaction behavior를 숨기지 않습니다.
- Cache invalidation, search indexing, audit logging도 관측 가능한 side effect로 봅니다.

## 실패 지점

| 실패 지점 | 기대 답 |
| --- | --- |
| durable write 전 | partial state 없이 재시도할 수 있습니다. |
| durable write 후 side effect 전 | job, outbox, repair path가 side effect를 완료하거나 취소합니다. |
| side effect 후 final status 전 | idempotency 또는 provider operation id가 중복 side effect를 막습니다. |
| batch item 처리 중 | 한 item 실패가 다른 item을 오염시키지 않습니다. |
| rollback 중 | compensation 또는 containment path가 명확합니다. |

## 검증

- 같은 operation id로 duplicate request/message를 테스트합니다.
- Provider transient failure 후 retry가 durable state를 중복 생성하지 않는지 확인합니다.
- 가능하면 partial status에서 resume되는 crash-like path를 확인합니다.
- Log/metric에 operation id, final state, attempt count, sanitized failure code가 있는지 확인합니다.
- 자동 복구가 없으면 manual repair 또는 replay command를 기록합니다.
