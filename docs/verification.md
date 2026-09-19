# Verification record

The sections below preserve development-stage evidence and its original scope. Current change information is in the [changelog](../CHANGELOG.md); [local package testing](demo.md) explains how to verify an unpublished candidate. The historical [1.0.0](release-1.0.0.md) and [1.1.0](release-1.1.0.md) release notes retain their own scope. Test totals and package checks from an earlier archive do not automatically describe a later archive.

## Light skill profile and guarded migration (1.3.0)

The 1.3.0 source passed all 307 tests on Windows with Node.js 22.22.3, plus syntax, TypeScript, Python, skills, translations, public-document checks and required PowerShell installation/update/sync previews. The seven new migration regressions cover replacement conflicts before apply, failed installations after preview, partially successful replacement sets, already-current and newly installed replacements changed before cleanup, changes between removals, preservation in both skill roots, and recovery. Source checks do not replace verification of the exact release archive or hosted CI results.

The light profile selects one skill with one instruction file and no reference bundle. The measured name-plus-description length is 82 characters, compared with 230 for core and 634 for development; paths and host framing are excluded. These are package-content measurements, not observed model token counts or cost savings. Host discovery, automatic selection, response wording, and provider or company audit behavior were not validated by these checks. See [Release notes](release-1.3.0.md) for the feature and recovery boundaries.

## Bootstrap usability and field fixes (1.2.2)

The source passed all 295 tests on Windows with Node.js 22.22.3, plus syntax, TypeScript, Python, skills, translations, public-document checks and required PowerShell install/update/sync previews. Terminal tests include explicit selection, disabled choices, search, paging, cancellation, stream cleanup and narrow Korean rendering. A real Windows terminal exercised twelve repository checkboxes, folder preparation, the unavailable local exclusion, final-review language editing and a no-write preview; a separate existing-project flow was cancelled without writes.

Read-only CLI and SDK MCP checks in two existing frontend repositories reproduced worklog guide misclassification, Windows record path casing, AST protected-path case aliases and metadata-only monthly search inconsistencies. Corrected source and an installed candidate archive were then checked against both repositories, preserving existing files and Git state. Fixture regressions cover custom worklog roots, summaries, date precedence, bounded metadata reads and both Git/filesystem AST selection.

An isolated npm installation verified 1.2.1 → 1.2.2 → 1.2.1, both executable aliases, shared records, authoring, AST, SDK MCP and restoration of existing records. Installation without optional dependencies retained record tools and reported the missing AST engine. These checks do not establish a fresh Codex host's automatic tool selection, every application UI behavior, other operating systems, publication or an updated global installation.

## Workspace and durable-record candidate

The `1.2.0-next.1` source passed 240 tests on Windows with Node.js 22.22.3, plus syntax, TypeScript, Python, naming, skills, translation and public-document checks. Required PowerShell validation and install/update/sync previews passed without updating installed skills. The source still offers six skills, including optional legacy contracts; the development profile selects five.

Fixtures include twelve independent Git repositories: one PC web, three webview webs, four Android and four iOS members. Checks cover shared/member-local records, Git-less bootstrap, four exclusion modes, worktree exclusions, cancellation, previews, ownership, interrupted changes/recovery, concurrent worklogs and registry writers, and user edits. Follow-up regressions cover reserved-directory case variants, stale member record paths, cross-workspace cursors, flat legacy monthly logs, filtered traversal/text budgets and explicit-source migration/rollback. Forge cannot inherit an ancestor remote from a plain registered subdirectory, including when a member's Git directory disappears. Remote writes use test transports.

A real terminal completed a Korean guide dry run and a separate cancellation without creating files. SDK stdio tests exercised the five-tool surface, including AST, from a registered member. Separate ephemeral Codex host sessions used Astra `xhigh` at the workspace root and Sol `max` inside a member. Both retrieved the shared goal, linked knowledge, recorded checks, unknowns and next action through MCP, preserving fixture files. This verifies invocation and record resumption; it does not verify native apps or builds.

Three synthetic fact packets compared Astra `xhigh` alone with a Sol `xhigh` draft followed by Astra `xhigh` review. All supplied commands, URLs, source locators, IDs and values survived all nine outputs. Review found no assumptions or unrun checks promoted to fact. One Sol draft exceeded the requested 20 lines; another duplicated the next action as a proposal. Review corrected both.

| Packet | Main-only seconds | Draft + review seconds | Main-only input tokens | Draft + review input tokens |
| --- | --- | --- | --- | --- |
| Authentication | 29.86 | 51.39 | 16,781 | 32,903 |
| Upload limit | 21.19 | 35.51 | 16,750 | 32,824 |
| Native bridge evidence | 28.59 | 33.35 | 16,767 | 32,884 |

These are CLI end-to-end timings and reported input usage, including host instructions and cached input, for one run per case. Each main-only run reported 11,776 cached input tokens; each draft/review pair reported 22,528 combined. The text-only comparisons called no tools. They establish no general speed, quality, price or subscription-limit improvement. Drafting alone finished sooner, but adding review increased total time and input usage in all three cases. Ordinary records therefore remain with the main task; long independent drafts are optional.

