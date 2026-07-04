---
name: legacy-change-safety
description: Use when changing legacy code where compatibility, hidden coupling, generated files, deployment shape, or regression risk matters more than modernization.
---

# Legacy Change Safety

Use this as the primary legacy skill for compatibility-first changes.

## Workflow

1. Establish current behavior before changing code.
2. Identify hidden coupling across files, scripts, generated assets, deployment descriptors, database artifacts, and manual operations.
3. Make the smallest behavior-preserving change that satisfies the request.
4. Verify the old path and the new path, then record risk and rollback notes.

## Reference

Read `references/legacy-change-control.md` for the compatibility-first change sequence.

Read `references/legacy-compatibility-map.md` when hidden runtime, data, deployment, or manual-operation coupling may affect the change.
