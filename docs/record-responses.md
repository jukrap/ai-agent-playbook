# AAPB record response contract

The public MCP names are aapb_status, aapb_search, aapb_read and aapb_validate. The earlier prerelease playbook_* names are no longer advertised. Update explicit tool allowlists when adopting this prerelease. The npm package name, aapb command and existing record directories remain unchanged.

## Budgets and continuation

Use a 12,000-character default content budget, adjustable with maxChars up to 100,000. List pages default to 20 complete items and accept pageSize up to 100; search retains maxResults as its page-size option. These are content budgets, not token estimates. A separate 256 KiB UTF-8 limit applies to the complete MCP result, including both representations and metadata. It is a defensive ceiling, not a target size or the host's token setting.

Status defaults to a compact summary. Its records and warnings views are paged. Validation defaults to a page of issues and also offers summary and warnings views. All views retain scan completeness and total counts within the inspected scope. Pagination never changes a failed validation into a successful validation. A page too small for one complete item returns an actionable error instead of a cut JSON fragment.

Search returns source paths, line numbers and text around each match. Read returns original text slices, including line endings, with source hashes and exact continuation positions. Long lines and Unicode pairs must resume without dropped or repeated text. Read supports startLine/endLine for the first request. A returned cursor carries the continuation range; subsequent requests repeat the path and may change maxChars.

For paged lists, repeat the same query/view and pass nextCursor. Cursors bind the project, operation and inspected content. A changed source or an incompatible request rejects a cursor; restart the query instead of silently skipping or duplicating results. Cursors are opaque continuation data, not permission grants. Every request still enforces filesystem boundaries.

## Scan boundaries and evidence

Each file is limited to 500,000 bytes. Traversal is limited to 2,000 entries and aggregate text inspection to 32 MB per request. Search matches and validation issues each have a 10,000-item inspection ceiling, reported as incomplete when reached. Skipped, unreadable or uninspected scope remains visible in scan metadata and warnings. The server does not know the conversation's remaining token budget and does not guess it.

This continuation contract belongs to AAPB tool arguments/results. The [MCP list pagination mechanism](https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/pagination) does not automatically paginate tools/call results.

The result-size check does not summarize or rewrite source records. MCP calls never create result caches or temporary report files. A validation result describes configuration and document checks; runtimeVerified remains false.

## Verification and demonstration

Test exact text reconstruction, stable list pagination, changed-source cursors, query/project mismatch, small budgets, warning visibility, Unicode and complete serialized response sizes. Exercise an actual SDK stdio client.

Install a local npm archive into an isolated prefix before registry publication. Use existing project records to demonstrate status, search, reading, validation and migration preview. Apply/rollback demonstrations use preserved record copies. Keep machine-specific output and project details out of public release artifacts. Compare English and Korean command names, limits, migration notes and verification claims in the same change.
