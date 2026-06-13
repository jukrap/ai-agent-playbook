# Command Guide

This page is the command reference for AI Agent Playbook. It explains what each command is for, whether it writes files, and the safest way to run it.

For installation, update, uninstall, and npm details, see [Install, update, and uninstall](installation.md). For runtime design and JSON contract notes, see [Runtime harness](harness-runtime.md).

## How to run commands

Use one of these forms:

| Form | When to use it |
| ---- | -------------- |
| `npx ai-agent-playbook ...` | Best default for trying the latest published package without adding it to a project. |
| `ai-playbook ...` | Use after `npm install -g ai-agent-playbook` when you want a short global command. |
| `node .\bin\ai-playbook.mjs ...` | Use inside a local source checkout of this repository. |

In the examples below, replace `npx ai-agent-playbook` with `ai-playbook` or `node .\bin\ai-playbook.mjs` when that matches your setup.

`<target>` or `<target-project>` means the project folder you want to inspect, bootstrap, or clean up. It can be `.` when your terminal is already inside that project.

## Common options

| Option | Meaning |
| ------ | ------- |
| `--dry-run` | Preview a write operation without changing files. Use this before install, update, bootstrap, or guide sync. |
| `--check` | Check status without writing files. Used by guide sync. |
| `--json` | Print machine-readable output. Useful for agents, scripts, and detailed inspection. |
| `--apply` | Actually perform a preview-first managed operation such as path migration or uninstall. |
| `--force` | Allow an overwrite where the command normally refuses. Review output before using it. |
| `--force-managed` | Overwrite or remove a managed skill even when its local hash changed. |
| `--force-unmanaged` | Take over a same-name unmanaged skill. Use only when you know it belongs to this playbook. |

Command-specific options appear where they are needed:

| Option | Used for |
| ------ | -------- |
| `--path <file>` | Limit rule, context, search, research, or operator checks to one file or area. |
| `--query <text>` | Search or research topic. |
| `--max-results N` | Limit search or research output. |
| `--max-chars N` | Limit generated context size. |
| `--strict` | Treat doctor warnings as failures. |
| `--reminder` | Return a small doctor reminder signal instead of the full report. |
| `--profile <name>` | Add a stack-specific bootstrap profile after the target stack is known. |
| `--local-only` | Add `.ai-playbook/` to the target project's `.gitignore` during bootstrap. |
| `--title <text>` | Title for a generated plan or worklog. |
| `--month YYYY-MM` | Month for a worklog summary. |
| `--cols N` | Expected terminal width for `qa tui-check`. |

## First-time setup

