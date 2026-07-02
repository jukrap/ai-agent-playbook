# Harness OS v2 Architecture Boundary Pack 계획

> **구현자용:** 모바일 하드닝 pack 이후 이어서 진행합니다. 이 계획은 현재 카탈로그에서 약한 축인 architecture를 다룹니다. 현재 architecture에는 넓은 boundary review skill 하나만 있고 feature slicing, domain modeling, monorepo/package ownership 전용 스킬은 없습니다.

**목표:** 모든 저장소에 특정 architecture style을 강제하지 않으면서 feature-sliced/FSD boundary, domain model change, monorepo/package boundary를 위한 capability-first architecture 지침을 추가합니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 clean/layered architecture, domain boundary, module isolation, package export, dependency direction, workflow graph validation, trust-boundary thinking 패턴이 반복됩니다. 이 패턴을 로컬 스킬과 reference로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## 기준 상태

- 모바일 하드닝 pack 이후 스킬 카탈로그는 57개 스킬을 포함합니다.
- `architecture` 카테고리에는 현재 `architecture/boundary-review` 하나만 있습니다.
- 기존 backend, frontend, legacy skill도 boundary를 언급하지만 architecture-specific evidence가 문제 유형별로 나뉘어 있지는 않습니다.
- MCP prompt나 workflow recipe에는 아직 architecture review가 first-class workflow로 없습니다.

## 레퍼런스에서 채택할 규칙

- **Architecture를 강제하지 않습니다:** FSD, layered architecture, clean architecture, DDD, hexagonal, vertical slice, feature-first layout은 모든 곳에 기본 적용할 대상이 아니라 프로젝트 evidence에 맞춰 검증할 선택지입니다.
- **Boundary type을 분리합니다:** Feature/slice boundary, domain model boundary, package/workspace boundary, runtime trust boundary는 서로 다른 방식으로 실패하므로 별도 checklist가 필요합니다.
- **폴더명보다 dependency direction을 우선합니다:** `domain`, `entity`, `feature`, `shared` 같은 폴더명은 ownership이나 dependency rule이 맞다는 증거가 아닙니다.
- **Public API가 중요합니다:** Index/barrel file, package export, shared module, generated schema, adapter interface가 사용 가능한 boundary를 정의합니다.
- **Architecture review는 evidence를 만들어야 합니다:** 결과물은 affected module, allowed dependency, coupling risk, migration 또는 compatibility path, verification command를 명시해야 합니다.

## Workstream A: Feature Slice Boundaries

### Task A1: Feature Slice Boundary Skill

**Skill:** `architecture/feature-slice-boundary`

**References:**

- `feature-slice-layering.md`
- `slice-public-api-checks.md`

**Coverage:**

- FSD, vertical slice, feature-first, route-level, module-level, component-domain slice 변경.
- Layer ownership, import, shared/common usage, public API file, cross-slice coupling, UI/state/API boundary, test placement.
- Stack-first 또는 page-first 구조에서 broad rewrite 없이 migration하는 방식.

## Workstream B: Domain Model Changes

### Task B1: Domain Model Change Skill

**Skill:** `architecture/domain-model-change`

**References:**

- `domain-modeling-boundaries.md`
- `application-domain-infrastructure.md`

**Coverage:**

- Domain entity, aggregate, value object, service, policy, workflow, use case, command/query, repository, adapter 변경.
- DDD, clean architecture, hexagonal architecture, layered architecture, 더 단순한 service/module design.
- Persistence leakage, DTO/domain confusion, transaction boundary, invariant ownership, event/message boundary.

## Workstream C: Monorepo And Package Boundaries

### Task C1: Monorepo Package Boundary Skill

**Skill:** `architecture/monorepo-package-boundary`

**References:**

- `package-ownership-dependency-direction.md`
- `workspace-release-impact.md`

**Coverage:**

- Workspace package, internal library, package export, dependency graph, build graph, generated type, versioning, release impact.
- Cross-package import, circular dependency, public/private API, package manager workspace, affected-test selection.
- Package publishing과 connector change와의 compatibility.

## Workstream D: Docs, Tests, And Follow-Up Surfaces

### Task D1: Catalog And Docs

**Acceptance:**

- README skill list와 category summary에 새 architecture skill을 반영합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`에 architecture boundary map을 문서화합니다.
- 한국어 번역을 같은 변경에서 갱신합니다.
- Skill count 기대값을 57에서 60으로 갱신합니다.

### Task D2: Follow-Up Workflow And Prompt

**Candidate workflow:** `architecture-boundary-review`

**Candidate prompt:** `architecture_boundary_review`

**Acceptance for a later slice:**

- Workflow preview는 inputs, outputs, skills, tools, stop conditions, verification을 명시합니다.
- Prompt는 read-only로 유지하고 `workflow_run_preview`, `symbol_outline`, `operator_search`, `dependency_inventory`, `write_gate_preview`로 라우팅합니다.

## Workstream E: 검증

각 구현 단위 뒤에 실행합니다.

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## 제안 순서

1. 이 계획을 추가하고 커밋합니다.
2. `feature-slice-boundary`, `domain-model-change`, `monorepo-package-boundary` 스킬과 reference, 번역을 추가합니다.
3. Catalog docs와 skill-count test를 갱신한 뒤 architecture skill pack을 커밋합니다.
4. `architecture-boundary-review` workflow recipe와 smoke coverage를 추가합니다.
5. `architecture_boundary_review` MCP prompt와 prompt contract test를 추가합니다.
6. 전체 검증을 다시 실행하고 다음 약한 표면을 선택합니다. 우선순위 후보는 database depth 또는 AI-harness extension governance입니다.

## 비목표

- FSD, DDD, clean architecture, monorepo migration을 강제하지 않습니다.
- Local project evidence 없는 broad folder reshuffle은 하지 않습니다.
- Automated dependency graph rewrite는 하지 않습니다.
- MCP를 통한 project source write는 추가하지 않습니다.
