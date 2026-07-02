# Command Guide

This page is the command reference for AI Agent Playbook. It explains what each command is for, whether it writes files, and the safest way to run it.

If you are trying the tool for the first time, read [First 10 minutes](quick-start.md) before using this full reference.

For installation, update, uninstall, and npm details, see [Install, update, and uninstall](installation.md). For runtime design and JSON contract notes, see [Runtime harness](harness-runtime.md).

## How to run commands

Use one of these forms:

| Form | When to use it |
| ---- | -------------- |
| `npx ai-agent-playbook ...` | Best default for trying the latest published package without adding it to a project. |
| `ai-playbook ...` | Use after `npm install -g ai-agent-playbook` when you want a short global command. |
| `node .\bin\ai-playbook.mjs ...` | Use inside a local source checkout of this repository. |
| `npx ai-agent-playbook mcp` | Register this as a local stdio MCP server command when an AI app should call read-only playbook tools for you. |

In the examples below, replace `npx ai-agent-playbook` with `ai-playbook` or `node .\bin\ai-playbook.mjs` when that matches your setup.

`<target>` or `<target-project>` means the project folder you want to inspect, bootstrap, or clean up. It can be `.` when your terminal is already inside that project.

### How to type examples

- Do not type angle brackets literally. Replace placeholders such as `<target-project>`, `<file>`, `<text>`, and `<run-id>` with real values.
- Prefer `.` for the target when you are already in the project folder.
- Quote paths and text that contain spaces: `".\example app"` or `"auth flow change"`.
- `--path <file>` is usually a path inside the target project, such as `src/example.ts`; it does not need to be an absolute path.
- Keep commands on one line when you are unsure. In PowerShell, use a backtick only when you intentionally split a long command across lines.
- Redirection such as `> preflight.json` is handled by your shell. The CLI prints JSON; the shell writes the file.
- Avoid putting personal folders, customer names, credentials, or internal URLs in shared examples. Use placeholders like `<target-project>` instead.

For example, when your terminal is inside the target project:

```powershell
npx ai-agent-playbook operator check . --json
npx ai-agent-playbook operator search . --query "auth flow" --json
```

When the target path contains spaces, quote it:

```powershell
npx ai-agent-playbook bootstrap ".\example app" --dry-run
```

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
| `--intent <text>` | Planned work description for `operator preflight`. |
| `--max-results N` | Limit search or research output. |
| `--to v2` | Select the destination layout for `migrate layout`. |
| `--max-chars N` | Limit generated context size. |
| `--strict` | Treat doctor warnings as failures. |
| `--reminder` | Return a small doctor reminder signal instead of the full report. |
| `--profile <name>` | Add a stack-specific bootstrap profile after the target stack is known. |
| `--local-only` | Add `.ai-playbook/` to the target project's `.gitignore` during bootstrap. |
| `--title <text>` | Title for a generated plan, worklog, or run. |
| `--month YYYY-MM` | Month for a worklog summary. |
| `--cols N` | Expected terminal width for `qa tui-check`. |
| `--run-id <id>` | Select one run under `.ai-playbook/runs/`. |
| `--type note|criterion|evidence|blocker|cleanup` | Event type for `run record`. |
| `--status pass|fail|blocked|info` | Event status for `run record`. |
| `--evidence <path>` | Portable relative evidence path for `run record`. |
| `--before <preflight-json>` | JSON file previously saved from `operator preflight --json`. |
| `--contract <id>` | Limit `contracts snapshot` to one contract id. |
| `--threshold N` | Allowed image diff ratio from `0` to `1`; `0` means any changed pixel fails. |
| `--deep` | Add AST-grep, exact function-body clone cues, and TypeScript/JavaScript language-analysis signals to `operator analyze`. |

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
| `skills lint` | Review source `SKILL.md` files for trigger-focused descriptions, frontmatter shape, and missing reference links before publishing. | No | `npx ai-agent-playbook skills lint --json` |
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
| `migrate layout <target>` | Preview or apply `.ai-playbook` layout v2 directories and copied v1 compatibility files. | No unless `--apply` | `npx ai-agent-playbook migrate layout <target-project> --to v2 --json` |
| `layout status <target>` | Report whether the target playbook has the v2 layout files and directories. | No | `npx ai-agent-playbook layout status <target-project> --json` |
| `doctor <target>` | Check project playbook health, adaptation status, worklog summary freshness, and local-path risk. | No | `npx ai-agent-playbook doctor <target-project> --json` |
| `context <target>` | Build compact project context from core `.ai-playbook/` files for optional hooks or inspection. | No | `npx ai-agent-playbook context <target-project> --json` |
| `context list <target>` | List `.ai-playbook/context/**/*.md` files and their frontmatter. | No | `npx ai-agent-playbook context list <target-project> --json` |
| `context status <target>` | Show which path-scoped context files apply to one file and whether `maps/doc-map.md` exists. | No | `npx ai-agent-playbook context status <target-project> --path src/example.ts --json` |
| `context init <target>` | Create starter `context/root.md`, `_registry.json`, and `maps/doc-map.md`. | Yes, unless `--dry-run` | `npx ai-agent-playbook context init <target-project> --dry-run --json` |

