# 명령어 가이드

기본 명령은 `ai-agent-playbook`이고 `aapb`는 같은 프로그램의 축약 명령입니다. 스킬, 프로젝트 기록, 옵션, 권한도 같습니다. npm으로 한 번 설치하면 되며 실행 이름을 고른다고 스킬이 추가되는 것은 아닙니다.

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --help
aapb --help
```

가끔 사용할 때는 `npx`로 게시된 버전을 선택합니다. 소스를 직접 실행할 때는 설치 명령 대신 `node bin/aapb.mjs`를 사용합니다. 작업 공간과 기록 작성 예시에는 갱신된 CLI가 필요하므로 `--version`을 확인하세요. 아직 게시하지 않은 후보는 [로컬 압축 파일](demo.ko.md)로 사용합니다. `@latest`는 이 체크아웃이 아닌 게시된 패키지를 선택합니다.

## 명령 문법과 프로젝트 선택

위치 인자는 프로젝트 경로처럼 명령 뒤에 순서대로 쓰는 값입니다. 옵션은 `--`로 시작합니다. `--local-only`는 붙이면 켜지는 플래그이고, `--path CURRENT.md`는 옵션 뒤에 값을 적는 형태입니다. 공백이 있는 값은 따옴표로 감쌉니다. 꺾쇠는 바꿔 넣을 자리표시자, 문법 설명의 대괄호는 생략 가능하다는 뜻이며 그대로 입력하지 않습니다.

**프로젝트 경로는 생략할 수 있습니다.** 생략하면 `.`을 쓴 것처럼 현재 터미널 폴더를 사용합니다. 등록된 구성원에서는 상위 작업 공간과 공통 기록을 찾을 수 있습니다. 그 밖에는 선택한 폴더에서 플레이북을 찾습니다. Git 제외 여부는 이 폴더를 실제로 포함하는 Git worktree를 따로 확인하며, 기록 위치를 Git 루트로 옮기지는 않습니다. 먼저 폴더를 이동하거나, 경로를 직접 적거나, `--project`로 선택하세요.

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
| `--dry-run` | 부트스트랩, 기록 생성, 작업 공간·스킬 변경, 이전, Forge 변경 | 쓰기 없이 예정된 작업 확인 |
| `--apply` | 작업 공간 변경, 이전, 복구, Forge 변경 | 기본 미리보기인 작업을 실제 적용 |
| `--local-only` | Bootstrap | `--exclude local`의 호환 별칭. Git이 없어도 기록을 만들고 제외를 적용하지 못했음을 표시 |

일반 bootstrap, worklog·knowledge 생성과 스킬 install/update/uninstall에는 `--apply`가 필요하지 않습니다. 이 명령은 `--dry-run`이 없으면 적용됩니다. `--apply`와 `--dry-run`을 함께 쓰면 미리보기가 우선합니다.

대부분의 명령은 JSON을 출력합니다. 대화형 bootstrap은 선택한 언어로 읽기 쉬운 결과를 보여줍니다. 기록 위치, 작업 파일, 복구용 백업과 참고 사항이 있으면 표시하고 다음 행동을 안내합니다. 취소와 미리보기에서는 파일을 변경하지 않았다고 알립니다. 인자형·비대화형 출력은 기존 동작을 유지하며, `--json`은 스크립트용 구조화 결과를 반환하고 안내를 열지 않습니다. `records read`는 `--json`이 없으면 본문을 출력하므로 이어 읽기 필드가 필요한 스크립트에서는 JSON을 사용하세요. 종료 코드 `0`은 성공, `1`은 실패·충돌, `2`는 종료된 명령입니다. 성공해도 경고와 범위를 확인해야 합니다. 일부 안전한 작업을 적용한 뒤 충돌을 보고할 수도 있습니다.

## 프로젝트 기록 만들기: bootstrap

대상 폴더에서 실행하거나 `bootstrap` 뒤에 프로젝트 경로를 넣습니다. 대화형 안내와 인자형 실행은 같은 미리보기·보존 규칙을 사용합니다.

| 실행 방식 | 선택과 질문 |
| --- | --- |
| 별도 선택 없이 대화형 터미널에서 `ai-agent-playbook bootstrap` 실행 | 설치 안내를 엽니다. 최종 적용을 포함해 모든 단일 선택 메뉴에서 직접 선택해야 합니다. |
| `ai-agent-playbook bootstrap --interactive` | 선택과 최종 검토를 명시적으로 요청합니다. 사용할 수 있는 대화형 입출력이 필요합니다. |
| `ai-agent-playbook bootstrap --yes` | 질문 없이 기존 기본값인 `single`, `standard`, Git이 있으면 `local`·없으면 `none`, `en`, `preserve`를 사용합니다. 저장된 설정이 기본값보다 우선하고, 명시한 선택이 가장 우선합니다. |
| 설정을 인자로 지정하거나 비대화형 입력 사용 | 기존 기본값인 `single`, `minimal`, `none`, `en`, `preserve`를 유지합니다. |
| `--json` | 질문하지 않습니다. `--interactive --json`은 거부하고 `--yes --json`은 질문 없이 기본값을 사용합니다. |

프로젝트 경로, `--dry-run`, `--apply`만 지정한 것은 안내를 끄는 설정 선택이 아닙니다. 질문 없는 미리보기가 필요하면 설정이나 `--json`을 명시하세요. 안내는 권장 항목과 현재 저장된 설정을 따로 표시합니다. 권장 항목은 `standard`, `preserve`, Git이 있으면 `local`·Git 밖이면 `none`입니다. 단일 선택 메뉴는 포커스 없이 시작하므로 Enter만 눌러 권장 항목이나 저장된 설정을 선택할 수 없습니다. 저장소 체크박스는 이전에 직접 고른 선택만 복원하며 발견한 후보를 자동으로 선택하지 않습니다.

새 설치의 폴더 준비 단계에서는 대상과 기록을 둘 위치를 보여줍니다. 한 프로젝트는 프로젝트 폴더에서, 작업 공간은 준비된 상위 폴더에서 시작하세요. 하위 저장소는 직접 배치하거나 clone한 뒤 준비 완료를 선택합니다. AAPB는 최종 적용 후 없는 `.ai-agent-playbook/`을 만들며 저장소를 생성·이동·clone하지 않습니다. 빈 작업 공간은 별도로 확인한 뒤 만들고 나중에 `workspace add`로 구성원을 추가할 수 있습니다.

취소와 키 도움말은 목록 위에 표시합니다. 한 화면에는 최대 열 개의 항목을 보여주고 작은 터미널에서는 개수를 줄입니다. 다중 선택에서는 선택 개수도 표시합니다. 비활성 항목은 검색 결과에서도 목록에 남으며 사용할 수 없는 이유를 보여줍니다.

| 키 | 동작 |
| --- | --- |
| 방향키 또는 번호 입력 후 Enter | 단일 항목을 직접 선택 |
| Space, 이후 Enter | 포커스한 저장소 체크박스를 선택·해제. Enter는 체크한 항목만 확정 |
| `/` | 표시 이름 검색. Enter는 필터를 유지하고, 검색 입력 중 Esc는 검색을 해제하고 나옵니다. 검색해도 체크한 항목은 유지 |
| `a` | 현재 페이지에 표시된 선택 가능 항목만 전체 선택·해제 |
| `r` | 폴더를 추가로 준비한 뒤 저장소 후보 재탐색. 검색 입력 밖에서 사용 |
| Esc 또는 `b` | 가능한 경우 이전 단계로 이동. 검색 입력 밖에서 사용 |
| `q` 또는 Ctrl+C | 취소. 입력이 닫혀도 쓰기 없이 취소 |

키를 즉시 처리할 수 없는 터미널에서는 줄 단위로 번호, `1,3-5` 같은 여러 번호·범위, 이름 별칭을 입력할 수 있습니다. 저장소 이름이나 따옴표를 입력할 필요는 없습니다. `n`/`p`로 페이지를 이동하고 `/검색어`로 필터링합니다. 잘못 입력하면 다시 묻고 빈 입력으로 단일 선택의 기본값을 확정하지 않습니다. 최종 검토의 설정 수정하기에서 항목을 다시 고른 뒤 결과를 확인하고 적용하세요. 취소와 `--dry-run`은 파일을 쓰지 않습니다.

| 옵션 | 값과 효과 |
| --- | --- |
| `--kind` | `single` 또는 `workspace`. 작업 공간은 명시적인 구성원 등록을 사용합니다. |
| `--exclude` | `local`, `shared`, `global`, `none`. 제외 규칙을 둘 위치를 선택합니다. |
| `--records` | `minimal`은 CURRENT.md와 메타데이터, `standard`는 없는 작업 일지·지식 안내도 추가합니다. |
| `--agents` | `preserve`는 루트 지침을 그대로 두고, `link`는 짧은 기록 링크를 추가하며 파일이 없으면 만듭니다. |
| `--lang` | 새 문서와 안내의 언어인 `en` 또는 `ko` |
| `--repo-path` | 작업 공간 기준 구성원 경로를 반복합니다. 폴더 이름에서 ID를 만듭니다. `--repo`가 아닙니다. |
| `--preserve-agents` | `--agents preserve`의 호환 별칭. `--agents link`와 충돌합니다. |
| `--local-only` | `--exclude local`의 호환 별칭. 다른 제외 방식을 명시하면 충돌합니다. |

```sh
ai-agent-playbook bootstrap --kind single --records standard --exclude local --agents link --lang ko --dry-run --json
ai-agent-playbook bootstrap --kind single --records standard --exclude local --agents link --lang ko --json
ai-agent-playbook records read --path CURRENT.md
```

`local`과 `--local-only`는 Git의 `info/exclude`를 사용합니다. 메뉴 이름은 이 컴퓨터에서 제외 (info/exclude)이며 비활성 상태에서도 같은 이름을 보여줍니다. 사용할 수 있는지는 설정 루트를 실제로 포함하는 Git 저장소로 판단하며, 그 폴더 안에 `.git` 디렉터리가 있는지만 확인하지 않습니다. 저장소 안의 하위 프로젝트 폴더와 연결된 worktree도 지원하며 worktree끼리 제외 파일을 공유할 수 있습니다. Git 밖에서는 로컬 제외 항목을 비활성 상태로 남기고 이유를 표시합니다. 인자로 `--exclude local`이나 `--local-only`를 명시한 경우에는 기존처럼 제외를 건너뛰고 경고하며 기록 생성을 허용합니다. Git 저장소를 초기화하지 않습니다.

`shared`는 공유할 `.gitignore` 규칙을 사용하고, `global`은 사용자 Git 제외 파일을 쓰는 저장소들에 영향을 줍니다. `none`은 규칙을 추가하지 않으며 이 대상의 수정되지 않은 AAPB 관리 규칙을 제거할 수 있습니다. 하위 저장소 밖에 둔 공통 기록은 그 저장소들에 제외 규칙을 추가할 필요가 없습니다.

기존 기록과 사용자 지침은 보존합니다. 다시 실행하면 없는 표준 안내나 명시적으로 선택한 링크를 추가하고 관리 중인 제외 규칙을 바꿀 수 있지만 문서를 재생성하거나 구성원 등록을 교체하지 않습니다. 수정되지 않은 AAPB 관리 제외 규칙만 이전하고 사용자 규칙, 추적 중인 파일과 Git 이력은 유지합니다. 반환된 복구 기록을 보관하세요. [기존 저장소](existing-repository-bootstrap.ko.md), [설치·복구](lifecycle.ko.md), [프로젝트 아키텍처](project-architecture.ko.md)를 참고하세요.

## 작업 공간 관리하기

```sh
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --dry-run --json
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --json
ai-agent-playbook workspace list --json
ai-agent-playbook workspace check --json
ai-agent-playbook workspace add --id worker --path services/worker --role background --json
ai-agent-playbook workspace add --id worker --path services/worker --role background --apply --json
ai-agent-playbook workspace remove --id worker --json
ai-agent-playbook workspace remove --id worker --apply --json
```

미리보기에서 `--dry-run`을 빼고 다시 실행하면 작업 공간을 만듭니다. 구성원 폴더는 이미 존재해야 합니다. `list`·`check`는 등록과 사용 가능 여부를 읽습니다. `add`·`remove`는 적용을 요청하지 않으면 미리보기이며 변경 시 이전 등록 정보의 백업을 반환합니다. 등록을 제거해도 코드와 기록은 보존합니다. 구성원, 상위 탐색, 기존 로컬 기록과 코드 대상은 [작업 공간 안내](workspaces.ko.md)에서 설명합니다.

## 오래 유지할 기록 만들기

```sh
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang ko --date 2026-09-01 --dry-run --json
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang ko --date 2026-09-01 --json
ai-agent-playbook worklog list --topic csv-export --month 2026-09 --page-size 5 --json
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang ko --dry-run --json
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang ko --json
```

생성은 `--dry-run`이 없으면 파일을 쓰며 목록은 읽기 전용입니다. 생성에는 `--title`이 필요합니다. `--topic`은 일지의 주제와 지식 파일명을 정하며 지식의 기본 주제는 제목입니다. `--lang en|ko`는 선택한 manifest 언어보다 우선합니다. `--date YYYY-MM-DD`는 일지 생성에, `--month YYYY-MM`은 목록 필터에 사용합니다. `--repo <id>`로 등록된 구성원을 표시하거나 필터링합니다. 이 명령들의 `--record-source workspace|repo:<id>`는 공통 기록 또는 구성원의 기존 로컬 기록을 선택합니다.

`worklog list`와 `records search --month`는 같은 월 판정 규칙을 사용합니다. 파일명 앞의 유효한 날짜, 상위 `YYYY-MM` 폴더, 메타데이터 `createdAt` 순으로 판단합니다. 파일명과 폴더에 날짜가 없는 과거 기록도 메타데이터의 월로 찾을 수 있습니다. 다른 월의 파일명과 폴더는 읽기 전에 제외하며 탐색·바이트·결과 한도는 그대로 적용합니다. 기록 날짜 예시는 [오래 유지할 기록](durable-records.ko.md)에서 설명합니다.

`worklog list`는 `--page-size`, `--max-chars`, `--cursor`를 지원합니다. 생성 결과에는 실제 `path`, 템플릿 `content`, 메타데이터와 쓰기 상태가 있습니다. 생성 자체는 사실을 추론하거나 명령을 실행하지 않으므로 실제 근거로 채우세요. 고유한 일지 이름으로 동시 작성을 지원하며 기존 지식 주제는 덮어쓰지 않습니다. 월별 보관, 기존 위치, 초안 검토와 이어 읽기는 [오래 유지할 기록](durable-records.ko.md)에서 설명합니다.

## 기록 상태와 검증

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook records status --json` | 현재 폴더의 기록 구조, 시작 문서, 기록 수, 검사 요약 확인 |
| `ai-agent-playbook records status --view records --page-size 10 --json` | 기록 목록을 온전한 항목 최대 10개씩 조회 |
| `ai-agent-playbook records status --view repositories --page-size 10 --json` | 등록된 작업 공간 구성원을 페이지로 조회 |
| `ai-agent-playbook records status --view warnings --page-size 10 --json` | 검사 경고를 페이지로 조회 |
| `ai-agent-playbook records status --view records --cursor "<cursor>" --json` | `page.nextCursor`를 사용해 같은 목록 이어 보기 |
| `ai-agent-playbook records validate --json` | 기록 JSON·링크·관리 파일을 검사하고 첫 문제 페이지 반환 |
| `ai-agent-playbook records validate --view summary --json` | 상세 문제 페이지 없이 검증 총수 확인 |
| `ai-agent-playbook records validate --view issues --page-size 5 --json` | 문제 항목 최대 다섯 개씩 조회 |
| `ai-agent-playbook records validate --view warnings --json` | 건너뛰거나 읽지 못한 범위 등의 경고 확인 |
| `ai-agent-playbook records validate --view issues --cursor "<cursor>" --json` | 전체 실패 상태와 총수를 유지하며 문제 이어 보기 |

