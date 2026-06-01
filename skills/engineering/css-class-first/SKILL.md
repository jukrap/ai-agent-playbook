---
name: css-class-first
description: Use when a repository explicitly prefers stylesheets, CSS modules, scoped CSS, or semantic class names for UI styling.
---

# CSS Class First

Follow stylesheet and semantic class conventions before adding inline styles.

## Workflow

1. Confirm the CSS/class-first convention from project docs, existing code, or the user's request.
2. Inspect existing stylesheets, CSS modules, scoped styles, tokens, and naming patterns.
3. Put reusable layout, variants, pseudo selectors, media queries, and container queries in CSS/classes.
4. Keep inline styles limited to values that are genuinely component-local, dynamic, or state-derived.
5. Avoid introducing a new CSS methodology when the project already has one.
6. Verify rendered behavior when visible layout or responsive behavior changes.

## Coordination

Use `style-quality-review` for general UI polish and `design-system-first` when shared components or tokens should own the styling.
