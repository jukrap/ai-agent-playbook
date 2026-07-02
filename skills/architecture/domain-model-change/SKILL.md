---
name: domain-model-change
description: Use when changing or reviewing domain entities, aggregates, value objects, services, policies, use cases, repositories, adapters, invariants, or transaction boundaries.
---

# Domain Model Change

Use this as the primary architecture skill for domain model and application boundary changes.

## Workflow

1. Identify the project's domain style from code: DDD, clean architecture, hexagonal, layered services, active record, transaction scripts, or mixed.
2. Locate invariant ownership, transaction boundary, persistence boundary, DTO/domain mapping, events/messages, and integration adapters.
3. Keep domain rules out of UI, controller, persistence, and transport code unless the project intentionally uses a simpler pattern.
4. Record changed invariants, compatibility risks, persistence effects, and verification coverage.

## Reference

Read `references/domain-modeling-boundaries.md` for entities, aggregates, value objects, services, policies, and invariant ownership.

Read `references/application-domain-infrastructure.md` for use cases, repositories, adapters, DTO mapping, transactions, and infrastructure boundaries.