모두 읽기 전용입니다. 애플리케이션 테스트나 과거 문장의 사실 여부를 검증하지 않습니다. `runtimeVerified: false`는 정상입니다. `managed-modified`는 유용한 사용자 수정일 수 있으므로 결과를 깨끗하게 만들려고 덮어쓰지 말고 내용을 확인하세요.

## 기록 읽기와 검색

`--record-source workspace`는 기본 공통 기록을, `--record-source repo:<id>`는 등록된 구성원의 기존 로컬 기록을 선택합니다. 상태, 읽기, 검색과 검증에 같은 옵션을 사용합니다. 읽기·검색은 선택한 플레이북 안을 대상으로 합니다. `--path CURRENT.md`는 그 안의 CURRENT.md이며 저장소 루트 README나 임의의 소스 파일을 뜻하지 않습니다.

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
| `--path` | 읽기 기본값 CURRENT.md, 검색 기본값은 필터 없음 | 플레이북 기준 파일 읽기 또는 파일·폴더 접두 경로로 검색 제한 |
| `--repo` | 선택적 검색 필터 | 메타데이터, `repos/<id>/` 또는 선택한 구성원 로컬 출처로 등록 구성원 필터링. 출처 자체를 바꾸지 않음 |
| `--month` | 선택적 검색 필터 | `YYYY-MM` 형식의 작업 일지 월 |
| `--kind` | 선택적 검색 필터 | `current`, `knowledge`, `worklog`, `other` |
| `--record-source` | `workspace` | 공통 기록 또는 `repo:<id>`로 구성원의 기존 로컬 기록 선택 |
| `--query` | 검색에 필수 | 정규식이 아닌 일반 문자열 |
| `--start-line`, `--end-line` | 선택 사항. 줄 번호는 1부터 | 처음 읽을 때 포함할 줄 범위 |
| `--max-chars` | 기본 12,000, 최대 100,000 | UTF-16 단위의 본문 크기. 앱 토큰 수가 아님 |
| `--page-size` | 기본 20, 최대 100 | 상태·검증 목록의 항목 수 |
| `--max-results` | 기본 20, 최대 100 | 검색 페이지의 항목 수 |
| `--cursor` | 결과에서 받은 값 | 값을 고치지 않고 다음 부분 요청 |
| `--view` | 작업별 기본값이 다름 | 요약, 상세 항목, 경고 중 선택 |

