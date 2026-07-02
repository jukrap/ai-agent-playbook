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

Scaffold-tier and managed-write tools are not exposed by default. Start the local server with `ai-playbook mcp --enable-write-tools` only when an AI app should see opt-in write tools.

Opt-in write tools currently include:

- `workflow_run_start`: preview or create workflow run files under `.ai-playbook/workflows/runs/`.
- `write_gate_advisory`: preview or save a runtime advisory under `.ai-playbook/runtime/reports/write-gate/`.

Both tools require a tool-call `apply` boolean. `apply: false` returns a dry-run preview, and `apply: true` writes only through existing target path validation.

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
- `reference_adoption_queue`

## Write Gate

Write-capable tools should require both a server opt-in and an explicit call argument such as `apply: true`. They should also produce a dry-run plan, validate target paths, and write an audit trail before applying changes.
