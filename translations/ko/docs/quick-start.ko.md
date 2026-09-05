# 처음 10분 사용법

먼저 연습용 프로젝트에서 현재 상태 문서를 만들고, 편집하고, 검색하고, 검사해 봅니다. 재사용 스킬은 필요하면 그다음에 설치합니다. MCP와 Python은 선택 사항입니다.

## 네 가지 구성 구분하기

| 구성 | 뜻 | 위치 |
| --- | --- | --- |
| CLI 패키지 | `ai-agent-playbook` 명령과 축약 명령 `aapb`를 제공하는 프로그램 | 소스 폴더, npm 설치 위치 또는 npm 캐시 |
| 스킬 | 작업에 맞게 골라 쓰는 에이전트용 지침 | 기본값은 사용자 계정의 `.agents/skills` |
| 프로젝트 기록 | 현재 목표, 결정, 검증 근거 | 각 프로젝트의 `.ai-agent-playbook/` |
| MCP 연결 | 에이전트 앱이 기록 도구를 호출하는 선택형 연결 | 앱의 서버 설정 |

패키지를 설치해도 스킬 설치, 기록 생성, MCP 등록은 자동으로 진행되지 않습니다. 기록은 평소 쓰는 편집기와 에이전트로도 다룰 수 있습니다.

## 1. npm으로 CLI 설치하기

Node.js 18 이상과 npm이 필요합니다. 일반적인 사용에는 소스 체크아웃이나 PowerShell 설치 스크립트가 필요하지 않습니다.

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --version
ai-agent-playbook --help
```

전역 설치를 하면 기본 명령 `ai-agent-playbook`과 축약 명령 `aapb`를 사용할 수 있습니다. 두 명령의 옵션과 동작은 같습니다. 도움말에서 기록·스킬·선택형 명령을 확인하세요. 전역 설치 없이 가끔 사용하려면 `ai-agent-playbook` 대신 `npx ai-agent-playbook`을 쓸 수 있습니다.

버전을 고정하거나 별도 폴더에 설치하는 방법은 [설치·복구 안내](lifecycle.ko.md)에 있습니다. 이제 새 연습 폴더를 만들 수 있는 상위 폴더에서 계속합니다.

## 2. 연습용 폴더를 만들고 미리보기 실행하기

현재 폴더 안에 빈 연습 폴더를 만듭니다. `aapb-demo`가 이미 있다면 다른 이름을 고르고 이후 예시에서도 같은 이름을 쓰세요.

```sh
mkdir aapb-demo
cd aapb-demo
ai-agent-playbook records status --json
ai-agent-playbook bootstrap --dry-run
```

상태 조회에서는 플레이북이 없다고 나옵니다. 새 폴더이므로 정상입니다. 미리보기에는 만들 예정인 파일 세 개가 표시되지만 아직 생성하지 않습니다.

이 명령들은 현재 터미널의 작업 폴더를 사용합니다. `.`을 붙여도 같습니다. 다른 폴더는 경로나 `--project "<project>"`로 지정합니다. 상위 Git 루트를 자동으로 찾아 올라가지는 않습니다.

## 3. 현재 상태 문서를 만들고 편집하기

```sh
ai-agent-playbook bootstrap
ai-agent-playbook records read --path CURRENT.md
```

이제 폴더 구조는 다음과 같습니다.

```text
aapb-demo/
  .ai-agent-playbook/
    CURRENT.md                        직접 편집할 문서
    manifest.json                     기록 구조를 나타내는 관리 파일
    .ai-agent-playbook-install.json    소유권과 파일 변경 확인에 쓰는 관리 파일
```

편집기에서 `.ai-agent-playbook/CURRENT.md`를 열어 안내 문구를 실제 내용으로 바꿉니다.

```markdown
# 현재 상태

## 목표
AAPB의 기록 조회와 검색을 시험한다.

## 제약
이 연습 폴더 안에서만 작업한다.

## 확인한 상태
Bootstrap으로 기록을 만들었다. 애플리케이션 테스트는 실행하지 않았다.

