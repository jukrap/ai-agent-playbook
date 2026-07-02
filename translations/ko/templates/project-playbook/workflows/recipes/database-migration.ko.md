# Database Migration

Inputs: schema delta, data volume, rollback needs, deployment order, dependent services.

Outputs: migration plan, risk note, verification query list, rollback note.

Skills: database change safety, backend contract boundary, 필요 시 legacy risk check.

Tools: `operator search`, `operator preflight`, `contracts check`, `write-gate preview`.

Stop conditions: 알 수 없는 production data shape, destructive change rollback path 없음, unbounded lock risk.

Verification: migration dry run, before/after query check, application compatibility check.

