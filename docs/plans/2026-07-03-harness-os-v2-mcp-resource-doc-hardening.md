# AI Agent Playbook v2 MCP Resource And Docs Hardening Plan

**Goal:** Make the expanded harness easier for AI apps to discover and use by exposing structured MCP resources, tightening `.ai-playbook` entry guidance, and aligning README/MCP docs with the current implementation.

**Why now:** Reference adoption work has already expanded design, security, backend, architecture, 3D, data, and agent-harness capability packs. The next weak point is not raw capability count; it is whether Codex App, Codex CLI, Claude Code, and other MCP-capable agents can reliably discover the right resource, skill, workflow, permission tier, and project-memory read order before editing.

**Architecture:** Keep MCP read-only by default. Use resources for stable discovery packets, prompts for reusable review briefs, read-only tools for evidence gathering, and opt-in write tools only for bounded `.ai-playbook` or runtime artifacts. Keep project source writes outside MCP.

## Scope

- Add read-only MCP resources for adapter support, playbook layout v2, and the MCP permission model.
- Update MCP tests so resources are listed and readable as structured JSON.
- Update `.ai-playbook` template entry files so agents start from `START_HERE.md`, `CURRENT.md`, questions, relevant memory, contracts, maps, and workflow recipes.
- Update README and command/permission docs, including Korean translations.
- Record remaining follow-up work for deeper reference adoption without copying noisy upstream source material.

## Reference Signals Used

- Design references suggested stronger design direction, brand, reference-analysis, Figma/image handoff, and visual evidence boundaries.
- Security and compliance references suggested stronger opt-in write boundaries, source registry hygiene, credential handling, and release gates.
- AI harness references suggested resource/prompt/tool separation, worker contracts, memory boundaries, cache/index surfaces, and evidence ledgers.
- Backend and architecture references suggested capability-first routing over stack-name-first skills.

## Tasks

- [x] Add `ai-playbook://adapters` for Codex, Codex App, Claude Code, and MCP setup discovery.
- [x] Add `ai-playbook://playbook-layout-v2` for `.ai-playbook` read order and runtime-vs-memory rules.
- [x] Add `ai-playbook://mcp-permission-model` for default resources, permission tiers, and opt-in write tools.
- [x] Update MCP tests for the new resources.
- [x] Update `.ai-playbook` `START_HERE.md` and `SKILLS.md` templates.
- [x] Update Korean template translations.
- [x] Update README, MCP command docs, and permission model docs.

## Follow-Up Candidates

- Add a read-only MCP resource for reference adoption status once the source registry and ledger are present in a target project.
- Add an adapter readiness resource that mirrors `adapter check` output without requiring users to remember the CLI command.
- Split oversized Korean README skill catalog details into a dedicated Korean skill catalog page if the README becomes too long.
- Add documentation lint for outdated MCP tool lists so permission docs cannot drift from `src/mcp-tools.mjs`.
- Add a `.ai-playbook` usage smoke test that bootstraps a fixture and checks that `START_HERE.md`, `SKILLS.md`, workflow recipes, runtime, and knowledge files remain coherent.

## Verification

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
