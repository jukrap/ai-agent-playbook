# MCP Permission Model

The playbook MCP server defaults to read-only analysis and catalog access.

## Tiers

- `read`: search, state, catalogs, layout status, and analysis.
- `scaffold`: create plans, worklogs, runs, or other bounded playbook records.
- `managed-write`: update managed files inside `.ai-agent-playbook`.
- `forge-coordinate`: create or update explicitly planned forge collaboration assets without executing tasks or performing Git delivery.
- `project-write`: modify project source files. This tier is disabled by default.

## Current Default

The default MCP server exposes read-only tools, resources, and prompts. Tools are annotated as read-only and should not write project files.

Default prompts route review work through required evidence, optional evidence, stop conditions, and verification expectations. They do not grant write access or promote generated runtime hints into memory.

Read-only tools may call optional local engines when their tool schema exposes that choice. For example, `writing_naturalness_check` and `writing_naturalness_report` accept `engine: "auto" | "js" | "python"`; the Python path still reads only target-relative prose files, returns JSON findings, and does not write files or call the network.

Forge read tools can inspect configured remotes, local authentication status, and permitted provider capabilities. `offline: true` prevents network-dependent inspection. A read tool does not mutate forge state, refresh scopes, run an executor, or deliver Git changes.

Default resources expose compact structured context that AI apps can read before choosing tools:

- `ai-agent-playbook://capabilities`: capability catalog and coverage summary.
- `ai-agent-playbook://skills`: skill taxonomy and compatibility wrapper metadata.
- `ai-agent-playbook://workflows`: bundled workflow recipes.
- `ai-agent-playbook://adapters`: Codex, Codex App, Claude Code, and MCP setup summary.
- `ai-agent-playbook://adapter-readiness`: adapter check/config commands, readiness checks, and no-write boundaries.
- `ai-agent-playbook://agent-usage-guide`: short routing guide for choosing resources, prompts, and read-only tools.
- `ai-agent-playbook://playbook-layout`: structured `.ai-agent-playbook` layout roles and recommended read order.
- `ai-agent-playbook://reference-adoption`: reference registry, ledger, status, and promotion boundary summary.
- `ai-agent-playbook://mcp-permission-model`: this permission model as structured JSON.

Gate and graph review prompts include:

- `agent_orchestration_review`
- `repo_graph_review`
- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`

Scaffold-tier, managed-write, and forge-coordinate tools are not exposed by default. Start the local server with `aapb mcp --enable-write-tools` only when an AI app should see the existing opt-in playbook write tools.

Opt-in write tools currently include:

- `workflow_run_start`: preview or create workflow run files under `.ai-agent-playbook/workflows/runs/`.
- `write_gate_advisory`: preview or save a runtime advisory under `.ai-agent-playbook/runtime/reports/write-gate/`.
- `reference_ledger_update`: preview or append missing rows in `.ai-agent-playbook/knowledge/reference-adoption-ledger.md`.
- `reference_ledger_decision`: preview or update one existing reference adoption ledger decision row.
- `reference_source_registry_update`: preview or append missing entries in `.ai-agent-playbook/knowledge/sources.json`.

All write-capable tools require a tool-call `apply` boolean. `apply: false` returns a dry-run preview, and `apply: true` writes only through existing target path validation.

Forge coordination has a separate gate. `aapb mcp --enable-forge-write-tools` exposes:

- `forge_bootstrap_apply`: apply an idempotent managed label, milestone, Project/View, or documented fallback plan.
- `forge_sync_apply`: apply idempotent plan/task-to-issue coordination.

Both tools still require the call argument `apply: true`, effective forge-write permission, a detected writable provider, and valid authentication. `--enable-write-tools` does not enable these tools, and `--enable-forge-write-tools` does not enable the playbook write tools above.

The structured permission resource reports the five playbook tools as `managedWriteTools` and the two forge tools as `forgeCoordinateWriteTools`, with seven opt-in write tools in total. These lists describe the available gated surface; they do not indicate that either server flag or call-level approval is active.

Default read-only additions:

- `capability_catalog`
- `skill_catalog`
- `workflow_list`
- `workflow_run_preview`
- `playbook_layout`
- `index_status`
- `runtime_schema_check`
- `evidence_locator_check`
- `writing_naturalness_check`
- `writing_naturalness_report`
- `index_search`
- `symbol_outline`
- `dependency_inventory`
- `route_api_hints`
- `repo_graph_preview`
- `write_gate_preview`
- `reference_inventory`
- `reference_inspect`
- `reference_adoption_queue`
- `reference_capability_matrix`
- `reference_adoption_plan`
- `reference_adoption_status`
- `reference_source_registry_preview`
- `reference_source_registry_check`
- `reference_source_registry_update_preview`
- `reference_ledger_check`
- `reference_ledger_update_preview`
- `reference_ledger_decision_preview`
- `automation_status`
- `automation_plan_validate`
- `forge_status`
- `forge_bootstrap_plan`
- `forge_sync_plan`

## Write Gate

Write-capable tools require both the matching server opt-in and an explicit call argument such as `apply: true`. Forge writes additionally require current provider capability, authentication, and effective policy checks. Forge preview tools require a target and build with the same detected provider and effective capability snapshot as apply. Tools should produce a dry-run plan, validate target or remote identity, and retain an audit result before applying changes.

The MCP layer still does not expose CLI bootstrap, install, update, uninstall, prune, snapshot apply, canon promotion, push, automation tick/supervisor, merge, release, delete, force-push, rename, rewrite, or project source write commands.
