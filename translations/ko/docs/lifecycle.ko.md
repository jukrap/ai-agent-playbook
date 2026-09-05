# 설치·업데이트·이전·복구

CLI 패키지, 사용자 스킬, 프로젝트 기록은 따로 관리합니다. npm은 Node CLI를 설치·갱신하고, `aapb skills`는 선택한 지침을 관리하며, 기록 명령은 프로젝트 하나를 다룹니다. MCP는 앱에서 별도로 설정합니다.

## npm으로 설치·업데이트하기

```sh
npm install -g ai-agent-playbook
aapb --version
aapb --help
```

현재 게시된 최신 버전으로 갱신하려면 다음을 실행합니다.

```sh
npm install -g ai-agent-playbook@latest
aapb --version
```

기존 실행 파일을 바꾸기 전에는 정확한 버전과 복구용 패키지를 보관합니다. 예약 작업이 해당 명령을 참조하는지도 확인하세요. npm 파일을 갱신해도 설치된 스킬, 프로젝트 기록, MCP 등록, 모델 설정이 바뀌지는 않습니다.

### 특정 버전 선택하기

```sh
npm view ai-agent-playbook dist-tags --json
npm install -g "ai-agent-playbook@<version>"
npx "ai-agent-playbook@<version>" --help
```

`<version>`을 실제 사용할 게시 버전으로 바꿉니다. 가끔 실행할 때는 `npx`가 편리합니다. 서로 다른 런타임을 섞지 않도록 호출마다 같은 버전을 지정하세요. 전역 설치, npm 캐시, 소스 체크아웃의 버전은 다를 수 있습니다. 문제가 생기면 선택한 실행 파일의 `--version`을 확인합니다.

### 전역 명령 없이 설치하기

별도 폴더를 npm 설치 위치로 지정합니다.

```sh
npm install --prefix "<prefix>" "ai-agent-playbook@<version>"
node "<prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --help
```

의존성을 바꾸고 싶지 않은 프로젝트 밖에 설치 위치를 정하세요. 이후 예시에서는 `aapb` 대신 이 Node 스크립트를 실행합니다. PowerShell 래퍼는 필요하지 않습니다.

## 전역 CLI 삭제·복구하기

```sh
npm uninstall -g ai-agent-playbook
```

프로그램만 제거하고 스킬과 프로젝트 기록은 남깁니다. 이전 실행 파일로 돌아가려면 보관한 압축 파일을 설치한 뒤 버전을 확인합니다.

```sh
npm install -g "<previous-archive.tgz>"
aapb --version
```

실제 이전 설치본이 소스 기준 버전과 다르면 별도로 보관하세요. 사용자 스킬과 프로젝트 구조는 아래의 별도 복구 절차를 사용합니다.

## 개발과 로컬 패키지 시험

미게시 후보도 npm으로 로컬 압축 파일을 설치해 같은 경로를 시험할 수 있습니다. [로컬 패키지 시험](demo.ko.md)에 따라 파일을 만들고 확인한 뒤 레지스트리 패키지 대신 압축 파일을 지정합니다.

```sh
npm install --prefix "<demo-prefix>" --ignore-scripts "<archive.tgz>"
node "<demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --version
```

압축 파일의 체크섬을 검증 근거와 함께 보관합니다. 소스에서 직접 실행할 때는 `npm install --no-package-lock`과 `node bin/aapb.mjs --help`를 사용합니다. 소스 검사는 [유지보수](maintenance.ko.md)를 보세요. 게시 여부는 별도 릴리스 판단이며 설치의 선행 조건이 아닙니다.

## 스킬 선택·설치·갱신·삭제

기본 `core`는 `project-memory`, `spec-artifacts`를 선택합니다. `development`는 디자인 방향, UI 다듬기, 문서 편집을 더합니다. `legacy`는 `legacy-contracts` 하나만 선택합니다. `--skill`을 반복 지정하면 프로필 대신 그 목록을 사용합니다. [스킬 카탈로그](skill-catalog.ko.md)에 자세한 예시가 있습니다.

