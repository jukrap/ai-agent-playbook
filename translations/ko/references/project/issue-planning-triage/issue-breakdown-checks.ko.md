# Issue Breakdown Checks

넓은 작업을 검토 가능한 issue 형태로 바꿀 때 사용합니다.

## Issue 유형

- Bug: current behavior, expected behavior, reproduction, impact, suspected area, regression signal, verification.
- Feature: goal, user, workflow, scope, non-goal, acceptance criteria, dependency, rollout.
- Chore: maintenance goal, affected surface, safety constraint, verification, rollback need.
- Docs: audience, source evidence, artifact type, freshness, owner, translation need, archive/update path.
- Research 또는 spike: question, timebox, evidence to gather, decision output, non-implementation boundary.
- Migration: source/target, compatibility window, rollout order, backout path, reconciliation, owner.
- Follow-up: originating work, remaining risk, next action, due trigger, verification.

## 분할 규칙

- 서로 다른 owner, reviewer, release gate, verification method가 필요하면 나눕니다.
- 하나의 issue가 product decision, design decision, implementation, migration, release communication을 섞으면 나눕니다.
- 각 파일이 독립 deliverable이 아니라면 file-by-file task로 나누지 않습니다.
- Parent issue는 acceptance criteria를 소유하고 child completion criteria를 추적할 때만 둡니다.

## 최소 필드

- 구현 잡음이 아니라 outcome이 드러나는 제목.
- 이 작업이 존재하는 source evidence 또는 이유.
- Scope와 non-goal.
- Acceptance criteria.
- Verification plan.
- Risk와 rollback 또는 mitigation.
- Dependency와 blocked status.
- Owner 또는 다음 decision maker.

## Noise Filter

- Raw chat fragment, private path, internal URL, credential, branch name, PR number, reference project name을 제거합니다.
- Generated report는 pasted output이 아니라 reviewed evidence로 요약합니다.
- Issue reader에게 필요하지 않은 implementation note는 plan 또는 worklog에 둡니다.
