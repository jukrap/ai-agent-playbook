# Credential Webhook Error Handling

Connector behavior가 credential, webhook, retry, user-facing error를 건드릴 때 사용합니다.

## Credentials And Secrets

- Credential reference, auth helper usage, OAuth/OIDC redirect handling, token refresh, scope change, secret storage를 확인합니다.
- Credential은 log, fixture, snapshot, worklog, generated doc에서 제외합니다.
- Missing, expired, revoked, insufficient-scope, malformed credential behavior를 검증합니다.
- Permission widening은 release 전에 문서화하고 review합니다.

## Webhooks And Async Flows

- Register, verify/check, update, delete, retry, dedupe, disabled-state behavior 같은 lifecycle operation을 검증합니다.
- Signature validation, replay protection, idempotency key, ordering assumption, partial failure recovery를 확인합니다.
- Polling, queue, background job, sync flow가 triage에 충분한 status를 노출하는지 확인합니다.

## Error Handling

- External error는 진단에 필요한 HTTP/status/context를 잃지 않으면서 project-standard user-facing error로 감쌉니다.
- Retryable, permanent, auth, permission, rate-limit, validation, remote outage failure를 구분합니다.
- Retry storm을 피하고 backoff, rate limit, cancellation, timeout convention을 지킵니다.
- 가능하면 happy path, auth failure, permission failure, rate limit 또는 retry path, malformed payload의 verification을 기록합니다.
