# Style Review Checklist

## Preserve intent

- Do not redesign unless asked.
- Do not add decorative layouts to operational tools without product reason.
- Keep visual hierarchy, density, and workflow ergonomics consistent.

## Check

- overflow at mobile/tablet/desktop widths
- long text, labels, table cells, buttons, modals
- loading, empty, error, disabled, selected states
- CSS cascade and specificity
- duplicated values and inconsistent spacing
- shared primitive bypasses
- card nesting or unnecessary decoration

## Style policy selection

- Design system first: shared components, tokens, variants, slots, and reusable UI primitives exist.
- CSS/class first: stylesheets, CSS modules, scoped CSS, or semantic class names are the project convention.
- Utility class first: Tailwind-style utilities or atomic class composition are the project convention.
- Inline style first: component-local inline style objects are explicitly preferred.

When no explicit policy exists, keep the local pattern already used by the component and avoid introducing a new styling system.

Use `ui-style-policy` when the style policy itself needs to be selected, documented, or reconciled.

## Verification

- Run repo-defined lint/build when relevant.
- Use browser/device checks for visible changes.
- Mention viewports or scenarios actually checked.
