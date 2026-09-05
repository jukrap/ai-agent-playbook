# Python Backend Profile

Use with `backend-change-safety` after confirming a Python backend.

## Common Surfaces

- FastAPI, Django, Flask, Celery/RQ workers, management commands, Pydantic models, serializers, ORM models, and settings modules.
- Sync/async boundaries, dependency injection, middleware, signals, and migrations.

## Review Points

- Keep request schemas, domain models, ORM models, and response serializers in their existing layers.
- Check sync calls inside async routes, background task behavior, and worker retry/idempotency.
- Treat settings names, environment defaults, migration order, and management commands as deployment contracts.
- Verify permission classes, dependencies, middleware, and object-level access together.

## Verification

- Unit tests for services and serializers.
- Route/client tests for validation, auth, and error shape.
- Worker tests for retry and duplicate execution where supported.
- Migration checks when models or schema are touched.
