# Project Bootstrap

저장소가 실제로 사용할 수 있는 project memory와 root instructions만 만듭니다.

## 진행 절차

1. 파일을 제안하기 전에 repository structure, git state, README, agent instructions, build config, scripts, existing docs를 확인합니다.
2. project shape를 분류합니다: new, inherited, legacy, API-heavy, UI-heavy, mobile, multi-repo, documentation-only, mixed.
3. `ai-playbook/`을 commit할지 local-only로 둘지 결정하고, private note를 쓰기 전에 그 policy를 기록합니다.
4. `templates/agents/global`의 루트 `AGENTS.md`와 `templates/project-playbook`의 project memory templates를 조정합니다.
5. 지금 프로젝트에 필요한 maps, runbooks, decisions, plans, guides, worklog structure만 만듭니다.
6. project-specific facts는 installable skills가 아니라 project docs에 둡니다.
7. committed docs에서 personal paths, private names, credentials, internal URLs, machine-specific setup을 제거합니다.

## 참고 자료

project bootstrap plan을 만들거나 검토할 때 `references/bootstrap-checklist.md`를 읽습니다.
