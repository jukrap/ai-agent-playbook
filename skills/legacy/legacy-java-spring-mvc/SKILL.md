---
name: legacy-java-spring-mvc
description: Use when maintaining legacy Java Spring MVC, JSP, Servlet, MyBatis, WAR deployment, XML config, or server-rendered Java web applications.
---

# Legacy Java Spring MVC

Trace controller, view, mapper, and deployment contracts together.

## Workflow

1. Find controller route mappings, interceptors, filters, JSP/templates, form binding, and validation.
2. Check XML/annotation config, bean wiring, transaction boundaries, and mapper SQL.
3. Preserve request parameter names, model attributes, session usage, and view names.
4. Treat MyBatis/result maps and stored procedure calls as API contracts.
5. Verify build, server startup, GET/POST flow, validation failure, and authorization/session cases when relevant.

## Guardrails

- Do not modernize to a new Spring style inside a small fix.
- Do not rename model attributes or JSP fragments without all consumers.
- Do not assume local embedded behavior matches deployed WAR/container behavior.
