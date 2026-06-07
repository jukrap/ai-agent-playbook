# AGENTS.md
# 재사용 AI 에이전트 작업 가이드

이 파일은 제품 기획서가 아니라 작업 합의입니다. 프로젝트 고유 제품, 기술 스택, 마일스톤 정보는 `PROJECT_SPEC.md`, `PLANS.md`, architecture docs, `ai-playbook/` 같은 프로젝트 문서에 둡니다.

## Core rules

- 구조, 설정, README, local docs를 확인한 뒤 architecture나 tooling을 결정합니다.
- React, FSD, tests, lint, package manager, branch workflow를 추측하지 않습니다.
- 프로젝트가 정의한 command와 existing pattern을 우선합니다.
- 변경은 작고 scoped하며 요청과 직접 관련되게 유지합니다.
- 관련 없는 사용자 변경을 되돌리지 않습니다.
- 검색에는 `rg`를 우선합니다.
- 완료 주장은 fresh command output으로 검증합니다.
- 기본 답변 언어는 사용자의 언어에 맞춥니다.

## Start-of-work checks

- 현재 branch와 remotes를 확인합니다.
- dirty worktree 상태를 확인하고 관련 없는 변경은 그대로 둡니다.
- package manager, lockfile, runtime version, scripts를 확인합니다.
- 하위 `AGENTS.md` 또는 package-specific instruction을 찾습니다.
- `ai-playbook/`이 있으면 계획 전에 `START_HERE.md`, `CURRENT.md`, 관련 map/runbook을 읽습니다.
- project docs와 code가 다르면 실제 code와 최신 사용자 지시를 먼저 믿습니다.

## Document roles

- `AGENTS.md`: agent working rules, verification, git, collaboration policy.
- `ai-playbook/SKILLS.md`: 프로젝트 수준 스킬 선택 정책.
- `ai-playbook/GIT.md`: 휴대 가능한 commit/PR 정책.
- `PROJECT_SPEC.md`: 프로젝트가 사용할 때 제품 목표, 기능/화면 범위, data/API policy.
- `PLANS.md`: 프로젝트가 사용할 때 milestone, completion criteria, verification commands.
- `FSD.md`: 필요할 때만 FSD 또는 architecture boundary rules.
- `ai-playbook/`: current project memory, map, runbook, active plan, decision, worklog, archive.
- `design-docs/**`, `_reference/**`: 관련 있을 때만 사용하는 secondary reference.
- `README.md`: 새 독자를 위한 public setup/run guide.

## Source of truth

instruction이 충돌하면 아래 순서를 우선합니다.

1. 최신 사용자 지시.
2. 실제 code, configuration, command output.
3. 루트와 가장 가까운 agent instruction files.
4. `ai-playbook/CURRENT.md`, maps, runbooks, decisions의 current project memory.
5. Project-specific specification and planning docs.
6. Worklogs, old references, examples, archived material.

## Local-only docs

- `ai-playbook/`을 커밋할지 local-only로 둘지 결정합니다.
- 프로젝트가 AI instructions, worklogs, design sources, internal planning notes를 local-only로 표시하면 커밋하지 않습니다.
- 커밋 전 staged files를 확인합니다.
- local-only files를 막는 hook을 우회하지 않습니다.
- `README.md`는 보통 public이며 프로젝트가 허용하면 커밋할 수 있습니다.

## Custom skills

- globally installed skills는 reusable helper이지 mandatory behavior가 아닙니다.
- 이 파일이나 다른 project doc이 skill을 언급하면, 의존하기 전에 disk의 matching `SKILL.md`를 확인합니다.
- session skill listing에 없다는 것만으로 skill이 없다고 단정하지 않습니다. 프로젝트가 명시한 경우 on-disk path를 확인합니다.
- 작업에 필요한 최소 skill set만 사용하고 선택 이유를 짧게 말합니다.
- skill이 더 높은 우선순위의 사용자 지시, 실제 repository state, project-local rule을 덮어쓰게 하지 않습니다.

## Implementation rules

- 새 pattern을 도입하기 전에 existing structure와 style을 맞춥니다.
- architecture를 강제로 적용하지 않습니다. FSD 등은 project docs와 real code가 뒷받침할 때만 적용합니다.
- API contract, backend fields, workflow를 추측하지 않습니다.
- shared components나 utilities를 바꾸기 전 blast radius를 확인합니다.
- UI 작업은 desktop/mobile에서 text, spacing, overflow, loading, empty, error state를 확인합니다.

## Verification

project-defined command를 먼저 사용합니다. 아래 command가 존재하는 경우 흔한 순서는 다음과 같습니다.

```bash
pnpm lint
pnpm test:run
pnpm build
```

다른 package manager나 command set을 쓰는 프로젝트라면 config, scripts, build files, README로 확인된 command만 사용합니다.

## Git

- 스테이징, 커밋, 푸시, 커밋 메시지 작성, PR 본문 작성 전에 `ai-playbook/GIT.md`가 있으면 읽습니다.
- `git add .` 또는 `git add -A`보다 explicit staging을 선호합니다.
- commit 전 staged files를 확인합니다.
- 기본은 Conventional Commits를 사용합니다.
- repository가 scoped commit을 쓰면 `type(scope): summary`를 사용합니다.
- subject는 branch명이나 chat title이 아니라 핵심 결과에 집중합니다.
- 미래 독자가 why, scope, risk, verification context를 이해하는 데 도움이 되면 structured body를 추가합니다.
- 실제 수행한 command 또는 manual check에만 verification section을 둡니다.
- issue number와 repository convention을 아는 경우에만 issue reference를 포함합니다.
- agent, model, co-author, generated-by signature를 추가하지 않습니다.
- push 전 branch, remote, upstream, local-only staged files, latest verification output을 확인합니다.
- 사용자 변경이나 task-unrelated changes를 되돌리지 않습니다.

portable Git policy는 `ai-playbook/GIT.md`를 읽습니다. 자세한 commit, PR, worklog policy는 `ai-playbook/guides/commit-push-worklog.md`를 읽습니다.

## Skill usage

project-level skill selection rules는 `ai-playbook/SKILLS.md`를 읽습니다. skill usage는 최소화하고 generic skill이 실제 repository state나 current user instruction을 덮어쓰지 않게 합니다.

## Worklog

프로젝트가 worklog를 사용하면 milestone completion, blocker, major direction change, long debugging result를 기록합니다. 좋은 worklog는 변경 파일명만 나열하지 않고 문제와 decision path를 설명합니다.

프로젝트가 `ai-playbook/`을 사용하면 상세 log는 `ai-playbook/worklogs/YYYY-MM/`, monthly summary는 `ai-playbook/worklogs/summaries/` 아래에 두고, 현재 사실은 `CURRENT.md`, maps, runbooks, decisions로 승격합니다.
