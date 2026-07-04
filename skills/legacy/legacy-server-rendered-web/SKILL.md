---
name: legacy-server-rendered-web
description: Use when maintaining server-rendered web pages with templates, controllers, form posts, server validation, sessions, layouts, partials, or mixed server/client behavior.
---

# Legacy Server-rendered Web

Treat HTML as the output of server state, not an isolated static file.

## Workflow

1. Trace route/controller, view model, template, form action, validation, and redirect flow.
2. Check layout/partial/include reuse before changing markup or CSS.
3. Preserve form field names, hidden inputs, CSRF/session behavior, and error display.
4. Keep JavaScript enhancements compatible with server-rendered fallback when the project relies on it.
5. Verify GET, successful POST, validation failure, and auth/session edge cases where relevant.

## Guardrails

- Do not rename fields without checking server binding.
- Do not move markup out of a shared fragment without checking all consumers.
- Do not assume AJAX response shape from template naming.
- Record backend/template contract uncertainty in the worklog or PR.

## Reference

Read `references/server-rendered-legacy-flow.md` for route, controller, template, form, session, and enhancement compatibility checks.
