# Task Surface Polish Check

Use this reference when refining visible UI without changing the product direction or rewriting the design system.

## Start From The Task

- Identify the primary task the screen must support and the first action a user should be able to take.
- Preserve existing navigation, information architecture, and component conventions unless the request asks for a redesign.
- Improve the active work surface before adding secondary decoration.
- For operational tools, prioritize scan density, stable controls, clear status, filters, tables, forms, and audit cues.
- For portfolio, media, game, or editorial surfaces, keep expressive elements tied to the actual content or interaction.

## Layout And Hierarchy

- Make the first visible area useful for the task, not just decorative.
- Use stable dimensions for controls, toolbars, counters, grids, boards, cards, media frames, and fixed-format elements.
- Keep text, icons, labels, controls, and dynamic content from overlapping at supported viewport widths.
- Avoid nested cards, decorative wrappers, and extra section chrome in utilitarian interfaces.
- Match type scale to the container: compact panels need compact headings, not hero-scale text.

## State Coverage

- Check loading, empty, error, disabled, selected, hover, focus, active, success, destructive, and long-content states when the component exposes them.
- Keep destructive or irreversible actions visually distinct from routine actions.
- Preserve keyboard focus, screen-reader labels, visible focus rings, and disabled semantics already present in the project.
- Ensure validation messages, toasts, dialogs, dropdowns, and sticky regions do not hide each other.

## Responsive And Content Stress

- Test the smallest supported mobile width, common mobile, laptop, and desktop widths when possible.
- Stress long labels, translated text, large numbers, empty data, many items, narrow columns, and validation errors.
- Prefer wrapping, truncation with accessible full text, horizontal table scroll, or alternate layout over viewport-width font scaling.
- Verify fixed/sticky elements do not cover focus targets, browser UI, bottom actions, or primary content.

## Visual System Fit

- Reuse shared components, tokens, variants, class conventions, and spacing scales before adding one-off styling.
- Avoid single-hue palettes, arbitrary shadows, excessive gradients, and decorative background objects that do not clarify the task.
- Use icons for familiar commands when a symbol is clearer than a text-only pill.
- If no design system exists, follow nearby components and keep the polish local.

## Verification

- Browser-render the changed screen when the project can run locally.
- Capture or inspect the relevant widths and states actually affected.
- Check keyboard focus order for new controls.
- Run project-defined lint, type, test, or build commands when relevant.
- Report only the states, widths, and commands that were actually checked.

## Stop Conditions

- Text or controls overlap at a supported viewport.
- A user cannot reach or understand a primary action.
- The change introduces a new visual language without a design-direction request.
- The UI is only checked against ideal sample content.
- Accessibility states are removed or made less visible.
