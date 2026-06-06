# Classification

이 저장소는 설치형 스킬과 프로젝트 템플릿을 분리합니다.

## Codex 아래에 모두 두지 않는 이유

내용은 Codex 전용이 아닙니다. Codex는 설치 대상 중 하나입니다. 원본은 특정 에이전트에 묶이지 않게 두고, 에이전트별 설정은 `adapters/`에서 다룹니다.

## 스킬 분류

- `skills/engineering`: 대부분의 저장소에서 반복되는 엔지니어링 작업 흐름.
- `skills/legacy`: 런타임 결합과 호환성이 중요한 SI/레거시 유지보수 작업 흐름.

이 구조는 스킬 중심 저장소의 장점을 따릅니다. 큰 범주를 먼저 나누고, 그 안에 작고 조합 가능한 스킬을 둡니다. `AGENTS.md` 템플릿은 스킬이 아니라 프로젝트에 복사하는 자료이므로 `skills` 아래에 두지 않습니다.

새 category는 그 category에 들어갈 첫 실제 스킬이 생겼을 때만 추가합니다. 새 category나 스킬이 이 지도를 바꾸면 `docs/maintenance.md`를 기준으로 `README.md`, 이 파일, 한국어 번역본, 설치된 스킬 복사본을 함께 갱신합니다.

## 템플릿 분류

- `templates/agents`: 작은 루트 수준 상시 지침 파일과 기술 스택별 `AGENTS.md` 프로필.
- `templates/local-ai`: 계획, 작업 기록, API 경계, 스타일 규칙, 구조 리뷰, FSD 기준 같은 선택적 프로젝트 로컬 문서.

`templates/agents/global/SKILLS.md`, `templates/agents/global/GIT.md` 같은 루트 수준 파일은 스킬로 호출되는 것이 아니라 프로젝트에 상시 지침으로 복사되므로 `templates/agents`에 둡니다.

## 작업 흐름 스킬 호환성

이 저장소는 Superpowers 같은 작업 흐름 스킬 묶음을 대체하지 않습니다. 작업 흐름 스킬과 playbook 스킬을 어떻게 조합할지는 `docs/superpowers-integration.md`를 기준으로 판단합니다.

## 스타일 정책 지도

- `style-quality-review`: 제품 의도를 유지하는 일반 UI 품질 리뷰.
- `design-system-first`: 공용 컴포넌트, 토큰, variant, design-system primitive가 styling을 먼저 맡습니다.
- `css-class-first`: stylesheet, CSS module, scoped CSS, semantic class가 프로젝트 규칙입니다.
- `utility-class-first`: Tailwind-style utility나 atomic class composition이 프로젝트 규칙입니다.
- `inline-style-first`: component-local inline style object를 명시적으로 선호합니다.

## 스킬 작성 지도

- `agent-skill-authoring`: 재사용 스킬 구조, 트리거 설명, 참고 문서, 스킬/템플릿 경계.

## 레거시 확장 맵

- `legacy-general`: 기본 레거시 유지보수 원칙.
- `legacy-risk-check`: 위험한 변경 전 숨은 영향 범위 확인.
- `legacy-feature-addition`: 주변 구조를 갈아엎지 않고 기능 추가.
- `legacy-jquery-web`: jQuery, plugin, 직접 DOM 조작 브라우저 페이지.
- `legacy-server-rendered-web`: 서버 템플릿, form, session, validation.
- `legacy-android-webview-hybrid`: native shell, WebView, bridge.
- `legacy-database-heavy-system`: stored procedure, trigger, direct SQL, DB 중심 업무 규칙.
- `legacy-java-spring-mvc`: Spring MVC, JSP, MyBatis, Servlet, WAR.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, ViewState, code-behind, IIS.
- `legacy-php-lamp`: PHP include/session/direct SQL 페이지.
- `legacy-ie-activex-compat`: IE mode, ActiveX, intranet browser/device 제약.
- `legacy-reporting-printing`: report, export, print, label, barcode, invoice 흐름.
- `legacy-batch-file-transfer`: scheduled batch, CSV/Excel/SFTP/file-drop integration.