The candidate adds no model runner, timer, vector database or required 25-minute wait preset. Linux/macOS execution, real company repositories, native devices and long-record delegation economics were not tested in this stage. GitHub delivery and npm publication remain separate steps.

## Earlier prerelease scope and runtime checks

This release changes project records, selected skills, installation and local capability exposure. Writer and Game received separate local plans only; existing dirty file hashes, repository heads and worktree listings were preserved. Their product implementations and real game-engine execution were not validated by this release.

The redesigned suite passes 137 tests on Windows with Node.js 22.22.3. Thirty-three tests cover the new CLI, records, installation/recovery and actual stdio MCP. The remaining 104 cover forge and Python-discovery coverage. The old 458-pass/one-skip baseline included retired execution, indexing and scheduling features; the totals are not a performance or coverage comparison.

Syntax, TypeScript, skills, translations, public-document and Python checks passed. The 33 new tests and both Python-discovery tests also passed under Node.js 18.20.8. This is a compatibility smoke test, not a claim that the full suite ran on every supported OS or Node release. The Windows/Ubuntu CI matrix has also run remotely. Two initial Windows interpreter-discovery steps failed while PR runs of the same sources passed. A delayed-interpreter regression reproduced rejection at three seconds; probes now use an eight-second bound and failed validation includes candidate errors. The original hosted failures did not capture those errors, so their exact cause remains unconfirmed.

A release-readiness follow-up reproduced an EXDEV failure when an explicit backup and installation used different volumes. Default backups now follow the selected installation root. Preview and apply reject a different-filesystem backup before writing; regression tests exercised separate Windows volumes, same-filesystem default installation and rollback. Atomic cross-filesystem copying is not supported. The npm publish dry run with the next tag passed; it does not establish registry authorization or a completed publication.

Installation checks cover a single destination, selected profiles, Korean/space paths, unmanaged and modified files, junction boundaries, concurrent edits, interrupted apply, malformed journals, changed backups, repeat migration and repeat rollback. Record checks cover existing layouts, minimal bootstrap, unchanged previews, protected metadata and restoration. MCP tests use an SDK stdio client, verify exactly four tools, reject path escape and cap serialized results without changing record files. Forge tests use mocked transports for stable identifiers, stale state and partial failure; no remote records were written.

Additional review reproduced and fixed empty explicit skill selections, unreadable current-state entrypoints, a writing report that ignored --root, and linked ancestor paths in advisory readers. Regressions now reject unsafe inputs without changing project records or external files. The MCP assertion covers the entire tool result, including both text and structured representations; checking each representation separately had missed the combined limit. The npm file list now includes Korean and linked maintenance documentation. An archive-content audit checked 106 current guide/skill Markdown files for missing relative links and excluded private records, backups and tests.

A local package archive was inspected for required runtime/catalog/reference files and absence of private records. An isolated npm prefix successfully ran the previous global 0.5.10 package, upgraded to 1.0.0-next.1, recovered 0.5.10, then upgraded again. Source recovery remains separately pinned to 0.5.11. That initial next.1 archive-validation stage did not publish to npm or push remotely. Later GitHub activity is a separate milestone; these historical package checks are not a statement of current branch publication status.

## Response continuation and existing-project demonstration

The next.2 response contract was exercised with Unicode/CRLF reconstruction, long lines, exact source locations, source/query/project cursor mismatch, small budgets, paged warnings and validation totals. The four aapb_* tools were called through the SDK stdio transport from an isolated npm archive installation against two existing structured record sets. All source CURRENT.md text was reconstructed exactly with a deliberately small 700-character budget to exercise continuation. The original projects received read-only calls and migration previews; successful apply/rollback and ownership-conflict refusal were exercised on preserved copies.

Before adding local demonstration notes, the first record set contained 73 records and three modified managed documents; the second contained 74 records and 18 modified managed documents. These are preservation signals, not proof that the document contents are defective. The second layout's manifest lacked a matching ownership entry, so migration correctly refused it. No original metadata was forced into a managed state. Project-local demonstrations retain their raw transcripts and hashes outside the release artifacts.

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

## Human documentation follow-up

The README mastheads, badges, language selection, product map, and guide navigation were restored using the earlier reader structure and current functionality. Beginner, command, lifecycle, record, integration, and maintenance guides now include runnable examples and result interpretation. Korean explanations were reviewed separately from translation-file coverage. The ordinary user path is npm installation and aapb operation; source checkout, PowerShell compatibility, and prerelease testing belong to developer guidance.

This review also found template instructions pointing to removed files, inactive adapter examples invoking deleted hooks, and orphaned metadata for a retired skill. Those references were corrected or made inactive. README images, context, and examples are included in the npm file list. Runtime and installed skill behavior were not redesigned in this documentation follow-up.

A locally installed archive was used for English/Korean practice records, exact continued reads, list/search pages, advisory checks, Forge previews, isolated skill installation/removal/recovery, and four SDK stdio tool calls. Original project instructions and read-only call inputs were preserved. Package checks inspect parsed Markdown links and HTML image/link attributes, not just file presence. Local browser previews checked README branding and readable rendered structure; this is not an independent beginner usability study or a claim of registry publication.
