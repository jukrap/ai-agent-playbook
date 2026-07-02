# Lock And Deployment Window

Migration safety가 lock, long-running statement, deployment window, batching, operational coordination에 의존할 때 사용합니다.

## Lock Evidence

- Table rewrite, large table scan, constraint validation, index rebuild, write blocking 가능성이 있는 statement를 확인합니다.
- Migration tool이나 DBMS가 concurrent index creation, online DDL, not-valid constraint, phased validation, explicit lock timeout을 지원하는지 확인합니다.
- 사용 가능한 local evidence 기준으로 affected row count, index size, table size, hot-write path를 추정합니다. Production metric을 지어내지 않습니다.
- High-risk DDL 실행 전 dry run, explain, estimate, DBA-reviewed plan을 우선합니다.

## Deployment Coordination

- Application version order를 명시합니다. Schema first, app first, dual-write, feature flag, queue/job pause, maintenance window 중 무엇인지 봅니다.
- Background job, scheduled import, report generation, export, API write 중 pause 또는 watch 대상이 있는지 확인합니다.
- Runtime evidence는 검토 전까지 `.ai-playbook/runtime/reports` 또는 동등한 generated-output 영역에 둡니다.
- 검토된 decision이나 durable constraint만 memory map 또는 contract로 승격합니다.

## Verification

- Migration dry run 또는 tool preview.
- 지원되는 경우 lock timeout 또는 online DDL option review.
- Before/after row count, duplicate/orphan check, 대표 read/write smoke check.
- Query가 변경 schema에 의존하면 report/export/dashboard smoke check.

## Stop Conditions

- High-volume table의 lock behavior가 unknown입니다.
- Migration에 maintenance window가 필요하지만 owner 또는 window가 명시되지 않았습니다.
- Change가 write, queue, import를 block할 수 있는데 pause/retry plan이 없습니다.
- Project config나 docs 증거 없이 DBMS feature를 가정합니다.
