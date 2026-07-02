# Domain Modeling Boundaries

변경이 business rule, domain concept, invariant, workflow, policy, object lifecycle에 영향을 줄 때 사용합니다.

## Domain Evidence

- Domain concept와 현재 위치를 명시합니다. Entity, aggregate, value object, service, policy, workflow, use case, command, query, transaction script 중 무엇인지 봅니다.
- Invariant, lifecycle transition, allowed state, validation ownership, side effect를 확인합니다.
- Persistence, transport, UI, framework type이 domain rule로 새어 들어왔는지 확인합니다.
- Project glossary, spec, test, database schema, API contract, user-facing language와 용어를 비교합니다.

## Change Safety

- 변경이 의도적으로 concept 이름을 바꾸는 것이 아니라면 기존 domain vocabulary를 보존합니다.
- Entity identity, equality, validation, lifecycle rule은 명시적으로 유지합니다.
- API payload 변경은 `backend/api-contract-boundary`로, data repair/backfill은 `data/data-migration-integrity`로 라우팅합니다.
- Project가 DDD를 쓰지 않아도 business rule owner와 caller verification 방식을 기록합니다.

## Stop Conditions

- Domain rule이 owner 없이 UI, controller, job, persistence layer에 중복됩니다.
- Persistence schema 변경이 migration 또는 compatibility review 없이 domain change로만 취급됩니다.
- Invariant가 바뀌었지만 old/new behavior를 보여주는 test나 example이 없습니다.
- 변경되는 domain term이 모호하거나 project vocabulary와 충돌합니다.
