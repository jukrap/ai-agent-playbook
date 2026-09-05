# PHP LAMP Stack Checks

## 함께 확인할 것

- Entry script, include order, shared config, bootstrap file, session start, auth guard, global, superglobal, form post handler.
- Direct SQL, escaping layer, charset/collation, timezone, file path, upload directory, temp file, output buffering, error reporting mode.
- Template fragment, inline script, hidden input, query-string parameter, cookie, redirect, server-rendered JavaScript value.
- Hosting constraint: PHP version, extension, Apache/Nginx rewrite rule, document root, filesystem permission, cron job, deployment copy order.

## 변경 위험

- Include order나 global mutation은 bootstrap file을 공유하는 관련 없는 page를 바꿀 수 있습니다.
- Parameter rename은 다른 곳에서 생성한 form, AJAX, redirect, export, pagination link를 깨뜨릴 수 있습니다.
- Escaping, character encoding, direct SQL이 섞여 있으면 작은 UI 변경도 injection, mojibake, data-loss bug로 번질 수 있습니다.
- File upload/download path는 hosting-specific permission과 temporary directory에 의존하는 경우가 많습니다.

## 검증

- GET, POST success, validation failure, auth/session failure, redirect, refresh/back-button, repeated-submit behavior를 실행합니다.
- 변경된 data path의 SQL parameter, affected row, transaction 또는 manual rollback expectation, output encoding을 확인합니다.
- Page가 file/report를 다루면 file upload/download, generated CSV/Excel/PDF, email, print output을 확인합니다.
- Include path, deployment root, extension assumption이 바뀌면 server log 또는 visible error mode를 확인합니다.
- Data나 auth를 건드리면 `backend/server-rendered-change`, `database/database-change-safety`, `security/security-review`와 함께 사용합니다.
