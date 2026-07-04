# Dashboard Report Review

## Inventory

- Artifact: dashboard, static report, notebook, CSV export, chart widget, slide, PDF, or scheduled email.
- Audience: executive, product, engineering, support, sales, finance, operations, or external reader.
- Visuals: chart type, axes, units, legend, labels, sorting, filters, table columns, and drilldowns.
- Data contract: refresh schedule, source freshness, partial data behavior, access boundaries, and caveats.

## Review

- Match visualization to the comparison: trend, rank, part-to-whole, distribution, correlation, or table lookup.
- Titles and subtitles should state the metric and insight without hiding filters or caveats.
- Axes, units, date range, and denominators must be visible or easy to find.
- Tables should include dimensions needed for review, not only plotted fields.
- Avoid chart precision that exceeds source confidence.
- Check empty, partial, delayed, and permission-limited states before handoff.

## Verification

- Compare chart totals with table/query totals.
- Check sorting, grouping, stacked/grouped series, and legend visibility.
- Validate filters and date controls change all dependent views consistently.
- Inspect small screens or export formats if the report is consumed there.
- Include caveats for freshness, sampling, access limitations, and metric definition.

## Stop Conditions

- A chart or table uses an undefined metric.
- A visible "by segment" claim has no visible grouping or encoding.
- Filters, date ranges, or permissions make different blocks disagree.
- The report cannot tell readers whether data is complete, delayed, sampled, or partial.
