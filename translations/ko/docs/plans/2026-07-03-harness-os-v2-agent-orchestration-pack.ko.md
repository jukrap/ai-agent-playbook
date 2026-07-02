# Harness OS v2 Agent Orchestration Pack 구현 계획

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때는 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**Goal:** 여러 agent 작업을 나누고, 제한된 evidence를 보존하며, 기본 쓰기 권한을 늘리지 않고 handoff를 reconcile하는 Harness OS capability를 추가합니다.

**Architecture:** 이 pack은 capability-first 구조를 유지합니다. Installable `ai-harness` skill 1개, workflow recipe 1개, read-only MCP prompt 1개, public docs/tests를 추가해 orchestration이 always-on prompt bulk가 아니라 명시적으로 선택하는 surface로 남게 합니다.

**Tech Stack:** Markdown skills/templates/docs, dependency-free Node MCP server, Node test runner, PowerShell validation scripts.

---

## Reference Adoption Notes

로컬 `_reference` inventory에는 skills, agents, MCP, hooks, workflows, memory, indexes, tests, security, compliance 신호가 반복해서 나타납니다. 여기서 채택할 유용한 패턴은 특정 vendor command나 raw reference name이 아닙니다. 작은 worker contract, 명시적 allowed context, append-only evidence, merge 전 review, 명확한 handoff artifact라는 운영 모델입니다.

이 pack은 의도적으로 다음을 피합니다.

- reference text나 command name을 public docs에 그대로 복사,
- auto-running agent 추가,
- project-write MCP tool 확장,
- generated summary를 review 없이 durable memory로 승격.

## Files

- Create: `skills/ai-harness/agent-orchestration-handoff/SKILL.md`
- Create: `skills/ai-harness/agent-orchestration-handoff/references/worker-contract.md`
- Create: `skills/ai-harness/agent-orchestration-handoff/references/evidence-ledger-and-reconciliation.md`
- Create: `templates/project-playbook/workflows/recipes/agent-orchestration-handoff.md`
- Create: matching Korean translations under `translations/ko/**`
- Modify: `README.md`
- Modify: `docs/classification.md`
- Modify: `docs/skill-taxonomy-v2.md`
- Modify: `docs/mcp-permission-model.md`
- Modify: `docs/commands.md`
- Modify: `src/mcp-tools.mjs`
- Modify: `test/cli.test.mjs`
- Modify: `test/mcp.test.mjs`
- Modify: `test/skills-lifecycle.test.mjs`

## Tasks

### Task 1: Orchestration Skill 추가

- [ ] multi-agent, subagent, worker, handoff, review reconciliation, long-running resume 작업을 위한 좁은 trigger로 `agent-orchestration-handoff`를 만듭니다.
- [ ] `SKILL.md`는 trigger, workflow, reference routing에 집중시킵니다.
- [ ] 재사용 가능한 worker contract detail은 `references/worker-contract.md`에 둡니다.
- [ ] Evidence ledger와 reconciliation rule은 `references/evidence-ledger-and-reconciliation.md`에 둡니다.
- [ ] Skill과 두 reference의 한국어 번역을 추가합니다.
- [ ] `.\scripts\validate-skills.ps1`를 실행하고 frontmatter나 reference 문제를 고칩니다.

### Task 2: Workflow Recipe 추가

- [ ] `templates/project-playbook/workflows/recipes/agent-orchestration-handoff.md`를 만듭니다.
- [ ] inputs, outputs, skills, tools, stop conditions, verification criteria를 포함합니다.
- [ ] Recipe README에 `agent orchestration handoff`를 추가합니다.
- [ ] 한국어 recipe와 README 업데이트를 추가합니다.
- [ ] `node bin\ai-playbook.mjs workflow list --json`을 실행해 workflow count가 1 증가했는지 확인합니다.

### Task 3: Read-Only MCP Prompt 추가

- [ ] `src/mcp-tools.mjs`에 `agent_orchestration_review`를 추가합니다.
- [ ] `workflow_run_preview`, `skill_catalog`, `operator_preflight`, `index_status`, `evidence_locator_check`, `write_gate_preview` evidence를 요구합니다.
- [ ] Prompt를 read-only로 유지하고 prompt text에 `apply: true`가 들어가지 않게 합니다.
- [ ] `test/mcp.test.mjs` prompt list와 prompt contract assertion을 업데이트합니다.
- [ ] `node --test --test-reporter=dot test\mcp.test.mjs`를 실행합니다.

### Task 4: Catalog Docs And Tests 갱신

- [ ] README, classification, taxonomy, command guide, MCP permission docs와 한국어 번역을 업데이트합니다.
- [ ] CLI/lifecycle test의 skill/workflow expected count를 갱신합니다.
- [ ] `agent-orchestration-handoff`와 새 recipe assertion을 추가합니다.
- [ ] `node --test --test-reporter=dot test\cli.test.mjs test\skills-lifecycle.test.mjs`를 실행합니다.

### Task 5: Validate And Commit

- [ ] `npm run check`를 실행합니다.
- [ ] `.\scripts\validate-skills.ps1`를 실행합니다.
- [ ] `.\scripts\validate-translations.ps1`를 실행합니다.
- [ ] `.\scripts\validate-public-docs.ps1`를 실행합니다.
- [ ] `.\scripts\sync-skills.ps1 -WhatIf`를 실행합니다.
- [ ] `.\install.ps1 -SkipValidation -WhatIf`를 실행합니다.
- [ ] `.\update.ps1 -SkipValidation -WhatIf`를 실행합니다.
- [ ] `git diff --check`를 실행합니다.
- [ ] `npm test`를 실행합니다.
- [ ] 명시 파일만 stage하고 staged diff를 확인한 뒤 commit합니다.
