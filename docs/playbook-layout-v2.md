# Playbook Layout v2

`.ai-playbook` v2 separates durable project memory from generated runtime output and integration configuration.

```text
.ai-playbook/
  README.md
  START_HERE.md
  CURRENT.md
  questions.md
  manifest.json
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

## Migration

Use layout migration in preview mode first:

```bash
ai-playbook migrate layout <target> --to v2 --json
```

Apply only after reviewing the operations:

```bash
ai-playbook migrate layout <target> --to v2 --apply
```

The migration creates v2 directories and copies known v1 files into their v2 locations. It does not delete or move v1 files.

