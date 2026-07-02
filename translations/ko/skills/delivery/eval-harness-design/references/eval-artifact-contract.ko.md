# Eval Artifact Contract

Eval artifact는 harness의 주장을 반복 가능한 evidence로 바꿉니다. Generated evidence가 실수로 durable memory가 되지 않도록 definition, run report, promotion note를 분리합니다.

## Eval Definition

Eval definition에는 다음을 포함합니다.

- `schemaVersion`: artifact schema version.
- `kind`: `runtime.eval-definition`.
- `id`: 안정적인 lowercase hyphenated eval id.
- `target`: 평가 대상 skill, prompt, workflow, MCP surface, CLI command, agent behavior.
- `behavior`: 관찰 가능한 말로 쓴 기대 동작.
- `riskClass`: `low`, `medium`, `high`, `release-gate`.
- `baseline`: 이전 commit, fixture, reference transcript, command output, accepted behavior.
- `fixtures`: input prompt, repository fixture, file, mocked tool result, seed data.
- `graders`: deterministic grader를 먼저 두고, judgment가 필요할 때만 model 또는 human grader를 둡니다.
- `successCriteria`: pass/fail threshold, required evidence, allowed caveat, retry policy.
- `budgets`: 필요할 때 max runtime, max token, max external call, max cost.
- `storage`: runtime-only path와 선택적 reviewed promotion target.

## Eval Run Report

Eval run report에는 다음을 포함합니다.

- `schemaVersion`: artifact schema version.
- `kind`: `runtime.eval-run-report`.
- `evalId`: eval definition id.
- `targetVersion`: commit, package version, skill version, prompt hash, command version.
- `environment`: OS, runtime, package manager, model/tool version, 주요 feature flag.
- `attempts`: pass@k 또는 repeat count와 retry rationale.
- `results`: grader output, pass/fail status, skipped case, degraded case, unknown case.
- `artifacts`: log, screenshot, report, generated file의 portable path.
- `caveats`: missing fixture, non-comparable baseline, flaky signal, manual judgment.
- `decision`: accepted, rejected, needs follow-up, advisory-only.

## Storage Boundaries

- Generated eval definition과 report는 `.ai-playbook/runtime/reports/evals/` 또는 `.ai-playbook/runtime/indexes/` 아래에 저장합니다.
- Human-reviewed eval policy, accepted gate, durable lesson은 검토 후에만 `.ai-playbook/memory/decisions/` 아래에 둡니다.
- Raw transcript, 긴 model output, temporary trace를 `memory/`에 승격하지 않습니다.
- Artifact에는 project-relative portable path를 씁니다. Public docs에는 personal absolute path, credential, branch name, PR number, internal URL을 저장하지 않습니다.
- 큰 log와 screenshot은 짧은 summary와 hash를 둔 runtime artifact로 유지합니다.

## Stop Conditions

다음 상황에서는 멈추고 eval을 다시 설계합니다.

- Target behavior가 관찰 가능하지 않습니다.
- Eval이 pass와 그럴듯하지만 틀린 답을 구분하지 못합니다.
- Deterministic behavior에 model 또는 human grader만 gate로 쓰입니다.
- Baseline이 없거나 비교할 수 없습니다.
- Pass@k가 failed attempt 보고 없이 flaky behavior를 숨깁니다.
- Eval이 grader evidence 대신 raw transcript를 result로 기록합니다.
- Release gate의 cost, latency, external call, fixture privacy가 정의되지 않았습니다.
