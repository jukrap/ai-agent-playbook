# Harness OS v2 Capability Pack Expansion Plan

> **구현자용:** workflow/prompt/config/public-validation/runtime-history hardening 이후 이어서 진행합니다. 이 계획은 v2 taxonomy를 capability-first로 유지하면서 skill surface를 넓히고 reference noise를 남기지 않는 것을 목표로 합니다.

**목표:** backend/security/runtime 작업 이후 남은 넓은 engineering gap을 채웁니다. 범위는 devops와 release safety, frontend quality, data integrity, analytics, durable documentation handoff입니다.

**Reference input:** local reference inventory는 skills, workflows, MCP surface, hook, runtime index, security validation, compliance check, test, documentation 전반에서 강한 signal을 보입니다. 반복되는 pattern을 local skill과 reference로 채택합니다. Public doc이나 prompt에는 raw upstream prose, project name, internal path, 큰 source excerpt를 복사하지 않습니다.

## Baseline

- v2 taxonomy는 이미 capability category와 stack profile을 분리합니다.
- Backend, database, security, delivery, quality, project, legacy, mobile, AI-harness skill이 존재합니다.
- Existing workflow recipe는 onboarding, feature delivery, legacy change, backend contract, database migration, CI triage, security audit, frontend polish, mobile release, documentation package, harness extension을 다룹니다.
- Runtime evidence는 index preview, workflow run preview, write-gate advisory/post-check, canon promotion gate, config preview, public-doc hygiene check, artifact schema check, capability-history preview를 포함합니다.

## Reference-Derived Rules To Adopt

- **Capability first:** Primary skill은 vendor나 stack이 아니라 problem space를 설명합니다.
- **Trigger concise, procedure rich:** `SKILL.md`는 짧고 trigger-focused로 유지하고, 재사용 가능한 detail은 one-level reference에 둡니다.
- **Evidence first:** Skill은 넓은 전문성을 약속하기보다 필요한 evidence, stop condition, verification을 명시합니다.
- **No hidden writes:** Scaffold/apply behavior는 read-only review guidance와 분리해 문서화합니다.
- **Operational rollback:** Release, deployment, migration, incident guidance에는 rollback 또는 containment check를 포함합니다.
- **Portable notes:** Public doc에는 machine-local path, upstream branding, internal URL, credential, branch name, PR number를 저장하지 않습니다.

## Workstream A: Devops And Release Pack

### Task A1: Container Change Safety

**Skill:** `devops/container-change-safety`

**References:**

- `container-image-change.md`
- `compose-kubernetes-change.md`

**Coverage:**

- Dockerfile base image와 layer risk.
- Compose/Kubernetes service, env, volume, network, healthcheck, resource change.
- Build context, secret mount, cache, artifact boundary check.
- Rollback, smoke test, runtime log verification.

### Task A2: Deployment Release Check

**Skill:** `devops/deployment-release-check`

**References:**

- `release-gates.md`
- `rollback-readiness.md`

**Coverage:**

- CI status, package/build artifact, migration, config, feature flag, release note gate.
- Rollback ownership, previous artifact availability, post-deploy verification.
- Project가 지원할 때 version, tag, changelog, package dry-run check.

### Task A3: Observability Incident Triage

**Skill:** `devops/observability-incident-triage`

**References:**

- `incident-evidence.md`
- `logs-metrics-traces.md`

**Coverage:**

- Symptom, blast radius, recent change, log, metric, trace, queue, job, dependency status.
- User impact가 active이면 root-cause depth보다 mitigation을 먼저 둡니다.
- Follow-up worklog와 durable runbook promotion.

## Workstream B: Frontend Quality Pack

### Task B1: Frontend State And Data Flow

**Skill:** `frontend/frontend-state-data-flow`

**References:**

- `state-ownership.md`
- `server-client-cache-boundaries.md`

**Coverage:**

- State ownership, derived state, server cache, optimistic update, stale data, invalidation, URL state.
- Loading, empty, error, retry, race, cancellation path.
- Framework-agnostic guidance를 기본으로 하고 필요한 경우 stack-specific note만 reference에 둡니다.

