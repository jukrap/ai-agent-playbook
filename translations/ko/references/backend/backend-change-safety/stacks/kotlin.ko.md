# Kotlin Backend Profile

Kotlin backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- Spring Boot, Ktor, coroutine-based service, data class, sealed type, extension function, DSL configuration.
- Gradle Kotlin DSL, kapt/ksp code generation, shared JVM modules.
- Suspending handler, coroutine scope, dispatcher selection, structured concurrency.

## Review Points

- Nullability contract를 보존합니다. Mapping 결정을 피하려고 nullable type을 넓히지 않습니다.
- Coroutine cancellation, timeout, dispatcher use, suspend path 내부 blocking call을 확인합니다.
- Codebase가 이미 분리하고 있다면 transport, domain, persistence data class를 유지합니다.
- Annotation 또는 schema가 바뀌면 generated code input을 검증합니다.

## Verification

- Suspend function과 error/cancellation path test.
- Serialization, validation, auth에 대한 API 또는 route test.
- 영향이 있으면 kapt/ksp 또는 generated-source task를 포함한 build check.
