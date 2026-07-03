# Threat Model And Data Exposure

Use this reference when a change handles sensitive data, tenant separation, exports, logs, analytics, caches, AI context, or tool output.

## Model The Path

- Assets: credentials, sessions, personal data, tenant data, business data, source code, prompts, memory, logs, files, and audit records.
- Actors: anonymous user, authenticated user, tenant admin, global admin, support operator, worker, webhook sender, dependency, model, MCP server, and attacker-controlled content.
- Boundaries: browser/server, tenant/admin, public/private network, app/database, tool/model, local/remote filesystem, cache/source of truth, and runtime/memory.
- Sinks: response body, rendered HTML, export, log, trace, metric label, cache entry, search index, analytics event, AI prompt/context, tool argument, and third-party API.

## Exposure Checks

- Verify object-level authorization at the data lookup or policy boundary, not only at route entry.
- Confirm tenant or workspace id is present in every query, cache key, event, job payload, and generated artifact that needs isolation.
- Redact or hash sensitive fields before logs, traces, metrics, reports, AI prompts, and screenshots.
- Prevent existence leaks in not-found, denied, validation, and search responses.
- Keep exports and downloads bounded by authorization, retention, watermark/audit needs, and rate limits.
- Treat generated summaries as derived sensitive data when the source was sensitive.

## Risk Stories

| Story | Evidence to seek |
| --- | --- |
| Cross-tenant read | Query constraints, policy tests, cache key dimensions, and denied fixture. |
| Privilege escalation | Role/scope mapping, admin boundary, object ownership, and mutation audit. |
| Log or trace leak | Redaction code, sample log line, crash report, and metric labels. |
| Export leak | Filter ownership, file naming, retention, and download authorization. |
| AI/tool leak | Prompt context selection, tool arguments, memory writes, and citation boundaries. |

## Verification

- Negative tests for denied tenant/object/role access.
- Redaction tests for representative sensitive fields.
- Cache isolation tests when cached responses include user, tenant, role, locale, or feature state.
- Export or report smoke with an unauthorized and authorized actor.
- Review of generated artifacts before promoting runtime evidence into durable memory.
