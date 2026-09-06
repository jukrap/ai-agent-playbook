# MCP setup and permissions

MCP lets an agent app call AAPB's record tools. It is optional: the CLI and direct file editing work without it. Package installation does not register or enable a server.

## Before connecting

Use an installed archive or checkout whose CLI you have verified. In an existing project's terminal directory, check its records with `ai-agent-playbook records status --json`. Keep an older common MCP entry disabled until you intentionally update its command and tool allowlist.

The server uses its startup working directory as the project when no path is supplied:

```powershell
ai-agent-playbook mcp
```

It uses stdio: the client and server exchange messages over standard input/output. Running it in a terminal may look idle because it is waiting for a client. That is not a loading or functional test; stop the manual process with Ctrl+C when finished.

In Codex, one common registration can serve tasks in different projects: Codex starts each server in that task's working directory. You do not need to enter a project path for every repository. The connection remains bound to the directory it started in; mentioning another repository or changing a shell's directory does not retarget it. See [Codex setup](../adapters/codex/README.md) for the complete common configuration.

## Configure the host

Use the host's supported MCP settings. Supply these values, adapted to its configuration format:

| Setting | Value |
| --- | --- |
| Server name | `aapb` |
| Command | `node`, or the absolute Node executable path if the app cannot find it |
| Arguments | Absolute path to `bin/aapb.mjs`, then `mcp` |
| Transport | stdio |
| Environment | No API key is required for AAPB record tools |

For example, the command/argument fields are:

```json
{
  "command": "node",
  "args": ["<absolute-package-directory>/bin/aapb.mjs", "mcp"]
}
```

Replace the package-directory placeholder and retain separate array elements. This is a command example, not a complete host-specific configuration file. An absolute script path lets the host find the installed program; the process working directory separately determines which project's records it reads. Reuse an existing AAPB server entry rather than registering the same server twice. See the [Codex](../adapters/codex/README.md) or [Claude Code](../adapters/claude-code/README.md) adapter.

## Run a published version with npx

Instead of an installed script path, the same server can be launched with npm's package runner:

```json
{
  "command": "npx",
  "args": ["-y", "ai-agent-playbook@1.0.0", "mcp"]
}
```

This is an alternative command/argument pair for the same registration. Keep the existing activation state, tool allowlist and intended working directory; do not add a duplicate server. Node.js and npm must be available to the host. `-y` skips npm's package-installation confirmation, and `@1.0.0` selects that package version. npm may download missing content to its cache; it does not necessarily download the package on every startup.

The host starts a server for the connection, not for each tool call. Both launch methods provide the same AAPB tools for the same version and project. A global CLI update does not change an explicit npx version pin; update that pin deliberately and reload the connection when adopting another release.

## Pin a target only when needed

If another client does not supply the intended working directory, or you deliberately want a fixed project, append `--project` and its absolute path:

```json
{
  "command": "node",
  "args": ["<absolute-package-directory>/bin/aapb.mjs", "mcp", "--project", "<absolute-project-directory>"]
}
```

The equivalent terminal command is `ai-agent-playbook mcp --project "<project>"`. A host that supports a server `cwd` can also fix the startup directory there. Use one targeting method for clarity. These are optional choices in Codex; project-local configuration is useful when connection settings must differ by repository. Check the startup directory in other clients rather than assuming they behave like Codex. AAPB uses the selected directory directly and does not search upward for the Git root.

## Enable structural source search once

Add `--with-ast` to the server command to expose the read-only `aapb_ast_search` tool alongside the four record tools. Add its name to `enabled_tools` if an allowlist is configured, then reload the connection. No per-task toggle is needed. It searches project-relative source paths, with bounded results and coverage reporting; see [AST search](ast-search.md) for the optional native engine, arguments, limits, and installation requirements. The old broad analysis and write tools remain retired.

## Confirm actual loading and behavior

After reloading the host's MCP connection, inspect the tool list. The default connection advertises exactly these four AAPB tools:

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

A request cannot change the bound project. Record-tool paths are playbook-relative; AST source paths are project-relative. Traversal outside the project, absolute input paths, links/junctions, and unsuitable text files are rejected or reported as skipped. Scan warnings show incomplete coverage.

For `.ai-agent-playbook/CURRENT.md`, pass `{"path":"CURRENT.md"}` or `{}` to read the default entrypoint. Do not include `.ai-agent-playbook/` in the tool argument. Use the relative paths returned by status or search for other records.

Content defaults to 12,000 characters and can be adjusted. Long text and lists return continuation cursors. The complete MCP result has a separate 256 KiB UTF-8 ceiling, including text and structured representations and metadata but excluding the JSON-RPC transport envelope. See [Response limits](record-responses.md) for practical sizing and examples.

## Writing and troubleshooting

There are no MCP write tools, shell tools, dynamic resources, generated workflow prompts, automatic hooks, or Forge writes. Use normal file editing for records and explicit CLI operations for migration or Forge apply. Old write-enabling flags are unsupported.

| Problem | Response |
| --- | --- |
| Host cannot start the command | Check absolute script/Node paths and the app's environment |
| Old tools still appear | Inspect duplicate server entries and reload the connection |
| Records come from the wrong project | Check for a fixed `--project` or server `cwd`, and start the task in the intended project |
| CURRENT.md is absent | Inspect status and the existing layout; do not assume bootstrap should overwrite it |
| Cursor rejected after editing | Restart the read/search against the changed source |
| Result too large | Narrow the query, select a smaller page, or read a specific record/range |

Disabling the connection does not remove project files. Common MCP activation remains a separate user choice.
