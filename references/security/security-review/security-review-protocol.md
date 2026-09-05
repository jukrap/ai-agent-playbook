# Security Review Protocol

Use this reference to turn a broad security review into a bounded development check with concrete evidence and a clear decision.

## Scope The Review

- State the changed surface: route, component, service, job, permission rule, dependency, config, schema, storage path, integration, or agent/tool surface.
- Identify assets: credentials, sessions, tokens, user data, business data, audit data, files, model memory, logs, and execution capability.
- Identify actors: anonymous user, authenticated user, admin, internal operator, service account, worker, webhook sender, MCP server, dependency, and attacker-controlled content.
- Draw trust boundaries: browser/server, public/private network, tenant/admin, project/global config, tool/model, local/remote filesystem, and internal/external service.
- List entrypoints and sinks: input, transform, persistence, command execution, network call, external message, log, alert, export, and cache.

## Risk Classes

| Class | Review focus |
|---|---|
| Secret exposure | Env vars, API keys, tokens, logs, browser bundles, build artifacts, crash reports, and copied fixtures. |
| Authn/authz | Missing identity checks, confused deputy paths, role drift, tenant boundary leaks, and stale session handling. |
| Input/output | Injection, unsafe parsing, file path traversal, XSS, SSRF, deserialization, unsafe template output, and content-type mismatch. |
| Data integrity | Unauthorized mutation, replay, duplicate delivery, stale writes, weak validation, and missing audit trail. |
| Supply chain | New dependencies, install scripts, binary artifacts, transitive CVEs, license/notice drift, and untrusted generated code. |
| Operational | Debug endpoints, verbose errors, insecure defaults, missing rate limits, unsafe rollback, and monitoring blind spots. |

## Review Procedure

1. Start from the data-flow path, not the file diff alone. Follow sensitive values from source to sink.
2. Convert every concern into an exploit story: actor, precondition, action, impact, and observable signal.
3. Prefer the smallest mitigation that closes the path: deny by default, validate before trust boundary crossing, redact at source, limit scope, or require explicit approval.
4. Add a regression check when the exploit path is stable enough to test.
5. For risks that cannot be fully closed, record residual risk, owner, monitoring signal, and rollback or containment plan.

## Evidence

- Code locations for entrypoint, policy check, validation, sink, and test.
- Exact command output for dependency, license, static analysis, or test checks when available.
- Manual verification notes with account/role, route/job, payload shape, and expected denial or redaction behavior.
- Risk decision: accepted, mitigated, deferred with owner, or blocked.

## Stop Conditions

- A secret may be written to source control, logs, generated artifacts, browser-visible payloads, or external services.
- The change crosses tenant, role, admin, execution, or network trust boundaries without a clear policy check.
- A dependency or tool asks for broad filesystem, shell, network, token, or project-config access without bounded need.
- The review cannot identify the sensitive data path or execution boundary.
- The change creates a new public entrypoint without rate limit, auth policy, input validation, and failure behavior.
