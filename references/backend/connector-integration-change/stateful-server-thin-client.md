# Stateful Server Thin Client

Use this reference when a connector or integration has local clients, SDKs, CLI commands, workers, queues, caches, indexes, or server-side credential resolution.

## Boundary Rule

- Thin clients should parse commands, locate the server, package inputs, call the API, and render results.
- Stateful servers should own config, credentials, connector registration, jobs, queues, caches, indexes, and durable metadata.
- If a client must upload local bytes, isolate that as a special transport step; keep the connector sync contract consistent after upload.
- Do not let agent-side skills or CLI wrappers become hidden sources of truth for connector state.

## Connector Model

Track these concepts separately:

- Connector: the registered source or external service.
- Object: one addressable item under a connector, such as a file, table, issue, message, or record.
- Connector job: a sync or import run for the whole connector.
- Object task: one unit of work spawned by a connector job.
- Queue: durable work claiming and retry state.
- Cache: derived conversions or expensive intermediate outputs.
- Index: searchable/queryable derived data.
- Metadata store: registration, status, job/task state, fingerprints, and audit trail.

## Credential Resolution

- Prefer references such as `env:NAME` or `file:/path` over raw secret values in metadata.
- Resolve references in the server environment, because that is where workers and connectors run.
- Record required scopes and permission widening in the connector contract.
- Verify missing, expired, revoked, insufficient-scope, malformed, and wrong-environment credential cases.
- Keep credential values out of logs, fixtures, snapshots, worklogs, generated docs, and MCP responses.

## Job And Task Reliability

- Connector jobs should expose status, started/completed timestamps, failure reason, retry count, and affected object counts.
- Object tasks should be idempotent or have a replay/repair strategy.
- Workers need timeout, cancellation, shutdown, poison-message, and duplicate-delivery behavior.
- Partial failure should not make the whole connector look successful unless the contract explicitly supports partial success.
- Cache and index invalidation should be tied to source fingerprints or versioned transformation inputs.

## API And Client Contract

- The API should reveal enough state for a user or agent to answer: what is registered, what is running, what failed, what is searchable, and what needs repair.
- SDKs and CLIs should not duplicate business rules that live on the server.
- Errors should distinguish auth, permission, validation, rate limit, remote outage, retryable internal failure, and permanent unsupported operation.
- Search/read bridges should enforce server-side source scopes and return reopenable locators.

## Verification

- Register/update/delete connector contract tests.
- Credential reference resolution tests in the server environment.
- Connector job lifecycle tests: queued, running, partial failure, success, retry, cancellation.
- Object task idempotency and duplicate-delivery tests.
- Cache/index invalidation tests after source changes, permission changes, and schema changes.
- CLI/SDK smoke tests proving clients remain stateless and recover against a fresh server.
