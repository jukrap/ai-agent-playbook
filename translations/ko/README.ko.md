<p align="center">
  <img src="../../docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  실제 소프트웨어 저장소에서 조심스럽게 일해야 하는 AI 에이전트를 위한 실용적인 재사용 플레이북입니다.
</p>

<p align="center">
  <a href="../../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/ai-agent-playbook"><img alt="npm package" src="https://img.shields.io/npm/v/ai-agent-playbook?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="PowerShell installer" src="https://img.shields.io/badge/installer-PowerShell-f08c00?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## 언어 / Languages

- English (canonical): [README.md](../../README.md)
- Korean (한국어): 이 문서

## 이 저장소는 무엇인가

AI Agent Playbook은 재사용 가능한 에이전트 스킬, 프로젝트 템플릿, 프로젝트 메모리 가이드, 의존성이 적은 런타임 CLI를 함께 제공하는 저장소입니다.

코딩 에이전트가 추측을 줄이도록 돕습니다. 저장소를 먼저 살피고, 로컬 규칙을 존중하고, API 경계를 흐리지 않고, 쓸모 있는 작업 기록을 남기고, 완료를 말하기 전에 검증하도록 유도합니다.

이 저장소는 특정 에이전트에 종속되지 않습니다. Codex, Claude Code, 그 외 코딩 에이전트는 같은 원본을 사용할 수 있고, 에이전트별 설치 방식은 `adapters/`에서 분리해 다룹니다.

이 저장소는 slash command 묶음, Codex plugin, 자동 실행 에이전트가 아닙니다. 기본 방식은 operator-in-the-loop입니다. 사람 또는 에이전트가 CLI를 명시적으로 실행하고, dry-run 결과를 검토한 뒤 파일을 쓸지 선택합니다.

## 제공하는 것

| 구성             | 역할                                                                                            | 위치               |
| ---------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| 재사용 스킬      | 온보딩, 문서화, 품질, Git, 메타 작업, 레거시 시스템을 위한 상황 중심 작업 가이드입니다.         | `skills/`          |
| 프로젝트 템플릿  | 복사해서 쓸 수 있는 루트 에이전트 규칙, 스택 프로필, 프로젝트 메모리 파일입니다.                | `templates/`       |
| 런타임 하네스    | `.ai-playbook/` 생성, 상태 점검, hook context, 계획, 작업 기록 관리를 위한 작은 CLI입니다.       | `bin/`, `src/`     |
| 사람이 읽는 문서 | 설치, 분류, 유지보수, 공개 준비, 번역 정책 문서입니다.                                          | `docs/`            |
| 번역             | 영어 원본을 따라가는 한국어 읽기용 문서입니다.                                                  | `translations/ko/` |
| 에이전트 어댑터  | 특정 에이전트 환경별 설정 메모입니다.                                                           | `adapters/`        |

## 빠른 시작

패키지는 [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook)으로 배포되어 있습니다. 한 번만 실행할 때는 `npx`를 쓰고, 짧은 `ai-playbook` 명령이 필요하면 전역 설치를 사용합니다.

전체 설정, 업데이트, 정리 가이드는 [설치, 업데이트, 삭제](docs/installation.ko.md)를 봅니다.

### 1. CLI 실행 방식 선택

대부분의 사용자는 `npx`로 시작하는 편이 좋습니다. 현재 프로젝트나 전역 npm 위치에 이 패키지를 추가하지 않고 실행할 수 있기 때문입니다.

`npm i`는 `npm install`의 짧은 별칭입니다. 중요한 차이는 `-g`, `-D`, 또는 아무 옵션도 붙이지 않는지입니다.

| 상황 | 명령 | 의미 |
| ---- | ---- | ---- |
| 한 번 써보거나 가끔 실행 | `npx ai-agent-playbook --help` | npm을 통해 해당 명령에 필요한 패키지를 받아 실행합니다. |
| 어느 디렉터리에서든 `ai-playbook` 사용 | `npm install -g ai-agent-playbook` | 전역 CLI를 설치한 뒤 `ai-playbook --help`로 실행합니다. |
| 한 프로젝트에 도구 버전 고정 | `npm install -D ai-agent-playbook` | 해당 프로젝트의 `node_modules`에 추가하고 `npx ai-playbook ...`으로 실행합니다. |
| 이 저장소 clone에서 직접 실행 | `node .\bin\ai-playbook.mjs --help` | checkout된 원본을 직접 실행합니다. |
| 그냥 `npm install ai-agent-playbook` | 보통 첫 선택지는 아님 | 현재 프로젝트에 패키지를 설치하지만, 스킬 설치나 `.ai-playbook/` 생성은 하지 않습니다. |

