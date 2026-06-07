# Legacy Server-rendered Web

Templates, controllers, form posts, server validation, sessions, layouts, partials, mixed server/client behavior가 있는 server-rendered web pages를 유지보수할 때 사용합니다.

## 진행 절차

1. route/controller, view model, template, form action, validation, redirect flow를 추적합니다.
2. markup 또는 CSS 변경 전 layout/partial/include reuse를 확인합니다.
3. form field names, hidden inputs, CSRF/session behavior, error display를 보존합니다.
4. 프로젝트가 server-rendered fallback에 의존하면 JavaScript enhancement를 그 흐름과 호환되게 유지합니다.
5. 관련 있으면 GET, successful POST, validation failure, auth/session edge case를 검증합니다.

## Guardrails

- server binding 확인 없이 field를 rename하지 않습니다.
- 모든 consumer 확인 없이 shared fragment 밖으로 markup을 이동하지 않습니다.
- template naming만 보고 AJAX response shape를 가정하지 않습니다.
- backend/template contract uncertainty를 worklog 또는 PR에 기록합니다.
