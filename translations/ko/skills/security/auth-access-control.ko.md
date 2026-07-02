# Auth Access Control

authentication과 authorization 변경을 위한 primary security skill입니다.

## Workflow

1. actor, resource, action, ownership, tenant/project scope, trust boundary를 확인합니다.
2. authentication, session/token handling, authorization decision, UI affordance를 분리합니다.
3. default-deny behavior, object-level check, privilege escalation path, audit/logging need를 확인합니다.
4. allowed, denied, expired/invalid session, cross-tenant, direct-object-access case를 검증합니다.

## Reference

auth, permission, role, tenant, field/data access behavior를 수정하기 전 `references/auth-access-control-checklist.md`를 읽습니다.
