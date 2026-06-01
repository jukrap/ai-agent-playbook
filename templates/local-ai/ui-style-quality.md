# UI Style Quality

Use this guide when reviewing style quality while preserving design intent.

## Core principles

- A request for style quality, cleanup, or broken-layout fixes is not permission to redesign the product.
- First inspect the current screen intent, existing components, shared primitives, tokens, and CSS/inline style rules.
- Default to a hybrid style policy. Shared layout and tokens may belong in CSS; component-local or dynamic styles may belong inline.
- In SI or senior-preference projects, explicitly allow inline styles as the preferred local convention.

## Review checklist

- Are spacing, color, or font values repeated without meaning?
- Do class names and inline styles conflict?
- Does CSS cascade or specificity affect more than intended?
- Do text, buttons, tables, modals, or filters overflow on mobile?
- Are loading, empty, error, disabled, or selected states missing?
- Are cards nested inside cards or decorated beyond the product need?
- If the screen is an operational tool, does the design preserve density and repeated-use efficiency?

## Style selection

- Prefer inline styles for:
  - dynamic styles used only inside one component
  - values strongly tied to props or state
  - SI projects where the senior/team convention prefers inline styles
- Prefer CSS/classes for:
  - global layout, reset, and theme tokens
  - variants or states shared across many components
  - media queries, container queries, and pseudo selectors
- Prefer shared UI for:
  - repeated primitives such as buttons, inputs, selects, modals, toasts, pagination, and toolbars

## Responsive rules

- Treat page/grid behavior as viewport-based.
- Also check component behavior against its own container width for cards, tables, and filters.
- Verify overflow and click targets at major desktop, tablet, and mobile widths.
- If text does not fit, adjust layout, wrapping, min-width, or overflow policy before scaling fonts by viewport.

## Verification

- Inspect the rendered screen in a browser when possible.
- If visible UI changed, record the screenshot or scenario checked.
- Do not treat lint/build alone as sufficient UI verification.
