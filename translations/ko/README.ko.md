<p align="center">
  <img src="../../docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  실제 소프트웨어 저장소에서 안전하고 일관되게 일해야 하는 AI 에이전트를 위한 재사용 작업 지침 모음입니다.
</p>

<p align="center">
  <a href="../../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/ai-agent-playbook"><img alt="npm package" src="https://img.shields.io/npm/v/ai-agent-playbook?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="Python 3.11 plus optional" src="https://img.shields.io/badge/python-3.11%2B%20optional-3776ab?style=flat-square">
  <img alt="PowerShell installer" src="https://img.shields.io/badge/installer-PowerShell-f08c00?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## 언어

- 영어 원문: [README.md](../../README.md)
- 한국어: 이 문서

## 이 저장소는 무엇인가

AI Agent Playbook은 AI 코딩 도구가 실제 프로젝트 안에서 덜 추측하고 더 안정적으로 일하도록 돕는 하네스입니다. 재사용 스킬, 프로젝트 템플릿, 프로젝트 기억 문서, 가벼운 명령줄 도구, 읽기 전용 MCP 서버를 함께 제공합니다.

핵심 목표는 단순합니다. 에이전트가 저장소를 먼저 살피고, 로컬 규칙을 존중하고, API 경계를 흐리지 않고, 작업 기록을 남기고, 완료를 말하기 전에 검증하도록 만드는 것입니다.

특정 도구에 묶이지 않습니다. Codex, Claude Code, 그 밖의 코딩 에이전트가 같은 원본 자료를 사용할 수 있고, 도구별 설정은 `adapters/` 아래에서 따로 관리합니다.

이 저장소는 명령 묶음이나 항상 켜져 있는 호스팅 에이전트 서비스가 아닙니다. forge 없이도 로컬에서 계속 사용할 수 있습니다. 자동화는 승인된 계획을 시작하거나 스케줄을 명시적으로 적용했을 때만 동작하고, 원격 및 운영체제 변경 명령은 미리보기 결과를 먼저 확인할 수 있습니다. MCP는 선택 사항이며 기본 도구는 읽기 전용입니다.

## 제공하는 것

| 구성 | 역할 | 위치 |
| --- | --- | --- |
| 재사용 스킬 | 온보딩, 문서화, 품질, Git, 보안, 설계, 프론트엔드, 백엔드, 데이터베이스, 운영, 모바일, 레거시 작업을 위한 상황별 작업 지침입니다. | `skills/` |
| 프로젝트 템플릿 | 프로젝트에 복사해 둘 루트 에이전트 규칙, 스택별 참고 틀, 현재 사실과 결정 근거를 기록하는 `.ai-agent-playbook/` 문서입니다. | `templates/` |
| 런타임 하네스 | `.ai-agent-playbook/` 생성, 상태 점검, 문맥 수집, 작업 실행 기록, 계약 점검, 계획과 작업 기록, forge 협업, 재개 가능한 자동화 tick을 다루는 명령줄 도구입니다. | `bin/`, `src/` |
| MCP 도구 | 기본 읽기 전용 도구, 자료, 프롬프트와 별도로 제한된 forge coordination 쓰기 도구입니다. Push, task 실행, merge, release는 MCP로 노출하지 않습니다. | `src/` |
| 사람용 문서 | 빠른 시작, 사용 수명주기, 명령어, 구조, 기능 참고 자료를 제공합니다. | `docs/` |
| 한국어 번역 | 영어 원문을 따라가는 한국어 읽기용 문서입니다. | `translations/ko/` |
| 에이전트 어댑터 | Codex, Claude Code 같은 도구별 설정과 선택적 훅 예시입니다. | `adapters/` |

## 빠른 시작

