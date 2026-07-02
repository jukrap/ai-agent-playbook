---
name: eval-harness-design
description: Use when agent evals need graders, pass@k, regression gates, or reliability evidence.
---

# Eval Harness Design

Agent workflow, prompt, MCP tool, skill, 자동화 surface 변경을 eval 기반으로 진행할 때 쓰는 기본 delivery skill입니다.

## Workflow

1. Harness를 바꾸기 전에 target behavior, risk class, baseline, failure mode, release decision을 정의합니다.
2. Model grader나 human grader보다 deterministic code, schema, rule grader를 먼저 선택합니다.
3. Capability eval과 regression eval을 분리하고 pass@k, pass^k, cost, latency, repeatability 기대치를 정합니다.
4. Eval definition과 run report는 검토와 승격 전까지 runtime evidence로 저장합니다.

## Reference

Eval definition, run report, evidence envelope, storage boundary는 `references/eval-artifact-contract.ko.md`를 읽습니다.

Grader 선택, metric threshold, pass@k 사용, anti-overfitting check는 `references/grader-and-metric-rubric.ko.md`를 읽습니다.
