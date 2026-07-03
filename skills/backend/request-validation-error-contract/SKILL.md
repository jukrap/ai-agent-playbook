---
name: request-validation-error-contract
description: Use when changing backend request parsing, validation, error responses, exception mapping, or client-visible failure contracts.
---

# Request Validation Error Contract

Protect request and failure contracts before changing backend validation or error handling.

## Workflow

1. Identify route, handler, schema, DTO, middleware, exception mapper, client callers, and documented error shape.
2. Separate parsing, validation, authorization, business rule failure, conflict, rate limit, and unexpected error paths.
3. Preserve stable status codes, error codes, field paths, localization keys, and retry semantics unless the change is explicitly versioned.
4. Keep sensitive values out of error bodies, logs, traces, and validation messages.
5. Verify success, invalid input, missing permission, conflict, not found, and unexpected failure paths.
6. Pair with `api-contract-boundary` when frontend mocks, generated clients, OpenAPI, or external consumers depend on the shape.

## Reference

Read `references/request-error-contract.md` before editing validators, DTOs, exception filters, middleware, or error response schemas.
