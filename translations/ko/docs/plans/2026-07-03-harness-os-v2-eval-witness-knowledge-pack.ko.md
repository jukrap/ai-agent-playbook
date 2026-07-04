# AI Agent Playbook v2 Eval Witness Knowledge Pack 계획

> **구현자용:** Documentation/project-management pack 이후 이어서 진행합니다. 이 계획은 harness reliability layer, 즉 eval, capability witness, fact gate, source-aware knowledge retrieval에 집중합니다.

**목표:** Agent 작업을 위한 실용적인 evidence layer를 추가합니다. 위험한 자동화 전에 task eval을 정의하고, capability/performance witness를 시간 축으로 남기며, 넓은 편집 전에 concrete fact를 강제하고, 외부/project knowledge source를 registry와 locator contract로 모델링합니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 eval-driven agent workflow, append-only capability witness history, pre-action fact forcing, 여러 source type 위의 unified search/read surface 패턴이 반복됩니다. 이를 local skill, reference, workflow recipe, CLI/MCP read surface, validation rule로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## 기준 상태

- AI Agent Playbook에는 이미 runtime index, `write-gate preview`, `canon check`, workflow preview, project documentation packaging, read-only MCP prompt가 있습니다.
- 기존 skill은 test verification과 knowledge retrieval review를 다루지만, agent/harness 변경을 위한 first-class eval artifact model은 아직 없습니다.
- Runtime report는 생성할 수 있지만 capability history는 아직 append-only 또는 baseline-aware하지 않습니다.
- Write-gate preview는 planned write를 확인하지만, 위험한 편집 전에 importer, public API, schema, user intent를 요구하는 명시적 pre-action fact gate는 없습니다.
- Knowledge reference는 있지만 project-local source registry가 connector status, locator shape, search range, generated-versus-promoted evidence를 일관되게 모델링하지 않습니다.

## 레퍼런스에서 채택할 규칙

- **Evidence 없는 claim을 금지합니다:** Structural count, absence claim, source coverage, capability status는 scan range 또는 source range를 밝혀야 합니다.
- **Harness 변경 전 eval을 정의합니다:** Agent-facing workflow, prompt, MCP tool, write tier, skill behavior를 추가/수정하기 전에 capability/regression eval이 있어야 합니다.
- **Deterministic grader를 우선합니다:** Model/human grader보다 code/schema/rule grader를 우선하고, ambiguous output, security-sensitive output, product judgment에는 human review를 남깁니다.
- **Reliability를 시간 축으로 추적합니다:** Capability witness는 commit, timestamp, OS/runtime, duration, status, baseline, delta를 append-only history로 기록해야 합니다.
- **위험한 action 전에 fact를 강제합니다:** Broad edit, new owner file, destructive command, migration, permission, source rewrite는 실행 전에 concrete context가 필요합니다.
- **Search, locate, browse 흐름을 지킵니다:** Retrieval은 후보를 찾고, 정확한 locator/range를 다시 열고, 검토된 fact만 승격합니다.
- **Provisional evidence를 분리합니다:** Runtime report, generated summary, raw transcript, index hit는 검토와 승격 전까지 provisional입니다.
- **Stable tool envelope를 씁니다:** Agent-facing tool은 status, summary, next actions, artifacts, warnings, conflicts, recovery hints를 반환해야 합니다.

## Workstream A: Eval Harness Artifacts

### Task A1: Eval Harness Design Skill

**Candidate skill:** `delivery/eval-harness-design`

**References:**

- `eval-artifact-contract.md`
- `grader-and-metric-rubric.md`

**Coverage:**

- Capability eval, regression eval, code/rule/model/human grader, pass@k/pass^k, cost/latency caveat, release-critical threshold.
- Prompt change, workflow recipe, MCP prompt, write tier, skill behavior에 대한 eval definition.
- Eval definition, run history, release summary를 promotion 전까지 `.ai-agent-playbook/runtime/` 또는 workflow run record 아래에 분리합니다.

**Acceptance:**

- Skill은 구현 전 eval이 필요한 시점을 설명합니다.
- Reference는 artifact schema, grader choice, metric threshold, anti-overfitting check를 정의합니다.
- Ordinary unit-test guidance를 중복하지 않고 `test-verification-strategy`를 보완합니다.

### Task A2: Eval Workflow Recipe

**Candidate recipe:** `eval-driven-change`

**Acceptance:**

- Inputs는 target behavior, risk class, baseline, grader type, success criteria, retry budget, cost/latency budget, promotion path를 포함합니다.
- Outputs는 eval definition, run report, pass/fail summary, residual risk, follow-up issue를 포함합니다.
- Verification은 가능한 경우 최소 하나의 deterministic grader를 요구합니다.

## Workstream B: Capability Witness History

### Task B1: Capability Witness Skill

**Candidate skill:** `ai-harness/capability-witness-history`

**References:**

- `capability-ledger-schema.md`
- `regression-baseline-policy.md`

**Coverage:**

- Install, update, MCP startup, catalog check, index build, workflow preview, 주요 runtime operation을 위한 append-only capability history.
- 안정적 measurement가 있는 경우 OS/runtime별 baseline comparison.
- Pass, fail, skipped, degraded, unknown, not-applicable을 구분하는 witness entry.

**Acceptance:**

- Skill은 timestamp, version/commit, environment, capability id, command, status, duration, artifacts, caveats를 요구합니다.
- Reference는 느린 결과나 skipped result가 신호인지 노이즈인지 판단하는 기준을 정의합니다.
- Runtime witness report는 canon promotion 없이 durable memory가 되지 않습니다.

### Task B2: Witness CLI Read Surface

**Candidate CLI surface:** `witness status`, `witness check`, `witness history`

**Acceptance:**