패키지는 [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook) 이름으로 배포됩니다. 가장 단순한 방법은 `npx`로 바로 실행하는 것입니다.

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook operator check <target-project> --json
```

처음 쓰는 경우에는 [처음 10분 사용법](docs/quick-start.ko.md)부터 봅니다. 파일을 쓰기 전에 `npx`, 전역 설치, 스킬 설치, 프로젝트 부트스트랩이 각각 무엇을 하는지 설명합니다.

예시의 `<target-project>`는 점검할 프로젝트 폴더로 바꿉니다. 터미널이 이미 그 프로젝트 안에 있다면 `.`을 쓰면 됩니다. 공백이 있는 경로는 따옴표로 감싸고, 공유 문서나 이슈에는 개인 로컬 경로를 넣지 않습니다.

사용 중인 AI 앱이 MCP를 지원한다면 `npx ai-agent-playbook mcp` 같은 로컬 서버 명령을 등록할 수 있습니다. 그러면 명령어를 전부 외우지 않아도 AI에게 프로젝트 문맥 점검, 스킬과 작업 흐름 목록 확인, 어댑터 준비 상태 확인, 참고 자료 채택 상태 확인, 문서 문체 점검, 로컬 검색, 심층 분석을 자연어로 요청할 수 있습니다. MCP 도구는 기본적으로 읽기 전용입니다.

어느 디렉터리에서든 짧은 `aapb` 명령을 쓰고 싶다면 전역으로 설치합니다.

```powershell
npm install -g ai-agent-playbook
aapb --help
```

`aapb`는 AI Agent Playbook의 앞글자를 딴 짧은 전역 명령 이름입니다. npm 패키지 이름은 계속 `ai-agent-playbook`입니다.

Python은 선택 사항이지만, 한국어와 영어 글 점검을 더 깊게 하려면 설치하는 편이 좋습니다. Node 쪽은 명령줄과 MCP 진입점을 안정적으로 맡고, Python 3.11 이상이 있으면 `writing naturalness-check --engine auto`와 `writing naturalness-report --engine auto`가 Python 기반 분석과 기본 JavaScript 대체 분석을 함께 사용합니다.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_AGENT_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
npx ai-agent-playbook runtime python-status --json
npx ai-agent-playbook writing naturalness-check <target-project> --path README.md --lang auto --engine auto --json
npx ai-agent-playbook writing naturalness-report <target-project> --root docs --lang ko --engine auto --json
```

소스 체크아웃에서 개발할 때는 `.\scripts\bootstrap-python.ps1`이 로컬 `.venv`를 만들고 선택 Python 기능을 설치합니다. Python이 없어도 CLI와 MCP 서버는 동작하며, Python 기반 점검은 `engines.unavailable` 경고와 함께 JavaScript 대체 결과를 반환합니다.

npm 패키지는 명령줄 도구만 설치합니다. 스킬 복사, `.ai-agent-playbook/` 생성, 훅 활성화, 명령 단축 등록은 자동으로 하지 않습니다. 이 작업들은 사용자가 명시적으로 실행해야 합니다.

- `skills install`, `skills update`, `skills uninstall`: 사용자 계정에 설치되는 재사용 스킬을 관리합니다.
- `bootstrap`, `guides sync`, `managed *`, `contracts *`, `operator *`, `qa *`: 대상 프로젝트 하나를 생성, 점검, 정리합니다.
- `mcp`: AI 앱이 연결할 수 있는 로컬 MCP 서버를 시작합니다. 이 명령 자체는 파일을 쓰지 않습니다.
- 런타임 훅과 어댑터 설정은 선택 사항이며 기본 설치 과정에서 자동으로 켜지지 않습니다.

명령어별 사용법은 [명령어 가이드](docs/commands.ko.md)를 봅니다. 업데이트, 삭제, 로컬 체크아웃, PowerShell 호환 경로, 소유권 표식, 정리 절차는 [사용 수명주기](docs/lifecycle.ko.md)를 봅니다.

## Forge 자동화 호환성

0.5.8은 재개 가능한 로컬 실행 루프와 0.5.5에서 도입한 사람 중심 Forge 협업 구조를 유지합니다. 세밀한 task는 로컬 원장에 두고 roadmap과 delivery-group issue, Projects, Views, milestone, 검토 가능한 PR로 공유 작업을 보여줍니다. Reconcile preview는 provider가 확인한 no-op operation을 제외하고, 빈 Project text 값은 반복해서 쓰지 않으며, 엄격한 legacy managed preamble은 사용자 메모를 지우지 않고 교체합니다. 중단된 supersede 복구와 Projects 권한 gate도 유지합니다.

| 구성 요소 | 지원 버전 또는 연동 기준 | 상태 |
| --- | --- | --- |
| Git | `2.39+` | 최소 지원 Git 버전 |
| Node.js | `18+` | 패키지 메타데이터가 강제하는 런타임 하한 |
| GitHub CLI (`gh`) | `2.80+` | `2.96.0`에서 검증 |
| GitHub REST API | `2026-03-10` | 어댑터 요청의 API 버전 기준 |
| Gitea | `1.26.4` | provider 호환성 기준 |
| Gitea CLI (`tea`) | `0.14.2` | 선택적 CLI 참고 버전이며 안정 API가 주 연동 표면 |
| Gitea Actions runner | `2.0.0` | 워크플로 runner 호환성 기준 |

