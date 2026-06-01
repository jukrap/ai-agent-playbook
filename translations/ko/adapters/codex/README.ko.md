# Codex adapter

Codex는 이 저장소의 skill을 로컬 skill 디렉터리에 복사하면 사용할 수 있습니다.

## 로컬 동기화

새 컴퓨터 전체 설치 절차는 `../../docs/installation.md`를 봅니다. 저장소 루트에서는 아래를 우선 사용합니다.

```powershell
.\install.ps1
```

Codex target directory만 직접 지정해야 한다면:

```powershell
.\scripts\sync-skills.ps1 -CodexSkillsRoot "$env:USERPROFILE\.codex\skills"
```

이 스크립트는 `skills/<category>/<skill>` 구조를 로컬 skill 디렉터리에는 flat하게 복사합니다. 일부 에이전트는 flat 구조일 때 skill을 더 명확하게 보여줍니다.

## GitHub 설치

저장소를 공개한 뒤 skill manager가 GitHub 설치를 지원하면 GitHub에서 직접 설치할 수 있을 수 있습니다.

```text
https://github.com/jukrap/ai-agent-playbook
```

Private repository는 설치 도구에서 GitHub 인증이 필요할 수 있습니다.

## 원본 규칙

로컬 설치 디렉터리의 파일을 원본처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 다시 동기화합니다.

## 휴대 가능한 지침

다른 컴퓨터에 Codex account-level custom instruction이 있다고 의존하지 않습니다. 재사용할 작업 합의는 프로젝트 `AGENTS.md` 템플릿이나 `templates/local-ai` 문서에 두고, machine-specific path는 local setup note에만 둡니다.
