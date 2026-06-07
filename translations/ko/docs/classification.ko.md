# 분류

이 저장소는 설치형 스킬, 복사용 템플릿, 예시, 문서, 어댑터를 분리합니다.

## 왜 한 에이전트 아래에 모두 두지 않는가

이 내용은 특정 에이전트 전용이 아닙니다. Codex는 설치 대상 중 하나일 뿐입니다. 원본은 에이전트에 독립적으로 유지하고, 에이전트별 설정은 `adapters/`에 둡니다.

## 스킬 분류

- `skills/engineering`: 대부분의 저장소에서 반복되는 엔지니어링 작업 흐름.
- `skills/legacy`: 런타임 결합과 호환성이 중요한 유지보수 작업 흐름.

새 분류는 그 분류에 들어갈 실제 스킬이 생겼을 때만 추가합니다. 새 분류나 스킬이 이 지도를 바꾸면 `README.md`, 이 파일, 한국어 번역, 설치된 스킬 복사본을 `docs/maintenance.md`에 따라 함께 갱신합니다.

## 템플릿 분류

- `templates/agents`: 작은 루트 상시 지침 파일과 스택별 `AGENTS.md` 프로필.
- `templates/project-playbook`: 대상 저장소에서 `ai-playbook/`가 되는 복사용 프로젝트 메모리 템플릿.
- `templates/local-ai`: 오래된 프로젝트를 위한 호환 포인터. 새 작업은 `templates/project-playbook`을 사용합니다.

`templates/agents/global/SKILLS.md`, `templates/agents/global/GIT.md` 같은 루트 파일은 스킬로 호출하는 것이 아니라 프로젝트에 복사하는 상시 지침이므로 `templates/agents`에 둡니다.

## 작업 흐름 스킬 호환성

이 저장소는 외부 작업 흐름 스킬 묶음을 대체하지 않습니다. 작업 흐름 스킬과 playbook 스킬을 어떻게 조합할지는 `docs/superpowers-integration.md`를 기준으로 판단합니다.

## 프로젝트 메모리 지도

- `project-bootstrap`: 저장소를 확인한 뒤 루트 정책과 `ai-playbook/` 구조를 설정합니다.
- `repo-onboarding`: 계획이나 편집 전에 저장소 상태와 기존 `ai-playbook/` 맥락을 읽습니다.
- `project-doc-system`: `ai-playbook/`, map, runbook, decision, plan, worklog, archive를 정리합니다.

## 스타일 정책 지도

- `ui-style-policy`: design system, CSS/class, utility class, inline style 중 저장소 스타일 방식을 선택하거나 문서화합니다.
- `style-quality-review`: 제품 의도를 유지하면서 보이는 UI 품질을 검토합니다.

## 스킬 작성 지도

- `agent-skill-authoring`: 재사용 가능한 스킬 구조, 트리거 설명, 참고 자료, 스킬/템플릿 경계.

## Legacy expansion map

- `legacy-general`: 기본 레거시 유지보수 규율.
- `legacy-risk-check`: 위험한 편집 전 숨은 영향 범위 점검.
- `legacy-feature-addition`: host system을 rewrite하지 않고 동작 추가.
- `legacy-jquery-web`: jQuery/plugin/direct DOM browser pages.
- `legacy-server-rendered-web`: server template, form, session, validation.
- `legacy-android-webview-hybrid`: native shell plus WebView and bridge.
- `legacy-database-heavy-system`: stored procedure, trigger, direct SQL, DB-shaped business rules.
- `legacy-java-spring-mvc`: Spring MVC/JSP/MyBatis/Servlet/WAR systems.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, ViewState, code-behind, IIS.
- `legacy-php-lamp`: PHP include/session/direct SQL pages.
- `legacy-ie-activex-compat`: IE mode, ActiveX, intranet browser/device constraints.
- `legacy-reporting-printing`: report, export, print, label, barcode, invoice flows.
- `legacy-batch-file-transfer`: scheduled batch, CSV/Excel/SFTP/file-drop integrations.
