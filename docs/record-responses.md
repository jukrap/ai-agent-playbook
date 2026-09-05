# Response size and continuation

AAPB normally returns a compact status or a bounded part of a record. Ask for more detail when needed. These limits control tool results; they do not change the agent host's context window or output-token setting.

## Choose a useful amount

| Situation | Request |
| --- | --- |
| Find the current entrypoint | Status with the default `summary` view |
| Inspect a small document | Read with the default 12,000-character budget |
| Find relevant evidence | Search for a phrase, then read a matching file |
| Work with a long document | Select a line range or continue using the returned cursor |
| Inspect many records or issues | Page complete items with `pageSize` / `maxResults` |

The server cannot see the conversation's remaining token budget. The caller chooses a size using the task and visible output. Increasing the content budget is supported, but requesting the maximum for every call adds unnecessary text.

## Continue a CLI read

```sh
ai-agent-playbook records read "<project>" --path CURRENT.md --max-chars 700 --json
ai-agent-playbook records read "<project>" --path CURRENT.md --cursor "<nextCursor>" --max-chars 2000 --json
```

Replace `<nextCursor>` with the actual first result's `nextCursor`. Repeat until `truncated` is false and there is no next cursor. The second request may use a different content budget. Concatenate the `content` strings without adding separators to reconstruct the text.

For an initial line range, use `--start-line 10 --end-line 40`. On continuation, repeat the path and cursor but omit line arguments: the cursor already remembers the selected range.

## Continue a list or search

```sh
ai-agent-playbook records status "<project>" --view records --page-size 5 --json
ai-agent-playbook records status "<project>" --view records --page-size 5 --cursor "<page.nextCursor>" --json
ai-agent-playbook records search "<project>" --query "API decision" --max-results 3 --json
ai-agent-playbook records search "<project>" --query "API decision" --max-results 3 --cursor "<page.nextCursor>" --json
```

List cursors are in `page.nextCursor`. Repeat the view and, for search, the same query. Status offers `summary`, `records`, and `warnings`; validation offers `issues` (default), `summary`, and `warnings`; search offers `results` (default) and `warnings`.

Every page keeps totals and scan completeness for the inspected scope. A failed validation stays failed even when the displayed page contains no new issue. An incomplete scan is not made complete by reading all returned pages.

## Equivalent MCP requests

Call `aapb_read` with:

```json
{"path":"CURRENT.md","maxChars":700}
```

Then use the returned cursor:

```json
{"path":"CURRENT.md","cursor":"<nextCursor>","maxChars":2000}
```

MCP uses camelCase arguments (`maxChars`, `pageSize`, `maxResults`, `startLine`, `endLine`); CLI options use hyphens. The other public tools are `aapb_status`, `aapb_search`, and `aapb_validate`. The earlier `playbook_*` prerelease names are no longer advertised.

## Exact text and changed sources

Reads preserve source text and line endings. A UTF-8 BOM is omitted from text output, while the source hash still identifies the original bytes. Positions and character budgets use JavaScript UTF-16 units; some emoji occupy two units, and the reader avoids splitting the pair. Search returns the source path, line number, and text around each match.

Cursors bind the project, operation, query/view, and inspected content. If a source changes or the request no longer matches, restart the operation. Do not edit a cursor or use it to switch projects. Each request enforces the same filesystem boundaries; a cursor does not grant permission.

## Content and transport limits

| Limit | Value | Meaning |
| --- | --- | --- |
| Default content | 12,000 characters | Adjustable with `maxChars` |
| Maximum content | 100,000 characters | Requested text/list content, not tokens |
| List page | 20 default, 100 maximum | Complete items; search uses `maxResults` |
| Complete MCP result | 256 KiB UTF-8 | Text and structured representations plus metadata; excludes JSON-RPC envelope |
| One file | 500,000 bytes | Maximum readable record file |
| Traversal | 2,000 entries | Filesystem inspection bound |
| Text inspection | 32 MB per request | Aggregate scan bound |
| Search matches / validation issues | 10,000 each | Reaching the inspection ceiling is reported as incomplete |

The complete-result ceiling is a defensive bound. Because MCP can carry text and structured representations together, it is separate from the content budget. It does not mean every result should approach 256 KiB. If one complete list item cannot fit, the tool returns an actionable error instead of a broken JSON fragment. Narrow the request or adjust the relevant size.

Scan metadata and warnings identify skipped, unreadable, or uninspected scope. No source rewriting, automatic summaries, result-cache files, or temporary reports are used to shrink responses. Validation always keeps `runtimeVerified: false`.

Continuation is part of AAPB's tool arguments and results. MCP's protocol-level list pagination does not automatically paginate `tools/call` results. See [Runtime architecture](harness-runtime.md) and [the demonstration guide](demo.md) for verification boundaries.
