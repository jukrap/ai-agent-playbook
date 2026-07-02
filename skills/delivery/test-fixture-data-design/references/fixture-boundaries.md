# Fixture Boundaries

Use this when choosing how test data should be represented.

## Fixture Types

- Inline sample: best for tiny pure functions and edge cases.
- Factory or builder: best when many tests need valid objects with small variations.
- Contract example: best for API, event, queue, and integration boundaries.
- Seed or test database: best when query behavior, migration compatibility, or realistic joins matter.
- Mock or fake: best when the external dependency is slow, costly, nondeterministic, or unavailable.
- Snapshot or golden file: best for stable structured output where diffs are readable and intentional.

## Boundaries

- Put fixture ownership near the behavior or contract it protects.
- Avoid one global fixture that every test mutates.
- Avoid mocks that know more than the public contract.
- Keep personally identifying, customer, credential, and production data out of fixtures.
- Prefer portable relative fixture paths and deterministic sample values.

