# State Ownership

## Inventory

- Source of truth: backend response, URL, form library, router, server cache, client store, component state, browser storage, or derived calculation.
- Scope: single component, page, route segment, shared layout, tab/session, cross-window, or persisted user setting.
- Mutation path: user action, form submit, background refresh, websocket/event stream, optimistic update, retry, undo, or rollback.
- Rendering path: loading, empty, partial data, error, disabled, pending, stale, conflict, and success states.

## Review

- Keep one owner for each value. Duplicated local copies need synchronization rules or should become derived state.
- Derived state should be recomputed from stable inputs unless the repository has a clear memoization/cache convention.
- URL state is best for shareable filters, tabs, pagination, sort, and durable view state; avoid putting secrets or large payloads in it.
- Form draft state and committed server state are different; do not collapse them unless the workflow is actually instant-save.
- Persisted browser state needs versioning, reset behavior, privacy review, and multi-tab behavior.
- Global stores should have clear ownership and lifecycle; do not use them to bypass prop/API boundary confusion.

## Verification

- First load, refresh, navigation away/back, and direct URL entry.
- Mutation success, validation failure, network/server failure, retry, cancel, and duplicate-submit paths.
- Empty and partial-data states, especially when filters hide all rows or permissions remove fields.
- Back/forward behavior when URL state is involved.
- No stale UI after mutation, invalidation, or background refresh.

## Stop Conditions

- Multiple owners can write the same value and no conflict rule exists.
- Optimistic UI can display data the backend can never accept.
- A cache update can leak data across users, tenants, roles, or filters.
- Error or empty states are not renderable enough to verify the workflow.