Use `--local-only` with `bootstrap` when the target project's `.ai-playbook/` should be added to that project's `.gitignore`.

Context files support markdown frontmatter: `id`, `globs`, `alwaysApply`, `freshness`, and `priority`. Use `context status` before loading more project memory for a path. It is read-only and safe to run often.

Use `CURRENT.md` for current baseline facts, active risks, decisions, and project-specific working vocabulary. Put larger structural facts, scan ranges, and clone or duplicate-code cues in maps so they stay reviewable without turning `CURRENT.md` into a long report.

## Harness OS catalogs and runtime

These commands expose the v2 capability model and generated local runtime surface. They are safe to run before editing code.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `catalog list` | List capability categories with skill and workflow counts. | No | `npx ai-agent-playbook catalog list --json` |
| `catalog check` | Validate skill taxonomy, duplicate names, wrapper routes, and wrapper references. | No | `npx ai-agent-playbook catalog check --json` |
| `workflow list` | List built-in workflow recipes. | No | `npx ai-agent-playbook workflow list --json` |
| `reference inventory <reference-dir>` | Summarize a local reference collection before deciding what to adopt. | No | `npx ai-agent-playbook reference inventory _reference --json` |
| `reference ledger-check <target>` | Validate a reference adoption ledger for status values and local-only leaks. | No | `npx ai-agent-playbook reference ledger-check <target-project> --json` |
| `index build <target>` | Preview or write `.ai-playbook/runtime/indexes/file-inventory.json`. | No unless `--apply` | `npx ai-agent-playbook index build <target-project> --json` |
| `index status <target>` | Check whether the runtime file inventory exists. | No | `npx ai-agent-playbook index status <target-project> --json` |
| `index search <target>` | Search local project text without writing the runtime index. | No | `npx ai-agent-playbook index search <target-project> --query "auth flow" --json` |
| `write-gate preview <target>` | Preview write risk for an intent and optional path before editing. | No | `npx ai-agent-playbook write-gate preview <target-project> --intent "change auth flow" --path src/example.ts --json` |

`reference ledger-check` validates `.ai-playbook/knowledge/reference-adoption-ledger.md` by default. It checks adoption statuses, local absolute paths, internal URLs, secret-like tokens, and oversized excerpts without writing files.

`write-gate preview` returns a `transaction.invocationId` and planned `transaction.advisoryPath` under `.ai-playbook/runtime/reports/write-gate/`. The preview stays read-only; the transaction fields are a stable handoff for later post-write or advisory-file work.

