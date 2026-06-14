# 공개 체크리스트

공유 Git host에 저장소를 push하기 전에 사용합니다.

## 유지보수 점검

- 추가하거나 바꾼 스킬, 템플릿, 예시, 번역, 어댑터가 있으면 `docs/maintenance.md`를 읽습니다.
- 필요할 때 README, 분류 문서, 템플릿 색인, 한국어 번역, 설치된 스킬 복사본이 함께 갱신되었는지 확인합니다.
- 이식 가능한 프로젝트 규칙이 특정 장비의 custom instruction에 의존하지 않는지 확인합니다.

## 공개 위생

private 또는 특정 장비 값을 검색합니다.

```powershell
rg -n --glob '!docs/publishing-checklist.md' "PERSONAL_NAME|COMPANY_NAME|CUSTOMER_NAME|INTERNAL_DOMAIN|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|PR #|ticket #|[A-Za-z]:\\\\" .
```

- credential, 내부 도메인, private data가 들어간 screenshot, 날짜가 박힌 branch/PR 상태를 제거합니다.
- 예시는 일반적으로 유지합니다.
- 생성된 zip 파일이나 로컬 설치 output을 공개하지 않습니다.
- 첫 commit 전에 `.gitignore`가 로컬 환경 파일, log, 임시 파일, 생성된 dependency folder를 제외하는지 확인합니다.

## 검증

```powershell
npm run check
npm test
npm pack --dry-run --json
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

스킬 원본 파일이 바뀌었으면 검증 뒤 `.\scripts\sync-skills.ps1`를 실행합니다.

push 뒤 저장소가 검증 workflow를 사용한다면 통과 여부를 확인합니다.

## npm package publish

- publish할 장비에서 `npm whoami`가 성공하는지 확인합니다.
- 패키지 이름을 사용할 수 있거나 publish 계정이 이미 소유하고 있는지 확인합니다.
- README 또는 패키지에 포함되는 문서가 바뀌었고 npm package page에 반영해야 한다면 publish 전에 patch version을 올립니다. npm은 같은 version을 다시 publish할 수 없습니다.
- `npm pack --dry-run --json`으로 tarball에 runtime file이 포함되고 test, translations, local reference, 큰 image asset이 제외되는지 확인합니다.
- 저장소 검증이 통과한 뒤에만 publish합니다.

```powershell
npm publish --access public
```

npm이 one-time password를 요구하면 publish 장비에서 대화형으로 완료합니다. npm token은 repository file에 저장하지 않습니다.

Publish 뒤에는 registry와 CLI smoke path를 확인합니다.

```powershell
npm view ai-agent-playbook version
npx --yes ai-agent-playbook@latest --help
npx --yes ai-agent-playbook@latest skills install --dry-run
```

## Git host 설정

- `ai-agent-playbook` 또는 `agent-harness-playbook` 같은 repository name을 고릅니다.
- 위생 검색과 검증 명령이 통과할 때까지 repository를 private으로 유지합니다.
- redistribution policy를 일부러 바꾸는 것이 아니라면 `LICENSE`의 MIT license를 유지합니다.
- `ai-agents`, `skills`, `codex`, `agent-playbook`, `legacy-systems`, `software-engineering` 같은 topic을 추가합니다.
- 공개 뒤 설치 예시에 최종 repository URL을 반영합니다.

## First push

빈 private repository를 만든 뒤:

```powershell
git init
git config user.name "<git-user-name>"
git config user.email "<git-user-email>"
git add .
git commit -m "docs: initial ai agent playbook"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

여기서는 저장소 로컬 Git config를 사용해 관련 없는 전역 Git setting을 건드리지 않습니다.
