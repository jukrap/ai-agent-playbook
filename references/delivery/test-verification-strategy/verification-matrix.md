# Verification Matrix

Use this matrix to turn a change into concrete evidence.

## Common Mappings

- Pure function or parser: unit test, fixture sample, edge cases, type check.
- API contract or DTO: contract test, schema example, client/server compatibility check.
- UI state or flow: component/unit test, browser smoke, accessibility keyboard path, loading/empty/error states.
- Database or migration: dry run, before/after counts, rollback check, application compatibility.
- Background job or queue: integration test, retry/idempotency check, sample payload, monitoring signal.
- Deployment or config: CI, build artifact identity, environment diff, smoke check, rollback readiness.
- Security-sensitive change: positive path, denial path, expired/invalid credential, cross-role or cross-tenant check.

## Evidence Rules

- Prefer repository scripts and documented commands.
- Do not invent command results, screenshots, staging status, or scanner output.
- If a check is too expensive, explain the cheaper substitute and the remaining risk.
- Generated runtime hints are navigation evidence, not proof that behavior is correct.

