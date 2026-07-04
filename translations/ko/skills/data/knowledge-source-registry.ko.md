---
name: knowledge-source-registry
description: Use when project knowledge sources need owner, status, freshness, locator, or evidence rules.
---

# Knowledge Source Registry

Search, ingestion, retrieval, promotion 작업 전에 project knowledge source를 등록하는 기본 data skill입니다.

## Workflow

1. Source type, owner, use case, privacy tier, credentials boundary, update cadence, expected locator shape, search/browse mode를 확인합니다.
2. Source status를 available, building, partial, unavailable, failed, stale, unknown 중 하나로 기록합니다.
3. Search result, summary, row, object, thread, generated runtime report를 신뢰하기 전에 locator와 evidence envelope를 정의합니다.
4. Generated hit은 reviewed fact, reference, map, decision으로 durable memory에 승격되기 전까지 provisional로 둡니다.

## Reference

`knowledge/sources.json` field, source status, privacy, credential boundary는 `references/source-registry-contract.ko.md`를 읽습니다.

Search-locate-browse flow, locator type, scan range, promotion rule은 `references/locator-and-evidence-envelope.ko.md`를 읽습니다.