npm 패키지 설치와 playbook 내용 설치는 별도 단계입니다. `npm install`은 도구를 설치합니다. `skills install`은 재사용 스킬을 사용자 스킬 루트에 복사합니다. `bootstrap`은 대상 프로젝트에 playbook을 씁니다.

### 2. 재사용 스킬 설치

재사용 가능한 에이전트 스킬만 로컬에서 쓰고 싶고, 대상 프로젝트에 하네스를 적용하지 않을 때 사용합니다.

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
```

설치 명령은 패키지 안의 모든 `skills/<category>/<skill>/SKILL.md` 폴더를 일반적인 로컬 스킬 디렉터리에 복사합니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`: 레거시 스킬용

설치 후 새 스킬 메타데이터를 읽도록 Codex를 재시작하거나 새 에이전트 세션을 시작합니다.

로컬 checkout에서 작업한다면 `node .\bin\ai-playbook.mjs skills install`을 사용하거나 호환용 `.\install.ps1` 스크립트를 사용할 수 있습니다.

### 3. 재사용 스킬 업데이트 또는 삭제

```powershell
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

`skills update`는 반복 실행해도 안전합니다. 관리 중인 스킬을 갱신하고, 기존 내용이 일치하는 복사본은 관리 대상으로 편입하며, 로컬에서 수정된 관리 대상 스킬은 `--force-managed`가 없으면 덮어쓰지 않습니다.

이 playbook이 설치한 관리 대상 스킬을 제거하려면:

```powershell
npx ai-agent-playbook skills uninstall --dry-run
npx ai-agent-playbook skills uninstall
```

짧은 전역 명령이 필요하면:

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
ai-playbook skills update
```

전역 CLI 업데이트 또는 삭제:

```powershell
npm install -g ai-agent-playbook@latest
npm uninstall -g ai-agent-playbook
```

`npm uninstall -g ai-agent-playbook`은 전역 CLI 패키지만 제거합니다. 이미 `%USERPROFILE%\.codex\skills` 또는 `%USERPROFILE%\.agents\skills`에 복사된 스킬은 삭제하지 않습니다. 스킬 삭제에는 `skills uninstall`을 사용합니다.

### 4. 필요할 때 프로젝트 하네스 적용

대상 프로젝트에 루트 `AGENTS.md` bootstrap과 `.ai-playbook/` 프로젝트 메모리 폴더를 넣어야 할 때만 런타임 CLI를 사용합니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook doctor <target-project>
npx ai-agent-playbook operator check <target-project> --path src/example.ts --json
npx ai-agent-playbook operator search <target-project> --query "auth flow" --path src/example.ts --json
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook adapter config <target-project> --adapter codex --json
```

전역 설치 후에는 `npx ai-agent-playbook`을 `ai-playbook`으로 바꿔 실행합니다. 로컬 checkout에서는 `node .\bin\ai-playbook.mjs`로 바꿔 실행합니다.

대상 프로젝트의 `.ai-playbook/` 폴더를 Git에서 제외해야 하면 `--local-only`를 사용합니다. `--profile <name>`은 대상 스택이 확인된 뒤에만 사용합니다.

이미 `ai-playbook/`을 가진 프로젝트는 `.ai-playbook/`이 없을 때 레거시 레이아웃으로 계속 동작하지만, 새 bootstrap 결과는 `.ai-playbook/`을 사용합니다. 레거시 경로를 `.ai-playbook/` 경로로 옮기기 전에는 `migrate path --json`으로 먼저 preview합니다.

Runtime hook과 plugin은 기본 설치 경로에 포함되지 않습니다. 문서와 CLI 하네스가 안정된 뒤 선택적으로 확장합니다. Codex와 Claude Code adapter에는 read-only context hook 예시, read-only `adapter config` renderer, read-only `adapter check` self-check가 있지만 자동 설치되지 않습니다. [런타임 로드맵](docs/runtime-roadmap.ko.md)을 봅니다.

Managed project harness 명령은 `.ai-playbook/.ai-agent-playbook-install.json`으로 이 playbook이 복사한 파일을 추적합니다. 정리 전에는 `managed check`를 사용하고, `managed catalog`로 소유 파일을 종류와 상태별로 검토합니다. 기존 내용이 일치하는 설치본은 `managed adopt`로 편입합니다. 선택한 수정되지 않은 관리 파일 제거 preview에는 `managed prune`을, 전체 수정되지 않은 관리 파일 제거 preview에는 `managed uninstall`을 사용합니다. `managed adopt`, `managed prune`, `managed uninstall`은 `--apply`가 있을 때만 파일을 씁니다.

운영자 진단 명령은 사용자가 명시적으로 실행합니다. 더 강한 runtime automation을 추가하기 전에는 아래 명령으로 사람이 먼저 상태를 확인합니다.

- `operator check`: doctor, guide freshness, 로컬 검증 명령 후보, rule matching을 한 번에 보는 사람 중심 checkpoint입니다.
- `operator search`: 관련 source, playbook, rules, plans, worklogs를 찾는 로컬 프로젝트 탐색 명령입니다.
- `operator context`: path-scoped playbook context와 rule match를 미리 보여줍니다.
- `operator map`: stack, architecture, quality, concern signal을 분석 파일 작성 없이 요약합니다.
- `operator audit`: 파일을 쓰지 않고 playbook link, orphan context glob, duplicate note, legacy path drift, managed manifest drift를 확인합니다.
- `operator gc`: obsolete unmodified managed playbook file을 preview-first로 정리하며 `--apply`가 있을 때만 파일을 씁니다.
- `rules check`, `diagnostics check`, `qa tui-check`: 적용 rule, 검증 명령 후보, 터미널/CJK layout risk를 확인합니다.

## 평소 작업 흐름

```text
npx 또는 global install
  -> skills install 또는 update
  -> 에이전트 재시작
  -> 대상 프로젝트 점검
  -> 프로젝트에 로컬 playbook file이 필요할 때만 .ai-playbook/ bootstrap
  -> operator check/search와 managed cleanup을 명시적으로 실행
