# AI Agent Playbook v2 Workflow, Prompt, Verification Hardening Plan

> **구현자용:** runtime index와 MCP reader slice 이후부터 이어서 실행합니다. 이 계획은 새 evidence surface를 반복 가능한 run, 더 안전한 prompt, 더 강한 validation gate로 연결합니다.

**Goal:** AI Agent Playbook를 더 운영 가능한 형태로 만듭니다. Agent는 chat history에만 의존하지 않고 recipe를 선택하고, run contract를 preview하고, 관련 evidence를 모으고, MCP prompt를 따르고, 검증 가능한 artifact를 남길 수 있어야 합니다.

**Reference inputs:** local reference set에서 반복적으로 확인된 패턴을 채택합니다. Machine evidence와 scan range 계약, repo-local config precedence, no-write 및 no-data-loss guard, graph-style one-hop impact context, append-only capability history, SBOM/SCA gate, third-party notice check, cached bootstrap behavior가 핵심입니다. 이들은 upstream prose 복사가 아니라 local contract와 validator로 흡수합니다.

---

## Baseline

- Symbol, dependency inventory, route/API/data hint에 대한 runtime preview index가 있습니다.
- MCP는 catalog, layout, write-gate, canon, operator, context, contract, managed-state surface와 함께 read-only index tool을 노출합니다.
- Project playbook v2는 이미 `workflows/recipes`, `workflows/runs`, `runtime/indexes`, `runtime/reports`, `memory`, `contracts`, `knowledge` 분리를 갖고 있습니다.
- 기존 recipe는 Inputs, Outputs, Skills, Tools, Stop conditions, Verification field를 가진 Markdown file입니다.
- Public docs와 Korean translation은 같이 관리하지만 public-doc leak validation은 아직 대부분 수동입니다.

## Reference-Derived Rules To Adopt

- **Evidence contract:** 구조적 claim에는 source file, scan range, confidence, generated time이 필요합니다.
- **Absence contract:** "없다"는 searched root, skipped directory, degraded/unknown state가 있을 때만 유효합니다.
- **Repo-local precedence:** target-local config는 user-level default보다 우선하고, env flag는 둘 모두를 명시적으로 override할 수 있습니다.
- **Symlink and path safety:** write 또는 trust boundary가 있는 local config와 generated artifact read에서는 traversal과 symlink surprise를 거부해야 합니다.
- **No-data-loss writes:** apply-mode feature는 empty output, identical no-op rewrite, malformed JSON, 검증 불가능한 backup path를 거부해야 합니다.
- **Graph-aware impact:** graph/index evidence가 있으면 changed file을 known node와 one-hop neighbor로 연결하고, unmapped file은 계속 표시해야 합니다.
- **Append-only history:** performance, capability, run evidence는 가능하면 append-only로 남기며 reviewed fact를 조용히 대체하지 않습니다.
- **Packaging compliance:** shipped artifact는 dry-run pack check, notice/license presence check, 명시적 generated-file boundary를 가져야 합니다.

## Workstream A: Workflow Run Preview

### Task A1: Recipe Parser And Run Manifest Preview

**Purpose:** 기존 Markdown recipe를 파일 쓰기 없이 안정적이고 inspect 가능한 run manifest로 변환합니다.

**Planned files:**

