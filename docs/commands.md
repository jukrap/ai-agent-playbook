# Command guide

The primary command is `ai-agent-playbook`. `aapb` is a shorter alias of the same program: both use the same skills, project records, options, and permissions. Install once with npm; choosing an executable name does not install another skill.

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --help
aapb --help
```

For occasional use, prepend `npx` and select a published version. From source, use `node bin/aapb.mjs` instead of either installed command. Check `--version`: the workspace and authoring examples require the updated CLI. Use a [local archive](demo.md) for an unpublished candidate; `@latest` selects the published package, not this checkout.

## Read the syntax and choose the project

A positional argument supplies a value such as a project path. An option starts with `--`: `--local-only` is an on/off flag; `--path CURRENT.md` is an option followed by a value. Quote values containing spaces. Angle brackets mark a placeholder to replace; square brackets in syntax descriptions mean optional and are not typed.

**Project paths are optional.** Omitting the project uses the current terminal directory, just like writing `.`. Registered members can resolve an ancestor workspace and its common records. Otherwise playbook discovery stays at the selected directory; there is no general upward Git-root search. Change directories first, give a positional path, or use `--project`.

| Complete command | Meaning |
| --- | --- |
| `ai-agent-playbook bootstrap --local-only --dry-run` | Preview a local-only playbook in the current directory |
| `ai-agent-playbook bootstrap . --local-only --dry-run` | The same preview with the current directory written explicitly |
| `ai-agent-playbook bootstrap "<project>" --local-only --dry-run` | Preview the explicitly selected project's local-only playbook |
| `ai-agent-playbook bootstrap --project "<project>" --local-only --dry-run` | Select the same target using an option |

`--project` takes precedence if both forms are supplied; use one form for clarity. Project paths are resolved relative to the terminal directory. Skill commands are different: they manage user skill roots and do not install into the current project merely because you run them there.

## Shared options and results

| Option | Where it applies | Meaning |
| --- | --- | --- |
| `--help` | CLI | Show commands without performing the requested action |
| `--version` | CLI | Show the actual executable's package version |
| `--json` | Commands returning results | Retain structured fields such as warnings, totals, and cursors |
| `--project "<directory>"` | Project commands | Explicitly select a project instead of the current directory |
| `--dry-run` | Bootstrap, record creation, workspace/skill changes, migration, Forge changes | Prevent writes and inspect the proposed operation |
| `--apply` | Workspace changes, migration, rollback, Forge changes | Apply an operation that otherwise previews |
| `--local-only` | Bootstrap | Compatibility alias for `--exclude local`; without Git, records are created and the skipped exclusion is reported |

`--apply` is not required by ordinary bootstrap, worklog/knowledge creation, or skill install/update/uninstall. Those commands write unless `--dry-run` is present. When both `--apply` and `--dry-run` are present, preview wins.

Most commands print JSON. `records read` prints plain text unless `--json` is present; use JSON for scripts that need continuation fields. Exit codes are `0` for success, `1` for a failure/conflict, and `2` for a retired command. Inspect warnings and scope even on success. A partial operation may have completed safe items before reporting conflicts.

## Create project records: bootstrap

Run from the target directory, or supply a project path after `bootstrap`. The interactive guide and argument mode use the same preview and preservation rules.

| Invocation | Defaults and questions |
| --- | --- |
| `ai-agent-playbook bootstrap` in a bare interactive terminal | Opens the setup guide; new setup defaults to `single`, `standard`, `local` with Git or `none` without Git, `en`, and `preserve` |
| `ai-agent-playbook bootstrap --interactive` | Explicitly asks for choices and a final review; requires usable interactive input/output |
| `ai-agent-playbook bootstrap --yes` | Applies the guide's defaults without questions; explicit choices still win |
| Explicit setup choices or non-interactive input | Preserves legacy defaults: `single`, `minimal`, `none`, `en`, `preserve` |
| `--json` | Never asks; `--interactive --json` is rejected, while `--yes --json` uses defaults without questions |

A project path, `--dry-run`, or `--apply` alone is not a setup choice that disables the guide. For a predictable non-interactive preview, supply setup choices or `--json`. Existing saved choices are offered when revisiting the guide. Cancellation, input closure, and previews do not write.

| Option | Values and effect |
| --- | --- |
| `--kind` | `single` or `workspace`; workspace uses an explicit member registry |
| `--exclude` | `local`, `shared`, `global`, or `none`; select where an ignore rule belongs |
| `--records` | `minimal` for CURRENT.md and metadata; `standard` also adds worklog and knowledge guides when absent |
| `--agents` | `preserve` leaves root instructions intact; `link` appends a short records link, creating the root file if needed |
| `--lang` | `en` or `ko` for newly created documents and the guide |
| `--repo-path` | Repeat workspace-relative member directories; IDs are derived from directory names. Not `--repo` |
| `--preserve-agents` | Compatibility alias for `--agents preserve`; conflicts with `--agents link` |
| `--local-only` | Compatibility alias for `--exclude local`; conflicts with a different explicit exclusion mode |

```sh
ai-agent-playbook bootstrap --kind single --records standard --exclude local --agents link --lang en --dry-run --json
ai-agent-playbook bootstrap --kind single --records standard --exclude local --agents link --lang en --json
ai-agent-playbook records read --path CURRENT.md
```

`local` uses Git's local exclude file; `shared` writes a shared `.gitignore` rule; `global` affects repositories using the user's Git exclude file; `none` adds no rule and can remove unchanged AAPB-owned rules for this target. Without Git, local exclusion is skipped with a warning and records remain usable. No Git repository is initialized.

Existing records and user instructions are preserved. Rerunning bootstrap can add missing standard guides or an explicitly selected link and change managed exclusions, but does not regenerate documents or replace membership. Only unchanged AAPB-owned ignore rules are migrated; user rules, tracked files, and Git history remain intact. Keep any returned recovery journal. See [Existing repositories](existing-repository-bootstrap.md), [Lifecycle](lifecycle.md), and [Project architecture](project-architecture.md).

## Manage a workspace

```sh
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --dry-run --json
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --json
ai-agent-playbook workspace list --json
ai-agent-playbook workspace check --json
ai-agent-playbook workspace add --id worker --path services/worker --role background --json
ai-agent-playbook workspace add --id worker --path services/worker --role background --apply --json
ai-agent-playbook workspace remove --id worker --json
ai-agent-playbook workspace remove --id worker --apply --json
```

Create the workspace by repeating the bootstrap preview without `--dry-run`. Member directories must already exist. `list`/`check` read registration and availability; `add`/`remove` preview unless applied and return a registry backup when changed. Removing registration preserves code and records. [Workspace guide](workspaces.md) explains membership, ancestor discovery, existing member records, and code targeting.

## Create durable records

```sh
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang en --date 2026-09-01 --dry-run --json
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang en --date 2026-09-01 --json
ai-agent-playbook worklog list --topic csv-export --month 2026-09 --page-size 5 --json
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang en --dry-run --json
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang en --json
```

Creation writes unless `--dry-run` is present; listing is read-only. `--title` is required for creation. `--topic` labels a worklog and selects the knowledge filename; knowledge defaults its topic to the title. `--lang en|ko` overrides the selected manifest language. `--date YYYY-MM-DD` is for log creation; `--month YYYY-MM` filters listing. `--repo <id>` tags or filters a registered member. `--record-source workspace|repo:<id>` selects common or existing member-local records for these commands.

`worklog list` supports `--page-size`, `--max-chars`, and `--cursor`. Creation returns the actual `path`, template `content`, metadata, and write state. Fill the template with evidence; creation does not infer facts or run commands. Unique worklog names permit concurrent creation; existing knowledge topics are never overwritten. [Durable records](durable-records.md) covers monthly storage, old locations, draft review, and continuation.

## Inspect records: status and validation

| Complete command | Meaning |
| --- | --- |
| `ai-agent-playbook records status --json` | Show layout, entrypoint, record count, and scan summary for the current directory |
| `ai-agent-playbook records status --view records --page-size 10 --json` | List up to 10 complete record entries |
| `ai-agent-playbook records status --view repositories --page-size 10 --json` | Page registered workspace members |
| `ai-agent-playbook records status --view warnings --page-size 10 --json` | Page through inspection warnings |
| `ai-agent-playbook records status --view records --cursor "<cursor>" --json` | Continue the same record listing using `page.nextCursor` |
| `ai-agent-playbook records validate --json` | Check record JSON, links, and managed integrity; return the first issue page |
| `ai-agent-playbook records validate --view summary --json` | Return validation totals without a detailed issue page |
| `ai-agent-playbook records validate --view issues --page-size 5 --json` | Show up to five complete issues |
| `ai-agent-playbook records validate --view warnings --json` | Inspect skipped/unreadable scope and other warnings |
| `ai-agent-playbook records validate --view issues --cursor "<cursor>" --json` | Continue issues while preserving overall failure and totals |

All are read-only. Validation never runs application tests or verifies the truth of historical prose. `runtimeVerified: false` is expected. A `managed-modified` issue can reflect useful customization; inspect it rather than overwrite it for a clean report.

## Read and search records

`--record-source workspace` selects common records by default; `--record-source repo:<id>` selects a registered member's existing local records. The same option applies to status, read, search, and validation. Read/search paths stay inside that selected playbook. `--path CURRENT.md` means its CURRENT.md, not a root README or an arbitrary source file.

| Complete command | Meaning |
| --- | --- |
| `ai-agent-playbook records read` | Print the current playbook's CURRENT.md with the default content budget |
| `ai-agent-playbook records read --path decisions/api.md --json` | Read an existing record and include source/continuation metadata |
| `ai-agent-playbook records read --path CURRENT.md --start-line 10 --end-line 30 --json` | Read the inclusive range from line 10 through 30 |
| `ai-agent-playbook records read --path CURRENT.md --max-chars 2000 --json` | Read at most the requested content amount |
| `ai-agent-playbook records read --path CURRENT.md --cursor "<cursor>" --json` | Continue with the returned `nextCursor`; omit line options |
| `ai-agent-playbook records search --query "API decision" --json` | Literal, case-insensitive search within record text |
| `ai-agent-playbook records search --query "API decision" --max-results 5 --max-chars 3000 --json` | Return up to five complete matches within the content budget |
| `ai-agent-playbook records search --query "API decision" --cursor "<cursor>" --json` | Continue with `page.nextCursor`, repeating the same query |
| `ai-agent-playbook records search --query "API decision" --view warnings --json` | Inspect search warnings for that query |

| Option | Default / limit | Use |
| --- | --- | --- |
| `--path` | Read defaults to CURRENT.md; search is unfiltered | Read one existing playbook-relative file, or narrow search by file/directory prefix |
| `--repo` | Optional search filter | Registered member filter using metadata, `repos/<id>/`, or the selected member-local source; does not change the source |
| `--month` | Optional search filter | `YYYY-MM` worklog month |
| `--kind` | Optional search filter | `current`, `knowledge`, `worklog`, or `other` |
| `--record-source` | `workspace` | Common records or `repo:<id>` for existing member-local records |
| `--query` | Required for search | Literal text; not a regular expression |
| `--start-line`, `--end-line` | Optional; lines start at 1 | Initial inclusive read range |
| `--max-chars` | 12,000 default; 100,000 maximum | Content size in UTF-16 units, not host tokens |
| `--page-size` | 20 default; 100 maximum | Status/validation list items |
| `--max-results` | 20 default; 100 maximum | Search page items |
| `--cursor` | Returned value | Continue without editing the cursor |
| `--view` | Operation-specific | Choose summary, detailed items, or warnings |

Content size applies to read/search and detailed list views. Summary metadata is not a text slice. Repeat source selection and filters when continuing. If a source or scope changes, restart rather than reuse an invalid cursor. See [Response limits](record-responses.md) for reconstruction and the separate 256 KiB complete-MCP-result ceiling.

## Install and manage skills

These commands operate on user skill directories, independently of the current project.

| Complete command | Meaning | Writes? |
| --- | --- | --- |
| `ai-agent-playbook skills list --json` | Show source profiles and skill names | No |
| `ai-agent-playbook skills lint --json` | Check the source skill catalog format | No |
| `ai-agent-playbook skills install --dry-run --json` | Preview default core installation (two skills) | No |
| `ai-agent-playbook skills install --profile development --dry-run --json` | Preview five development skills | No |
| `ai-agent-playbook skills install --profile development --json` | Install the selected development skills | Yes |
| `ai-agent-playbook skills check --profile development --json` | Compare selected installed copies with their source | No |
| `ai-agent-playbook skills update --profile development --dry-run --json` | Preview changes to the selected installed copies | No |
| `ai-agent-playbook skills update --profile development --json` | Apply safe updates and preserve conflicts | Yes |
| `ai-agent-playbook skills uninstall --profile development --dry-run --json` | Preview removal of selected managed copies | No |
| `ai-agent-playbook skills uninstall --profile development --json` | Remove safe selected copies and retain recovery data | Yes |
| `ai-agent-playbook skills install --profile legacy --dry-run --json` | Preview only legacy-contracts | No |
| `ai-agent-playbook skills install --skill project-memory --skill legacy-contracts --dry-run --json` | Preview exactly these two skills, replacing the profile selection | No |

`--profile` accepts `core`, `development`, or `legacy`. Repeated `--skill` or comma-separated names select explicit entries; empty names are rejected. Ordinary updates do not remove unrelated skills or duplicate old installations automatically. Profiles are capability selections, not light/heavy runtime modes.

For custom locations:

```sh
ai-agent-playbook skills install --profile development --agents-root "<skills-directory>" --codex-root "<legacy-directory>" --backup-root "<backup-directory>" --dry-run --json
```

`--agents-root` changes the destination; `--codex-root` identifies the legacy root; `--backup-root` is the backup parent. Backups must be outside both roots and share the filesystem of affected installations. Modified, unmanaged, and linked directories are preserved. Force replacement is unsupported. Reload the host to check discovery separately from disk installation.

## Migrate and recover

| Complete command | Meaning | Writes? |
| --- | --- | --- |
| `ai-agent-playbook skills migrate --profile development --json` | Preview reconciliation of known owned 0.5 copies | No |
| `ai-agent-playbook skills migrate --profile development --apply --json` | Apply independent safe migration operations | Yes |
| `ai-agent-playbook skills rollback --backup "<transaction-directory>" --json` | Preview restoration of one skill transaction | No |
| `ai-agent-playbook skills rollback --backup "<transaction-directory>" --apply --json` | Restore unchanged affected skill entries | Yes |
| `ai-agent-playbook migrate layout --to minimal --json` | Preview metadata migration in the current project | No |
| `ai-agent-playbook migrate layout --to minimal --apply --json` | Apply compatible owned metadata changes and preserve records | Yes |
| `ai-agent-playbook migrate rollback --backup "<returned-relative-backup>" --json` | Preview record-metadata restoration | No |
| `ai-agent-playbook migrate rollback --backup "<returned-relative-backup>" --apply --json` | Restore metadata if hashes still permit it | Yes |
| `ai-agent-playbook migrate bootstrap-rollback --backup "<returned-journal>" --json` | Preview recovery of a bootstrap/exclusion change | No |
| `ai-agent-playbook migrate bootstrap-rollback --backup "<returned-journal>" --apply --json` | Recover unchanged affected files from the returned journal | Yes |

All three record migration/recovery routes accept `--record-source workspace|repo:<id>`. To change only an existing member-local record set, keep that source on preview, apply, and rollback:

```sh
ai-agent-playbook migrate layout --record-source repo:web --to minimal --json
ai-agent-playbook migrate rollback --record-source repo:web --backup "<returned-relative-backup>" --json
ai-agent-playbook migrate bootstrap-rollback --record-source repo:web --backup "<returned-journal>" --json
```

These are separate preview examples: use the backup from the matching operation and add `--apply` only for the reviewed operation. A member-local selection leaves common records outside that operation.

Use the backup actually returned. Skill recovery takes a transaction directory; layout recovery takes a playbook-relative JSON backup path; bootstrap recovery takes its returned journal. A workspace registry backup is not a bootstrap journal. Missing ownership or modified metadata may block migration while reads remain available. Inspect partial results and recover newest transactions first. [Lifecycle](lifecycle.md) explains preflight and preservation.

## Optional writing and UI checks

Here `--path`, `--root`, `--before`, and `--after` are project-relative, unlike record-read paths.

| Complete command | Meaning |
| --- | --- |
| `ai-agent-playbook writing naturalness-check --path README.md --lang ko --engine js --json` | Inspect Korean prose in the current project's README using JavaScript |
| `ai-agent-playbook writing naturalness-report --root docs --lang auto --max-files 10 --engine auto --json` | Inspect up to 10 files under docs, detect language, and request optional Python support |
| `ai-agent-playbook writing fidelity-check --before docs/before.md --after docs/after.md --lang auto --json` | Compare existing before/after files for protected-information changes |
| `ai-agent-playbook runtime python-status --json` | Report Python candidates and which engine can actually run |
| `ai-agent-playbook qa ui-genericity-scan --root src --max-files 20 --json` | Find static UI review candidates in up to 20 source files; do not render the UI |

`--lang` accepts `auto`, `ko`, or `en`. Writing defaults to `--engine js`; `auto` and `python` request Python discovery. If unavailable, retained checks report JavaScript fallback and engine warnings. `--max-files` and `--root` bound the requested scan. Linked input paths and unsuitable text are rejected. Ordinary prose editing does not require these checks; use [Quality review](quality-review.md) to interpret them.

## Structural source search

| Complete command | Meaning | Writes? |
| --- | --- | --- |
| `ai-agent-playbook ast search --lang javascript --pattern 'console.log($$$ARGS)' --path src --json` | Find actual calls in JavaScript source under src | No |
| `ai-agent-playbook ast search --lang tsx --pattern 'useState($VALUE)' --max-results 10 --max-chars 4000 --max-files 200 --json` | Bound the source scan and result page | No |
| `ai-agent-playbook ast search --lang javascript --pattern 'console.log($$$ARGS)' --path src --cursor '<returned-token>' --json` | Continue the same query against unchanged source | No |

Single quotes preserve pattern metavariables in PowerShell and POSIX shells. `--lang` is required and selects matching extensions. `--path` is relative to the selected code repository. At a workspace root, add `--repo <id>`; within a registered member that member is the default. Omission of `--path` searches that selected repository. `--max-files` bounds parsed files, `--max-results` bounds each result page, and `--max-chars` bounds page content. Inspect `scan.complete`, warning totals, snippet truncation and `page.nextCursor`. AST search is already read-only; it rejects `--apply` and `--dry-run`. [AST search](ast-search.md) covers engine installation, exclusions, supported languages and all limits.

## Optional MCP

| Complete command | Meaning |
| --- | --- |
| `ai-agent-playbook mcp --with-ast` | Add the read-only `aapb_ast_search` tool once at startup |
| `ai-agent-playbook mcp` | Start a stdio server bound to the current directory |
| `ai-agent-playbook mcp --project "<project>"` | Start the server for an explicitly selected project |

The host starts this process to call `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`. A quiet standalone terminal is waiting for the client. Installation does not register or activate MCP, and the server has no write tools. See [MCP setup](mcp-permission-model.md) and [Using skills and tools with an agent](agent-usage.md).

## Forge coordination

| Complete command | Meaning | Remote writes? |
| --- | --- | --- |
| `ai-agent-playbook forge status --json` | Inspect local remote/policy configuration; does not prove authentication | No |
| `ai-agent-playbook forge status --remote origin --provider github --json` | Select a named Git remote and provider | No |
| `ai-agent-playbook forge bootstrap --milestone "Example delivery" --json` | Preview labels and a milestone | No |
| `ai-agent-playbook forge bootstrap --project-title "Example delivery" --project-mode milestone --json` | Preview the selected presentation mode | No |
| `ai-agent-playbook forge bootstrap --milestone "Example delivery" --apply --json` | Apply reviewed initial coordination assets | Yes |
| `ai-agent-playbook forge sync --plan docs/coordination.json --json` | Preview an existing reviewed project-relative plan | No |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --json` | Apply permitted operations from that plan | Yes |
| `ai-agent-playbook forge reconcile --plan docs/coordination.json --json` | Preview presentation reconciliation | No |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --offline --json` | Refuse remote writing because offline takes precedence | No |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --no-remote --json` | Refuse remote writing because remote access is disabled | No |
| `ai-agent-playbook forge sync --plan docs/coordination.json --apply --remote-read-only --json` | Refuse writes even though the plan requested apply | No |
| `ai-agent-playbook forge sync --plan docs/coordination.json --profile observe --apply --json` | Refuse writes under the observe policy | No |

