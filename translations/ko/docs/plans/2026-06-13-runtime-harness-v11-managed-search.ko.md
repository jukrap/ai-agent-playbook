# Runtime Harness V11 Managed Manifest and Operator Search

**목표:** 기본 document/CLI harness 모델을 바꾸지 않으면서 project-level ownership 추적과 local read-only search 명령을 추가합니다.

**아키텍처:** Bootstrap과 guide sync는 성공적으로 파일을 쓴 뒤 portable managed manifest를 기록합니다. Managed 명령은 hash로 증명된 파일만 확인, 채택, 제거합니다. `operator search`는 local text file을 검색하고 diagnostics/rules summary를 재사용하되 project command를 실행하거나 network call을 하지 않습니다.

## 범위

- 복사된 project harness file을 위해 `.ai-agent-playbook/.ai-agent-playbook-install.json`을 추가합니다.
- `managed check`, `managed adopt`, `managed uninstall`을 추가합니다.
- `operator search <target> --query <text> [--path <file>] [--max-results N] [--json]`을 추가합니다.
- `operator check`는 low-noise로 유지하고 기존 동작을 바꾸지 않습니다.
- Hook, slash command, continuation, blocking, automatic doctor execution은 범위 밖입니다.

## JSON 계약

`managed check --json`은 아래를 반환합니다.

- `schemaVersion`
- `ok`
- `target`
- `manifestPath`
- `summary`
- `files`
- `warnings`
- `conflicts`

`managed adopt --json`과 `managed uninstall --json`은 아래를 반환합니다.

- `schemaVersion`
- `ok`
- `target`
- `applied`
- `summary`
- `operations`
- `warnings`
- `conflicts`

`operator search --json`은 아래를 반환합니다.

- `schemaVersion`
- `ok`
- `target`
- `query`
- optional `path`
- `summary`
- `results`
- `related`

## 비목표

- Codex plugin packaging 없음.
- Slash command 없음.
- AST 또는 LSP dependency 없음.
- Network search 없음.
- Automatic cleanup 없음.
- Hook-driven diagnostics 없음.

## 테스트

- Bootstrap은 manifest를 만들고 dry-run은 만들지 않습니다.
- Manifest path는 portable하고 hash 기반입니다.
- Guide sync는 manifest entry를 갱신하고 check mode는 read-only로 유지됩니다.
- Managed check는 missing manifest, malformed manifest, missing file, modified file 상태를 파일 쓰기 없이 보고합니다.
- Managed adopt는 기본 preview이며 apply 때 matching file만 기록합니다.
- Managed uninstall은 기본 preview이며 apply 때 unmodified file만 제거하고 edited file은 보존합니다.
- Operator search는 source, playbook, rule, worklog match를 파일 쓰기 없이 찾습니다.
- Operator search는 match가 없어도 성공으로 보고합니다.

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

Merge 전에는 public documentation external harness name search와 fixed local absolute path search도 실행하고, local target repository에서 `managed check/adopt` preview와 `operator search`를 확인합니다.
