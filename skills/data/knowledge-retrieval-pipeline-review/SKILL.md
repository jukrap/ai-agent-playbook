---
name: knowledge-retrieval-pipeline-review
description: Use when reviewing document ingestion, parsing, chunking, metadata, deduplication, embeddings, vector stores, retrieval quality, citations, access control, or stale RAG/search indexes.
---

# Knowledge Retrieval Pipeline Review

Use this as the primary data skill for document ingestion, retrieval pipelines, RAG/search indexes, and citation handoff.

## Workflow

1. Identify source documents, access control, parsing, chunking, metadata, deduplication, freshness, embedding/index boundary, and retrieval consumers.
2. Check source provenance, private content handling, invalidation, stale chunks, permissions, evaluation set, citation behavior, and fallback states.
3. Keep embedding/vector providers optional and disabled by default unless privacy, cost, and invalidation rules are explicit.
4. Verify with source inventory, sampled chunks, retrieval tests, citation checks, access-control checks, and stale-index handling when possible.

## Reference

Read `references/document-ingestion-and-chunking.md` for source loading, parsing, chunking, metadata, and dedup checks.

Read `references/retrieval-evaluation-and-safety.md` for retrieval evaluation, citations, permissions, stale indexes, and provider boundaries.
