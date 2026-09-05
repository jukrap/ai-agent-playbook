# Design System Audit Matrix

Use this reference when design references should become maintainable tokens, components, variants, and QA criteria rather than one-off styling.

## Matrix

| Area | Questions | Output |
| --- | --- | --- |
| Purpose | What user job, product type, and density does the reference optimize for? | Local design intent and non-goals. |
| Tokens | Which color, spacing, radius, shadow, typography, and motion roles are reusable? | Token role mapping, not copied values. |
| Components | Which buttons, inputs, menus, cards, tables, charts, media, and dialogs recur? | Component/variant candidates. |
| States | What happens for hover, focus, selected, loading, empty, error, disabled, and overflow? | State checklist and visual QA cases. |
| Layout | What grid, grouping, navigation, breakpoint, and scroll rhythm is useful? | Local layout principle and responsive checks. |
| Content | How dense are labels, descriptions, proof, metadata, and actions? | Copy density and hierarchy guidance. |
| Accessibility | Where are contrast, focus, semantics, motion, touch target, or reading-order risks? | Required accessibility checks. |

## Adoption Rules

- Map reference behavior to local design-system primitives before writing custom CSS.
- Keep distinctive brand, illustration, exact composition, copy, and source-specific assets out of reusable docs.
- Prefer role names such as `surface`, `muted`, `danger`, `focus`, and `chart-accent` over raw color values.
- If the local product is operational or data-heavy, prioritize scanability, alignment, density, and error states over editorial drama.
- If the local product is brand or portfolio focused, define the first-viewport signal, image treatment, and content rhythm explicitly.

## Evidence Package

- Reference locator or screenshot source boundary.
- Local mapping table: reference principle to local token/component/state.
- Do-not-copy notes for source-specific parts.
- Browser or screenshot checks for at least one desktop and one mobile viewport when implemented.
