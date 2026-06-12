# Runtime Harness V10 Operator Check

**목표:** 사람이 harness health, guide freshness, local verification command 후보, rule matching을 한 명령에서 검토할 수 있는 통합 read-only operator checkpoint를 추가합니다.

**구조:** 문서와 CLI 하네스를 기본 경로로 유지합니다. `operator check`는 기존 read-only check를 묶으며 hook을 설치하지 않고, project command를 실행하지 않고, file을 쓰지 않고, network call을 하지 않습니다.

## 범위

- `operator check <target> [--path <file>] [--diff] [--json]` 추가.
- 기존 `doctor`, `guides sync --check`, `diagnostics check`, `rules check` logic 재사용.
- Stale guide처럼 검토 신호인 warning은 보이게 하되 blocking하지 않음.
- Missing playbook file처럼 underlying section에 failure가 있을 때만 통합 check 실패.
- Source docs와 Korean translation에 command 문서화.

## JSON 계약

`operator check --json`은 아래를 반환합니다.

- `schemaVersion`
- `ok`
- `target`
- 선택적 `path`
- `summary`
- `checks`
- `sections`

`sections`에는 원래 section report가 들어갑니다.

- `doctor`
- `guides`
- `diagnostics`
- `rules`

## 비목표

- Blocking hook 없음.
- Continuation 없음.
- Automatic doctor execution 없음.
- Project verification command 실행 없음.
- Settings write 없음.
- Network call 없음.

## 테스트

- Path 기준 네 section을 묶고 file write가 없는지 확인.
- Stale guide를 failure가 아니라 warning으로 보고하는지 확인.
- Playbook이 없으면 실패하되 diagnostics 후보는 계속 보고하고 file write가 없는지 확인.

## 검증

아래를 실행합니다.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Merge 전 public documentation에서 external harness name과 fixed local absolute path도 검색합니다.
