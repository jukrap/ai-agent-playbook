# Python Backend Profile

Python backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- FastAPI, Django, Flask, Celery/RQ worker, management command, Pydantic model, serializer, ORM model, settings module.
- Sync/async boundary, dependency injection, middleware, signal, migration.

## Review Points

- Request schema, domain model, ORM model, response serializer를 기존 layer에 맞춰 유지합니다.
- Async route 안의 sync call, background task behavior, worker retry/idempotency를 확인합니다.
- Setting name, environment default, migration order, management command는 deployment contract로 다룹니다.
- Permission class, dependency, middleware, object-level access를 함께 검증합니다.

## Verification

- Service와 serializer unit test.
- Validation, auth, error shape에 대한 route/client test.
- 지원되면 worker retry와 duplicate execution test.
- Model 또는 schema를 건드렸으면 migration check.
