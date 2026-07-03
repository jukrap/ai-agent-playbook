---
name: backend-change-safety
description: Use when changing backend services, modules, workers, scheduled jobs, integrations, queues, configuration, or server-side business logic.
---

# Backend Change Safety

Use this as the primary backend skill for non-trivial server-side changes that are not only API mapping or server-rendered flow work.

## Workflow

1. Identify entrypoints, owners, runtime mode, data stores, side effects, and downstream consumers before editing.
2. Classify the change as additive, compatible, behavior-changing, destructive, operational, or integration-facing.
3. Keep controllers, services, repositories, workers, config, and module entrypoints in their existing responsibility boundaries.
4. Verify request paths, async paths, retries/idempotency, permissions, configuration, logs/metrics, and rollback shape.
5. Use `request-validation-error-contract` for request parsing, validation, and client-visible error changes.
6. Use `job-worker-reliability` for jobs, workers, queues, schedulers, retries, and dead-letter paths.
7. Load the relevant stack profile from `references/stacks/` only after the repository stack is known.

## Reference

Read `references/backend-change-checklist.md` before implementing or reviewing backend changes with shared runtime, persistence, or integration risk.

Read `references/stack-profile-selection.md` when the repository stack is known and you need to choose a Java, Kotlin, Node, Python, Go, .NET, or PHP profile.

Read `references/async-boundary-idempotency.md` for workers, queues, scheduled jobs, webhooks, retries, and duplicate-delivery safety.
