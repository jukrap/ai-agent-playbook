# Structured Playbook Layout

The structured `.ai-playbook` layout separates durable project memory from generated runtime output and integration configuration.

```text
.ai-playbook/
  README.md
  START_HERE.md
  CURRENT.md
  questions.md
  manifest.json
  config.json
  config.local.json
  policy/
  memory/
  workflows/
  knowledge/
  runtime/
  integrations/
  archive/
```

## Directory Roles

- `policy/`: agent rules, git policy, safety notes, and scoped rules.
- `memory/`: stable context, maps, decisions, contracts, and glossary terms.
- `workflows/`: recipes, runbooks, plans, runs, worklogs, and handoffs.
- `knowledge/`: source registry, adopted references, and research notes.
- `runtime/`: generated cache, indexes, graphs, reports, snapshots, and temporary files.
- `integrations/`: MCP, adapters, hooks, and command configuration.
- `archive/`: superseded local notes.

`config.json` and `config.local.json` are optional. `config preview` reads them when present; `config.local.json` is for machine-local overrides and should stay local-only unless the project deliberately chooses otherwise.

## Context Selection

Agents should not read every file in `.ai-playbook/` by default. Start with `START_HERE.md`, `CURRENT.md`, and `questions.md`, then use `operator context --path <file> --json` to choose relevant `memory/context/`, maps, contracts, runbooks, decisions, guides, and plans. If the right file is still unclear, use `operator search` or `index search` before loading larger notes.

Keep generated evidence in `runtime/`, active work evidence in `workflows/runs/`, and durable history in `workflows/worklogs/`. Promote only reviewed facts into `memory/` or `knowledge/`.

## Canon Facts

Runtime evidence can draft canon fact candidates, but it does not become trusted memory by itself. Store reviewed fact JSON under `memory/` only after a deliberate promotion step, then use `canon check` to compare those facts with their source report and current files. Checks report `verified`, `missing`, `stale`, `changed`, and `unverified` states without writing files.

## Workflow Runs

Recipes under `workflows/recipes/` describe repeatable procedures. `workflow run-preview` reads a target-local recipe first and falls back to the bundled template, then returns a read-only run manifest with inputs, outputs, skills, tools, stop conditions, and verification. It does not create files under `workflows/runs/`.

Future run creation belongs to the scaffold tier. A run-start implementation may write only under `workflows/runs/`, should create new bounded run artifacts rather than editing source or memory, and must keep generated evidence separate from durable facts until explicit promotion.

## Migration

Use layout migration in preview mode first:

```bash
ai-playbook migrate layout <target> --to structured --json
```

Apply only after reviewing the operations:

```bash
ai-playbook migrate layout <target> --to structured --apply
```

The migration creates structured directories, moves known legacy layout files into their active locations without overwriting conflicts, and archives old locations under `archive/legacy-layout/`.
