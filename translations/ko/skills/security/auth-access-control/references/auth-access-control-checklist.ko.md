# Auth Access Control Checklist

## Model The Decision

- Actor: anonymous user, user, admin, service account, worker, webhook, integration, internal job.
- Resource: record, file, tenant, project, account, workflow, report, field, button, operation, secret.
- Action: read, list, create, update, delete, export, import, execute, approve, impersonate, configure.
- Scope: tenant, organization, project, team, department, role, owner, row, field, environment.
- Trust boundary: browser, mobile app, server, worker, external callback, third-party API, database.

## Checks

- Authentication은 identity를 증명하고 authorization은 action 허용 여부를 증명합니다. 둘을 대체하지 않습니다.
- UI hiding은 authorization이 아닙니다. Server-side check는 direct request를 거부해야 합니다.
- Role, department, user, tenant, data-rule grant는 서로 다른 의미를 가질 수 있습니다. Grant가 allow인지 restrict인지 둘 다인지 확인합니다.
- Default behavior는 명시해야 합니다. Protected operation은 default-deny, 의도적으로 public read일 때만 documented default-open으로 둡니다.
- Object-level authorization은 route 또는 role만이 아니라 특정 resource를 확인해야 합니다.
- Token/session expiry, revocation, refresh, logout, device/session concurrency를 함께 봅니다.
- Log는 security decision을 남기되 secret이나 과도한 personal data를 저장하지 않습니다.

## Verification Matrix

| Scenario | Expected proof |
|---|---|
| Allowed user | Intended role/scope에서 operation이 성공합니다. |
| Wrong role | UI button 또는 route를 직접 호출해도 server가 거부합니다. |
| Wrong owner/tenant/project | Server가 object-level access를 거부합니다. |
| Expired or invalid token/session | Server가 거부하고 side effect를 부분 적용하지 않습니다. |
| Missing permission config | Documented default를 따릅니다. |
| Field/data permission | Hidden, read-only, filtered, unrestricted state가 permission model과 일치합니다. |

## Common Mistakes

- List endpoint에서만 permission을 확인하고 detail/export/update endpoint를 놓칩니다.
- Code가 ID, code, policy name을 써야 하는데 role name이 안정적이라고 가정합니다.
- 새 endpoint를 추가하면서 audit log 또는 permission documentation을 갱신하지 않습니다.
- Data filter를 visibility-only로 다뤄 export, report, background job 영향을 놓칩니다.
- Token, cookie, authorization header, sensitive claim을 worklog나 test fixture에 남깁니다.
