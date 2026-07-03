# Database Coupling Map

Use this before changing a legacy system where database artifacts contain business behavior.

## Artifacts to trace

- Tables, columns, indexes, constraints, sequences, and lookup rows.
- Views, materialized views, synonyms, and linked-server references.
- Stored procedures, functions, packages, triggers, and scheduled jobs.
- ORM mappings, direct SQL strings, report queries, export queries, and ETL jobs.
- Migration scripts, seed scripts, backup/restore scripts, and manual support queries.

## Coupling questions

- Which application paths call the artifact?
- Which reports, exports, imports, dashboards, or partner files depend on the same shape?
- Does a trigger or job mutate data after application code writes it?
- Does the procedure return multiple result sets or overloaded shapes?
- Does the change affect locking, isolation, deadlock risk, or batch runtime?
- Is rollback possible without data loss?

## Change checks

- Procedure parameters: name, order, type, nullability, default, and output behavior.
- Result sets: column name, order, type, scale, nullability, and row ordering.
- Transactions: begin/commit location, rollback behavior, retry safety, and idempotency.
- Data migration: backfill, compatibility window, dual read/write needs, and verification query.
- Permissions: application role, report role, job account, and support account.

## Verification

- Representative existing data.
- Boundary data: null, empty, duplicate, old row, high volume, and malformed row where relevant.
- Caller verification for every known consumer.
- Query plan or runtime check for high-volume or locking-sensitive changes.
- Rollback rehearsal or documented rollback limit.

If the database is the contract, do not treat application tests alone as sufficient proof.
