# Query Plan And Index Checks

Query performance 변경이 SQL shape, index, join, sorting, pagination, aggregate, filter, API read path를 건드릴 때 사용합니다.

## Evidence To Gather

- Query text, caller, representative parameter value, expected result semantic.
- Query와 관련된 existing index, unique constraint, foreign key, partition key, generated column.
- 가능한 경우 explain 또는 estimate output. Scan type, join order, sort, filter selectivity, row estimate, temporary materialization을 봅니다.
- N+1 또는 per-row lookup pattern이 의심되면 application-level query count.

## Review Heuristics

- Selective filter와 stable join key로 row를 일찍 줄입니다.
- Sort와 pagination은 deterministic하게 유지합니다. 큰 unstable result set에서 keyset pagination이 맞으면 offset-only paging을 피합니다.
- List/export path에서 사용하지 않는 큰 column을 select하지 않습니다.
- Index 추가는 write cost, storage cost, migration lock risk, rollback path를 이해한 뒤 진행합니다.
- 제안 index가 실제 predicate, join column, sort order, cardinality와 맞는지 확인합니다.

## Change Safety

- Query rewrite는 behavior-preserving하게 유지합니다. Before/after result count와 representative row를 비교합니다.
- 새 index는 lock과 deployment concern을 `database/schema-migration-plan`으로 라우팅합니다.
- Query projection 변경으로 API contract가 바뀌면 contract evidence를 `backend/api-contract-boundary`로 라우팅합니다.
- Dashboard/report semantic이 바뀌면 metric definition과 caveat를 보존합니다.

## Stop Conditions

- Representative parameter나 result correctness criteria가 없습니다.
- 제안 index가 query shape와 맞지 않습니다.
- Performance claim이 explain, timing, row count, local benchmark evidence 없이 직감에 근거합니다.
- Query rewrite가 product 또는 contract decision 없이 semantic을 바꿉니다.
