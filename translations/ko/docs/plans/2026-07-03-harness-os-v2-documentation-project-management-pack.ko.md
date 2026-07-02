# Harness OS v2 Documentation And Project Management Pack 계획

> **구현자용:** Data analytics depth pack 이후 이어서 진행합니다. Harness는 engineering, data, runtime, MCP guidance가 강해졌지만 documentation artifact와 project-management workflow는 아직 generic project docs와 handoff skill에 많이 의존합니다.

**목표:** Raw chat transcript나 generated report를 trusted project memory로 만들지 않으면서 requirements, PRD, issue/task breakdown, stakeholder-ready documentation package, changelog/release note, durable handoff artifact를 위한 capability-first guidance를 추가합니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 PRD generation, issue/triage conversion, teaching/briefing format, handoff record, markdown knowledge base, slide/report packaging, artifact manifest, generated docs validation 패턴이 반복됩니다. 이를 로컬 skill, reference, workflow recipe, MCP prompt로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## 기준 상태

- Foundation/project-facing skill에는 현재 `project-bootstrap`, `repo-onboarding`, `project-doc-system`, `adr-spec-handoff`가 있습니다.
- `documentation-package` workflow recipe는 있지만 PRD, issue plan, release note, stakeholder package, durable handoff, knowledge package output을 아직 구분하지 않습니다.
- MCP prompt에는 ADR/spec handoff와 workflow run review가 있지만 전용 documentation package 또는 project planning prompt는 없습니다.
- Generated runtime evidence는 이미 durable memory와 분리되어 있습니다. Documentation work도 이 경계를 유지해야 합니다.

## 레퍼런스에서 채택할 규칙

- **Artifact type과 source evidence를 분리합니다:** PRD, issue plan, changelog, report, handoff, knowledge package는 owner와 verification criteria가 다릅니다.
- **Generated note는 provisional로 둡니다:** Raw transcript, generated summary, runtime report는 검토 전까지 evidence candidate입니다.
- **Decision을 traceable하게 만듭니다:** Requirement와 issue는 reviewed goal, constraint, acceptance criteria, open question, verification evidence로 거슬러 올라갈 수 있어야 합니다.
- **Source noise를 피합니다:** Public docs는 reference project name, personal path, branch name, PR number, internal URL, raw excerpt를 물려받지 않아야 합니다.
- **Reader에 맞춰 package합니다:** Stakeholder docs, developer handoff, release note, knowledge base는 서로 다른 밀도, caveat, next-action framing이 필요합니다.
- **Docs도 code처럼 검증합니다:** Translation coverage, public-doc hygiene, stale placeholder, local-only boundary, runnable link 또는 command를 가능한 범위에서 확인합니다.

## Workstream A: Requirements And PRD Scope

### Task A1: Requirements PRD Scope Review Skill

**Candidate skill:** `project/requirements-prd-scope-review`

**References:**

- `prd-scope-checks.md`
- `acceptance-criteria-and-open-questions.md`

**Coverage:**

- Product requirement, feature scope, non-goal, persona, workflow, constraint, acceptance criteria, risk, open question.
- 불명확한 요청을 backend/API contract를 지어내지 않고 reviewable scope로 바꾸기.
- Stakeholder language와 implementation worklog 분리.

**Acceptance:**

- Skill은 PRD/spec을 만들 때와 plan/worklog/handoff를 만들 때를 구분합니다.
- Reference는 owner, success criteria, constraint, non-goal, dependency, open question을 요구합니다.
- 구현 시 docs와 translation은 새 skill을 project/foundation guidance에 포함합니다.

## Workstream B: Issue And Task Breakdown

### Task B1: Issue Planning Triage Skill

**Candidate skill:** `project/issue-planning-triage`

**References:**

- `issue-breakdown-checks.md`
- `triage-priority-and-dependencies.md`

**Coverage:**

- Spec, bug, review, worklog, user request를 scoped issue 또는 task batch로 변환.
- Priority, dependency, risk, verification, ownership, label, blocked/unblocked status.
- Acceptance criteria 없이 plan만 중복하는 noisy issue dump 방지.

**Acceptance:**

