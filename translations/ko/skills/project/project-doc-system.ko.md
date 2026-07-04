# Project Doc System

working rules와 product facts를 분리하고 stale notes를 active guidance에서 걷어냅니다.

## 진행 절차

1. 구조를 제안하기 전에 existing docs와 git/local-only policy를 확인합니다.
2. `AGENTS.md`는 얇은 진입점으로 유지하고, current project memory는 `.ai-agent-playbook/`으로 옮깁니다.
3. current truth, working vocabulary, maps, runbooks, decisions, active plans, worklogs, archived notes를 분리합니다.
4. 날짜가 박힌 prompt, handoff, worklog는 rule이 현재형일 때만 history에서 active guidance로 승격합니다.
5. worklog에서 계속 현재인 사실과 안정된 shared term은 `CURRENT.md`, maps, runbooks, decisions로 승격합니다.
6. source-of-truth priority와 local-only commit policy를 문서화합니다.

## 참고 자료

rule이 어디에 속하는지 결정하거나 흩어진 markdown files를 정리할 때 `references/doc-roles.md`를 읽습니다.
