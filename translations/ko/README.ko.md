# AI Agent Playbook

## 언어 / Languages

- English (Canonical): [README.md](../../README.md)
- Korean (한국어): 이 문서

소프트웨어 유지보수와 개발 흐름에 재사용할 수 있는 agent skill, 프로젝트 템플릿, 작업 가이드 모음입니다. 이 저장소는 특정 에이전트에 종속되지 않습니다. Codex, Claude Code, 그 외 코딩 에이전트는 같은 원본을 사용할 수 있고, 에이전트별 설치 방식은 `adapters/`에서 다룹니다.

## 존재 이유

코딩 에이전트는 프로젝트 규칙을 추측하거나, 검증을 건너뛰거나, API 계약을 흐리거나, 레거시 시스템을 과하게 갈아엎을 때 자주 실패합니다. 이 playbook은 그런 반복되는 작업 원칙을 작고 명확하며 재사용 가능한 형태로 둡니다.

이 저장소는 [mattpocock/skills](https://github.com/mattpocock/skills) 같은 공개 skill-first 저장소와 큰 방향이 비슷합니다. 작고 조합 가능한 skill을 사용 영역별로 묶고, setup과 context를 위한 repo-level docs를 둡니다. 차이점은 SI, 레거시, 혼합 스택 프로젝트에서 복사해 쓸 수 있는 프로젝트 템플릿도 함께 둔다는 점입니다.

## 저장소 구조

```text
skills/
  engineering/   여러 프로젝트에서 쓰는 엔지니어링 workflow skill
  legacy/        SI와 레거시 시스템 유지보수 skill
templates/
  agents/        AGENTS.md 템플릿과 프로젝트 프로필
  local-ai/      선택적으로 복사하는 프로젝트 local-only 문서
examples/        worklog, prompt, handoff 예시
translations/    사람이 읽는 번역본. skill 설치 대상이 아님
adapters/        에이전트별 설치 메모
docs/            분류와 공개 준비 문서
scripts/         검증과 로컬 동기화 스크립트
.github/         GitHub Actions 검증 workflow
```

## 문서 지도

- [저장소 작업 규칙](AGENTS.ko.md): 이 저장소를 수정하는 agent를 위한 maintenance 규칙.
- [저장소 context](CONTEXT.ko.md): playbook의 핵심 용어와 설계 의도.
- [설치](docs/installation.ko.md): 첫 설치, 기존 clone 업데이트, custom skill path, Codex 재시작 기준.
- [Codex adapter](adapters/codex/README.ko.md): Codex 기준 로컬 동기화 방식.
- [템플릿](templates/README.ko.md): 프로젝트 저장소에 복사할 문서와 설치형 skill의 차이.
- [분류](docs/classification.ko.md): skills, templates, examples, docs, adapters를 나누는 이유.
- [Superpowers 연동](docs/superpowers-integration.ko.md): Superpowers 계열 process skill과 함께 쓰는 기준.
- [Maintenance workflow](docs/maintenance.ko.md): 내용을 추가하거나 바꿀 때 함께 갱신할 항목.
- [번역 정책](docs/translation-policy.ko.md): 영어 원문과 한국어 번역본 관리 규칙.
- [공개 체크리스트](docs/publishing-checklist.ko.md): private GitHub 설정과 공개 전 위생 점검.

## 권장 사용법

### 1. 재사용 skill 설치

**구체적인 설치 절차는 [설치](docs/installation.ko.md)에서 시작합니다.** 첫 설치, 기존 clone 업데이트, custom skill path, Codex 재시작 기준을 함께 다룹니다.

기본 설치 요약:

```powershell
.\install.ps1
```

Installer는 저장소를 검증한 뒤 모든 `skills/<category>/<skill>/SKILL.md` 폴더를 일반적인 로컬 agent skill 디렉터리에 복사합니다.

기존 clone을 나중에 업데이트할 때는:

```powershell
.\update.ps1
```

### 2. Process skill과 함께 사용

이 playbook은 Superpowers 계열 process skill과 함께 사용할 수 있습니다. Planning, debugging, TDD, verification, branch finishing은 process skill이 이끌게 하고, 이 playbook은 repository-specific guardrail과 reusable project rule을 보강하는 데 사용합니다. 자세한 내용은 [Superpowers 연동](docs/superpowers-integration.ko.md)을 봅니다.

### 3. 프로젝트 템플릿 복사

설치형 skill과 프로젝트에 복사하는 template의 차이는 [템플릿](templates/README.ko.md)을 봅니다.

먼저 `templates/agents` 프로필 하나를 고릅니다.

- `templates/agents/global/AGENTS.md`: 모든 저장소의 기본값.
- `templates/agents/profiles/react-vite-fsd/AGENTS.md`: pragmatic FSD를 쓰는 React/Vite/TypeScript 프로젝트.
- `templates/agents/profiles/react-native-expo/AGENTS.md`: Expo와 React Native.
- `templates/agents/profiles/legacy-*`: SI와 레거시 프로필.

그 다음 프로젝트에 필요한 `templates/local-ai` 문서만 추가합니다.

### 4. 원본과 설치본 분리

- Source of truth: 이 저장소.
- Installed copies: 로컬 agent skill 디렉터리.
- Agent-specific notes: `adapters/`.

설치본을 원본처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 다시 동기화합니다.

### 5. Maintenance workflow로 확장

Skill, template, example, translation, adapter note를 추가하거나 바꿀 때는 [Maintenance workflow](docs/maintenance.ko.md)를 따릅니다. 이 문서는 함께 갱신해야 하는 index, translation, validation script, 설치된 skill 복사본을 정리합니다.

## Skill categories

### Engineering

- `repo-onboarding`: 프로젝트별 가정을 하기 전에 저장소를 먼저 파악합니다.
- `project-doc-system`: AGENTS, project specs, plans, local docs, worklogs를 정리합니다.
- `commit-worklog-guardrails`: stage, commit, push, PR, worklog를 안전하게 처리합니다.
- `api-contract-boundary`: frontend/backend 불확실성을 API boundary에 가둡니다.
- `css-class-first`: stylesheet, CSS module, scoped CSS, semantic class convention을 따릅니다.
- `design-system-first`: custom styling 전에 shared UI component, token, variant를 재사용합니다.
- `inline-style-first`: 명시적인 component-local inline style convention을 따릅니다.
- `style-quality-review`: product intent를 바꾸지 않고 UI style quality를 개선합니다.
- `utility-class-first`: utility-first CSS 또는 Tailwind-style class convention을 따릅니다.

### Legacy

- General: `legacy-general`, `legacy-feature-addition`, `legacy-risk-check`.
- Web: `legacy-jquery-web`, `legacy-server-rendered-web`, `legacy-php-lamp`, `legacy-java-spring-mvc`, `legacy-dotnet-webforms`.
- Platform constraints: `legacy-android-webview-hybrid`, `legacy-ie-activex-compat`.
- Operational integrations: `legacy-database-heavy-system`, `legacy-reporting-printing`, `legacy-batch-file-transfer`.

## 공개 전 체크리스트

- 공개 전에 추가한 내용은 [Maintenance workflow](docs/maintenance.ko.md)를 기준으로 확인합니다.
- 개인 경로, 회사명, 자격증명, 날짜가 박힌 branch/PR reference를 확인합니다.
- 모든 `SKILL.md`를 검증합니다.
- 번역 안전성과 coverage를 검증합니다.
- repository를 push한 뒤 `.github/workflows/validate.yml`이 통과하는지 확인합니다.
- 프로필이 명시하지 않은 stack, package manager, workflow를 템플릿이 단정하지 않는지 확인합니다.
- 위생 검사와 검증이 통과할 때까지 GitHub repository를 private으로 유지합니다.
- [MIT 라이선스](../../LICENSE)가 포함되어 있는지 확인합니다.
- 공개 후 [Codex adapter](adapters/codex/README.ko.md)에 repository URL을 반영합니다.

`jukrap` 계정의 private GitHub repository로 올릴 때는 repository-local Git config를 사용하는 첫 push 명령을 [공개 체크리스트](docs/publishing-checklist.ko.md)에서 확인합니다.

## 번역 정책

영어 파일이 canonical 원본이며 agent 설치 대상은 영어 파일뿐입니다. 한국어 번역본은 사람이 읽고 검토하기 위한 자료로 `translations/ko` 아래에 둡니다. 번역된 skill 문서를 로컬 skill 디렉터리에 복사하지 않습니다.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
```

## 관리자와 라이선스

[jukrap](https://github.com/jukrap)이 관리합니다. [MIT](../../LICENSE) 라이선스를 사용합니다.
