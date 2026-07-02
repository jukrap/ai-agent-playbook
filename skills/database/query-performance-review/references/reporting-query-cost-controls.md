# Reporting Query Cost Controls

Use this when SQL feeds reports, dashboards, exports, charts, scheduled emails, PDFs, spreadsheets, or analytics tables.

## Consumer Evidence

- Name the report, dashboard, export, chart, API, or scheduled job that consumes the query.
- Identify required fields, filters, grouping, ordering, paging, and date/window semantics.
- Verify field names from the actual query/parser/API response when possible instead of hand-writing aliases from memory.
- Check whether the consumer expects live data, cached data, snapshots, or generated files.

## Cost Controls

- Bound time ranges, row counts, export sizes, full account scans, and unfiltered dashboards.
- Prefer preview/estimate modes before expensive sync, export, or full refresh operations.
- Keep full reprocess, full reindex, and full export behind explicit confirmation when cost or runtime is material.
- Separate query correctness from rendered output correctness. A query can succeed while a chart, report, or export is blank or misbound.

## Verification

- Before/after query result counts and representative row comparison.
- Rendered report/dashboard/export smoke check when a consumer is available.
- Timeout, pagination, or scheduling behavior check for heavy reports.
- Caveat or metric-definition update when semantics changed.

## Stop Conditions

- The report/dashboard fields are guessed rather than verified.
- An unbounded query feeds export, scheduled report, or dashboard refresh.
- A query change could alter a KPI or business metric without an owner decision.
- The rendered consumer is not checked after changing bindings, aliases, grouping, or pagination.
