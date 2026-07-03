# 유지보수 작업 흐름

이 저장소에서 내용을 추가, 이름 변경, 제거, 대규모 재작성할 때 사용하는 체크리스트입니다.

## 원본 순서

- 영어 원본 파일을 먼저 수정합니다.
- 영어 원본이 안정된 뒤 `translations/ko` 아래 한국어 번역을 갱신합니다.
- translations 아래에는 `SKILL.md` 파일을 만들지 않습니다.
- 설치된 로컬 스킬 복사본을 기준 원본처럼 수정하지 않습니다.

## 스킬 추가

1. `skills/` 아래에서 가장 작은 적절한 분류를 고릅니다.
2. `skills/<category>/<skill-name>/SKILL.md`를 만듭니다.
3. `SKILL.md`는 트리거, 작업 흐름, 참고 자료를 읽을 시점에 집중합니다.
4. 긴 규칙, 체크리스트, 예시, provider별 세부사항은 `references/*.md`로 옮깁니다.
5. Reference는 재사용 절차, evidence, 예시, stack/profile detail을 담을 만큼 충분히 실질적으로 유지하고 placeholder reference를 피합니다.
6. 스킬 UI metadata가 필요할 때만 `agents/openai.yaml`을 추가하거나 갱신합니다.
7. 한국어 번역을 `translations/ko/skills/<category>/<skill-name>.ko.md`에 추가합니다.
8. reference 파일은 `translations/ko/skills/**/references/`의 대응 경로에 번역합니다.
9. 스킬이 공개 분류 지도를 바꾸면 `README.md`와 `docs/classification.md`를 갱신합니다.
10. 검증하고 설치된 복사본을 동기화합니다.

## 프로젝트 템플릿 추가

1. 복사용 얇은 루트 에이전트 부트스트랩 파일은 `templates/agents` 아래에 둡니다.
2. 개인 Codex home 기본값은 `templates/codex-home` 아래에 둡니다.
3. 프로젝트 메모리 템플릿은 `templates/project-playbook` 아래에 둡니다.
4. 재사용 템플릿에는 프로젝트 고유 제품 사실을 넣지 않습니다.
5. 기술별 지침은 global이나 Codex home 기본값이 아니라 profile에 둡니다.
6. 대응하는 한국어 번역을 `translations/ko/templates/**` 아래에 추가합니다.
7. 새 템플릿이 추천 bundle을 바꾸면 템플릿 index를 갱신합니다.

## 런타임 CLI 갱신

1. CLI entrypoint는 `bin/ai-playbook.mjs`에 둡니다.
2. 구현은 `src/` 아래에 두고 template 내용은 중복하지 않습니다.
3. 테스트는 `test/` 아래에 추가합니다.
4. `docs/harness-runtime.md`, `README.md`, 설치 문서, 한국어 번역을 함께 갱신합니다.
5. 대상 프로젝트 파일을 덮어쓰는 동작은 기본적으로 막고, `--force`로만 허용합니다.

## Commit, PR, worklog 정책 갱신

- `templates/project-playbook/guides/commit-push-worklog.md`와 `skills/git/commit-worklog-guardrails/references/git-worklog-checklist.md`를 함께 갱신합니다.
- 프로젝트에 복사하는 안내는 template에 둡니다.
- 스킬로 호출되는 절차 안내는 스킬 참고 자료에 둡니다.
- 두 파일의 한국어 번역도 같은 변경에서 갱신합니다.
- 정책이 로컬 에이전트 설정에서 온 경우 특정 장비 경로를 제거하고 이식 가능한 규칙만 남깁니다.
- Commit message는 Conventional Commit type/scope를 사용합니다. 제목과 본문은 사용자 또는 저장소의 작업 언어에 맞추고, 한국어 작업에서는 type/scope는 영어로 두되 제목과 본문은 한국어로 씁니다.
- 아주 작은 변경만 제목만 있는 commit을 사용합니다. 여러 파일, runtime, packaging, 문서 구조 변경은 짧은 본문과 실제 실행한 검증 섹션을 함께 씁니다.
- PR 본문은 리뷰어가 기대하는 언어가 분명하면 그 언어를 사용하고, 실제 diff 범위와 실제 검증만 적습니다. Public docs에는 placeholder, agent signature, branch name, PR number를 남기지 않습니다.

## 예시 갱신

- 예시는 일반적이고 정리된 상태로 유지합니다.
- 개인 이름, 회사명, 고객명, 내부 도메인, credential, branch명, PR 번호, 날짜가 박힌 운영 상태를 제거합니다.
- 결정 품질, 검증, 인수인계 명확성을 보여주는 예시를 선호합니다.
- 오래된 예시를 활성 규칙으로 승격하려면 해당 템플릿 또는 스킬도 함께 갱신합니다.

## 필수 점검

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\validate-public-docs.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

검증 스크립트가 바뀌면 같은 변경에서 `.github/workflows/validate.yml`도 갱신합니다.

스킬 원본 파일이 바뀌었으면 검증 뒤 설치된 복사본을 동기화합니다.

```powershell
.\scripts\sync-skills.ps1
```

## 리뷰 체크리스트

- 새 내용이 `skills`, `templates`, `examples`, `docs`, `adapters` 중 어디에 속하는가?
- 영어 원본에 프로젝트 private 값이 남아 있지 않은가?
- 모든 영어 markdown source에 한국어 번역이 있는가?
- 설치형 스킬은 여전히 `skills/**/SKILL.md` 아래에만 있는가?
- README, classification, adapters, recommended bundle 갱신이 필요한가?
- 설치된 스킬 복사본 동기화가 필요한가?
