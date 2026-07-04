# AI Agent Playbook v2 Reference Adoption Plan

**목표:** Capability-focused reference matrix를 compact implementation planning packet으로 바꾸는 read-only `reference adoption-plan` 표면을 추가합니다.

**이유:** `reference capability-matrix`는 어떤 local reference project가 각 capability를 뒷받침하는지 보여주지만, operator는 여전히 각 후보를 `reference inspect`로 열고 read order, surface, stop condition, ledger status, verification을 수동으로 조립해야 합니다. 다음 단계는 한 capability의 top reference를 bounded하게 선택하고 무엇을 읽고 무엇을 채택할지 source content 복사 없이 요약하는 plan packet입니다.

**아키텍처:** Scoring, filtering, optional ledger annotation은 `buildReferenceCapabilityMatrix`를 재사용합니다. 선택된 reference에는 기존 single-project inspect packet을 재사용해 read order와 adoption question을 붙입니다. Result는 local-only, no-network, no-write로 유지하고, adoption decision이 아니라 triage evidence임을 명확히 합니다.

## 범위

- `reference adoption-plan <reference-dir> --capability <id>` CLI command.
- Public harness facade로 export되는 `buildReferenceAdoptionPlan` helper.
- 기본 read-only MCP tool `reference_adoption_plan`.
- Priority, ledger status, useful surface, read order, question, next action이 포함된 bounded selected reference.
- English/Korean command/MCP documentation.
- Required capability, no-write behavior, selection, ledger status propagation, prompt routing에 대한 CLI/MCP/module-boundary test.

## 비목표

- Ledger row, source registry entry, memory map, runtime report, skill, workflow, MCP file을 쓰지 않습니다.
- 어떤 reference가 adopted인지 결정하지 않습니다. Plan은 review packet일 뿐입니다.
- Raw reference source content, large excerpt, private path, internal URL, credential, branch name, PR number를 복사하지 않습니다.
- Embedding, network lookup, telemetry를 도입하지 않습니다.

## 출력 계약

- `summary.selectedReferences`는 plan에 포함된 bounded reference 수를 나타냅니다.
- `plan.references[]`는 portable project id와 representative file path만 포함합니다.
- `plan.references[].readOrder[]`는 기존 inspect reason을 사용하고 file content를 포함하지 않습니다.
- `plan.references[].suggestedSurfaces[]`는 감지된 signal을 skill reference, MCP tier review, workflow recipe, runtime index, validator, connector contract, docs update 같은 가능한 local surface로 매핑합니다.
- `plan.stopConditions[]`와 `plan.verification[]`는 write-capable follow-up 전에 필요한 reusable gate를 명시합니다.
- `mode.writes`는 항상 `false`입니다.

## 구현 체크리스트

- [x] `buildReferenceCapabilityMatrix`와 `inspectReferenceProject` 위에 adoption plan builder를 추가합니다.
- [x] Bounded reference selection과 portable no-content plan item을 추가합니다.
- [x] CLI routing, help text, JSON/non-JSON output, required capability handling을 추가합니다.
- [x] MCP read-only tool registration을 추가합니다.
- [x] Command docs, MCP permission docs, prompts, Korean translation을 갱신합니다.
- [x] CLI/MCP/module-boundary test를 추가합니다.
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
