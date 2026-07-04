# AI Agent Playbook v2 Repo Ops Graph And Quality Gates Plan

> **구현자용:** eval/witness/source-registry runtime schema와 MCP reader surface 이후 이어서 진행합니다. 각 batch는 검토 가능하고, 검증되고, 번역되며, 커밋된 상태로 유지합니다.

**목표:** 현재 runtime index를 더 높은 수준의 repo intelligence 계층으로 만들고 CI, release, security, compliance, evidence locator integrity를 위한 operational quality gate를 추가합니다. 하네스는 project source file을 쓰거나 generated summary를 durable memory로 신뢰하지 않고도 "무엇이 연결되어 있는가?", "이 사실을 증명하는 evidence는 무엇인가?", "이 변경이 ship되기 전에 어떤 gate를 통과해야 하는가?"에 답할 수 있어야 합니다.

**레퍼런스 입력:** Local reference collection에서는 graph-shaped repo understanding, source locator contract, CI/release gate discipline, implementation edit와 분리된 security/compliance check 패턴이 반복됩니다. 이 패턴을 local schema, runtime report, MCP read tool, workflow recipe, skill로 채택합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## Baseline

- Runtime index는 이미 file inventory, symbol outline, dependency inventory, route/API/data hint, capability history, schema check, generic runtime artifact validation을 제공합니다.
- MCP는 read-only catalog, layout, index, runtime schema-check, operator, contract, managed-state, QA, LSP/AST analysis 도구를 노출합니다.
- Skill은 여러 domain을 다루지만 operational gate는 아직 CI triage, release readiness, security review, package/dependency check에 분산되어 있습니다.
- Generated evidence는 검증할 수 있지만 evidence locator integrity는 아직 first-class가 아닙니다.
- Runtime artifact는 독립적으로 존재하지만 file, symbol, route, package, doc, contract, workflow, evidence record를 하나의 검토 가능한 view로 연결하는 graph report는 없습니다.

## Design Principles

- **Graph는 evidence이지 truth가 아닙니다:** Repo graph output은 `.ai-agent-playbook/runtime/` 아래에 두며 source index, scan range, timestamp, confidence를 명시합니다.
- **Claim 전에 locator가 있어야 합니다:** 인용한 file, source, report, registry item은 target-relative locator 또는 선언된 external source boundary로 다시 열 수 있어야 합니다.
- **Ship 전에 gate가 있어야 합니다:** CI, release, security, license, dependency, migration, documentation gate는 stop condition이 있는 명시적 workflow step이어야 합니다.
- **Hidden write는 없습니다:** Runtime graph와 gate check는 기본 read-only입니다. 미래 write는 기존 `--apply`/write-gate pattern을 쓰고 managed playbook path 내부에 제한합니다.
- **기본 network는 없습니다:** SBOM, CVE, registry, deployment, remote issue tracker check는 기본 scan이 아니라 optional source adapter로 모델링합니다.
- **승격은 명시적으로 합니다:** Repo graph fact, locator check, gate result는 검토와 promotion 없이 memory map이나 canon fact가 되지 않습니다.

## Workstream A: Runtime Repo Graph

### Task A1: Repo Graph Builder

**Candidate runtime surface:** `graph preview <target>`와 optional future `graph build <target> --apply`

**목적:** 기존 runtime index를 조합해 file, symbol, route, package manifest, contract, rule, doc, runtime evidence 사이의 관계를 보여주는 compact graph report를 만듭니다.

**예정 파일:**

- Create: `src/runtime/repo-graph.mjs`
- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**동작:**

- 기본 command는 read-only preview입니다.
- 기존 index artifact가 있으면 소비하고, 없으면 read-only index builder를 호출해 preview-only input을 만들 수 있습니다.
- Output은 `schemaVersion`, `kind: runtime.repo-graph`, `target`, `mode`, `generatedAt`, `scanRange`, `sources`, `nodes`, `edges`, `summary`, `warnings`, `conflicts`를 포함합니다.
- Node kind는 `file`, `symbol`, `route`, `package`, `contract`, `rule`, `doc`, `runtime-report`, `workflow`를 포함합니다.
- Edge kind는 `contains`, `exports`, `mentions`, `defines-route`, `uses-package`, `covered-by-contract`, `related-doc`, `evidence-for`를 포함합니다.
- 각 edge는 source path, confidence, source pattern을 기록합니다.
- Graph는 기본 compact mode를 사용합니다. Output count를 제한하고 truncation은 `summary`에 보고합니다.

**Acceptance:**

- 파일을 쓰지 않고 동작합니다.
- 선언된 runtime index/report artifact를 읽는 경우를 제외하고 generated runtime folder를 source input에서 제외합니다.
- Target-relative portable path만 사용합니다.
- Source evidence 없이 ownership이나 architecture boundary를 추론하지 않습니다.

