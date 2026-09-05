# Codex setup

AAPB supplies portable records and selected skills. Use the installed host's native editing, execution, and scheduling tools. AAPB does not select a model, change context budgets, or configure an entire personal environment.

## Install selected skills

Use a verified CLI and preview the development profile:

```powershell
ai-agent-playbook skills install --profile development --dry-run --json
ai-agent-playbook skills install --profile development --json
ai-agent-playbook skills check --profile development --json
```

The default user directory is `.agents/skills`. Do not mirror the same skills into `.codex/skills`; migrate known older copies explicitly using [Lifecycle](../../docs/lifecycle.md). Reload skills or start a fresh session and check the actual five-name catalog. Disk copies and prompt injection are separate observations.

## Work with project records

Follow project instructions, read CURRENT.md and relevant linked records, then use the project's own tools to implement and verify. Write current facts and the next action with normal file editing. A skill is not required to read plain Markdown.

Preserve existing personal model, reasoning, context, compaction, output, and service settings. AAPB installation does not enable experimental history/notes features. A public source capability, installed version metadata, visible tool, and successful invocation are different evidence.

## Optional MCP

Connect a project-bound `ai-agent-playbook mcp --project "<project>"` only when wanted. [MCP setup](../../docs/mcp-permission-model.md) gives command/argument fields, expected tools, and a loading checklist. An absolute Node/script invocation is useful when desktop PATH differs from a terminal.

Keep old common MCP entries disabled until intentionally updated. The server exposes only `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`; writing still uses file tools or explicit CLI operations.

## Old hooks and external plugins

The earlier package context hooks and broad shell wrappers are retired. `hooks.example.json` is now an inactive empty-hooks example; it no longer points to a removed script. Do not copy old hook commands from historical references into a current installation.

Plugin cache files, account installation, skill discovery, and active MCP servers are separate. AAPB owns only its marked skills. See [Environment profiles](../../docs/environment-profiles.md) before changing unrelated plugins or shared connections. The [personal template](../../templates/codex-home/README.md) is optional and should be merged with existing preferences.