At a workspace root, add `--repo <id>` to every Forge command. Within a registered member, that member is the default. Remote discovery and `--plan` paths belong to the selected repository; shared records do not authorize bulk remote writes.

Forge `--profile` is separate from skill profiles: `coordinate` is the CLI default, `off`/`observe` deny writes, and retained `deliver`/`release` policies allow additional resources without starting execution or publishing. `--provider` accepts `auto`, `github`, or `gitea`; `--remote` defaults to `origin`. `--project-mode` selects `milestone` or the provider's `preferred` presentation. Review supported capabilities and the input plan alongside result IDs/states. [Forge coordination](forge-automation.md) explains credentials, stale state, and partial failure.

## Previous-version users

Version 0.5.11 keeps the older catalog and runtime. Use it explicitly when you depend on those features:

```sh
npx ai-agent-playbook@0.5.11 --help
```

Its global executable is `aapb`; the full installed executable name is added in 1.0. Current narrow aliases include `context` for record reads, `doctor` / `operator check` for record validation, and `catalog list/check` for source skill inspection. The new `worklog new/list` commands create and inspect durable records; other old worklog/runtime forms remain retired. Execution, scheduling, broad analysis, and managed-write commands are retired in 1.0 and return code 2 without automatically launching 0.5.11. See [1.0 changes and previous-version use](redesign.md).
