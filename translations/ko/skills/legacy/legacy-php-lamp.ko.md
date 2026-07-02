# Legacy PHP LAMP

Primary route: `backend/server-rendered-change`.

include files, sessions, mixed HTML/PHP pages, direct SQL, globals, form posts, shared hosting constraints가 있는 legacy PHP/LAMP application을 유지보수할 때 사용합니다.

## 진행 절차

1. entry PHP file, includes/requires, shared config, session start, auth checks, form handling을 추적합니다.
2. direct SQL, escaping, encoding, timezone, file upload, path assumptions를 확인합니다.
3. parameter names, session keys, include order, output buffering behavior를 보존합니다.
4. deployed PHP version과 hosting setup에 맞게 변경합니다.
5. GET/POST flow, validation failure, auth/session, database side effects를 검증합니다.

## Guardrails

- Composer, autoloading, framework convention이 있다고 가정하지 않습니다.
- 작은 legacy page 하나에 새 template architecture를 섞지 않습니다.
- stored data와 모든 caller 확인 없이 SQL 또는 encoding을 바꾸지 않습니다.

## Reference

Stack-specific check는 `references/php-lamp.md`를 읽습니다.
