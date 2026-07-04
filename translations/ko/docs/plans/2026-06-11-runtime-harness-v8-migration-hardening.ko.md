# Runtime Harness V8 Migration Hardening

**목표:** `.ai-agent-playbook/` 경로 전환 뒤 기존 프로젝트 적용을 더 안전하게 만들되, blocking hook, continuation, 자동 doctor 실행, settings 쓰기는 추가하지 않습니다.

**아키텍처:** 문서와 CLI 하네스를 기본 경로로 유지합니다. 쓰기 작업을 미리 확인하고, stale guide를 검토하고, legacy playbook 경로를 명시적 승인 뒤에만 옮길 수 있는 작고 결정적인 CLI 점검을 추가합니다.

## 범위

- Legacy `ai-playbook/` 프로젝트를 위한 read-only `migrate path <target>` preview를 추가합니다.
- 검토한 뒤 `ai-playbook/`에서 `.ai-agent-playbook/`로 폴더를 옮기는 `migrate path <target> --apply`를 추가합니다.
- Migration 중 root 문서와 playbook 문서의 `ai-playbook/` 참조를 `.ai-agent-playbook/`로 갱신합니다.
- Legacy path가 이미 ignore된 경우에만, 전환 호환성을 위해 legacy ignore 항목은 유지하면서 `.gitignore`에 `.ai-agent-playbook/`을 추가합니다.
- Bootstrap이 파일을 만들기 전에 예정된 모든 쓰기 작업을 먼저 점검하게 해 충돌 시 부분적인 playbook output이 남지 않게 합니다.
- 파일을 쓰지 않고 stale guide의 첫 차이 line을 보여주는 `guides sync --check --diff`를 추가합니다.

## 경계

- Hook을 설치하거나 adapter settings를 편집하지 않습니다.
- Blocking, continuation, 자동 doctor 실행을 추가하지 않습니다.
- Network call을 하지 않습니다.
- `--force`를 migration 전략으로 사용하지 않습니다.
- Path migration 중 관련 없는 project file을 수정하지 않습니다.
- `.ai-agent-playbook/`이 없을 때 legacy `ai-playbook/` read/write 호환성을 유지합니다.

## 테스트 범위

- Bootstrap conflict preflight는 기존 root policy file이 있을 때 부분 쓰기 없이 거부합니다.
- Guide check diff는 stale guide line difference를 보고하고 read-only로 유지됩니다.
- Migration preview는 폴더 이동, 참조 갱신, `.gitignore` 변경을 보고하되 파일을 쓰지 않습니다.
- Migration apply는 legacy folder를 옮기고 참조를 갱신하며 doctor가 `.ai-agent-playbook/`과 호환되는지 확인합니다.
- Migration conflict는 두 경로가 모두 있을 때 파일을 쓰지 않고 충돌을 보고합니다.
- 테스트에는 target path의 공백과 비ASCII 문자를 포함합니다.

## 문서화

- Runtime CLI 문서에 `migrate path`와 `guides sync --check --diff`를 추가합니다.
- Installation과 adapter 문서에서 migration이 검토된 수동 작업으로 남도록 갱신합니다.
- 복사되는 project playbook guide에도 더 안전한 migration flow를 반영합니다.
- English source edit과 함께 Korean translation을 갱신합니다.

## 검증

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

Merge 전 public documentation의 external harness name과 고정 local absolute path도 검색합니다.
