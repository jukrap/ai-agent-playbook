# AI Agent Playbook v2 AI Harness Governance Pack 계획

> **구현자용:** Database depth pack 이후 이어서 진행합니다. 이 계획은 현재 카탈로그에서 약한 축인 `ai-harness`를 다룹니다. 현재 ai-harness에는 MCP design 지침과 meta skill authoring 지침이 있지만 context engineering, skill-pack governance, runtime index/cache design 전용 first-class skill은 없습니다.

**목표:** 항상 켜지는 core MCP tool이나 permanent prompt burden으로 모든 아이디어를 올리지 않으면서 context surface, durable memory promotion, skill-pack growth, reference adoption, runtime artifact, cache/index invalidation을 위한 capability-first AI harness 지침을 추가합니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 core tool surface를 좁게 유지하기, prompt/skill을 paginated snippet이 아니라 full-read instruction으로 다루기, generated evidence와 trusted memory 분리, managed change 전 write gate 사용, plugin/skill 성장을 manifest와 test로 관리하는 패턴이 반복됩니다. 이 패턴을 로컬 스킬과 reference로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## 기준 상태

- Database depth pack 이후 스킬 카탈로그는 63개 스킬을 포함합니다.
- `ai-harness` canonical category에는 현재 `mcp-server-design`과 `agent-skill-authoring`이 있습니다.
- Runtime에는 이미 catalog, layout v2, MCP prompt/tool, reference inventory, canon promotion, runtime index가 있습니다.
- 기존 스킬은 skill 또는 MCP tool 추가 방법을 설명하지만 context budget, memory promotion, skill-pack governance, cache invalidation, runtime artifact contract를 별도로 안내하지는 않습니다.

## 레퍼런스에서 채택할 규칙

- **Core surface를 좁게 유지합니다:** 항상 켜지는 core prompt/tool surface를 늘리기 전에 docs, recipe, CLI command, opt-in MCP tool, plugin surface를 우선합니다.
- **Prompt/cache budget을 보호합니다:** Default instruction에 noisy source list, 큰 reference excerpt, mutable past context를 추가하지 않습니다.
- **선택한 instruction은 끝까지 읽습니다:** Skill, prompt, playbook은 partial reading을 유도하는 lazy pagination에 의존하지 않아야 합니다.
- **Evidence와 memory를 분리합니다:** Runtime report, index, dry-run output, generated graph는 검토와 승격 전까지 generated evidence입니다.
- **성장을 testable하게 만듭니다:** 새 skill, prompt, workflow, resource에는 catalog check, docs, translations, no-write 또는 dry-run validation이 필요합니다.
- **Write를 gate합니다:** Managed write, scaffold write, project write에는 target validation, dry-run, audit trail, explicit apply semantic이 필요합니다.

## Workstream A: Context Engineering And Memory Design

### Task A1: Context Engineering Memory Design Skill

**Skill:** `ai-harness/context-engineering-memory-design`

**References:**

- `context-surface-and-cache-budget.md`
- `memory-promotion-and-staleness.md`

**Coverage:**

- Agent instruction, root policy, `.ai-playbook`, prompt/context surface, context compaction, durable memory, worklog, map, contract, handoff.
- Always-on rule, project-local context, selected skill reference, generated runtime report, archive에 무엇을 둘지.
- Review-before-promotion과 stale-memory 처리.

## Workstream B: Skill Pack Governance

### Task B1: Skill Pack Governance Skill

**Skill:** `ai-harness/skill-pack-governance`

**References:**

- `skill-taxonomy-and-wrapper-checks.md`
- `reference-adoption-noise-control.md`

**Coverage:**

- Skill taxonomy growth, wrapper compatibility, naming, trigger description, reference routing, translation, install/sync behavior, reference adoption.
- 유용한 stack profile을 보존하면서 capability-first structure 유지.
- Reusable public docs에서 raw reference noise와 personal/private value 방지.

## Workstream C: Runtime Index And Cache Design

### Task C1: Runtime Index Cache Design Skill

**Skill:** `ai-harness/runtime-index-cache-design`

**References:**

- `runtime-artifact-contracts.md`
- `index-cache-invalidation.md`

**Coverage:**

- Runtime report, index, graph, cache status, invalidation, artifact schema, generated evidence, canon promotion, stale evidence check.
- File inventory, symbol outline, dependency inventory, route/API hint, clone cue, 향후 optional embedding provider.
- 검토 전까지 generated artifact를 local-only로 유지하고 runtime output이 실수로 trusted memory가 되지 않게 하는 원칙.

## Workstream D: Workflow And MCP Follow-Up

### Task D1: Harness Extension Recipe Expansion

**Candidate recipe update:** `harness-extension`

**Acceptance:**

- Inputs에 capability intent, context budget, target surface, permission tier, docs/translations, tests, rollback path를 포함합니다.
- Stop conditions는 core tool bloat, always-on prompt noise, gate 없는 write path, missing schema, unreviewed memory promotion을 다룹니다.
- Verification은 catalog check, prompt/resource/tool listing, no-write MCP behavior, translation/public-doc hygiene, write가 있을 때 dry-run/apply behavior를 포함합니다.

### Task D2: Harness Governance Prompt

**Candidate prompt:** `harness_governance_review`

**Acceptance for a later slice:**

- Prompt는 read-only로 유지하고 `capability_catalog`, `skill_catalog`, `workflow_list`, `reference_inventory`, `reference_ledger_check`, `index_status`, `write_gate_preview`로 라우팅합니다.
- Prompt는 제안 변경이 skill, reference, recipe, runtime CLI, MCP resource, MCP prompt, MCP tool, adapter, plugin, docs 중 어디에 속하는지 묻습니다.

## Workstream E: Docs, Tests, And Catalog

**Acceptance:**

- README skill list와 category summary에 새 AI harness skill을 반영합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`에 AI harness governance map을 문서화합니다.
- 한국어 번역을 같은 변경에서 갱신합니다.
- Skill count 기대값을 63에서 66으로 갱신합니다.
- Catalog는 warning-free 상태를 유지하고 wrapper check는 계속 통과합니다.

## Workstream F: 검증

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
2. `context-engineering-memory-design`, `skill-pack-governance`, `runtime-index-cache-design` 스킬과 reference, 번역을 추가합니다.
3. Catalog docs와 skill-count test를 갱신한 뒤 AI harness governance skill pack을 커밋합니다.
4. `harness-extension` workflow recipe와 smoke coverage를 확장합니다.
5. `harness_governance_review` MCP prompt와 prompt contract test를 추가합니다.
6. 전체 검증을 다시 실행하고 다음 표면이 data analytics depth, documentation artifacts, runtime write-tier implementation 중 무엇인지 결정합니다.

## 비목표

- 모든 reference source를 always-on prompt로 확장하지 않습니다.
- 기본값에 automatic network indexing이나 embedding provider를 넣지 않습니다.
- MCP를 통한 project source write는 추가하지 않습니다.
- Public docs에 raw upstream source dump를 넣지 않습니다.
