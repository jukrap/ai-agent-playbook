# MCP Runtime Boundaries And Permissions

Use this reference when an MCP server is more than a small stdio wrapper: long-lived daemon, HTTP/SSE transport, queued execution, remote tunnel, approval workflow, indexed search bridge, or credential-bearing runtime.

## Runtime Shape

- Separate protocol parsing, transport/session management, tool execution, and response formatting. A facade can coordinate them, but each layer should be testable on its own.
- Keep session state explicit: session id, transport, registered tools, pending calls, pending responses, and cleanup behavior.
- Treat queue mode as a different execution strategy, not as a hidden branch inside every tool. Record when a request is accepted, queued, completed, failed, or abandoned.
- Add cleanup for closed transports, cancelled requests, idle daemons, stale pending responses, and version mismatch restarts.

## Local Daemon Boundary

- Bind local helper servers to loopback by default.
- Store local daemon state files with owner-only permissions when they contain ports, process ids, tokens, or socket paths.
- Health checks should prove liveness without leaking root tokens, secrets, or local paths.
- Version or binary mismatch should restart the helper cleanly instead of letting stale code serve new commands.
- Logs should be bounded and should not include credential values, cookie values, raw private prompts, or unredacted tool payloads.

## Remote Or Tunnel Surface

- Do not expose the full local daemon surface through a tunnel or forwarded port.
- Prefer a separate listener, route allowlist, or equivalent hard boundary for remote access.
- Root/admin tokens should not work on a remote tunnel surface. Mint scoped tokens for the narrow command set that remote callers may use.
- Deny unknown routes loudly and record denial reasons in a bounded audit log.
- Event streams need their own restricted session mechanism when the client cannot send normal authorization headers.

## Approval And Write Gates

- Model approval tools as protocols with initialization, capability listing, request, decision, unknown method, malformed input, and denied-state tests.
- Default-deny and auto-deny modes should be testable without live external services.
- A write-capable MCP tool should require server opt-in, validated target path, dry-run preview, explicit `apply`, and durable audit evidence.
- Tool descriptions must not imply write permission when the server is running in read-only mode.

## Search/Read Bridges

- Keep retrieval MCP tools minimal: one tool to find candidates and one tool to read exact evidence is often enough.
- Enforce allowed source scopes on the server, not only through a client-provided query parameter.
- Return reopenable locators, ranges, freshness notes, and caveats with search hits.
- Treat indexes, caches, and embeddings as derived artifacts. The source registry or durable memory should state what is authoritative.

## Credential And Config Boundary

- Resolve `env:` and `file:` credential references where the trusted server runs, not inside thin clients or agent prompts.
- Store credential references and scopes, not raw values, in metadata.
- Document which environment owns config, queue state, cache, index, and connector credentials.
- Verify missing, expired, insufficient-scope, revoked, and malformed credential cases.

## Verification

- Protocol tests: initialize, list tools/resources, call tool, unknown method, invalid params, and error envelope.
- Permission tests: read-only mode hides or refuses writes; opt-in mode still requires `apply`.
- Session tests: pending response cleanup, cancelled request, closed transport, queue worker failure, and reconnect.
- Remote-surface tests: denied root token, denied unknown route, allowed scoped command, and audit log entry.
- Search/read tests: allowed scope, denied scope, missing source, exact range read, stale index warning, and no write.
