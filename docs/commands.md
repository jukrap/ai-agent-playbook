# Command Guide

This page is the command reference for AI Agent Playbook. It explains what each command is for, whether it writes files, and the safest way to run it.

If you are trying the tool for the first time, read [First 10 minutes](quick-start.md) before using this full reference.

For lifecycle details covering install, update, uninstall, and npm usage, see [Lifecycle guide](lifecycle.md). For runtime design and JSON contract notes, see [Runtime harness](harness-runtime.md).

## How to run commands

Use one of these forms:

| Form | When to use it |
| ---- | -------------- |
| `npx ai-agent-playbook ...` | Best default for trying the latest published package without adding it to a project. |
| `aapb ...` | Use after `npm install -g ai-agent-playbook` when you want a short global command. |
| `node .\bin\aapb.mjs ...` | Use inside a local source checkout of this repository. |
| `npx ai-agent-playbook mcp` | Register this as a local stdio MCP server command when an AI app should call default read-only playbook tools. `--enable-write-tools` and `--enable-forge-write-tools` are independent explicit opt-ins. |

In the examples below, replace `npx ai-agent-playbook` with `aapb` or `node .\bin\aapb.mjs` when that matches your setup.

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
| `--apply` | Actually perform a preview-first managed operation such as path migration, remote forge bootstrap/sync, or scheduler installation. |
| `--force` | Allow an overwrite where the command normally refuses. Review output before using it. |
| `--force-managed` | Overwrite or remove a managed skill even when its local hash changed. |
| `--force-unmanaged` | Take over a same-name unmanaged skill. Use only when you know it belongs to this playbook. |

Command-specific options appear where they are needed:

| Option | Used for |
| ------ | -------- |
| `--path <file>` | Limit rule, context, search, research, ledger, or operator checks to one file or area. |
| `--query <text>` | Search or research topic. |
| `--intent <text>` | Planned work description for `operator preflight`. |
| `--max-results N` | Limit search or research output. |
| `--to structured` | Select the destination layout for `migrate layout`. |
| `--max-chars N` | Limit generated context size. |
| `--strict` | Treat doctor warnings as failures. |
| `--reminder` | Return a small doctor reminder signal instead of the full report. |
| `--profile <name>` | Add a stack-specific bootstrap profile, or request an automation profile that is no broader than configured authority. |
| `--local-only` | Add `.ai-agent-playbook/` to the target project's `.gitignore` during bootstrap. |
| `--title <text>` | Title for a generated plan, worklog, or run. |
| `--month YYYY-MM` | Month for a worklog summary. |
| `--cols N` | Expected terminal width for `qa tui-check`. |
| `--run-id <id>` | Select one run under `.ai-agent-playbook/workflows/runs/`. |
| `--recipe <id>` | Select a workflow recipe for `workflow run-preview`. |
| `--user-config <path>` | Add an explicit user-level config file for `config preview`; target-local config still wins. |
| `--type note|criterion|evidence|blocker|cleanup` | Event type for `run record`. |
| `--status pass|fail|blocked|info` | Event status for `run record`. |
| `--evidence <path>` | Portable relative evidence path for `run record`. |
| `--before <preflight-json>` | JSON file previously saved from `operator preflight --json`. |
| `--contract <id>` | Limit `contracts snapshot` to one contract id. |
| `--threshold N` | Allowed image diff ratio from `0` to `1`; `0` means any changed pixel fails. |
| `--deep` | Add AST-grep, exact function-body clone cues, and TypeScript/JavaScript language-analysis signals to `operator analyze`. |
| `--engine auto\|js\|python` | Select the prose-analysis engine for `writing naturalness-check`; `auto` uses Python when available and keeps the JavaScript fallback. |
| `--root <dir>` | Directory inside the target project for `writing naturalness-report`. |
| `--max-files N` | Limit the number of prose files inspected by a bounded report command. |
| `--provider auto\|github\|gitea` | Select or constrain forge provider detection. An uncertain self-hosted provider remains non-writable. |
| `--remote <name>` | Select the Git remote inspected by `forge status`; project config remains the normal persistent setting. |
| `--lang auto\|ko\|en` | Select the human-facing language recorded by `plan new --automation`. |
| `--no-remote` | Disable forge APIs and remote Git delivery for this invocation while retaining permitted local work. |
| `--remote-read-only` | Allow forge inspection but disable forge mutation and remote Git delivery. |
| `--no-git` | Disable branch, commit, tag, and push work for this invocation. |
| `--offline` | Disable network access. `automation tick` and `supervise` fail closed before any executor because the harness cannot prove process-level network isolation; use `--no-remote` when local execution may still use an agent network. |
| `--no-interactive` | Run an automation tick or supervisor in unattended mode, using the configured isolated workspace policy. |
| `--approve-review` | Supply the explicit review gate for a task whose verified state is waiting in `review`. |
| `--enable-github-agent-task` | Allow explicit preview selection of the `github-agent-task` executor adapter. It is never auto-selected. |
| `--instruction <text>` | Pass a current-request restriction to forge/automation policy resolution. Clear remote opt-out language can narrow permission but never expand it. |
| `--platform <name>` | Select `github-actions`, `gitea-actions`, `windows-task`, or `systemd-user` for `automation schedule`. |

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
| `skills lint` | Review source `SKILL.md` files for trigger-focused descriptions, frontmatter shape, missing reference links, and shallow reference files before publishing. | No | `npx ai-agent-playbook skills lint --json` |
| `skills install` | Install reusable skills for the first time. | Yes, unless `--dry-run` | `npx ai-agent-playbook skills install --dry-run` then `npx ai-agent-playbook skills install` |
| `skills update` | Refresh installed managed skills after the package or checkout changes. | Yes, unless `--dry-run` | `npx ai-agent-playbook skills update --dry-run` then `npx ai-agent-playbook skills update` |
| `skills uninstall` | Remove unmodified managed skills installed by this playbook. | Yes, unless `--dry-run` | `npx ai-agent-playbook skills uninstall --dry-run` then `npx ai-agent-playbook skills uninstall` |

The skills commands use `.ai-agent-playbook-install.json` markers and content hashes. They do not remove other people's skills by default.

## Project playbook

