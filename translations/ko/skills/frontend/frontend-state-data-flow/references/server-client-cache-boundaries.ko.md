# Server Client Cache Boundaries

## Inventory

- Server source: endpoint, loader/action, server component, RPC call, GraphQL query, subscription, static/generated payload.
- Client cache: query cache, router cache, normalized store, browser storage, in-memory module cache, service worker, custom memoization.
- Invalidation trigger: mutation, route change, filter change, auth/tenant change, reconnect, focus, polling, manual refresh.
- Freshness contract: stale time, cache key, pagination cursor, ETag/version, last updated time, background refresh behavior.

## Review

- Cache key에는 결과에 영향을 주는 모든 값이 들어가야 합니다: user, role, tenant, locale, filter, pagination, feature flag, permission.
- Client에 optimistic state가 있더라도 server validation과 authorization이 authoritative입니다.
- Optimistic update에는 failure rollback과 server가 다른 shape를 반환했을 때 reconciliation이 필요합니다.
- Background refresh는 conflict rule 없이 active form draft나 user edit를 덮어쓰면 안 됩니다.
- Infinite list와 pagination은 duplicate, missing, resorted, deleted item behavior가 필요합니다.
- Realtime/event update는 idempotent해야 하고 out-of-order delivery를 견뎌야 합니다.

## Verification

- Cache miss, cache hit, stale refresh, manual refresh, reconnect/focus refresh.
- Mutation success, mutation failure, optimistic rollback, server response reconciliation.
- User, tenant, role, locale, filter 전환 시 stale cross-scope data가 없는지 확인합니다.
- Pagination, sorting, search, deleted/inserted item behavior.
- 느린 old request와 빠른 new request 사이의 race.

## Stop Conditions

- Permission 또는 tenant-scoped data의 cache key가 불완전합니다.
- Stale response가 더 최신 user intent를 덮어쓸 수 있습니다.
- Mutation side effect가 여러 visible cache 중 하나만 업데이트합니다.
- Target stale-data bug를 관찰하거나 테스트할 신뢰 가능한 방법이 없습니다.