## 다음 할 일
"연습 폴더"를 검색하고 검증 결과를 확인한다.
```

`CURRENT.md`는 직접 고쳐 쓰는 문서입니다. 관리용 파일은 CLI가 다루도록 두세요. 이번 실습에 별도의 명세나 작업 일지는 필요하지 않습니다.

## 4. 읽기·검색·검증 실행하기

```sh
ai-agent-playbook records status --json
ai-agent-playbook records read --path CURRENT.md
ai-agent-playbook records search --query "연습 폴더" --json
ai-agent-playbook records validate --json
```

- 상태 조회의 시작 문서는 `CURRENT.md`, 기록 구조는 `minimal`로 나옵니다.
- 읽기 결과는 방금 저장한 내용과 같아야 합니다.
- 검색 결과에는 파일 경로, 줄 번호, 검색어 주변 문장이 나옵니다.
- 검증은 문서를 확인합니다. 애플리케이션 테스트를 실행하지 않았으므로 `runtimeVerified: false`가 정상입니다.

`ok`뿐 아니라 경고와 `scan.complete`도 확인하세요. 다음 부분을 읽기 위한 커서가 나오면 [이어 읽기 예시](record-responses.ko.md)를 따라 나머지를 요청합니다.

## 5. 필요하면 재사용 스킬 설치하기

앞의 실습에는 사용자 스킬 설치가 필요하지 않습니다. 에이전트에서 AAPB 지침도 쓰려면 개발 프로필 설치를 미리 봅니다.

```sh
ai-agent-playbook skills list --json
ai-agent-playbook skills install --profile development --dry-run --json
```

설치 대상은 연습 프로젝트가 아니라 사용자 계정의 스킬 폴더입니다. 개발 프로필은 기록, 산출물 형식, 디자인, UI, 문서 편집 스킬 다섯 개를 고릅니다. 충돌 여부를 살펴본 뒤 적용합니다.

```sh
ai-agent-playbook skills install --profile development --json
ai-agent-playbook skills check --profile development --json
```

에이전트의 스킬 목록을 다시 불러오거나 새 세션을 시작하고 [카탈로그](skill-catalog.ko.md)의 이름이 보이는지 확인하세요. 0.5 복사본이 두 폴더에 남아 있다면 [별도 이전 절차](lifecycle.ko.md)를 따릅니다. 일반 설치는 구버전 복사본을 삭제하지 않습니다.

## 6. 기존 프로젝트에 적용하기

`<project>`를 실제 프로젝트 폴더로 바꿉니다. 공백이 있는 경로는 따옴표로 감싸고 자리표시자를 그대로 입력하지 마세요.

```sh
ai-agent-playbook records status "<project>" --json
ai-agent-playbook bootstrap "<project>" --local-only --dry-run
```

`--local-only`는 Git 저장소에서만 사용합니다. 새 플레이북을 만들 때 기록 폴더를 Git의 로컬 제외 목록에 추가합니다. Git이 아닌 폴더이거나 기록을 커밋해서 공유할 예정이면 옵션을 빼세요. 어느 쪽이든 커밋을 자동으로 만들지는 않습니다.

기록이 이미 있다면 표시된 시작 문서를 읽습니다. Bootstrap은 기존 기록과 루트 지침을 보존합니다. 기록이 없고 미리보기가 맞다면 `--dry-run`을 빼고 다시 실행하세요. 기록 구조를 이전하기 전에는 [기존 저장소 적용 안내](existing-repository-bootstrap.ko.md)를 읽습니다.

## 막혔을 때 확인할 사항

| 증상 | 확인 방법 |
| --- | --- |
| `node`나 `npm`을 찾지 못함 | Node.js 설치 후 터미널을 다시 열고 `node --version`, `npm --version` 실행 |
| 로컬 Node 스크립트를 찾지 못함 | 격리 설치에서 지정한 패키지 절대 경로 확인 |
| `ai-agent-playbook` 명령을 찾지 못함 | 버전 확인. 0.5.11은 `aapb`만 제공합니다. 1.0이면 npm 전역 설치 후 터미널 다시 열기. npm 설치 위치와 PATH를 확인하거나 격리 Node 진입점 사용 |
| Git이 아닌 폴더에서 `--local-only` 실패 | 연습 폴더에서는 빼고 Git 저장소에서만 사용 |
| 에이전트에 스킬이 보이지 않음 | 프로필, 설치 결과, 앱의 지원 경로, 새 세션의 목록 확인 |
| 이전 스킬과 충돌함 | 파일을 보존하고 이전 미리보기 확인. 강제 덮어쓰기 옵션은 지원하지 않음 |
| 수정된 관리 파일이 있다고 나옴 | 수정 내용을 검토. 표시를 없애려고 유용한 기록을 덮어쓰지 않기 |

## 용어와 다음 안내

| 용어 | 뜻 |
| --- | --- |
| `ai-agent-playbook` / `aapb` | 같은 패키지가 제공하는 기본 명령 / 축약 명령 |
| `npx` | npm 패키지를 실행하는 도구. 소스·전역 설치본과 다른 버전을 고를 수 있음 |
| `bootstrap` | 플레이북이 없을 때만 기록을 생성하는 명령 |
| `--dry-run` | 쓰기 없이 예정된 작업을 확인하는 옵션 |
| `--apply` | 원래 미리보기로 동작하는 이전·복구·Forge 명령을 적용하는 옵션 |
| `--json` | 경고와 이어 읽기 정보 등을 구조화해서 출력하는 옵션 |
| 커서 | 다음 결과 위치를 나타내는 반환값. 고치지 않고 다음 요청에 전달 |

이어서 [명령어 가이드](commands.ko.md), [설치·복구](lifecycle.ko.md), [MCP 설정](mcp-permission-model.ko.md)을 볼 수 있습니다. 전체 안내는 [문서 지도](README.ko.md)에 있습니다.
