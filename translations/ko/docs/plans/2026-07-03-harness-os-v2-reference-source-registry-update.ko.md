# AI Agent Playbook v2 Reference Source Registry Update

**목표:** 기존 `.ai-agent-playbook/knowledge/sources.json` registry에 누락된 local reference source entry만 append하는 preview-first update command를 추가합니다.

**이유:** `reference source-registry-preview`는 후보 registry entry를 만들 수 있지만, bootstrap된 project에는 기존 source decision을 보존하면서 `_reference`에서 발견한 새 reference collection만 추가하는 안전한 apply path가 필요합니다.

**아키텍처:** Reference adoption queue와 source registry entry shape를 재사용합니다. 기존 registry를 읽고 검증한 뒤, 아직 없는 candidate source id만 append하고, 병합된 registry를 다시 검증하며, 쓰기는 `--apply`가 있을 때만 수행합니다. MCP write access는 `--enable-write-tools`와 `apply: true` 뒤에 둡니다.

## 범위

- `reference source-registry-update <target> --reference-dir <dir>` CLI command.
- Public harness facade로 export되는 `updateReferenceSourceRegistry` helper.
- Read-only MCP preview tool과 opt-in write MCP tool.
- Preview, apply, idempotent second run, path safety, malformed referenceDir handling, MCP permission behavior test.
- English/Korean command documentation.
- Update가 나중에 operational source check에서 실패할 registry를 쓰지 않도록 source registry schema의 duplicate-id guard.

## 비목표

- 기존 source entry를 overwrite하거나 reorder하지 않습니다.
- Network source를 fetch하거나 inspect하지 않습니다.
- Source registry entry를 memory로 자동 promote하지 않습니다.
- Raw reference content를 `sources.json`에 복사하지 않습니다.

## 구현 체크리스트

- [x] 현재 source registry preview/check behavior를 검토합니다.
- [x] Structured conflict를 가진 append-only source registry update helper를 추가합니다.
- [x] CLI routing, help text, JSON/non-JSON output을 추가합니다.
- [x] MCP read-only preview와 opt-in write tool registration을 추가합니다.
- [x] No-write preview, apply, idempotency, permission gating에 대한 CLI/MCP test를 추가합니다.
- [x] Schema-level duplicate source id validation과 runtime documentation을 추가합니다.
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
