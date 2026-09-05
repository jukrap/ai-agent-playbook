# Application Domain Infrastructure

Application use case, repository, adapter, infrastructure client, DTO, transaction, message boundary가 바뀔 때 사용합니다.

## Boundary Review

- Application layer: use case, command, query, orchestration, transaction start/end, authorization check, idempotency.
- Domain layer: rule, policy, invariant, value object, domain event, state transition.
- Infrastructure layer: repository, ORM, HTTP client, queue, file, cache, scheduler, external service.
- Transport layer: controller, route, job, handler, serializer, DTO, view model.

## Integration Checks

- Repository interface는 local convention이 아니라면 ORM query builder를 누출하지 말고 domain need를 반영해야 합니다.
- DTO와 persistence model은 명확한 boundary에서 mapping되어야 합니다.
- Transaction은 보호하는 invariant를 포함해야 하며 hidden cross-service coupling을 피해야 합니다.
- Domain event, message, webhook은 ordering, retry, idempotency, compatibility behavior를 명시해야 합니다.

## Stop Conditions

- Domain code가 documented local convention 없이 framework 또는 infrastructure type에 의존합니다.
- 변경된 invariant의 transaction scope가 불명확합니다.
- Repository, adapter, DTO 변경이 contract test나 example 없이 API/persistence behavior를 바꿉니다.
- 기존 producer 또는 consumer에 대한 event/message compatibility가 불명확합니다.
