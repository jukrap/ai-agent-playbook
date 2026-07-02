---
name: agent-orchestration-handoff
description: Use when splitting work across agents, subagents, workers, review passes, or long-running handoffs.
---

# Agent Orchestration Handoff

Use this as the primary AI harness skill for dividing multi-agent work, bounding worker context, recording evidence, and reconciling handoffs.

## Workflow

1. Classify the orchestration mode: parallel subtasks, sequential handoff, review pass, external worker, long-running resume, or reconciliation after multiple outputs.
2. Define a worker contract before dispatch: goal, allowed paths, required reads, forbidden writes, tool limits, expected artifacts, stop conditions, and context budget.
3. Keep a compact evidence ledger for each worker with task id, input scope, claims, locators, status, residual risk, and review result.
4. Reconcile outputs before merging conclusions: conflicts, duplicate edits, stale facts, missing verification, privacy leaks, and generated evidence boundaries.
5. Promote only reviewed conclusions into memory, docs, worklogs, or canon. Keep raw traces and generated reports under runtime or local-only evidence.

## Reference

Read `references/worker-contract.md` when defining worker scope, allowed context, outputs, and stop conditions.

Read `references/evidence-ledger-and-reconciliation.md` when merging multiple worker outputs, reviewing claims, or preparing a handoff.
