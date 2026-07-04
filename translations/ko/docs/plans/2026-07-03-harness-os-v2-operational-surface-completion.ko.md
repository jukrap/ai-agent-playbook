# AI Agent Playbook v2 Operational Surface Completion Plan

> **구현자용:** capability pack과 recipe expansion 이후 이어서 진행합니다. 다음 목표는 새 skill을 MCP prompt로 discoverable하게 만들고, recipe contract를 test 가능하게 유지하며, project source write를 열지 않은 상태에서 제한된 scaffold-tier run record를 준비하는 것입니다.

**목표:** AI Agent Playbook를 "확장된 catalog"에서 "운영 가능한 harness"로 옮깁니다. 사용자나 agent가 workflow를 고르고, 필요한 evidence를 preview하고, 적절한 prompt를 따르며, 명시적으로 요청된 경우 제한된 run record를 남기고, 검토된 fact만 durable memory로 승격할 수 있어야 합니다.

**Reference input:** local reference inventory는 workflow, MCP resource/prompt, runtime evidence, compliance check, agent memory 전반에서 유용한 반복 pattern을 계속 보여줍니다. 이 pattern은 local contract와 validator로 채택합니다. Public doc에는 upstream wording, project name, personal path, internal URL, secret, branch name, PR number, noisy source label을 복사하지 않습니다.

## Baseline

- Skill catalog는 capability-first category 전반에 48개 skill을 포함합니다.
- Workflow catalog는 deployment release, frontend quality review, data integrity review를 포함해 14개 recipe를 포함합니다.
- Runtime preview는 workflow run, symbol outline, dependency inventory, route/API/data hint, artifact schema, capability history, write gate, canon promotion check를 포함합니다.
- MCP는 넓은 read-only tool과 resource를 노출하지만, review prompt는 아직 backend/security/index workflow 중심입니다.
- Write-capable behavior는 계속 opt-in이어야 하며 default MCP exposure 밖에 있어야 합니다.

## Reference-Derived Rules To Adopt

- **Prompt as run brief:** MCP prompt는 막연한 전문성이 아니라 required evidence, optional evidence, stop condition, verification을 명시해야 합니다.
- **Recipe as contract:** 모든 bundled recipe는 stable manifest로 parse되어야 하며 smoke preview test가 있어야 합니다.
- **Generated evidence stays generated:** Runtime report는 review를 도울 수 있지만 명시적 승격 없이는 memory가 되지 않습니다.
- **Scaffold before write:** Run record 생성은 `project-write`가 아니라 `scaffold`에 속하며 `.ai-agent-playbook/workflows/runs/` 아래에 머물러야 합니다.
- **Portable public docs:** Public doc은 private path, source pack name, machine-local identifier, raw reference excerpt를 피해야 합니다.

## Workstream A: MCP Prompt Pack Follow-Through

### Task A1: DevOps Release Prompt

**Prompt:** `deployment_release_review`

**Purpose:** Deployment, release, rollback, container, CI, post-deploy check를 새 devops skill과 runtime evidence로 라우팅합니다.

**Required evidence:**

- recipe `deployment-release`에 대한 `workflow_run_preview`
- package, lockfile, container, CI signal을 위한 `dependency_inventory`
- local verification candidate를 위한 `diagnostics_check`
- edit 제안 전 `write_gate_preview`

### Task A2: Frontend Quality Prompt

**Prompt:** `frontend_quality_review`

**Purpose:** UI state/data, accessibility, visual regression, responsive quality review를 새 frontend skill로 라우팅합니다.

**Required evidence:**

- recipe `frontend-quality-review`에 대한 `workflow_run_preview`
- affected screen/component를 찾기 위한 `index_search` 또는 `operator_search`
- 관련 context와 contract를 위한 `operator_preflight`
- target을 실행할 수 있을 때 visual/browser evidence

### Task A3: Data Integrity Prompt

**Prompt:** `data_integrity_review`

**Purpose:** Analytics, dashboard, migration, backfill, reconciliation review를 새 data skill로 라우팅합니다.

**Required evidence:**

- recipe `data-integrity-review`에 대한 `workflow_run_preview`
- route/API/data hint를 위한 `route_api_hints`
- metric, query, migration, dashboard reference를 위한 `operator_search`
- data contract 또는 durable invariant가 있으면 `contracts_check`

