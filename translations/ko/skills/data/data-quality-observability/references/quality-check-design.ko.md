# Quality Check Design

Pipeline, report, import, export, stream, warehouse dataset의 data quality check를 추가하거나 검토할 때 사용합니다.

## Check Types

- Source check: record count, required field, null rate, duplicate identifier, timestamp range, file completeness, provider status.
- Transform check: join loss, orphan record, referential integrity, enum/range rule, row-level dedupe, late data, idempotency.
- Consumer check: metric total, dashboard row count, export shape, segmentation total, sampled business record.
- Repair check: before/after count, affected window, irreversible cleanup, replay behavior, owner approval.

## Design Rules

- Dataset grain, scan window, sample size, severity, threshold, owner, failure action을 명시합니다.
- 넓은 anomaly claim보다 deterministic check를 우선합니다.
- 민감 데이터가 포함될 수 있는 raw sampled row는 public docs에 넣지 않습니다.
- Generated report는 검토 전까지 runtime output에 보관합니다.

## Stop Conditions

- Check scope, threshold, owner, remediation path가 없습니다.
- Destructive repair에 dry-run evidence와 rollback 또는 compensation plan이 없습니다.
- Quality evidence가 주장에 비해 너무 좁게 sampling되었습니다.
- Sensitive record가 reusable docs에 복사됩니다.
