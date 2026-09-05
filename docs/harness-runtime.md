# Runtime architecture

AAPB is a local Node.js ESM program for project records and explicit supporting operations. Its primary CLI is `ai-agent-playbook`, with `aapb` as a short alias; optional MCP exposes a subset of the same record readers. The host and the project retain responsibility for implementing and executing work.

## From request to result

```text
CLI command / project-bound MCP request
  -> select one existing project and playbook root
  -> check paths, file types, and size bounds
  -> read records or plan an explicit operation
  -> return content, warnings, scope, and continuation
```

Record operations share implementations between CLI and MCP. CLI routes load installation, MCP, writing, and Forge modules only when selected. No executor, scheduler, code-index database, or universal preflight process is started.

## Public surfaces

| Surface | Responsibility | Outside its claim |
| --- | --- | --- |
| Record readers | Inventory, text search/read, document validation | Whether project code works or prose is currently true |
| Bootstrap/layout migration | Minimal records and managed metadata | Replacing root policy or rewriting historical documents |
| Skill lifecycle | Selected owned installations and recovery | All host plugins, connector accounts, or unrelated skills |
| Writing/UI checks | Advisory signals in selected text | Rendered UI validation or authorship detection |
| Forge | Reviewed coordination plans and explicit remote application | Task execution, scheduling, commits, or pushes |

## Data contracts

New record envelopes use `schemaVersion: 2`. Retained writing and Forge modules keep their existing result schemas; consumers should identify the result kind and read the relevant contract instead of assuming every field is identical.

Record results distinguish `ok`, warnings, incomplete scan scope, source locations, and continuation. Status and validation keep `runtimeVerified: false`. CLI errors use nonzero exit codes; MCP errors use bounded tool results. See [Commands](commands.md) and [Response limits](record-responses.md).

Files remain Markdown/JSON and compatible text formats. There is no external record database. Reads do not create caches or reports. Existing layouts and ownership markers are read compatibly; ambiguous roots and unreadable content remain visible.

## Writes, ownership, and recovery

Installation checks real paths, ownership, and hashes before applying staged replacements. Existing content moves into a same-filesystem backup with a recovery journal. Rollback checks later edits before restoring. Files are not owned merely because they have a familiar name.

Layout migration saves the previous manifest and marker, changes compatible metadata, and preserves user documents. It does not automatically select current facts from old evidence. [Lifecycle](lifecycle.md) explains the different skill and record recovery paths.

Forge previews do not construct an authenticated transport. Explicit apply resolves the provider and credentials, then checks the supported operation and concurrent remote state. Partial failures are reported; local project work is not automatically reset.

## Verification boundaries

A settings file can show intent, a loaded tool list can show availability, and a successful call can show exercised behavior. Keep those observations separate. Unit tests, SDK stdio tests, package installation, and real-host loading answer different questions. The [verification report](verification.md) records observed scope; it is not a guarantee for every host or platform.
