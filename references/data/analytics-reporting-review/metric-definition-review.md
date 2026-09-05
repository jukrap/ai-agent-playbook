# Metric Definition Review

## Inventory

- Metric: name, owner, purpose, business question, unit, grain, denominator, numerator, and expected direction.
- Source: source system, source table/query, transformation layer, freshness, partition/timezone, and known exclusions.
- Dimensions: segment, product, account, tenant, geography, cohort, channel, status, and permission boundary.
- Consumers: dashboard, report, alert, experiment, finance review, product decision, or operational workflow.

## Review

- Confirm the metric answers the stated question and is not a proxy with hidden caveats.
- Grain must be explicit: user, account, event, order, session, day, week, month, or snapshot.
- Denominator and exclusions matter as much as numerator; document both.
- Check timezone, partial periods, late-arriving data, dedupe, test/internal data, and status transitions.
- Joins should not duplicate rows or silently drop records.
- Segment filters should be visible to the reader when they materially change interpretation.

## Verification

- Reconcile row counts across source, transformed, and reported layers.
- Sample records at edge cases: nulls, cancellations, refunds, deleted users, retries, late data, and boundary dates.
- Compare against a known previous report or hand-calculated small slice when available.
- Validate grouped totals equal or intentionally differ from overall totals.
- Record caveats, freshness, and confidence without overstating precision.

## Stop Conditions

- Metric owner, grain, or denominator is unknown.
- Query output cannot be reconciled to a source or trusted intermediate layer.
- A dashboard/report would drive a decision while caveats are hidden.
- Segmentation can expose restricted or misleadingly small populations.
