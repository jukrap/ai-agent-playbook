# AGENTS.md
# React/Vite Pragmatic FSD Profile

React, Vite, TypeScript, pnpm, pragmatic FSD 또는 유사 계층형 프론트엔드에 사용합니다. 저장소가 다른 도구를 쓰면 이 프로필보다 저장소 설정을 우선합니다.

## 시작 규칙

- `package.json`, lockfile, README, local docs, branch, dirty worktree를 먼저 확인합니다.
- 로컬 근거 없이 React, Vite, pnpm, FSD, test 명령을 가정하지 않습니다.
- 수정 전 `src` 구조와 import boundary를 확인합니다.
- 사용자 변경은 되돌리지 않습니다.

## 문서 우선순위

1. 최신 사용자 지시.
2. 실제 코드, config, package scripts.
3. `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`.
4. `docs/plans/**`와 최신 worklog.
5. `design-docs/**`, `_reference/**`.
6. 이 프로필.

## Architecture

- FSD는 필수가 아닙니다. 프로젝트가 이미 쓰거나 문서가 요구할 때만 적용합니다.
- 일반 layer 순서는 `app -> pages -> widgets -> features -> entities -> shared`입니다.
- page는 routing과 composition 중심으로 유지합니다.
- widget은 화면의 큰 업무 block을 담당합니다.
- feature는 user action, form, mutation, selection, filter를 담당합니다.
- entity는 domain type, API adapter, query option, domain UI를 담당합니다.
- shared code는 project domain concept에 의존하지 않게 둡니다.
- slice public API는 `index.ts`를 선호합니다.

## UI와 styling

- 기본은 hybrid style policy입니다. CSS는 shared token, reset, broad layout rule을 맡을 수 있고, inline style은 component-local 또는 dynamic style에 적합합니다.
- SI 또는 선임 선호 프로젝트에서는 inline style을 local convention으로 명시적으로 허용합니다.
- design system이 강한 프로젝트에서는 CSS variables, class names, shared UI variants를 선호합니다.
- button, input, select, modal, toast, pagination을 만들기 전에 기존 shared wrapper를 찾습니다.
- text overflow, mobile width, loading, empty, error, disabled 상태를 확인합니다.
- style-quality review에서는 visual intent를 유지하고 CSS/inline 구조, 중복, cascade risk, responsive breakage를 봅니다.

## State, query, API

- local state로 충분하면 local state를 씁니다.
- 서버 데이터는 프로젝트의 기존 server-state tool을 따릅니다.
- global store는 URL이나 server state로 해결되지 않는 여러 화면/기능 공유 state에만 씁니다.
- page/widget은 endpoint path와 transport detail을 직접 알지 않게 합니다.
- backend DTO와 frontend domain type을 분리하고 adapter에서 naming과 wrapper response를 정리합니다.
- Swagger, backend DTO, command object, mapper, sample response를 확인 없이 같은 것으로 취급하지 않습니다.

## 검증

프로젝트 scripts를 우선합니다. 흔한 React/Vite 프로젝트에서는 아래 명령이 있을 때만 실행합니다.

```bash
pnpm lint
pnpm test:run
pnpm build
```

UI 작업은 가능하면 browser에서 주요 desktop/mobile width를 확인합니다. visible change가 있으면 overflow와 interaction state도 봅니다.

## Git과 worklog

- 명시 staging을 사용하고 local-only docs가 staged 되었는지 확인합니다.
- 팀 convention이 그렇다면 `type(scope): 한국어 요약`을 사용합니다.
- milestone 완료, blocker, 큰 방향 변경, 긴 debugging에는 worklog를 남깁니다.
