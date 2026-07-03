# Harness OS v2 Reference Ledger Decision Update

**목표:** Markdown을 수동 편집하지 않고 하나의 reference adoption ledger row를 `reviewed`, `adopted`, `deferred`, `rejected`로 바꾸는 preview-first `reference ledger-decision` command를 추가합니다.

**이유:** `reference adoption-status`는 source registration과 ledger state를 보여줄 수 있지만, operator는 decision을 기록하려면 여전히 ledger table을 직접 편집해야 합니다. 좁은 decision update path를 두면 ledger를 durable source of truth로 유지하면서 reference adoption 작업을 이어가기 쉬워집니다.

**아키텍처:** 기존 markdown ledger table shape를 재사용합니다. Target ledger를 읽고 검증한 뒤 reference id로 하나의 row를 찾아 정확한 row replacement를 preview하고, 쓰기는 `--apply`가 있을 때만 수행합니다. MCP write access는 `--enable-write-tools`와 `apply: true` 뒤에 두고, 기본 read-only preview tool도 노출합니다.

## 범위

- `reference ledger-decision <target> --reference <id> --status <status>` CLI command.
- Public harness facade로 export되는 `updateReferenceLedgerDecision` helper.
- 선택한 row에 대한 optional `--capability`, `--pattern`, `--adoption`, `--risk`, `--decision-date` field.
- Read-only MCP preview tool과 opt-in write MCP tool.
- Preview, apply, idempotent no-op, invalid status, missing ledger, missing reference row, path safety, MCP permission behavior test.
- English/Korean command/MCP documentation.

## 비목표

- Ledger를 생성하지 않습니다. 먼저 `reference ledger-init`을 사용합니다.
- 누락된 queue row를 append하지 않습니다. 그 작업은 `reference ledger-update`를 사용합니다.
- Source registry entry, memory map, runtime report, skill, workflow, MCP file, project code를 쓰지 않습니다.
- Raw reference source content, large excerpt, private path, internal URL, credential, branch name, PR number를 ledger cell에 복사하지 않습니다.
- Queue score, source registration, capability matrix output만으로 adoption을 자동 결정하지 않습니다.

## 출력 계약

- `summary.changed`는 선택한 row content가 달라질 때만 `true`입니다.
- `decision.before`와 `decision.after`는 raw upstream content가 아니라 compact table row object입니다.
- `operations[]`는 변경이 있을 때 `preview` 또는 `write` row replacement operation을 포함합니다.
- `applied`는 `--apply`로 ledger를 쓴 뒤에만 `true`입니다.
- `mode.writes`는 `--apply`와 일치합니다.
- Unsafe cell value는 어떤 write 전에도 conflict를 만듭니다.

## 구현 체크리스트

- [x] Ledger-focused catalog module에 decision update helper를 추가합니다.
- [x] 기존 ledger table을 unrelated row reorder 없이 parse/render합니다.
- [x] CLI routing, help text, JSON/non-JSON output, validation을 추가합니다.
- [x] MCP read-only preview와 opt-in write tool registration을 추가합니다.
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