### Task A2: Repo Graph Schema Validation

**목적:** Repo graph artifact를 runtime schema-check와 future MCP inspection 대상으로 만들 수 있게 합니다.

**예정 파일:**

- Modify: `src/runtime/schemas.mjs`
- Modify: `test/runtime-schemas.test.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations

**동작:**

- Known runtime schema kind에 `runtime.repo-graph`를 추가합니다.
- Graph envelope field, 허용된 node/edge kind, portable path, capped array, evidence source reference를 검증합니다.
- Absolute path, credential처럼 보이는 값, oversized inline text를 거부합니다.

**Acceptance:**

- Valid graph fixture가 통과합니다.
- Invalid edge kind, absolute path, oversized evidence field가 실패합니다.
- Generic runtime artifact validation은 backwards-compatible하게 유지합니다.

## Workstream B: Evidence Locator Integrity

### Task B1: Evidence Locator Contract

**Candidate skill/reference:** `ai-harness/evidence-locator-integrity`

**목적:** Agent가 다시 열 수 있는 evidence를 인용하고, generated evidence와 durable memory를 구분하며, scan range 없는 structure/absence claim을 피하도록 안내합니다.

**예정 파일:**

- Create skill: `skills/ai-harness/evidence-locator-integrity/SKILL.md`
- Create references:
  - `skills/ai-harness/evidence-locator-integrity/references/locator-contract.md`
  - `skills/ai-harness/evidence-locator-integrity/references/claim-scan-range-rules.md`
- Modify: `docs/classification.md`
- Modify matching Korean translations
- Test: skill validation and catalog check

**Coverage:**

- Path-range, symbol, runtime-artifact, source-registry, command-output, URL, issue, database, manual-observation locator shape.
- Scan range, freshness, source boundary, confidence, caveat의 required field.
- Anti-pattern: scan range 없는 "사용처 없음" 주장, 복사된 local absolute path, secret-bearing evidence, uncapped excerpt, stale generated summary.

**Acceptance:**

- Skill은 concise trigger-focused frontmatter를 가집니다.
- 재사용 세부사항은 긴 SKILL body가 아니라 references에 둡니다.
- Catalog는 stack-specific primary skill을 추가하지 않고 `ai-harness` 아래에 배치합니다.

### Task B2: Locator Check CLI

**Candidate CLI surface:** `evidence locator-check <target> --path <json-or-md>`

**목적:** Runtime report, source registry entry, markdown evidence note가 다시 열 수 있는 locator와 안전한 source boundary를 포함하는지 검증합니다.

**예정 파일:**

- Create: `src/runtime/evidence-locators.mjs`
- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/commands.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**동작:**

- 기본 read-only입니다.
- Target-relative JSON 또는 Markdown을 받습니다.
- JSON은 알려진 locator field를 recursive하게 검증합니다.
- Markdown은 존재하는 경우 fenced evidence block 또는 간단한 locator table row를 검증합니다.
- Missing scan range, non-portable path, credential-looking value, unknown source boundary를 보고합니다.

**Acceptance:**

- 파일을 쓰지 않습니다.
- Missing file과 malformed JSON은 absolute local path를 그대로 출력하지 않고 safe conflict를 보고합니다.
- Locator block이 없는 Markdown은 hard failure가 아니라 advisory warning을 반환합니다.

## Workstream C: Operational Quality Gates

### Task C1: CI Quality Gate Skill And Recipe

**Candidate skill:** `delivery/ci-quality-gate`

**Candidate recipe:** `ci-quality-gate`

**목적:** "실패한 command를 고친다"에서 required check, optional check, skipped check, failure owner, retry policy, merge/release stop condition을 식별하는 gate model로 이동합니다.

**Coverage:**

- Lint/type/test/build/package/docs/translation/schema check.
- Flake handling, retry limit, environment parity, dependency cache caveat, artifact retention.
- Local reproduction과 CI-only environment issue 분리.

**Acceptance:**

- Recipe input은 target branch, change type, required check, optional check, environment, artifact, owner를 포함합니다.
- Output은 gate summary, blocked check, skipped check, residual risk, next verification command를 포함합니다.
- Prompt와 workflow guidance는 CI가 clean하다고 주장하기 전에 evidence를 요구합니다.

### Task C2: Release And Deployment Gate Skill

**Candidate skill:** `devops/release-deployment-gate`

**목적:** Artifact identity, rollback path, migration gate, configuration diff, monitoring hook, release notes status를 요구해 deployment/release check를 package readiness 이상으로 강화합니다.

**Coverage:**

- Web/app/backend/package deployment.
- Feature flag, config/env change, database migration, background worker, queue consumer, cron job, observability, rollback, post-release verification.
- Credential과 deployment endpoint에 대한 local-only boundary.

**Acceptance:**

- 기존 deployment/release skill과 중복하지 않고 보완합니다.
- Reference는 release gate checklist와 rollback evidence contract를 정의합니다.
- Recipe 또는 prompt는 관련 상황에서 `dependency_inventory`, `diagnostics_check`, `operator_search`, `route_api_hints`, `runtime_schema_check`, `write_gate_preview`, `canon_check`로 라우팅합니다.

### Task C3: Security Compliance Gate Skill

**Candidate skill:** `security/security-compliance-gate`

**목적:** Merge 또는 publish 전에 secret, auth/access control, dependency/license notice, data exposure, generated artifact, runtime evidence safety를 확인하는 gate를 추가합니다.

**Coverage:**

- Secret-like value, local absolute path, private URL, credential boundary, license/notice file, dependency manifest, authz-sensitive route, generated report hygiene.
- 기본값에서 live vulnerability database call은 하지 않습니다. Source adapter는 이후 모델링할 수 있습니다.

**Acceptance:**

- Skill은 기존 security, dependency, license, runtime schema capability로 라우팅합니다.
- Reference는 `block`, `warn`, `document` severity를 정의합니다.
- Validation guidance는 관련 상황에서 public-doc hygiene과 translation coverage를 포함합니다.

## Workstream D: MCP Reader Surface

### Task D1: Repo Graph And Locator MCP Tools

**Candidate MCP tools:**

- `repo_graph_preview`
- `evidence_locator_check`

**목적:** MCP-capable app이 직접 filesystem을 탐색하지 않고 graph와 locator integrity를 검사할 수 있게 합니다.

**Acceptance:**

- Tool은 read-only annotated입니다.
- Test는 tool listing, successful call, conflict call, no-write behavior를 증명합니다.
- Write-capable graph build나 source rewrite는 노출하지 않습니다.

### Task D2: Gate Review Prompts

**Candidate MCP prompts:**

- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`
- `repo_graph_review`