- Create: `src/runtime/workflow-runs.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/harness.mjs`
- Modify: `docs/commands.md`
- Modify: `docs/playbook-layout-v2.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Behavior:**

- Command: `workflow run-preview <target> --recipe <recipe-id> [--json]`
- target playbook의 recipe를 먼저 읽고, 없으면 bundled template을 읽습니다.
- 알려진 section을 `inputs`, `outputs`, `skills`, `tools`, `stopConditions`, `verification`으로 parsing합니다.
- `schemaVersion`, `kind`, `target`, `recipe`, `mode`, `generatedAt`, `summary`, `manifest`, `warnings`, `conflicts`를 반환합니다.
- Preview는 read-only이며 `workflows/runs` artifact를 만들지 않습니다.

**Acceptance:**

- 기존 Markdown recipe에서 migration 없이 동작합니다.
- 없는 recipe는 실행 가능한 conflict를 반환합니다.
- Output은 bundled fallback recipe와 target-local recipe를 구분합니다.
- Recipe text는 자동으로 trusted memory가 되지 않습니다.

### Task A2: Run Apply Contract Draft

**Purpose:** write를 열기 전에 미래 apply-mode contract를 문서로 먼저 고정합니다.

**Planned files:**

- Modify: `docs/harness-runtime.md`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations

**Behavior:**

- 미래 `workflow run-start`는 project-write가 아니라 scaffold-tier로 문서화합니다.
- `.ai-playbook/workflows/runs/` 아래에만 쓸 수 있습니다.
- manifest, criteria file, append-only ledger, handoff stub를 써야 합니다.

**Acceptance:**

- 이 slice에서는 apply command를 구현하지 않습니다.
- Permission model은 preview, scaffold, managed-write, project-write를 분명히 분리합니다.

## Workstream B: MCP Prompt Packs

### Task B1: Evidence-First Review Prompts

**Purpose:** Agent가 runtime index와 stop condition을 일관되게 쓰도록 좁고 재사용 가능한 prompt를 제공합니다.

**Planned files:**

- Modify: `src/mcp-tools.mjs`
- Modify: `docs/mcp-permission-model.md`
- Modify matching Korean translations
- Test: `test/mcp.test.mjs`

**Prompts:**

- `backend_change_review`
- `auth_access_control_review`
- `dependency_supply_chain_review`
- `workflow_run_review`
- `canon_promotion_review`
- `index_interpretation_review`

**Acceptance:**

- 각 prompt는 required evidence, optional evidence, stop condition, verification expectation을 명시합니다.
- Prompt text는 generated hint와 trusted memory를 구분합니다.
- Prompt는 write access를 부여하지 않고, 사용자에게 JSON 수작성을 요구하지 않습니다.

### Task B2: Prompt Drift Tests

**Purpose:** Tool과 recipe가 변할 때 prompt mapping이 낡지 않도록 막습니다.

**Planned files:**

- Modify: `test/mcp.test.mjs`
- Modify or create: `test/prompt-contracts.test.mjs`

**Acceptance:**

- Test는 새 prompt가 관련 read-only tool을 언급하는지 확인합니다.
- Prompt가 stale tool name이나 obsolete write behavior를 안내하면 실패합니다.

## Workstream C: Config And Public Validation

### Task C1: Repo-Local Harness Config Preview

**Purpose:** Project가 user-level machine setting과 결합하지 않고 AI Agent Playbook default를 선언할 수 있게 합니다.

**Planned files:**

- Create: `src/core/config.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/config.test.mjs`

**Behavior:**

- `.ai-playbook/config.json`과 `.ai-playbook/config.local.json`을 문서화된 순서로 읽습니다.
- Env override는 명시적이고 좁게 유지합니다.
- Preview command는 resolved value와 source file을 파일 쓰기 없이 보고합니다.
- Unsafe path, traversal, malformed JSON, symlinked trusted config는 warning 또는 conflict를 냅니다.

**Acceptance:**

- Target-local config가 user default보다 우선합니다.
- Config가 없거나 malformed여도 안전하게 fallback합니다.
- Test 중에는 개인 home config를 읽지 않습니다.

### Task C2: Public Doc Leak And Notice Check

**Purpose:** 현재 수동 hygiene를 반복 가능한 validation gate로 바꿉니다.

**Planned files:**

- Create: `scripts/validate-public-docs.ps1`
- Modify: `package.json`
- Modify: `docs/maintenance.md`
- Modify matching Korean translations
- Test: script smoke in `test/packaging.test.mjs` or a dedicated test.

**Behavior:**

- Personal absolute path, internal URL, obvious secret assignment, oversized raw excerpt, public docs 안의 local reference directory mention에서 실패합니다.
- Safe test fixture, documented placeholder, scrubbed example은 허용합니다.
- 선택적으로 `package.json`에 포함된 notice/license file이 `npm pack --dry-run`에도 남아 있는지 확인합니다.

**Acceptance:**

- Validation은 test fixture file allowlist를 가집니다.
- Script는 standard verification checklist에 포함됩니다.
- False positive는 설명 가능하고 국소적이어야 합니다.

## Workstream D: Capability History And Artifact Schemas

### Task D1: Runtime Artifact Schema Checks

**Purpose:** MCP 노출 또는 memory promotion 전에 runtime evidence의 일관성을 보장합니다.

**Planned files:**

- Create: `src/runtime/schemas.mjs`
- Modify: runtime index modules
- Modify: `src/memory/canon.mjs`
- Test: runtime and canon fixtures

**Acceptance:**

- Runtime artifact에는 `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, `conflicts`가 필요합니다.
- Invalid artifact는 actionable error로 실패합니다.
- Canon promotion은 malformed runtime artifact를 거부합니다.

