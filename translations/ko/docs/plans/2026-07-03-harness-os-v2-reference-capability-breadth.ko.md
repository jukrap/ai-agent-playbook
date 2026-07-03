# Harness OS v2 Reference Capability Breadth

**목표:** Local reference queue가 대부분의 project를 broad AI harness bucket으로 몰아넣지 않고 frontend, database, devops, mobile, data, architecture, design, documentation, connector capability signal을 드러내도록 reference adoption classifier를 확장합니다.

**이유:** Reference workflow는 inventory, queue, inspect, plan, register, status tracking, ledger decision update까지 가능해졌습니다. 하지만 현재 reference queue를 검토해보면 broad operational project가 여전히 `ai-harness`, `security`, `delivery`, `foundation` 쪽으로 과분류되고, CI/package/container/release file이 있어도 `devops` adoption plan이 match를 못 찾을 수 있습니다. 이 상태에서는 이후 skill/MCP adoption 우선순위가 덜 정확합니다.

**아키텍처:** Reference scanner는 bounded path-based 방식으로 유지합니다. Domain-specific signal counter를 추가하고, 해당 counter를 capability-first recommended/candidate capability id로 매핑하며, adoption-plan objective/surface/question도 확장된 taxonomy를 사용하게 합니다. File content를 읽거나 embedding을 넣거나 reference prose를 복사하지 않습니다.

## 범위

- `emptySignals`, `addSignals`, `scoreSignals`와 관련 queue/matrix logic에 capability breadth signal을 추가합니다.
- Frontend, database, devops, mobile, data, architecture, design, documentation, connector, package, observability에 대한 path-only detection을 추가합니다.
- `docs/skill-taxonomy-v2.md`에 맞춰 recommended/candidate capability mapping을 갱신합니다.
- 새 capability id에 대한 adoption-plan objective, suggested surface, question, stop condition, verification line을 추가합니다.
- Command docs와 Korean translation에서 더 넓은 capability filter 예시를 명시합니다.
- `reference capability-matrix --capability devops`, `frontend`, `database`, `data`, `mobile`이 bounded local fixture를 파일 쓰기 없이 match할 수 있음을 CLI test로 검증합니다.

## 비목표

- Embedding, network call, telemetry, long-running watcher를 추가하지 않습니다.
- Raw reference source content나 large excerpt를 output에 복사하지 않습니다.
- Reference를 adopted로 표시하지 않습니다.
- 이 단위에서는 새 skill을 만들지 않습니다. 이후 skill 추가를 위한 reference selection substrate를 보강합니다.
- Project name만으로 capability scoring이 결정되게 만들지 않습니다.

## 출력 계약

- `reference inventory`는 compact signal count만 보고합니다.
- `reference adoption-queue`는 계속 portable representative path만 반환하고 raw content는 포함하지 않습니다.
- `reference capability-matrix --capability <id>`는 capability-specific fixture signal에 대해 비어 있지 않은 group을 반환합니다.
- `reference adoption-plan --capability <id>`는 요청 capability에 맞는 objective, surface, stop condition, verification을 반환합니다.
- 기존 AI harness, MCP, source registry, ledger, status behavior는 backward compatible하게 유지합니다.

## 구현 체크리스트

- [x] 확장 capability set에 대한 signal counter와 path heuristic을 추가합니다.
- [x] Capability recommendation, candidate capability, action, surface, question, objective, stop condition, verification mapping을 갱신합니다.
- [x] Command documentation과 Korean translation을 갱신합니다.
- [x] 새 capability filter와 no-write behavior에 대한 CLI test를 추가합니다.
- [x] Validation을 실행합니다.
- [x] 이 단위를 commit/push합니다.

## 검증

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
