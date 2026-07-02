# MCP Permission Model

Harness OS MCP defaults to read-only analysis and catalog access.

## Tiers

- `read`: search, state, catalogs, layout status, and analysis.
- `scaffold`: create plans, worklogs, runs, or other bounded playbook records.
- `managed-write`: update managed files inside `.ai-playbook`.
- `project-write`: modify project source files. This tier is disabled by default.

## Current Default

The default MCP server exposes read-only tools, resources, and prompts. Tools are annotated as read-only and should not write project files.

Default read-only additions:

- `capability_catalog`
- `skill_catalog`
- `workflow_list`
- `playbook_layout`
- `index_status`
- `index_search`
- `symbol_outline`
- `write_gate_preview`

## Write Gate

Write-capable tools should require both a server opt-in and an explicit call argument such as `apply: true`. They should also produce a dry-run plan, validate target paths, and write an audit trail before applying changes.