**목적:** Operational gate를 required evidence, optional evidence, stop condition, verification expectation이 있는 reusable task brief로 변환합니다.

**Acceptance:**

- Prompt test는 required tool name과 stop condition을 확인합니다.
- Prompt는 `apply: true`를 포함하지 않습니다.
- Prompt는 기존 read-only tool을 우선 사용하고, future write proposal에 대해서만 `write_gate_preview`로 라우팅합니다.

## Workstream E: Documentation, Translation, And Validation

### Task E1: Runtime And Permission Docs

**예정 파일:**

- `docs/harness-runtime.md`
- `docs/mcp-permission-model.md`
- `docs/commands.md`
- Matching Korean translations

**Acceptance:**

- Docs는 graph와 locator output이 generated runtime evidence임을 명시합니다.
- Docs는 MCP가 read-only를 유지한다고 명시합니다.
- Docs는 runtime graph, memory map, canon promotion을 구분합니다.

### Task E2: Validation Matrix

**Commands:**

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\validate-public-docs.ps1
node bin\aapb.mjs catalog check --json
node bin\aapb.mjs skills lint --json
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

**Acceptance:**

- 모든 committed batch는 changed behavior에 대한 targeted test를 포함합니다.
- Public docs에는 개인 경로, credential, 내부 URL, noisy source label, branch name, PR number가 없어야 합니다.
- 각 커밋 전 staged file은 의도한 batch와 일치해야 합니다.

## Initial Execution Order

1. 이 계획과 한국어 번역을 추가합니다.
2. 기존 runtime index builder 위에 repo graph preview를 구현합니다.
3. Runtime repo-graph schema validation을 추가합니다.
4. Evidence locator skill과 reference contract를 추가합니다.
5. Locator-check CLI를 추가합니다.
6. Graph와 locator check용 MCP read tool을 추가합니다.
7. CI quality gate skill과 recipe를 추가합니다.
8. Release/deployment gate skill과 reference를 추가합니다.
9. Security compliance gate skill과 reference를 추가합니다.
10. MCP gate review prompt와 prompt contract test를 추가합니다.
11. 필요에 따라 docs, translation, validation script 또는 schema를 갱신합니다.
12. 작고 검증된 batch 단위로 커밋합니다.

## Explicit Non-Goals

- MCP project-write tool은 추가하지 않습니다.
- 자동 code rewrite, rename, migration, deployment, package publish, remote issue update는 하지 않습니다.
- CVE, package registry, deployment, analytics, documentation crawling을 위한 default network call은 없습니다.
- Generated graph fact를 `.ai-agent-playbook/memory/`로 직접 승격하지 않습니다.
- Raw reference-project prose, branding, 큰 발췌문은 public docs에 넣지 않습니다.