### Task A4: Documentation Handoff Prompt

**Prompt:** `adr_spec_handoff_review`

**Purpose:** ADR/spec/worklog promotion을 `adr-spec-handoff`와 canon promotion rule로 라우팅합니다.

**Required evidence:**

- 기존 durable fact 확인을 위한 `canon_check`
- 사용 가능한 generated evidence 확인을 위한 `index_status`
- 향후 memory promotion write를 고려한다면 `write_gate_preview`
- 관련 worklog, plan, decision, runtime artifact reference

## Workstream B: Prompt And Recipe Drift Tests

### Task B1: Prompt Contract Tests

**Purpose:** Prompt가 현재 tool, recipe ID, permission model에서 벗어나지 않게 합니다.

**Acceptance:**

- 모든 review prompt는 `Required evidence:`, `Stop conditions:`, `Verification expectations:`를 포함합니다.
- Prompt test는 기대 primary tool 또는 recipe ID가 나타나는지 확인합니다.
- Prompt test는 default read-only prompt에서 stale `apply: true` guidance를 거부합니다.

### Task B2: Recipe Preview Smoke Tests

**Purpose:** 모든 bundled recipe가 `workflow run-preview`로 parse 가능한지 보장합니다.

**Acceptance:**

- Test가 `workflow list` ID 전체를 순회하며 bare target에서 각 bundled recipe를 preview합니다.
- 각 recipe는 inputs, outputs, skills, tools, stop conditions, verification을 반환합니다.
- 누락되거나 malformed된 recipe section은 test 실패로 잡힙니다.

## Workstream C: Scaffold-Tier Run Record Contract

### Task C1: `workflow run-start` 문서화

**Purpose:** 구현 전에 미래 scaffold-tier behavior를 정의합니다.

**Contract:**

- 기본값은 계속 read-only preview입니다.
- `workflow run-start`는 `.ai-agent-playbook/workflows/runs/` 아래에만 쓸 수 있습니다.
- Run manifest, criteria checklist, evidence notes stub, handoff stub을 써야 합니다.
- Missing recipe, empty manifest, path traversal, project-source destination을 거부해야 합니다.

### Task C2: Optional First Scaffold Implementation

**Purpose:** Contract가 문서화되고 test된 뒤 가장 작은 유용한 apply behavior를 추가합니다.

**Acceptance:**

- 명시적 command와 `--apply`가 필요합니다.
- 새 run file만 쓰며 source code나 trusted memory를 편집하지 않습니다.
- Audit-friendly JSON summary를 만들고, safe unique name이 없으면 기존 run file을 건드리지 않습니다.

## Workstream D: Reference Adoption Continuation

### Task D1: Reference Inventory Snapshot 갱신

**Purpose:** Raw reference name을 노출하지 않고 local reference analysis를 최신 상태로 유지합니다.

**Acceptance:**

- Reference inventory를 read-only mode로 실행합니다.
- Planning doc 또는 local ledger에는 aggregate capability signal만 기록합니다.
- Source prose를 복사하지 않고 다음 candidate pack을 식별합니다.

### Task D2: Next Candidate Capability Packs

**Candidates:**

- testing and QA strategy pack: unit/integration/e2e, flake triage, fixture design, mutation risk.
- mobile/native hardening pack: app store release, native permission, simulator/device diagnostics.
- language/backend profile references: Java/Spring, .NET, PHP, Node, Python, Go, Kotlin을 primary skill 아래 stack reference로 정리.
- compliance/package hygiene pack: notice, license, SBOM/VEX handoff, release artifact check.
- agent orchestration pack: subtask boundary, review handoff, context budget, multi-agent evidence ledger.

## Workstream E: Verification

각 implementation slice 이후 실행합니다.

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Suggested Order

1. Deployment, frontend quality, data integrity, ADR/spec handoff용 MCP prompt를 추가합니다.
2. Prompt drift test를 추가하고 MCP 문서/번역을 갱신합니다.
3. 모든 bundled recipe에 대한 recipe preview smoke test를 추가합니다.
4. Scaffold-tier run-start contract를 문서화합니다.
5. Contract와 test가 안정되면 run-start를 구현합니다.
6. Reference inventory를 갱신하고 다음 capability pack을 선택합니다.
7. Slice마다 validate하고 commit합니다.

