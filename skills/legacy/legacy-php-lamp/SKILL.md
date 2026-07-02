---
name: legacy-php-lamp
description: Use when maintaining legacy PHP/LAMP applications with include files, sessions, mixed HTML/PHP pages, direct SQL, globals, form posts, or shared hosting constraints.
---

# Legacy PHP LAMP

Primary route: `backend/server-rendered-change`.

For service, configuration, persistence, worker, or integration changes, pair this wrapper with `backend/backend-change-safety` and the PHP stack profile.

Follow include order, request globals, and deployment constraints before changing behavior.

## Workflow

1. Trace entry PHP file, includes/requires, shared config, session start, auth checks, and form handling.
2. Check direct SQL, escaping, encoding, timezone, file upload, and path assumptions.
3. Preserve parameter names, session keys, include order, and output buffering behavior.
4. Keep changes compatible with the deployed PHP version and hosting setup.
5. Verify GET/POST flow, validation failure, auth/session, and database side effects.

## Guardrails

- Do not assume Composer, autoloading, or framework conventions exist.
- Do not mix new template architecture into one small legacy page.
- Do not change SQL or encoding without checking stored data and all callers.

## Reference

Read `references/php-lamp.md` for stack-specific checks.

Read the backend stack profile selection reference from the source repository when deciding whether this legacy wrapper is enough or a backend stack profile is also needed.
