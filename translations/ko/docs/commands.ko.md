# 명령어 가이드

기본 명령은 `ai-agent-playbook`이고 `aapb`는 같은 프로그램의 축약 명령입니다. 스킬, 프로젝트 기록, 옵션, 권한도 같습니다. npm으로 한 번 설치하면 되며 실행 이름을 고른다고 스킬이 추가되는 것은 아닙니다.

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --help
aapb --help
```

가끔 사용할 때는 전체 이름 앞에 `npx`를 붙입니다. 소스를 직접 실행할 때는 설치 명령 대신 `node bin/aapb.mjs`를 사용합니다.

## 명령 문법과 프로젝트 선택

위치 인자는 프로젝트 경로처럼 명령 뒤에 순서대로 쓰는 값입니다. 옵션은 `--`로 시작합니다. `--local-only`는 붙이면 켜지는 플래그이고, `--path CURRENT.md`는 옵션 뒤에 값을 적는 형태입니다. 공백이 있는 값은 따옴표로 감쌉니다. 꺾쇠는 바꿔 넣을 자리표시자, 문법 설명의 대괄호는 생략 가능하다는 뜻이며 그대로 입력하지 않습니다.

**프로젝트 경로는 생략할 수 있습니다.** 생략하면 `.`을 쓴 것처럼 현재 터미널 폴더를 사용합니다. 상위 Git 루트를 자동으로 찾지는 않습니다. 먼저 폴더를 이동하거나, 경로를 직접 적거나, `--project`로 선택하세요.

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook bootstrap --local-only --dry-run` | 현재 폴더에 로컬 전용 플레이북을 만들 작업을 미리 봄 |
| `ai-agent-playbook bootstrap . --local-only --dry-run` | 현재 폴더를 명시한 같은 미리보기 |
| `ai-agent-playbook bootstrap "<project>" --local-only --dry-run` | 직접 고른 프로젝트의 로컬 전용 생성 미리보기 |
| `ai-agent-playbook bootstrap --project "<project>" --local-only --dry-run` | 프로젝트를 옵션으로 지정한 같은 미리보기 |

두 방식을 함께 쓰면 `--project`가 우선하지만, 혼동을 줄이려면 하나만 사용하세요. 프로젝트 상대 경로는 현재 터미널 폴더 기준입니다. 스킬 명령은 사용자 스킬 위치를 관리하므로 현재 프로젝트에서 실행한다고 그 프로젝트 안에 설치하지 않습니다.

## 공통 옵션과 결과

| 옵션 | 적용 대상 | 뜻 |
| --- | --- | --- |
| `--help` | CLI | 요청한 작업을 실행하지 않고 도움말 표시 |
| `--version` | CLI | 실제 실행 파일의 패키지 버전 표시 |
| `--json` | 결과를 반환하는 명령 | 경고, 총수, 커서 등을 구조화해서 출력 |
| `--project "<directory>"` | 프로젝트 명령 | 현재 폴더 대신 특정 프로젝트 선택 |
| `--dry-run` | 생성, 스킬 변경, 이전, Forge 변경 | 쓰기 없이 예정된 작업 확인 |
| `--apply` | 이전, 복구, Forge 변경 | 기본 미리보기인 작업을 실제 적용 |
| `--local-only` | Bootstrap | 새 기록을 Git 로컬 제외 목록에 추가. Git 필요 |

일반 bootstrap과 스킬 install/update/uninstall에는 `--apply`가 필요하지 않습니다. 이 명령은 `--dry-run`이 없으면 적용됩니다. `--apply`와 `--dry-run`을 함께 쓰면 미리보기가 우선합니다.

대부분의 명령은 JSON을 출력합니다. `records read`는 `--json`이 없으면 본문을 출력하므로 이어 읽기 필드가 필요한 스크립트에서는 JSON을 사용하세요. 종료 코드 `0`은 성공, `1`은 실패·충돌, `2`는 종료된 명령입니다. 성공해도 경고와 범위를 확인해야 합니다. 일부 안전한 작업을 적용한 뒤 충돌을 보고할 수도 있습니다.

## 프로젝트 기록 만들기: bootstrap

대상 폴더에서 실행하거나 `bootstrap` 뒤에 프로젝트 경로를 넣습니다.

