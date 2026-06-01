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

## Style selection

- Inline style: component-local dynamic values, SI/senior preference, state-derived layout.
- CSS/class: global layout, tokens, pseudo selectors, media/container queries, repeated variants.
- Shared UI: buttons, inputs, selects, modals, toasts, pagination, toolbars.

## Verification

- Run repo-defined lint/build when relevant.
- Use browser/device checks for visible changes.
- Mention viewports or scenarios actually checked.
