---
name: utility-class-first
description: Use when a repository explicitly prefers utility-first CSS, Tailwind-style classes, or atomic class composition for UI styling.
---

# Utility Class First

Follow utility-first class conventions without inventing parallel CSS systems.

## Workflow

1. Confirm the utility-class-first convention from project docs, existing code, or the user's request.
2. Inspect existing utility class patterns, configured tokens, responsive prefixes, variants, and component wrappers.
3. Compose layout, spacing, color, typography, and state styling with existing utilities.
4. Extract a shared component only when repeated utility combinations create real duplication or review cost.
5. Avoid one-off CSS files or inline style objects for values already covered by utilities.
6. Verify responsive and state behavior when visible UI changes.

## Coordination

Use `style-quality-review` for visual quality checks and `design-system-first` when the repository has shared components that wrap utility classes.
