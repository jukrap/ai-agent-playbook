---
name: inline-style-first
description: Use when a repository explicitly prefers component-local inline styles for UI work, or when the user asks to follow an inline-style-first convention.
---

# Inline Style First

Follow explicit inline-style-first conventions without redesigning the UI.

## Workflow

1. Confirm the inline-style-first convention from project docs, existing code, or the user's request.
2. Inspect current component styling, shared primitives, tokens, and CSS/class usage before editing.
3. Use inline style objects for component-local, dynamic, or state-derived values.
4. Keep shared tokens, layout classes, and design-system variants when the project already relies on them.
5. Avoid broad CSS/class refactors unless needed to remove a concrete conflict.
6. Verify the rendered UI when visible behavior changes.

## Coordination

Use `style-quality-review` for general UI polish, responsive checks, overflow fixes, and visual regression review.
