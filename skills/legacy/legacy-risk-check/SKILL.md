---
name: legacy-risk-check
description: Use when changing legacy code that may affect global state, shared CSS/JS, common selectors, templates, forms, API contracts, build output, or deployment behavior.
---

# Legacy Risk Check

Look for hidden blast radius before editing and before declaring the work done.

## Checklist

- Search every selector, global variable, function name, route, template fragment, config key, and API field you plan to change.
- Confirm which files are actually loaded at runtime.
- Check shared CSS/JS, includes, layout templates, plugin initialization, and event delegation.
- Check form field names, hidden inputs, CSRF/session handling, and redirect flow.
- Check generated/build output versus source files.
- Check deployment or packaging rules before moving files.

## Stop Signals

- Multiple active files with the same purpose and no clear runtime winner.
- Backend contract or DB/schema shape is unclear.
- A shared selector/class is used across unrelated screens.
- Verification requires an environment you do not have.

If a stop signal blocks confidence, report the blocker and propose the smallest safe next step.
