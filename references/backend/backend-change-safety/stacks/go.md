# Go Backend Profile

Use with `backend-change-safety` after confirming a Go backend.

## Common Surfaces

- HTTP handlers, middleware, service packages, repository packages, goroutines, workers, CLIs, and generated API clients.
- Context propagation, cancellation, channels, database/sql, sqlc, gorm, ent, and config structs.

## Review Points

- Pass `context.Context` through I/O boundaries and respect cancellation/timeouts.
- Keep handler parsing/validation separate from business logic when local packages already do.
- Check goroutine lifecycle, channel closing, duplicate work, and shutdown behavior.
- Treat error wrapping, sentinel errors, and status-code mapping as contracts.

## Verification

- Table-driven unit tests for business rules and error mapping.
- Handler tests for request, response, and auth behavior.
- Race-sensitive paths should run with the repository's race-test command when available.
