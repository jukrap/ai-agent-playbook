# Kotlin Backend Profile

Use with `backend-change-safety` after confirming a Kotlin backend.

## Common Surfaces

- Spring Boot, Ktor, coroutine-based services, data classes, sealed types, extension functions, and DSL configuration.
- Gradle Kotlin DSL, kapt/ksp code generation, and shared JVM modules.
- Suspending handlers, coroutine scopes, dispatcher selection, and structured concurrency.

## Review Points

- Preserve nullability contracts; do not widen nullable types to avoid mapping decisions.
- Check coroutine cancellation, timeouts, dispatcher use, and blocking calls inside suspend paths.
- Keep data classes for transport, domain, and persistence separate when the codebase already does.
- Verify generated code inputs when annotations or schemas change.

## Verification

- Tests for suspend functions and error/cancellation paths.
- API or route tests for serialization, validation, and auth.
- Build checks that include kapt/ksp or generated-source tasks when affected.
