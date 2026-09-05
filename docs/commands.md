# Command guide

Use this page to look up a command, its write behavior, and how to interpret the result. For a guided first run, start with [First 10 minutes](quick-start.md).

## Running the examples

`aapb` means the installed executable. In a source checkout, replace it with `node bin/aapb.mjs` and stay in that checkout. Replace `<project>` and other placeholders; quote paths or text containing spaces. Use `.` for the project only when the terminal is inside that project.

```sh
aapb --version
aapb --help
aapb records status "<project>" --json
```

`--json` retains warnings, totals, and continuation fields. Without it, `records read` prints text; most other commands still print structured results.

## Which commands write?

| Commands | Default behavior | Preview / application |
| --- | --- | --- |
| `records status/read/search/validate`, `skills list/lint/check` | Read-only | No apply step |
| `bootstrap` | Creates records if none exist | Add `--dry-run` to preview |
| `skills install/update/uninstall` | Changes the selected installation | Add `--dry-run` to preview |
| `skills migrate/rollback`, `migrate layout/rollback` | Preview | Add `--apply`; `--dry-run` always prevents writes |
| `writing ...`, `qa ui-genericity-scan`, `runtime python-status` | Advisory inspection | Python discovery runs only when selected or requested |
| `forge status` | Local configuration inspection | No network write |
| `forge bootstrap/sync/reconcile` | Preview | `--apply` allows the reviewed remote operation |
| `mcp` | Starts a stdio server | Does not register itself or write project records |

`--apply` is not a universal requirement: an ordinary skill install or bootstrap writes without it. Preview those commands with `--dry-run` first.

## Project records

```sh
aapb bootstrap "<project>" --local-only --dry-run
aapb bootstrap "<project>" --local-only
aapb records status "<project>" --json
aapb records status "<project>" --view records --page-size 10 --json
aapb records read "<project>" --path CURRENT.md --json
aapb records read "<project>" --path CURRENT.md --start-line 1 --end-line 20 --json
aapb records search "<project>" --query "API decision" --max-results 5 --json
aapb records validate "<project>" --json
```

Bootstrap creates `CURRENT.md` and two metadata files only when no playbook exists. It preserves `AGENTS.md`. `--local-only` requires Git and adds the new record directory to Git's local exclude file; omit it for shared records or non-Git folders.

`--path` is relative to the selected playbook, not the repository root. Search is literal text search, not a regular expression. Validation checks JSON, record links, and managed-file integrity; it does not run project tests.

| Operation | Views and size options | Continuation |
| --- | --- | --- |
| Status | Default `summary`; `records` or `warnings`; `--page-size` | Repeat the view with `--cursor` |
| Read | `--start-line`, `--end-line`, `--max-chars` | Repeat path and cursor, omit line options |
| Search | Default `results`; `warnings`; `--max-results`, `--max-chars` | Repeat query and view with cursor |
| Validate | Default `issues`; `summary` or `warnings`; `--page-size` | Repeat view with cursor |

List pages default to 20 items and allow up to 100. The content budget defaults to 12,000 characters and allows up to 100,000. All four record commands accept `--max-chars`. These are not host token settings. See [Response limits](record-responses.md) for complete examples and the separate MCP result ceiling.

## Skills

```sh
aapb skills list --json
aapb skills lint --json
aapb skills install --profile development --dry-run --json
aapb skills install --profile development --json
aapb skills check --profile development --json
aapb skills update --profile development --dry-run --json
aapb skills uninstall --profile development --dry-run --json
```

The default is `core` with two skills. `development` contains five; `legacy` contains only `legacy-contracts`. Use the same selection when checking, updating, or removing an installation. `list` shows the source catalog; `check` compares selected installed copies. Neither proves host loading.

For individual selection, repeat `--skill`:

```sh
aapb skills install --skill project-memory --skill legacy-contracts --dry-run --json
```

