# .NET Web Forms Stack Checks

## 함께 확인할 것

- `.aspx`, code-behind, designer file, master page, user control, validation control, data source, server control ID.
- Page lifecycle: Init, Load, postback check, validation, event handler, data binding, PreRender, ViewState, control recreation.
- Web.config, app setting, connection string, handler/module, session state, authentication mode, IIS pipeline, deployment transform.
- Server control이 내보내는 client script, UpdatePanel/AJAX behavior, hidden field, CSS나 JavaScript가 사용하는 generated ID.

## 변경 위험

- Control rename/move는 designer file, event hookup, CSS selector, JavaScript, ViewState를 불일치시킬 수 있습니다.
- Data binding order는 `IsPostBack`에 따라 user input을 덮어쓰거나 row를 중복하거나 validation을 건너뛸 수 있습니다.
- ViewState와 session assumption은 real postback, expired session, load-balanced deployment 전까지 bug를 숨길 수 있습니다.
- IIS와 framework version 차이는 handler behavior, request validation, encoding, authentication을 바꿀 수 있습니다.

## 검증

- Initial load, postback success, validation failure, event handler path, auth/session failure, refresh/back-button behavior를 실행합니다.
- Generated client ID, hidden field, ViewState size, validation summary, data-bound value, JavaScript hook을 확인합니다.
- Web.config 또는 transform 변경은 local debug default만 보지 말고 deployment-shaped setting으로 확인합니다.
- Page가 side effect를 가지면 data change, export, file upload, report, print output을 검증합니다.
- 경계를 넘으면 `backend/server-rendered-change`, `database/data-integrity-constraints`, `security/auth-access-control`과 함께 사용합니다.
