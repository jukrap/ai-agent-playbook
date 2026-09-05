# Public interfaces across modules

Use this when a boundary is expressed through index files, exports, route loaders, feature APIs, component libraries, or shared modules.

## Inspect the contract

- Identify what callers may import and what remains private.
- Inspect exports, routes, generated API files, aliases, package exports, and path mapping.
- Preserve names, types, defaults, side effects, CSS/assets, and tree-shaking behavior when they are part of the public contract.
- Identify callers needing migration and whether a compatibility re-export is useful.

## Evolve the boundary

For a migration, choose a useful next portion rather than moving everything to an ideal final tree. Keep adapters while callers transition. A folder rename alone does not establish a better dependency direction or owner.

Use [architecture decisions](../../../docs/project-architecture.md) when the accepted design changes and [package boundaries](../monorepo-package-boundary/package-ownership-dependency-direction.md) when the interface crosses workspace packages.

Before removing an entrypoint, account for its callers. Before moving generated routes or files, verify the generator and runtime. If documentation and imports disagree, record the gap and resolve the relevant contract; do not silently promote current code into the intended design.
