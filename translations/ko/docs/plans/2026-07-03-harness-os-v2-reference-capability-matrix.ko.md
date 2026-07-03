# Harness OS v2 Reference Capability Matrix

**목표:** Local `_reference` collection을 재사용 가능한 Harness OS capability 영역별로 묶는 read-only `reference capability-matrix` 표면을 추가합니다.

**이유:** `reference inventory`, `reference adoption-queue`, `reference inspect`는 후보를 찾고 열 수 있지만, 다음 구현 slice를 고르기 전 ai-harness, delivery, backend, security, foundation 등 capability 영역을 어떤 reference가 뒷받침하는지 compact matrix로 볼 필요가 있습니다.

**아키텍처:** Adoption queue scoring과 optional ledger status annotation을 재사용합니다. Recommended/candidate capability id를 key로 하는 bounded matrix를 만들고 priority count, ledger status count, top reference, signal highlight, representative file, next action을 담습니다. Command는 local-only, no-network, no-write로 유지하고 raw source content는 담지 않습니다.

## 범위

- `reference capability-matrix <reference-dir>` CLI command.
- Public harness facade로 export되는 `buildReferenceCapabilityMatrix` helper.
- 기본 read-only MCP tool `reference_capability_matrix`.
- Optional `--capability <id>` filter와 optional `--ledger <ledger.md>` status annotation.
- English/Korean command/MCP documentation.
- No-write behavior, grouping, filtering, ledger status propagation에 대한 CLI/MCP/module-boundary test.

## 비목표

- Raw reference source content를 읽거나 출력하지 않습니다.
- Ledger row, source registry entry, memory map, runtime report를 쓰지 않습니다.
- 어떤 reference가 adopted인지 결정하지 않습니다. Matrix는 triage evidence일 뿐입니다.
- Embedding 또는 network metadata를 도입하지 않습니다.

## 구현 체크리스트

- [x] `buildReferenceAdoptionQueue` 위에 matrix builder를 추가합니다.
- [x] Capability별 top reference를 portable path만 포함해 bounded하게 담습니다.
- [x] CLI routing, help text, JSON/non-JSON output을 추가합니다.
- [x] MCP read-only tool registration을 추가합니다.
- [x] Command docs, MCP permission docs, Korean translation을 갱신합니다.
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
