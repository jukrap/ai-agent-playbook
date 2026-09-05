# Typography And Color Specification

## Typography

Document typography as a usable system, not a mood board:

- Font family and fallback stack for headings, body, code, data, and display use.
- Type scale with named roles such as display, title, heading, body, caption, label, and data.
- Font weights and when each is allowed.
- Line height by role, with tighter values only where reading load is low.
- Letter spacing rules. Avoid negative tracking unless the existing brand system requires it.
- Paragraph spacing, list spacing, and content width.
- Responsive behavior by role, not by raw viewport scaling.
- Locale and long-word behavior for labels, buttons, tables, and cards.

## Color

Define semantic colors before raw values:

- Brand: primary, accent, supporting, and restricted-use colors.
- Neutral: background, surface, raised surface, border, divider, text, muted text, and disabled.
- Interaction: hover, active, selected, focus, visited, drag, and pressed states.
- Status: success, warning, danger, info, pending, unknown, and offline.
- Data: categorical series, sequential scale, diverging scale, highlight, missing value, and low-confidence value.
- Media: overlay, scrim, image border, screenshot frame, and placeholder.

## Accessibility Checks

- Check contrast on real component states, not only token pairs.
- Preserve focus visibility against every surface color.
- Avoid color-only meaning for status, validation, or chart interpretation.
- Keep dark mode and high-contrast mode as first-class token modes when the project supports them.
- Respect reduced-motion when color transitions are paired with movement or parallax.

## Implementation Notes

- Prefer repository-native tokens and CSS variables over one-off raw values.
- Do not add global tokens for a single screen unless reuse is already likely.
- Record fallback behavior when the chosen font or theme mode is unavailable.
- Keep generated palette exploration out of durable memory until reviewed and named.