Project playbook commands manage `.ai-agent-playbook/` in one target repository.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `bootstrap <target>` | Create the root `AGENTS.md` and `.ai-agent-playbook/` layout in a target project. | Yes, unless `--dry-run` | `npx ai-agent-playbook bootstrap <target-project> --dry-run` |
| `guides sync <target>` | Copy missing guide templates into an existing `.ai-agent-playbook/knowledge/references/guides/`. | Yes, unless `--dry-run` or `--check` | `npx ai-agent-playbook guides sync <target-project> --check --diff --json` |
| `migrate path <target>` | Preview or apply the legacy `ai-playbook/` to `.ai-agent-playbook/` folder migration. | No unless `--apply` | `npx ai-agent-playbook migrate path <target-project> --json` |
| `migrate layout <target>` | Preview or apply structured `.ai-agent-playbook` directories, legacy-layout moves, reference updates, and archive operations. | No unless `--apply` | `npx ai-agent-playbook migrate layout <target-project> --to structured --json` |
| `layout status <target>` | Report whether the target playbook has the structured layout files and directories. | No | `npx ai-agent-playbook layout status <target-project> --json` |
| `doctor <target>` | Check project playbook health, adaptation status, worklog summary freshness, and local-path risk. | No | `npx ai-agent-playbook doctor <target-project> --json` |
| `config preview <target>` | Resolve playbook defaults from built-in values, explicit user config, target config, target-local config, and narrow env overrides. | No | `npx ai-agent-playbook config preview <target-project> --json` |
| `context <target>` | Build compact project context from core `.ai-agent-playbook/` files for optional hooks or inspection. | No | `npx ai-agent-playbook context <target-project> --json` |
| `context list <target>` | List `.ai-agent-playbook/memory/context/**/*.md` files and their frontmatter. | No | `npx ai-agent-playbook context list <target-project> --json` |
| `context status <target>` | Show which path-scoped context files apply to one file and whether `memory/maps/doc-map.md` exists. | No | `npx ai-agent-playbook context status <target-project> --path src/example.ts --json` |
| `context init <target>` | Create starter `memory/context/root.md`, `_registry.json`, and `memory/maps/doc-map.md`. | Yes, unless `--dry-run` | `npx ai-agent-playbook context init <target-project> --dry-run --json` |

Use `--local-only` with `bootstrap` when the target project's `.ai-agent-playbook/` should be added to that project's `.gitignore`.

`config preview` reads `.ai-agent-playbook/config.json` and `.ai-agent-playbook/config.local.json` when they exist. It does not create either file. Precedence is built-in defaults, optional `--user-config`, target config, target-local config, then explicit environment overrides.

The 0.5.4 defaults add `automation`, `forge`, `git`, and `executor` sections. They select `automation.profile: "deliver"`, `automation.killSwitch: false`, one task at a time, a 30-minute tick, three attempts, three stalled ticks, an eight-hour wall budget, `forge.provider: "auto"`, remote `origin`, `forge.apiBaseUrl: null`, hybrid synchronization, automatic working-language selection, first-sync bootstrap, branch delivery, an isolated unattended checkout, and automatic executor selection. For a self-hosted Gitea instance on a custom port or subpath, set a credential-free API base such as `https://code.example/gitea/api/v1`; embedded credentials, query strings, fragments, and non-local HTTP URLs are rejected. These defaults do not start a run or install a schedule by themselves. The copyable `forge.example.json` intentionally changes the kill switch to `true` for safer adoption. `automation start` is a write command and, under effective remote-write permission, can coordinate the approved plan and auto-bootstrap missing managed assets. Use forge previews first or pass `--no-remote` when only a local run is intended.

Automation environment overrides are limited to `AI_AGENT_PLAYBOOK_AUTOMATION_PROFILE`, `AI_AGENT_PLAYBOOK_AUTOMATION_KILL_SWITCH`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_PARALLEL`, `AI_AGENT_PLAYBOOK_AUTOMATION_TICK_MINUTES`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_ATTEMPTS`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_STALLED`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_WALL_MINUTES`, `AI_AGENT_PLAYBOOK_FORGE_PROVIDER`, `AI_AGENT_PLAYBOOK_FORGE_REMOTE`, `AI_AGENT_PLAYBOOK_FORGE_SYNC`, `AI_AGENT_PLAYBOOK_FORGE_LANGUAGE`, `AI_AGENT_PLAYBOOK_FORGE_AUTO_BOOTSTRAP`, `AI_AGENT_PLAYBOOK_GIT_AUTO_COMMIT`, `AI_AGENT_PLAYBOOK_GIT_AUTO_PUSH`, and `AI_AGENT_PLAYBOOK_EXECUTOR_PROVIDER`, in addition to the existing context/runtime/MCP variables. Custom executor configuration is an argv array such as `["agent-cli", "--json"]`, not an interpolated shell command.

Current-request deny flags and clear opt-out instructions are applied after configuration. They can narrow authority but cannot enable a broader profile, remote write, Git delivery, or network access.

Context files support markdown frontmatter: `id`, `globs`, `alwaysApply`, `freshness`, and `priority`. Use `context status` before loading more project memory for a path. It is read-only and safe to run often.

Use `CURRENT.md` for current baseline facts, active risks, decisions, and project-specific working vocabulary. Put larger structural facts, scan ranges, and clone or duplicate-code cues in maps so they stay reviewable without turning `CURRENT.md` into a long report.

When `.ai-agent-playbook/` feels too large, narrow the read set before loading more notes: run `operator context --path <file> --json`, then use `operator search` or `index search` for the specific concern. Read only the matching map, runbook, contract, guide, or worklog, and promote reviewed facts back into `memory/` or `knowledge/` instead of copying runtime reports wholesale.

## Catalogs and runtime

