# Maintenance Workflow

이 체크리스트는 이 저장소의 내용을 추가, 이름 변경, 제거, 대폭 재작성할 때 사용합니다.

## 원본 순서

- 영어 원문 파일을 먼저 수정합니다.
- 원문이 안정된 뒤 `translations/ko` 아래의 한국어 번역본을 갱신합니다.
- 번역 폴더 아래에는 `SKILL.md` 파일을 만들지 않습니다.
- 로컬에 설치된 skill 복사본을 원본처럼 수정하지 않습니다.

## Skill 추가

1. `skills/` 아래에서 가장 작은 적합 category를 고릅니다.
2. `skills/<category>/<skill-name>/SKILL.md`를 만듭니다.
3. `SKILL.md`는 trigger, workflow, 어떤 reference를 읽을지에 집중합니다.
4. 긴 규칙, 체크리스트, 예시, provider-specific 세부사항은 `references/*.md`로 옮깁니다.
5. skill UI metadata 노출이 필요할 때만 `agents/openai.yaml`을 추가하거나 갱신합니다.
6. 한국어 번역본은 `translations/ko/skills/<category>/<skill-name>.ko.md`에 추가합니다.
7. reference 파일도 대응되는 `translations/ko/skills/**/references/` 경로에 번역합니다.
8. public category map이 바뀌면 `README.md`와 `docs/classification.md`를 갱신합니다.
9. 검증을 실행하고 설치본을 동기화합니다.

## 프로젝트 템플릿 추가

1. 프로젝트 루트에 복사할 agent 지침은 `templates/agents`에 둡니다.
2. 선택적 local-only helper 문서는 `templates/local-ai`에 둡니다.
3. 프로젝트 고유 제품 사실은 재사용 템플릿에 넣지 않습니다.
4. 기술별 지침은 global이 아니라 profile에 둡니다.
5. 대응되는 한국어 번역본을 `translations/ko/templates/**` 아래에 추가합니다.
6. 새 템플릿이 recommended bundle을 바꾸면 template index도 갱신합니다.

## Commit, PR, worklog 정책 갱신

- `templates/local-ai/commit-push-worklog.md`와 `skills/engineering/commit-worklog-guardrails/references/git-worklog-checklist.md`를 함께 갱신합니다.
- 프로젝트에 복사할 지침은 template에 둡니다.
- skill이 trigger되었을 때 읽을 절차 지침은 skill reference에 둡니다.
- 두 파일의 한국어 번역본도 같은 변경에서 갱신합니다.
- 정책이 로컬 Codex 설정에서 온 경우 machine-specific path는 제거하고 휴대 가능한 규칙만 남깁니다.

## 예시 갱신

- 예시는 generic하고 scrubbed된 상태로 유지합니다.
- 회사명, 고객명, 내부 도메인, credential, branch명, PR 번호, 날짜가 박힌 운영 상태를 제거합니다.
- 판단 품질, 검증, handoff clarity를 보여주는 예시를 우선합니다.
- 오래된 예시를 active rule로 만들려면 대응되는 template이나 skill도 함께 갱신합니다.

## 필수 확인

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

Validation script가 바뀌면 같은 변경에서 `.github/workflows/validate.yml`도 갱신합니다.

Skill 원본 파일이 바뀌었다면 검증 후 설치본을 동기화합니다.

```powershell
.\scripts\sync-skills.ps1
```

## 리뷰 체크리스트

- 새 내용이 `skills`, `templates`, `examples`, `docs`, `adapters` 중 어디에 속하는가?
- 영어 원문에 프로젝트 private 값이 남아 있지 않은가?
- 모든 영어 markdown 원문에 한국어 번역본이 있는가?
- 설치형 skill은 여전히 `skills/**/SKILL.md` 아래에만 있는가?
- README, classification, adapters, recommended bundles 갱신이 필요한가?
- 설치된 skill 복사본 동기화가 필요한가?
