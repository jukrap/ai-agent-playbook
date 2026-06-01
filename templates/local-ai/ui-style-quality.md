# UI Style Quality

Use this guide when reviewing style quality while preserving design intent.

## Core principles

- A request for style quality, cleanup, or broken-layout fixes is not permission to redesign the product.
- First inspect the current screen intent, existing components, shared primitives, tokens, and CSS/inline style rules.
- Default to the repository's proven style policy. When it is explicit, use the matching skill: `design-system-first`, `css-class-first`, `utility-class-first`, or `inline-style-first`.
- If no policy is documented, keep the local pattern already used by the component and avoid introducing a new styling system.

## Review checklist

- Are spacing, color, or font values repeated without meaning?
- Do class names and inline styles conflict?
- Does CSS cascade or specificity affect more than intended?
- Do text, buttons, tables, modals, or filters overflow on mobile?
- Are loading, empty, error, disabled, or selected states missing?
- Are cards nested inside cards or decorated beyond the product need?
- If the screen is an operational tool, does the design preserve density and repeated-use efficiency?

## Style policy selection

- Use `design-system-first` when shared UI components, tokens, variants, or slots should own the styling.
- Use `css-class-first` when stylesheets, CSS modules, scoped CSS, or semantic classes are the project convention.
- Use `utility-class-first` when Tailwind-style utilities or atomic class composition are the project convention.
- Use `inline-style-first` when component-local inline style objects are explicitly preferred.

## Responsive rules

- Treat page/grid behavior as viewport-based.
- Also check component behavior against its own container width for cards, tables, and filters.
- Verify overflow and click targets at major desktop, tablet, and mobile widths.
- If text does not fit, adjust layout, wrapping, min-width, or overflow policy before scaling fonts by viewport.

## Verification

- Inspect the rendered screen in a browser when possible.
- If visible UI changed, record the screenshot or scenario checked.
- Do not treat lint/build alone as sufficient UI verification.
