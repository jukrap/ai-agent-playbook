# AI Agent Playbook v2 Agent Orchestration Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable AI Agent Playbook capability for splitting multi-agent work, preserving bounded evidence, and reconciling handoffs without increasing default write access.

**Architecture:** This pack stays capability-first. It adds one installable `ai-harness` skill, one workflow recipe, one read-only MCP prompt, and public docs/tests so orchestration remains an explicit selected surface rather than always-on prompt bulk.

**Tech Stack:** Markdown skills/templates/docs, dependency-free Node MCP server, Node test runner, PowerShell validation scripts.

---

## Reference Adoption Notes

The local `_reference` inventory shows repeated signals around skills, agents, MCP, hooks, workflows, memory, indexes, tests, security, and compliance. The useful pattern to adopt here is not a specific vendor command or raw reference name. It is the operating model: small worker contracts, explicit allowed context, append-only evidence, review before merge, and clear handoff artifacts.

This pack deliberately avoids:

- copying reference text or command names into public docs,
- adding auto-running agents,
- expanding project-write MCP tools, and
- promoting generated summaries into durable memory without review.

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

### Task 1: Add The Orchestration Skill

- [ ] Create `agent-orchestration-handoff` with a narrow trigger for multi-agent, subagent, worker, handoff, review reconciliation, and long-running resume work.
- [ ] Keep `SKILL.md` focused on trigger, workflow, and reference routing.
- [ ] Put reusable worker contract details in `references/worker-contract.md`.
- [ ] Put evidence ledger and reconciliation rules in `references/evidence-ledger-and-reconciliation.md`.
- [ ] Add Korean translations for the skill and both references.
- [ ] Run `.\scripts\validate-skills.ps1` and fix frontmatter or reference issues.

### Task 2: Add The Workflow Recipe

- [ ] Create `templates/project-playbook/workflows/recipes/agent-orchestration-handoff.md`.
- [ ] Include inputs, outputs, skills, tools, stop conditions, and verification criteria.
- [ ] Add `agent orchestration handoff` to the recipe README.
- [ ] Add matching Korean recipe and README updates.
- [ ] Run `node bin\ai-playbook.mjs workflow list --json` and confirm the workflow count increases by one.

### Task 3: Add The Read-Only MCP Prompt

- [ ] Add `agent_orchestration_review` to `src/mcp-tools.mjs`.
- [ ] Require evidence from `workflow_run_preview`, `skill_catalog`, `operator_preflight`, `index_status`, `evidence_locator_check`, and `write_gate_preview`.
- [ ] Keep the prompt read-only and ensure the prompt text does not include `apply: true`.
- [ ] Update `test/mcp.test.mjs` prompt list and prompt contract assertions.
- [ ] Run `node --test --test-reporter=dot test\mcp.test.mjs`.

### Task 4: Update Catalog Docs And Tests

- [ ] Update README, classification, taxonomy, command guide, MCP permission docs, and Korean translations.
- [ ] Update skill and workflow expected counts in CLI/lifecycle tests.
- [ ] Add assertions for `agent-orchestration-handoff` and the new recipe.
- [ ] Run `node --test --test-reporter=dot test\cli.test.mjs test\skills-lifecycle.test.mjs`.

### Task 5: Validate And Commit

- [ ] Run `npm run check`.
- [ ] Run `.\scripts\validate-skills.ps1`.
- [ ] Run `.\scripts\validate-translations.ps1`.
- [ ] Run `.\scripts\validate-public-docs.ps1`.
- [ ] Run `.\scripts\sync-skills.ps1 -WhatIf`.
- [ ] Run `.\install.ps1 -SkipValidation -WhatIf`.
- [ ] Run `.\update.ps1 -SkipValidation -WhatIf`.
- [ ] Run `git diff --check`.
- [ ] Run `npm test`.
- [ ] Stage explicit files, inspect staged diff, and commit.
