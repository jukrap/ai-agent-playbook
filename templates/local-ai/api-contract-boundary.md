# API Contract Boundary

Use this guide when frontend/backend contracts are unclear.

## Principles

- Do not guess endpoints, request/response fields, status codes, or wrapper shapes.
- Swagger/OpenAPI can differ from backend DTOs, command objects, mappers, and actual responses.
- Separate frontend domain types from backend DTOs.
- Keep page/widget code away from endpoint paths and transport details.
- Treat mock mode as explicit development support, not a way to hide remote failures.

## Check order

1. Find the current API client, base URL, environment mode, and mock/remote switch.
2. Use `rg` to find call sites for the relevant endpoint.
3. Collect available backend docs, DTOs, and real network responses.
4. Decide where request mapping and response adaptation belong.
5. Separate responsibilities for domain types, API functions, query/mutation options, and UI use.
6. Check failure states, empty results, authorization/session expiry, and validation errors.

## Adapter rules

- Handle original backend fields inside adapters.
- Do not leak unnecessary `snake_case` outside the domain boundary.
- Unwrap wrapper responses at the API boundary.
- Decide nullable values, empty strings, numeric strings, and date strings from the real contract.
- Mark unclear values as TODOs, blockers, or user-confirmed assumptions instead of guessing.

## Mock and remote

- Make mock data satisfy domain types.
- Do not silently fall back to mock data in remote mode.
- If the backend is unavailable, prefer disabled, notice, or blocker states over fake success.
- If a local demo needs mock mode, make that mode explicit.

## Verification

- Add or update API unit tests or adapter tests when available.
- If real network calls are possible, inspect request payloads and response shapes.
- Verify at least one failure response when feasible.
- In PRs or worklogs, record the confirmed contract source and remaining uncertainty.
