# Query Performance Review

SQL/query performance와 rendered consumer check를 위한 primary database skill입니다.

## Workflow

1. Query, caller, consumer, representative parameter, expected row count, timeout budget, correctness requirement를 확인합니다.
2. Explain plan, index, filter, join, sort/pagination, aggregate, N+1 behavior, cache behavior, rendered output evidence를 수집합니다.
3. Query rewrite, index, pagination, pre-aggregation, projection reduction, batching, consumer-level change 중 가장 작은 안전한 변경을 제안합니다.
4. Explain/estimate, before/after query result, application behavior, report/export/dashboard output, project-defined performance check로 검증합니다.

## Reference

Plan, index, cardinality, query-shape check에는 `references/query-plan-and-index-checks.md`를 읽습니다.

Dashboard, export, reporting, data-source consumer check에는 `references/reporting-query-cost-controls.md`를 읽습니다.
