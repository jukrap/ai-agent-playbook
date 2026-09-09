# 여러 저장소에서 공통 기록 사용하기

작업 공간은 명시적으로 등록한 구성원 폴더의 상위에 공통 프로젝트 기록을 둡니다. 웹, 서비스, Android와 iOS 저장소를 함께 등록해도 코드나 기존 기록을 옮기지 않습니다. 작업 공간 폴더 자체에는 Git이 없어도 됩니다.

## 구성원 선택하기

기존 프로젝트 폴더가 다음처럼 구성되어 있다고 가정합니다.

```text
product/
  apps/web/
  services/api/
  mobile/android/
  notes/
```

대화형 터미널의 `product/`에서 `ai-agent-playbook bootstrap`을 실행하고 여러 저장소를 선택합니다. 새 작업 공간의 폴더 준비 단계에서는 상위 폴더와 공통 기록을 둘 위치를 보여줍니다. 필요하면 다른 터미널이나 탐색기에서 하위 저장소를 직접 배치하거나 clone한 뒤 준비 완료를 선택하세요. 최종 적용 후 AAPB가 `product/.ai-agent-playbook/`을 만드므로 기록 폴더를 직접 생성할 필요는 없습니다. AAPB는 저장소를 옮기거나 clone하지 않습니다.

안내는 제한된 범위에서 저장소 후보를 찾고 경로를 체크박스 이름으로 보여줍니다. 번호나 방향키로 이동하고 Space로 선택·해제한 뒤 Enter로 체크한 항목을 확정하세요. 저장소 이름, ID나 따옴표를 입력할 필요는 없습니다. `/`로 검색해도 필터에 가려진 선택은 유지합니다. `a`는 현재 페이지의 선택 가능 항목만 전체 선택·해제하고, 폴더를 더 준비한 뒤 검색 입력 밖에서 `r`을 누르면 다시 탐색합니다. 한 화면에 최대 열 개의 항목과 선택 개수를 보여주며 비활성 항목의 이유도 남깁니다. 줄 단위 입력에서는 번호, `1,3-5` 같은 범위나 선택적인 이름 별칭을 사용합니다. 전체 조작법은 [명령어 가이드](commands.ko.md)를 참고하세요.

발견한 후보를 자동으로 선택하거나 모든 하위 폴더를 등록하지 않으며, 드라이브 전체를 조사하거나 링크와 junction을 따라가지 않습니다. 선택 화면을 다시 열면 이전에 직접 고른 선택만 복원합니다. 선택한 저장소가 없으면 빈 작업 공간으로 시작할지 확인하거나 폴더를 준비한 뒤 다시 탐색합니다. Git이 없는 구성원은 인자형 실행에서 경로를 명시해 선택할 수 있습니다. `q`와 키 도움말은 목록 위에 있으며 검색 입력 밖에서는 가능한 경우 Esc나 `b`로 이전 단계로 돌아갑니다. 최종 검토에서 설정을 수정한 뒤 적용할 수 있습니다.

같은 설정을 반복해서 사용할 때는 기존 구성원 폴더의 상대 경로로 먼저 미리 봅니다.

```sh
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --lang ko --dry-run --json
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --lang ko --json
ai-agent-playbook workspace list --json
ai-agent-playbook workspace check --json
```

선택할 폴더마다 `--repo-path`를 반복합니다. 부트스트랩은 폴더 이름에서 ID를 만들고 등록 결과를 표시합니다. 이 예시의 ID는 `web`과 `api`입니다. 이름이 겹치면 추측하지 말고 결과에서 ID를 확인하세요. 부트스트랩의 구성원 선택에는 `--repo`를 사용하지 않습니다. `--agents link`는 기존 지침을 보존하면서 짧은 기록 링크를 추가합니다. AGENTS.md를 그대로 두려면 `preserve`를 선택합니다.

등록 정보는 `.ai-agent-playbook/workspace.json`에 저장합니다. 구성원마다 ID, 작업 공간 기준 상대 경로, 역할과 기존 로컬 기록 위치가 있으면 그 위치를 남깁니다. `notes/` 같은 무관한 폴더는 작업 공간 아래 있다는 이유로 구성원이 되지 않습니다. 부트스트랩을 다시 실행해도 기존 등록은 보존하며, 안내에서 등록 목록을 교체하거나 단일 프로젝트로 전환하지 않습니다. 구성원을 바꿀 때는 관리 명령을 사용하세요. 등록된 구성원에서 안내를 시작하면 먼저 공통 작업 공간의 위치를 확인한 뒤 그 기록을 설정합니다.

## 등록 관리하기

```sh
ai-agent-playbook workspace add --id android --path mobile/android --role mobile --json
ai-agent-playbook workspace add --id android --path mobile/android --role mobile --apply --json
ai-agent-playbook workspace remove --id android --json
ai-agent-playbook workspace remove --id android --apply --json
```

`list`와 `check`는 읽기 전용입니다. `add`와 `remove`는 `--apply`가 없으면 미리보기이며, 적용 요청에 `--dry-run`을 붙여도 쓰지 않습니다. 소문자와 하이픈으로 된 고유 ID와 작업 공간 안에 실제 존재하는 폴더를 사용하세요. 변경을 적용하면 이전 등록 정보의 백업이 반환됩니다. 백업을 보관하고, 복원하기 전에는 이후 등록 변경도 확인합니다. 등록을 제거해도 저장소나 기록은 삭제하지 않습니다.

