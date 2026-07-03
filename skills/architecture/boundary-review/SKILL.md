---
name: boundary-review
description: Use when reviewing architecture boundaries, FSD layers, DDD modules, monorepo package ownership, dependency direction, or cross-module coupling.
---

# Boundary Review

Use this as the primary architecture skill for module and layer boundaries.

## Workflow

1. Identify the intended architecture boundary from code, docs, package layout, and imports.
2. Check dependency direction, public APIs, shared utilities, feature ownership, and data flow.
3. Prefer local conventions over forcing a new architecture.
4. Recommend small boundary repairs before broad restructuring unless the user asks for redesign.

## Reference

Read `references/boundary-redesign-protocol.md` when deciding whether to keep local conventions, apply FSD/DDD/layered rules, split packages, or propose a broader restructure.
