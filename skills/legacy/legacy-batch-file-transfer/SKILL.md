---
name: legacy-batch-file-transfer
description: Use when maintaining scheduled batches, cron jobs, Windows Task Scheduler, CSV/Excel import-export, SFTP/file drops, EDI-like transfers, or nightly integrations.
---

# Legacy Batch File Transfer

Protect idempotency, file contracts, and operational recovery.

## Workflow

1. Identify scheduler, trigger time, input/output folders, filename patterns, encoding, delimiter, and retention rules.
2. Trace parsing, validation, deduplication, retries, partial failure, and archive/error handling.
3. Check timezone, holidays, business-day rules, file locks, concurrent runs, and large-file behavior.
4. Preserve file format contracts unless every producer/consumer is updated.
5. Verify with good file, malformed file, duplicate file, empty file, and rerun scenarios where feasible.

## Guardrails

- Do not make batch jobs non-idempotent.
- Do not delete or overwrite files without an archive/recovery story.
- Do not hide partial failures behind success logs.

## Reference

Read `references/file-transfer-boundary.md` for batch contracts, file lifecycle, retry behavior, reconciliation, and operational recovery checks.
