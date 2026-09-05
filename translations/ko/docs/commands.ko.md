# 명령어 가이드

명령별 사용법, 파일을 바꾸는 시점, 결과를 읽는 방법을 설명합니다. 처음부터 실습하려면 [처음 10분 사용법](quick-start.ko.md)을 먼저 보세요.

## 예시 실행 방법

`aapb`는 설치된 실행 명령입니다. 소스를 직접 실행한다면 `node bin/aapb.mjs`로 바꾸고 AAPB 소스 폴더에서 실행하세요. `<project>` 같은 자리표시자는 실제 값으로 바꾸고, 공백이 있는 경로나 문장은 따옴표로 감쌉니다. 프로젝트 경로로 `.`을 쓰면 현재 터미널 폴더를 선택합니다.

```sh
aapb --version
aapb --help
aapb records status "<project>" --json
```

`--json`을 붙이면 경고, 총수, 이어 읽기 정보가 포함된 결과를 받습니다. 이 옵션이 없으면 `records read`는 문서 본문을 출력하고, 나머지 대부분의 명령은 구조화된 결과를 출력합니다.

## 어떤 명령이 파일을 바꾸나요?

| 명령 | 기본 동작 | 미리보기와 적용 |
| --- | --- | --- |
| `records status/read/search/validate`, `skills list/lint/check` | 읽기 전용 | 적용 단계 없음 |
| `bootstrap` | 기록이 없으면 생성 | `--dry-run`을 붙이면 미리보기 |
| `skills install/update/uninstall` | 선택한 설치본 변경 | `--dry-run`을 붙이면 미리보기 |
| `skills migrate/rollback`, `migrate layout/rollback` | 미리보기 | `--apply`로 적용. `--dry-run`이 있으면 항상 쓰기 방지 |
| `writing ...`, `qa ui-genericity-scan`, `runtime python-status` | 참고용 점검 | 선택하거나 명시적으로 요청한 경우 Python 탐색 실행 |
| `forge status` | 로컬 설정 확인 | 원격 쓰기 없음 |
| `forge bootstrap/sync/reconcile` | 미리보기 | `--apply`로 검토한 원격 작업 적용 |
| `mcp` | 표준 입출력 방식의 서버 시작 | 자동 등록이나 프로젝트 기록 쓰기 없음 |

모든 쓰기에 `--apply`가 필요한 것은 아닙니다. 일반 스킬 설치와 bootstrap은 이 옵션 없이도 적용됩니다. 먼저 `--dry-run`으로 확인하세요.

## 프로젝트 기록

```sh
aapb bootstrap "<project>" --local-only --dry-run
aapb bootstrap "<project>" --local-only
aapb records status "<project>" --json
aapb records status "<project>" --view records --page-size 10 --json
aapb records read "<project>" --path CURRENT.md --json
aapb records read "<project>" --path CURRENT.md --start-line 1 --end-line 20 --json
aapb records search "<project>" --query "API decision" --max-results 5 --json
aapb records validate "<project>" --json
```

Bootstrap은 플레이북이 없을 때만 `CURRENT.md`와 관리 파일 두 개를 만듭니다. `AGENTS.md`는 보존합니다. `--local-only`는 Git이 필요하며 새 기록 폴더를 Git의 로컬 제외 목록에 추가합니다. 기록을 공유하거나 Git이 아닌 폴더에서 사용할 때는 옵션을 빼세요.

`--path`는 저장소 루트가 아니라 선택된 플레이북 폴더를 기준으로 합니다. 검색은 정규식이 아닌 일반 문자열 검색입니다. 검증은 JSON, 기록 링크, 관리 파일 변경 여부를 확인하며 프로젝트 테스트를 실행하지 않습니다.