### Task D2: Capability History Preview

**Purpose:** telemetry나 network call을 default로 만들지 않으면서 반복 verification/performance evidence를 추적합니다.

**Planned files:**

- Create: `src/runtime/capability-history.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/harness-runtime.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Behavior:**

- Command: `runtime capability-history <target> [--json]`
- Local append-only JSONL history가 있으면 읽습니다.
- capability, latest status, duration, baseline, drift를 요약합니다.
- 이 slice에서는 benchmark를 실행하지 않습니다.

**Acceptance:**

- History가 없으면 read-only empty state를 반환합니다.
- History entry는 portable해야 하며 machine-local path를 노출하지 않습니다.

## Workstream E: Capability Pack Follow-Through

### Task E1: Devops And Release Pack

**Primary skills:**

- `container-change-safety`
- `deployment-release-check`
- `observability-incident-triage`

**References:**

- Container image change, Compose/Kubernetes deployment risk, CI release gate, rollback, logs/metrics/traces, SBOM/SCA handoff.

### Task E2: Frontend Quality Pack

**Primary skills:**

- `frontend-state-data-flow`
- `frontend-accessibility-review`
- `visual-regression-qa`

**References:**

- State ownership, server/client cache boundary, keyboard/focus flow, responsive overflow, browser verification, visual snapshot.

### Task E3: Data And Documentation Pack

**Primary skills:**

- `analytics-reporting-review`
- `data-migration-integrity`
- `adr-spec-handoff`

**References:**

- Metric definition, ETL contract, migration rollback, report validation, ADR/spec/worklog promotion.

**Acceptance for all packs:**

- Skill은 trigger-focused로 유지합니다.
- 긴 절차는 one-level reference에 둡니다.
- Korean translation은 같은 change에 포함합니다.
- 기존 skill은 중복하지 않고 wrapper 또는 reference로 연결합니다.

## Implementation Order

1. 이 계획을 추가하고 커밋합니다.
2. 기존 recipe Markdown 위에 workflow run-preview를 구현합니다.
3. MCP prompt pack과 prompt drift test를 추가합니다.
4. Repo-local config preview를 추가합니다.
5. Public doc leak validation을 추가합니다.
6. Runtime artifact schema check를 추가합니다.
7. Capability history preview를 추가합니다.
8. Devops/release capability pack을 추가합니다.
9. Frontend quality capability pack을 추가합니다.
10. Data/documentation capability pack을 추가합니다.
11. 전체 검증을 실행하고 남은 gap을 갱신합니다.

## Verification Per Batch

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- changed behavior에 대한 targeted CLI/MCP/script test
- `git diff --check`

## Non-Goals

- 기본 embedding 없음.
- Default network SCA 또는 CVE lookup 없음.
- MCP project-write tool 없음.
- Automatic memory promotion 없음.
- Public docs에 raw reference dump 없음.
- Hidden telemetry 또는 long-running background loop 없음.
