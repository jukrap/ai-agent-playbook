# Codex Home 템플릿

이 폴더는 개인 Codex home 지침용이며, 프로젝트 루트 템플릿이 아닙니다.

Codex는 Codex home 디렉터리에서 전역 지침 파일을 읽습니다. 기본값은 `~/.codex`이며,
`CODEX_HOME`을 설정하면 그 디렉터리를 사용합니다. 이 위치에서 Codex는
`AGENTS.override.md`가 있으면 먼저 읽고, 없으면 `AGENTS.md`를 읽습니다.

자신의 `~/.codex/AGENTS.md` 시작점이 필요할 때 이 폴더를 사용합니다.

## 파일

- `AGENTS.md`: Codex용 개인 전역 기본값 예시.

## 수동 설치

PowerShell:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item -LiteralPath (Join-Path $playbookRepo 'templates\codex-home\AGENTS.md') -Destination (Join-Path $codexHome 'AGENTS.md')
```

Codex home 디렉터리의 `AGENTS.override.md`는 임시 전역 실험에만 사용합니다. 실험이 끝나면 삭제해 기본 지침으로 되돌립니다.

## 여기에 둘 내용

- 개인 커뮤니케이션 선호.
- 개인 기본 검증 습관.
- 개인 기본 Git 안전 선호.
- 저장소가 제공하는 skill과 project playbook 문서를 다루는 방식.

## 여기에 두지 않을 내용

- 프로젝트별 스택 규칙.
- 제품 요구사항, API 계약, milestone.
- 고객, 고용주, 계정, 비공개 경로 정보.
- 저장소와 함께 이동해야 하는 규칙.

저장소 작업 규칙은 프로젝트 루트 `AGENTS.md`에 둡니다. 이 playbook의 프로젝트 템플릿을 사용한다면,
루트 `AGENTS.md`는 `templates/agents/global/`에서 오고, skill/Git 정책은
`templates/project-playbook/` 아래에서 `.ai-playbook/policy/SKILLS.md`, `.ai-playbook/policy/GIT.md`로 들어갑니다.
