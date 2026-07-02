---
name: data-contract-lineage-review
description: Use when reviewing dataset contracts, data lineage, source-of-truth ownership, freshness targets, schema/grain changes, or downstream consumer impact.
---

# Data Contract Lineage Review

Dataset contract, lineage, ownership, consumer impact를 위한 primary data skill입니다.

## Workflow

1. dataset grain, owner, source of truth, source system, transformation, consumer, freshness target, retention, caveat를 확인합니다.
2. schema shape, partition/window rule, compatibility, field meaning, identifier, late data, consumer assumption을 확인합니다.
3. storage schema change와 dataset contract 또는 lineage change를 분리합니다.
4. 가능하면 contract docs, source/target sample, lineage map, consumer inventory, reconciliation check로 검증합니다.

## Reference

owner, grain, schema, freshness, compatibility check는 `references/dataset-contract-checks.md`를 읽습니다.

producer/transform/consumer mapping과 stale contract handling은 `references/lineage-and-consumer-impact.md`를 읽습니다.
