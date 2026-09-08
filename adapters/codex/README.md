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

Follow project instructions, read CURRENT.md and relevant linked knowledge/worklogs, then use the selected repository's own tools to implement and verify. Use `worklog new/list` and `knowledge new` or normal file editing for durable milestone evidence; keep current facts and the next action in the existing entrypoint. A skill is not required to read plain Markdown.

Preserve existing personal model, reasoning, context, compaction, output, and service settings. AAPB installation does not enable experimental history/notes features. A public source capability, installed version metadata, visible tool, and successful invocation are different evidence.

## Model and reasoning choices

Astra and Sol can both run the main task, including a user's Sol `xhigh` or `max` selection. Preserve main and explicit role settings. Optional independent record drafts remain DRAFT until the parent checks original paths, numbers, commands, URLs, decisions, and unknowns. See [Model use](model-use.md) for host-specific spawn fields and v1/v2 waits. AAPB installs no scheduler or 25-minute wait preset.

## Optional MCP

When you want MCP, register it once in the common `~/.codex/config.toml`. Codex starts the server in the task's working directory, which AAPB uses as its default project. Ordinary use does not need `--project` or a `.codex/config.toml` in every repository.

For an npm global installation, `npm root -g` prints the package directory's parent. Append `/ai-agent-playbook/bin/aapb.mjs` to that result and substitute the absolute script path below:

```toml
[mcp_servers.aapb]
command = "node"
args = ["<absolute-package-directory>/bin/aapb.mjs", "mcp"]
enabled = true
enabled_tools = ["aapb_status", "aapb_search", "aapb_read", "aapb_validate"]
```

The example uses the server name `aapb`. If AAPB is already registered under another name, update that entry rather than creating a duplicate. Use an absolute Node executable path if desktop PATH differs from the terminal. Leave server `cwd` and `--project` unset to follow the task's working directory. The installed script path is configured once; it is not a per-project path.

In the TOML example, use forward slashes for Windows paths to avoid backslash escapes.

Reload the MCP connection or restart the app, then open a task in the intended project. In `/mcp`, check the connection and four tools. Ask the agent to read CURRENT.md with AAPB. AAPB reports missing records without creating them automatically.

The server stays bound to its startup context. Mentioning another repository or running `cd` in a shell does not retarget it. Within an explicitly registered workspace, record tools default to common records and accept `recordSource: "repo:<id>"` for existing member-local records; status supports `view: "repositories"`. Registered members can resolve their ancestor workspace. Unregistered folders do not inherit nearby records. Start a separate task for an unrelated project.

At a workspace root, optional AST requires `repo`; within a registered member, that member is the default. CLI AST and Forge use `--repo <id>` for the same boundary. Confirm the selected repository before code or Git operations. [Workspaces](../../docs/workspaces.md), [durable records](../../docs/durable-records.md), and [MCP setup](../../docs/mcp-permission-model.md) explain source selection and filters.

Use `--project "<project>"`, a fixed server `cwd`, or project-local configuration only when you deliberately need a different or fixed target. [MCP setup](../../docs/mcp-permission-model.md) covers those alternatives and output boundaries. See the [official Codex MCP guide](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) for registration and connection controls.

Keep an old common MCP entry disabled until its command and tool allowlist have been checked. Package installation does not enable it automatically. Writing still uses file tools or explicit CLI operations.

For AST source search, add `--with-ast` after `mcp` in the existing server args and add `aapb_ast_search` to its allowlist. Reload once, then confirm five tools. The parser is an optional npm dependency; see [AST search](../../docs/ast-search.md). Keep the existing entry instead of registering a duplicate server.

## Old hooks and external plugins

The earlier package context hooks and broad shell wrappers are retired. `hooks.example.json` is now an inactive empty-hooks example; it no longer points to a removed script. Do not copy old hook commands from historical references into a current installation.

Plugin cache files, account installation, skill discovery, and active MCP servers are separate. AAPB owns only its marked skills. See [Environment profiles](../../docs/environment-profiles.md) before changing unrelated plugins or shared connections. The [personal template](../../templates/codex-home/README.md) is optional and should be merged with existing preferences.
