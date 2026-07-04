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

## Style Policy

Before changing styling, use the project's established policy. If the policy itself is unclear, conflicting, or worth documenting, use `style-policy-selection` first. This skill should review rendered quality after the policy is known.

## Verification

- Run repo-defined lint/build when relevant.
- Use browser/device checks for visible changes.
- Mention viewports or scenarios actually checked.