```

기존 프로젝트에서는 먼저 dry run을 실행하고 충돌을 확인한 뒤 파일을 씁니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only --dry-run
npx ai-agent-playbook guides sync <target-project> --dry-run
npx ai-agent-playbook guides sync <target-project> --check --diff --json
npx ai-agent-playbook migrate path <target-project> --json
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook operator search <target-project> --query "auth flow" --json
npx ai-agent-playbook operator context <target-project> --path src/example.ts --json
npx ai-agent-playbook operator map <target-project> --json
npx ai-agent-playbook operator audit <target-project> --json
npx ai-agent-playbook operator gc <target-project> --json
```

## 저장소 지도

```text
bin/                  ai-playbook CLI 진입점
src/                  CLI 런타임 구현
skills/
  project/            bootstrap, onboarding, project-memory 스킬
  quality/            API boundary와 UI quality 스킬
  git/                commit, PR, push, worklog 스킬
  meta/               skill-authoring 스킬
  legacy/             legacy-system maintenance 스킬
templates/
  agents/             루트 에이전트 지침 템플릿과 프로젝트 profile
  codex-home/         선택적 개인 Codex home AGENTS.md 템플릿
  project-playbook/   복사용 ai-playbook project-memory 템플릿
examples/             worklog, prompt, handoff 예시
translations/         사람이 읽는 번역본. 스킬 설치 대상이 아님
adapters/             에이전트별 설치 메모와 선택적 hook PoC
docs/                 분류, 설치, 공개, 유지보수 문서
docs/assets/          README와 문서용 이미지
scripts/              검증과 로컬 동기화 helper
test/                 Node CLI와 adapter 테스트
.github/              GitHub Actions 검증 workflow
```

## 스킬 카탈로그

각 `SKILL.md`는 짧고 상황 중심으로 유지합니다. 더 긴 재사용 상세 내용은 `references/`에 둡니다.