“검증”이라고 명시한 행만 실제 확인한 도구 버전을 뜻합니다. API와 provider 기준 행은 호환성 계약을 정의하며, 실제 원격 쓰기 스모크 테스트를 완료했다는 뜻이 아닙니다.

- 사용할 수 있는 remote가 없거나 `--no-remote`, `--offline`으로 현재 요청의 범위를 줄이면 forge transport를 호출하지 않고 같은 실행을 로컬 원장에서 계속합니다. 인증 또는 write permission이 없으면 mutation은 비활성화하지만 anonymous capability probe나 허용된 remote read는 수행할 수 있습니다.
- `forge status`는 설정상 허용된 `policyWrites`와 권한 확인을 마친 `verifiedWrites`를 구분하고, token material 없이 server/API version, authentication, repository permission, probe evidence를 보고합니다. 인증과 repository write permission이 확인될 때까지 effective `writes`는 false입니다.
- GitHub Projects와 Views에는 해당 project scope가 필요합니다. Project 협업을 우선하는 설정에서는 둘 중 하나라도 사용할 수 없으면 모든 원격 쓰기 전에 중단합니다. `forge status`, bootstrap, synchronization preview는 브라우저 인증과 재확인 명령을 출력하며, 차단된 bootstrap preview는 실행 가능한 operation을 0건으로 유지하면서 요청된 산출물 수를 보여줍니다. Milestone 방식은 `projects,views` fallback을 명시했을 때만 사용합니다. 하네스는 인증 scope를 자동으로 확대하지 않습니다.
- Managed Project는 Planned, Ready, In Progress, In Review, Blocked, Done 옵션을 가진 중립적인 `Delivery Status`와 `Priority`, `Risk`, `Phase`, `Progress`, `Area`, `Task ID` field를 만듭니다. 기존 `AAPB *` field는 읽기 호환 alias로 재사용하며 중복 생성, rename, 삭제하지 않습니다. 사용자 소유 Project의 field와 View REST 경로는 일관되게 소유자 login을 사용하므로 중단된 bootstrap도 기존의 제목 있는 Project를 재사용해 재개할 수 있습니다. 표시 구조 reconcile은 관리되는 분류 label을 Project로 먼저 옮기며, 이관에 실패하면 뒤의 원격 변경을 중단합니다.
- Reconcile 사전 점검은 mutation을 차단한 transport 뒤에서 실제 provider adapter를 사용합니다. Provider가 재사용 가능하다고 확인한 operation은 `noOps`로 옮기고, 실행 가능한 산출물 수는 남은 변경만 반영하며, 원래 의도 수는 `plannedOperations`에 유지합니다. GitHub 응답에서 생략된 빈 text field는 빈 목표 값과 같은 상태로 수렴합니다.
- GitHub는 새 Project에 `View 1`을 자동으로 만듭니다. 안정 공개 View API는 이 system View의 rename이나 delete를 지원하지 않으므로 AAPB는 table View를 중복 생성하지 않고 이를 managed `all` 역할로 재사용하며 표시 이름이 바뀌었다고 주장하지 않습니다.
- 검토된 supersede reconcile은 parent에 연결된 오래된 이슈를 marker 댓글보다 먼저 종료하고, 마지막 계층 해제 전에 Project card를 제거하며, 실패하면 같은 group의 뒤 mutation을 차단합니다. 이전 실행이 열린 이슈의 parent 관계를 이미 해제했다면 다음 preview는 승인된 plan의 정확한 supersede marker로만 이를 복구하고 종료 전에 Project card를 제거합니다. 이슈, 댓글, label 정의는 보존합니다.
- Gitea는 server OpenAPI가 필요한 method를 광고한 Issues, Labels, Milestones, pull request, Actions만 사용합니다. Draft review는 public pull-request API와 Gitea의 documented `WIP:` title convention을 사용합니다. Self-hosted hostname 단서는 `forge.provider: "gitea"` 또는 `/api/v1`으로 끝나는 credential-free `forge.apiBaseUrl`을 설정할 때까지 쓰기 불가 상태로 둡니다. Version과 OpenAPI probe는 token 없이 먼저 실행하고 그 뒤에 인증된 permission을 확인합니다. Project/View 상태는 라벨과 milestone 필터로, Discussions는 decision issue로 대체할 수 있습니다.
- `gh agent-task`는 명시적으로 선택하는 preview 어댑터이며 자동 executor 후보가 아닙니다. forge 부트스트랩과 스케줄러 설치도 먼저 미리보기를 만들고 명시적인 적용 단계를 요구합니다.

