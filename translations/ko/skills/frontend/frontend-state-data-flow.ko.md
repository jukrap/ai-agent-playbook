# Frontend State Data Flow

State ownership와 data consistency 변경을 위한 primary frontend skill입니다.

## Workflow

1. Source of truth, derived state, server cache, local UI state, URL state, mutation boundary를 확인합니다.
2. 편집 전에 loading, empty, error, retry, cancellation, race, stale-data, optimistic-update path를 추적합니다.
3. 새 cache나 global store를 추가하기보다 repository의 기존 state/data primitive를 우선합니다.
4. First load, refresh, mutation success/failure, navigation, back/forward behavior 전반에서 user workflow를 검증합니다.

## Reference

Local, derived, shared, URL state 판단에는 `references/state-ownership.md`를 읽습니다.

Server cache, client cache, invalidation, optimistic update, stale data review에는 `references/server-client-cache-boundaries.md`를 읽습니다.