| 분류 | 스킬 | 언제 쓰는가 |
| ---- | ---- | ----------- |
| Project | `project-bootstrap` | 새 프로젝트 시작, 기존 저장소 인수, 프로젝트 메모리와 루트 에이전트 지침 설정. |
| Project | `repo-onboarding` | 낯선 저장소에서 아키텍처, 도구, 수정 방향, 작업 흐름을 답하기 전에 먼저 살필 때. |
| Project | `project-doc-system` | 프로젝트 AI 문서, map, runbook, decision, plan, worklog를 만들거나 재정리할 때. |
| Quality | `api-contract-boundary` | 프론트엔드/백엔드 계약, DTO, mock, payload, adapter를 구현·디버깅·검토할 때. |
| Quality | `ui-style-policy` | 저장소 UI 스타일 정책을 선택, 문서화, 강제할 때. |
| Quality | `style-quality-review` | UI 스타일, 반응형 동작, 레이아웃 넘침, 시각적 회귀를 검토하거나 개선할 때. |
| Git | `commit-worklog-guardrails` | staging, commit, push, PR, release note, worklog를 다룰 때. |
| Meta | `agent-skill-authoring` | 재사용 agent skill과 reference를 만들거나 검토·재정리할 때. |
| Legacy | `legacy-general` | 흐름이 불명확하고 결합이 숨겨져 있거나 test/documentation이 약한 레거시 코드를 유지보수할 때. |
| Legacy | `legacy-risk-check` | 공유 상태, CSS/JS, selector, template, form, API, build, deploy에 영향을 줄 수 있는 레거시 변경 전. |
| Legacy | `legacy-feature-addition` | 주변 architecture를 다시 쓰지 않고 동작, 화면, 필드, 규칙, integration을 추가할 때. |
| Legacy | `legacy-jquery-web` | jQuery, plugin, direct DOM, global script, AJAX callback, script order coupling을 유지보수할 때. |
| Legacy | `legacy-server-rendered-web` | template, controller, form post, server validation, session, layout, partial을 유지보수할 때. |
| Legacy | `legacy-php-lamp` | include, session, mixed HTML/PHP, direct SQL, global, shared hosting 제약이 있는 PHP/LAMP를 유지보수할 때. |
| Legacy | `legacy-java-spring-mvc` | Spring MVC, JSP, Servlet, MyBatis, WAR, XML config, server-rendered Java app을 유지보수할 때. |
| Legacy | `legacy-dotnet-webforms` | ASP.NET Web Forms, .NET Framework, code-behind, ViewState, Web.config, IIS를 유지보수할 때. |
| Legacy | `legacy-android-webview-hybrid` | Android WebView, web asset, JavaScript bridge, permission, device API를 유지보수할 때. |
| Legacy | `legacy-ie-activex-compat` | IE mode, ActiveX, old browser API, compatibility constraint가 필요한 intranet system을 유지보수할 때. |
| Legacy | `legacy-database-heavy-system` | stored procedure, trigger, view, direct SQL, scheduled job처럼 데이터베이스에 강하게 묶인 업무 규칙을 유지보수할 때. |
| Legacy | `legacy-reporting-printing` | report, print preview, PDF/Excel export, label, barcode, invoice, printer-specific flow를 유지보수할 때. |
| Legacy | `legacy-batch-file-transfer` | scheduled batch, cron, Windows Task Scheduler, CSV/Excel import/export, SFTP, file drop을 유지보수할 때. |

## 문서

- [저장소 작업 규칙](AGENTS.ko.md): 이 저장소를 수정하는 에이전트를 위한 유지보수 규칙.
- [저장소 맥락](CONTEXT.ko.md): playbook의 핵심 용어와 설계 의도.
- [설치, 업데이트, 삭제](docs/installation.ko.md): npm/npx 사용, 전역 CLI 설정, skill lifecycle, project bootstrap, cleanup, legacy PowerShell 경로.
- [런타임 하네스](docs/harness-runtime.ko.md): CLI 명령, JSON 계약, 덮어쓰기 정책, 대상 프로젝트 적용 흐름.
- [런타임 로드맵](docs/runtime-roadmap.ko.md): 단계적 강화 계획과 선택적 hook layer 경계.
- [Codex 어댑터](adapters/codex/README.ko.md): Codex 기준 로컬 동기화 방식과 Windows용 Codex App 작업 흐름.
- [Claude Code 어댑터](adapters/claude-code/README.ko.md): Claude Code 설정 메모와 선택적 read-only context hook 예시.
- [템플릿](templates/README.ko.md): 프로젝트 저장소에 복사할 문서와 설치형 스킬의 차이.
- [분류](docs/classification.ko.md): skills, templates, examples, docs, adapters를 나누는 이유.
- [Superpowers 연동](docs/superpowers-integration.ko.md): 외부 작업 흐름 스킬과 함께 쓰는 기준.
- [유지보수 작업 흐름](docs/maintenance.ko.md): 내용을 추가하거나 바꿀 때 함께 갱신할 항목.
- [번역 정책](docs/translation-policy.ko.md): 영어 원문과 한국어 번역본 관리 규칙.
- [공개 체크리스트](docs/publishing-checklist.ko.md): 공개 전 위생 점검.

## 유지보수 검증

저장소 편집이 끝났다고 말하기 전에 프로젝트에서 정한 검증을 실행합니다.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
```

소스 편집 뒤 설치된 로컬 복사본을 갱신해야 하면 아래를 실행합니다.

```powershell
.\scripts\sync-skills.ps1
```

## 공개 준비 메모

- 영어 원문 파일이 기준 원본입니다.
- 영어 원문을 바꾸면 같은 변경에서 한국어 번역도 갱신합니다.
- 개인 절대 경로, 회사명, credential, 내부 URL, branch name, PR number를 커밋하지 않습니다.
- 설치된 스킬 복사본을 원본처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 동기화합니다.
- profile이 명시하지 않은 stack, package manager, workflow를 template이 단정하지 않는지 확인합니다.

## 라이선스

[MIT](../../LICENSE) 라이선스를 사용합니다.
