# PHP Backend Profile

Use with `backend-change-safety` after confirming a PHP backend.

## Common Surfaces

- Laravel/Symfony controllers, middleware, services, jobs, queues, events, migrations, Eloquent/Doctrine models, and config.
- Legacy LAMP pages with includes, sessions, globals, direct SQL, mixed HTML/PHP, and shared-hosting deployment.

## Review Points

- Preserve route names, request keys, session keys, view variables, validation rules, and redirect targets.
- Check CSRF, middleware groups, policies/gates, guards, and per-object authorization.
- For legacy pages, trace includes, globals, output buffering, SQL calls, and form postbacks before editing.
- Treat `.env` keys, queue names, cron entries, storage paths, and file permissions as deployment contracts.

## Verification

- Feature tests for routes, validation, auth, and redirects when available.
- Unit tests for services and policies.
- Migration checks and seed/rollback verification for schema changes.
- Manual form/session smoke for legacy pages without automated coverage.
