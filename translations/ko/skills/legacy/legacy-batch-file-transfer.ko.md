# Legacy Batch File Transfer

Scheduled batches, cron jobs, Windows Task Scheduler, CSV/Excel import-export, SFTP/file drops, EDI-like transfers, nightly integrations를 유지보수할 때 사용합니다.

## 진행 절차

1. scheduler, trigger time, input/output folders, filename patterns, encoding, delimiter, retention rules를 식별합니다.
2. parsing, validation, deduplication, retries, partial failure, archive/error handling을 추적합니다.
3. timezone, holidays, business-day rules, file locks, concurrent runs, large-file behavior를 확인합니다.
4. 모든 producer/consumer를 업데이트하지 않으면 file format contracts를 보존합니다.
5. 가능하면 good file, malformed file, duplicate file, empty file, rerun scenarios로 검증합니다.

## Guardrails

- batch job을 non-idempotent하게 만들지 않습니다.
- archive/recovery story 없이 file을 delete/overwrite하지 않습니다.
- partial failures를 success logs 뒤에 숨기지 않습니다.
