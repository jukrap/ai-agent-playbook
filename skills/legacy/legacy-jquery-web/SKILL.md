---
name: legacy-jquery-web
description: Use when maintaining browser pages built with jQuery, plugins, direct DOM manipulation, global scripts, AJAX callbacks, or script-order dependent behavior.
---

# Legacy jQuery Web

Primary route: `frontend/browser-dom-change`.

Preserve script order, selector contracts, and plugin lifecycle.

## Workflow

1. Find the active HTML/template and script include order.
2. Trace selector usage, delegated events, plugin initialization, AJAX calls, and globals.
3. Patch the existing pattern instead of adding a competing framework style.
4. Keep CSS/inline style choices consistent with the page and team preference.
5. Verify in the browser: load page, interact with changed controls, inspect console and network.

## Watch For

- duplicate event handler registration
- plugin re-initialization bugs
- hidden dependencies on IDs/classes
- table/modal/date picker lifecycle
- old browser syntax constraints
- server-rendered values embedded into JavaScript

## Reference

Read `references/jquery-browser.md` for stack-specific checks.