본문 크기는 읽기·검색과 상세 목록에 적용합니다. 요약 정보는 잘라 읽는 문서 본문이 아닙니다. 이어 볼 때 출처와 필터를 반복합니다. 원본이나 범위가 바뀌면 기존 커서를 쓰지 말고 조회를 다시 시작하세요. 원문 재조립과 MCP 결과 전체의 별도 256 KiB 상한은 [응답 크기 안내](record-responses.ko.md)에 있습니다.

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
| `ai-agent-playbook migrate bootstrap-rollback --backup "<returned-journal>" --json` | 부트스트랩·제외 변경 복구 미리보기 | 없음 |
| `ai-agent-playbook migrate bootstrap-rollback --backup "<returned-journal>" --apply --json` | 반환된 복구 기록으로 이후 편집되지 않은 대상 복원 | 있음 |

실제로 반환된 백업 값을 사용하세요. 스킬 복구는 작업별 디렉터리, 기록 복구는 플레이북 기준 상대 경로의 JSON 백업 파일을 받습니다. 소유권이 없거나 관리 정보가 수정되면 이전은 거부되어도 읽기는 계속 가능합니다. 일부 적용 결과를 확인하고 최신 작업부터 복구합니다. 사전 검사와 보존은 [설치 안내](lifecycle.ko.md)에 있습니다.