These commands expose the capability model and generated local runtime surface. They are safe to run before editing code.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `catalog list` | List capability categories with skill and workflow counts. | No | `npx ai-agent-playbook catalog list --json` |
| `catalog check` | Validate skill taxonomy, duplicate names, wrapper routes, and wrapper references. | No | `npx ai-agent-playbook catalog check --json` |
| `workflow list` | List built-in workflow recipes. | No | `npx ai-agent-playbook workflow list --json` |
| `workflow run-preview <target>` | Preview a workflow run manifest from a target or bundled recipe without creating run files. | No | `npx ai-agent-playbook workflow run-preview <target-project> --recipe backend-contract-change --json` |
| `workflow run-start <target>` | Preview or create a bounded scaffold-tier run record under `.ai-agent-playbook/workflows/runs/`. | No unless `--apply` | `npx ai-agent-playbook workflow run-start <target-project> --recipe deployment-release --json` |
| `reference inventory <reference-dir>` | Summarize a local reference collection before deciding what to adopt. | No | `npx ai-agent-playbook reference inventory _reference --json` |
| `reference inspect <reference-dir>` | Inspect one top-level reference project as a compact adoption review packet without copying source contents. | No | `npx ai-agent-playbook reference inspect _reference --project hermes-agent-main --json` |
| `reference adoption-queue <reference-dir>` | Score local reference collections into a compact adoption backlog, optionally annotated by ledger status. | No | `npx ai-agent-playbook reference adoption-queue _reference --ledger .ai-agent-playbook/knowledge/reference-adoption-ledger.md --json` |
| `reference capability-matrix <reference-dir>` | Group scored reference candidates by capability, with optional capability filter and ledger status annotation. | No | `npx ai-agent-playbook reference capability-matrix _reference --capability ai-harness --json` |
| `reference adoption-plan <reference-dir>` | Build a bounded capability-focused planning packet from the matrix and inspect packets. | No | `npx ai-agent-playbook reference adoption-plan _reference --capability runtime-index-canon --json` |
| `reference adoption-status <target>` | Reconcile a local reference queue with target source registry and adoption ledger state. | No | `npx ai-agent-playbook reference adoption-status <target-project> --reference-dir _reference --json` |
| `reference source-registry-preview <reference-dir>` | Convert adoption queue items into `knowledge/sources.json` candidates without writing them. | No | `npx ai-agent-playbook reference source-registry-preview _reference --json` |
| `reference source-registry-check <target>` | Validate `knowledge/sources.json` schema, freshness, duplicates, and optional local reference path drift. | No | `npx ai-agent-playbook reference source-registry-check <target-project> --reference-dir _reference --json` |
| `reference source-registry-update <target>` | Preview or append missing `knowledge/sources.json` reference entries from a local reference queue. | No unless `--apply` | `npx ai-agent-playbook reference source-registry-update <target-project> --reference-dir _reference --json` |
| `reference ledger-init <target>` | Preview or create a missing reference adoption ledger from a local reference queue. | No unless `--apply` | `npx ai-agent-playbook reference ledger-init <target-project> --reference-dir _reference --json` |
| `reference ledger-update <target>` | Preview or append missing reference adoption ledger rows from a local reference queue. | No unless `--apply` | `npx ai-agent-playbook reference ledger-update <target-project> --reference-dir _reference --json` |
| `reference ledger-decision <target>` | Preview or update one existing reference adoption ledger row decision. | No unless `--apply` | `npx ai-agent-playbook reference ledger-decision <target-project> --reference reference-pack --status reviewed --json` |
| `reference ledger-check <target>` | Validate a reference adoption ledger for status values and local-only leaks. | No | `npx ai-agent-playbook reference ledger-check <target-project> --json` |
| `runtime python-status` | Report whether the optional local Python engine is available and which interpreter was selected. | No | `npx ai-agent-playbook runtime python-status --json` |
| `runtime capability-history <target>` | Summarize local append-only capability history without running benchmarks or telemetry. | No | `npx ai-agent-playbook runtime capability-history <target-project> --json` |
| `runtime schema-check <target>` | Validate runtime eval, witness, evidence-envelope, repo-graph, artifact, or source-registry JSON without writing files. | No | `npx ai-agent-playbook runtime schema-check <target-project> --path .ai-agent-playbook/runtime/reports/evals/example.json --json` |
| `evidence locator-check <target>` | Check JSON or Markdown evidence locators for portable paths, scan ranges, source boundaries, freshness, and credential-looking values. | No | `npx ai-agent-playbook evidence locator-check <target-project> --path .ai-agent-playbook/runtime/reports/evidence/example.json --json` |
| `index build <target>` | Preview or write `.ai-agent-playbook/runtime/indexes/file-inventory.json`. | No unless `--apply` | `npx ai-agent-playbook index build <target-project> --json` |
| `index status <target>` | Check whether the runtime file inventory exists. | No | `npx ai-agent-playbook index status <target-project> --json` |
| `index search <target>` | Search local project text without writing the runtime index. | No | `npx ai-agent-playbook index search <target-project> --query "auth flow" --json` |
| `index symbol-outline <target>` | Preview function, class, component, method, and binding hints with file, line, confidence, and source pattern metadata. | No | `npx ai-agent-playbook index symbol-outline <target-project> --json` |
| `index dependency-inventory <target>` | Preview dependency manifests, lockfiles, container base images, package scripts, and CI action usage without executing scripts or network scans. | No | `npx ai-agent-playbook index dependency-inventory <target-project> --json` |
| `index route-api-hints <target>` | Preview route, client API, SQL query, migration, and data-object hints with source pattern metadata. | No | `npx ai-agent-playbook index route-api-hints <target-project> --json` |
| `graph preview <target>` | Preview a compact generated graph over runtime file, symbol, route/API, and dependency signals. | No | `npx ai-agent-playbook graph preview <target-project> --json` |
| `canon draft <target>` | Draft promotion-ready fact candidates from runtime index and reports. | No | `npx ai-agent-playbook canon draft <target-project> --json` |
| `canon check <target>` | Check promoted canon facts in memory against runtime evidence and current files. | No | `npx ai-agent-playbook canon check <target-project> --json` |
| `canon promote <target>` | Preview or write reviewed canon facts from a runtime report into memory or knowledge references. | No unless `--apply --reviewed` | `npx ai-agent-playbook canon promote <target-project> --source .ai-agent-playbook/runtime/reports/example.json --to .ai-agent-playbook/memory/maps/canon.json --json` |
| `write-gate preview <target>` | Preview write risk for an intent and optional path before editing. | No | `npx ai-agent-playbook write-gate preview <target-project> --intent "change auth flow" --path src/example.ts --json` |
| `write-gate advisory <target>` | Preview or save a pre-write advisory report under playbook runtime. | No unless `--apply` | `npx ai-agent-playbook write-gate advisory <target-project> --intent "change auth flow" --path src/example.ts --apply --json` |
| `write-gate post-check <target>` | Compare a saved advisory snapshot with current files after editing. | No | `npx ai-agent-playbook write-gate post-check <target-project> --advisory .ai-agent-playbook/runtime/reports/write-gate/pre-write-advisory.<id>.json --json` |

