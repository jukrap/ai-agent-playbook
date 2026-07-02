# State Ownership

## Inventory

- Source of truth: backend response, URL, form library, router, server cache, client store, component state, browser storage, derived calculation.
- Scope: single component, page, route segment, shared layout, tab/session, cross-window, persisted user setting.
- Mutation path: user action, form submit, background refresh, websocket/event stream, optimistic update, retry, undo, rollback.
- Rendering path: loading, empty, partial data, error, disabled, pending, stale, conflict, success state.

## Review

- 각 값에는 하나의 owner를 둡니다. 중복 local copy는 synchronization rule이 필요하거나 derived state여야 합니다.
- Derived state는 repository에 명확한 memoization/cache convention이 없는 한 stable input에서 다시 계산합니다.
- URL state는 공유 가능한 filter, tab, pagination, sort, durable view state에 적합합니다. Secret이나 큰 payload는 넣지 않습니다.
- Form draft state와 committed server state는 다릅니다. Workflow가 실제 instant-save가 아니라면 합치지 않습니다.
- Persisted browser state에는 versioning, reset behavior, privacy review, multi-tab behavior가 필요합니다.
- Global store는 명확한 ownership과 lifecycle이 있어야 합니다. Prop/API boundary 혼란을 우회하는 용도로 쓰지 않습니다.

## Verification

- First load, refresh, navigation away/back, direct URL entry.
- Mutation success, validation failure, network/server failure, retry, cancel, duplicate-submit path.
- Empty와 partial-data state, 특히 filter가 모든 row를 숨기거나 permission이 field를 제거하는 경우.
- URL state가 있을 때 back/forward behavior.
- Mutation, invalidation, background refresh 이후 stale UI가 없는지 확인합니다.

## Stop Conditions

- 여러 owner가 같은 값을 쓸 수 있고 conflict rule이 없습니다.
- Optimistic UI가 backend가 절대 수락할 수 없는 data를 표시할 수 있습니다.
- Cache update가 user, tenant, role, filter 사이에 data를 leak할 수 있습니다.
- Error 또는 empty state가 workflow를 검증할 만큼 render되지 않습니다.
