# AI Agent Playbook v2 Reference Ledger Update

**목표:** 기존 reference adoption ledger에 local reference queue의 누락 row만 append하는 preview-first update command를 추가해, 이미 검토한 decision row를 덮어쓰지 않게 합니다.

**이유:** `reference ledger-init`은 missing ledger 생성에는 안전하지만, bootstrap된 `.ai-agent-playbook` layout에는 이미 `knowledge/reference-adoption-ledger.md`가 있습니다. 이런 프로젝트에는 기존 `reviewed`, `adopted`, `deferred`, `rejected` row를 보존하면서 새 reference candidate만 추가하는 append-only adoption path가 필요합니다.

**아키텍처:** 기존 ledger path와 함께 `buildReferenceAdoptionQueue`를 재사용해 write 전에 prior status를 감지합니다. `ledgerStatus`가 `new`인 queue item만 compact Markdown table row로 만들고, 실제 row를 append할 때 starter blank template row는 제거합니다. 쓰기는 `--apply`가 있을 때만 수행합니다. MCP write access는 `--enable-write-tools`와 `apply: true` 뒤에 둡니다.

## 범위

- `reference ledger-update <target> --reference-dir <dir>` CLI command.
- Public harness facade로 export되는 `updateReferenceAdoptionLedger` helper.
- Read-only MCP preview tool과 opt-in write MCP tool.
- Preview, apply, idempotent second run, placeholder cleanup, path safety, MCP permission behavior test.
- English/Korean command documentation.

## 비목표

- Raw upstream reference content를 ledger에 복사하지 않습니다.
- Adopted row를 편집하거나 status를 자동 판정하지 않습니다.
- Network fetching, embedding, telemetry, project code 자동수정은 추가하지 않습니다.

## 구현 체크리스트

- [x] 현재 `reference ledger-init`, `ledger-check`, template ledger behavior를 검토합니다.
- [x] Structured conflict를 가진 append-only ledger update helper를 추가합니다.
- [x] CLI routing, help text, JSON/non-JSON output을 추가합니다.
- [x] MCP read-only preview와 opt-in write tool registration을 추가합니다.
- [x] No-write preview, apply, idempotency, permission gating에 대한 CLI/MCP test를 추가합니다.
- [x] Command docs와 Korean translation을 갱신합니다.
- [x] Full validation을 실행합니다.
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