`workspace list`는 사용 가능 여부와 경고를 표시하고, `workspace check`는 사용할 수 없는 구성원이 있으면 실패합니다. 이동한 경로는 로컬 기록과 사용자 편집을 보존하면서 명시적으로 바로잡으세요. 링크, junction, 서로 겹치는 구성원과 작업 공간 밖 경로로 등록 범위를 넓힐 수는 없습니다.

## 기록과 코드를 따로 선택하기

작업 공간 루트나 등록된 구성원 안에서 시작하면 기본적으로 공통 기록을 찾습니다. 상위 작업 공간을 찾을 때 명시적 등록 여부를 확인하며, 모든 상위 플레이북을 프로젝트 루트로 간주하지 않습니다.

```sh
ai-agent-playbook records status --view repositories --json
ai-agent-playbook records read --path CURRENT.md --record-source workspace --json
ai-agent-playbook records read --path CURRENT.md --record-source repo:web --json
```

`--record-source repo:web`는 해당 구성원의 기존 로컬 플레이북을 선택합니다. 과거 기록을 새로 만들거나 옮기거나 합치거나 요약하지 않습니다. `workspace`는 공통 출처를 선택합니다. 로컬 기록이 없는 구성원은 그 출처를 제공할 수 없습니다. 기록 이전·복구도 `--record-source repo:<id>`를 받습니다. `migrate layout`, `migrate rollback`, `migrate bootstrap-rollback`에 같은 출처를 반복하면 해당 로컬 기록으로 변경을 한정합니다. [설치·복구](lifecycle.ko.md)를 참고하세요. 등록된 작업 공간이 없으면 기존처럼 정확히 지정한 폴더에서 플레이북을 찾을 수 있습니다.

기록 검색의 `--repo web`는 선택한 출처 안에서 해당 구성원의 기록을 필터링합니다. 저장소 메타데이터, `repos/web/` 아래 기록 또는 명시적으로 선택한 `repo:web` 출처를 인식하며 다른 저장소 디렉터리는 본문을 읽기 전에 제외합니다. 출처 자체를 바꾸는 `--record-source repo:web`와 다릅니다. 저장소 메타데이터가 없는 과거 기록은 필터에 잡히지 않을 수 있으므로 근거가 없다고 판단하기 전에 직접 읽어보세요. [오래 유지할 기록](durable-records.ko.md)과 [응답 크기 안내](record-responses.ko.md)를 참고하세요.

## 코드와 Git 작업의 저장소 선택하기

작업 공간 루트에서는 AST와 Forge에 `--repo <id>`가 필요합니다. 등록된 구성원 안에서는 그 구성원이 기본 코드 대상이며, ID를 명시하면 다른 등록 구성원을 선택할 수 있습니다. 코드나 Git 작업 전에 선택한 저장소의 지침, Git 루트, 브랜치, 미반영 변경과 원격 주소를 확인합니다.

```sh
ai-agent-playbook ast search --repo web --lang tsx --pattern 'useState($VALUE)' --path src --json
ai-agent-playbook forge status --repo api --json
```

AST 경로와 Forge 계획 경로는 선택한 저장소 기준입니다. 소스 선택에는 해당 저장소의 Git 제외 규칙을 사용합니다. 기록을 공유한다는 이유로 모든 구성원에 원격 변경을 적용하는 명령은 없습니다. Android/iOS 등록과 기록 지원이 [AST 지원 언어](ast-search.ko.md)에 Kotlin이나 Swift를 추가하지는 않습니다.

MCP에서는 네 기록 도구의 `recordSource`, 상태 조회의 `view: "repositories"`, 선택형 `aapb_ast_search`의 `repo`를 사용합니다. 선택 범위는 등록된 작업 공간 안으로 제한되며 서버를 임의의 폴더로 바꾸지 않습니다. [MCP 설정](mcp-permission-model.ko.md)을 참고하세요.

## 제외 규칙과 복구

기록 위치에 맞춰 `local`, `shared`, `global`, `none`을 선택합니다. 공통 기록 폴더가 하위 Git 저장소 밖에 있다면 그 저장소 안에 제외 규칙을 만들 필요는 없습니다. `shared`는 기록 내용이 아닌 제외 규칙을 공유하며, `none`은 규칙을 추가하지 않습니다. 이미 추적 중인 파일은 계속 추적됩니다.

로컬 제외는 설정 루트를 포함하는 Git 저장소의 `info/exclude`를 사용하며 하위 폴더와 연결된 worktree도 지원합니다. 루트 바로 아래에 `.git` 디렉터리가 있는지로 판단하지 않습니다. 상위 폴더가 Git 밖이라면 로컬 제외를 비활성 항목으로 남기고 이유를 표시하며 제외 없음을 권장합니다. 권장·현재 저장된 설정은 메뉴 선택과 별도로 표시합니다. 인자형 `--exclude local`이나 `--local-only`는 Git 밖에서 경고하고 제외를 건너뛰는 기존 동작을 유지합니다. 연결된 worktree끼리 제외 파일을 공유할 수 있습니다.

제외 방식을 바꾸거나 AGENTS 링크를 추가할 때 반환된 백업을 보관하세요. 각 방식은 [기존 저장소 적용](existing-repository-bootstrap.ko.md), `migrate bootstrap-rollback`은 [설치·복구 안내](lifecycle.ko.md)에서 설명합니다. 등록 정보 백업과 부트스트랩 복구 기록은 서로 다른 작업에 사용됩니다. 둘 다 보존하고 등록 정보 백업을 부트스트랩 복구 명령에 넣지 않습니다.
