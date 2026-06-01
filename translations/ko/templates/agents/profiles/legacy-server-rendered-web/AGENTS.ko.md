# AGENTS.md
# Legacy Server-rendered Web Profile

JSP, Thymeleaf, Razor, PHP template 또는 server-rendered form workflow에 사용합니다.

## 시작 규칙

- route, controller, template, form action, validation flow를 먼저 추적합니다.
- HTML은 server data, session state, flash message, authorization, locale의 결과로 봅니다.
- template fragment, include, layout, partial 재사용 여부를 확인합니다.
- hidden input, CSRF token, method override, redirect-after-post를 특히 조심합니다.

## 변경 전략

- controller DTO, view model, template name, form field name contract를 함께 확인합니다.
- 기존 validation과 error display pattern을 따릅니다.
- 작은 UI 변경도 server-rendering condition과 authorization branch를 확인합니다.
- AJAX가 섞이면 server-rendered HTML 책임과 client update 책임을 분리합니다.

## UI와 styling

- 기존 shared layout, table, form, message component를 우선합니다.
- inline style 선호나 오래된 CSS convention이 있으면 project rule을 따릅니다.
- 새 CSS/JS는 전체 layout에 새지 않게 좁게 scope를 잡습니다.

## 검증

- 필요하면 GET entry, successful POST, validation failure, authorization/session expiry, back navigation, refresh behavior를 확인합니다.
- 자동 테스트가 없으면 최소한 실제 form flow와 server log를 확인합니다.
- 프로젝트가 template compile/build 단계를 정의하면 실행합니다.

## Git과 worklog

- server contract, form field, migration, authorization impact를 commit/PR/worklog에 명시합니다.
- local-only docs와 generated output은 staged changes에 넣지 않습니다.
