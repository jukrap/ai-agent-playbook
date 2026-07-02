# Legacy Java Spring MVC

Primary route: `backend/server-rendered-change`.

Service, configuration, persistence, worker, integration 변경은 이 wrapper와 함께 `backend/backend-change-safety` 및 Java stack profile을 사용합니다.

Legacy Java Spring MVC, JSP, Servlet, MyBatis, WAR deployment, XML config, server-rendered Java web app을 유지보수할 때 사용합니다.

## 진행 절차

1. controller route mappings, interceptors, filters, JSP/templates, form binding, validation을 찾습니다.
2. XML/annotation config, bean wiring, transaction boundaries, mapper SQL을 확인합니다.
3. request parameter names, model attributes, session usage, view names를 보존합니다.
4. MyBatis/result maps와 stored procedure calls를 API contracts로 취급합니다.
5. 관련 있으면 build, server startup, GET/POST flow, validation failure, authorization/session cases를 검증합니다.

## Guardrails

- 작은 fix 안에서 새로운 Spring style로 현대화하지 않습니다.
- 모든 consumer 확인 없이 model attribute 또는 JSP fragment를 rename하지 않습니다.
- local embedded behavior가 deployed WAR/container behavior와 같다고 가정하지 않습니다.

## Reference

Stack-specific check는 `references/java-spring-mvc.md`를 읽습니다.

이 legacy wrapper만 충분한지 backend stack profile도 필요한지 결정할 때는 source repository의 `backend-change-safety` stack profile selection reference를 확인합니다.
