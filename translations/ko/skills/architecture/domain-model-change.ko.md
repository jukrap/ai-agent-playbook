# Domain Model Change

Domain model과 application boundary 변경을 위한 primary architecture skill입니다.

## Workflow

1. Code에서 project domain style을 확인합니다. DDD, clean architecture, hexagonal, layered service, active record, transaction script, mixed 중 무엇인지 봅니다.
2. Invariant ownership, transaction boundary, persistence boundary, DTO/domain mapping, event/message, integration adapter를 찾습니다.
3. Project가 의도적으로 더 단순한 pattern을 쓰는 경우가 아니라면 domain rule이 UI, controller, persistence, transport code로 새지 않게 합니다.
4. Changed invariant, compatibility risk, persistence effect, verification coverage를 기록합니다.

## Reference

Entity, aggregate, value object, service, policy, invariant ownership에는 `references/domain-modeling-boundaries.md`를 읽습니다.

Use case, repository, adapter, DTO mapping, transaction, infrastructure boundary에는 `references/application-domain-infrastructure.md`를 읽습니다.
