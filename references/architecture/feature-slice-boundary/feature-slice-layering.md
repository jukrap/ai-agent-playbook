# Feature and page boundaries

Use this reference when a change touches feature folders, routes, pages, or cross-module imports. Select the boundary model from the actual project decision; React or Vite alone does not imply FSD.

## Establish ownership

Identify the owner of UI, state, fetching, validation, API adapters, domain rules, tests, and fixtures. Inspect imports and public entrypoints alongside the accepted design. Folder names alone do not prove that dependencies follow it.

For architecture selection or a changed design, use [project architecture guidance](../../../docs/project-architecture.md). For cached/server state, consult [state ownership](../../frontend/frontend-state-data-flow/state-ownership.md) only when relevant.

## When the project chooses FSD

The usual non-deprecated order is app, pages, widgets, features, entities, shared. The [official layer reference](https://feature-sliced.design/docs/reference/layers) permits using only useful layers and keeping page-local UI and requests within a page slice. A feature extraction should serve meaningful reuse or ownership.

Do not universally limit pages to composition or prohibit page-owned requests. Follow the project's selected contract, including its public imports and exceptions. If that contract differs from standard FSD, name the difference instead of silently applying another structure.

## Change a boundary

- For a narrow behavior change, repair the affected ownership or dependency rather than reshuffling unrelated folders.
- Keep compatibility entrypoints or re-exports when existing callers need a staged transition.
- Move tests with the behavior they prove and keep test-only helpers out of production modules.
- Check reverse imports, cycles, private cross-module imports, and product behavior added to shared code against the actual project rules.
- Update the accepted decision and any configured boundary checks when an authorized change alters the contract.

An unresolved public-import or route-generator break needs a migration decision before that break is applied. It does not require stopping independent work. See [public API checks](slice-public-api-checks.md).
