---
name: legacy-feature-addition
description: Use when adding new behavior, screens, fields, business rules, or integrations to a legacy system without rewriting the surrounding architecture.
---

# Legacy Feature Addition

Add the feature through the existing seams and leave the rest of the system recognizable.

## Workflow

1. Map the current flow end to end: UI, validation, state, API/server, persistence, and deploy path.
2. Find the nearest existing pattern for the same kind of feature.
3. Extend data contracts deliberately; do not guess field names or server behavior.
4. Keep new code scoped to the feature unless shared behavior is genuinely required.
5. Verify happy path, validation/failure path, and at least one adjacent existing flow.

## Guardrails

- Avoid introducing a new architecture style for one feature.
- Avoid hidden mock fallback in remote/API features.
- Keep styling consistent with the legacy UI, including inline style preference when that is the local rule.
- Document unfinished backend or product decisions as blockers, not fake-complete behavior.

## Reference

Read `references/feature-slice-in-legacy.md` before adding fields, screens, integrations, or business rules to an existing legacy flow.
