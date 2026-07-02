---
name: offline-sync-review
description: Use when changing or reviewing mobile offline mode, local cache, durable queues, sync jobs, conflict resolution, retries, idempotency, or network transition behavior.
---

# Offline Sync Review

Use this as the primary mobile skill for offline, cache, queue, and sync correctness.

## Workflow

1. Map local storage, secure storage, cache ownership, queued operations, sync APIs, conflict rules, retry/backoff, and idempotency keys.
2. Test online, offline, network transition, app restart, duplicate submission, partial failure, stale server state, and conflict paths when relevant.
3. Route API payload or idempotency changes to `backend/api-contract-boundary` and access-token or secure-storage risk to `security/auth-access-control`.
4. Record data-loss risk, replay evidence, reconciliation checks, skipped scenarios, and recovery or repair steps.

## Reference

Read `references/offline-storage-and-queue-checks.md` for local cache, durable queue, secure storage, and persistence review.

Read `references/sync-conflict-retry-checks.md` for sync contracts, conflicts, retries, idempotency, and reconciliation checks.
