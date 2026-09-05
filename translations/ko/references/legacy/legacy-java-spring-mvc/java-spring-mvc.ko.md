# Java Spring MVC Stack Checks

## 함께 확인할 것

- Controller mapping, request method, interceptor, servlet filter, JSP fragment, taglib, tiles/layout, included script.
- Form object, binder rule, validator, model attribute name, session attribute, flash attribute, redirect target.
- XML/annotation configuration, bean name, component scan range, transaction boundary, scheduler/job bean, profile-specific property.
- MyBatis mapper XML, result map, parameter name, stored procedure call, generated key, 여러 화면이 공유하는 SQL fragment.

## 변경 위험

- Model attribute rename은 compile-time evidence 없이 JSP, validation message, JavaScript snippet, included fragment를 깨뜨릴 수 있습니다.
- Controller 변경은 filter, security rule, locale resolver, multipart config, session assumption의 영향을 받을 수 있습니다.
- Transactional service 변경은 lazy-loading behavior, mapper call order, stored procedure side effect를 바꿀 수 있습니다.
- WAR/container behavior는 servlet version, classloader order, JNDI, encoding, server config 때문에 local embedded run과 다를 수 있습니다.

## 검증

- GET, POST success, validation failure, authorization/session failure, redirect, refresh/back-button behavior를 실행합니다.
- JSP rendering, form field name, message code, hidden field, server가 내보내는 JavaScript value를 확인합니다.
- 변경된 SQL에는 affected row, result-map shape, rollback/repair expectation을 포함한 mapper-level 또는 database evidence를 남깁니다.
- Bean, XML, filter, profile, web.xml, WAR resource가 바뀌면 startup 또는 deployment-shaped packaging을 확인합니다.
- 경계를 넘으면 `backend/server-rendered-change`, `database/query-performance-review`, `security/auth-access-control`과 함께 사용합니다.
