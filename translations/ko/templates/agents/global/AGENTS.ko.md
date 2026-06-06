# AGENTS.md
# 재사용 가능한 AI 에이전트 작업 가이드

이 파일은 제품 기획서가 아니라 작업 합의입니다. 프로젝트 고유 제품, 기술 스택, 마일스톤 정보는 `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/**` 같은 별도 문서에 둡니다.

## 기본 규칙

- 아키텍처나 도구를 결정하기 전에 저장소 구조, 설정, README, 로컬 문서를 확인합니다.
- React, FSD, tests, lint, package manager, branch workflow를 추측하지 않습니다.
- 프로젝트가 정의한 명령과 기존 패턴을 우선합니다.
- 변경은 요청 범위에 맞게 작고 직접적으로 유지합니다.
- 관련 없는 사용자 변경을 되돌리지 않습니다.
- 검색은 `rg`를 우선 사용합니다.
- 완료 주장은 최신 명령 출력으로 검증합니다.
- 사용자가 한국어로 말하면 한국어로 답합니다.

## 작업 시작 체크

- 현재 브랜치와 remote를 확인합니다.
- dirty worktree를 확인하고 관련 없는 변경은 건드리지 않습니다.
- package manager, lockfile, runtime version, scripts를 확인합니다.
- 하위 `AGENTS.md` 또는 package별 지침이 있는지 봅니다.
- 프로젝트 문서가 있으면 README, `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/README.md` 순서로 필요한 부분을 읽습니다.
- 문서와 코드가 다르면 실제 코드와 최신 사용자 지시를 우선합니다.

## 문서 역할

- `AGENTS.md`: 에이전트 작업 규칙, 검증, git, 협업 정책.
- `SKILLS.md`: 프로젝트 수준 스킬 선택 정책.
- `GIT.md`: 휴대 가능한 커밋/PR 정책.
- `PROJECT_SPEC.md`: 제품 목표, 기능/화면 범위, data/API 정책.
- `PLANS.md`: 마일스톤, 완료 기준, 검증 명령.
- `FSD.md`: FSD 또는 아키텍처 경계 규칙.
- `docs/plans/**`: 세부 규칙, 프롬프트, 인수인계, 계획 메모.
- `docs/worklog/**`: 마일스톤 완료, blocker, 큰 방향 변경.
- `.local-ai/structural-review.md` 또는 `docs/plans/STRUCTURAL_REVIEW.md`: 프로젝트가 사용할 때 근거 기반 구조 리뷰 기준.
- `design-docs/**`, `_reference/**`: 필요할 때만 보는 보조 참고 자료.
- `README.md`: 새 독자를 위한 공개 setup/run 안내.

## 기준 우선순위

충돌 시 우선순위:

1. 최신 사용자 지시.
2. 실제 코드와 설정.
3. 프로젝트별 명세와 계획 문서.
4. 가장 가까운 하위 `AGENTS.md`.
5. 전역 작업 규칙.
6. 오래된 참고 자료와 외부 자료.

## Local-only 문서

- 프로젝트가 AI 지침, 작업 기록, 디자인 원본, 내부 계획 메모를 local-only로 정하면 커밋하지 않습니다.
- 커밋 전 staged files를 확인합니다.
- local-only 파일을 막는 hook을 우회하지 않습니다.
- `README.md`는 보통 공개 문서이므로 프로젝트가 허용하면 커밋할 수 있습니다.

## 사용자 지정 스킬

- 전역 설치 스킬은 재사용 보조 수단으로 다루며, 항상 적용되는 필수 동작으로 보지 않습니다.
- Codex의 일반적인 로컬 스킬 루트는 `%USERPROFILE%\.codex\skills`, `%USERPROFILE%\.agents\skills`입니다.
- 이 파일이나 다른 프로젝트 문서가 스킬을 지명하면, 의존하기 전에 디스크에 matching `SKILL.md`가 있는지 확인합니다.
- session 스킬 목록에 없다는 사실만으로 스킬이 없다고 단정하지 않습니다. 프로젝트가 명시적으로 지명한 스킬은 on-disk path를 확인합니다.
- 작업에 필요한 최소한의 스킬만 사용하고, 선택한 스킬이 왜 적용되는지 짧게 말합니다.
- 스킬이 더 높은 우선순위의 사용자 지시, 실제 저장소 상태, project-local rule을 덮어쓰게 하지 않습니다.

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

- `git add .`, `git add -A`보다 명시적 스테이징을 선호합니다.
- 커밋 전 staged files를 확인합니다.
- 기본적으로 Conventional Commits를 사용합니다.
- 저장소가 scoped commit을 쓰면 `type(scope): summary` 형식을 사용합니다.
- subject는 branch명이나 chat title이 아니라 핵심 결과에 집중합니다.
- 이후 독자가 변경 이유, 범위, risk, verification context를 이해하는 데 도움이 되면 구조화된 본문을 추가합니다.
- 실제 실행한 command나 manual check에 대해서만 검증 섹션을 넣습니다.
- 이슈 번호와 저장소 규칙을 확실히 알 때만 이슈 참조를 넣습니다.
- 에이전트, 모델, co-author, generated-by 서명을 추가하지 않습니다.
- push 전 브랜치, remote, upstream, local-only staged files, 최신 검증 출력을 확인합니다.
- 사용자 변경 또는 작업과 무관한 변경을 되돌리지 않습니다.

휴대 가능한 Git 정책은 `templates/agents/global/GIT.md`를 복사하거나 읽습니다. 더 자세한 커밋, PR, 작업 기록 정책은 `templates/local-ai/commit-push-worklog.md`를 복사하거나 읽습니다.

## 스킬 사용

프로젝트별 스킬 선택 규칙은 `templates/agents/global/SKILLS.md`를 복사하거나 읽습니다. 스킬 사용은 최소화하고, 일반 스킬이 실제 저장소 상태나 현재 사용자 지시를 덮어쓰게 하지 않습니다.

## 작업 기록

프로젝트가 작업 기록을 쓴다면 마일스톤 완료, blocker, 큰 방향 변경, 긴 디버깅 결과를 기록합니다. 좋은 작업 기록은 바뀐 파일명보다 문제와 판단 과정을 설명합니다.
