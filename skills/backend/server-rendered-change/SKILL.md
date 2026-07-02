---
name: server-rendered-change
description: Use when changing backend-rendered web flows, controllers, templates, forms, sessions, redirects, validation, or server-side view contracts.
---

# Server Rendered Change

Use this as the primary backend skill for server-rendered request/response flows.

## Workflow

1. Trace route, controller, middleware, template, form binding, session, authorization, and persistence boundaries together.
2. Preserve request parameter names, model/view keys, redirect targets, and validation behavior unless the change explicitly requires them.
3. Treat template fragments, stored procedures, mapper SQL, and session keys as contracts.
4. Verify GET, POST, validation failure, auth/session, and deployment-shape cases when relevant.

