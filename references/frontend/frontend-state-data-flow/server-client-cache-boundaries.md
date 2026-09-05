# Server Client Cache Boundaries

## Inventory

- Server source: endpoint, loader/action, server component, RPC call, GraphQL query, subscription, or static/generated payload.
- Client cache: query cache, router cache, normalized store, browser storage, in-memory module cache, service worker, or custom memoization.
- Invalidation trigger: mutation, route change, filter change, auth/tenant change, reconnect, focus, polling, or manual refresh.
- Freshness contract: stale time, cache key, pagination cursor, ETag/version, last updated time, and background refresh behavior.

## Review

- Cache keys must include all values that affect the result: user, role, tenant, locale, filters, pagination, feature flags, and permissions.
- Server validation and authorization remain authoritative even when the client has optimistic state.
- Optimistic updates need rollback on failure and reconciliation when the server returns a different shape.
- Background refresh should not overwrite active form drafts or user edits without a conflict rule.
- Infinite lists and pagination need duplicate, missing, resorted, and deleted item behavior.
- Realtime/event updates should be idempotent and tolerate out-of-order delivery.

## Verification

- Cache miss, cache hit, stale refresh, manual refresh, and reconnect/focus refresh.
- Mutation success, mutation failure, optimistic rollback, and server response reconciliation.
- Switching user, tenant, role, locale, or filter without stale cross-scope data.
- Pagination, sorting, search, and deleted/inserted item behavior.
- Race between slow old request and faster new request.

## Stop Conditions

- Cache key is incomplete for permissioned or tenant-scoped data.
- A stale response can overwrite newer user intent.
- Mutation side effects update only one of several visible caches.
- The repository has no reliable way to observe or test the target stale-data bug.
