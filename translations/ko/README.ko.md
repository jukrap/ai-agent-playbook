# AI Agent Playbook

## 언어 / Languages

- English (Canonical): [README.md](../../README.md)
- Korean (한국어): 이 문서

소프트웨어 유지보수와 개발 흐름에 재사용할 수 있는 에이전트 스킬, 프로젝트 템플릿, 작업 가이드 모음입니다. 이 저장소는 특정 에이전트에 종속되지 않습니다. Codex, Claude Code, 그 외 코딩 에이전트는 같은 원본을 사용할 수 있고, 에이전트별 설치 방식은 `adapters/`에서 다룹니다.

## 존재 이유

코딩 에이전트는 프로젝트 규칙을 추측하거나, 검증을 건너뛰거나, API 계약을 흐리거나, 레거시 시스템을 과하게 갈아엎을 때 자주 실패합니다. 이 playbook은 그런 반복되는 작업 원칙을 작고 명확하며 재사용 가능한 형태로 둡니다.

이 저장소는 [mattpocock/skills](https://github.com/mattpocock/skills) 같은 공개 스킬 중심 저장소와 큰 방향이 비슷합니다. 작고 조합 가능한 스킬을 사용 영역별로 묶고, 설정과 맥락을 위한 저장소 수준 문서를 둡니다. 차이점은 SI, 레거시, 혼합 스택 프로젝트에서 복사해 쓸 수 있는 프로젝트 템플릿도 함께 둔다는 점입니다.

## 저장소 구조

```text
skills/
  engineering/   여러 프로젝트에서 쓰는 엔지니어링 작업 흐름 스킬
  legacy/        SI와 레거시 시스템 유지보수 스킬
templates/
  agents/        루트 에이전트 지침 템플릿과 프로젝트 프로필
  local-ai/      선택적으로 복사하는 프로젝트 local-only 문서
examples/        작업 기록, 프롬프트, 인수인계 예시
translations/    사람이 읽는 번역본. 스킬 설치 대상이 아님
adapters/        에이전트별 설치 메모
docs/            분류와 공개 준비 문서
scripts/         검증과 로컬 동기화 스크립트
.github/         GitHub Actions 검증 작업 흐름
```

## 문서 지도

- [저장소 작업 규칙](AGENTS.ko.md): 이 저장소를 수정하는 에이전트를 위한 유지보수 규칙.
- [저장소 맥락](CONTEXT.ko.md): playbook의 핵심 용어와 설계 의도.
- [설치](docs/installation.ko.md): 첫 설치, 기존 clone 업데이트, 사용자 지정 스킬 경로, Codex 재시작 기준.
- [Codex adapter](adapters/codex/README.ko.md): Codex 기준 로컬 동기화 방식.
- [템플릿](templates/README.ko.md): 프로젝트 저장소에 복사할 문서와 설치형 스킬의 차이.
- [분류](docs/classification.ko.md): skills, templates, examples, docs, adapters를 나누는 이유.
- [Superpowers 연동](docs/superpowers-integration.ko.md): Superpowers 계열 작업 흐름 스킬과 함께 쓰는 기준.
- [Project memory 재설계 메모](docs/project-memory-redesign.ko.md): 에이전트용 프로젝트 문서를 더 선명하게 나누기 위한 계획 메모.
- [유지보수 작업 흐름](docs/maintenance.ko.md): 내용을 추가하거나 바꿀 때 함께 갱신할 항목.
- [번역 정책](docs/translation-policy.ko.md): 영어 원문과 한국어 번역본 관리 규칙.
- [공개 체크리스트](docs/publishing-checklist.ko.md): private GitHub 설정과 공개 전 위생 점검.

## 권장 사용법

### 1. 재사용 스킬 설치

**구체적인 설치 절차는 [설치](docs/installation.ko.md)에서 시작합니다.** 첫 설치, 기존 clone 업데이트, 사용자 지정 스킬 경로, Codex 재시작 기준을 함께 다룹니다.

기본 설치 요약:

```powershell
.\install.ps1
```

Installer는 저장소를 검증한 뒤 모든 `skills/<category>/<skill>/SKILL.md` 폴더를 일반적인 로컬 에이전트 스킬 디렉터리에 복사합니다.

기존 clone을 나중에 업데이트할 때는:

```powershell
.\update.ps1
```

### 2. 작업 흐름 스킬과 함께 사용

이 playbook은 Superpowers 계열 작업 흐름 스킬과 함께 사용할 수 있습니다. 계획, 디버깅, TDD, 검증, 브랜치 마무리는 작업 흐름 스킬이 이끌게 하고, 이 playbook은 저장소별 보호 규칙과 재사용 가능한 프로젝트 규칙을 보강하는 데 사용합니다. 자세한 내용은 [Superpowers 연동](docs/superpowers-integration.ko.md)을 봅니다.

### 3. 프로젝트 템플릿 복사

설치형 스킬과 프로젝트에 복사하는 템플릿의 차이는 [템플릿](templates/README.ko.md)을 봅니다.

먼저 `templates/agents/global` 아래의 작은 루트 템플릿을 고릅니다.

- `templates/agents/global/AGENTS.md`: 모든 저장소의 기본값.
- `templates/agents/global/SKILLS.md`: 프로젝트별 스킬 선택 정책.
- `templates/agents/global/GIT.md`: 휴대 가능한 커밋/PR 정책.

그 다음 프로젝트 기술 스택이 확인되면 profile 하나를 병합합니다.

- `templates/agents/profiles/react-vite-fsd/AGENTS.md`: pragmatic FSD를 쓰는 React/Vite/TypeScript 프로젝트.
- `templates/agents/profiles/react-native-expo/AGENTS.md`: Expo와 React Native.
- `templates/agents/profiles/legacy-*`: SI와 레거시 프로필.

그 다음 프로젝트에 필요한 `templates/local-ai` 문서만 추가합니다.

### 4. 원본과 설치본 분리

- Source of truth: 이 저장소.
- Installed copies: 로컬 에이전트 스킬 디렉터리.
- Agent-specific notes: `adapters/`.

설치본을 원본처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 다시 동기화합니다.

### 5. 유지보수 작업 흐름으로 확장

스킬, 템플릿, 예시, 번역, adapter note를 추가하거나 바꿀 때는 [유지보수 작업 흐름](docs/maintenance.ko.md)을 따릅니다. 이 문서는 함께 갱신해야 하는 색인, 번역, 검증 스크립트, 설치된 스킬 복사본을 정리합니다.

## 스킬 분류

### Engineering

- `agent-skill-authoring`: 재사용 가능한 에이전트 스킬을 만들고, 검토하고, 정리합니다.
- `repo-onboarding`: 프로젝트별 가정을 하기 전에 저장소를 먼저 파악합니다.
- `project-doc-system`: AGENTS, 프로젝트 명세, 계획, 로컬 문서, 작업 기록을 정리합니다.
- `commit-worklog-guardrails`: stage, commit, push, PR, 작업 기록을 안전하게 처리합니다.
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

- 공개 전에 추가한 내용은 [유지보수 작업 흐름](docs/maintenance.ko.md)을 기준으로 확인합니다.
- 개인 경로, 회사명, 자격증명, 날짜가 박힌 branch/PR reference를 확인합니다.
- 모든 `SKILL.md`를 검증합니다.
- 번역 안전성과 coverage를 검증합니다.
- 저장소를 push한 뒤 `.github/workflows/validate.yml`이 통과하는지 확인합니다.
- 프로필이 명시하지 않은 기술 스택, package manager, 작업 흐름을 템플릿이 단정하지 않는지 확인합니다.
- 위생 검사와 검증이 통과할 때까지 GitHub 저장소를 private으로 유지합니다.
- [MIT 라이선스](../../LICENSE)가 포함되어 있는지 확인합니다.
- 공개 후 [Codex adapter](adapters/codex/README.ko.md)에 저장소 URL을 반영합니다.

`jukrap` 계정의 private GitHub 저장소로 올릴 때는 저장소 로컬 Git 설정을 사용하는 첫 push 명령을 [공개 체크리스트](docs/publishing-checklist.ko.md)에서 확인합니다.

## 번역 정책

영어 파일이 기준 원본이며 에이전트 설치 대상은 영어 파일뿐입니다. 한국어 번역본은 사람이 읽고 검토하기 위한 자료로 `translations/ko` 아래에 둡니다. 번역된 스킬 문서를 로컬 스킬 디렉터리에 복사하지 않습니다.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
```

## 관리자와 라이선스

[jukrap](https://github.com/jukrap)이 관리합니다. [MIT](../../LICENSE) 라이선스를 사용합니다.
