# Domain Modeling Boundaries

Use this when a change affects business rules, domain concepts, invariants, workflows, policies, or object lifecycles.

## Domain Evidence

- Name the domain concept and where it lives today: entity, aggregate, value object, service, policy, workflow, use case, command, query, or transaction script.
- Identify invariants, lifecycle transitions, allowed states, validation ownership, and side effects.
- Check whether persistence, transport, UI, or framework types have leaked into domain rules.
- Compare terms with project glossary, specs, tests, database schema, API contracts, and user-facing language.

## Change Safety

- Preserve existing domain vocabulary unless the change intentionally renames a concept.
- Keep entity identity, equality, validation, and lifecycle rules explicit.
- Route API payload changes to `backend/api-contract-boundary` and data repair/backfill work to `data/data-migration-integrity`.
- When the project is not using DDD, still record where the business rule is owned and how callers verify it.

## Stop Conditions

- A domain rule is duplicated across UI, controller, job, and persistence layers without an owner.
- A persistence schema change is treated as a domain change without migration or compatibility review.
- An invariant changes without tests or examples showing old and new behavior.
- The domain term being changed is ambiguous or conflicts with project vocabulary.