- 기본 command는 read-only입니다.
- History는 `.ai-agent-playbook/runtime/reports/witness/` 또는 `.ai-agent-playbook/runtime/indexes/` 아래에 둡니다.
- 명시적 managed-write tier가 생기기 전까지 MCP는 read tool만 노출합니다.

## Workstream C: Pre-Action Fact Gate

### Task C1: Pre-Action Fact Gate Skill

**Candidate skill:** `ai-harness/pre-action-fact-gate`

**References:**

- `fact-gate-checks.md`
- `destructive-action-review.md`

**Coverage:**

- 기존 파일 편집 전: importer/caller, public function/class, data schema, user instruction, nearby pattern, blast radius.
- 새 파일 생성 전: intended caller, existing owner search, naming/domain cluster, lifecycle owner, deletion/rollback path.
- 파괴적 command 전: target list, rollback plan, explicit user instruction, dry-run evidence.

**Acceptance:**

- Skill은 default blocker가 아니라 decision aid로 유지합니다.
- Reference는 agent가 self-evaluation 대신 fact를 수집하도록 구체적이고 bounded한 질문을 유지합니다.
- 기존 `write-gate preview`와 future advisory/post-check command와 함께 작동합니다.

### Task C2: Fact Gate Prompt

**Candidate MCP prompt:** `pre_action_fact_gate_review`

**Acceptance:**

- Prompt는 read-only입니다.
- 사용 가능한 경우 `write_gate_preview`, `operator_search`, `operator_map`, `canon_check`, `diagnostics_check`로 라우팅합니다.
- 변경을 적용하지 않고 required facts, missing facts, stop conditions를 반환합니다.

## Workstream D: Source-Aware Knowledge Registry

### Task D1: Knowledge Source Registry Skill

**Candidate skill:** `data/knowledge-source-registry`

**References:**

- `source-registry-contract.md`
- `locator-and-evidence-envelope.md`

**Coverage:**

- File, docs, issue tracker, chat, database, object store, web crawl, generated runtime index를 위한 project-local source registry.
- Connector/source status: available, building, partial, unavailable, failed, stale, unknown.
- Locator contract: path/range, structured primary key, row id, thread id, object id, report artifact path.

**Acceptance:**

- Skill은 외부 connector setup을 default install에 넣지 않습니다.
- Reference는 search range, freshness, locator, evidence type, privacy boundary를 정의합니다.
- Generated search hit는 검토와 promotion 전까지 provisional로 유지합니다.

### Task D2: Knowledge Source Recipe

**Candidate recipe:** `knowledge-source-onboarding`

**Acceptance:**

- Inputs는 source type, owner, credentials boundary, update cadence, expected locator shape, search mode, privacy tier, promotion policy를 포함합니다.
- Outputs는 registry entry, browse/search instructions, caveats, verification command를 포함합니다.
- Stop conditions는 missing owner, unclear credentials boundary, unbounded source, private data risk를 포함합니다.

## Workstream E: MCP And Runtime Integration

### Task E1: Read-Only Prompts

**Candidate prompts:**

- `eval_harness_review`
- `capability_witness_review`
- `pre_action_fact_gate_review`
- `knowledge_source_review`

**Acceptance:**

- Prompt는 write access를 열지 않습니다.
- Prompt test는 각 prompt가 의도한 read tool과 stop condition을 참조하는지 증명합니다.
- Docs는 English/Korean command reference에 prompt 목록을 반영합니다.

### Task E2: Runtime Schemas

**Candidate schemas:**

- `runtime.eval-definition`
- `runtime.eval-run-report`
- `runtime.capability-witness`
- `runtime.source-registry`
- `runtime.evidence-envelope`

**Acceptance:**

- Schema는 compact, versioned, local-first입니다.
- Snapshot/runtime output은 자동으로 `memory/`에 promotion되지 않습니다.
- Validator는 public docs 안의 personal path, credential, raw transcript, oversized source excerpt를 거부합니다.

## Workstream F: Docs, Tests, And Catalog

**Acceptance:**

- README와 taxonomy docs는 구현 후에만 새 skill을 나열합니다.
- Runtime surface 구현 시 `docs/harness-os.md`, `docs/playbook-layout-v2.md`, `docs/mcp-permission-model.md`에 eval/witness/source registry boundary를 설명합니다.
- 한국어 번역은 같은 변경에서 갱신합니다.
- 새 artifact가 들어오면 skill count와 MCP prompt test를 갱신합니다.

## Workstream G: 검증

각 구현 slice 뒤에 실행합니다.

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

1. 이 계획을 추가하고 commit합니다.
2. `eval-harness-design`을 reference와 translation과 함께 구현합니다.
3. `capability-witness-history`를 reference와 translation과 함께 구현합니다.
4. `pre-action-fact-gate`를 reference와 translation과 함께 구현합니다.
5. `knowledge-source-registry`를 reference와 translation과 함께 구현합니다.
6. Taxonomy, README, catalog test, skill count expectation을 갱신합니다.
7. `eval-driven-change`와 `knowledge-source-onboarding` recipe를 추가합니다.
8. Read-only MCP prompt와 prompt contract test를 추가합니다.
9. Runtime schema와 read-only CLI preview를 추가합니다.
10. Full verification을 실행하고 논리 slice마다 commit합니다.

## 비목표

- Always-on external connector ingestion은 넣지 않습니다.
- 기본 embedding 또는 network index provider는 넣지 않습니다.
- Raw transcript를 trusted memory로 promotion하지 않습니다.
- 이 pack에서는 MCP를 통한 project source rewrite를 넣지 않습니다.
- Default blocking hook은 설치하지 않습니다.
- Reference source에서 public documentation으로 원문을 복사하지 않습니다.
