# Harness OS v2 Index, MCP, Capability Expansion Plan

> **구현자용:** 완료된 transaction/canon 및 backend/security slice 이후부터 이어서 실행합니다. 각 batch는 독립적으로 검토 가능하고, 검증 가능하고, 커밋 가능해야 합니다.

**Goal:** Harness OS를 단순한 skill/playbook catalog에서 더 넓은 개발 운영 표면으로 확장합니다. 더 풍부한 local runtime index, 쓸모 있는 read-only MCP resource/prompt, workflow run record, devops/frontend quality/mobile/data/documentation/harness extension capability pack을 추가합니다.

**Architecture:** trusted memory, generated runtime evidence, integration setting을 계속 분리합니다. Runtime index output은 `.ai-playbook/runtime/` 아래 local generated artifact로 두고, promoted fact는 명시적인 canon promotion을 거쳐야 합니다. MCP는 기본 read-only이며 scaffold/write 동작은 opt-in 및 audit 가능한 방식으로만 둡니다.

**Reference Inputs:** local `_reference/` collection은 pattern input으로만 사용합니다. contract, schema, validation idea, workflow boundary, skill-authoring style을 채택합니다. 큰 upstream excerpt, upstream branding, 개인 절대 경로, internal URL, reference-specific noisy name은 public docs에 복사하지 않습니다.

---

## Current Baseline

- `.ai-playbook` layout v2는 memory/runtime/integration 분리를 갖고 있습니다.
- Catalog check는 taxonomy v2와 compatibility wrapper를 이해합니다.
- Reference inventory와 ledger validation이 있습니다.
- Write-gate advisory/post-check와 canon draft/check/promote는 read-only default를 유지합니다.
- MCP는 read-only catalog, layout, reference, write-gate, canon surface를 노출합니다.
- Backend/security capability pack은 primary skill과 stack/profile reference를 포함합니다.

## Design Principles

- Evidence first: 생성된 map이나 fact는 source file, scan range, confidence, timestamp를 가져야 합니다.
- Runtime before memory: generated index는 명시적인 review/promotion 없이는 trusted map이 되지 않습니다.
- Capability before stack: stack profile은 skill을 보조하지만 primary skill name은 problem type을 설명합니다.
- MCP as reader surface first: write-capable tool 확장 전에 resource와 prompt를 먼저 추가합니다.
- Validation is part of the feature: 새 artifact shape에는 schema check, fixture, command test를 붙입니다.
- Reference adoption stays clean: 외부 예시는 local contract 설계에만 사용하고 noise를 가져오지 않습니다.

## Workstream A: Runtime Index v2

### Task A1: Symbol And Function Outline Index

**Purpose:** agent가 function, class, exported component, controller, job 위치를 이해할 수 있도록 작은 language-tolerant outline을 추가합니다.

**Planned files:**

- Create: `src/runtime/symbol-outline.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/harness.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Behavior:**

- Command: `index symbol-outline <target>`
- 기본 모드는 preview/read-only입니다.
- Output schema는 `schemaVersion`, `target`, `scanRange`, `generatedAt`, `entries`, `warnings`를 포함합니다.
- Entry는 `file`, `language`, `kind`, `name`, `line`, `confidence`, `source`를 포함합니다.
- 먼저 common text pattern 기반 lightweight extractor를 사용하고 AST package나 network access를 요구하지 않습니다.
- 불확실한 finding은 정확한 coverage처럼 보이지 않게 `low` confidence로 표시합니다.

**Acceptance:**

- JS/TS, Java/Kotlin/C#/PHP/Python/Go fixture에서 기본 pattern 수준으로 동작합니다.
- `.ai-playbook/runtime/`, dependency directory, binary file, large generated file은 건너뜁니다.
- 명시적인 미래 `--apply` command가 추가되기 전까지 파일을 쓰지 않습니다.

### Task A2: Route/API/Data Map Hints

**Purpose:** route, API endpoint, query, migration, data-flow hint를 generated evidence로 추출하고 이후 canon promotion에 연결할 수 있게 합니다.

**Planned files:**

- Create: `src/runtime/route-api-hints.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `index route-api-hints <target>`
- Express/Fastify/Nest, Spring MVC, ASP.NET, Django/FastAPI, Laravel/PHP, Next/React route의 visible hint를 lightweight 방식으로 감지합니다.
- credential을 해석하거나 database에 연결하지 않고 SQL/migration/query file hint를 감지합니다.
- confidence와 matched pattern name을 출력합니다.

