# jQuery Browser Stack Checks

## 함께 확인할 것

- Active HTML/template, server-rendered fragment, script include order, selector scope, delegated event, global, plugin initialization.
- AJAX URL, payload name, response shape, validation message, date/number formatting, script가 쓰는 hidden server-rendered value.
- CSS hook, ID/class/data attribute, modal/table/date picker plugin, repeated partial render, dynamic DOM insertion point.
- Browser constraint, old syntax support, polyfill, bundled/minified file, manually copied vendor script.

## 변경 위험

- Render마다 event를 bind하면 duplicate handler, double submit, repeated AJAX call, memory leak이 생길 수 있습니다.
- ID/class/data attribute 변경은 CSS, plugin, test, server fragment, unrelated file의 selector를 깨뜨릴 수 있습니다.
- Plugin lifecycle bug는 modal reopen, table redraw, tab switch, partial refresh, validation failure 이후에 자주 드러납니다.
- Old browser나 intranet constraint가 있으면 local browser에서는 동작해도 modern syntax를 거부할 수 있습니다.

## 검증

- First load, changed interaction, repeated action, modal reopen, validation failure, dynamic DOM update, browser back/refresh behavior를 실행합니다.
- Console error, network request, request payload, response handling, loading/error state, duplicate submission을 확인합니다.
- Partial render, hidden/visible state change, data reload 이후 plugin initialization과 teardown을 확인합니다.
- Script가 수동 복사 또는 concat되는 경우 minified/bundled output이나 deployment script order를 확인합니다.
- 경계를 넘으면 `frontend/browser-dom-change`, `backend/api-contract-boundary`, `frontend/visual-regression-qa`와 함께 사용합니다.
