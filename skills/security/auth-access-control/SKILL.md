---
name: auth-access-control
description: Use when changing login, sessions, OAuth/OIDC, JWTs, RBAC, permissions, roles, tenants, scopes, or object-level authorization.
---

# Auth Access Control

Use this as the primary security skill for authentication and authorization changes.

## Workflow

1. Identify actors, resources, actions, ownership, tenant/project scope, and trust boundaries.
2. Separate authentication, session/token handling, authorization decisions, and UI affordances.
3. Confirm default-deny behavior, object-level checks, privilege escalation paths, and audit/logging needs.
4. Verify allowed, denied, expired/invalid session, cross-tenant, and direct-object-access cases.

## Reference

Read `references/auth-access-control-checklist.md` before editing auth, permission, role, tenant, or field/data access behavior.
