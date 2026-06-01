# Classification

이 저장소는 설치형 skill과 프로젝트 템플릿을 분리합니다.

## Codex 아래에 모두 두지 않는 이유

내용은 Codex 전용이 아닙니다. Codex는 설치 대상 중 하나입니다. 원본은 agent-agnostic하게 두고, 에이전트별 설정은 `adapters/`에서 다룹니다.

## Skill 분류

- `skills/engineering`: 대부분의 저장소에서 반복되는 엔지니어링 workflow.
- `skills/legacy`: runtime 결합과 호환성이 중요한 SI/레거시 유지보수 workflow.
- `skills/productivity`: 커뮤니케이션, 인수인계, 개인 workflow skill용. 현재는 향후 확장을 위해 예약합니다.

이 구조는 skill-first 저장소의 장점을 따릅니다. 큰 범주를 먼저 나누고, 그 안에 작고 조합 가능한 skill을 둡니다. `AGENTS.md` 템플릿은 skill이 아니라 프로젝트에 복사하는 자료이므로 `skills` 아래에 두지 않습니다.

새 category나 skill이 이 map을 바꾸면 `docs/maintenance.md`를 기준으로 `README.md`, 이 파일, 한국어 번역본, 설치된 skill 복사본을 함께 갱신합니다.

## 템플릿 분류

- `templates/agents`: 프로젝트 프로필별 root `AGENTS.md` 예시.
- `templates/local-ai`: planning, worklog, API boundary, style, FSD 기준 같은 선택적 project-local 문서.

## Process skill 호환성

이 저장소는 Superpowers 같은 process skill pack을 대체하지 않습니다. Process skill과 playbook skill을 어떻게 조합할지는 `docs/superpowers-integration.md`를 기준으로 판단합니다.

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
