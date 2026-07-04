# Visual Snapshot Checks

## Inventory

- Surface: page, modal, component, menu, table, chart, canvas, media element, email, PDF preview, or print view.
- State: default, hover/focus/active, loading, empty, error, disabled, selected, expanded, validation failure, and permission-limited view.
- Baseline: previous screenshot, design reference, accepted snapshot, production capture, or documented expected layout.
- Environment: browser, viewport, device scale factor, theme, locale, data seed, network state, animation setting, and font availability.

## Review

- Confirm the snapshot represents the user workflow, not only an isolated happy path.
- Use stable data and disable or control animation when comparing screenshots.
- Check whether visual differences are intentional design changes, layout regressions, rendering noise, or data differences.
- For charts/canvas/media, verify nonblank rendering, correct bounds, labels, and interaction affordances.
- Keep artifacts named by surface, viewport, state, and date or run ID when the project stores them.

## Verification

- Desktop and mobile viewport screenshots for changed responsive surfaces.
- Focus/hover/active states when controls or interaction styling changed.
- Loading, empty, error, and long-content states for data-driven UI.
- Visual diff or manual side-by-side comparison when a baseline exists.
- Browser console/network check when blank media, canvas, fonts, or images could affect rendering.

## Stop Conditions

- No stable baseline or acceptance criteria exists for a disputed visual change.
- Dynamic data, animation, or environment drift makes the diff unreadable.
- A canvas, image, chart, or media element renders blank or outside its bounds.
- A text or layout regression appears at a supported viewport and cannot be explained as intentional.