Runtime output lives under `.ai-playbook/runtime/`. Do not copy generated output into `.ai-playbook/memory/` until it has been reviewed and promoted intentionally.

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
| `operator preflight <target>` | Capture advisory evidence before editing: intent terms, candidate files, rule/context/contract signals, and a portable file snapshot. | No | `npx ai-agent-playbook operator preflight <target-project> --intent "auth flow change" --path src/example.ts --json > preflight.json` |
| `operator delta <target>` | Compare a saved preflight JSON file with the current target and report added, deleted, modified, out-of-scope, and playbook changes. | No | `npx ai-agent-playbook operator delta <target-project> --before preflight.json --json` |
| `operator research <target>` | Run a deeper local-only investigation with evidence, gaps, next steps, and markdown summary text. | No | `npx ai-agent-playbook operator research <target-project> --query "auth flow risk" --path src/example.ts --json` |
| `operator context <target>` | Preview path-scoped playbook context, rules, maps, runbooks, and decisions for one file. | No | `npx ai-agent-playbook operator context <target-project> --path src/example.ts --json` |
| `operator analyze <target>` | Combine diagnostics, map, rules, context, and optional local setup signals in one report. Add `--deep` when you want AST, clone, and language-analysis signals. | No | `npx ai-agent-playbook operator analyze <target-project> --deep --path src/example.ts --json` |
| `operator map <target>` | Summarize stack, source layout, quality config, test files, and verification command candidates. | No | `npx ai-agent-playbook operator map <target-project> --json` |
| `operator audit <target>` | Check playbook drift such as broken links, stale context globs, duplicates, and manifest drift. | No | `npx ai-agent-playbook operator audit <target-project> --json` |
| `operator gc <target>` | Preview or remove obsolete unmodified managed playbook files. | No unless `--apply` | `npx ai-agent-playbook operator gc <target-project> --json` |

Use `operator search` for quick lookup. Use `operator research` when you want broader evidence before deciding what to inspect or change. Both are local-only.

Use `operator preflight` before a risky edit when you want a reviewable baseline. The command does not write the JSON file itself; redirect it if you want to keep it. After the edit, pass that saved JSON to `operator delta`. Delta reports what changed, not whether the implementation is correct.

Use `operator analyze --deep` when text search is not enough and you want structural and language signals. Deep mode adds local AST-grep search, exact normalized function-body clone cues, and TypeScript/JavaScript diagnostics, symbols, references, and definitions. The JSON output includes `summary.functionCloneGroups` and `deep.functionClones`; clone cues are review starting points only and do not claim semantic equivalence. It still does not write files, run project commands, rename symbols, rewrite AST matches, or call the network.

## Runs and evidence

Runs track in-progress work. They are useful when a task is long enough that the next agent should see evidence, criteria, blockers, and cleanup state before reading a full worklog.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `run start <target>` | Create `.ai-playbook/runs/<run-id>/` with a brief, criteria file, append-only ledger, evidence folder, and summary. | Yes, unless `--dry-run` | `npx ai-agent-playbook run start <target-project> --title "Auth flow" --dry-run --json` |
| `run status <target>` | Read the latest run or one selected run and summarize events, criteria, blockers, evidence, and cleanup. | No | `npx ai-agent-playbook run status <target-project> --run-id auth-flow --json` |
| `run record <target>` | Append a note, criterion, evidence, blocker, or cleanup event to `ledger.jsonl`. | Yes | `npx ai-agent-playbook run record <target-project> --run-id auth-flow --type evidence --status pass --message "Auth flow test passed" --evidence .ai-playbook/runs/auth-flow/evidence/auth.txt --json` |
| `run summarize <target>` | Render the append-only ledger into `summary.md`. | Yes, unless `--dry-run` | `npx ai-agent-playbook run summarize <target-project> --run-id auth-flow --dry-run --json` |

`run record` rejects messages that look like local absolute paths or credential assignments. Evidence paths must be portable relative paths. Runs do not replace worklogs: use runs while executing, then promote durable facts to `CURRENT.md`, maps, runbooks, decisions, contracts, or worklogs.

## Contracts

Contracts capture important business rules and invariants. They are checked explicitly and read-only; there is no LLM judge, pre-commit block, or automatic approval.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `contracts list <target>` | List active and pending contracts under `.ai-playbook/contracts/`. | No | `npx ai-agent-playbook contracts list <target-project> --json` |
| `contracts check <target>` | Show active or pending contracts that apply to a path and warn about stale or incomplete contract notes. | No | `npx ai-agent-playbook contracts check <target-project> --path src/example.ts --json` |
| `contracts snapshot <target>` | Preview or write `.ai-playbook/contracts/.hashes.json` with relative path hashes for contract, appliesTo, and evidence files. | No unless `--apply` | `npx ai-agent-playbook contracts snapshot <target-project> --json` then `npx ai-agent-playbook contracts snapshot <target-project> --apply --json` |
| `contracts init <target>` | Create starter `.ai-playbook/contracts/README.md` plus `active/` and `pending/` folders. | Yes, unless `--dry-run` | `npx ai-agent-playbook contracts init <target-project> --dry-run --json` |

