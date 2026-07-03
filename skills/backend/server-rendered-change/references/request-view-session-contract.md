# Request View Session Contract

Use this reference when changing a backend-rendered page, form, controller, template, or redirect flow where behavior is spread across server and view layers.

## Trace The Whole Flow

Map the request before editing:

- Route, HTTP method, path variables, query parameters, form fields, files, headers, cookies, and CSRF token.
- Middleware, filters, interceptors, guards, session loaders, locale/theme handling, and authorization.
- Controller/action, service calls, persistence calls, mapper SQL, stored procedures, and external integration calls.
- Model/view keys, template fragments, partials, includes, layout slots, client-side enhancement hooks, and validation message locations.
- Redirect targets, flash messages, session mutations, cache headers, and error pages.

## Contract Preservation

- Preserve request parameter names, field names, binding names, model/view keys, session keys, and redirect paths unless the task explicitly changes them.
- Treat template fragments and partials as shared contracts when multiple routes include them.
- Treat mapper SQL, stored procedures, and report queries as part of the page contract when the rendered flow depends on them.
- Keep validation failure behavior stable: submitted values, error messages, focus target, status code, and session/flash state.
- For old clients or bookmarked URLs, preserve redirects or compatibility routes when removing paths.

## State And Authorization

- Check unauthenticated, unauthorized, expired session, role mismatch, stale CSRF, and concurrent tab cases.
- Verify whether the flow reads or writes session state, flash messages, remember-me cookies, feature flags, or server-side caches.
- Avoid moving authorization decisions into templates or client-side scripts.
- Ensure hidden fields do not become trusted authority for price, role, owner, status, or permission.

## Rendering And Interaction

- Check empty, long-content, translated, validation-error, success, and permission-denied states.
- If client-side script enhances the page, verify the no-script or server-only fallback when the project expects it.
- Keep progressive enhancement hooks stable: element names, IDs, data attributes, and endpoint assumptions.
- For downloads, printing, reports, and exports, verify content type, filename, encoding, pagination, and browser behavior.

## Verification

- GET render success.
- POST success and redirect target.
- POST validation failure with user input preserved.
- Auth/session expiry and unauthorized access.
- Template fragment reuse path if shared.
- Stored procedure, mapper SQL, or report output when data shape changes.
- Old route, bookmark, or compatibility redirect when routes move.

## Stop Conditions

- A form field, model key, session key, or redirect target changes without tracing callers and templates.
- Validation failure behavior is unverified.
- Authorization is checked only by template visibility.
- The flow depends on stored procedures or mapper SQL that were not reviewed.
- The deployment can run old and new code against incompatible view/session/data contracts.