| 명령 전체 | 동작 | 쓰기 여부 |
| --- | --- | --- |
| `ai-agent-playbook bootstrap --dry-run` | 새 플레이북에 만들 파일 세 개 확인 | 없음 |
| `ai-agent-playbook bootstrap` | 기록이 없으면 CURRENT.md, manifest.json, 소유권 표식 생성 | 기록이 없으면 씀 |
| `ai-agent-playbook bootstrap --local-only --dry-run` | 파일과 Git 로컬 제외 작업 미리보기 | 없음 |
| `ai-agent-playbook bootstrap --local-only` | 새 기록 생성과 Git 로컬 제외 항목 추가 | 기록이 없으면 씀 |
| `ai-agent-playbook bootstrap --local-only --json` | 같은 작업을 적용하고 구조화 결과 출력 | 기록이 없으면 씀 |
| `ai-agent-playbook bootstrap --preserve-agents --dry-run` | 호환용 표현. 1.0에서는 루트 지침을 항상 보존 | 없음 |

예를 들어 다음 순서로 사용합니다.

```sh
cd "<project>"
ai-agent-playbook bootstrap --local-only --dry-run
ai-agent-playbook bootstrap --local-only
ai-agent-playbook records read --path CURRENT.md
```

Git이 아닌 폴더이거나 기록을 커밋해서 공유하려면 `--local-only`를 뺍니다. AAPB가 커밋하지는 않습니다. 기존 AGENTS.md와 플레이북은 보존합니다. Bootstrap을 반복해도 기존 기록의 Git 추적 정책은 바뀌지 않습니다. [기존 저장소 적용](existing-repository-bootstrap.ko.md)을 참고하세요.

부트스트랩은 아키텍처를 선택하거나 소스 폴더를 생성하지 않습니다. 프로젝트 루트 지침과 아키텍처 결정은 별도로 조정해 작성합니다. [프로젝트 아키텍처](project-architecture.ko.md)를 참고하세요.

## 기록 상태와 검증

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook records status --json` | 현재 폴더의 기록 구조, 시작 문서, 기록 수, 검사 요약 확인 |
| `ai-agent-playbook records status --view records --page-size 10 --json` | 기록 목록을 온전한 항목 최대 10개씩 조회 |
| `ai-agent-playbook records status --view warnings --page-size 10 --json` | 검사 경고를 페이지로 조회 |
| `ai-agent-playbook records status --view records --cursor "<cursor>" --json` | `page.nextCursor`를 사용해 같은 목록 이어 보기 |
| `ai-agent-playbook records validate --json` | 기록 JSON·링크·관리 파일을 검사하고 첫 문제 페이지 반환 |
| `ai-agent-playbook records validate --view summary --json` | 상세 문제 페이지 없이 검증 총수 확인 |
| `ai-agent-playbook records validate --view issues --page-size 5 --json` | 문제 항목 최대 다섯 개씩 조회 |
| `ai-agent-playbook records validate --view warnings --json` | 건너뛰거나 읽지 못한 범위 등의 경고 확인 |
| `ai-agent-playbook records validate --view issues --cursor "<cursor>" --json` | 전체 실패 상태와 총수를 유지하며 문제 이어 보기 |

모두 읽기 전용입니다. 애플리케이션 테스트나 과거 문장의 사실 여부를 검증하지 않습니다. `runtimeVerified: false`는 정상입니다. `managed-modified`는 유용한 사용자 수정일 수 있으므로 결과를 깨끗하게 만들려고 덮어쓰지 말고 내용을 확인하세요.

## 기록 읽기와 검색

읽기·검색은 선택한 플레이북 안을 대상으로 합니다. `--path CURRENT.md`는 그 안의 CURRENT.md이며 저장소 루트 README나 임의의 소스 파일을 뜻하지 않습니다.

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook records read` | 현재 플레이북의 CURRENT.md를 기본 본문 크기로 출력 |
| `ai-agent-playbook records read --path decisions/api.md --json` | 실제 존재하는 기록을 원본·이어 읽기 정보와 함께 읽기 |
| `ai-agent-playbook records read --path CURRENT.md --start-line 10 --end-line 30 --json` | 10번째 줄부터 30번째 줄까지 포함해 읽기 |
| `ai-agent-playbook records read --path CURRENT.md --max-chars 2000 --json` | 요청한 본문 크기까지 읽기 |
| `ai-agent-playbook records read --path CURRENT.md --cursor "<cursor>" --json` | 반환된 `nextCursor`로 이어 읽기. 줄 옵션은 제외 |
| `ai-agent-playbook records search --query "API decision" --json` | 기록에서 대소문자를 구분하지 않고 일반 문자열 검색 |
| `ai-agent-playbook records search --query "API decision" --max-results 5 --max-chars 3000 --json` | 본문 크기 안에서 최대 다섯 개의 온전한 검색 항목 반환 |
| `ai-agent-playbook records search --query "API decision" --cursor "<cursor>" --json` | 같은 검색어와 `page.nextCursor`로 이어 보기 |
| `ai-agent-playbook records search --query "API decision" --view warnings --json` | 해당 검색의 경고 확인 |

