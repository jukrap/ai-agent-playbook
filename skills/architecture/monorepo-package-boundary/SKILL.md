---
name: monorepo-package-boundary
description: Use when changing or reviewing monorepo packages, workspace dependencies, package exports, internal libraries, build graphs, generated types, or cross-package release impact.
---

# Monorepo Package Boundary

Use this as the primary architecture skill for workspace, package, and internal library boundaries.

## Workflow

1. Identify workspaces, package manager, package ownership, public exports, internal/private modules, build graph, and affected consumers.
2. Check dependency direction, circular imports, versioning, generated types, release impact, and affected test/build selection.
3. Keep package boundaries aligned with ownership and runtime contracts rather than folder convenience.
4. Record affected packages, compatibility shims, required builds/tests, and release or publish constraints.

## Reference

Read `references/package-ownership-dependency-direction.md` for package ownership, imports, exports, and dependency direction.

Read `references/workspace-release-impact.md` for build graph, versioning, generated outputs, and affected verification.
