# Stack Profile Selection

Use stack profiles only after the repository stack is evidenced by files, package manifests, framework config, runtime commands, or existing project docs. Stack profiles add technology-specific checks; they do not replace the primary capability skill.

## Selection Evidence

- Java: `pom.xml`, `build.gradle`, `.java`, Spring config, Servlet/JSP files, MyBatis XML, JPA entities, WAR/JAR packaging.
- Kotlin: `.kt`, `.kts`, Gradle Kotlin DSL, Ktor, Kotlin Spring, coroutine services, kapt/ksp configuration.
- Node: `package.json`, `.js`, `.ts`, Express/Fastify/NestJS/Hono routes, serverless handlers, package scripts.
- Python: `pyproject.toml`, `requirements*.txt`, `.py`, FastAPI/Django/Flask apps, Celery/RQ workers, management commands.
- Go: `go.mod`, `.go`, HTTP handlers, generated clients, `database/sql`, sqlc, gorm, ent, worker or CLI packages.
- .NET: `.csproj`, `.sln`, `.cs`, ASP.NET Core, hosted services, EF Core, IIS, Web.config, legacy .NET Framework.
- PHP: `composer.json`, `.php`, Laravel/Symfony, include-based pages, shared hosting config, direct SQL forms.

If multiple stacks are present, select the profile for the changed runtime surface, then note cross-stack consumers separately.

## Routing Rules

- Use `backend-change-safety` for services, workers, jobs, queues, config, modules, integrations, runtime side effects, and backend business logic.
- Add `server-rendered-change` when controllers, templates, forms, sessions, redirects, validation failure pages, model/view names, or server-rendered HTML are the main risk.
- Add `database-change-safety` or database depth skills when schema, SQL, migrations, stored procedures, triggers, or data integrity rules change.
- Add `api-contract-boundary` when request/response DTOs, generated clients, mocks, or frontend/backend payloads change.
- Add `connector-integration-change` when webhooks, OAuth apps, third-party APIs, sync jobs, import/export bridges, or MCP adapters change.
- Add security skills when auth, authorization, secrets, dependency provenance, scanner output, or public compliance evidence is affected.

## Anti-Patterns

- Loading every stack profile because a monorepo contains many languages.
- Treating a stack profile as permission to modernize the architecture during a small fix.
- Using a legacy stack wrapper as the only procedure for service, data, config, or integration changes.
- Trusting generated stack guesses without source files or package/config evidence.
- Promoting stack profile notes into project memory without evidence that the repository uses that stack.

## Handoff Note

When a stack profile influenced the work, record:

- evidence used to select the profile,
- selected profile and skipped profiles,
- primary capability skill used,
- cross-category skills paired with it,
- stack-specific verification actually run, and
- remaining risk when deployment-only behavior could not be checked.
