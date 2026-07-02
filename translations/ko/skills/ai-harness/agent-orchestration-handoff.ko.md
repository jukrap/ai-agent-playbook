---
name: agent-orchestration-handoff
description: Use when splitting work across agents, subagents, workers, review passes, or long-running handoffs.
---

# Agent Orchestration Handoff

Multi-agent 작업을 나누고, worker context를 제한하고, evidence를 기록하고, handoff를 reconcile하기 위한 primary AI harness skill입니다.

## Workflow

1. Orchestration mode를 분류합니다: parallel subtask, sequential handoff, review pass, external worker, long-running resume, 여러 output 이후 reconciliation.
2. Dispatch 전에 worker contract를 정의합니다: goal, allowed path, required read, forbidden write, tool limit, expected artifact, stop condition, context budget.
3. 각 worker에 대해 task id, input scope, claim, locator, status, residual risk, review result가 있는 compact evidence ledger를 유지합니다.
4. 결론을 합치기 전에 output을 reconcile합니다: conflict, duplicate edit, stale fact, missing verification, privacy leak, generated evidence boundary.
5. Review된 conclusion만 memory, docs, worklogs, canon으로 승격합니다. Raw trace와 generated report는 runtime 또는 local-only evidence에 둡니다.

## Reference

Worker scope, allowed context, output, stop condition을 정의할 때 `references/worker-contract.ko.md`를 읽습니다.

여러 worker output을 합치거나 claim을 review하거나 handoff를 준비할 때 `references/evidence-ledger-and-reconciliation.ko.md`를 읽습니다.