Provider 확인 no-op 제거, Project 수렴, legacy body 마이그레이션은 [0.5.8 Forge 멱등 reconcile 변경 기록](docs/changes/forge-idempotent-reconcile-0.5.8.ko.md)을 봅니다. [0.5.7 Forge reconcile 복구 변경 기록](docs/changes/forge-reconcile-recovery-0.5.7.ko.md)은 중단된 supersede 복구 기준으로 유지합니다.

## 평소 작업 흐름

```text
npx 또는 전역 설치
  -> 스킬 설치 또는 갱신
  -> 에이전트 재시작
  -> 대상 프로젝트 점검
  -> 프로젝트에 로컬 작업 지침이 필요할 때만 .ai-agent-playbook/ 생성
  -> operator check/search와 관리 파일 정리를 명시적으로 실행
```

기존 프로젝트에서는 먼저 미리보기를 실행하고 충돌을 확인한 뒤 파일을 씁니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only --dry-run
npx ai-agent-playbook bootstrap <target-project> --local-only
npx ai-agent-playbook operator check <target-project> --json
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json
npx ai-agent-playbook operator research <target-project> --query "project risks" --json
```

검색, 관리 파일 정리, 어댑터 설정, 계획, 작업 기록 명령은 [명령어 가이드](docs/commands.ko.md)를 봅니다.

`.ai-agent-playbook/`을 생성한 뒤에는 에이전트가 `START_HERE.md`에서 시작하고, 이어서 `CURRENT.md`, `questions.md`, 관련 기억 문서, 구조 지도, 계약 문서, 작업 흐름 레시피를 읽어야 합니다. `runtime/` 아래 생성 파일은 검토와 승격 전까지 신뢰된 기억이 아니라 근거 후보입니다.

## 기능 목록

### 스킬과 작업 지침

- 93개 재사용 스킬을 제공합니다.
- 스킬은 기술 스택보다 문제 유형과 작업 능력 중심으로 분류합니다.
- 스킬 본문은 짧게 유지하고, 긴 절차와 세부 지식은 참고 문서로 분리합니다.
- 예전 이름으로 호출하던 스택 중심 스킬은 호환용으로 유지합니다.

### `.ai-agent-playbook/` 프로젝트 기억

- 대상 프로젝트에 구조화된 `.ai-agent-playbook/`을 만들 수 있습니다.
- `START_HERE.md`, `CURRENT.md`, `questions.md`, `policy/SKILLS.md`, `policy/GIT.md`로 에이전트의 시작 지점을 명확히 합니다.
- `memory/`는 사람이 신뢰하는 장기 지식, `runtime/`은 도구가 만든 임시 근거로 분리합니다.
- 기존 `ai-playbook/` 경로는 `migrate path`로 `.ai-agent-playbook/`으로 전환할 수 있습니다.

### 런타임 점검과 색인

- 프로젝트 상태, 문서 신선도, 관리 파일 변경 여부, 계약 문서 상태를 점검합니다.
- 파일 목록, 심볼 개요, 의존성, 라우트와 API 단서, 저장소 그래프를 읽기 전용으로 생성하거나 미리 볼 수 있습니다.
- 쓰기 전 점검과 사후 점검으로 의도와 다른 파일 변경을 발견할 수 있습니다.
- 생성된 근거를 바로 장기 기억으로 취급하지 않고, 명시적으로 검토한 뒤 승격하도록 설계했습니다.

### MCP 연동

- AI 앱이 읽을 수 있는 스킬 목록, 작업 흐름 목록, 어댑터 지원 상태, 어댑터 준비 상태, 참고 자료 채택 상태, 권한 모델 자료를 제공합니다.
- 기본 MCP 도구는 읽기 전용입니다.
- 로컬 playbook 쓰기 MCP 도구는 `--enable-write-tools`, forge coordination 쓰기 도구는 별도 `--enable-forge-write-tools`가 필요하며, 두 종류 모두 호출 시 `apply: true`를 요구합니다.
- 참고 자료 채택, 원본 등록, 채택 장부 갱신은 미리보기와 실제 적용을 분리합니다.

### 어댑터

- Codex와 Claude Code용 설정 예시와 준비 상태 점검을 제공합니다.
- Codex App을 주 사용 환경으로 삼아도, 같은 원본 문서를 다른 에이전트가 함께 사용할 수 있게 분리했습니다.
- 훅은 선택 사항입니다. 중요한 규칙은 `AGENTS.md`와 `.ai-agent-playbook/`에 남기는 것이 기본입니다.

### 검증과 공개 안전장치

- 스킬 형식, 번역 누락, 공개 문서 내 개인 경로와 민감 문자열, MCP 문서 누락을 검증합니다.
- GitHub Actions에서 문법 검사, 전체 테스트, 스킬 검증, 번역 검증, 공개 문서 검증, 설치/업데이트 미리보기를 실행합니다.
- 로컬 스킬 동기화는 미리보기와 실제 적용을 분리합니다.

## 저장소 지도

```text
bin/                  aapb 명령 진입점
src/                  명령줄 도구와 MCP 서버 구현
skills/
  ai-harness/         MCP, forge 자동화, 에이전트, 문맥, 사실 점검, 증거 이력, 색인 설계
  architecture/       경계 검토, 기능 단위, 도메인 모델, 모노레포/패키지 구조
  backend/            API 계약, 백엔드 변경 안전성, 요청/오류 계약, 잡/워커, 연동, 서버 렌더링 흐름
  data/               데이터 파이프라인, 분석, 원본 등록, 보고, 마이그레이션 무결성
  database/           스키마, 마이그레이션, SQL, 데이터 무결성
  delivery/           계획, 평가, 검증, 테스트, Git, PR, 작업 기록
  devops/             CI/CD, 컨테이너, 패키지 배포, 배포 점검, 운영 장애 대응
  design/             디자인 방향, 브랜드 정체성, 참고 이미지 분석, 이미지/Figma 인수인계
  frontend/           UI, 브라우저 동작, 상태와 데이터 흐름, 접근성, 시각 회귀, 3D 상호작용
  mobile/             모바일 릴리스, 권한, 오프라인 동기화, 하이브리드 앱, WebView
  security/           인증, 권한, 의존성 공급망, 라이선스, 보안 검토, 컴플라이언스
  project/            부트스트랩, 온보딩, 프로젝트 계획, 문서화, 자연스러운 글 다듬기, 프로젝트 기억
  quality/            UI 품질 검토, 코드 정리, 호환 라우트, 가벼운 리뷰
  git/                커밋, PR, push, 작업 기록
  meta/               스킬 작성
  legacy/             레거시 시스템 유지보수
