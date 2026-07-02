---
name: frontend-state-data-flow
description: Use when changing frontend state ownership, server/client cache behavior, data fetching, optimistic updates, URL state, loading/error/empty states, or stale UI bugs.
---

# Frontend State Data Flow

Use this as the primary frontend skill for state ownership and data consistency changes.

## Workflow

1. Identify the source of truth, derived state, server cache, local UI state, URL state, and mutation boundary.
2. Trace loading, empty, error, retry, cancellation, race, stale-data, and optimistic-update paths before editing.
3. Prefer the repository's existing state/data primitives over adding another cache or global store.
4. Verify the user workflow across first load, refresh, mutation success/failure, navigation, and back/forward behavior.

## Reference

Read `references/state-ownership.md` for local, derived, shared, and URL state decisions.

Read `references/server-client-cache-boundaries.md` for server cache, client cache, invalidation, optimistic updates, and stale data review.
