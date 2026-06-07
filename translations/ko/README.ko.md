# AI Agent Playbook

## 언어 / Languages

- English (Canonical): [README.md](../../README.md)
- Korean (한국어): 이 문서

소프트웨어 유지보수와 개발 흐름에 재사용할 수 있는 에이전트 스킬, 프로젝트 템플릿, 프로젝트 메모리 가이드 모음입니다. 이 저장소는 특정 에이전트에 종속되지 않습니다. Codex, Claude Code, 그 외 코딩 에이전트는 같은 원본을 사용할 수 있고, 에이전트별 설치 방식은 `adapters/`에서 다룹니다.

## 존재 이유

코딩 에이전트는 프로젝트 규칙을 추측하거나, 검증을 건너뛰거나, API 계약을 흐리거나, 세션 사이에 맥락을 잃거나, 레거시 시스템을 과하게 갈아엎을 때 자주 실패합니다. 이 playbook은 그런 반복되는 작업 원칙을 작고 명확하며 재사용 가능한 형태로 둡니다.

이 저장소는 단순한 스킬 모음이 아닙니다. 아래를 함께 제공하는 하네스입니다.

- 재사용 스킬 설치
- 프로젝트 루트 에이전트 정책 복사
- `ai-playbook/` 프로젝트 메모리 생성
- map, runbook, decision, plan, worklog를 계속 유용하게 유지

## 저장소 구조

```text
skills/
  engineering/         여러 프로젝트에서 쓰는 엔지니어링 작업 흐름 스킬
  legacy/              레거시 시스템 유지보수 스킬
templates/
  agents/              루트 에이전트 지침 템플릿과 프로젝트 프로필
  project-playbook/    ai-playbook 프로젝트 메모리 템플릿
examples/              작업 기록, 프롬프트, 인수인계 예시
translations/          사람이 읽는 번역본. 스킬 설치 대상이 아님
adapters/              에이전트별 설치 메모
docs/                  분류, 설치, 공개 준비 문서
scripts/               검증과 로컬 동기화 스크립트
.github/               GitHub Actions 검증 작업 흐름
```

## 문서 지도

- [저장소 작업 규칙](AGENTS.ko.md): 이 저장소를 수정하는 에이전트를 위한 유지보수 규칙.
- [저장소 맥락](CONTEXT.ko.md): playbook의 핵심 용어와 설계 의도.
- [설치](docs/installation.ko.md): 첫 설치, 기존 clone 업데이트, 사용자 지정 스킬 경로, Codex 재시작 기준.
- [Codex adapter](adapters/codex/README.ko.md): Codex 기준 로컬 동기화 방식.
- [템플릿](templates/README.ko.md): 프로젝트 저장소에 복사할 문서와 설치형 스킬의 차이.
- [분류](docs/classification.ko.md): skills, templates, examples, docs, adapters를 나누는 이유.
- [Superpowers 연동](docs/superpowers-integration.ko.md): 외부 작업 흐름 스킬과 함께 쓰는 기준.
- [유지보수 작업 흐름](docs/maintenance.ko.md): 내용을 추가하거나 바꿀 때 함께 갱신할 항목.
- [번역 정책](docs/translation-policy.ko.md): 영어 원문과 한국어 번역본 관리 규칙.
- [공개 체크리스트](docs/publishing-checklist.ko.md): 공개 전 위생 점검.

## 권장 사용법

### 1. 재사용 스킬 설치

구체적인 설치 절차는 [설치](docs/installation.ko.md)에서 시작합니다.

기본 설치 요약:

```powershell
.\install.ps1
```

Installer는 저장소를 검증한 뒤 모든 `skills/<category>/<skill>/SKILL.md` 폴더를 일반적인 로컬 에이전트 스킬 디렉터리에 복사합니다.

기존 clone을 나중에 업데이트할 때는:

```powershell
.\update.ps1
```

### 2. 루트 프로젝트 정책 복사

먼저 `templates/agents/global` 아래의 작은 루트 템플릿을 고릅니다.

- `AGENTS.md`: 기본 작업 합의.
- `SKILLS.md`: 프로젝트별 스킬 선택 정책.
- `GIT.md`: 휴대 가능한 커밋/PR 정책.

