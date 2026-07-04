# Verification Matrix

변경을 구체적인 evidence로 바꿀 때 사용합니다.

## Common Mappings

- Pure function 또는 parser: unit test, fixture sample, edge case, type check.
- API contract 또는 DTO: contract test, schema example, client/server compatibility check.
- UI state 또는 flow: component/unit test, browser smoke, accessibility keyboard path, loading/empty/error state.
- Database 또는 migration: dry run, before/after count, rollback check, application compatibility.
- Background job 또는 queue: integration test, retry/idempotency check, sample payload, monitoring signal.
- Deployment 또는 config: CI, build artifact identity, environment diff, smoke check, rollback readiness.
- Security-sensitive change: positive path, denial path, expired/invalid credential, cross-role 또는 cross-tenant check.

## Evidence Rules

- Repository script와 documented command를 우선합니다.
- Command result, screenshot, staging status, scanner output을 지어내지 않습니다.
- Check가 너무 비싸면 더 싼 substitute와 remaining risk를 설명합니다.
- Generated runtime hint는 탐색 evidence이지 behavior correctness의 증명이 아닙니다.

