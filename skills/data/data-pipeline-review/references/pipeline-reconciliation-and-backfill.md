# Pipeline Reconciliation And Backfill

Use this reference when an analytics, ETL, batch, reporting, or data product pipeline can silently drift from source truth.

## Pipeline Inventory

Map the path before changing it:

- Sources: database tables, events, files, APIs, streams, manual uploads, and external exports.
- Transformations: extraction, normalization, joins, enrichment, dedupe, aggregation, model scoring, and publishing.
- Runtime: schedule, trigger, retry policy, concurrency, partitioning, watermark, checkpoint, and owner.
- Outputs: tables, marts, dashboards, reports, exports, alerts, machine consumers, and manual workflows.
- Contracts: grain, primary keys, time window, freshness target, retention, field meanings, and metric definitions.

## Contract And Drift Checks

- Confirm source owner, authoritative grain, primary identifiers, timezone, currency, denominator, and null semantics.
- Check added, removed, renamed, retyped, late-arriving, duplicated, deleted, and corrected records.
- Separate raw source fields from derived fields and generated evidence.
- Identify consumers that rely on undocumented fields, implicit filters, load order, or old naming.
- Track schema drift as a contract event, not as a mapper inconvenience.

## Idempotency And Replay

- A job should tolerate repeated runs for the same partition or checkpoint without duplicate business effects.
- Backfills need bounded partition ranges, ordering, expected row counts, resume markers, and verification queries.
- Replays should state whether they replace, merge, append, or correct historical rows.
- Partial failure should expose affected partitions, failed records, retry counts, and downstream freshness impact.
- If a pipeline writes to a dashboard or mart, separate data repair from visual/report cache refresh.

## Quality Signals

- Row counts by partition, source-vs-output reconciliation, duplicate key checks, null/range checks, referential checks, and freshness lag.
- Metric checks: denominator, numerator, exclusions, time window, timezone, currency, and segmentation.
- Distribution checks for outliers, sudden drops, spikes, and impossible values.
- Alert routing: owner, severity, expected response, silence window, and known false-positive conditions.

## Dashboard And Report Reconciliation

- Verify at least one representative dashboard/report after pipeline changes.
- Compare source totals, transformed totals, dashboard totals, and any export totals that users rely on.
- Record whether a visible number changed because of source correction, logic change, late data, filter change, or cache refresh.
- Keep screenshots, query output, and generated summaries as runtime evidence until reviewed.

## Stop Conditions

- Source of truth, owner, grain, or freshness target is unknown.
- Backfill or replay can duplicate rows or silently overwrite corrected data.
- A metric definition changes without consumer review.
- Pipeline success does not prove dashboard/report freshness.
- Raw private data, credentials, or internal connection details would enter reusable docs.
