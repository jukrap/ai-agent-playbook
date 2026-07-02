---
name: connector-integration-change
description: Use when changing API connectors, workflow nodes, MCP adapters, webhooks, OAuth apps, import/export bridges, sync jobs, third-party integrations, connector registration, or credential handling.
---

# Connector Integration Change

Use this as the primary backend skill for connector, adapter, webhook, and integration contract changes.

## Workflow

1. Identify connector type, host runtime, external contract, credential model, scopes, registration metadata, and supported operations.
2. Review request/response mapping, pagination, rate limits, retries, idempotency, timeout behavior, partial failures, and error wrapping.
3. Check credential references, secret handling, webhook lifecycle, generated schemas, and discoverability metadata.
4. Verify with contract examples, mocked or sandbox calls, integration tests, and release notes appropriate to the project.

## Reference

Read `references/connector-contract-checks.md` for connector contract, metadata, operation, and compatibility review.

Read `references/credential-webhook-error-handling.md` for credential, webhook lifecycle, retry, and error handling checks.
