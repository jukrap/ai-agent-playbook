# Project MCP boundary

Each serialized tool result is capped at 12,000 characters, including JSON escaping. Oversized results return an explicit truncated preview; narrow the query or use smaller record reads. This also bounds status and validation output, not just record content.

MCP is optional and never registered by package installation. Bind it with `aapb mcp --project <project>`; omission uses the startup working directory.

| Tool | Allowed behavior |
| --- | --- |
| playbook_status | Record inventory, layout and entrypoint |
| playbook_search | Bounded literal search within records |
| playbook_read | Bounded text read using a playbook-relative path |
| playbook_validate | JSON, link and managed-file checks |

The binding cannot be changed by a tool argument. Relative traversal, absolute paths, links/junctions and non-text records are rejected or reported as skipped. Reads have output and file-size bounds; scans report incomplete coverage.

There are no write tools, dynamic resources, generated workflow prompts, shell tools, automatic hooks, or forge writes through MCP. Write records with the host file tools; use the CLI for explicit installation/migration/forge apply. A validation result never claims runtime behavior was verified.

Enabling a config entry and seeing a successful process launch are distinct from observing the four tools and exercising their behavior. Existing old MCP configs should stay disabled until intentionally migrated. The former write-enabling flags are not supported.
