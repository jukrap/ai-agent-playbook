---
name: feature-slice-boundary
description: Use when changing or reviewing FSD, feature-sliced, vertical-slice, feature-first, route-level, module-level, or component-domain boundaries.
---

# Feature Slice Boundary

Use this as the primary architecture skill for feature, slice, route, and module boundaries.

## Workflow

1. Identify the project architecture from code and docs before applying FSD, vertical slice, feature-first, or layered labels.
2. Check allowed imports, public API files, shared/common usage, state ownership, UI/API boundaries, and test placement.
3. Preserve local conventions unless the requested change explicitly includes migration or redesign.
4. Record coupling risks, moved ownership, compatibility shims, and verification commands.

## Reference

Read `references/feature-slice-layering.md` for feature, layer, slice, and dependency direction checks.

Read `references/slice-public-api-checks.md` for public API files, shared modules, and migration safety.
