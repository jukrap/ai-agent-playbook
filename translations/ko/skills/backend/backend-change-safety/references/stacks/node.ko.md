# Node Backend Profile

Node.js 또는 TypeScript backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- Express/Fastify/NestJS/Hono route, middleware, controller, provider/service, repository, worker, queue, cron job, serverless function.
- Schema validator, DTO, ORM, dependency injection, environment loader, package script.

## Review Points

- Local framework에 맞춰 route parsing/validation, service logic, persistence, integration adapter를 분리합니다.
- Async error handling, unhandled promise path, abort/timeout, retry, idempotency를 확인합니다.
- Environment variable, feature flag, queue name, event name, log field는 contract로 다룹니다.
- Module을 옮기기 전에 ESM/CJS, tsconfig path alias, generated code, bundler/runtime 차이를 확인합니다.

## Verification

- Service와 adapter unit test.
- Validation, auth, error shape, response envelope에 대한 route test.
- Local harness가 있으면 retry와 duplicate delivery에 대한 worker/queue test.
- TypeScript 또는 framework decorator가 영향받으면 type-check와 lint command.
