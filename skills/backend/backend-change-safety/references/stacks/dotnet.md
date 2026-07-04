# .NET Backend Profile

Use with `backend-change-safety` after confirming a .NET backend.

## Common Surfaces

- ASP.NET Core controllers/minimal APIs, services, middleware, hosted services, background workers, EF Core DbContext, configuration, and dependency injection.
- Legacy .NET Framework, MVC, Web Forms, IIS, Web.config, and code-behind flows when present.

## Review Points

- Preserve route names, model binding, validation attributes, filters, and authorization policies.
- Check DI lifetimes, scoped services in background workers, cancellation tokens, and hosted-service shutdown.
- Review EF tracking/no-tracking behavior, migrations, and transaction boundaries with data changes.
- Treat appsettings keys, environment transforms, IIS settings, and health checks as deployment contracts.

## Verification

- Unit tests for services and validators.
- WebApplicationFactory or controller tests for API behavior when available.
- Migration dry runs or generated SQL review when EF schema changes are involved.
- Manual IIS/app pool smoke for legacy deployment-only behavior when needed.