```sh
aapb skills install --profile development --dry-run --json
aapb skills install --profile development --json
aapb skills check --profile development --json
aapb skills update --profile development --dry-run --json
aapb skills update --profile development --json
```

일반 설치·갱신은 `.agents/skills`의 선택한 항목만 바꿉니다. `.codex/skills`에 복제하거나 다른 프로필과 구버전 복사본 전체를 정리하지 않습니다. 선택한 스킬 안의 참고 자료는 함께 설치하지만, 과거의 큰 참고 자료 모음은 자동 설치하지 않습니다.

선택한 관리 스킬을 삭제하려면 다음을 실행합니다.

```sh
aapb skills uninstall --profile development --dry-run --json
aapb skills uninstall --profile development --json
```

결과를 읽고 반환된 백업 디렉터리를 보관하세요. 수정된 파일, 소유권이 불명확한 파일, 연결된 디렉터리는 충돌로 남겨 보존합니다. 이름이 같다는 이유만으로 AAPB 소유라고 판단하지 않습니다. 강제 덮어쓰기는 지원하지 않습니다.

설치·삭제 후에는 에이전트에서 목록을 다시 불러와 실제 표시를 확인하세요. `skills check`는 디스크의 설치본을 확인하며 실행 중인 대화가 스킬을 불러왔는지는 확인하지 않습니다.

## 0.5 스킬을 한 설치 위치로 모으기

`.codex/skills`와 `.agents/skills` 양쪽에 AAPB 복사본이 남아 있을 때 사용합니다.

```sh
aapb skills migrate --profile development --json
aapb skills migrate --profile development --apply --json
```

첫 명령은 미리보기입니다. 선택한 스킬, 예정된 작업, 소유권·해시 검사, 대상 경로, 충돌을 확인합니다. 두 번째 명령은 독립적으로 처리할 수 있는 항목을 적용하고 내역을 남깁니다. 충돌한 항목은 건드리지 않습니다. 일부 적용이 끝났어도 충돌 때문에 실패 상태가 반환될 수 있습니다.

경로를 직접 지정할 때는 `--agents-root`, `--codex-root`, 필요하면 `--backup-root`를 사용합니다. 기본 백업의 상위 폴더는 선택한 스킬 디렉터리 옆의 `aapb-backups`입니다. 백업은 두 설치 폴더 밖이면서 해당 작업에서 바꿀 설치본들과 같은 파일시스템에 있어야 합니다. 다른 파일시스템의 백업은 변경 전에 거부합니다. 여러 파일시스템에 걸친 이전은 선택 항목과 설치 위치를 나누고 각각 같은 파일시스템의 백업으로 진행하세요. 볼륨 간 복사를 원자적 이전으로 지원하지는 않습니다.

## 스킬 작업 되돌리기

설치 작업은 작업별 디렉터리에 기존 내용과 복구 일지를 남깁니다. 이 일지에는 준비·적용·복원 상태가 기록됩니다. 내용을 편집하면 복구할 수 없을 수 있으니 그대로 보관하세요.

```sh
aapb skills rollback --backup "<transaction-directory>" --json
aapb skills rollback --backup "<transaction-directory>" --apply --json
```

해당 작업이 반환한 디렉터리를 사용합니다. 같은 스킬에 여러 작업을 했다면 최신 작업부터 되돌립니다. 복구는 현재 파일과 백업의 해시를 확인하고, 나중에 수정한 파일은 충돌로 보존합니다. 중간에 작업이 끊겼다면 일지와 현재 파일 상태를 보고 재시도하거나 복구하세요. 종료 코드가 실패라고 해서 아무 파일도 바뀌지 않았다고 가정하면 안 됩니다.

## 프로젝트 기록 만들기·공유하기·보관하기

```sh
aapb bootstrap "<project>" --local-only --dry-run
aapb bootstrap "<project>" --local-only
```

