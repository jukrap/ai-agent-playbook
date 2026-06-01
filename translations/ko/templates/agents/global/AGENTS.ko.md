# AGENTS.md
# 재사용 가능한 AI Agent 작업 가이드

이 파일은 제품 기획서가 아니라 작업 합의입니다. 프로젝트 고유 제품, 기술 스택, milestone 정보는 `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/**` 같은 별도 문서에 둡니다.

## 기본 규칙

- 아키텍처나 도구를 결정하기 전에 저장소 구조, 설정, README, local docs를 확인합니다.
- React, FSD, tests, lint, package manager, branch workflow를 추측하지 않습니다.
- 프로젝트가 정의한 명령과 기존 패턴을 우선합니다.
- 변경은 요청 범위에 맞게 작고 직접적으로 유지합니다.
- 관련 없는 사용자 변경을 되돌리지 않습니다.
- 검색은 `rg`를 우선 사용합니다.
- 완료 주장은 fresh command output으로 검증합니다.
- 사용자가 한국어로 말하면 한국어로 답합니다.

## 작업 시작 체크

- 현재 branch와 remote를 확인합니다.
- dirty worktree를 확인하고 관련 없는 변경은 건드리지 않습니다.
- package manager, lockfile, runtime version, scripts를 확인합니다.
- 하위 `AGENTS.md` 또는 package별 지침이 있는지 봅니다.
- 프로젝트 문서가 있으면 README, `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/README.md` 순서로 필요한 부분을 읽습니다.
- 문서와 코드가 다르면 실제 코드와 최신 사용자 지시를 우선합니다.

## 문서 역할

- `AGENTS.md`: agent 작업 규칙, 검증, git, 협업 정책.
- `PROJECT_SPEC.md`: 제품 목표, 기능/화면 범위, data/API 정책.
- `PLANS.md`: milestone, 완료 기준, 검증 명령.
- `FSD.md`: FSD 또는 architecture boundary 규칙.
- `docs/plans/**`: 세부 convention, prompt, handoff, planning notes.
- `docs/worklog/**`: milestone 완료, blocker, 큰 방향 변경.
- `design-docs/**`, `_reference/**`: 필요할 때만 보는 보조 reference.
- `README.md`: 새 독자를 위한 공개 setup/run 안내.

## Source of truth

충돌 시 우선순위:

1. 최신 사용자 지시.
2. 실제 코드와 설정.
3. 프로젝트별 specification/planning docs.
4. 가장 가까운 하위 `AGENTS.md`.
5. 전역 작업 규칙.
6. 오래된 reference와 외부 자료.

## Local-only docs

- 프로젝트가 AI 지침, worklog, 디자인 원본, 내부 planning note를 local-only로 정하면 커밋하지 않습니다.
- 커밋 전 staged files를 확인합니다.
- local-only 파일을 막는 hook을 우회하지 않습니다.
- `README.md`는 보통 공개 문서이므로 프로젝트가 허용하면 커밋할 수 있습니다.

## Custom skills

- 전역 설치 skill은 재사용 helper로 다루며, 항상 적용되는 필수 동작으로 보지 않습니다.
- Codex의 일반적인 local skill root는 `%USERPROFILE%\.codex\skills`, `%USERPROFILE%\.agents\skills`입니다.
- 이 파일이나 다른 프로젝트 문서가 skill을 지명하면, 의존하기 전에 disk에 matching `SKILL.md`가 있는지 확인합니다.
- session skill 목록에 없다는 사실만으로 skill이 없다고 단정하지 않습니다. 프로젝트가 명시적으로 지명한 skill은 on-disk path를 확인합니다.
- 작업에 필요한 최소한의 skill만 사용하고, 선택한 skill이 왜 적용되는지 짧게 말합니다.
- skill이 더 높은 우선순위의 사용자 지시, 실제 repository 상태, project-local rule을 덮어쓰게 하지 않습니다.

## 구현 규칙

- 새 패턴을 만들기 전에 기존 구조와 스타일을 맞춥니다.
- 아키텍처를 강제하지 않습니다. FSD 같은 패턴은 프로젝트 문서와 실제 코드가 뒷받침할 때만 적용합니다.
- API contract, backend field, workflow를 추측하지 않습니다.
- shared component나 utility 변경 전 영향 범위를 확인합니다.
- UI 작업은 desktop/mobile에서 text, spacing, overflow, loading, empty, error 상태를 확인합니다.

## 검증

프로젝트가 정의한 명령을 우선합니다. 해당 명령이 있을 때 일반적인 순서는:

```bash
pnpm lint
pnpm test:run
pnpm build
```

다른 package manager나 명령을 쓰는 프로젝트라면 `package.json`, build files, README에서 확인된 명령만 사용합니다.

## Git

- `git add .`, `git add -A`보다 명시적 staging을 선호합니다.
- 커밋 전 staged files를 확인합니다.
- 기본적으로 Conventional Commits를 사용합니다.
- 저장소가 scoped commit을 쓰면 `type(scope): summary` 형식을 사용합니다.
- subject는 branch명이나 chat title이 아니라 핵심 결과에 집중합니다.
- 이후 독자가 변경 이유, 범위, risk, verification context를 이해하는 데 도움이 되면 구조화된 body를 추가합니다.
- 실제 실행한 command나 manual check에 대해서만 verification section을 넣습니다.
- issue 번호와 repository convention을 확실히 알 때만 issue reference를 넣습니다.
- agent, model, co-author, generated-by signature를 추가하지 않습니다.
- push 전 branch, remote, upstream, local-only staged files, 최신 검증 출력을 확인합니다.
- 사용자 변경 또는 작업과 무관한 변경을 되돌리지 않습니다.

더 자세한 commit, PR, worklog 정책은 `templates/local-ai/commit-push-worklog.md`를 복사하거나 읽습니다.

## Worklogs

프로젝트가 worklog를 쓴다면 milestone 완료, blocker, 큰 방향 변경, 긴 debugging 결과를 기록합니다. 좋은 worklog는 바뀐 파일명보다 문제와 판단 과정을 설명합니다.
