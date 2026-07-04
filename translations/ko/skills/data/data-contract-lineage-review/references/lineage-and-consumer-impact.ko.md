# Lineage And Consumer Impact

Data가 ingestion, transformation, serving, dashboard, export, API, retrieval boundary를 지날 때 사용합니다.

## Lineage Map

- Producer, ingestion point, transformation job, intermediate dataset, serving dataset, consumer를 매핑합니다.
- 각 단계의 schedule, trigger, retry behavior, idempotency, owner, freshness expectation을 기록합니다.
- Manual import, ad hoc repair script, backfill, external provider data는 special lineage node로 표시합니다.
- Low-confidence lineage와 generated hint는 reviewed map과 분리합니다.

## Consumer Impact

- Dashboard, report, export, API response, downstream job, ML/retrieval feature, manual consumer를 나열합니다.
- Grain, filter, identifier, timezone, ordering, deduplication, retention, null semantic의 breaking change를 확인합니다.
- Consumer가 staged adoption을 필요로 하면 migration 또는 compatibility window를 기록합니다.
- Consumer를 검증할 수 없으면 caveat나 handoff note를 남깁니다.

## Stop Conditions

- Shared dataset의 transformation 또는 consumer를 모릅니다.
- Lineage evidence가 현재 code, docs, contract와 충돌합니다.
- Consumer-facing metric 또는 export가 owner review 없이 바뀝니다.
- Generated lineage를 검토 없이 memory로 승격합니다.
