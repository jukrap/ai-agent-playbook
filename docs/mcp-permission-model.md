# Project MCP boundary

Content defaults to 12,000 characters and can be adjusted independently of the 256 KiB UTF-8 ceiling for the complete tool result. The JSON-RPC transport envelope is outside that ceiling. Results page complete items or exact source text and return continuation cursors; JSON fragments are not used as overflow previews. See the [response contract](record-responses.md) for limits, views, source-change detection and examples of the verification scope.

MCP is optional and never registered by package installation. Bind it with `aapb mcp --project <project>`; omission uses the startup working directory.

| Tool | Allowed behavior |
| --- | --- |
| aapb_status | Record inventory, layout and entrypoint |
| aapb_search | Bounded literal search within records |
| aapb_read | Bounded text read using a playbook-relative path |
| aapb_validate | JSON, link and managed-file checks |

The binding cannot be changed by a tool argument. Relative traversal, absolute paths, links/junctions and non-text records are rejected or reported as skipped. Reads have output and file-size bounds; scans report incomplete coverage.

There are no write tools, dynamic resources, generated workflow prompts, shell tools, automatic hooks, or forge writes through MCP. Write records with the host file tools; use the CLI for explicit installation/migration/forge apply. A validation result never claims runtime behavior was verified.

Enabling a config entry and seeing a successful process launch are distinct from observing the four tools and exercising their behavior. Existing old MCP configs should stay disabled until intentionally migrated. The former write-enabling flags are not supported.