그 다음 프로젝트 기술 스택이 확인되면 profile 하나만 병합합니다.

- `templates/agents/profiles/react-vite-fsd/AGENTS.md`
- `templates/agents/profiles/react-native-expo/AGENTS.md`
- `templates/agents/profiles/legacy-*`

### 3. 프로젝트 메모리 추가

`templates/project-playbook/`을 대상 프로젝트에 `ai-playbook/`로 복사합니다.

`ai-playbook/`에는 현재 프로젝트 사실, map, runbook, decision, active plan, 상세 worklog, summary, archive를 둡니다. 이 폴더를 커밋할지 local-only로 둘지는 프로젝트마다 결정합니다.

### 4. 작업 흐름 스킬과 함께 사용

외부 작업 흐름 스킬은 계획, 디버깅, TDD, 검증, 브랜치 마무리를 이끌 수 있습니다. 이 playbook은 저장소별 보호 규칙, 프로젝트 메모리, API 경계, 스타일 정책, 레거시 위험 제어, Git 정책, worklog를 보강하는 데 사용합니다. 자세한 내용은 [Superpowers 연동](docs/superpowers-integration.ko.md)을 봅니다.

### 5. 원본과 설치본 분리

- Source of truth: 이 저장소.
- 설치된 복사본: 로컬 에이전트 스킬 디렉터리.
- 에이전트별 메모: `adapters/`.

설치본을 원본처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 다시 동기화합니다.

## 스킬 분류

### Engineering

- `agent-skill-authoring`: 재사용 가능한 에이전트 스킬을 만들고, 검토하고, 정리합니다.
- `project-bootstrap`: 루트 에이전트 정책과 `ai-playbook/` 프로젝트 메모리를 설정합니다.
- `repo-onboarding`: 프로젝트별 가정을 하기 전에 저장소를 먼저 파악합니다.
- `project-doc-system`: 에이전트 문서, 프로젝트 메모리, plan, map, runbook, worklog를 정리합니다.
- `commit-worklog-guardrails`: stage, commit, push, PR, worklog를 안전하게 처리합니다.
- `api-contract-boundary`: frontend/backend 불확실성을 API boundary에 가둡니다.
- `ui-style-policy`: 저장소 UI 스타일 정책을 선택하고 문서화합니다.
- `style-quality-review`: 제품 의도를 바꾸지 않고 UI style quality를 개선합니다.

### Legacy

- General: `legacy-general`, `legacy-feature-addition`, `legacy-risk-check`.
- Web: `legacy-jquery-web`, `legacy-server-rendered-web`, `legacy-php-lamp`, `legacy-java-spring-mvc`, `legacy-dotnet-webforms`.
- Platform constraints: `legacy-android-webview-hybrid`, `legacy-ie-activex-compat`.
- Operational integrations: `legacy-database-heavy-system`, `legacy-reporting-printing`, `legacy-batch-file-transfer`.

## 공개 전 체크리스트

- 공개 전에 추가한 내용은 [유지보수 작업 흐름](docs/maintenance.ko.md)을 기준으로 확인합니다.
- 개인 경로, 이름, 자격증명, 내부 URL, 날짜가 박힌 branch/PR reference를 확인합니다.
- 모든 `SKILL.md`를 검증합니다.
- 번역 안전성과 coverage를 검증합니다.
- 프로필이 명시하지 않은 기술 스택, package manager, 작업 흐름을 템플릿이 단정하지 않는지 확인합니다.
- [MIT 라이선스](../../LICENSE)가 포함되어 있는지 확인합니다.
- 공개 후 설치 예시에 최종 repository URL을 반영합니다.

## 번역 정책

영어 파일이 기준 원본이며 에이전트 설치 대상은 영어 파일뿐입니다. 한국어 번역본은 사람이 읽고 검토하기 위한 자료로 `translations/ko` 아래에 둡니다. 번역된 스킬 문서를 로컬 스킬 디렉터리에 복사하지 않습니다.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
```

## 라이선스

[MIT](../../LICENSE) 라이선스를 사용합니다.
