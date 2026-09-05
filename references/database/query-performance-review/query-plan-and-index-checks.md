# Query Plan And Index Checks

Use this when a query performance change touches SQL shape, indexes, joins, sorting, pagination, aggregates, filters, or API read paths.

## Evidence To Gather

- Query text, caller, representative parameter values, and expected result semantics.
- Existing indexes, unique constraints, foreign keys, partition keys, and generated columns relevant to the query.
- Explain or estimate output when available, including scan type, join order, sort, filter selectivity, row estimates, and temporary materialization.
- Application-level query count when an N+1 or per-row lookup pattern is suspected.

## Review Heuristics

- Reduce rows early with selective filters and stable join keys.
- Keep sort and pagination deterministic. Avoid offset-only paging on large unstable result sets when keyset pagination fits.
- Avoid selecting unused large columns in list/export paths.
- Add indexes only with write cost, storage cost, migration lock risk, and rollback path understood.
- Confirm that a proposed index matches actual predicates, join columns, sort order, and cardinality.

## Change Safety

- Keep query rewrites behavior-preserving. Compare result counts and representative rows before and after.
- For new indexes, route lock and deployment concerns through `database/schema-migration-plan`.
- For API contract changes caused by query projection changes, route contract evidence through `backend/api-contract-boundary`.
- For dashboard/report semantic changes, preserve metric definitions and caveats.

## Stop Conditions

- No representative parameters or result correctness criteria are available.
- The proposed index does not match the query shape.
- Performance claims are based on intuition without explain, timing, row count, or local benchmark evidence.
- A query rewrite changes semantics without a product or contract decision.
