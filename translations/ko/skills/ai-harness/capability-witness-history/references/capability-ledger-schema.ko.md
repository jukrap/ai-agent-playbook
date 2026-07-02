# Capability Ledger Schema

Capability witness는 작고 append-only인 runtime fact입니다. Harness가 실제로 무엇을 확인했고, 어떤 일이 일어났으며, 이전 실행과 비교 가능한지를 기록합니다.

## Entry Shape

각 entry에는 다음을 포함합니다.

- `schemaVersion`: artifact schema version.
- `kind`: `runtime.capability-witness`.
- `capabilityId`: 안정적인 lowercase hyphenated capability id.
- `checkId`: command, recipe, MCP prompt, schema check, browser check, manual witness id.
- `timestamp`: check 완료 시점의 ISO timestamp.
- `targetVersion`: commit, package version, skill version, prompt hash, command version.
- `environment`: OS, shell, Node/Python/runtime version, package manager, 주요 feature flag.
- `status`: `pass`, `fail`, `degraded`, `skipped`, `unknown`.
- `durationMs`: 측정된 경우 elapsed check time.
- `summary`: 짧은 factual result.
- `artifacts`: log, report, screenshot, JSON, command output summary의 portable path.
- `baseline`: baseline id 또는 이전 comparable witness entry.
- `caveats`: missing dependency, partial coverage, network dependency, manual step, non-comparable environment.

## Status Semantics

- `pass`: check가 실행되었고 기대치를 충족했습니다.
- `fail`: check가 실행되었지만 기대치를 충족하지 못했습니다.
- `degraded`: 핵심 capability는 동작하지만 latency, coverage, warning, fallback mode, partial behavior가 퇴행했습니다.
- `skipped`: 선언된 prerequisite이 없어 check가 실행되지 않았습니다.
- `unknown`: check output만으로 capability를 분류하기 부족합니다.

`skipped`, `degraded`, `unknown`을 `pass`로 접지 않습니다.

## Ledger Rules

- 새 entry를 append합니다. 실수로 commit된 민감 정보를 제거하는 경우 외에는 history를 rewrite하지 않습니다.
- Generated ledger는 `.ai-playbook/runtime/reports/capabilities/` 또는 `.ai-playbook/runtime/indexes/` 아래에 둡니다.
- 검토된 summary나 durable decision만 `.ai-playbook/memory/`로 승격합니다.
- Project-relative portable artifact path를 씁니다.
- Credential, token, personal absolute path, internal URL, branch name, PR number, raw private log를 public documentation에 저장하지 않습니다.
- Default harness behavior가 안전하게 유지되도록 read-only witness와 write-capability witness를 분리해 기록합니다.

## Minimal Report

Reader-facing capability status report에는 다음을 보여줍니다.

- capability별 current status,
- 마지막 comparable pass,
- 알 수 있는 경우 최초 failing 또는 degraded version,
- skipped 또는 unknown reason,
- 영향받은 OS/runtime scope,
- artifact link,
- 권장 next check.
