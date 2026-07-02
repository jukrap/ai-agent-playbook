# Application Domain Infrastructure

Use this when application use cases, repositories, adapters, infrastructure clients, DTOs, transactions, or message boundaries change.

## Boundary Review

- Application layer: use cases, commands, queries, orchestration, transaction start/end, authorization checks, and idempotency.
- Domain layer: rules, policies, invariants, value objects, domain events, and state transitions.
- Infrastructure layer: repositories, ORMs, HTTP clients, queues, files, caches, schedulers, and external services.
- Transport layer: controllers, routes, jobs, handlers, serializers, DTOs, and view models.

## Integration Checks

- Repository interfaces should reflect domain needs, not leak ORM query builders unless that is the local convention.
- DTOs and persistence models should map at a clear boundary.
- Transactions should cover the invariant they protect and avoid hidden cross-service coupling.
- Domain events, messages, and webhooks should name ordering, retry, idempotency, and compatibility behavior.

## Stop Conditions

- Domain code depends on framework or infrastructure types without a documented local convention.
- Transaction scope is unclear for a changed invariant.
- Repository, adapter, or DTO changes alter API/persistence behavior without contract tests or examples.
- Event/message compatibility is unknown for existing producers or consumers.