templates/            프로젝트에 복사할 에이전트 지침과 `.ai-agent-playbook/` 템플릿
examples/             작업 기록, 프롬프트, 인수인계 예시
translations/         사람이 읽는 번역본. 스킬 설치 대상이 아님
adapters/             에이전트별 설정 메모와 선택적 훅 예시
docs/                 빠른 시작, 사용 수명주기, 명령어, 구조, 기능 참고 자료
docs/assets/          README와 문서용 이미지
scripts/              검증과 로컬 동기화 도우미
test/                 Node.js 테스트
.github/              GitHub Actions 검증 흐름
```

## 스킬 카탈로그

상세 목록은 [스킬 카탈로그](docs/skill-catalog.ko.md)를 봅니다. 이 README는 큰 분류만 요약합니다.

- 프로젝트와 문서: 프로젝트 시작, 저장소 온보딩, 프로젝트 기억, 의사결정 기록, 요구사항 정리, 이슈 계획, 릴리스 노트, 자연스러운 글 검토, 문서 패키지.
- 전달과 검증: Git과 작업 기록, 검증 전략, CI 기준, 불안정한 테스트 대응, 테스트 데이터, 평가 하네스.
- AI 하네스: MCP 표면, 문맥과 기억 설계, 에이전트 작업 분배, forge 자동화 제어, 스킬 묶음 관리, 런타임 색인과 캐시, 기능 증거 이력, 행동 전 사실 점검.
- 아키텍처와 백엔드: 경계 검토, 기능 단위 구조, 도메인 모델, 모노레포 패키지, API 계약, 백엔드 변경 안전성, 요청 검증과 오류 계약, 잡/워커 신뢰성, 외부 연동, 서버 렌더링 흐름.
- 데이터와 데이터베이스: 분석, 데이터 계보, 마이그레이션, 검색 지식 기반, 원본 등록, 스키마 변경, 쿼리 성능, 데이터 무결성.
- 운영과 릴리스: 컨테이너, 배포, 패키지 공개, 운영 장애 대응, 릴리스 준비.
- 디자인과 프론트엔드: 디자인 방향, 브랜드 정체성, 참고 화면 분석, 이미지/Figma 인수인계, 스타일 정책 선택, UI 다듬기, 접근성, 상태와 데이터 흐름, 시각 회귀, 3D 상호작용.
- 모바일: 네이티브 릴리스, 기기 권한, 오프라인 동기화, WebView 연결.
- 보안과 컴플라이언스: 보안 검토, 인증과 권한, 의존성 공급망, 라이선스와 고지, 공개 전 보안 기준.
- 레거시: 숨은 결합, 오래된 웹 스택, 서버 렌더링 시스템, WebView 하이브리드, IE/ActiveX 호환성, 데이터베이스 중심 업무 흐름.

## 문서

- [저장소 맥락](CONTEXT.ko.md): 이 플레이북의 핵심 용어와 설계 의도.
- [처음 10분 사용법](docs/quick-start.ko.md): 처음 실행 순서, 용어, 안전한 명령 순서.
- [명령어 가이드](docs/commands.ko.md): 각 명령이 무엇을 하는지, 언제 쓰는지, 파일을 쓰는지 설명.
- [사용 수명주기](docs/lifecycle.ko.md): npm/npx 사용, 전역 명령 설정, 스킬 관리, 프로젝트 부트스트랩과 제거, 정리 절차.
- [런타임 하네스](docs/harness-runtime.ko.md): 런타임 원칙, JSON 계약, 덮어쓰기 정책, 대상 프로젝트 적용 흐름.
- [구조화 플레이북 레이아웃](docs/structured-playbook-layout.ko.md): `.ai-agent-playbook` 디렉터리 역할과 전환 명령.
- [능력 분류 체계](docs/capability-taxonomy.ko.md): 능력 중심 분류와 호환 스킬 정책.
- [스킬 카탈로그](docs/skill-catalog.ko.md): 한국어 스킬 목록과 사용 상황 요약.
- [MCP 권한 모델](docs/mcp-permission-model.ko.md): 읽기, 발판 생성, 관리 파일 쓰기, 프로젝트 파일 쓰기 단계.
- [참고 자료 채택](docs/reference-adoption.ko.md): 외부 참고 자료를 잡음 없이 로컬 능력으로 정제하는 방법.
- [런타임 로드맵](docs/runtime-roadmap.ko.md): 단계적 강화 계획과 선택적 훅 계층의 경계.
- [Codex 어댑터](adapters/codex/README.ko.md): Codex 기준 로컬 동기화 방식과 Windows용 Codex App 작업 흐름.
- [Claude Code 어댑터](adapters/claude-code/README.ko.md): Claude Code 설정 메모와 선택적 읽기 전용 문맥 훅 예시.
- [템플릿](templates/README.ko.md): 프로젝트 저장소에 복사할 문서와 설치형 스킬의 차이.
- [분류](docs/classification.ko.md): 스킬, 템플릿, 예시, 문서, 어댑터를 나누는 이유.
- [Superpowers 연동](docs/superpowers-integration.ko.md): 외부 작업 흐름 스킬과 함께 쓰는 기준.
- [구조화 플레이북 전환 기록](docs/changes/structured-playbook-cutover.ko.md): 레이아웃과 런타임 재정렬의 변경 내역.
- [0.5.4 forge 자동화 변경 기록](docs/changes/forge-automation-0.5.4.ko.md): 재개 가능한 실행, provider 대체 동작, 마이그레이션, 비활성화 지침.
- [0.5.5 사람 중심 Forge 협업 변경 기록](docs/changes/forge-human-coordination-0.5.5.ko.md): roadmap과 delivery-group 표시, Projects capability gate, 검토된 reconcile 마이그레이션.
- [0.5.6 Forge 권한 안내 변경 기록](docs/changes/forge-permission-guidance-0.5.6.ko.md): 쓰기 전 Projects 인증 복구, 중립 Project field, 기존 alias 호환성.
- [0.5.8 Forge 멱등 reconcile 변경 기록](docs/changes/forge-idempotent-reconcile-0.5.8.ko.md): provider 확인 no-op 제거, Project 수렴, 엄격한 legacy body 마이그레이션.
- [0.5.7 Forge reconcile 복구 변경 기록](docs/changes/forge-reconcile-recovery-0.5.7.ko.md): 중단된 supersede 복구, CAS 안전 순서, 오래된 Project item 정리.

## 라이선스

[MIT](../../LICENSE) 라이선스를 사용합니다.