Explicit skills replace the profile selection. Empty names are rejected. `--agents-root` overrides the destination, `--codex-root` identifies a legacy root, and `--backup-root` chooses the backup parent. Backups must be outside both skill roots and on the same filesystem as the affected installations. Force-replacement flags are rejected. [Lifecycle](lifecycle.md) explains conflicts and recovery.

## Migration and rollback

Skill migration reconciles known, owned 0.5 copies; it does not infer ownership from directory names. Layout migration changes managed metadata while preserving records.

```sh
aapb skills migrate --profile development --json
aapb skills migrate --profile development --apply --json
aapb skills rollback --backup "<transaction-directory>" --json
aapb skills rollback --backup "<transaction-directory>" --apply --json
aapb migrate layout "<project>" --to minimal --json
aapb migrate layout "<project>" --to minimal --apply --json
aapb migrate rollback "<project>" --backup "<returned-relative-backup>" --json
aapb migrate rollback "<project>" --backup "<returned-relative-backup>" --apply --json
```

Use backup values returned by the actual operation, not a guessed path. Skill rollback expects a transaction directory; record rollback expects a playbook-relative archive path. Modified or unowned metadata may prevent migration while reading remains available. Repeated rollback does not overwrite later edits.

## Optional writing and UI checks

```sh
aapb writing naturalness-check "<project>" --path README.md --lang en --engine js --json
aapb writing naturalness-report "<project>" --root docs --lang ko --max-files 10 --engine auto --json
aapb writing fidelity-check "<project>" --before docs/before.md --after docs/after.md --lang auto --json
aapb runtime python-status --json
aapb qa ui-genericity-scan "<project>" --root src --max-files 20 --json
```

These file paths are project-relative. A report's `--root` limits inspection to that directory. Inputs must be bounded UTF-8 text; links and junctions in input paths are refused. The default writing engine is `js`; `auto` or `python` explicitly requests optional Python discovery. See [Runtime engines](runtime-engines.md) for fallback details.

Naturalness signals suggest passages to review; fidelity checks help find changes to protected information. The UI scanner finds static candidates and does not render the screen. None of these checks proves authorship or supplies an automatic quality verdict. See [Quality review](quality-review.md).

## MCP and Forge

```sh
aapb mcp --project "<project>"
aapb forge status "<project>" --json
aapb forge bootstrap "<project>" --milestone "Example delivery" --json
aapb forge sync "<project>" --plan docs/coordination.json --json
```

MCP exposes `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`. It waits for a stdio client; a quiet terminal is not a completed check. Connect through the host as described in [MCP setup](mcp-permission-model.md).

Forge `sync` and `reconcile` require an existing reviewed JSON plan inside the project. `--remote` selects a Git remote (default `origin`); `--provider` accepts `auto`, `github`, or `gitea`. `--profile` here is a Forge policy, not a skill selection. The CLI defaults to `coordinate`. `--offline`, `--no-remote`, and `--remote-read-only` prevent writes even with `--apply`. See [Forge coordination](forge-automation.md) for plan examples and apply behavior.

## Older commands and exit codes

| Previous entrypoint | Current route |
| --- | --- |
| `context`, `context list/status` | Narrow read/status aliases; prefer `records read/status` |
| `doctor`, `operator check/audit`, `managed check`, `contracts check` | Record validation only; prefer `records validate` |
| `operator search`, `managed catalog`, `layout status` | Record search/status aliases |
| `catalog list/check` | Source skill catalog/lint aliases |
| `run`, `plan`, `worklog`, `automation`, `index`, broad analysis and managed writes | Retired; use host/project tools and edit records directly |

Retired commands return exit code `2` and a pinned `npx ai-agent-playbook@0.5.11` recovery hint. They do not run the old runtime automatically. Use an old package only for an intentional recovery with preserved data; see [Lifecycle](lifecycle.md).

Exit code `0` means the command succeeded, `1` means failure or reported conflict, and `2` means a retired command. An operation reporting conflicts may have completed independent safe items; inspect its operations and backup before retrying. Document validation success is not runtime verification.