Use this when you want the reusable skills and a target project playbook.

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook operator check <target-project> --json
```

`skills install` changes user-level skill folders. `bootstrap` changes the target project. Keep them separate.

## Skills

Skills are reusable user-level guidance. They are installed under common Codex and agent skill roots, not inside each target repository.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `skills check` | See whether this playbook's skills are installed, missing, modified, or blocked by same-name unmanaged copies. | No | `npx ai-agent-playbook skills check --json` |
| `skills install` | Install reusable skills for the first time. | Yes, unless `--dry-run` | `npx ai-agent-playbook skills install --dry-run` then `npx ai-agent-playbook skills install` |
| `skills update` | Refresh installed managed skills after the package or checkout changes. | Yes, unless `--dry-run` | `npx ai-agent-playbook skills update --dry-run` then `npx ai-agent-playbook skills update` |
| `skills uninstall` | Remove unmodified managed skills installed by this playbook. | Yes, unless `--dry-run` | `npx ai-agent-playbook skills uninstall --dry-run` then `npx ai-agent-playbook skills uninstall` |

The skills commands use `.ai-agent-playbook-install.json` markers and content hashes. They do not remove other people's skills by default.

## Project playbook

Project playbook commands manage `.ai-playbook/` in one target repository.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `bootstrap <target>` | Create the root `AGENTS.md` and `.ai-playbook/` layout in a target project. | Yes, unless `--dry-run` | `npx ai-agent-playbook bootstrap <target-project> --dry-run` |
| `guides sync <target>` | Copy missing guide templates into an existing `.ai-playbook/guides/`. | Yes, unless `--dry-run` or `--check` | `npx ai-agent-playbook guides sync <target-project> --check --diff --json` |
| `migrate path <target>` | Preview or apply the legacy `ai-playbook/` to `.ai-playbook/` folder migration. | No unless `--apply` | `npx ai-agent-playbook migrate path <target-project> --json` |
| `doctor <target>` | Check project playbook health, adaptation status, worklog summary freshness, and local-path risk. | No | `npx ai-agent-playbook doctor <target-project> --json` |
| `context <target>` | Build compact project context from core `.ai-playbook/` files for optional hooks or inspection. | No | `npx ai-agent-playbook context <target-project> --json` |

Use `--local-only` with `bootstrap` when the target project's `.ai-playbook/` should be added to that project's `.gitignore`.

## Managed files

Managed commands inspect or maintain `.ai-playbook/.ai-agent-playbook-install.json`. They protect edited project memory by comparing hashes before removing or adopting files.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `managed check <target>` | Verify the managed marker and report missing or modified managed files. | No | `npx ai-agent-playbook managed check <target-project> --json` |
| `managed catalog <target>` | See managed files grouped by kind and status before cleanup. | No | `npx ai-agent-playbook managed catalog <target-project> --json` |
| `managed adopt <target>` | Add a marker to older matching playbook files. | No unless `--apply` | `npx ai-agent-playbook managed adopt <target-project> --json` |
| `managed prune <target>` | Remove one selected unmodified managed file. | No unless `--apply` | `npx ai-agent-playbook managed prune <target-project> --path .ai-playbook/guides/runtime-harness.md --json` |
| `managed uninstall <target>` | Remove all unmodified managed playbook files. | No unless `--apply` | `npx ai-agent-playbook managed uninstall <target-project> --json` |

Preview cleanup first:

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

`managed uninstall --apply` preserves locally edited files and does not edit `.gitignore`.

## Operator checks, search, and research

Operator commands are explicit human-triggered signals. They do not install hooks, run project commands, call the network, or write files unless the command says otherwise.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `operator check <target>` | Run the main human checkpoint: doctor, guide freshness, diagnostics, and matching rules. | No | `npx ai-agent-playbook operator check <target-project> --path src/example.ts --json` |
| `operator search <target>` | Search local source, playbook files, rules, plans, and worklogs for a query. | No | `npx ai-agent-playbook operator search <target-project> --query "auth flow" --json` |
| `operator research <target>` | Run a deeper local-only investigation with evidence, gaps, next steps, and markdown summary text. | No | `npx ai-agent-playbook operator research <target-project> --query "auth flow risk" --path src/example.ts --json` |
| `operator context <target>` | Preview path-scoped playbook context, rules, maps, runbooks, and decisions for one file. | No | `npx ai-agent-playbook operator context <target-project> --path src/example.ts --json` |
| `operator analyze <target>` | Combine diagnostics, map, rules, context, and optional local setup signals in one report. | No | `npx ai-agent-playbook operator analyze <target-project> --path src/example.ts --json` |
| `operator map <target>` | Summarize stack, source layout, quality config, test files, and verification command candidates. | No | `npx ai-agent-playbook operator map <target-project> --json` |
| `operator audit <target>` | Check playbook drift such as broken links, stale context globs, duplicates, and manifest drift. | No | `npx ai-agent-playbook operator audit <target-project> --json` |
| `operator gc <target>` | Preview or remove obsolete unmodified managed playbook files. | No unless `--apply` | `npx ai-agent-playbook operator gc <target-project> --json` |

Use `operator search` for quick lookup. Use `operator research` when you want broader evidence before deciding what to inspect or change. Both are local-only.

## Rules, diagnostics, and TUI checks

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `rules check <target>` | See which portable rule files apply to a target path. | No | `npx ai-agent-playbook rules check <target-project> --path src/example.ts --json` |
| `diagnostics check <target>` | List likely local verification commands without running them. | No | `npx ai-agent-playbook diagnostics check <target-project> --json` |
| `qa tui-check <capture-file>` | Check captured terminal output for overflow, CJK width, ANSI, and box alignment issues. | No | `npx ai-agent-playbook qa tui-check .\capture.txt --cols 100 --json` |

`diagnostics check` reports command candidates only. It does not run lint, tests, builds, or language servers.

## Adapter setup

Adapters are optional. The default harness works without hooks or agent plugins.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `adapter config <target>` | Render copy-paste-safe local hook settings for Codex or Claude Code. | No | `npx ai-agent-playbook adapter config <target-project> --adapter codex --json` |
| `adapter check <target>` | Check whether optional adapter files, context, and local settings are ready. | No | `npx ai-agent-playbook adapter check <target-project> --adapter codex --settings <local-settings-path> --json` |

`adapter config` does not create a settings file. It prints the command and JSON that an operator can review and copy manually.

## Plans and worklogs

Use these commands when you want predictable project-memory paths instead of ad hoc markdown files.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `plan new <target>` | Create a dated plan under `.ai-playbook/plans/`. | Yes, unless `--dry-run` | `npx ai-agent-playbook plan new <target-project> --title "Feature slice" --dry-run` |
| `worklog new <target>` | Create a dated worklog under `.ai-playbook/worklogs/YYYY-MM/`. | Yes, unless `--dry-run` | `npx ai-agent-playbook worklog new <target-project> --title "Feature slice" --dry-run` |
| `worklog summarize <target>` | Create or refresh a monthly worklog summary. | Yes, unless `--dry-run` | `npx ai-agent-playbook worklog summarize <target-project> --month 2026-06 --dry-run` |

Existing plan and worklog files are not overwritten unless `--force` is provided.

## Safe default workflow

For a new or existing target repository, this is the safest command order:

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project> --local-only
npx ai-agent-playbook operator check <target-project> --json
npx ai-agent-playbook operator research <target-project> --query "project risks" --json
```

For cleanup, use previews first:

```powershell
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
```

Add `--apply` only after the preview shows exactly what you want to remove.
