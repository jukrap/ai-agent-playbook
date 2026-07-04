# API Contract Boundary

Use this guide when implementing, debugging, or reviewing API integration, DTO mapping, mock-vs-remote behavior, request payloads, response adapters, or uncertain backend contracts.

## Workflow

1. Find the current API client, base URL, environment mode, and mock/remote switch.
2. Confirm request and response shape from backend docs, DTOs, OpenAPI specs, logs, fixtures, or actual network responses.
3. Keep backend DTOs separate from frontend/domain models.
4. Convert naming, nullability, wrapper envelopes, dates, errors, and status handling at the API boundary.
5. Do not leak uncertain backend fields through UI state or component props.
6. Do not hide remote failures with mock fallback unless explicitly requested.

## Evidence

Record the confirmed contract source:

- source file or endpoint
- sample request
- sample response
- remaining uncertainty
- verification command or manual check

For long-lived projects, keep durable API facts in `.ai-playbook/memory/maps/api-map.md`.
