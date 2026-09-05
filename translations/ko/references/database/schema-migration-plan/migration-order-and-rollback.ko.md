# Migration Order And Rollback

Schema, seed, index, view, trigger, stored procedure, migration script 변경이 application compatibility나 production data에 영향을 줄 수 있을 때 사용합니다.

## Change Classification

- Additive compatible: 새 nullable column, 새 table, 새 index, required가 아닌 view, optional seed data.
- Compatibility-sensitive: rename, type change, enum change, non-null default, unique constraint, foreign key, generated column, stored procedure signature, trigger logic.
- Destructive: drop, delete, truncate, irreversible transformation, data rewrite, one-way migration.
- Backfill: 기존 row update, missing value repair, derived value recompute, batching이 필요한 변경.

## Plan Shape

- Affected table, column, routine, job, application module, report, export, external consumer를 명시합니다.
- Old/new application version이 겹칠 수 있으면 expand phase와 contract phase를 분리합니다.
- Backfill은 idempotent하고 restartable하게 유지합니다. Batch size, ordering key, expected volume, retry behavior를 기록합니다.
- Read path, write, report, job이 이동한 뒤 나중 단계에서 destructive cleanup을 수행합니다.
- 실행 전 dry-run과 preview output을 우선합니다. Generated output은 검토 전까지 evidence candidate로 취급합니다.

## Rollback Evidence

- Rollback이 DDL revert, backup restore, compensating migration, feature flag disable, job stop 중 무엇인지 기록합니다.
- Destructive change는 backup/export/restore evidence와 rollback 가능한 마지막 지점을 명시합니다.
- 겹치는 배포가 가능하면 old app against new schema, new app against old schema를 확인합니다.
- Reporting consumer는 migration success뿐 아니라 대표 report/export/dashboard output을 확인합니다.

## Stop Conditions

- Production data shape, table size, dependent consumer가 unknown입니다.
- Destructive change에 명시 확인과 rollback note가 없습니다.
- Backfill이 unbounded, non-idempotent이거나 recovery marker가 없습니다.
- Old/new application version이 intermediate schema를 모두 견디지 못합니다.
