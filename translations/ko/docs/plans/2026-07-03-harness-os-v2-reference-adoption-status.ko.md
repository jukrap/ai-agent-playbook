# Harness OS v2 Reference Adoption Status Board

**목표:** Local reference queue, capability matrix, adoption ledger, source registry 상태를 하나로 합치는 read-only `reference adoption-status` 표면을 추가합니다.

**이유:** Reference workflow는 이제 inventory, queue, inspect, plan, ledger seed, source registry preview/update까지 지원합니다. 남은 운영상 공백은 상태 대조입니다. Operator는 여전히 queue를 `knowledge/sources.json` 및 reference adoption ledger와 수동으로 비교해야 어떤 candidate가 registered, adopted, deferred, untracked인지 알 수 있습니다.

**아키텍처:** Scoring과 optional ledger annotation에는 `buildReferenceAdoptionQueue`를 재사용하고, target project의 source registry는 metadata로만 읽는 작은 catalog module을 둡니다. Status board는 file write, reference content copy, generated evidence의 memory promotion 없이 compact per-reference status, capability rollup, warning, conflict를 보고합니다.

## 범위

- `reference adoption-status <target> --reference-dir <dir>` CLI command.
- Public harness facade로 export되는 `buildReferenceAdoptionStatus` helper.
- 기본 read-only MCP tool `reference_adoption_status`.
- Priority, score, ledger status, source registry registration state, capability hint, next action이 포함된 per-reference status row.
- Queue count, source-registered count, source-missing count, ledger status distribution을 보여주는 capability rollup.
- English/Korean command/MCP documentation.
- No-write behavior, source registry join, ledger join, capability filtering, missing registry warning에 대한 CLI/MCP/module-boundary test.

## 비목표

- Source registry entry, ledger row, memory map, runtime report, skill, workflow, MCP file, project code를 쓰지 않습니다.
- `reference source-registry-check`, `reference ledger-check`, `reference capability-matrix`, `reference adoption-plan`을 대체하지 않습니다. Status board는 reconciliation view입니다.
- 어떤 reference가 adopted인지 결정하지 않습니다. Ledger status가 durable decision source입니다.
- Raw reference source content, large excerpt, private path, internal URL, credential, branch name, PR number를 복사하지 않습니다.
- Embedding, network lookup, telemetry, long-running watcher를 도입하지 않습니다.

## 출력 계약

- `summary.queueItems`는 board에 포함된 bounded reference queue row 수를 나타냅니다.
- `summary.sourceRegistered`와 `summary.sourceMissing`은 각 queue row에 matching source registry entry가 있는지 집계합니다.
- `summary.ledgerStatuses`는 annotated queue의 ledger status 값을 집계하며, annotation이 없는 row는 `untracked`로 보고합니다.
- `items[]`는 portable reference id와 target-relative registry path만 포함합니다.
- `items[].sourceRegistered`는 boolean이고, `sourceId`는 matching source가 있을 때만 있습니다.
- `capabilities[]`는 recommended/candidate capability id별 status를 집계합니다.
- `mode.writes`는 항상 `false`입니다.

## 구현 체크리스트

- [x] `src/catalog/reference-status.mjs`에 status board builder를 추가합니다.
- [x] `referencePath`와 stable reference source id로 queue row와 source registry entry를 join합니다.
- [x] CLI routing, help text, JSON/non-JSON output, `--capability` filtering을 추가합니다.
- [x] MCP read-only tool registration과 prompt evidence mention을 추가합니다.
- [x] Command docs, MCP permission docs, Korean translation을 갱신합니다.
- [x] CLI/MCP/module-boundary test를 추가합니다.
- [x] Validation을 실행합니다.
- [ ] 이 단위를 commit/push합니다.

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
