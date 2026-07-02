# Java Backend Profile

Use with `backend-change-safety` after confirming a Java backend.

## Common Surfaces

- Spring Boot or Spring MVC controllers, services, repositories, filters/interceptors, schedulers, and configuration classes.
- Servlet/JSP or legacy MVC flows with session state, request attributes, model keys, and XML configuration.
- MyBatis mapper XML, JPA entities, transaction annotations, and datasource/profile configuration.
- WAR/JAR packaging, app server behavior, and environment-specific property files.

## Review Points

- Confirm transaction boundaries before moving service or repository calls.
- Treat mapper XML, request parameter names, model attributes, validation groups, and session keys as contracts.
- Check security annotations, interceptors, filters, and method-level authorization together.
- Verify profile-specific config and deployment packaging, not only local test behavior.
- For batch/scheduled work, confirm locking, idempotency, and restart behavior.

## Verification

- Unit tests for service logic where available.
- MVC/API tests for request/response shape and authorization.
- Mapper/repository tests or dry-run SQL for persistence changes.
- Manual smoke for JSP/session flows when no automated harness exists.