| 작업 | 보기와 크기 옵션 | 이어 읽기 |
| --- | --- | --- |
| 상태 | 기본값 `summary`, 상세 `records` 또는 `warnings`, `--page-size` | 같은 보기에 `--cursor` 추가 |
| 읽기 | `--start-line`, `--end-line`, `--max-chars` | 같은 경로와 커서 사용, 줄 범위 옵션은 제외 |
| 검색 | 기본값 `results`, 경고 `warnings`, `--max-results`, `--max-chars` | 같은 검색어·보기와 커서 사용 |
| 검증 | 기본값 `issues`, 요약 `summary`, 경고 `warnings`, `--page-size` | 같은 보기와 커서 사용 |

목록은 한 번에 기본 20개, 최대 100개입니다. 본문 크기는 기본 12,000자, 최대 100,000자입니다. 기록 명령 네 개 모두 `--max-chars`를 받습니다. 에이전트 앱의 토큰 설정과는 별개입니다. 자세한 예시와 MCP 결과 전체의 별도 상한은 [응답 크기 안내](record-responses.ko.md)에 있습니다.

## 스킬

```sh
aapb skills list --json
aapb skills lint --json
aapb skills install --profile development --dry-run --json
aapb skills install --profile development --json
aapb skills check --profile development --json
aapb skills update --profile development --dry-run --json
aapb skills uninstall --profile development --dry-run --json
```

기본 프로필은 두 스킬을 고르는 `core`입니다. `development`는 다섯 개, `legacy`는 `legacy-contracts` 하나입니다. 설치본 점검·갱신·삭제에도 같은 선택을 사용하세요. `list`는 소스 카탈로그를, `check`는 선택한 로컬 설치본과 원본의 차이를 확인합니다. 어느 명령도 앱에서의 실제 로딩을 확인해 주지는 않습니다.

개별 선택은 `--skill`을 반복합니다.

```sh
aapb skills install --skill project-memory --skill legacy-contracts --dry-run --json
```

개별 이름을 지정하면 프로필 대신 그 목록을 사용합니다. 빈 이름은 거부합니다. `--agents-root`는 설치 대상, `--codex-root`는 구버전 설치 위치, `--backup-root`는 백업을 둘 상위 폴더입니다. 백업은 두 스킬 폴더 밖이면서 실제 변경할 설치본과 같은 파일시스템에 있어야 합니다. 강제 덮어쓰기 옵션은 지원하지 않습니다. 충돌과 복구는 [설치 안내](lifecycle.ko.md)를 보세요.

## 이전과 복구

스킬 이전은 소유권이 확인된 0.5 복사본을 정리합니다. 폴더 이름만으로 관리 대상을 판단하지 않습니다. 기록 구조 이전은 기존 문서를 보존하고 관리 정보만 바꿉니다.

```sh
aapb skills migrate --profile development --json
aapb skills migrate --profile development --apply --json
aapb skills rollback --backup "<transaction-directory>" --json
aapb skills rollback --backup "<transaction-directory>" --apply --json
aapb migrate layout "<project>" --to minimal --json
aapb migrate layout "<project>" --to minimal --apply --json
aapb migrate rollback "<project>" --backup "<returned-relative-backup>" --json
aapb migrate rollback "<project>" --backup "<returned-relative-backup>" --apply --json
```

백업 경로는 추측하지 말고 실제 작업 결과의 값을 사용하세요. 스킬 복구는 작업별 백업 디렉터리, 기록 복구는 플레이북 기준 상대 경로를 받습니다. 관리 정보가 수정되었거나 소유권이 확인되지 않으면 이전을 거부할 수 있지만 기존 기록은 계속 읽을 수 있습니다. 복구를 반복해도 나중에 편집한 파일을 덮어쓰지 않습니다.

## 선택형 문서·UI 점검

```sh
aapb writing naturalness-check "<project>" --path README.md --lang en --engine js --json
aapb writing naturalness-report "<project>" --root docs --lang ko --max-files 10 --engine auto --json
aapb writing fidelity-check "<project>" --before docs/before.md --after docs/after.md --lang auto --json
aapb runtime python-status --json
aapb qa ui-genericity-scan "<project>" --root src --max-files 20 --json
```

