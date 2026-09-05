# Semantic Interaction Review

## Inventory

- Accessible name: visible label, `aria-label`, `aria-labelledby`, form label, table caption/header, or icon button tooltip.
- Role and state: native element, ARIA role, expanded/selected/checked/pressed/current/busy/invalid/disabled state.
- Feedback: form error, toast, inline status, loading indicator, progress, live region, and success/failure announcement.
- Visual constraints: contrast, reduced motion, text scaling, focus ring, hit target, and high-contrast mode when relevant.

## Review

- Prefer native elements before ARIA. ARIA should repair semantics, not disguise non-interactive markup as a complete widget.
- Icon-only controls need a stable accessible name that matches the action.
- Form errors should be associated with the field and announced or discoverable after submit.
- Selected, expanded, checked, pressed, current, invalid, and busy states should be exposed when they change interaction meaning.
- Color and motion should not be the only signal for status, errors, or selection.
- Reduced motion should be respected for large motion, parallax, autoplay, or repeated animated feedback.

## Verification

- Inspect the rendered accessible name/role/state with browser tooling when available.
- Submit invalid forms and confirm field association, message persistence, and recovery.
- Verify icon buttons, custom controls, selected rows/tabs, disclosure widgets, and loading states.
- Check contrast and text scaling for the changed surface when the task affects visible UI.
- Confirm announcements are useful but not noisy for repeated updates.

## Stop Conditions

- Visual UI and semantic state disagree.
- A control's accessible name is missing, stale, or misleading.
- Form errors cannot be discovered without sight.
- Motion, color, or icon shape is the only indication of important state.