### Task B2: Frontend Accessibility Review

**Skill:** `frontend/frontend-accessibility-review`

**References:**

- `keyboard-focus-review.md`
- `semantic-interaction-review.md`

**Coverage:**

- Keyboard path, focus order, focus trap, dialog/menu/listbox semantic, form error, label, announcement.
- Visual style guidance로 번지지 않도록 color contrast와 reduced motion은 review point로만 다룹니다.

### Task B3: Visual Regression QA

**Skill:** `frontend/visual-regression-qa`

**References:**

- `visual-snapshot-checks.md`
- `responsive-overflow-checks.md`

**Coverage:**

- Desktop/mobile viewport check, screenshot diff, overflow, clipping, font-size consistency, dynamic text state.
- 특정 test runner를 가정하지 않는 browser verification과 artifact naming.

## Workstream C: Data And Documentation Pack

### Task C1: Analytics Reporting Review

**Skill:** `data/analytics-reporting-review`

**References:**

- `metric-definition-review.md`
- `dashboard-report-review.md`

**Coverage:**

- Metric definition, grain, filter, denominator, source freshness, segmentation, chart/table consistency.
- Report caveat와 evidence boundary.

### Task C2: Data Migration Integrity

**Skill:** `data/data-migration-integrity`

**References:**

- `migration-integrity-checks.md`
- `backfill-reconciliation.md`

**Coverage:**

- Backfill, idempotency, batching, lock, rollback, reconciliation query, sampling.
- 필요하면 application migration과 analytics/warehouse migration을 분리합니다.

### Task C3: ADR Spec Handoff

**Skill:** `project/adr-spec-handoff`

**References:**

- `adr-decision-capture.md`
- `spec-worklog-promotion.md`

**Coverage:**

- 중요한 decision, constraint, completed milestone을 durable ADR/spec/worklog material로 옮깁니다.
- Chat transcript나 raw reference text를 복사하지 않고 무엇이 왜 바뀌었는지 보존합니다.

## Workstream D: Workflow And Catalog Follow-Through

### Task D1: Recipe Coverage Review

**목적:** 기존 recipe가 새 pack에 충분한지, 좁은 범위의 recipe를 추가해야 하는지 판단합니다.

**Candidate recipes:**

- `deployment-release`
- `frontend-quality-review`
- `data-integrity-review`

**Acceptance:**

- 단순 skill invocation이 아니라 반복 가능한 multi-step run을 설명할 때만 recipe를 추가합니다.
- 각 recipe는 inputs, outputs, skills, tools, stop conditions, verification을 나열합니다.

### Task D2: Taxonomy And Translation Checks

**목적:** Capability pack 추가분이 install 가능하고 discoverable한 상태를 유지합니다.

**Acceptance:**

- New skill은 frontmatter와 one-level reference validation을 통과합니다.
- Korean translation을 같은 변경에 추가합니다.
- `catalog check`가 예상 skill count와 wrapper drift 없음 상태를 보고합니다.
- Packaging과 public-doc hygiene check가 계속 통과합니다.

## Implementation Order

1. 이 plan을 추가하고 commit합니다.
2. Devops And Release Pack을 구현합니다.
3. Devops And Release Pack을 validate, translate, commit합니다.
4. Frontend Quality Pack을 구현합니다.
5. Frontend Quality Pack을 validate, translate, commit합니다.
6. Data And Documentation Pack을 구현합니다.
7. Data And Documentation Pack을 validate, translate, commit합니다.
8. Workflow recipe coverage를 검토하고 ambiguity를 실제로 줄이는 recipe만 추가합니다.
9. Full verification set을 실행하고 remaining gap을 기록합니다.

## Verification Per Pack

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Non-Goals

- Default network scanning이나 telemetry는 넣지 않습니다.
- Vendor-specific primary skill은 만들지 않습니다.
- Public doc에 raw reference dump를 넣지 않습니다.
- 이번 batch에서는 MCP project-write를 확장하지 않습니다.
- Automatic memory promotion은 넣지 않습니다.
