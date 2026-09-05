# Server-rendered Legacy Flow

Use this for server-rendered pages with templates, controllers, forms, sessions, and mixed client behavior.

## Flow map

- Route and HTTP method.
- Controller/action/filter/middleware path.
- View model, template variables, layout, partials, and includes.
- Form action, field names, hidden inputs, CSRF token, and validation errors.
- Redirect, flash message, session mutation, and authorization check.
- JavaScript enhancements, AJAX branches, and fallback behavior.

## Markup and style checks

- Shared layouts and partials before changing markup.
- Global CSS selectors before renaming classes or IDs.
- Browser-specific styles, print styles, and old CSS hacks before cleanup.
- Script load order, inline handlers, delegated events, and plugin initialization.
- Server-rendered error state before changing client validation.

## Form contract checks

- Field name and server binding.
- Multi-value fields and checkbox default behavior.
- Hidden inputs used for workflow state.
- Date, number, and locale parsing.
- File upload enctype, size limits, and server storage path.
- Redirect after success and redisplay after validation failure.

## Verification scenarios

- GET initial load.
- Successful POST.
- Validation failure POST.
- Auth/session expiration or permission failure.
- Browser back/reload after submission.
- JavaScript disabled or degraded path when the project supports it.

Record backend/template uncertainty instead of silently changing the visible page only.