**Acceptance:**

- Generated output은 canonical architecture가 아니라 hint로 명확히 표시합니다.
- 각 hint는 가능한 경우 source file과 line 정보를 포함합니다.
- snippet 안의 sensitive string은 redaction합니다.

### Task A3: Dependency And Supply-Chain Inventory

**Purpose:** vulnerability scanner가 되지 않으면서 dependency review와 SBOM workflow를 지원하는 read-only package/lock/container inventory를 제공합니다.

**Planned files:**

- Create: `src/runtime/dependency-inventory.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `index dependency-inventory <target>`
- npm/pnpm/yarn, Maven/Gradle, NuGet, Composer, pip/Poetry, Go modules, Dockerfile, Compose, GitHub Actions manifest와 lockfile을 읽습니다.
- ecosystem, manifest path, lockfile path, script hook, container base image, missing lockfile warning을 보고합니다.
- 이번 batch에서는 vulnerability database나 license를 network로 조회하지 않습니다.

**Acceptance:**

- package script를 실행하지 않습니다.
- lockfile 부재는 failure가 아니라 warning입니다.
- finding은 `dependency-supply-chain-review`와 future MCP resource에 연결할 수 있습니다.

## Workstream B: MCP v2 Reader Surface

### Task B1: Index Resources

**Purpose:** MCP에서 runtime index를 직접 filesystem을 탐색하지 않고도 확인할 수 있게 합니다.

**Planned files:**

- Modify: `src/mcp-tools.mjs`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations
- Test: `test/mcp.test.mjs`

**Resources/tools:**

- `index_status`: 사용 가능한 runtime index artifact와 schema version을 나열합니다.
- `index_search`: generated index entry를 kind, file, name, confidence로 검색합니다.
- `symbol_outline`: 최신 symbol outline artifact가 있으면 읽습니다.
- `dependency_inventory`: 최신 dependency inventory artifact가 있으면 읽습니다.

**Acceptance:**

- MCP는 `.ai-playbook/runtime/indexes`와 `.ai-playbook/runtime/reports`만 읽습니다.
- index가 없으면 실행 가능한 empty state를 반환합니다.
- MCP write tool은 기본으로 노출하지 않습니다.

### Task B2: Prompt Packs For Review Workflows

**Purpose:** 새 skill과 runtime evidence를 통해 agent를 안내하는 reusable prompt를 추가합니다.

**Planned files:**

- Modify: `src/mcp-prompts.mjs` if prompts are separated, otherwise `src/mcp-tools.mjs`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations
- Test: `test/mcp.test.mjs`

**Prompts:**

- Backend change review
- Auth/access-control review
- Dependency/supply-chain review
- Canon promotion review
- Index interpretation and promotion candidate review

**Acceptance:**

- Prompt는 필요한 evidence와 stop condition을 명시합니다.
- Prompt는 generated hint와 trusted memory를 구분합니다.
- Prompt text는 generic하게 유지하고 reference-specific noise를 피합니다.

## Workstream C: Workflow Runs

### Task C1: Run Manifest Preview

**Purpose:** 긴 harness 작업이 대화 기록에 의존하지 않고 inspect 가능한 run record를 만들 수 있게 합니다.

**Planned files:**

- Create: `src/runtime/workflow-runs.mjs`
- Modify: `src/cli.mjs`
- Modify: `templates/project-playbook/workflows/`
- Modify: `docs/playbook-layout-v2.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `workflow run-preview <recipe> <target>`
- Output은 recipe id, inputs, selected skill categories, planned artifacts, verification, blockers, handoff notes를 포함합니다.
- Preview는 read-only입니다. 미래 apply는 `.ai-playbook/workflows/runs/` 아래에만 씁니다.

**Acceptance:**

- Run manifest는 전체 chat을 읽지 않아도 inspect할 수 있습니다.
- Worklog promotion은 명시적이고 분리된 상태로 남습니다.

### Task C2: Recipe Expansion

**Purpose:** skill, index, MCP prompt를 반복 가능한 flow로 묶는 recipe를 추가합니다.

