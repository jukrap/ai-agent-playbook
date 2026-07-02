# Stack Profile Selection

Repository stack이 file, package manifest, framework config, runtime command, existing project docs로 확인된 뒤에만 stack profile을 사용합니다. Stack profile은 technology-specific check를 추가할 뿐 primary capability skill을 대체하지 않습니다.

## Selection Evidence

- Java: `pom.xml`, `build.gradle`, `.java`, Spring config, Servlet/JSP file, MyBatis XML, JPA entity, WAR/JAR packaging.
- Kotlin: `.kt`, `.kts`, Gradle Kotlin DSL, Ktor, Kotlin Spring, coroutine service, kapt/ksp configuration.
- Node: `package.json`, `.js`, `.ts`, Express/Fastify/NestJS/Hono route, serverless handler, package script.
- Python: `pyproject.toml`, `requirements*.txt`, `.py`, FastAPI/Django/Flask app, Celery/RQ worker, management command.
- Go: `go.mod`, `.go`, HTTP handler, generated client, `database/sql`, sqlc, gorm, ent, worker 또는 CLI package.
- .NET: `.csproj`, `.sln`, `.cs`, ASP.NET Core, hosted service, EF Core, IIS, Web.config, legacy .NET Framework.
- PHP: `composer.json`, `.php`, Laravel/Symfony, include-based page, shared hosting config, direct SQL form.

여러 stack이 있으면 변경된 runtime surface의 profile을 선택하고, cross-stack consumer는 별도로 기록합니다.

## Routing Rules

- Service, worker, job, queue, config, module, integration, runtime side effect, backend business logic은 `backend-change-safety`를 사용합니다.
- Controller, template, form, session, redirect, validation failure page, model/view name, server-rendered HTML이 주된 risk면 `server-rendered-change`를 추가합니다.
- Schema, SQL, migration, stored procedure, trigger, data integrity rule이 바뀌면 `database-change-safety` 또는 database depth skill을 추가합니다.
- Request/response DTO, generated client, mock, frontend/backend payload가 바뀌면 `api-contract-boundary`를 추가합니다.
- Webhook, OAuth app, third-party API, sync job, import/export bridge, MCP adapter가 바뀌면 `connector-integration-change`를 추가합니다.
- Auth, authorization, secret, dependency provenance, scanner output, public compliance evidence가 영향받으면 security skill을 추가합니다.

## Anti-Patterns

- Monorepo에 여러 language가 있다는 이유로 모든 stack profile을 읽습니다.
- 작은 fix 중 stack profile을 architecture modernization 허가처럼 사용합니다.
- Service, data, config, integration change에서 legacy stack wrapper만 절차로 사용합니다.
- Source file이나 package/config evidence 없이 generated stack guess를 신뢰합니다.
- Repository가 해당 stack을 사용한다는 evidence 없이 stack profile note를 project memory로 승격합니다.

## Handoff Note

Stack profile이 작업에 영향을 줬다면 다음을 기록합니다.

- profile 선택에 사용한 evidence,
- 선택한 profile과 건너뛴 profile,
- 사용한 primary capability skill,
- 함께 사용한 cross-category skill,
- 실제 실행한 stack-specific verification,
- deployment-only behavior를 확인하지 못한 경우 remaining risk.
