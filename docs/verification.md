# 1.0 prerelease verification

## Scope and runtime checks

This release changes project records, selected skills, installation and local capability exposure. Writer and Game received separate local plans only; existing dirty file hashes, repository heads and worktree listings were preserved. Their product implementations and real game-engine execution were not validated by this release.

The redesigned suite passes 136 tests on Windows with Node.js 22.22.3. Thirty-three tests cover the new CLI, records, installation/recovery and actual stdio MCP. The remaining 103 preserve forge and Python-discovery coverage. The old 458-pass/one-skip baseline included retired execution, indexing and scheduling features; the totals are not a performance or coverage comparison.

Syntax, TypeScript, skills, translations, public-document and Python checks passed. The 33 new tests also passed under Node.js 18.20.8. This is a compatibility smoke test, not a claim that the full suite ran on every supported OS or Node release. The Windows/Ubuntu CI matrix was prepared but has not run remotely.

A release-readiness follow-up reproduced an EXDEV failure when an explicit backup and installation used different volumes. Default backups now follow the selected installation root. Preview and apply reject a different-filesystem backup before writing; regression tests exercised separate Windows volumes, same-filesystem default installation and rollback. Atomic cross-filesystem copying is not supported. The npm publish dry run with the next tag passed; it does not establish registry authorization or a completed publication.

Installation checks cover a single destination, selected profiles, Korean/space paths, unmanaged and modified files, junction boundaries, concurrent edits, interrupted apply, malformed journals, changed backups, repeat migration and repeat rollback. Record checks cover existing layouts, minimal bootstrap, unchanged previews, protected metadata and restoration. MCP tests use an SDK stdio client, verify exactly four tools, reject path escape and cap serialized results without changing record files. Forge tests use mocked transports for stable identifiers, stale state and partial failure; no remote records were written.

Additional review reproduced and fixed empty explicit skill selections, unreadable current-state entrypoints, a writing report that ignored --root, and linked ancestor paths in advisory readers. Regressions now reject unsafe inputs without changing project records or external files. The MCP assertion covers the entire tool result, including both text and structured representations; checking each representation separately had missed the combined limit. The npm file list now includes Korean and linked maintenance documentation. An archive-content audit checked 106 current guide/skill Markdown files for missing relative links and excluded private records, backups and tests.

A local package archive was inspected for required runtime/catalog/reference files and absence of private records. An isolated npm prefix successfully ran the previous global 0.5.10 package, upgraded to 1.0.0-next.1, recovered 0.5.10, then upgraded again. Source recovery remains separately pinned to 0.5.11. No registry publication or remote push was performed.

## Response continuation and existing-project demonstration

The next.2 response contract was exercised with Unicode/CRLF reconstruction, long lines, exact source locations, source/query/project cursor mismatch, small budgets, paged warnings and validation totals. The four aapb_* tools were called through the SDK stdio transport from an isolated npm archive installation against two existing structured record sets. All source CURRENT.md text was reconstructed exactly. The original projects received read-only calls and migration previews; successful apply/rollback and ownership-conflict refusal were exercised on preserved copies.

The first record set contained 73 records and three modified managed documents; the second contained 74 records and 18 modified managed documents. These are preservation signals, not proof that the document contents are defective. The second layout's manifest lacked a matching ownership entry, so migration correctly refused it. No original metadata was forced into a managed state. Project-local demonstrations retain their raw transcripts and hashes outside the release artifacts.

## Five-case comparison

Ten artifact-only calls used the same Astra model, xhigh reasoning and explicit context/output settings. Both conditions retained the same personal instructions. Baseline received the task/input alone; lean also received the applicable short skill and selected references. Automatic skill-catalog injection and plugin/app tooling were disabled for both comparison conditions only. Global model and budget settings were preserved.

The two UI cases used synthetic HTML: a dense shipping screen and an intentionally branded bookshop event. The prose cases used a technical document with protected literals and a friendly reading-group notice. The code case removed redundant helpers while preserving an exported function's observable behavior.

One run per condition is enough to inspect these examples, not estimate a population effect. This was not a blind review, multi-seed benchmark, or full agent-workflow comparison. Both prompts explicitly prohibited tools and clarification, so zero tool calls cannot establish reduced questions, rereading or verification overhead.

| Case | Baseline / lean input tokens | Baseline / lean output tokens | Baseline / lean seconds | Observation |
| --- | ---: | ---: | ---: | --- |
| Dense UI | 11,575 / 11,963 | 18,532 / 18,217 | 561.63 / 582.97 | Both preserve five orders, filter two delayed orders and find one customer; no clear quality advantage. |
| Branded UI | 11,411 / 11,898 | 10,434 / 10,486 | 348.30 / 331.84 | Both preserve gradient, rounded ticket, serif identity and event facts; lean adds a skip link. |
| Technical Korean | 11,230 / 11,990 | 452 / 551 | 17.79 / 21.33 | Both preserve all eight protected literals and operational conditions. |
| Korean register | 11,210 / 11,970 | 355 / 400 | 14.39 / 16.73 | Both preserve facts, polite register and an intentional fragment; lean preserves reassuring repetition that baseline removes. |
| Code cleanup | 11,208 / 11,600 | 305 / 398 | 14.98 / 18.10 | Both pass 28 total differential checks; their only substantive source difference is a local variable name. |

Output tokens are the CLI-reported total, including separately reported reasoning output. Cached input was zero except the lean technical-document run (11,008 tokens). Wall time includes service latency. Neither these values nor subscription quota percentages establish a monetary saving.

UI results were inspected in the in-app Chromium browser at 1440px and 390px. Search, filters, Enter/Escape entry and focus return, empty-form validation and synthetic confirmation were exercised. Page widths did not overflow at 390px. This is not a complete accessibility audit or a physical-device test. Both shipping results added local invoice-draft interfaces beyond the sparse input; the extra guidance did not reliably reduce elaboration.

The code checks include strict boolean selection, nullish fallback, ordering, duplicates, non-array iterables, getter reads, string conversion and exceptions. The prose checks combine protected-string checks with human judgment of meaning and register. They do not classify authorship.

## Resulting decisions and limits

Keep short design/UI/prose entrypoints for task-specific constraints and examples. Keep code cleanup as a separately selected reference. Because UI and code examples did not establish a consistent improvement, longer guidance stays optional; UI and prose references are no longer required for a small, clear edit. The final optional-reference wording was adjusted after the comparison and was not subjected to another model comparison.

Fresh host discovery and actual prompt injection were measured separately. The implementation environment had 188 owned AAPB copies before migration and five development-profile copies afterward. Migration applied 190 independent operations without conflict; replay proposed zero. A warmed host discovered 50 enabled skills and actually injected 44 unique entries, compared with the initial session's 262 entries and 88 repeated names. The 44 comprise 35 selected/user-managed entries, four app-bundled entries and five injected system entries. Discovery includes additional entries that are not automatically injected.

A cold first-turn CLI probe injected only 20 entries before remote plugin loading; this is a timing difference, not an additional cleanup success. Do not equate cache inventory, discovery, injected catalog and connected tools. The existing conversation retains its earlier context. See [environment profiles](environment-profiles.md) for remote-plugin controls and [lifecycle](lifecycle.md) for recovery.

Common AAPB MCP and the project-specific common MCP were confirmed disabled in a fresh runtime. Optional plugin MCP overlays were also disabled. Host connector tooling remained connected; tool availability does not prove every connector operation or artifact renderer works. Native history/notes availability was not promoted from source presence or model metadata, and no experiment flag was enabled.
