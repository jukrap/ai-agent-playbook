# jQuery Browser Stack Checks

## Inspect Together

- Active HTML/templates, server-rendered fragments, script include order, selector scope, delegated events, globals, and plugin initialization.
- AJAX URLs, payload names, response shapes, validation messages, date/number formatting, and hidden server-rendered values used by scripts.
- CSS hooks, IDs/classes/data attributes, modal/table/date picker plugins, repeated partial renders, and dynamic DOM insertion points.
- Browser constraints, old syntax support, polyfills, bundled/minified files, and manually copied vendor scripts.

## Change Risks

- Binding events on every render can create duplicate handlers, double submits, repeated AJAX calls, or memory leaks.
- Changing IDs/classes/data attributes can break CSS, plugins, tests, server fragments, or selectors in unrelated files.
- Plugin lifecycle bugs often appear after modal reopen, table redraw, tab switch, partial refresh, or validation failure.
- Old browsers or intranet constraints may reject modern syntax even when the local browser works.

## Verification

- Exercise first load, changed interaction, repeated action, modal reopen, validation failure, dynamic DOM update, and browser back/refresh behavior.
- Check console errors, network requests, request payloads, response handling, loading/error states, and duplicate submissions.
- Verify plugin initialization and teardown after partial render, hidden/visible state changes, and data reload.
- Inspect minified/bundled output or deployment script order when scripts are manually copied or concatenated.
- Pair with `frontend/browser-dom-change`, `backend/api-contract-boundary`, or `frontend/visual-regression-qa` when the change crosses those boundaries.
