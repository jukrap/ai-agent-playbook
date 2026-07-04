# UI Style Quality

Use this guide when reviewing or improving UI styling, responsive behavior, CSS structure, inline styles, layout overflow, or visual regressions without changing product intent.

## Preserve intent

- Do not redesign unless asked.
- Keep density, hierarchy, workflow ergonomics, and local visual language consistent.
- For operational tools, prefer clear scanning and repeated-use ergonomics over decorative composition.

## Style policy

Choose the styling method from project evidence:

- Design system first: shared components, tokens, variants, slots, or UI primitives exist.
- CSS/class first: stylesheets, CSS modules, scoped CSS, or semantic classes are the convention.
- Utility first: Tailwind-style utilities or atomic classes are the convention.
- Inline style first: component-local inline style objects are explicitly preferred.

If no explicit policy exists, follow the local component pattern and avoid introducing a parallel styling system.

## Check

- mobile, tablet, and desktop overflow
- long labels, table cells, buttons, modals, and navigation items
- loading, empty, error, disabled, selected, and focus states
- CSS cascade and specificity risks
- duplicated values and inconsistent spacing
- shared primitive bypasses
- unnecessary cards, card nesting, or decorative structure

Verify visible UI in a browser, simulator, screenshot, or rendered artifact when the task changes visible behavior.