Contract markdown supports frontmatter: `id`, `status`, `appliesTo`, `risk`, `approvedAt`, and `freshness`. `contracts check` warns when an `appliesTo` path is missing, a matching contract is pending, `freshness` is older than 90 days, or the `Required evidence` section is empty. If a contract hash snapshot exists, `contracts check` also warns when tracked contract, appliesTo, or evidence files changed or disappeared.

## Rules, diagnostics, and TUI checks

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `rules check <target>` | See which portable rule files apply to a target path. | No | `npx ai-agent-playbook rules check <target-project> --path src/example.ts --json` |
| `diagnostics check <target>` | List likely local verification commands without running them. | No | `npx ai-agent-playbook diagnostics check <target-project> --json` |
| `qa tui-check <capture-file>` | Check captured terminal output for overflow, CJK width, ANSI, and box alignment issues. | No | `npx ai-agent-playbook qa tui-check .\capture.txt --cols 100 --json` |
| `qa image-diff <reference.png> <actual.png>` | Compare two PNG files and return changed pixels, diff ratio, similarity score, and hotspot grid without creating a diff image. | No | `npx ai-agent-playbook qa image-diff .\before.png .\after.png --threshold 0.01 --json` |

`diagnostics check` reports command candidates only. It does not run lint, tests, builds, or language servers.

`qa image-diff` supports PNG only. It does not capture browsers, store baselines, create visual oracles, or write diff images.

## MCP tools for AI apps

MCP is for AI apps that can call tools directly. It does not replace the CLI. It makes the read-only CLI signals easier for an AI to discover and call during a natural-language task.

Register this local stdio command in your MCP-capable app:

```powershell
npx ai-agent-playbook mcp
```

If you installed globally, this equivalent command is shorter:

```powershell
ai-playbook mcp
```

The server exposes read-only tools for:

- playbook context: `playbook_context`, `context_status`, `context_list`
- catalogs and layout: `capability_catalog`, `skill_catalog`, `workflow_list`, `reference_inventory`, `reference_ledger_check`, `playbook_layout`, `index_status`, `index_search`, `write_gate_preview`
- operator diagnostics: `operator_check`, `operator_search`, `operator_research`, `operator_preflight`, `operator_delta`, `operator_map`, `operator_audit`, `operator_analyze_deep`
- rules and project state: `rules_check`, `contracts_check`, `contracts_list`, `managed_check`, `managed_catalog`, `diagnostics_check`
- QA and deep analysis: `qa_image_diff`, `source_function_clones`, `ast_grep_search`, `lsp_status`, `lsp_diagnostics`, `lsp_symbols`, `lsp_references`, `lsp_definition`

The server also exposes prompts for `repo_onboarding_runbook`, `harness_extension_plan`, and `reference_adoption_review`. Prompts are reusable task briefs; they do not grant write access by themselves.

The MCP layer is read-only in this version. It does not expose bootstrap, install, update, uninstall, prune, snapshot apply, run record, rename, rewrite, or any command that writes files.

## Adapter setup

Adapters are optional. The default harness works without hooks or agent plugins.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `adapter config <target>` | Render copy-paste-safe local hook settings for Codex or Claude Code. | No | `npx ai-agent-playbook adapter config <target-project> --adapter codex --json` |
| `adapter check <target>` | Check whether optional adapter files, context, and local settings are ready. | No | `npx ai-agent-playbook adapter check <target-project> --adapter codex --settings <local-settings-path> --json` |

`adapter config` does not create a settings file. It prints the command and JSON that an operator can review and copy manually.

`adapter config --json` also includes a reviewable MCP server example using `npx ai-agent-playbook mcp`, plus the global-install variant using `ai-playbook mcp`.

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
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json > preflight.json
npx ai-agent-playbook operator research <target-project> --query "project risks" --json
```

For cleanup, use previews first:

```powershell
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
```

Add `--apply` only after the preview shows exactly what you want to remove.
