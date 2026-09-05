# Grader And Metric Rubric

동작을 증명할 수 있는 가장 저렴한 grader를 우선합니다. Judgment-based grader는 주관적 품질에만 쓰고, 프로젝트가 안정된 검토 절차를 정의하지 않았다면 advisory로 둡니다.

## Grader Types

| Grader | Use for | Evidence |
| --- | --- | --- |
| Code grader | CLI behavior, schema output, file generation, no-write guarantee, permission | Exit code, parsed JSON, file inventory, diff check |
| Schema grader | MCP payload, runtime artifact, manifest, report, catalog record | JSON schema, required field, enum value, path constraint |
| Rule grader | Documentation hygiene, taxonomy rule, privacy check, routing completeness | Regex check, AST scan, lint report, policy assertion |
| Snapshot grader | Stable text, markdown, manifest, prompt output | Reviewed update process가 있는 golden file diff |
| Model grader | Subjective quality, synthesis quality, nuanced classification | Rubric prompt, sampled case, disagreement note, confidence caveat |
| Human grader | Product judgment, UX taste, policy acceptance, final release call | Review note, explicit decision, reviewer role, date |

## Metric Choices

- `pass@1`: deterministic release gate의 기본값.
- `pass@k`: capability exploration에 유용합니다. 모든 failed attempt를 보고하고 flaky behavior를 숨기지 않습니다.
- `pass^k`: 안정성을 증명하기 위해 반복 실행이 모두 통과해야 할 때 사용합니다.
- `coverage`: eval이 다룬 fixture, workflow, tool, schema, failure mode 수.
- `cost`: 필요할 때 runtime, token, API, browser, external-service cost.
- `latency`: interactive tool, MCP prompt, agent handoff의 elapsed time.
- `drift`: baseline output, accepted policy, previous capability status와 현재 결과 비교.

## Threshold Policy

- Release gate에는 명확한 fail threshold와 rollback 또는 block behavior가 필요합니다.
- Advisory eval은 warning을 낼 수 있지만 report에 advisory임을 명시해야 합니다.
- High-risk eval에는 behavior가 본질적으로 주관적이지 않은 한 deterministic grader가 최소 하나 필요합니다.
- Model grader에는 fixed rubric, sampled example, 가능한 경우 temperature/settings, disagreement handling이 필요합니다.
- Human grader에는 명시적 reviewer role이 필요하며, 모호한 approval note로 대체하지 않습니다.

## Anti-Overfitting Checks

- 가능하면 fixture name과 expected answer를 prompt instruction에서 분리합니다.
- Negative case, malformed input, missing file, permission-denied case를 포함합니다.
- 큰 prompt 또는 skill rewrite 뒤에는 일부 fixture를 교체합니다.
- 최신 구현만이 아니라 원래 user instruction이나 policy를 기준으로 behavior를 비교합니다.
- Prompt 변경 뒤 갑자기 완벽한 점수가 나오면 그 자체를 증명이 아니라 review signal로 봅니다.
