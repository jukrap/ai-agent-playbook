# Node Backend Profile

Use with `backend-change-safety` after confirming a Node.js or TypeScript backend.

## Common Surfaces

- Express/Fastify/NestJS/Hono routes, middleware, controllers, providers/services, repositories, workers, queues, cron jobs, and serverless functions.
- Schema validators, DTOs, ORMs, dependency injection, environment loaders, and package scripts.

## Review Points

- Keep route parsing/validation, service logic, persistence, and integration adapters separated according to the local framework.
- Check async error handling, unhandled promise paths, abort/timeouts, retries, and idempotency.
- Treat environment variables, feature flags, queue names, event names, and log fields as contracts.
- Confirm ESM/CJS, tsconfig path aliases, generated code, and bundler/runtime differences before moving modules.

## Verification

- Unit tests for services and adapters.
- Route tests for validation, auth, error shape, and response envelopes.
- Worker/queue tests for retries and duplicate delivery when a local harness exists.
- Type-check and lint commands whenever TypeScript or framework decorators are affected.
