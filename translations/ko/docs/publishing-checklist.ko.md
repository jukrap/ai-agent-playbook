# Publishing Checklist

GitHub에 공개하기 전에 사용합니다.

## Maintenance 확인

- 추가하거나 바꾼 skill, template, example, translation, adapter가 있으면 `docs/maintenance.md`를 읽습니다.
- 필요할 때 README, classification docs, template index, 한국어 번역본, 설치된 skill 복사본을 함께 갱신했는지 확인합니다.
- portable project rule이 machine-local custom instruction에 의존하지 않는지 확인합니다.

## 공개 위생

개인 경로, 회사명, 고객명, 내부 도메인, 비밀값, ticket/PR 번호를 검색합니다.

```powershell
rg -n --glob '!docs/publishing-checklist.md' "PERSONAL_NAME|COMPANY_NAME|CUSTOMER_NAME|INTERNAL_DOMAIN|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|PR #|ticket #|C:\\|D:\\" .
```

- credential, 내부 도메인, 고객 데이터가 들어간 screenshot, 날짜가 박힌 branch/PR 상태를 제거합니다.
- 예시는 generic하게 유지합니다.
- 생성된 zip 파일이나 로컬 설치 결과물을 공개하지 않습니다.
- 첫 commit 전에 `.gitignore`가 로컬 환경 파일, 로그, 임시 파일, 생성된 dependency 폴더를 제외하는지 확인합니다.

## 검증

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

Skill 원본 파일이 바뀌었다면 검증 후 `.\scripts\sync-skills.ps1`를 실행합니다.

GitHub에 push한 뒤 `Validate` workflow가 통과하는지 확인합니다. 이 workflow는 `push`, `pull_request`에서 skill과 translation validator를 실행합니다.

## GitHub 설정

- 저장소 이름은 `ai-agent-playbook` 또는 `agent-skills-playbook`처럼 잡습니다.
- `jukrap` 계정의 private repository라면 `ai-agent-playbook`은 `https://github.com/jukrap/ai-agent-playbook`에 자연스럽게 대응됩니다.
- 공개 위생 검색과 검증 명령이 통과하기 전까지 repository를 private으로 유지합니다.
- 더 넓은 재배포가 목적일 때만 license를 추가합니다. Private reuse에는 license가 필수는 아닙니다.
- topic 예: `ai-agents`, `skills`, `codex`, `claude-code`, `legacy-systems`, `software-engineering`.
- 공개 후 install 예시에 최종 repository URL을 반영합니다.

## 첫 push

GitHub에서 비어 있는 private repository를 만든 뒤:

```powershell
git init
git config user.name "jukrap"
git config user.email "jukrap628@gmail.com"
git add .
git commit -m "docs: initial ai agent playbook"
git branch -M main
git remote add origin https://github.com/jukrap/ai-agent-playbook.git
git push -u origin main
```

회사 계정용 global Git 설정을 건드리지 않도록 repository-local Git config를 사용합니다.
