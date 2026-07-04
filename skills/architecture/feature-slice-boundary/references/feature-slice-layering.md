# Feature Slice Layering

Use this when a change touches feature folders, route modules, UI slices, page modules, shared layers, or cross-slice imports.

## Boundary Evidence

- Identify the actual project convention: FSD, vertical slice, feature-first, route-first, layered, module-first, or mixed.
- Name the intended owner for UI, state, data fetching, validation, API calls, domain rules, tests, and fixtures.
- Check imports against local rules: lower layer to higher layer, feature to feature, shared to app, app to feature, and circular dependencies.
- Do not treat folder names as proof. Inspect imports, exports, tests, runtime behavior, and project docs.

## Change Safety

- Prefer small ownership repairs over broad reshuffles when the requested behavior is narrow.
- Keep compatibility paths or re-exports when callers would otherwise break.
- Move tests with the behavior they prove, and keep shared test helpers out of production modules.
- Route frontend state/data changes to `frontend/frontend-state-data-flow` when cache, optimistic update, or stale UI behavior changes.

## Stop Conditions

- The target architecture is assumed from a framework name rather than observed code.
- A slice imports private internals from another slice without an explicit compatibility reason.
- Shared/common modules gain product-specific behavior without ownership.
- The migration breaks public imports, generated routes, or test fixtures without a staged plan.