| 옵션 | 기본값·한도 | 용도 |
| --- | --- | --- |
| `--path` | 읽기 기본값 CURRENT.md | 실제 존재하는 플레이북 기준 텍스트 파일 |
| `--query` | 검색에 필수 | 정규식이 아닌 일반 문자열 |
| `--start-line`, `--end-line` | 선택 사항. 줄 번호는 1부터 | 처음 읽을 때 포함할 줄 범위 |
| `--max-chars` | 기본 12,000, 최대 100,000 | UTF-16 단위의 본문 크기. 앱 토큰 수가 아님 |
| `--page-size` | 기본 20, 최대 100 | 상태·검증 목록의 항목 수 |
| `--max-results` | 기본 20, 최대 100 | 검색 페이지의 항목 수 |
| `--cursor` | 결과에서 받은 값 | 값을 고치지 않고 다음 부분 요청 |
| `--view` | 작업별 기본값이 다름 | 요약, 상세 항목, 경고 중 선택 |

본문 크기는 읽기·검색과 상세 목록에 적용합니다. 요약 정보는 잘라 읽는 문서 본문이 아닙니다. 원본이 바뀌면 기존 커서를 쓰지 말고 조회를 다시 시작하세요. 원문 재조립과 MCP 결과 전체의 별도 256 KiB 상한은 [응답 크기 안내](record-responses.ko.md)에 있습니다.

## 스킬 설치와 관리

현재 프로젝트와 무관하게 사용자 스킬 디렉터리를 대상으로 합니다.

| 명령 전체 | 뜻 | 쓰기 여부 |
| --- | --- | --- |
| `ai-agent-playbook skills list --json` | 소스의 프로필과 스킬 이름 확인 | 없음 |
| `ai-agent-playbook skills lint --json` | 소스 스킬 목록의 형식 검사 | 없음 |
| `ai-agent-playbook skills install --dry-run --json` | 기본 core 스킬 두 개의 설치 미리보기 | 없음 |
| `ai-agent-playbook skills install --profile development --dry-run --json` | 개발 스킬 다섯 개의 설치 미리보기 | 없음 |
| `ai-agent-playbook skills install --profile development --json` | 선택한 개발 스킬 설치 | 있음 |
| `ai-agent-playbook skills check --profile development --json` | 선택한 설치본과 원본 비교 | 없음 |
| `ai-agent-playbook skills update --profile development --dry-run --json` | 선택한 설치본의 갱신 내용 확인 | 없음 |
| `ai-agent-playbook skills update --profile development --json` | 안전한 갱신 적용, 충돌 보존 | 있음 |
| `ai-agent-playbook skills uninstall --profile development --dry-run --json` | 선택한 관리 설치본 삭제 미리보기 | 없음 |
| `ai-agent-playbook skills uninstall --profile development --json` | 안전한 선택 항목 삭제, 복구 자료 보관 | 있음 |
| `ai-agent-playbook skills install --profile legacy --dry-run --json` | legacy-contracts 하나만 설치 미리보기 | 없음 |
| `ai-agent-playbook skills install --skill project-memory --skill legacy-contracts --dry-run --json` | 프로필 대신 지정한 두 스킬만 설치 미리보기 | 없음 |

`--profile`은 `core`, `development`, `legacy`를 받습니다. `--skill`을 반복하거나 쉼표로 이름을 나누면 직접 선택할 수 있으며 빈 이름은 거부합니다. 일반 갱신이 다른 스킬이나 구버전 중복 설치를 자동으로 지우지는 않습니다. 프로필은 기능 선택이며 라이트·헤비 런타임 모드가 아닙니다.

경로를 직접 정하는 예시입니다.

```sh
ai-agent-playbook skills install --profile development --agents-root "<skills-directory>" --codex-root "<legacy-directory>" --backup-root "<backup-directory>" --dry-run --json
```

`--agents-root`는 설치 대상, `--codex-root`는 구버전 위치, `--backup-root`는 백업의 상위 폴더입니다. 백업은 두 설치 폴더 밖이면서 실제 변경할 설치본과 같은 파일시스템에 둡니다. 수정본·미관리·연결된 디렉터리는 보존하며 강제 교체는 지원하지 않습니다. 앱을 새로 불러와 설치 파일과 실제 발견 상태를 따로 확인하세요.

