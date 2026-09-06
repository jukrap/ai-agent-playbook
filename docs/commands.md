# Command guide

The primary command is `ai-agent-playbook`. `aapb` is a shorter alias of the same program: both use the same skills, project records, options, and permissions. Install once with npm; choosing an executable name does not install another skill.

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --help
aapb --help
```

For occasional use, prepend `npx` to the full name. From source, use `node bin/aapb.mjs` instead of either installed command.

## Read the syntax and choose the project

A positional argument supplies a value such as a project path. An option starts with `--`: `--local-only` is an on/off flag; `--path CURRENT.md` is an option followed by a value. Quote values containing spaces. Angle brackets mark a placeholder to replace; square brackets in syntax descriptions mean optional and are not typed.

**Project paths are optional.** Omitting the project uses the current terminal directory, just like writing `.`. It does not automatically search upward for the Git root. Change directories first, give a positional path, or use `--project`.

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
| `--dry-run` | Bootstrap, skill changes, migration, Forge changes | Prevent writes and inspect the proposed operation |
| `--apply` | Migration, rollback, Forge changes | Apply an operation that otherwise previews |
| `--local-only` | Bootstrap | Add a new playbook to Git's local exclude file; requires Git |

`--apply` is not required by ordinary bootstrap or skill install/update/uninstall. Those commands write unless `--dry-run` is present. When both `--apply` and `--dry-run` are present, preview wins.

Most commands print JSON. `records read` prints plain text unless `--json` is present; use JSON for scripts that need continuation fields. Exit codes are `0` for success, `1` for a failure/conflict, and `2` for a retired command. Inspect warnings and scope even on success. A partial operation may have completed safe items before reporting conflicts.

## Create project records: bootstrap

Run these from the target directory, or add a project path after `bootstrap`.

| Complete command | What it does | Writes? |
| --- | --- | --- |
| `ai-agent-playbook bootstrap --dry-run` | Show the three files proposed for a new playbook | No |
| `ai-agent-playbook bootstrap` | Create CURRENT.md, manifest.json, and the ownership marker if records are absent | Yes, when absent |
| `ai-agent-playbook bootstrap --local-only --dry-run` | Preview the files and Git-local exclusion | No |
| `ai-agent-playbook bootstrap --local-only` | Create new records and add the directory to Git's local exclude file | Yes, when absent |
| `ai-agent-playbook bootstrap --local-only --json` | Apply the same operation and retain structured output | Yes, when absent |
| `ai-agent-playbook bootstrap --preserve-agents --dry-run` | Compatibility form; root instructions are always preserved in 1.0 | No |

A useful sequence is:

```sh
cd "<project>"
ai-agent-playbook bootstrap --local-only --dry-run
ai-agent-playbook bootstrap --local-only
ai-agent-playbook records read --path CURRENT.md
```

Omit `--local-only` outside Git or when records should be available for commits. AAPB does not commit them. Existing AGENTS.md and playbooks are preserved. Repeating bootstrap does not change the tracking policy of existing records. See [Existing repositories](existing-repository-bootstrap.md).

Bootstrap does not select an architecture or generate source folders. Project root instructions and architecture decisions are adapted separately; see [Project architecture](project-architecture.md).

## Inspect records: status and validation

| Complete command | Meaning |
| --- | --- |
| `ai-agent-playbook records status --json` | Show layout, entrypoint, record count, and scan summary for the current directory |
| `ai-agent-playbook records status --view records --page-size 10 --json` | List up to 10 complete record entries |
| `ai-agent-playbook records status --view warnings --page-size 10 --json` | Page through inspection warnings |
| `ai-agent-playbook records status --view records --cursor "<cursor>" --json` | Continue the same record listing using `page.nextCursor` |
| `ai-agent-playbook records validate --json` | Check record JSON, links, and managed integrity; return the first issue page |
| `ai-agent-playbook records validate --view summary --json` | Return validation totals without a detailed issue page |
| `ai-agent-playbook records validate --view issues --page-size 5 --json` | Show up to five complete issues |
| `ai-agent-playbook records validate --view warnings --json` | Inspect skipped/unreadable scope and other warnings |
| `ai-agent-playbook records validate --view issues --cursor "<cursor>" --json` | Continue issues while preserving overall failure and totals |

All are read-only. Validation never runs application tests or verifies the truth of historical prose. `runtimeVerified: false` is expected. A `managed-modified` issue can reflect useful customization; inspect it rather than overwrite it for a clean report.

## Read and search records

Read/search paths stay inside the selected playbook. `--path CURRENT.md` means its CURRENT.md, not a root README or an arbitrary source file.

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
| `--path` | Read defaults to CURRENT.md | Existing playbook-relative text file |
| `--query` | Required for search | Literal text; not a regular expression |
| `--start-line`, `--end-line` | Optional; lines start at 1 | Initial inclusive read range |
| `--max-chars` | 12,000 default; 100,000 maximum | Content size in UTF-16 units, not host tokens |
| `--page-size` | 20 default; 100 maximum | Status/validation list items |
| `--max-results` | 20 default; 100 maximum | Search page items |
| `--cursor` | Returned value | Continue without editing the cursor |
| `--view` | Operation-specific | Choose summary, detailed items, or warnings |

Content size applies to read/search and detailed list views. Summary metadata is not a text slice. If a source changes, restart rather than reuse an invalid cursor. See [Response limits](record-responses.md) for reconstruction and the separate 256 KiB complete-MCP-result ceiling.

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

Use the backup actually returned. Skill recovery takes a transaction directory; record recovery takes a playbook-relative JSON backup path. Missing ownership or modified metadata may block migration while reads remain available. Inspect partial results and recover newest transactions first. [Lifecycle](lifecycle.md) explains preflight and preservation.

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

Single quotes preserve pattern metavariables in PowerShell and POSIX shells. `--lang` is required and selects matching extensions. `--path` is relative to the project; omission searches the current project. `--max-files` bounds parsed files, `--max-results` bounds each result page, and `--max-chars` bounds page content. Inspect `scan.complete`, warning totals, snippet truncation and `page.nextCursor`. AST search is already read-only; it rejects `--apply` and `--dry-run`. [AST search](ast-search.md) covers engine installation, exclusions, supported languages and all limits.

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

Forge `--profile` is separate from skill profiles: `coordinate` is the CLI default, `off`/`observe` deny writes, and retained `deliver`/`release` policies allow additional resources without starting execution or publishing. `--provider` accepts `auto`, `github`, or `gitea`; `--remote` defaults to `origin`. `--project-mode` selects `milestone` or the provider's `preferred` presentation. Review supported capabilities and the input plan alongside result IDs/states. [Forge coordination](forge-automation.md) explains credentials, stale state, and partial failure.

## Previous-version users

Version 0.5.11 keeps the older catalog and runtime. Use it explicitly when you depend on those features:

```sh
npx ai-agent-playbook@0.5.11 --help
```

Its global executable is `aapb`; the full installed executable name is added in 1.0. Current narrow aliases include `context` for record reads, `doctor` / `operator check` for record validation, and `catalog list/check` for source skill inspection. Execution, scheduling, broad analysis, and managed-write commands are retired in 1.0 and return code 2 without automatically launching 0.5.11. See [1.0 changes and previous-version use](redesign.md).