새 bootstrap은 `CURRENT.md`, `manifest.json`, `.ai-agent-playbook-install.json`을 만들고 루트 `AGENTS.md`를 보존합니다. `--local-only`는 Git의 로컬 제외 파일을 사용하며 연결된 worktree도 지원합니다. Git이 필요하고 공유 `.gitignore`는 바꾸지 않습니다. 기록을 커밋해서 공유하거나 Git이 아닌 폴더라면 이 옵션을 빼세요.

기존 기록은 덮어쓰지 않습니다. Bootstrap을 다시 실행해도 이미 공유 중인 기록이 로컬 전용으로 바뀌지는 않습니다. 기존 기록의 Git 포함 여부는 별도로 결정하세요. [기존 저장소 적용](existing-repository-bootstrap.ko.md)에서 설명합니다.

프로젝트 기록 삭제는 패키지 제거와 별개의 파일 관리 작업입니다. 유용한 기록을 백업하고 링크와 Git 추적 여부를 확인한 뒤 제거하세요. 구버전의 `managed uninstall`은 종료되었으며 1.0에서 문서를 자동 삭제하지 않습니다.

## 기록 구조 이전과 복구

기존 구조화 기록이나 구버전 플레이북은 이전 없이 읽을 수 있습니다. `minimal`로 이전할 때는 소유권이 확인되고 수정되지 않은 관리 정보만 바꿉니다. 크기 제한 안에서 읽을 수 있는 UTF-8 `CURRENT.md`가 있어야 합니다. 적용 전에 문서의 현재 사실은 직접 검토하세요.

```sh
aapb migrate layout "<project>" --to minimal --json
aapb migrate layout "<project>" --to minimal --apply --json
```

결과의 백업 값은 플레이북 기준 상대 경로입니다. 백업에는 기존 manifest와 소유권 표식이 저장됩니다. 과거 기록, 근거 링크, 루트 지침은 그대로 남습니다. 과거 요약을 현재 사실로 자동 등록하지 않습니다.

```sh
aapb migrate rollback "<project>" --backup "<returned-relative-backup>" --json
aapb migrate rollback "<project>" --backup "<returned-relative-backup>" --apply --json
```

이후에 바뀐 관리 정보는 충돌로 보존합니다. 소유권이 없거나 manifest가 수정되었다면 이유를 확인해야 합니다. 이전을 통과시키려고 관리 정보를 만들어 넣지 마세요. 플레이북 폴더가 여러 개라면 어느 기록을 기준으로 할지 먼저 정리해야 합니다.

## 소스 폴더의 PowerShell 도우미

아래 스크립트는 같은 Node 구현을 호출합니다.

```powershell
.\install.ps1 -Profile development -WhatIf
.\scripts\sync-skills.ps1 -Profile development -WhatIf
.\update.ps1 -Profile development -WhatIf
```

적용하려면 `-WhatIf`를 뺍니다. `-Migrate`가 있으면 구버전 이전을 선택하고, 없으면 선택한 스킬만 갱신합니다. `update.ps1`은 자동으로 pull하지 않습니다. `-Pull`을 지정하면 `git pull --ff-only`를 요청하며, `-WhatIf`와 함께 쓰면 이것도 미리보기만 합니다. 스크립트는 소스 체크아웃에서 실행하고 의도한 원본에서만 동기화하세요.

## 종료된 런타임 기능 복구

실행·감독 루프·예약·색인·자동 전달 기능은 1.0에서 종료했습니다. 에이전트 앱이나 프로젝트의 기존 도구를 사용합니다. 구버전 작업이 의도적으로 필요할 때의 복구 기준은 `npx ai-agent-playbook@0.5.11`입니다. 실제 이전 전역 버전이 다르면 그 설치본도 별도로 보존하세요.

AAPB는 기존 예약과 원격 기록을 고치거나, 구버전을 자동 실행하거나, 개인 설정 전체를 복원하지 않습니다. 복구할 때는 영향받은 설정만 되돌리고 이후의 사용자 선택을 보존하세요. 구버전 별칭은 [명령어 가이드](commands.ko.md), 사전 릴리스의 `playbook_*` → `aapb_*` 이름 변경은 [MCP 설정](mcp-permission-model.ko.md)에 있습니다.
