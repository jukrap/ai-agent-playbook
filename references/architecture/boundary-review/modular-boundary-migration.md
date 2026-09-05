# Modular Boundary Migration

Use this reference when a boundary repair needs staged moves, adapters, shims, import rules, or package ownership changes.

## Migration Shape

1. Freeze the current behavior with tests, screenshots, contracts, or runtime evidence.
2. Identify the smallest public surface that callers should use after the migration.
3. Add adapter or facade entrypoints before moving internals.
4. Move files without behavior changes where possible.
5. Update imports to public entrypoints and keep temporary compatibility shims when callers are broad.
6. Add boundary checks, lint rules, package exports, or documentation only where the repository can maintain them.
7. Remove shims only after search and tests prove old imports are gone.

## Boundary Evidence

- Import graph or `rg` search for deep imports.
- Package exports, aliases, tsconfig paths, barrel files, route registration, and dependency manifests.
- Test ownership: which package or feature owns regression tests after the move.
- Runtime ownership: which process, route, worker, or deploy artifact loads the module.

## Risk Controls

- Keep behavior changes separate from move-only changes unless the user explicitly accepts the risk.
- Do not create a new shared bucket for code that has one owner.
- Keep adapters narrow and remove them when they no longer protect compatibility.
- Record migration status in project docs when multiple phases are required.

## Verification

- Build/typecheck/import-lint for the moved boundary.
- Existing tests for callers and moved modules.
- Search for old paths and forbidden deep imports.
- Runtime smoke for the primary entrypoint.
- Worklog or ADR if the migration changes ownership or architecture rules.
