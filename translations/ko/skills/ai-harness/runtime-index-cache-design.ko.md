# Runtime Index Cache Design

Generated runtime evidence, cache/index design, artifact contract를 위한 primary AI harness skill입니다.

## Workflow

1. Artifact purpose, schema, target scope, freshness signal, storage location, preview-only/applied 여부를 정의합니다.
2. Runtime output은 local-only로 유지하고 검토 전까지 durable memory와 분리합니다.
3. Cache 또는 index에 의존하기 전에 invalidation, stale evidence, source file, target path rule을 추가합니다.
4. Schema check, no-write preview, 필요 시 apply behavior, public-doc hygiene, canon promotion boundary로 검증합니다.

## Reference

Generated report, index, graph, schema, evidence envelope check에는 `references/runtime-artifact-contracts.md`를 읽습니다.

Freshness, invalidation, local-only storage, promotion boundary에는 `references/index-cache-invalidation.md`를 읽습니다.