**Recipes:**

- backend change
- auth/access-control audit
- dependency/supply-chain review
- CI/deployment triage
- frontend visual/accessibility review
- mobile release QA
- documentation package
- harness extension

**Acceptance:**

- 각 recipe는 input, output, required skill, optional runtime index, stop condition, verification을 명시합니다.
- Recipe는 stack lock-in을 피하고 필요한 경우에만 stack profile을 참조합니다.

## Workstream D: Capability Pack Expansion

### Task D1: Devops Pack

**Primary skills:**

- `container-change-safety`
- `deployment-release-check`
- `observability-incident-triage`

**References:**

- Docker/Compose, Kubernetes, GitHub Actions, Jenkins, Vercel/Netlify-style deployment, logs/metrics/traces, rollback planning.

**Acceptance:**

- Skill은 trigger-focused로 유지합니다.
- 자세한 절차는 one-level reference에 둡니다.
- Korean translation은 같은 change에 포함합니다.

### Task D2: Frontend Quality Pack

**Primary skills:**

- `frontend-state-data-flow`
- `frontend-accessibility-review`
- `visual-regression-qa`

**References:**

- React/Vue/Svelte/Angular profile, accessibility checklist, responsive overflow check, design token review, browser verification.

**Acceptance:**

- 기존 UI polish skill을 중복하지 않고, 새 skill은 별도 problem space를 다룹니다.
- Visible UI work에 대한 browser verification expectation을 명시합니다.

### Task D3: Data And Documentation Pack

**Primary skills:**

- `analytics-reporting-review`
- `data-migration-integrity`
- `adr-spec-handoff`

**References:**

- Metric definition, ETL boundary, migration rollback, reporting validation, ADR/spec/worklog handoff.

**Acceptance:**

- Data skill은 analytical evidence와 source-of-truth record를 분리합니다.
- Documentation skill은 project-specific assumption을 피합니다.

## Workstream E: Validators And Documentation Hygiene

### Task E1: Public Doc Leak Check

**Purpose:** public docs에 개인 경로, internal URL, credential, noisy reference import가 들어가는 것을 막습니다.

**Planned files:**

- Create: `scripts/validate-public-docs.ps1`
- Modify: `package.json`
- Modify: `docs/maintenance.md`
- Modify matching Korean translations if docs change
- Test: script smoke checks where practical

**Acceptance:**

- 개인 절대 경로, obvious secret, large raw excerpt, internal URL marker에서 실패합니다.
- 문서화된 placeholder와 안전한 예시는 허용합니다.

### Task E2: Artifact Schema Checks

**Purpose:** MCP가 노출하기 전에 runtime index artifact의 일관성을 보장합니다.

**Planned files:**

- Create or modify: `src/runtime/schemas.mjs`
- Modify: relevant runtime modules
- Test: runtime and CLI fixtures

**Acceptance:**

- Index artifact는 schema version과 required top-level field를 선언합니다.
- Invalid artifact는 actionable message와 함께 깨끗하게 실패합니다.

## Implementation Order

1. 이 계획을 추가하고 커밋합니다.
2. Symbol outline index preview를 test와 docs와 함께 구현합니다.
3. 기존 runtime artifact 위에 MCP index status/search를 추가합니다.
4. Dependency inventory index preview를 추가합니다.
5. Route/API/data hint index preview를 추가합니다.
6. 새 capability pack을 사용하는 backend/security MCP prompt를 추가합니다.
7. Workflow run-preview와 첫 recipe expansion을 추가합니다.
8. Devops capability pack을 추가합니다.
9. Frontend quality capability pack을 추가합니다.
10. Data/documentation capability pack을 추가합니다.
11. Public doc leak validation을 추가합니다.
12. 전체 검증을 다시 실행하고 남은 gap을 요약합니다.

## Verification Per Batch

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- changed behavior에 대한 targeted CLI/MCP/runtime test
- `git diff --check`

## Non-goals For This Batch

- 기본 embedding 없음.
- network vulnerability lookup 없음.
- MCP를 통한 automatic code edit 없음.
- runtime에서 memory로 automatic promotion 없음.
- 넓은 stack-specific skill sprawl 없음.
- public docs에 raw upstream reference dump 없음.
