---
name: data-contract-lineage-review
description: Use when reviewing dataset contracts, data lineage, source-of-truth ownership, freshness targets, schema/grain changes, or downstream consumer impact.
---

# Data Contract Lineage Review

Use this as the primary data skill for dataset contracts, lineage, ownership, and consumer impact.

## Workflow

1. Identify dataset grain, owner, source of truth, source systems, transformations, consumers, freshness target, retention, and caveats.
2. Check schema shape, partition/window rules, compatibility, field meaning, identifiers, late data, and consumer assumptions.
3. Separate storage schema changes from dataset contract or lineage changes.
4. Verify with contract docs, source/target samples, lineage maps, consumer inventory, and reconciliation checks when possible.

## Reference

Read `references/dataset-contract-checks.md` for owner, grain, schema, freshness, and compatibility checks.

Read `references/lineage-and-consumer-impact.md` for producer/transform/consumer mapping and stale contract handling.
