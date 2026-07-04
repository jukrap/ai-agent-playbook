---
name: design-system-handoff
description: Use when turning Figma, brand, design-token, component-library, theme, variant, or visual-spec guidance into maintainable frontend implementation.
---

# Design System Handoff

Use this as the primary frontend skill for converting design guidance into repository-native UI primitives, tokens, variants, and verification evidence.

## Workflow

1. Identify the source design artifact, existing component system, token model, theme boundary, accessibility requirements, and screens/states to implement.
2. Map design intent to existing primitives, variants, slots, tokens, and CSS conventions before adding one-off styling.
3. Separate durable design-system changes from screen-local composition, experiment-only styling, and copied reference visuals.
4. Verify rendered states across supported themes, breakpoints, density/content variation, interaction states, and accessibility constraints.

## Reference

Read `references/design-token-handoff.md` for token, theme, naming, ownership, and fallback rules.

Read `references/component-system-adoption.md` for component variants, composition, migration, visual QA, and adoption boundaries.
