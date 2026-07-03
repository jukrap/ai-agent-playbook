# Component System Adoption

## Adoption Boundary

- Use existing primitives, variants, slots, and composition patterns before creating a new component family.
- Add a shared component only when multiple screens need the same behavior, accessibility, and visual contract.
- Keep feature-specific layout, copy, data wiring, and workflow state outside generic primitives.
- Treat copied reference visuals as inspiration, not as a replacement for the repository's product language.

## States

- Default, hover, focus, active, pressed, disabled, loading, empty, error, validation, selected, expanded, and permission-limited.
- Long text, translated text, dense data, missing media, reduced motion, dark/light theme, and high-contrast mode.
- Keyboard, screen reader, touch, pointer, and responsive breakpoints supported by the project.

## Verification

- Render the component or screen in each changed state instead of trusting static style review.
- Check text fit, overflow, focus visibility, contrast, icon meaning, density, and responsive composition.
- Compare with accepted design source when one exists, but document intentional product deviations.
- Confirm that token or component changes do not unexpectedly alter unrelated surfaces.
- Keep visual evidence and adoption notes concise enough to be useful in future reviews.
