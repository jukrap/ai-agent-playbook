# Credential Webhook Error Handling

Use this when connector behavior touches credentials, webhooks, retries, or user-facing errors.

## Credentials And Secrets

- Check credential references, auth helper usage, OAuth/OIDC redirect handling, token refresh, scope changes, and secret storage.
- Keep credentials out of logs, fixtures, snapshots, worklogs, and generated docs.
- Verify missing, expired, revoked, insufficient-scope, and malformed credential behavior.
- Confirm permission widening is documented and reviewed before release.

## Webhooks And Async Flows

- Verify lifecycle operations: register, verify/check, update, delete, retry, dedupe, and disabled-state behavior.
- Check signature validation, replay protection, idempotency keys, ordering assumptions, and partial failure recovery.
- Confirm polling, queue, background job, and sync flows expose enough status for triage.

## Error Handling

- Wrap external errors in project-standard user-facing errors without losing HTTP/status/context needed for diagnosis.
- Distinguish retryable, permanent, auth, permission, rate-limit, validation, and remote outage failures.
- Avoid retry storms; respect backoff, rate limits, cancellation, and timeout conventions.
- Record verification for happy path, auth failure, permission failure, rate limit or retry path, and malformed payload when practical.
