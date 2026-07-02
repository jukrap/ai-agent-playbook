# Workspace Release Impact

Use this when package boundaries affect build order, tests, versioning, publishing, deployment, or release notes.

## Impact Inventory

- Workspaces, apps, packages, internal libraries, generated clients, schemas, examples, docs, and CI jobs affected.
- Package manager and tooling: npm, pnpm, yarn, bun, Turborepo, Nx, Rush, Lage, Gradle, Maven, .NET solution, or custom scripts.
- Build graph, test graph, typecheck graph, dependency graph, and release graph may differ. Check the one that matches the change.
- Changelog, version bump, package publish, app deploy, and compatibility notes when public APIs change.

## Verification

- Prefer repository-defined affected commands when they exist.
- Run or name package-level build, typecheck, test, lint, and integration checks according to blast radius.
- Check generated outputs and committed artifacts before release.
- Record skipped packages and why they are safe to skip.

## Stop Conditions

- A public package API changes without downstream caller inventory.
- A generated type/client/schema change is not reproducible by documented commands.
- Affected package selection is guessed rather than derived from workspace tooling or dependency evidence.
- Release or deployment impact crosses package boundaries without owner or rollback notes.
