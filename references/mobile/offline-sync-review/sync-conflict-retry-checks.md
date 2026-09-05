# Sync Conflict Retry Checks

Use this when mobile sync depends on server contracts, retries, idempotency, or conflict handling.

## Sync Contract

- Sync endpoint, payload shape, server version, cursor, pagination, delta token, idempotency key, conflict marker, and server reconciliation response.
- Retry policy, backoff, timeout, cancellation, auth refresh, rate limits, partial success, and terminal failure behavior.
- Conflict rules: last-write-wins, merge, user choice, server authoritative, client authoritative, or manual repair.
- Multi-device, multi-session, duplicate submission, app update, and stale local schema behavior.

## Verification

- Run at least one success, retry, duplicate, conflict, auth-expired, and server-error path when the feature supports them.
- Compare local state, server state, pending queue, and visible UI after each sync stage.
- Check idempotency by replaying the same queued operation or retrying after a simulated failure.
- Record reconciliation query, API response sample, log marker, or manual evidence without exposing secrets or personal payloads.

## Stop Conditions

- API contract changed without backend or contract review.
- Retry can duplicate purchases, submissions, messages, uploads, or destructive actions.
- Conflict behavior is not defined or differs between client and server.
- Auth refresh, expired sessions, or tenant/object access failures are not handled in the sync path.
