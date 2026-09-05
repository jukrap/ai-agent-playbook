# Commands

Use the installed `aapb` executable, or `node bin/aapb.mjs` in a checkout. Placeholders such as <project> must be replaced. `--json` returns structured output.

## Records

| Command | Behavior |
| --- | --- |
| bootstrap <project> [--local-only] [--dry-run] | Create CURRENT.md and managed metadata only when no playbook exists; preserve AGENTS.md |
| records status <project> | List records, layout and entrypoint |
| records read <project> [--path CURRENT.md] | Read a text record inside the selected playbook |
| records search <project> --query <literal> | Search bounded record text |
| records validate <project> | Check JSON, links and managed integrity; do not execute runtime checks |
| migrate layout <project> --to minimal [--apply] | Preview or apply compatible managed metadata changes; preserve old records |

Read accepts --start-line and --max-chars. Search accepts --max-results and --max-chars. Output truncation and skipped scan scope are reported. doctor, context, operator search/check, managed check/catalog and layout status retain narrow record-oriented aliases.

## Skills

`skills list` shows profiles and names. `skills install`, `update`, `check`, and `uninstall` select `--profile core|development|legacy` or repeated `--skill <name>`. Default: core, installed only into .agents/skills. Uninstall affects the selected skills only.

`skills migrate --profile development` is a preview unless `--apply` is present. It reconciles known owned 0.5 installations from both old roots. `--dry-run` always prevents writes. Conflicts are preserved and reported even when independent safe operations succeed.

`skills rollback --backup <transaction-directory>` previews restoration. Add `--apply` to restore unchanged affected entries. Later edits are preserved. Destination overrides: --agents-root, --codex-root, --backup-root. Force replacement flags are rejected.

## Optional MCP

`aapb mcp --project <project>` binds one existing project. The only tools are `playbook_status`, `playbook_search`, `playbook_read`, and `playbook_validate`. There are no write tools, arbitrary shell commands, or automatic registration.

## Advisory checks

- writing naturalness-check <project> --path <file> [--lang auto|ko|en] [--engine js|auto|python]
- writing naturalness-report <project> [--root <directory>] [--max-files N]
- writing fidelity-check <project> --before <file> --after <file> [--lang auto|ko|en]
- runtime python-status
- qa ui-genericity-scan <project> [--root <directory>] [--max-files N]

Writing checks default to the JS engine in the CLI. Explicit auto/python selection may invoke the optional Python engine. Signals are advisory and are never authorship or automatic design judgments.

## Forge and retired commands

`forge status <project>` inspects configured coordination without network writes. `forge bootstrap` previews labels/milestone/project setup. `forge sync|reconcile <project> --plan <relative-json>` consumes reviewed coordination data; `--apply` is required for remote writes. --offline, --no-remote and --remote-read-only deny remote writes. Plan paths must remain inside the selected project.

Execution, supervisors, schedule registration, automatic Git delivery, broad analysis, and automatic record promotion were retired. They return exit code 2 and a pinned 0.5.11 recovery hint without executing another runtime. Failures/conflicts return 1; successful commands return 0.
