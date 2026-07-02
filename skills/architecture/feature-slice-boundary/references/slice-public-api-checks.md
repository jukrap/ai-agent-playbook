# Slice Public API Checks

Use this when a boundary is expressed through index files, barrel exports, route loaders, feature APIs, component libraries, or shared modules.

## Public API Review

- Identify what callers are supposed to import and what must remain private.
- Check index/barrel exports, route files, generated API files, package exports, module aliases, and path mapping.
- Confirm names, types, defaults, side effects, CSS/assets, and tree-shaking behavior when they are part of the public surface.
- Record callers that need migration and whether re-export compatibility is required.

## Migration Notes

- For FSD or feature-sliced migrations, define the next safe slice, not the final ideal tree.
- Keep adapter files when old imports are widespread and behavior must stay stable.
- Avoid moving files only to satisfy a taxonomy if dependency direction and ownership do not improve.
- Use `boundary-review` for broad architecture decisions and `monorepo-package-boundary` when the public API crosses workspace packages.

## Stop Conditions

- Public imports are removed without caller inventory.
- A shared barrel starts exporting unstable implementation details.
- Generated files or framework route conventions are moved without verifying the generator/runtime.
- Boundary documentation contradicts actual import behavior.
