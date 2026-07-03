# Harness OS v2 Reference Inspect Packet

**목표:** 하나의 local reference collection을 adoption 작업용 compact review packet으로 바꾸는 read-only `reference inspect` 표면을 추가합니다.

**이유:** Inventory, queue, ledger, source registry 명령은 유용한 reference를 찾을 수 있지만, operator가 raw upstream content를 복사하지 않고 어떤 파일을 봐야 하는지 다시 찾지 않으려면 안전한 단일 후보 inspect 경로가 필요합니다.

**아키텍처:** 기존 reference project analyzer와 queue scoring을 재사용합니다. Reference root 아래의 단일 top-level project를 안전하게 해석하고, unsafe path를 거부하며, signal highlight, recommended capability area, next adoption action, representative file path 기반 read order를 반환합니다. Output은 local-only, no-network, no-write로 유지하고 relative path 기반 source evidence만 담습니다.

## 범위

- `reference inspect <reference-dir> --project <name>` CLI command.
- Public harness facade로 export되는 `inspectReferenceProject` helper.
- 기본 read-only MCP tool `reference_inspect`.
- Project summary, signal highlight, recommended capability, read order, adoption question, next action을 담은 compact review packet.
- English/Korean command/MCP documentation.
- Success, path traversal rejection, missing project handling, no-write behavior에 대한 CLI/MCP test.

## 비목표

- Raw source file content를 읽거나 출력하지 않습니다.
- Adoption ledger row나 source registry entry를 쓰지 않습니다.
- 하나의 top-level reference collection 밖에 있는 nested arbitrary path를 inspect하지 않습니다.
- Reference가 신뢰할 만한지 결정하지 않습니다. Packet은 triage evidence일 뿐입니다.

## 구현 체크리스트

- [x] Reference root 아래에서 안전한 single-project resolver를 추가합니다.
- [x] Analyzer scoring을 재사용해 compact inspect packet을 만듭니다.
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
