# Legacy Feature Addition

주변 architecture를 rewrite하지 않고 legacy system에 behavior, screen, field, business rule, integration을 추가할 때 사용합니다.

## Workflow

1. UI, validation, state, API/server, persistence, deploy path까지 현재 flow를 end-to-end로 map합니다.
2. 같은 종류의 feature에 대한 가장 가까운 existing pattern을 찾습니다.
3. field name이나 server behavior를 추측하지 말고 data contract를 의도적으로 확장합니다.
4. shared behavior가 실제로 필요하지 않으면 새 code를 feature 범위에 묶습니다.
5. happy path, validation/failure path, 인접 existing flow 하나 이상을 검증합니다.

## Guardrails

- 한 feature 때문에 새 architecture style을 도입하지 않습니다.
- remote/API feature에서 hidden mock fallback을 피합니다.
- inline style preference가 local rule이면 포함해 legacy UI와 consistent하게 유지합니다.
- 미완성 backend/product decision은 fake-complete behavior가 아니라 blocker로 문서화합니다.
