---
name: context-engineering-memory-design
description: Use when designing or reviewing agent instructions, context surfaces, prompt/cache budget, project memory, compaction behavior, durable memory promotion, or stale fact handling.
---

# Context Engineering Memory Design

Use this as the primary AI harness skill for context surfaces and durable project memory.

## Workflow

1. Classify each item as always-on instruction, project-local context, selected skill reference, generated runtime evidence, durable memory, handoff, or archive.
2. Keep default context small, stable, and free of raw source lists, secrets, personal paths, branch names, PR numbers, and large excerpts.
3. Treat runtime reports, indexes, dry-run output, and generated graphs as evidence candidates until reviewed and promoted.
4. Verify context freshness with project docs, canon checks, worklogs, and explicit owner decisions when facts conflict.

## Reference

Read `references/context-surface-and-cache-budget.md` for prompt/cache budget and context surface placement.

Read `references/memory-promotion-and-staleness.md` for generated evidence, durable memory, stale fact, and promotion checks.