## 이전과 복구

| 명령 전체 | 뜻 | 쓰기 여부 |
| --- | --- | --- |
| `ai-agent-playbook skills migrate --profile development --json` | 소유권이 확인된 0.5 복사본 정리 미리보기 | 없음 |
| `ai-agent-playbook skills migrate --profile development --apply --json` | 독립적으로 안전한 이전 항목 적용 | 있음 |
| `ai-agent-playbook skills rollback --backup "<transaction-directory>" --json` | 스킬 작업 하나의 복원 미리보기 | 없음 |
| `ai-agent-playbook skills rollback --backup "<transaction-directory>" --apply --json` | 이후 바뀌지 않은 스킬 항목 복원 | 있음 |
| `ai-agent-playbook migrate layout --to minimal --json` | 현재 프로젝트의 관리 정보 이전 미리보기 | 없음 |
| `ai-agent-playbook migrate layout --to minimal --apply --json` | 호환되는 관리 정보만 바꾸고 기록 보존 | 있음 |
| `ai-agent-playbook migrate rollback --backup "<returned-relative-backup>" --json` | 기록 관리 정보의 복원 미리보기 | 없음 |
| `ai-agent-playbook migrate rollback --backup "<returned-relative-backup>" --apply --json` | 해시 검사를 통과하면 관리 정보 복원 | 있음 |

실제로 반환된 백업 값을 사용하세요. 스킬 복구는 작업별 디렉터리, 기록 복구는 플레이북 기준 상대 경로의 JSON 백업 파일을 받습니다. 소유권이 없거나 관리 정보가 수정되면 이전은 거부되어도 읽기는 계속 가능합니다. 일부 적용 결과를 확인하고 최신 작업부터 복구합니다. 사전 검사와 보존은 [설치 안내](lifecycle.ko.md)에 있습니다.

## 선택형 문서·UI 점검

여기의 `--path`, `--root`, `--before`, `--after`는 기록 읽기와 달리 프로젝트 기준입니다.

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook writing naturalness-check --path README.md --lang ko --engine js --json` | 현재 프로젝트 README의 한국어 문장을 JavaScript로 점검 |
| `ai-agent-playbook writing naturalness-report --root docs --lang auto --max-files 10 --engine auto --json` | docs 안의 최대 10개 파일에서 언어를 감지하고 선택형 Python도 요청 |
| `ai-agent-playbook writing fidelity-check --before docs/before.md --after docs/after.md --lang auto --json` | 실제 수정 전·후 파일을 비교해 보호할 정보의 변경 후보 확인 |
| `ai-agent-playbook runtime python-status --json` | Python 후보와 실제 실행 가능한 엔진 확인 |
| `ai-agent-playbook qa ui-genericity-scan --root src --max-files 20 --json` | 최대 20개 소스에서 정적 UI 검토 후보 탐색. 화면 렌더링은 하지 않음 |

`--lang`은 `auto`, `ko`, `en`을 받습니다. 문서 기본 엔진은 `js`이며 `auto`, `python`은 Python 탐색을 요청합니다. Python을 사용할 수 없으면 JavaScript로 검사하고 엔진 경고를 표시합니다. `--max-files`와 `--root`로 범위를 제한합니다. 연결된 입력 경로와 적합하지 않은 텍스트는 거부합니다. 일반 문서 편집마다 실행할 필요는 없습니다. [품질 검토](quality-review.ko.md)에서 해석 방법을 설명합니다.

## 코드 구조 검색

| 전체 명령어 | 의미 | 쓰기 여부 |
| --- | --- | --- |
| `ai-agent-playbook ast search --lang javascript --pattern 'console.log($$$ARGS)' --path src --json` | src의 JavaScript 소스에서 실제 호출 검색 | 없음 |
| `ai-agent-playbook ast search --lang tsx --pattern 'useState($VALUE)' --max-results 10 --max-chars 4000 --max-files 200 --json` | 소스 탐색량과 결과 페이지 크기 제한 | 없음 |
| `ai-agent-playbook ast search --lang javascript --pattern 'console.log($$$ARGS)' --path src --cursor '<returned-token>' --json` | 같은 검색을 변경되지 않은 소스에서 이어 읽기 | 없음 |

PowerShell과 POSIX 셸에서는 작은따옴표가 패턴의 메타변수를 보호합니다. 필수 `--lang`은 해당 확장자를 선택합니다. `--path`는 프로젝트 상대 경로이며 생략하면 현재 프로젝트를 검색합니다. `--max-files`는 파싱할 파일 수, `--max-results`는 페이지당 결과 수, `--max-chars`는 페이지 내용 크기를 제한합니다. `scan.complete`, 경고 총수, 코드 조각 생략 여부와 `page.nextCursor`를 함께 확인하세요. AST 검색은 읽기 전용이므로 `--apply`, `--dry-run`을 거부합니다. 엔진 설치, 제외 경로, 지원 언어와 전체 제한은 [AST 검색](ast-search.ko.md)에 있습니다.

## 선택형 MCP

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook mcp --with-ast` | 시작할 때 읽기 전용 `aapb_ast_search`를 추가 |
| `ai-agent-playbook mcp` | 현재 폴더에 연결된 stdio 서버 시작 |
| `ai-agent-playbook mcp --project "<project>"` | 명시한 프로젝트의 서버 시작 |

