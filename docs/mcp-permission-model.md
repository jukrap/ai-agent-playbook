# MCP setup and permissions

MCP lets an agent app call AAPB's record tools. It is optional: the CLI and direct file editing work without it. Package installation does not register or enable a server.

## Before connecting

Use an installed archive or checkout whose CLI you have verified. Select one existing project, and check its records with `ai-agent-playbook records status "<project>" --json`. Keep an older common MCP entry disabled until you intentionally replace its command and tool allowlist.

The server binds one project at startup:

```powershell
ai-agent-playbook mcp --project "<project>"
```

It uses stdio: the client and server exchange messages over standard input/output. Running it in a terminal may look idle because it is waiting for a client. That is not a loading or functional test; stop the manual process with Ctrl+C when finished.

## Configure the host

Use the host's supported MCP settings. Supply these values, adapted to its configuration format:

| Setting | Value |
| --- | --- |
| Server name | `aapb` |
| Command | `node`, or the absolute Node executable path if the app cannot find it |
| Arguments | Absolute path to `bin/aapb.mjs`, then `mcp`, `--project`, and the absolute target-project path |
| Transport | stdio |
| Environment | No API key is required for AAPB record tools |

For example, the command/argument fields are:

```json
{
  "command": "node",
  "args": ["<absolute-package-directory>/bin/aapb.mjs", "mcp", "--project", "<absolute-project-directory>"]
}
```

Replace both placeholders and retain separate array elements. This is a command example, not a complete host-specific configuration file. Using Node and an absolute script path avoids dependence on a global shell wrapper or the app's working directory. See the [Codex](../adapters/codex/README.md) or [Claude Code](../adapters/claude-code/README.md) adapter.

## Confirm actual loading and behavior

After reloading the host's MCP connection, inspect the tool list. It should advertise exactly these four AAPB tools:

| Tool | Purpose | First request arguments |
| --- | --- | --- |
| `aapb_status` | Layout, entrypoint, and record totals | `{}` |
| `aapb_read` | Read one record | `{"path":"CURRENT.md"}` |
| `aapb_search` | Literal text search within records | `{"query":"a phrase from CURRENT.md"}` |
| `aapb_validate` | JSON, links, and managed integrity | `{}` |

Exercise a status and read request, inspect source paths and warnings, and compare the text with the file. `runtimeVerified: false` is expected from record validation. A configuration entry, a running process, a visible tool catalog, and a successful invocation are separate observations.

Earlier 1.0 prereleases advertised `playbook_*`; starting with next.2, the tools use `aapb_*` without duplicate aliases. Update explicit allowlists. The npm package name and record directories are unchanged. CLI aliases do not add MCP tools or skills.

For the distinction between a successful SDK test and an agent choosing a tool for a natural-language request, see [Agent use](agent-usage.md).

## Read boundary and output

A request cannot change the bound project. Read paths are playbook-relative; traversal outside the project, absolute input paths, links/junctions, and unsuitable text files are rejected or reported as skipped. Scan warnings show incomplete coverage.

Content defaults to 12,000 characters and can be adjusted. Long text and lists return continuation cursors. The complete MCP result has a separate 256 KiB UTF-8 ceiling, including text and structured representations and metadata but excluding the JSON-RPC transport envelope. See [Response limits](record-responses.md) for practical sizing and examples.

## Writing and troubleshooting

There are no MCP write tools, shell tools, dynamic resources, generated workflow prompts, automatic hooks, or Forge writes. Use normal file editing for records and explicit CLI operations for migration or Forge apply. Old write-enabling flags are unsupported.

| Problem | Response |
| --- | --- |
| Host cannot start the command | Check absolute script/Node paths and the app's environment |
| Old tools still appear | Inspect duplicate server entries and reload the connection |
| CURRENT.md is absent | Inspect status and the existing layout; do not assume bootstrap should overwrite it |
| Cursor rejected after editing | Restart the read/search against the changed source |
| Result too large | Narrow the query, select a smaller page, or read a specific record/range |

Disabling the connection does not remove project files. Common MCP activation remains a separate user choice.