`reference inspect` opens one top-level project from a local reference directory and returns a no-content adoption packet: summary counts, signal highlights, capability hints, representative file read order, adoption questions, and next actions. It rejects traversal, absolute paths, and nested project paths so reference review stays scoped to one collection at a time.

`reference adoption-queue` builds on `reference inventory`. It scores each top-level reference collection by local signals such as skills, agents, MCP, workflows, architecture, frontend, backend, database, DevOps, mobile, data, design, observability, memory, indexes, connectors, security, compliance, docs, tests, and package metadata. It returns recommended capability areas, representative file paths, and next adoption actions without copying raw reference contents. Add `--ledger <ledger.md>` to annotate queue items with `ledgerStatus`, `ledgerCapability`, and `ledgerDecisionDate` from a reference adoption ledger.

`reference capability-matrix` builds on the adoption queue and groups candidates by recommended and candidate capability ids. Each group includes priority counts, optional ledger status counts, recommended/candidate match counts, and a bounded top-reference list with signal highlights, representative files, and next actions. Add `--capability <id>` to focus on one capability such as `ai-harness`, `devops`, `design`, `frontend`, `database`, `data`, `mobile`, or `security`; add `--ledger <ledger.md>` to include existing adoption decisions. The command is read-only and does not emit raw reference source contents.

`reference adoption-plan` builds on the capability matrix and selected inspect packets. It requires `--capability <id>` and returns a bounded plan containing selected references, ledger status, suggested local surfaces, read order, adoption questions, stop conditions, verification, and follow-ups. The packet is triage evidence only; it does not mark anything adopted and does not write ledger rows, source registry entries, runtime reports, skills, workflows, or MCP files.

`reference adoption-status` joins the adoption queue with a target project's source registry and optional adoption ledger. It reports source-registered versus source-missing queue rows, ledger status counts, and capability rollups so reference adoption work can be resumed without manually comparing `knowledge/sources.json`, ledger rows, and matrix output. Missing default registry or ledger files are warnings; explicit invalid paths are conflicts. The command is read-only and does not write or promote adoption decisions.

`reference source-registry-preview` builds on the adoption queue and returns a `knowledge/sources.json` candidate object. Entries keep locators relative to the scanned reference root and include privacy tier, credential boundary, freshness, promotion policy, caveats, capability hints, and representative files. The command validates the generated registry shape but does not write files or promote sources into memory.

`reference source-registry-check` reads `.ai-agent-playbook/knowledge/sources.json` by default and validates schema shape, duplicate ids, status/privacy/type summaries, and stale freshness values. Add `--path <sources.json>` to check a different registry inside the target project. Add `--reference-dir <dir>` to verify registered `referencePath` and representative files still exist under a local reference directory without reading their contents.

`reference source-registry-update` appends only missing local reference source entries to an existing `.ai-agent-playbook/knowledge/sources.json`. It preserves existing source entries and top-level registry metadata, validates the merged registry before writing, and writes only with `--apply`.

`reference ledger-init` seeds `.ai-agent-playbook/knowledge/reference-adoption-ledger.md` from a local reference adoption queue. It writes only with `--apply`, refuses to overwrite an existing ledger, and keeps generated rows compact: status, reference id, capability, useful pattern summary, local adoption note, risk/noise note, and decision date placeholder.

`reference ledger-update` appends only missing `new` rows to an existing reference adoption ledger. It uses the current ledger to avoid duplicating reviewed, adopted, deferred, or rejected references, removes the starter blank template row when real rows are appended, and writes only with `--apply`.

`reference ledger-decision` updates one existing reference adoption ledger row to `reviewed`, `adopted`, `deferred`, or `rejected`. It previews the exact row replacement by default and writes only with `--apply`. Optional `--capability`, `--pattern`, `--adoption`, `--risk`, and `--decision-date YYYY-MM-DD` flags update the selected row cells. Unsafe cell values such as local absolute paths, internal URLs, token-like secrets, table separators, newlines, or oversized raw excerpts are rejected before any write.

`reference ledger-check` validates `.ai-agent-playbook/knowledge/reference-adoption-ledger.md` by default. It checks adoption statuses, local absolute paths, internal URLs, secret-like tokens, and oversized excerpts without writing files. Use `--path <ledger.md>` to check a different ledger inside the target project. JSON output includes `summary.capabilities` so adoption status can be reviewed by capability area. Add `--strict` when oversized fenced excerpts should fail the check instead of only warning.

`runtime python-status` checks the optional Python capability engine. Detection order is `AI_AGENT_PLAYBOOK_PYTHON`, a repo-local `.venv`, `python`, `python3`, then Windows `py -3`. Missing Python is not a harness failure; commands that support `--engine auto` keep their JavaScript fallback and report the unavailable Python engine in JSON.

`runtime capability-history` reads `.ai-agent-playbook/runtime/reports/capability-history.jsonl` when present. It groups entries by capability, reports the latest status, latest duration, baseline, and drift, and omits non-portable evidence paths from output instead of echoing machine-local paths. Missing history is a valid empty state.

`runtime schema-check` reads a target-relative JSON file and validates compact local schemas such as `runtime.eval-definition`, `runtime.eval-run-report`, `runtime.capability-witness`, `runtime.evidence-envelope`, `runtime.repo-graph`, `runtime.source-registry`, or the generic runtime artifact envelope. It detects known `kind` values automatically; use `--kind <kind>` when checking ambiguous evidence envelopes. The command is read-only. Compact schema checks report local absolute paths, credential-looking values, non-portable graph paths, dangling graph edges, and oversized inline evidence as conflicts.

`evidence locator-check` reads a target-relative JSON or Markdown file and recursively inspects locator-like objects, fenced evidence blocks, and locator tables. It reports missing scan ranges, missing or unknown source boundaries, non-portable locator paths, local absolute paths, and credential-looking strings without writing files. Markdown files without locator blocks return an advisory warning instead of a failure.

