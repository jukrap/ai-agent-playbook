# Package Ownership Dependency Direction

Use this when a change crosses packages, apps, libraries, plugins, generated clients, or shared workspace modules.

## Ownership Checks

- Identify package owner, intended consumers, public exports, private internals, generated outputs, and runtime responsibility.
- Check package manifests, workspace config, path aliases, TypeScript project references, package exports, and build scripts.
- Inspect import direction, forbidden dependencies, circular imports, peer dependencies, dev dependencies, and optional/runtime dependencies.
- Confirm whether a shared package is truly generic or has gained product-specific behavior.

## Boundary Risks

- Cross-package imports from source internals can bypass build, type, or release contracts.
- Barrel exports can accidentally publish unstable implementation details.
- Generated clients and schemas must match the producing service or package version.
- Package boundaries should route connector or artifact publishing concerns to `backend/connector-integration-change` or `devops/package-publish-readiness`.

## Stop Conditions

- A package consumes another package's private source path instead of a public export.
- A dependency cycle appears or an existing cycle is widened.
- A shared package gains hidden app-specific configuration or side effects.
- Version, build, or generated output impact is unknown for downstream consumers.
