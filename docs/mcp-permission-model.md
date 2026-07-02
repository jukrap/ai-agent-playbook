# MCP Permission Model

Harness OS MCP defaults to read-only analysis and catalog access.

## Tiers

- `read`: search, state, catalogs, layout status, and analysis.
- `scaffold`: create plans, worklogs, runs, or other bounded playbook records.
- `managed-write`: update managed files inside `.ai-playbook`.
- `project-write`: modify project source files. This tier is disabled by default.

## Current Default

The default MCP server exposes read-only tools, resources, and prompts. Tools are annotated as read-only and should not write project files.

Default prompts route review work through required evidence, optional evidence, stop conditions, and verification expectations. They do not grant write access or promote generated runtime hints into memory.

Gate and graph review prompts include:

- `agent_orchestration_review`
- `repo_graph_review`
- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`

Scaffold-tier run record creation is not exposed by default. A future MCP run-start tool must require server opt-in, an explicit apply flag, target path validation, and a dry-run manifest, and it must write only under `.ai-playbook/workflows/runs/`.

Default read-only additions:

- `capability_catalog`
- `skill_catalog`
- `workflow_list`
- `workflow_run_preview`
- `playbook_layout`
- `index_status`
- `runtime_schema_check`
- `evidence_locator_check`
- `index_search`
- `symbol_outline`
- `dependency_inventory`
- `route_api_hints`
- `repo_graph_preview`
- `write_gate_preview`

## Write Gate

Write-capable tools should require both a server opt-in and an explicit call argument such as `apply: true`. They should also produce a dry-run plan, validate target paths, and write an audit trail before applying changes.