앱이 이 프로세스를 시작해 `aapb_status`, `aapb_search`, `aapb_read`, `aapb_validate`를 호출합니다. 터미널에서 아무 반응이 없으면 클라이언트를 기다리는 상태일 수 있습니다. 설치가 MCP를 등록·활성화하지 않으며 서버에는 쓰기 도구가 없습니다. [MCP 설정](mcp-permission-model.ko.md)과 [에이전트의 스킬·도구 활용](agent-usage.ko.md)을 참고하세요.

## Forge 협업

| 명령 전체 | 뜻 | 원격 쓰기 |
| --- | --- | --- |
| `ai-agent-playbook forge status --json` | 로컬 원격·정책 확인. 인증 완료를 뜻하지 않음 | 없음 |
| `ai-agent-playbook forge status --remote origin --provider github --json` | Git 원격 이름과 제공 서비스 직접 선택 | 없음 |
| `ai-agent-playbook forge bootstrap --milestone "Example delivery" --json` | 라벨과 마일스톤 미리보기 | 없음 |
| `ai-agent-playbook forge bootstrap --project-title "Example delivery" --project-mode milestone --json` | 선택한 표시 방식 미리보기 | 없음 |
| `ai-agent-playbook forge bootstrap --milestone "Example delivery" --apply --json` | 검토한 초기 협업 항목 적용 | 있음 |
| `ai-agent-playbook forge sync --plan docs/coordination.json --json` | 실제 존재하는 프로젝트 기준 계획 미리보기 | 없음 |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --json` | 계획에서 허용된 작업 적용 | 있음 |
| `ai-agent-playbook forge reconcile --plan docs/coordination.json --json` | 표시 구조 조정 미리보기 | 없음 |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --offline --json` | offline이 우선하므로 원격 쓰기 거부 | 없음 |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --no-remote --json` | 원격 접근을 껐으므로 쓰기 거부 | 없음 |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --remote-read-only --json` | 적용을 요청했어도 읽기 전용이므로 쓰기 거부 | 없음 |
| `ai-agent-playbook forge sync --plan docs/coordination.json --profile observe --apply --json` | observe 정책에 따라 쓰기 거부 | 없음 |

여기의 `--profile`은 스킬 프로필과 다릅니다. CLI 기본값은 `coordinate`, `off`·`observe`는 쓰기 금지이며, 유지한 `deliver`·`release`는 추가 협업 항목을 허용하지만 실행이나 게시를 시작하지 않습니다. `--provider`는 `auto`, `github`, `gitea`, `--remote` 기본값은 `origin`입니다. `--project-mode`는 `milestone` 또는 제공 서비스의 `preferred` 표시 방식을 고릅니다. 지원 기능과 입력 계획을 결과의 식별자·상태와 함께 검토하세요. 인증, 동시 변경, 일부 실패는 [Forge 협업](forge-automation.ko.md)에 있습니다.

## 이전 버전 사용자

0.5.11은 이전 스킬 목록과 런타임을 유지합니다. 그 기능이 필요하면 버전을 명시해 사용하세요.

```sh
npx ai-agent-playbook@0.5.11 --help
```

0.5.11의 전역 실행 명령은 `aapb`이며 전체 이름의 설치 명령은 1.0에서 추가했습니다. 현재 제한된 별칭에는 기록 읽기의 `context`, 기록 검증의 `doctor`·`operator check`, 소스 스킬 점검의 `catalog list/check`가 있습니다. 실행·예약·광범위 분석·관리 쓰기 명령은 1.0에서 종료되어 코드 2를 반환하며 0.5.11을 자동 실행하지 않습니다. [1.0 변경사항과 이전 버전 사용](redesign.ko.md)을 참고하세요.
