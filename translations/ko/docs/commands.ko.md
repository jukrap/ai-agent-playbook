# 명령

설치한 aapb 실행 파일이나 소스 checkout의 node bin/aapb.mjs를 사용합니다. <project> 등의 표시는 실제 값으로 바꾸세요. --json은 구조화된 결과를 반환합니다.

## 기록

| 명령 | 동작 |
| --- | --- |
| bootstrap <project> [--local-only] [--dry-run] | 기록이 없을 때만 CURRENT.md와 관리 메타데이터를 만들고 AGENTS.md를 보존 |
| records status <project> | 기록 수·레이아웃·진입점 요약 |
| records read <project> [--path CURRENT.md] | 선택한 기록 디렉터리 안의 텍스트 읽기 |
| records search <project> --query <literal> | 기록의 문자열 검색 |
| records validate <project> | JSON·링크·관리 파일 검사, 런타임 검사는 실행하지 않음 |
| migrate layout <project> --to minimal [--apply] | 관리 메타데이터 이전 미리보기·적용, 기존 기록 보존 |

읽기는 --start-line, --end-line, --max-chars를 받습니다. 다음 조각은 같은 --path와 --cursor를 사용하고 줄 인자는 생략합니다. 상태는 --view summary가 기본이며 records·warnings 보기는 --page-size와 --cursor로 나눕니다. 검증은 --view issues가 기본이고 summary·warnings도 지원합니다. 검색은 --view results 또는 warnings, --max-results와 --cursor를 사용하며 후속 페이지에서도 같은 검색어를 전달합니다. --json으로 이어 읽기 메타데이터를 확인하세요. [응답 예산과 이어 읽기](record-responses.ko.md)는 호스트의 토큰 한도와 별개입니다.

doctor, context, operator search/check, managed check/catalog, layout status는 기록 중심의 제한된 호환 별칭으로 유지합니다. 잘린 출력과 제외한 검사 범위는 결과에 표시합니다.

## 스킬

skills list는 프로필과 이름을 보여 줍니다. skills install·update·check·uninstall은 --profile core|development|legacy 또는 반복한 --skill <name>으로 선택합니다. 기본은 core이며 .agents/skills 한 곳에 설치합니다. uninstall은 선택한 스킬만 대상으로 합니다.

skills migrate --profile development는 --apply가 없으면 미리보기입니다. 두 구버전 경로의 알려진 관리 설치본을 조정합니다. --dry-run은 항상 쓰기를 막습니다. 독립적인 안전 항목이 성공해도 충돌은 보존하고 보고합니다.

skills rollback --backup <transaction-directory>는 복구 미리보기이며 --apply로 변경되지 않은 항목을 복원합니다. 이후 사용자 편집은 보존합니다. --agents-root·--codex-root·--backup-root로 경로를 지정할 수 있습니다. 강제 교체 옵션은 거부합니다.

## 선택형 MCP

aapb mcp --project <project>는 기존 프로젝트 하나에 묶입니다. 도구는 aapb_status, aapb_search, aapb_read, aapb_validate뿐입니다. 쓰기·임의 shell·자동 등록 기능은 없습니다.

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

실행·감독 루프·예약·자동 전달·광범위 분석·자동 기록 승격은 종료됐습니다. 종료 코드 2와 고정 0.5.11 복구 안내를 반환하며 다른 런타임을 자동 실행하지 않습니다. 실패·충돌은 1, 성공은 0입니다.
