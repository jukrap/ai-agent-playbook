# Lineage And Consumer Impact

Use this when data moves across ingestion, transformation, serving, dashboard, export, API, or retrieval boundaries.

## Lineage Map

- Map producer, ingestion point, transformation job, intermediate dataset, serving dataset, and consumer.
- Record schedule, trigger, retry behavior, idempotency, owner, and freshness expectation for each step.
- Mark manual imports, ad hoc repair scripts, backfills, and external provider data as special lineage nodes.
- Keep low-confidence lineage and generated hints separate from reviewed maps.

## Consumer Impact

- List dashboards, reports, exports, API responses, downstream jobs, ML/retrieval features, and manual consumers.
- Check breaking changes for grain, filters, identifiers, timezone, ordering, deduplication, retention, and null semantics.
- Record migration or compatibility windows when consumers need staged adoption.
- Add caveats or handoff notes when a consumer cannot be verified.

## Stop Conditions

- A transformation or consumer is unknown for a shared dataset.
- Lineage evidence conflicts with current code, docs, or contracts.
- A consumer-facing metric or export changes without owner review.
- Generated lineage is promoted into memory without review.
