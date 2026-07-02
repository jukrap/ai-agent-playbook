---
name: server-rendered-change
description: Use when changing backend-rendered web flows, controllers, templates, forms, sessions, redirects, validation, or server-side view contracts.
---

# Server Rendered Change

server-rendered request/response flow를 위한 primary backend skill입니다.

## Workflow

1. route, controller, middleware, template, form binding, session, authorization, persistence boundary를 함께 추적합니다.
2. 요청이 명시하지 않는 한 request parameter name, model/view key, redirect target, validation behavior를 보존합니다.
3. template fragment, stored procedure, mapper SQL, session key는 contract로 다룹니다.
4. 관련되는 경우 GET, POST, validation failure, auth/session, deployment-shape case를 검증합니다.

