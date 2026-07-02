---
name: runtime-index-cache-design
description: Use when designing or reviewing runtime reports, indexes, graphs, caches, artifact schemas, invalidation, canon promotion, generated evidence, or local-only runtime storage.
---

# Runtime Index Cache Design

Use this as the primary AI harness skill for generated runtime evidence, cache/index design, and artifact contracts.

## Workflow

1. Define the artifact purpose, schema, target scope, freshness signal, storage location, and whether it is preview-only or applied.
2. Keep runtime output local-only and separate from durable memory until reviewed.
3. Add invalidation, stale evidence, source file, and target path rules before relying on a cache or index.
4. Verify with schema checks, no-write previews, apply behavior when needed, public-doc hygiene, and canon promotion boundaries.

## Reference

Read `references/runtime-artifact-contracts.md` for generated report, index, graph, schema, and evidence envelope checks.

Read `references/index-cache-invalidation.md` for freshness, invalidation, local-only storage, and promotion boundaries.
