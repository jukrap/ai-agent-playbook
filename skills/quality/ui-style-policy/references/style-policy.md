# UI Style Policy Reference

Use the narrowest policy supported by repository evidence.

## Decision order

1. **Design system first**
   - Shared components, tokens, variants, slots, or UI primitives exist.
   - Reuse them before writing custom CSS, utilities, or inline styles.

2. **CSS/class first**
   - Stylesheets, CSS modules, scoped CSS, or semantic class names are the project convention.
   - Put reusable layout, variants, pseudo selectors, media queries, and container queries in CSS/classes.

3. **Utility class first**
   - Tailwind-style utilities or atomic class composition are the project convention.
   - Compose from configured tokens and variants before adding custom CSS.

4. **Inline style first**
   - Component-local inline style objects are explicitly preferred by project docs, code, or user instruction.
   - Keep inline styles limited to component-local, dynamic, or state-derived values.

## Conflict handling

- Latest user instruction and repository docs outrank generic style preferences.
- Existing local component patterns outrank external style advice.
- Shared design-system primitives outrank one-off custom styling when they cover the needed state.
- If the project mixes methods, follow the method already used by the touched component unless there is a documented migration.

## Documentation

When the policy will matter later, record:

- selected policy
- evidence source
- allowed exceptions
- verification expectations for visible UI changes
