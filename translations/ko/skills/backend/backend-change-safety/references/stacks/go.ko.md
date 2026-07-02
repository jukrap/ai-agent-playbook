# Go Backend Profile

Go backend가 확인된 뒤 `backend-change-safety`와 함께 사용합니다.

## Common Surfaces

- HTTP handler, middleware, service package, repository package, goroutine, worker, CLI, generated API client.
- Context propagation, cancellation, channel, database/sql, sqlc, gorm, ent, config struct.

## Review Points

- I/O boundary를 따라 `context.Context`를 전달하고 cancellation/timeout을 존중합니다.
- Local package 구조가 있다면 handler parsing/validation과 business logic을 분리합니다.
- Goroutine lifecycle, channel closing, duplicate work, shutdown behavior를 확인합니다.
- Error wrapping, sentinel errors, status-code mapping은 contract로 다룹니다.

## Verification

- Business rule과 error mapping은 table-driven unit test.
- Request, response, auth behavior는 handler test.
- Race-sensitive path는 repository의 race-test command가 있으면 사용합니다.
