# Legacy Database Heavy System

Business rules가 stored procedures, triggers, views, direct SQL, scheduled jobs, database-shaped contracts에 있는 legacy system을 유지보수할 때 사용합니다.

## Workflow

1. 변경과 관련된 tables, views, stored procedures, triggers, jobs, direct SQL call sites를 식별합니다.
2. application code와 database-side behavior를 모두 추적한 뒤 수정합니다.
3. transaction boundaries, locking, isolation, rollback behavior, batch volume을 확인합니다.
4. migration과 compatibility가 명시되지 않았으면 기존 data shape를 보존합니다.
5. representative data와 rollback path로 검증합니다.

## Guardrails

- 모든 caller 확인 없이 column rename, procedure parameter 변경, result set 변경을 하지 않습니다.
- ORM model이 모든 database behavior를 반영한다고 가정하지 않습니다.
- trigger side effect를 보이지 않는 구현 세부사항으로 취급하지 않습니다.
- schema, migration, data backfill, operational risks를 PR/worklog에 기록합니다.
