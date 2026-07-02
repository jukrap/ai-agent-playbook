# Responsive Overflow Checks

## Inventory

- Viewports: smallest supported mobile, common mobile, tablet if supported, laptop, desktop, and wide desktop when relevant.
- Containers: shell, sidebar, toolbar, card, table, form, modal, dropdown, chart, media frame, and fixed-position regions.
- Content stressors: long labels, translated text, long numbers, empty data, many items, validation messages, and narrow columns.
- Layout mechanisms: grid, flex, absolute/fixed positioning, sticky regions, container queries, and viewport units.

## Review

- Text should not overlap, clip, or force controls outside their container at supported widths.
- Buttons, tabs, pills, and toolbar controls need stable dimensions or wrapping rules for longest expected text.
- Tables and dense dashboards need explicit overflow, column priority, or responsive alternate layout.
- Sticky/fixed elements should not cover content, focus targets, toasts, modals, or browser UI.
- Avoid viewport-width font scaling for regular UI; use design tokens and container constraints.
- Test both sparse and dense states because empty layouts can hide overflow bugs.

## Verification

- Resize through breakpoint boundaries, not only fixed sizes.
- Check long text, validation errors, long numbers, and translated labels.
- Confirm scroll containers, sticky headers, modals, dropdowns, and sidebars remain reachable.
- Verify loading/empty/error states do not resize critical controls unexpectedly.
- Use browser screenshots or computed layout inspection when overlap is subtle.

## Stop Conditions

- Important text or controls overlap at a supported viewport.
- A user cannot reach an action because it is clipped, covered, or offscreen.
- Fixed or sticky UI hides focus, validation, or primary content.
- The layout relies on one sample dataset to avoid overflow.