`graph preview` combines existing read-only runtime signals into a compact `runtime.repo-graph` report. It includes file, doc, symbol, route, data, and package nodes plus source-backed edges such as `contains`, `defines-route`, `mentions`, and `uses-package`. The graph is generated evidence only; promote reviewed facts separately instead of treating the report as durable memory.

`write-gate preview` returns a `transaction.invocationId` and planned `transaction.advisoryPath` under `.ai-agent-playbook/runtime/reports/write-gate/`. The preview stays read-only; the transaction fields are a stable handoff for later post-write or advisory-file work.

`write-gate advisory` uses the same preview engine but can save a pre-write advisory JSON file when `--apply` is present. The file is written only inside `.ai-agent-playbook/runtime/reports/write-gate/`; without `--apply`, the command returns the planned advisory without writing it.

`write-gate post-check` reads a saved advisory and compares its snapshot with current files. If the advisory is missing, invalid, or lacks a snapshot, the command reports `summary.status: "unknown"` instead of claiming the change is clean.

`canon draft` proposes facts from `.ai-agent-playbook/runtime/indexes/file-inventory.json` and JSON reports under `.ai-agent-playbook/runtime/reports/`. `canon check` reads promoted JSON facts under `.ai-agent-playbook/memory/` or a specific `--path <canon-json>` and reports `verified`, `missing`, `stale`, `changed`, and `unverified` states without writing files.

`canon promote` accepts `--source <runtime-index-or-report-json>` and `--to <memory-or-reference-json>`. The source must be a JSON file under `.ai-agent-playbook/runtime/indexes/` or `.ai-agent-playbook/runtime/reports/`. It writes only when both `--apply` and `--reviewed` are present, and only to JSON files under `.ai-agent-playbook/memory/` or `.ai-agent-playbook/knowledge/references/`.

Promotion sources must be valid runtime artifacts with `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, and `conflicts`. If a runtime report is malformed or uses an old shape, `canon promote` reports a conflict instead of drafting facts from it.

Runtime output lives under `.ai-agent-playbook/runtime/`. Do not copy generated output into `.ai-agent-playbook/memory/` until it has been reviewed and promoted intentionally.

## Writing review

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `writing naturalness-check <target>` | Check Korean or English prose for translationese, AI-writing signals, inflated tone, repetitive rhythm, and English-term density. | No | `npx ai-agent-playbook writing naturalness-check <target-project> --path README.md --lang auto --engine auto --json` |
| `writing naturalness-report <target>` | Check a bounded folder of Markdown or text files and summarize which files need prose review. | No | `npx ai-agent-playbook writing naturalness-report <target-project> --root docs --lang ko --engine auto --json` |

`writing naturalness-check` reads one target-relative text file and returns heuristic findings. `--engine auto` merges the built-in JavaScript checks with the optional Python engine when Python is available; `--engine js` forces the dependency-free fallback, and `--engine python` requests Python explicitly. It does not rewrite files, call a network service, judge authorship, or help bypass detectors. Use it before editing README text, translations, PR bodies, release notes, docs pages, and public summaries. Treat findings as review prompts; facts, command names, file paths, warnings, and release scope still need source comparison.

`writing naturalness-report` recursively scans Markdown, MDX, and text files under `--root` and caps the scan at `--max-files` files, up to 50. It applies the same read-only checks as `naturalness-check` but ignores fenced code blocks, inline code, shell commands, URLs, HTML-only badge lines, and path examples before judging prose. Use it for a translation folder or documentation batch, then open the highest-signal files one by one.

## Managed files

Managed commands inspect or maintain `.ai-agent-playbook/.ai-agent-playbook-install.json`. They protect edited project memory by comparing hashes before removing or adopting files.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `managed check <target>` | Verify the managed marker and report missing or modified managed files. | No | `npx ai-agent-playbook managed check <target-project> --json` |
| `managed catalog <target>` | See managed files grouped by kind and status before cleanup. | No | `npx ai-agent-playbook managed catalog <target-project> --json` |
| `managed adopt <target>` | Add a marker to older matching playbook files. | No unless `--apply` | `npx ai-agent-playbook managed adopt <target-project> --json` |
| `managed prune <target>` | Remove one selected unmodified managed file. | No unless `--apply` | `npx ai-agent-playbook managed prune <target-project> --path .ai-agent-playbook/knowledge/references/guides/runtime-harness.md --json` |
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
| `run start <target>` | Create `.ai-agent-playbook/workflows/runs/<run-id>/` with a brief, criteria file, append-only ledger, evidence folder, and summary. | Yes, unless `--dry-run` | `npx ai-agent-playbook run start <target-project> --title "Auth flow" --dry-run --json` |
| `run status <target>` | Read the latest run or one selected run and summarize events, criteria, blockers, evidence, and cleanup. | No | `npx ai-agent-playbook run status <target-project> --run-id auth-flow --json` |
| `run record <target>` | Append a note, criterion, evidence, blocker, or cleanup event to `ledger.jsonl`. | Yes | `npx ai-agent-playbook run record <target-project> --run-id auth-flow --type evidence --status pass --message "Auth flow test passed" --evidence .ai-agent-playbook/workflows/runs/auth-flow/evidence/auth.txt --json` |
| `run summarize <target>` | Render the append-only ledger into `summary.md`. | Yes, unless `--dry-run` | `npx ai-agent-playbook run summarize <target-project> --run-id auth-flow --dry-run --json` |

`run record` rejects messages that look like local absolute paths or credential assignments. Evidence paths must be portable relative paths. Runs do not replace worklogs: use runs while executing, then promote durable facts to `CURRENT.md`, maps, runbooks, decisions, contracts, or worklogs.

`run start` and `workflow run-start` remain schema v1 creation surfaces for manual notes and recipe scaffolds. `run status` recognizes an automation v2 directory and reads it through the common reducer/store, while `run record` and `run summarize` refuse to append to or overwrite a v2 run. `workflow run-start` writes only new scaffold files under `.ai-agent-playbook/workflows/runs/` when `--apply` is present; without `--apply`, it returns the planned files without writing. Schema v1 inputs remain compatibility-read-only from the automation surface and are never converted in place.

## Contracts

Contracts capture important business rules and invariants. They are checked explicitly and read-only; there is no LLM judge, pre-commit block, or automatic approval.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `contracts list <target>` | List active and pending contracts under `.ai-agent-playbook/memory/contracts/`. | No | `npx ai-agent-playbook contracts list <target-project> --json` |
| `contracts check <target>` | Show active or pending contracts that apply to a path and warn about stale or incomplete contract notes. | No | `npx ai-agent-playbook contracts check <target-project> --path src/example.ts --json` |
| `contracts snapshot <target>` | Preview or write `.ai-agent-playbook/memory/contracts/.hashes.json` with relative path hashes for contract, appliesTo, and evidence files. | No unless `--apply` | `npx ai-agent-playbook contracts snapshot <target-project> --json` then `npx ai-agent-playbook contracts snapshot <target-project> --apply --json` |
| `contracts init <target>` | Create starter `.ai-agent-playbook/memory/contracts/README.md` plus `active/` and `pending/` folders. | Yes, unless `--dry-run` | `npx ai-agent-playbook contracts init <target-project> --dry-run --json` |

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
aapb mcp
```

