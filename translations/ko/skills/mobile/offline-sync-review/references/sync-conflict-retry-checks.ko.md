# Sync Conflict Retry Checks

Mobile sync가 server contract, retry, idempotency, conflict handling에 의존할 때 사용합니다.

## Sync Contract

- Sync endpoint, payload shape, server version, cursor, pagination, delta token, idempotency key, conflict marker, server reconciliation response.
- Retry policy, backoff, timeout, cancellation, auth refresh, rate limit, partial success, terminal failure behavior.
- Conflict rule: last-write-wins, merge, user choice, server authoritative, client authoritative, manual repair.
- Multi-device, multi-session, duplicate submission, app update, stale local schema behavior.

## Verification

- Feature가 지원하면 success, retry, duplicate, conflict, auth-expired, server-error path를 최소 하나씩 실행합니다.
- 각 sync stage 뒤 local state, server state, pending queue, visible UI를 비교합니다.
- 같은 queued operation replay 또는 simulated failure 뒤 retry로 idempotency를 확인합니다.
- Secret이나 personal payload를 노출하지 않는 reconciliation query, API response sample, log marker, manual evidence를 기록합니다.

## Stop Conditions

- API contract가 backend 또는 contract review 없이 바뀌었습니다.
- Retry가 purchase, submission, message, upload, destructive action을 중복시킬 수 있습니다.
- Conflict behavior가 정의되지 않았거나 client와 server가 다르게 처리합니다.
- Auth refresh, expired session, tenant/object access failure가 sync path에서 처리되지 않습니다.
