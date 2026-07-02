# Database Migration

Inputs: schema delta, data volume, rollback needs, deployment order, dependent services.

Outputs: migration plan, risk note, verification query list, rollback note.

Skills: database change safety, backend contract boundary, legacy risk check when applicable.

Tools: `operator search`, `operator preflight`, `contracts check`, `write-gate preview`.

Stop conditions: unknown production data shape, no rollback path for destructive change, unbounded lock risk.

Verification: migration dry run, before/after query checks, application compatibility checks.