The server exposes read-only resources for `ai-agent-playbook://capabilities`, `ai-agent-playbook://skills`, `ai-agent-playbook://workflows`, `ai-agent-playbook://adapters`, `ai-agent-playbook://adapter-readiness`, `ai-agent-playbook://agent-usage-guide`, `ai-agent-playbook://playbook-layout`, `ai-agent-playbook://reference-adoption`, and `ai-agent-playbook://mcp-permission-model`. These resources help AI apps discover the capability catalog, skill taxonomy, workflow recipes, Codex/Claude adapter support, adapter readiness checks, usage order, `.ai-agent-playbook` reading order, reference adoption boundaries, and permission tier before picking tools.

The server exposes read-only tools for:

- playbook context: `playbook_context`, `context_status`, `context_list`
- catalogs and layout: `capability_catalog`, `skill_catalog`, `workflow_list`, `workflow_run_preview`, `reference_inventory`, `reference_inspect`, `reference_adoption_queue`, `reference_capability_matrix`, `reference_adoption_plan`, `reference_adoption_status`, `reference_source_registry_preview`, `reference_source_registry_check`, `reference_source_registry_update_preview`, `reference_ledger_check`, `reference_ledger_update_preview`, `reference_ledger_decision_preview`, `playbook_layout`, `index_status`, `runtime_schema_check`, `evidence_locator_check`, `writing_naturalness_check`, `writing_naturalness_report`, `index_search`, `symbol_outline`, `dependency_inventory`, `route_api_hints`, `repo_graph_preview`, `write_gate_preview`, `canon_check`
- operator diagnostics: `operator_check`, `operator_search`, `operator_research`, `operator_preflight`, `operator_delta`, `operator_map`, `operator_audit`, `operator_analyze_deep`
- rules and project state: `rules_check`, `contracts_check`, `contracts_list`, `managed_check`, `managed_catalog`, `diagnostics_check`
- QA and deep analysis: `qa_image_diff`, `source_function_clones`, `ast_grep_search`, `lsp_status`, `lsp_diagnostics`, `lsp_symbols`, `lsp_references`, `lsp_definition`
- forge automation reads: `automation_status`, `automation_plan_validate`, `forge_status`, `forge_bootstrap_plan`, `forge_sync_plan`

The two forge plan tools require a target project and derive provider and effective capabilities from the same target-aware inspection used by their apply counterparts. A reviewed preview therefore cannot silently expand from an `auto`/static zero-operation plan into target-specific writes at apply time. `forge_sync_plan` and `forge_sync_apply` also require the reviewed `coordination` contract; they publish a roadmap and delivery-group issues while detailed tasks remain local, unless legacy task mode is explicitly selected.

The server also exposes prompts for `repo_onboarding_runbook`, `harness_extension_plan`, `harness_governance_review`, `reference_adoption_review`, `backend_change_review`, `architecture_boundary_review`, `auth_access_control_review`, `dependency_supply_chain_review`, `package_release_readiness_review`, `deployment_release_review`, `mobile_release_review`, `connector_integration_review`, `design_reference_handoff_review`, `frontend_quality_review`, `interactive_experience_review`, `data_integrity_review`, `data_pipeline_review`, `database_change_review`, `adr_spec_handoff_review`, `documentation_package_review`, `natural_writing_review`, `workflow_run_review`, `eval_harness_review`, `capability_witness_review`, `pre_action_fact_gate_review`, `knowledge_source_review`, `canon_promotion_review`, `index_interpretation_review`, `agent_orchestration_review`, `repo_graph_review`, `ci_quality_gate_review`, `release_deployment_gate_review`, and `security_compliance_gate_review`. Prompts are reusable task briefs; they do not grant write access by themselves.

The MCP layer is read-only by default. With `mcp --enable-write-tools`, it also exposes `workflow_run_start`, `write_gate_advisory`, `reference_ledger_update`, `reference_ledger_decision`, and `reference_source_registry_update`; every write-capable tool requires a tool-call `apply` boolean and stays dry-run when `apply` is false.

Forge writes use a separate server gate. `mcp --enable-forge-write-tools` exposes only `forge_bootstrap_apply` and `forge_sync_apply`, and both still require a tool-call `apply: true`. Preview and apply resolve the same target, provider, effective capability set, and configured language. These tools can perform authenticated remote coordination writes, so enable them only for a bounded session after reviewing provider status and permissions. This MCP surface does not expose push, an automation tick or supervisor, merge, release, delete, force-push, or arbitrary project source writes.

## Adapter setup

Adapters are optional. The default harness works without hooks or agent plugins.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `adapter config <target>` | Render copy-paste-safe local hook settings for Codex or Claude Code. | No | `npx ai-agent-playbook adapter config <target-project> --adapter codex --json` |
| `adapter check <target>` | Check whether optional adapter files, context, and local settings are ready. | No | `npx ai-agent-playbook adapter check <target-project> --adapter codex --settings <local-settings-path> --json` |

`adapter config` does not create a settings file. It prints the command and JSON that an operator can review and copy manually.

`adapter config --json` also includes a reviewable MCP server example using `npx ai-agent-playbook mcp`, plus the global-install variant using `aapb mcp`.

