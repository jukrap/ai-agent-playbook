# Offline Sync Review

Offline, cache, queue, sync correctness를 위한 primary mobile skill입니다.

## Workflow

1. Local storage, secure storage, cache ownership, queued operation, sync API, conflict rule, retry/backoff, idempotency key를 매핑합니다.
2. 관련되는 경우 online, offline, network transition, app restart, duplicate submission, partial failure, stale server state, conflict path를 테스트합니다.
3. API payload 또는 idempotency 변경은 `backend/api-contract-boundary`로, access token 또는 secure-storage risk는 `security/auth-access-control`로 라우팅합니다.
4. Data-loss risk, replay evidence, reconciliation check, skipped scenario, recovery 또는 repair step을 기록합니다.

## Reference

Local cache, durable queue, secure storage, persistence review에는 `references/offline-storage-and-queue-checks.md`를 읽습니다.

Sync contract, conflict, retry, idempotency, reconciliation check에는 `references/sync-conflict-retry-checks.md`를 읽습니다.