세 기록 이전·복구 명령 모두 `--record-source workspace|repo:<id>`를 받습니다. 구성원의 기존 로컬 기록만 변경하려면 미리보기, 적용과 복구에서 같은 출처를 유지하세요.

```sh
ai-agent-playbook migrate layout --record-source repo:web --to minimal --json
ai-agent-playbook migrate rollback --record-source repo:web --backup "<returned-relative-backup>" --json
ai-agent-playbook migrate bootstrap-rollback --record-source repo:web --backup "<returned-journal>" --json
```

각각 별개의 미리보기 예시입니다. 해당 작업이 반환한 백업을 사용하고 검토한 작업에만 `--apply`를 추가합니다. 구성원 로컬 출처를 선택하면 공통 기록은 그 변경 대상에 포함되지 않습니다.

부트스트랩 복구에는 해당 작업이 반환한 journal 경로를 사용합니다. 작업 공간 등록 정보 백업은 부트스트랩 복구 기록이 아니므로 혼용하지 않습니다.

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

PowerShell과 POSIX 셸에서는 작은따옴표가 패턴의 메타변수를 보호합니다. 필수 `--lang`은 해당 확장자를 선택합니다. 작업 공간 루트에서는 `--repo <id>`로 코드 저장소를 선택하며 등록된 구성원 안에서는 그 구성원이 기본값입니다. `--path`는 선택한 코드 저장소 기준이며 생략하면 해당 저장소를 검색합니다. `--max-files`는 파싱할 파일 수, `--max-results`는 페이지당 결과 수, `--max-chars`는 페이지 내용 크기를 제한합니다. `scan.complete`, 경고 총수, 코드 조각 생략 여부와 `page.nextCursor`를 함께 확인하세요. AST 검색은 읽기 전용이므로 `--apply`, `--dry-run`을 거부합니다. 엔진 설치, 제외 경로, 지원 언어와 전체 제한은 [AST 검색](ast-search.ko.md)에 있습니다.