## Plans and worklogs

Use these commands when you want predictable project-memory paths instead of ad hoc markdown files.

| Command | When to use it | Writes files? | Example |
| ------- | -------------- | ------------- | ------- |
| `plan new <target>` | Create a dated plan under `.ai-agent-playbook/workflows/plans/`. | Yes, unless `--dry-run` | `npx ai-agent-playbook plan new <target-project> --title "Feature slice" --dry-run` |
| `plan new <target> --automation` | Create human-readable Markdown plus a `workflow.plan.v2` JSON sidecar with stable task fields. | Yes, unless `--dry-run` | `npx ai-agent-playbook plan new <target-project> --automation --title "Forge loop" --dry-run` |
| `plan validate <target>` | Validate a structured sidecar, dependency graph, criteria, argv verification, and approval readiness. | No | `npx ai-agent-playbook plan validate <target-project> --plan .ai-agent-playbook/workflows/plans/<plan>.plan.json --json` |
| `worklog new <target>` | Create a dated worklog under `.ai-agent-playbook/workflows/worklogs/YYYY-MM/`. | Yes, unless `--dry-run` | `npx ai-agent-playbook worklog new <target-project> --title "Feature slice" --dry-run` |
| `worklog summarize <target>` | Create or refresh a monthly worklog summary. | Yes, unless `--dry-run` | `npx ai-agent-playbook worklog summarize <target-project> --month 2026-06 --dry-run` |

Existing plan and worklog files are not overwritten unless `--force` is provided. An automation sidecar starts as a draft and is not runnable until every task has acceptance criteria and safe argv verification commands and `approval.status` is `approved`.

## Forge coordination and resumable automation

Forge commands use capability detection and the effective permission profile. GitHub and Gitea share the issue, label, milestone, pull-request, and Actions core; unsupported Project, View, Discussion, or child-task features use documented fallbacks. Missing remote access never prevents local ledger operation.

| Command | When to use it | Writes files or remote state? | Example |
| ------- | -------------- | ----------------------------- | ------- |
| `forge status <target>` | Inspect selected remote/provider, server/API version, tooling, auth, repository permission, capability evidence, and policy-versus-verified write mode. | No mutation; may perform permitted read-only inspection | `npx ai-agent-playbook forge status <target-project> --json` |
| `forge bootstrap <target>` | Preview missing managed labels, milestone, Project fields, Views, or provider fallbacks; add `--apply` to create supported missing assets. | No unless `--apply`; apply writes remote state | `npx ai-agent-playbook forge bootstrap <target-project> --milestone 0.5.5 --json` |
| `forge sync <target>` | Preview plan/run task synchronization; add `--apply` after reviewing operations. A sidecar apply requires a complete approved plan. | No unless `--apply`; apply writes remote state | `npx ai-agent-playbook forge sync <target-project> --run-id <run-id> --json` |
| `forge reconcile <target>` | Preview requirement drift from reviewed snapshots, or consolidate a reviewed plan from task issues into delivery groups. Superseding requires `--apply --allow-supersede`. | No unless `--apply`; apply writes the ledger or reviewed remote issue state | `npx ai-agent-playbook forge reconcile <target-project> --plan <plan.json> --json` |
| `automation doctor <target>` | Check executor, effective policy, tool versions, forge access, dirty-checkout safety, and preview-first scheduler modes before starting. | No mutation | `npx ai-agent-playbook automation doctor <target-project> --json` |
| `automation start <target>` | Turn an approved `workflow.plan.v2` sidecar into a schema v2 run and coordinate it remotely when policy permits. | Yes; writes the local run and can write remote coordination state | `npx ai-agent-playbook automation start <target-project> --plan <plan.json> --no-remote --json` |
| `automation tick <target>` | Claim and process at most one dependency-ready task, verify it in the controller, deliver when permitted, and checkpoint. | Yes; may write code, ledger/evidence, Git, and remote state | `npx ai-agent-playbook automation tick <target-project> --run-id <run-id> --no-interactive --json` |
| `automation supervise <target>` | Repeat short ticks within the configured wall and stall budgets. | Yes; same bounded effects as repeated ticks | `npx ai-agent-playbook automation supervise <target-project> --run-id <run-id> --no-interactive --json` |
| `automation status <target>` | Read the latest or selected schema v2 run, task/criterion progress, blockers, and checkpoints. | No | `npx ai-agent-playbook automation status <target-project> --run-id <run-id> --json` |
| `automation pause\|resume\|stop <target>` | Persist an operator control event. Pause is resumable; stop cancels the run. | Yes; writes the local ledger and derived state | `npx ai-agent-playbook automation pause <target-project> --run-id <run-id> --reason "quota" --json` |
| `automation schedule <target>` | Preview one of four scheduler definitions; add `--apply` to write a hosted workflow or register a local schedule. Hosted start/tick commands and local tick commands persist effective deny flags; offline apply and hosted `--no-git` apply are rejected because those jobs cannot deliver safely. | No unless `--apply` | `npx ai-agent-playbook automation schedule <target-project> --platform github-actions --json` |

`automation start` is not a dry-run command and has no `--apply` gate. `--no-remote` prevents forge and remote Git effects but still creates the local run. Preview and validate the structured plan, run `forge status`, `automation doctor`, and the relevant `forge bootstrap`/`forge sync` preview before starting a remotely coordinated run. When preferred GitHub Projects are intentionally unavailable, `--allow-capability-fallback projects,views` explicitly selects milestone coordination for this start; without that flag or the matching persistent setting, the command stops before every remote coordination write.

`forge sync --plan ... --apply` rejects draft, invalid, or incomplete sidecars before forge inspection or transport creation. When a plan-only sync finds an existing marker-owned child issue without an `updatedAt` baseline, it reuses the issue only if its title and composed body exactly match the approved plan. A mismatch raises `forge.issue.reconcile-required`; title, body, acceptance-criteria, and status updates require an explicit reviewed snapshot and CAS match.

Compatibility plans without `coordination` remain valid for local automation, but they cannot bootstrap or synchronize remote collaboration artifacts. `automation start` stops before the first remote write when a writable forge is selected, and later task-time synchronization never infers task-per-issue mode. Use `--no-remote` for a local-only start or add reviewed coordination metadata before enabling remote writes.

