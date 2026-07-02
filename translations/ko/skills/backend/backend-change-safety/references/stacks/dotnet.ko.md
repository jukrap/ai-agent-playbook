# .NET Backend Profile

.NET backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- ASP.NET Core controller/minimal API, service, middleware, hosted service, background worker, EF Core DbContext, configuration, dependency injection.
- 존재하는 경우 legacy .NET Framework, MVC, Web Forms, IIS, Web.config, code-behind flow.

## Review Points

- Route name, model binding, validation attribute, filter, authorization policy를 보존합니다.
- DI lifetime, background worker의 scoped service, cancellation token, hosted-service shutdown을 확인합니다.
- Data 변경은 EF tracking/no-tracking behavior, migration, transaction boundary를 함께 봅니다.
- Appsettings key, environment transform, IIS setting, health check는 deployment contract로 다룹니다.

## Verification

- Service와 validator unit test.
- 가능한 경우 WebApplicationFactory 또는 controller test.
- EF schema 변경은 migration dry run 또는 generated SQL review.
- Legacy deployment-only behavior는 필요하면 IIS/app pool manual smoke.
