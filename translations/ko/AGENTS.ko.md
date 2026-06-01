# AGENTS.md

이 저장소는 재사용 가능한 AI agent skill과 프로젝트 템플릿을 담습니다. 에이전트별 내용은 `adapters/` 아래에만 두고, 나머지는 agent-agnostic하게 유지합니다.

## 작업 규칙

- 내용을 추가, 이동, 이름 변경하기 전에 `docs/maintenance.md`를 읽습니다.
- `skills/*/*/SKILL.md`는 짧고 trigger 중심으로 유지합니다.
- 긴 재사용 세부 내용은 `references/`로 분리합니다.
- 프로젝트에 복사할 문서는 `templates/` 아래에 둡니다.
- 개인 절대 경로, 회사명, 고객명, 자격증명, 내부 URL, branch명, PR 번호를 공개 문서에 넣지 않습니다.
- 영어 원문을 수정하면 같은 변경에서 한국어 번역본도 갱신합니다.
- 수정 후 skill과 translation을 반드시 검증합니다.
- 설치된 로컬 skill은 이 저장소에서만 동기화합니다.

## Skill 구조

- skill 이름은 소문자와 하이픈을 사용합니다.
- `SKILL.md` frontmatter는 `name`, `description`만 사용합니다.
- description은 `Use when...`으로 시작하고 workflow가 아니라 trigger 조건을 설명합니다.
- `SKILL.md`에서 직접 연결되는 1단계 reference를 선호합니다.

## 검증

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
```

설치본 갱신이 필요하면:

```powershell
.\scripts\sync-skills.ps1
```
