# PHP Backend Profile

PHP backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- Laravel/Symfony controller, middleware, service, job, queue, event, migration, Eloquent/Doctrine model, config.
- Include, session, global, direct SQL, mixed HTML/PHP, shared-hosting deployment가 있는 legacy LAMP page.

## Review Points

- Route name, request key, session key, view variable, validation rule, redirect target을 보존합니다.
- CSRF, middleware group, policy/gate, guard, per-object authorization을 확인합니다.
- Legacy page는 수정 전에 include, global, output buffering, SQL call, form postback을 추적합니다.
- `.env` key, queue name, cron entry, storage path, file permission은 deployment contract로 다룹니다.

## Verification

- 가능한 경우 route, validation, auth, redirect에 대한 feature test.
- Service와 policy unit test.
- Schema 변경은 migration check와 seed/rollback verification.
- Automated coverage가 없는 legacy page는 form/session manual smoke.
