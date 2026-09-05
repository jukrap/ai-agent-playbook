# 명령

설치한 aapb 또는 checkout의 node bin/aapb.mjs를 사용합니다. <project> 같은 표시를 실제 값으로 바꾸며 --json은 구조화된 결과를 반환합니다.

## 기록

- bootstrap <project> [--local-only] [--dry-run]: 기존 playbook이 없을 때 CURRENT.md와 관리 metadata를 생성하며 AGENTS.md를 보존합니다.
- records status <project>: 기록·레이아웃·진입점을 확인합니다.
- records read <project> [--path CURRENT.md]: 선택한 playbook 내부의 텍스트를 읽습니다.
- records search <project> --query <literal>: 제한된 기록 검색을 수행합니다.
- records validate <project>: JSON·링크·관리 파일을 확인하며 실행 검증은 하지 않습니다.
- migrate layout <project> --to minimal [--apply]: 관리 metadata 이전을 미리 보거나 적용하며 구버전 기록을 보존합니다.

read는 --start-line·--max-chars, search는 --max-results·--max-chars를 받습니다. 잘림과 제외 범위를 보고합니다. doctor·context·operator search/check·managed check/catalog·layout status는 기록 중심의 좁은 alias로 유지합니다.

## 스킬

skills list로 프로필과 이름을 확인합니다. install·update·check·uninstall은 --profile core|development|legacy 또는 반복 --skill <name>을 받습니다. 기본값은 core이며 .agents/skills에만 설치합니다. uninstall은 선택한 스킬만 대상으로 합니다.

skills migrate --profile development는 --apply가 없으면 미리보기입니다. 두 이전 경로의 알려진 0.5 관리 설치본을 정리합니다. --dry-run은 언제나 쓰기를 막습니다. 안전한 독립 항목을 적용해도 충돌은 보존하고 보고합니다.

skills rollback --backup <transaction-directory>는 복구 미리보기이며 --apply로 적용합니다. 이후 사용자 변경은 보존합니다. 경로는 --agents-root·--codex-root·--backup-root로 지정할 수 있고 강제 덮어쓰기 옵션은 거부합니다.

## 선택 MCP

aapb mcp --project <project>는 기존 프로젝트 하나에 묶입니다. 도구는 playbook_status, playbook_search, playbook_read, playbook_validate뿐입니다. 쓰기·임의 shell·자동 등록 기능은 없습니다.

## 참고용 검사

- writing naturalness-check <project> --path <file> [--lang auto|ko|en] [--engine js|auto|python]
- writing naturalness-report <project> [--root <directory>] [--max-files N]
- writing fidelity-check <project> --before <file> --after <file> [--lang auto|ko|en]
- runtime python-status
- qa ui-genericity-scan <project> [--root <directory>] [--max-files N]

CLI의 글쓰기 검사는 JS가 기본입니다. auto·python을 명시하면 선택 Python 엔진을 호출할 수 있습니다. 결과는 참고 신호이며 작성 주체나 디자인 결함을 자동 판정하지 않습니다.

문서 보고서는 --root로 선택한 프로젝트 상대 디렉터리만 검사합니다. 문서·UI 검사는 상위 폴더의 symbolic link나 junction을 포함한 링크 경로를 거부합니다. 입력은 크기 제한 안의 UTF-8 텍스트 파일이어야 합니다.

## Forge와 종료된 명령

forge status는 네트워크 쓰기 없이 설정을 확인하고 forge bootstrap은 협업 자산 생성을 미리 보여 줍니다. forge sync|reconcile <project> --plan <relative-json>은 검토된 협업 데이터를 사용하며 원격 쓰기에는 --apply가 필요합니다. --offline·--no-remote·--remote-read-only는 원격 쓰기를 막습니다. plan 경로는 선택한 프로젝트 안에 있어야 합니다.

실행·감독 루프·예약·자동 Git 전달·광범위 분석·자동 기록 승격은 종료됐습니다. 종료 코드 2와 고정 0.5.11 복구 안내를 반환하며 다른 런타임을 자동 실행하지 않습니다. 실패·충돌은 1, 성공은 0입니다.
