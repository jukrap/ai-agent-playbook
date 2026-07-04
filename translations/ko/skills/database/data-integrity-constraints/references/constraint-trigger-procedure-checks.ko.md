# Constraint Trigger Procedure Checks

Constraint, trigger, stored procedure, generated column, application/database validation boundary를 통해 invariant를 enforce하거나 바꿀 때 사용합니다.

## Invariant Evidence

- Invariant를 business term과 database term으로 명시합니다.
- 현재 enforcement layer를 확인합니다. Database constraint, trigger, stored procedure, ORM validation, application service, batch repair, manual process 중 무엇인지 봅니다.
- Affected table, caller, write path, import, report, background job을 명시합니다.
- 더 엄격한 rule을 추가하거나 validate하기 전에 existing data violation을 확인합니다.

## Constraint And Routine Safety

- Unique constraint에는 duplicate detection과 repair plan이 필요합니다.
- Foreign key에는 orphan detection, delete/update behavior, import ordering review가 필요합니다.
- Not-null/check constraint에는 current null/invalid count와 default/backfill plan이 필요합니다.
- Trigger와 procedure에는 side-effect inventory, transaction behavior, caller compatibility, rollback note가 필요합니다.
- Database enforcement가 가능하지 않다면 application-only validation임을 명시합니다.

## Verification

- Positive/negative write case.
- Duplicate, orphan, null, invalid enum/range, cross-table reconciliation query.
- Affected path의 application write/read smoke check.
- Existing invalid data가 output을 형성했을 수 있으면 report/export/dashboard smoke check.

## Stop Conditions

- Invariant owner가 unknown입니다.
- Enforcement 전 existing violation이 unknown입니다.
- Trigger 또는 procedure side effect가 named scope 밖 data를 바꿀 수 있습니다.
- Rule 강화가 compatibility plan 없이 import, queue, legacy writer를 깨뜨릴 수 있습니다.