여기의 파일 경로는 프로젝트 기준입니다. 보고서의 `--root`는 지정한 폴더로 검사 범위를 제한합니다. 입력은 크기 제한 안의 UTF-8 텍스트여야 하며, 경로 중간에 심볼릭 링크나 junction이 있으면 거부합니다. 기본 문서 엔진은 `js`이고, `auto`나 `python`을 고르면 선택형 Python 엔진을 찾습니다. 사용할 수 없을 때의 동작은 [실행 환경](runtime-engines.ko.md)에 있습니다.

자연스러움 점검은 다시 읽어볼 문장을, 정보 보존 점검은 지켜야 할 내용의 변경 후보를 찾습니다. UI 점검은 소스의 정적 후보만 찾고 화면을 렌더링하지 않습니다. 작성 주체나 최종 품질을 판정하는 도구는 아닙니다. [품질 검토 안내](quality-review.ko.md)를 함께 보세요.

## MCP와 Forge

```sh
aapb mcp --project "<project>"
aapb forge status "<project>" --json
aapb forge bootstrap "<project>" --milestone "Example delivery" --json
aapb forge sync "<project>" --plan docs/coordination.json --json
```

MCP는 `aapb_status`, `aapb_search`, `aapb_read`, `aapb_validate`를 제공합니다. 서버는 표준 입출력으로 연결할 클라이언트를 기다립니다. 터미널에 아무 출력이 없다고 점검이 끝난 것은 아닙니다. [MCP 설정](mcp-permission-model.ko.md)에 따라 앱에서 연결하세요.

Forge의 `sync`와 `reconcile`에는 프로젝트 안에 있는, 검토한 JSON 계획 파일이 필요합니다. `--remote`는 Git 원격 이름이며 기본값은 `origin`입니다. `--provider`는 `auto`, `github`, `gitea`를 받습니다. 여기서 `--profile`은 스킬이 아니라 Forge 권한 정책이고 CLI 기본값은 `coordinate`입니다. `--offline`, `--no-remote`, `--remote-read-only`가 있으면 `--apply`를 붙여도 원격 쓰기를 하지 않습니다. 계획 예시와 적용 방식은 [Forge 협업](forge-automation.ko.md)에 있습니다.

## 구버전 명령과 종료 코드

| 이전 진입점 | 현재 동작 또는 대체 방법 |
| --- | --- |
| `context`, `context list/status` | 읽기·상태 조회의 제한된 별칭. `records read/status` 사용 권장 |
| `doctor`, `operator check/audit`, `managed check`, `contracts check` | 기록 검증만 수행. `records validate` 사용 권장 |
| `operator search`, `managed catalog`, `layout status` | 기록 검색·상태 조회의 별칭 |
| `catalog list/check` | 소스 스킬 목록·형식 검사의 별칭 |
| `run`, `plan`, `worklog`, `automation`, `index`, 광범위 분석·관리 쓰기 | 종료. 앱·프로젝트 도구를 쓰고 기록은 직접 편집 |

종료한 명령은 종료 코드 `2`와 버전을 고정한 `npx ai-agent-playbook@0.5.11` 복구 안내를 반환합니다. 구버전을 자동 실행하지 않습니다. 이전 패키지는 데이터를 보존한 상태에서 의도적으로 복구할 때만 사용합니다. [설치·복구 안내](lifecycle.ko.md)를 참고하세요.

종료 코드 `0`은 명령 성공, `1`은 실패 또는 충돌, `2`는 종료된 명령을 뜻합니다. 충돌이 있어도 독립적으로 처리할 수 있는 일부 항목은 적용되었을 수 있으니, 재시도 전에 작업 내역과 백업을 확인하세요. 문서 검증 성공은 프로그램 실행 검증과 다릅니다.
