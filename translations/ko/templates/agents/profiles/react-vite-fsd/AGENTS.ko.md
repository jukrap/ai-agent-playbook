# AGENTS.md
# React/Vite Pragmatic FSD Profile

React, Vite, TypeScript, pnpm, pragmatic FSD 또는 유사한 layered frontend 프로젝트에 이 profile을 사용합니다. 저장소가 다른 도구를 사용하면 이 profile보다 repository config를 신뢰합니다.

## Start rules

- `package.json`, lockfile, README, local docs, branch, dirty worktree를 먼저 확인합니다.
- local evidence 없이 React, Vite, pnpm, FSD, test commands를 추측하지 않습니다.
- 편집 전 `src` 구조와 import boundaries를 확인합니다.
- 사용자 변경을 되돌리지 않습니다.

## Document priority

1. 최신 사용자 지시.
2. 실제 code, config, package scripts.
3. `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`.
4. `.ai-playbook/CURRENT.md`, relevant maps/runbooks/plans, latest worklog summary.
5. 프로젝트 설계 문서와 로컬 참고 자료.
6. 이 profile.

## Architecture

- FSD는 mandatory가 아닙니다. 프로젝트가 이미 사용하거나 docs가 요구할 때만 적용합니다.
- 일반적인 layer order는 `app -> pages -> widgets -> features -> entities -> shared`입니다.
- pages는 routing과 composition에 집중합니다.
- widgets는 화면의 큰 business block에 사용합니다.
- features는 user actions, forms, mutations, selections, filters에 사용합니다.
- entities는 domain types, API adapters, query options, domain UI에 사용합니다.
- shared code는 project domain concepts에 의존하지 않게 유지합니다.
- slice public APIs는 `index.ts`를 통한 방식을 선호합니다.

## UI and styling

- repository의 explicit style policy를 따릅니다. policy가 불분명하거나 충돌하면 `ui-style-policy`를 사용합니다.
- documented policy가 없으면 새 styling system을 도입하지 말고 component의 existing local pattern을 유지합니다.
- design-system이 강한 프로젝트에서는 custom styling 전에 shared UI variants, tokens, component props를 우선합니다.
- button, input, select, modal, toast, pagination을 새로 만들기 전에 existing shared wrappers를 검색합니다.
- text overflow, mobile width, loading, empty, error, disabled states를 확인합니다.
- style-quality review에서는 visual intent를 보존하고 CSS/inline structure, duplication, cascade risk, responsive breakage에 집중합니다.

## State, query, and API

- local state로 충분하면 local state를 사용합니다.
- server data에는 프로젝트의 existing server-state tool을 사용합니다.
- global store는 URL 또는 server state로 처리할 수 없고 여러 screen/feature에 공유되는 state에만 사용합니다.
- pages/widgets가 endpoint paths와 transport details에 의존하지 않게 합니다.
- backend DTO와 frontend domain type을 분리합니다. naming과 wrapped responses는 adapter에서 normalize합니다.
- Swagger, backend DTO, command object, mapper, sample response를 확인 없이 interchangeable하게 취급하지 않습니다.

## Verification

project scripts를 먼저 사용합니다. 흔한 React/Vite 프로젝트에서 아래 command가 존재할 때만 실행합니다.

```bash
pnpm lint
pnpm test:run
pnpm build
```

UI 작업은 가능하면 browser에서 중요한 desktop/mobile widths를 확인합니다. visible changes에는 overflow와 interaction states를 확인합니다.

## Git and worklogs

- commit 전 explicit staging과 local-only docs 여부를 확인합니다.
- 팀 commit convention이 그렇다면 `type(scope): Korean summary`를 사용합니다.
- milestone completion, blocker, major direction change, long debugging에는 worklog를 남깁니다.
