---
name: eval-harness-design
description: Use when agent evals need graders, pass@k, regression gates, or reliability evidence.
---

# Eval Harness Design

Use this as the primary delivery skill for eval-driven changes to agent workflows, prompts, MCP tools, skills, or automation surfaces.

## Workflow

1. Define the target behavior, risk class, baseline, failure modes, and release decision before changing the harness.
2. Choose deterministic code, schema, or rule graders before model or human graders.
3. Separate capability evals from regression evals, then set pass@k, pass^k, cost, latency, and repeatability expectations.
4. Store eval definitions and run reports as runtime evidence until reviewed and promoted.

## Reference

Read `references/eval-artifact-contract.md` for eval definition, run report, evidence envelope, and storage boundaries.

Read `references/grader-and-metric-rubric.md` for grader choice, metric thresholds, pass@k usage, and anti-overfitting checks.
