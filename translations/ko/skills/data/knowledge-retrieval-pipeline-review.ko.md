---
name: knowledge-retrieval-pipeline-review
description: Use when reviewing document ingestion, parsing, chunking, metadata, deduplication, embeddings, vector stores, retrieval quality, citations, access control, or stale RAG/search indexes.
---

# Knowledge Retrieval Pipeline Review

Document ingestion, retrieval pipeline, RAG/search index, citation handoff를 위한 primary data skill입니다.

## Workflow

1. source document, access control, parsing, chunking, metadata, deduplication, freshness, embedding/index boundary, retrieval consumer를 확인합니다.
2. source provenance, private content handling, invalidation, stale chunk, permission, evaluation set, citation behavior, fallback state를 확인합니다.
3. privacy, cost, invalidation rule이 명확하지 않다면 embedding/vector provider는 optional이며 기본값에서 disabled로 둡니다.
4. 가능하면 source inventory, sampled chunk, retrieval test, citation check, access-control check, stale-index handling으로 검증합니다.

## Reference

source loading, parsing, chunking, metadata, dedup check는 `references/document-ingestion-and-chunking.md`를 읽습니다.

retrieval evaluation, citation, permission, stale index, provider boundary는 `references/retrieval-evaluation-and-safety.md`를 읽습니다.