## 선택형 MCP

| 명령 전체 | 뜻 |
| --- | --- |
| `ai-agent-playbook mcp --with-ast` | 시작할 때 읽기 전용 `aapb_ast_search`를 추가 |
| `ai-agent-playbook mcp` | 현재 폴더에 연결된 stdio 서버 시작 |
| `ai-agent-playbook mcp --project "<project>"` | 명시한 프로젝트의 서버 시작 |

앱이 이 프로세스를 시작해 `aapb_status`, `aapb_search`, `aapb_read`, `aapb_validate`를 호출합니다. 터미널에서 아무 반응이 없으면 클라이언트를 기다리는 상태일 수 있습니다. 설치가 MCP를 등록·활성화하지 않으며 서버에는 쓰기 도구가 없습니다. [MCP 설정](mcp-permission-model.ko.md)과 [에이전트의 스킬·도구 활용](agent-usage.ko.md)을 참고하세요.

## Forge 협업

작업 공간 루트에서 모든 Forge 명령에 `--repo <id>`를 추가합니다. 등록된 구성원 안에서는 그 구성원이 기본값입니다. 원격 탐색과 `--plan` 경로는 선택한 저장소에 속하며 공통 기록이 일괄 원격 쓰기를 허용하지 않습니다.

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

`worklog new/list`는 현재 지원하는 기록 생성·목록 명령입니다. 그 밖의 구버전 worklog·런타임 형식은 계속 종료 안내를 반환합니다.

0.5.11은 이전 스킬 목록과 런타임을 유지합니다. 그 기능이 필요하면 버전을 명시해 사용하세요.

```sh
npx ai-agent-playbook@0.5.11 --help
```

0.5.11의 전역 실행 명령은 `aapb`이며 전체 이름의 설치 명령은 1.0에서 추가했습니다. 현재 제한된 별칭에는 기록 읽기의 `context`, 기록 검증의 `doctor`·`operator check`, 소스 스킬 점검의 `catalog list/check`가 있습니다. 실행·예약·광범위 분석·관리 쓰기 명령은 1.0에서 종료되어 코드 2를 반환하며 0.5.11을 자동 실행하지 않습니다. [1.0 변경사항과 이전 버전 사용](redesign.ko.md)을 참고하세요.
