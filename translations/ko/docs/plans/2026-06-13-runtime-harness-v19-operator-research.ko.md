# Runtime Harness V19 Operator Research

## 목표

하네스를 자동 agent loop로 바꾸지 않고, 명시적으로 실행하는 깊은 로컬 조사 명령을 추가합니다.

## 범위

- `operator research <target> --query <text> [--path <file>] [--max-results N] [--json]`을 추가합니다.
- 명령은 read-only, local-only, no-network로 유지합니다.
- 기존 operator signal인 local text search, diagnostics, codebase map, rules, path-scoped context를 재사용합니다.
- Evidence, gaps, next steps, markdown summary text를 반환합니다.
- Slash command, plugin packaging, automatic hook, continuation, web research는 범위 밖에 둡니다.

## 동작

- Query를 research axis로 확장하고 local file을 검색합니다.
- Source, tests, playbook notes, rules, plans, worklogs, diagnostics, map signal을 연결합니다.
- Match가 없는 경우도 명시적인 gap을 포함한 성공 결과로 보고합니다.
- Report file은 쓰지 않습니다. Operator가 durable note가 필요하면 `reportMarkdown`을 복사하거나 저장할 수 있습니다.

## 검증

- Source/test/playbook/rule/worklog evidence fixture test를 추가합니다.
- No-match output이 성공이며 gaps와 next steps를 포함하는지 확인합니다.
- Ignored folder가 계속 제외되고 명령이 파일을 쓰지 않는지 확인합니다.
- Runtime 문서와 설치 문서를 한국어 번역과 함께 갱신합니다.
