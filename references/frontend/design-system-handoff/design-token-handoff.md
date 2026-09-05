# Design Token Handoff

## Inventory

- Source: Figma variables, design tokens, brand guide, existing CSS variables, theme config, component props, or documentation.
- Token classes: color, typography, spacing, radius, shadow, border, z-index, motion, density, chart colors, and semantic status colors.
- Consumers: shared components, feature screens, charts, markdown/content, email, print, mobile shell, and embedded widgets.
- Modes: light/dark, high contrast, locale, responsive density, reduced motion, brand/theme variant, and runtime user preference.

## Mapping

- Prefer semantic tokens over raw design values when a token already represents the intent.
- Keep naming consistent with the repository's existing token or variant scheme.
- Do not add global tokens for one-off screen composition unless multiple consumers need them.
- Record fallback behavior for missing theme values, unsupported modes, and mixed old/new token usage.
- Preserve accessibility meaning: contrast, focus ring, status color, motion preference, and readable type scale.

## Review

- Check whether the design source is authoritative, draft, experiment-only, or stale.
- Confirm whether the change belongs in a shared token, shared component variant, screen-local style, or documentation note.
- Verify that tokens do not encode private product data, customer names, or temporary campaign names.
- Keep generated exports and runtime build artifacts out of durable memory unless reviewed.
