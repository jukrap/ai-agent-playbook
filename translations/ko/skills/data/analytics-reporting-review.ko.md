# Analytics Reporting Review

Metric, dashboard, report correctness를 위한 primary data skill입니다.

## Workflow

1. Business question, metric owner, source table, grain, filter, time window, denominator, consumer를 확인합니다.
2. Metric definition, query logic, join, exclusion, null handling, segmentation, freshness, chart/table consistency를 확인합니다.
3. Source data issue와 transformation/reporting issue, presentation caveat를 분리합니다.
4. 가능한 경우 source count, reconciliation query, sampled row, report/dashboard check로 검증합니다.

## Reference

Metric, grain, denominator, query definition check에는 `references/metric-definition-review.md`를 읽습니다.

Chart/table consistency, caveat, freshness, reader handoff에는 `references/dashboard-report-review.md`를 읽습니다.
