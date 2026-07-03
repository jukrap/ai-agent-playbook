---
name: api-contract-boundary
description: Use when implementing, debugging, or reviewing frontend/backend API integration, DTO mapping, mock-vs-remote behavior, payloads, adapters, or uncertain contracts.
---

# API Contract Boundary

Keep backend uncertainty at the API boundary instead of leaking it through the UI.

## Workflow

1. Inspect existing API client, env mode, mock/remote switch, endpoint usage, and adapter patterns.
2. Confirm request/response shape from available backend docs, DTOs, mappers, logs, or actual network responses.
3. Keep backend DTOs and frontend domain types separate.
4. Handle wrapper responses, naming conversion, nullable values, and error shapes at the API boundary.
5. Do not hide remote failures with mock fallback unless explicitly requested.

## Reference

Read `references/api-boundary-checklist.md` before changing API integration or diagnosing contract bugs.
