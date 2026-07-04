# Java Backend Profile

Java backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- Spring Boot 또는 Spring MVC controller, service, repository, filter/interceptor, scheduler, configuration class.
- Servlet/JSP 또는 legacy MVC flow의 session state, request attribute, model key, XML configuration.
- MyBatis mapper XML, JPA entity, transaction annotation, datasource/profile configuration.
- WAR/JAR packaging, app server behavior, environment-specific property files.

## Review Points

- Service 또는 repository call을 옮기기 전에 transaction boundary를 확인합니다.
- Mapper XML, request parameter name, model attribute, validation group, session key는 contract로 다룹니다.
- Security annotation, interceptor, filter, method-level authorization을 함께 확인합니다.
- Local test behavior뿐 아니라 profile-specific config와 deployment packaging도 검증합니다.
- Batch/scheduled work는 locking, idempotency, restart behavior를 확인합니다.

## Verification

- 가능한 경우 service logic unit test.
- Request/response shape와 authorization에 대한 MVC/API test.
- Persistence 변경은 mapper/repository test 또는 dry-run SQL.
- Automated harness가 없는 JSP/session flow는 manual smoke.
