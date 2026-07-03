---
name: legacy-risk-check
description: Use when changing legacy code that may affect global state, shared CSS/JS, common selectors, templates, forms, API contracts, build output, or deployment behavior.
---

# Legacy Risk Check

Look for hidden blast radius before editing and before declaring the work done.

## Workflow

1. Search every shared selector, global variable, function name, route, template fragment, config key, and API field you plan to change.
2. Confirm which files are actually loaded at runtime.
3. Check browser, server, database, generated-output, deployment, and manual-operation blast radius.
4. Stop and report the smallest safe next step when runtime ownership or verification is unclear.

## Stop Signals

- Multiple active files with the same purpose and no clear runtime winner.
- Backend contract or DB/schema shape is unclear.
- A shared selector/class is used across unrelated screens.
- Verification requires an environment you do not have.

If a stop signal blocks confidence, report the blocker and propose the smallest safe next step.

## Reference

Read `references/legacy-risk-inventory.md` before changing shared legacy assets, contracts, build output, or deployment behavior.
