# Request Error Contract

Use this reference for request parsing, validation, exception mapping, error envelopes, and client-visible failure behavior.

## Inventory

- Entry surface: route, RPC method, webhook endpoint, form post, CLI command, or batch import.
- Input contract: path/query/body/header fields, uploaded files, content type, schema version, defaults, coercion, and unknown-field behavior.
- Validation owner: framework validator, schema library, DTO class, middleware, service guard, database constraint, or external provider response.
- Error mapper: exception filter, middleware, global handler, route-local helper, domain error translator, or reverse proxy.
- Consumer: browser UI, mobile app, SDK, partner integration, batch importer, monitoring rule, or generated client.

## Error Taxonomy

| Failure path | Review focus |
| --- | --- |
| Parse failure | malformed JSON/form/multipart, content type, body size, upload limits |
| Validation failure | field paths, messages, localization keys, error codes, default/coercion behavior |
| Authorization failure | auth required, denied scope, tenant/object access, avoid existence leaks |
| Business rule failure | domain code, conflict explanation, user action, retryability |
| Not found/conflict | stable status, object visibility, idempotency, client cache behavior |
| Rate limit/quota | retry-after, limit identity, user-safe explanation, telemetry |
| Unexpected error | sanitized body, correlation id, log/trace detail, alerting |

## Contract Rules

- Do not change error envelope shape, status code, machine-readable code, or field path naming without checking consumers.
- Prefer stable machine-readable codes over parsing human messages.
- Keep user-facing messages generic enough to avoid leaking secrets, object existence, internal paths, SQL, stack traces, tokens, or provider payloads.
- Keep validation close to the request boundary, but do not duplicate domain invariants inconsistently across controller and service layers.
- If database constraints enforce the real invariant, map those failures into the same client-visible contract as pre-validation.
- For versioned APIs, decide whether the error contract belongs to the old version, new version, or a compatibility adapter.

## Verification

- Contract tests or snapshot tests for success and representative failure paths.
- Consumer tests for UI form mapping, SDK error handling, retry behavior, and generated clients.
- Security checks for existence leaks, verbose stack traces, reflected input, and sensitive values in logs.
- Observability checks for correlation id, route, error code, sanitized validation summary, and alert severity.
- Migration note when old clients may receive a new code or field path.