`plan new --automation` copies the current `forge.presentation` and `forge.projectMode` defaults into the new sidecar. The reviewed sidecar is authoritative after creation; later config changes do not silently rewrite an approved plan. An explicit capability fallback may only narrow its Project presentation to milestone mode for the current operation.

An approved plan may add `coordination.reconcile.supportingIssues` and `coordination.reconcile.pullRequests` when an existing issue or draft PR must be rewritten as part of a reviewed presentation migration. Each entry names the exact remote number and supplies complete human-facing content. Reconcile reads fresh `updatedAt`, title, draft, and branch snapshots before planning; apply adopts only that reviewed artifact and fails on drift. Supersede closes an attached issue before marker-comment mutation, removes its Project card before the final hierarchy unlink, and can recover an already-unlinked open issue only from its exact approved-plan supersede marker. The preview separately reports Project items to ensure and obsolete Project items to remove. Project association removal requires `--allow-supersede`; existing issues, comments, and labels are never deleted.

Reconcile preview then runs the provider adapter through a mutation-blocking transport. Operations proven to be reusable are removed from `operations` and listed under `noOps`; `summary.artifacts` counts only executable changes and `plannedOperations` retains the original intent count. A strict legacy generated objective/acceptance preamble can be replaced during reviewed reconcile, but user text outside that recognized marker shape remains preserved. GitHub's omitted empty Project text values are equivalent to an empty target and do not cause repeat field writes.

When GitHub Projects is preferred but the authenticated `gh` session lacks `project`, `forge status` prints the conflict followed by `gh auth refresh -s project` and `aapb forge status .` as executable next steps. Bootstrap, sync, and reconcile previews return no executable operations before the first mutation while retaining requested label, milestone, Project, View, issue, and Project-item counts for review. If Projects are intentionally unavailable, `--allow-capability-fallback projects,views` produces a separate milestone-based preview. Authentication scope expansion always remains an interactive operator action. New Projects use neutral fields such as `Delivery Status`, `Priority`, and `Risk`; legacy `AAPB *` fields are compatibility aliases that are reused without duplicate creation or destructive renaming. Existing fields are checked for compatible types and required single-select options before missing fields are created, so a same-name schema collision stops the bootstrap without a partial field migration. User-owned field and View REST paths use the owner's login rather than the deprecated numeric GraphQL `databaseId`; this keeps the provider's discovery and mutation identities consistent and lets a failed run resume against its already titled Project.

GitHub creates a system `View 1` with a new Project. The stable public View API exposes creation but no rename or delete endpoint for that system view. AAPB therefore reuses it as the managed `all` role instead of creating another table view; the visible system name can remain `View 1`, and the harness does not use private endpoints or browser automation to change it.

Generated GitHub/Gitea workflows can initialize a fresh runner when repository variable `AAPB_AUTOMATION_PLAN` names a committed, approved plan sidecar. After restoring the run cache, they pass that value as the quoted environment expansion `"$AAPB_AUTOMATION_PLAN"` to an idempotent `automation start`, then run one tick. If the variable is absent, an existing run must already be available from the checkout or restored cache. Reusing the same `planId` reuses the same default run and does not rewrite it with changed plan contents.

The hosted cache contains `.ai-agent-playbook/workflows/runs` and the external managed checkout, and is saved by the cache action's post-job phase. It is a last-completed-job/tick checkpoint, not durable storage for an in-progress tick: timeout, cancellation, runner loss, or cache eviction can roll recovery back to the previous saved checkpoint. Gitea also requires its runner cache service to be configured and reachable. Verify save/restore behavior for both paths before unattended use and reconcile ambiguous forge/Git effects before replay.

Windows Task Scheduler registrations use a deterministic project-path suffix and do not pass `/F`; an existing task conflict is reported instead of being overwritten. Systemd user units and hosted workflow files likewise preserve differing existing content.

The default executor selector reports ambiguity when multiple local agents are equally eligible; set `executor.provider` explicitly. `github-agent-task` remains preview-only and requires the explicit preview enable flag. Unattended tasks, including `--no-git`, use a managed checkout created from a committed Git baseline so dirty and untracked files are excluded. A non-Git project must run interactively or establish a committed baseline first.

When remote reads are permitted, `automation start` queries open issues carrying the configured ready label and appends eligible issues to the approved plan. It excludes pull requests, closed issues, and issues carrying the configured pause label. Discovery runs when a run is first created and whenever the same non-terminal run is reused, so an issue labeled later is appended idempotently on a later start. Remote titles, bodies, labels, and checklists remain untrusted data; remote verification commands and file paths are never executed, and an imported issue remains paused until a reviewed local execution mapping is supplied. `--no-remote` and `--offline` skip ready-issue discovery.

For linked forge-issue tasks, a tick re-reads the issue before claim and after executor completion when remote reads succeed. A pause label, removed ready label, or closed issue pauses the task and run. Requirement changes found before claim are imported into the still-unclaimed task; changes found after execution pause the run as `needs-reconcile` before verification/delivery continues. Offline, no-remote, or unavailable read transport cannot provide this guard, so the local checkpoint remains authoritative and the remote state must be reconciled later.

`automation doctor` treats Git `2.39.0` as the minimum only when the effective policy requires Git. On a detected GitHub read path, an installed `gh` below `2.80.0` is a conflict. Preferred Projects mode with a missing `project` scope blocks coordination writes and reports `gh auth refresh -s project` plus `aapb forge status .`; the harness never refreshes authentication automatically. Use `--allow-capability-fallback projects,views` only when milestone fallback is an explicit operator decision. `policyWrites` records configured authority, while `verifiedWrites` and effective `writes` require verified authentication and repository write permission. A self-hosted Gitea candidate is non-writable until explicit provider/API-base trust, public version/OpenAPI inspection, and authenticated repository permission checks succeed. An older `tea` is a warning because the Gitea REST transport remains available. A dirty user checkout is reported as safe for unattended work only when `git.unattendedWorkspace` is `isolated-checkout`; a dirty non-isolated unattended workspace is a conflict. Scheduler mode status reports a local executable or detected provider/repository prerequisite, not successful registration, an enabled Actions service, runner health, credentials, or a completed remote smoke test.

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
