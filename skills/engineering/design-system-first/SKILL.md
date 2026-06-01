---
name: design-system-first
description: Use when a repository has shared UI components, design tokens, variants, or a design system that should be reused before custom styling.
---

# Design System First

Reuse shared components, tokens, and variants before writing custom styles.

## Workflow

1. Confirm available shared UI components, tokens, variables, variants, and documented design-system rules.
2. Search existing primitives before creating buttons, inputs, modals, cards, toasts, pagination, tabs, or toolbars.
3. Prefer component props, variants, slots, and tokens over custom CSS, utility overrides, or inline styles.
4. Add custom styling only when the design system lacks the needed state, density, layout, or responsive behavior.
5. Keep exceptions narrow and document why a custom style is needed when the deviation affects reuse.
6. Verify visible UI and common states when shared components or variants change.

## Coordination

Use `style-quality-review` for visual quality review. Use `css-class-first`, `utility-class-first`, or `inline-style-first` only for the custom styling layer that remains after design-system reuse.
