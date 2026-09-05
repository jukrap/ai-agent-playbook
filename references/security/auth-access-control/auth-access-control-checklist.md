# Auth Access Control Checklist

## Model The Decision

- Actor: anonymous user, user, admin, service account, worker, webhook, integration, or internal job.
- Resource: record, file, tenant, project, account, workflow, report, field, button, operation, or secret.
- Action: read, list, create, update, delete, export, import, execute, approve, impersonate, or configure.
- Scope: tenant, organization, project, team, department, role, owner, row, field, or environment.
- Trust boundary: browser, mobile app, server, worker, external callback, third-party API, and database.

## Checks

- Authentication proves identity; authorization proves allowed action. Do not use one as a substitute for the other.
- UI hiding is not authorization. Server-side checks must reject direct requests.
- Role, department, user, tenant, and data-rule grants can have different semantics. Confirm whether grant means allow, restrict, or both.
- Default behavior should be explicit: default-deny for protected operations, documented default-open only for intentionally public reads.
- Object-level authorization must check the specific resource, not only the route or role.
- Token/session expiry, revocation, refresh, logout, and device/session concurrency must be considered together.
- Logs should capture security-relevant decisions without storing secrets or excessive personal data.

## Verification Matrix

| Scenario | Expected proof |
|---|---|
| Allowed user | Operation succeeds for the intended role/scope. |
| Wrong role | Server rejects even if the UI button or route is called directly. |
| Wrong owner/tenant/project | Server rejects object-level access. |
| Expired or invalid token/session | Server rejects and does not partially apply side effects. |
| Missing permission config | Behavior follows documented default. |
| Field/data permission | Hidden, read-only, filtered, and unrestricted states match the permission model. |

## Common Mistakes

- Checking permission only when listing records, then forgetting detail/export/update endpoints.
- Assuming role names are stable when code should use IDs, codes, or policy names.
- Adding a new endpoint without updating audit logs or permission documentation.
- Treating data filters as visibility-only when they also affect exports, reports, and background jobs.
- Recording tokens, cookies, authorization headers, or sensitive claims in worklogs or test fixtures.
