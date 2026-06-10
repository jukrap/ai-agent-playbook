<p align="center">
  <img src="../../docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  실제 소프트웨어 저장소 안에서 조심스럽게 일해야 하는 AI 에이전트를 위한 밝고 재사용 가능한 플레이북입니다.
</p>

<p align="center">
  <a href="../../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="PowerShell installer" src="https://img.shields.io/badge/installer-PowerShell-f08c00?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## 언어 / Languages

- English (canonical): [README.md](../../README.md)
- Korean (한국어): 이 문서

## 이건 뭐임?

AI Agent Playbook은 재사용 가능한 에이전트 스킬, 프로젝트 템플릿, 프로젝트 메모리 가이드, 의존성이 적은 런타임 CLI를 함께 둔 작은 책꽂이 같은 저장소입니다.

코딩 에이전트가 추측을 줄이도록 돕습니다. 저장소를 먼저 살피고, 로컬 규칙을 존중하고, API 경계를 흐리지 않고, 쓸모 있는 작업 기록을 남기고, 완료를 말하기 전에 검증하도록 유도합니다.

이 저장소는 특정 에이전트에 종속되지 않습니다. Codex, Claude Code, 그 외 코딩 에이전트는 같은 원본을 사용할 수 있고, 에이전트별 설치 방식은 `adapters/`에서 분리해 다룹니다.

## 제공하는 것

| 구성             | 역할                                                                                            | 위치               |
| ---------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| 재사용 스킬      | onboarding, docs, quality, Git, meta work, legacy system을 위한 trigger 중심 작업 가이드입니다. | `skills/`          |
| 프로젝트 템플릿  | 복사 가능한 루트 에이전트 규칙, stack profile, project-memory 파일입니다.                       | `templates/`       |
| 런타임 하네스    | `ai-playbook/` bootstrap, health check, hook context, plan, worklog 관리를 위한 작은 CLI입니다. | `bin/`, `src/`     |
| 사람이 읽는 문서 | 설치, 분류, 유지보수, 공개 준비, 번역 정책 문서입니다.                                          | `docs/`            |
| 번역             | 영어 원본을 따라가는 한국어 읽기용 문서입니다.                                                  | `translations/ko/` |
| 에이전트 어댑터  | 특정 에이전트 환경별 설정 메모입니다.                                                           | `adapters/`        |

## 빠른 시작

### 1. 스킬만 설치

재사용 가능한 에이전트 스킬만 로컬에서 쓰고 싶고, 대상 프로젝트에 하네스를 적용하지 않을 때 사용합니다.

```powershell
.\install.ps1
```

설치 스크립트는 이 저장소를 검증한 뒤 모든 `skills/<category>/<skill>/SKILL.md` 폴더를 일반적인 로컬 스킬 디렉터리에 복사합니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`: legacy 스킬용

설치 후 새 스킬 metadata를 읽도록 Codex를 재시작하거나 새 에이전트 세션을 시작합니다.

### 2. 기존 설치 업데이트

```powershell
.\update.ps1
```

업데이트 스크립트는 현재 checkout을 `--ff-only`로 가져온 뒤 저장소를 검증하고 관리 중인 설치 스킬을 동기화합니다.

### 3. 필요할 때 프로젝트 하네스 적용

대상 프로젝트에 루트 `AGENTS.md` bootstrap과 `ai-playbook/` project-memory 폴더를 넣어야 할 때만 런타임 CLI를 사용합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-project>
node .\bin\ai-playbook.mjs doctor <target-project>
node .\bin\ai-playbook.mjs doctor <target-project> --json
node .\bin\ai-playbook.mjs context <target-project> --json
node .\bin\ai-playbook.mjs adapter check <target-project> --adapter codex --json
```

대상 프로젝트의 `ai-playbook/` 폴더를 Git에서 제외해야 하면 `--local-only`를 사용합니다. `--profile <name>`은 대상 stack이 확인된 뒤에만 사용합니다.

Runtime hook과 plugin은 기본 설치 경로에 포함되지 않습니다. 문서와 CLI 하네스가 안정된 뒤 선택적으로 확장합니다. Codex와 Claude Code adapter에는 read-only context hook 예시와 read-only `adapter check` self-check가 있지만 자동 설치되지 않습니다. [런타임 로드맵](docs/runtime-roadmap.ko.md)을 봅니다.

## 평소 작업 흐름

```text
Clone once
  -> install skills
  -> restart the agent
  -> inspect a target project
  -> optionally bootstrap ai-playbook/
  -> plan, worklog, verify, and hand off with consistent paths
```

기존 프로젝트에서는 먼저 dry run을 실행하고 충돌을 확인한 뒤 파일을 씁니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --local-only --dry-run
node .\bin\ai-playbook.mjs guides sync <target-project> --dry-run
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
  agents/             루트 에이전트 지침 템플릿과 project profile
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

## 스킬 책꽂이

| 분류    | 스킬                                                                                                                                                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project | `project-bootstrap`, `repo-onboarding`, `project-doc-system`                                                                                                                                                                                                                                                                                       |
| Quality | `api-contract-boundary`, `ui-style-policy`, `style-quality-review`                                                                                                                                                                                                                                                                                 |
| Git     | `commit-worklog-guardrails`                                                                                                                                                                                                                                                                                                                        |
| Meta    | `agent-skill-authoring`                                                                                                                                                                                                                                                                                                                            |
| Legacy  | `legacy-general`, `legacy-feature-addition`, `legacy-risk-check`, `legacy-jquery-web`, `legacy-server-rendered-web`, `legacy-php-lamp`, `legacy-java-spring-mvc`, `legacy-dotnet-webforms`, `legacy-android-webview-hybrid`, `legacy-ie-activex-compat`, `legacy-database-heavy-system`, `legacy-reporting-printing`, `legacy-batch-file-transfer` |

각 `SKILL.md`는 짧고 trigger 중심으로 유지합니다. 더 긴 재사용 상세 내용은 `references/`에 둡니다.

## 문서

- [저장소 작업 규칙](AGENTS.ko.md): 이 저장소를 수정하는 에이전트를 위한 유지보수 규칙.
- [저장소 맥락](CONTEXT.ko.md): playbook의 핵심 용어와 설계 의도.
- [설치](docs/installation.ko.md): 첫 설치, 기존 clone 업데이트, 사용자 지정 스킬 경로, Codex 재시작 기준.
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

- 영어 source file이 기준 원본입니다.
- 영어 source를 바꾸면 같은 변경에서 한국어 번역도 갱신합니다.
- 개인 절대 경로, 회사명, credential, 내부 URL, branch name, PR number를 커밋하지 않습니다.
- 설치된 skill copy를 source of truth처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 동기화합니다.
- profile이 명시하지 않은 stack, package manager, workflow를 template이 단정하지 않는지 확인합니다.

## 라이선스

[MIT](../../LICENSE) 라이선스를 사용합니다.