- Skill은 issue planning을 Git commit/PR guardrail과 분리합니다.
- Reference는 bug, feature, chore, docs, research, spike, follow-up issue shape를 구분합니다.
- 향후 workflow는 `documentation-package` 또는 새 planning recipe로 라우팅할 수 있습니다.

## Workstream C: Release Notes And Changelog

### Task C1: Release Notes Changelog Skill

**Candidate skill:** `project/release-notes-changelog`

**References:**

- `release-note-audience-checks.md`
- `changelog-risk-and-rollback.md`

**Coverage:**

- User-facing release note, internal changelog, migration note, upgrade note, rollback note, known issue, verification summary.
- User impact와 implementation detail/commit history 분리.

**Acceptance:**

- Skill은 `git-worklog-guardrails`를 중복하지 않고 reader-facing release artifact에 집중합니다.
- Reference는 change grouping, risk/caveat handling, migration/rollback note, verified test evidence를 요구합니다.

## Workstream D: Documentation Artifact Package

### Task D1: Documentation Artifact Package Skill

**Candidate skill:** `project/documentation-artifact-package`

**References:**

- `artifact-package-manifest.md`
- `reader-handoff-and-maintenance.md`

**Coverage:**

- Docs, runbook, diagram, report, screenshot, decision record, source reference, evidence를 bounded documentation deliverable로 package.
- Stakeholder package, developer handoff, internal knowledge base 구분.
- Update cadence, ownership, archive path, stale-content marker.

**Acceptance:**

- Skill은 generated report를 검토와 승격 전까지 runtime에 유지합니다.
- Reference는 manifest, audience, source evidence, freshness, caveat, owner, maintenance path를 요구합니다.
- `project-doc-system`, `adr-spec-handoff`, `context-engineering-memory-design`와 함께 작동합니다.

## Workstream E: Workflow And MCP Follow-Up

### Task E1: Documentation Package Recipe Expansion

**Candidate recipe update:** `documentation-package`

**Acceptance:**

- Inputs에 audience, artifact type, source evidence, owner, freshness, sensitive-data boundary, translation needs, maintenance path를 포함합니다.
- Skills는 구현된 requirements PRD scope, issue planning, release notes/changelog, documentation artifact package, ADR/spec handoff, project doc system을 포함합니다.
- Verification은 public-doc hygiene, translation coverage, link/path check, placeholder check, source evidence review, archive/update path를 포함합니다.

### Task E2: Documentation Package Review Prompt

**Candidate prompt:** `documentation_package_review`

**Acceptance:**

- Prompt는 read-only로 유지합니다.
- Prompt는 `workflow_run_preview` recipe `documentation-package`, `playbook_context`, `operator_search`, `canon_check`, `write_gate_preview`, public-doc/translation validation guidance로 라우팅합니다.
- Prompt는 output이 PRD/spec, issue plan, release note/changelog, handoff, knowledge package, 또는 durable doc 불필요 중 무엇인지 묻습니다.

## Workstream F: Docs, Tests, And Catalog

**Acceptance:**

- README skill list와 category summary에 새 project/documentation skill을 반영합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`에 documentation/project-management map을 문서화합니다.
- 한국어 번역을 같은 변경에서 갱신합니다.
- Skill이 구현되면 skill count 기대값을 갱신합니다.
- Catalog는 warning-free 상태를 유지합니다.

## Workstream G: 검증

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
2. Upstream planning quality를 높이는 `requirements-prd-scope-review`와 `issue-planning-triage`를 먼저 추가합니다.
3. `release-notes-changelog`와 `documentation-artifact-package`를 reference와 translation과 함께 추가합니다.
4. README, classification, taxonomy docs, skill-count test를 갱신합니다.
5. `documentation-package` recipe와 smoke coverage를 확장합니다.
6. `documentation_package_review` MCP prompt와 prompt contract test를 추가합니다.
7. 전체 검증을 다시 실행하고 다음 표면이 project-management workflow automation, design/visual artifact generation, managed-write tier implementation 중 무엇인지 결정합니다.

## 비목표

- Raw transcript를 public docs에 저장하지 않습니다.
- 기본값에 issue tracker, wiki, slide deck, document service integration을 자동 추가하지 않습니다.
- Generated runtime report는 검토 없이 durable memory로 승격하지 않습니다.
- Reusable docs에 private reference source name, internal URL, credential, branch name, PR number를 넣지 않습니다.
