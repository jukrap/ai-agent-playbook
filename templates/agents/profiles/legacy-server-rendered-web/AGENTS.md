# AGENTS.md
# Legacy Server-rendered Web Profile

Use this profile for JSP, Thymeleaf, Razor, PHP templates, or server-rendered form workflows.

## Start rules

- Trace route, controller, template, form action, and validation flow first.
- Treat HTML as the result of server data, session state, flash messages, authorization, and locale.
- Check whether template fragments, includes, layouts, or partials are reused.
- Be especially careful with hidden inputs, CSRF tokens, method overrides, and redirect-after-post behavior.

## Change strategy

- Check controller DTOs, view models, template names, and form field name contracts together.
- Follow the existing validation and error display pattern.
- Check server-rendering conditions and authorization branches even for small UI changes.
- If AJAX is mixed in, keep server-rendered HTML responsibilities separate from client update responsibilities.

## UI and styling

- Prefer existing shared layouts, tables, forms, and message components.
- If inline-style preference or older CSS conventions exist, follow the project rule.
- Scope new CSS/JS narrowly to avoid leaking into the whole layout.

## Verification

- Check GET entry, successful POST, validation failure, authorization/session expiry, back navigation, and refresh behavior when relevant.
- If there are no automated tests, verify at least the real form flow and server logs.
- Run template compile/build steps when the project defines them.

## Git and worklogs

- Call out server contracts, form fields, migrations, and authorization impact in commit/PR/worklog notes.
- Keep local-only docs and generated outputs out of staged changes.
