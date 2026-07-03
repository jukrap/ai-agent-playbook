# 위협 모델과 데이터 노출

민감 데이터, tenant 분리, export, log, analytics, cache, AI context, tool output을 다루는 변경에서 사용합니다.

## 경로 모델링

- 자산: credential, session, personal data, tenant data, business data, source code, prompt, memory, log, file, audit record.
- 행위자: anonymous user, authenticated user, tenant admin, global admin, support operator, worker, webhook sender, dependency, model, MCP server, attacker-controlled content.
- 경계: browser/server, tenant/admin, public/private network, app/database, tool/model, local/remote filesystem, cache/source of truth, runtime/memory.
- sink: response body, rendered HTML, export, log, trace, metric label, cache entry, search index, analytics event, AI prompt/context, tool argument, third-party API.

## 노출 점검

- Object-level authorization은 route entry만이 아니라 data lookup 또는 policy boundary에서 확인합니다.
- Tenant/workspace id가 query, cache key, event, job payload, generated artifact에 필요한 만큼 포함되어 있는지 확인합니다.
- Log, trace, metric, report, AI prompt, screenshot에 들어가기 전에 민감 필드를 redact 또는 hash합니다.
- Not found, denied, validation, search response에서 존재 여부가 새지 않게 합니다.
- Export와 download는 authorization, retention, audit, rate limit 기준으로 제한합니다.
- 원본이 민감하면 generated summary도 파생 민감 데이터로 봅니다.

## 위험 이야기

| 이야기 | 확인할 증거 |
| --- | --- |
| Cross-tenant read | Query constraint, policy test, cache key dimension, denied fixture. |
| Privilege escalation | Role/scope mapping, admin boundary, object ownership, mutation audit. |
| Log/trace leak | Redaction code, sample log line, crash report, metric label. |
| Export leak | Filter ownership, file naming, retention, download authorization. |
| AI/tool leak | Prompt context selection, tool argument, memory write, citation boundary. |

## 검증

- Tenant/object/role access denied negative test.
- 대표 민감 필드 redaction test.
- Cached response에 user, tenant, role, locale, feature state가 있으면 cache isolation test.
- Unauthorized/authorized actor로 export 또는 report smoke.
- Runtime evidence를 durable memory로 승격하기 전 generated artifact 검토.
