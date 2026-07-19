# Runtime Harness

`aapb` is the executable surface for installing reusable skills and applying this repository to a target project. Most inspection and scaffold commands do not call an AI model. An explicitly started automation tick can invoke the configured Codex, Claude, or argv-based executor, then the controller independently verifies and records the result.

The MCP server is an AI-facing local stdio surface. Its default tools remain read-only, including automation status/plan validation and forge status/planning. Separately gated forge bootstrap/sync tools can perform authenticated coordination writes only when the server is started with `--enable-forge-write-tools` and the call supplies `apply: true`; task execution, push, merge, and release are never exposed through MCP.

This CLI and the project playbook are the default harness. Runtime hooks or plugins are optional extensions and should stay outside the default path until their behavior is explicit, local, and easy to disable. See `docs/runtime-roadmap.md` for the staged design.

Keep the install scopes separate:

- `npx ai-agent-playbook ...` runs the published package without adding it to the current project.
- `npm install -g ai-agent-playbook` installs the `aapb` command globally.
- `npm install -D ai-agent-playbook` pins the CLI in one project but does not copy skills or create `.ai-agent-playbook/`.
- `aapb mcp` starts a local stdio MCP server for an AI app. Its default surface is read-only; write surfaces require explicit, separate server gates and per-call apply approval.
- `skills install` and `skills update` write only user-level skill copies.
- `bootstrap`, `guides sync`, and `managed` commands are the project-level playbook operations.

## Command surface

The detailed command reference lives in [Command guide](commands.md). Keep this file focused on runtime behavior and safety rules.

Use `npx ai-agent-playbook ...` for the published package, `aapb ...` after a global install, or `node .\bin\aapb.mjs ...` from a local checkout.

The short role split is:

- CLI: explicit human/operator commands, including preview-first writes.
- MCP: default read-only AI tool calls plus separately gated, bounded playbook or forge coordination writes. It never runs automation tasks or Git delivery.
- Skills: reusable working guidance loaded by agent environments.
- `.ai-agent-playbook/`: target-project memory, runs, contracts, guides, plans, and worklogs.
- Adapters: optional environment-specific hook/config rendering; never the default install path.

## Polyglot capability engine

The stable public facade stays Node-based: `npx ai-agent-playbook`, the global `aapb` command, and the stdio MCP server all run through the same JavaScript entrypoint. Python is a local capability engine behind that facade for checks where it gives a clear benefit, especially Korean/English prose analysis and future analysis/indexing helpers.

Python is recommended, not required. The bridge uses JSON over stdin/stdout, does not keep a daemon alive, does not write files, and does not call the network. Detection order is `AI_AGENT_PLAYBOOK_PYTHON`, repo-local `.venv`, `python`, `python3`, then Windows `py -3`. Each candidate has an isolated process-creation boundary, so a broken command alias is reported for that candidate without aborting discovery of the remaining interpreters.

Check the selected interpreter with:

```powershell
npx ai-agent-playbook runtime python-status --json
```

For a source checkout, run `.\scripts\bootstrap-python.ps1` to create `.venv` and install optional Korean analysis packages. For package users, any Python 3.11+ environment can be selected with `AI_AGENT_PLAYBOOK_PYTHON`; optional libraries such as `kss` or `kiwipiepy` are used when installed and skipped otherwise. When Python is missing, Python-backed commands return `engines.unavailable` and keep the JavaScript fallback.

## Type checking

`npm run typecheck` uses TypeScript in `allowJs`/`checkJs` mode. The checked set includes the automation and forge modules plus leaf modules for config resolution, Python bridging, writing analysis, capability history, dependency inventory, route/API hints, and symbol outline. The public CLI, MCP server, adapter, and package entrypoints remain JavaScript facades.

CLI, MCP server, adapter, and bin facade files stay `.mjs` for now. They carry the public `npx ai-agent-playbook`, global `aapb`, and MCP stdio surfaces, so they should move only after a build pipeline can preserve those paths exactly. `schemas`, evidence-locator, repo-graph, and operator modules also need stronger JSDoc option contracts before they join the checked set.

## Repo-local config preview

`config preview` is a read-only resolver for playbook defaults. It reports the final values, source map, source file status, warnings, and conflicts without changing runtime behavior or writing files.

Precedence is:

1. Built-in defaults.
2. An explicit `--user-config <path>` file.
3. `.ai-agent-playbook/config.json`.
4. `.ai-agent-playbook/config.local.json`.
5. Narrow environment overrides.

The command does not read personal home config automatically. Target-local config wins over an explicit user config. The 0.5.4 schema adds `automation`, `forge`, `git`, and `executor` sections. Defaults are the `deliver` profile, a disabled kill switch, one concurrent task, 30-minute ticks, three attempts, three stalls, an eight-hour run budget, automatic provider detection on `origin`, hybrid synchronization, automatic working language, first-sync bootstrap, branch delivery, an isolated unattended checkout, and automatic executor selection. Defaults do not start a run or install a schedule by themselves. The copyable forge example enables the kill switch until adoption review is complete.

Environment overrides remain an allowlist. In addition to the existing context/runtime/MCP variables, automation accepts `AI_AGENT_PLAYBOOK_AUTOMATION_PROFILE`, `AI_AGENT_PLAYBOOK_AUTOMATION_KILL_SWITCH`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_PARALLEL`, `AI_AGENT_PLAYBOOK_AUTOMATION_TICK_MINUTES`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_ATTEMPTS`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_STALLED`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_WALL_MINUTES`, `AI_AGENT_PLAYBOOK_FORGE_PROVIDER`, `AI_AGENT_PLAYBOOK_FORGE_REMOTE`, `AI_AGENT_PLAYBOOK_FORGE_SYNC`, `AI_AGENT_PLAYBOOK_FORGE_LANGUAGE`, `AI_AGENT_PLAYBOOK_FORGE_AUTO_BOOTSTRAP`, `AI_AGENT_PLAYBOOK_GIT_AUTO_COMMIT`, `AI_AGENT_PLAYBOOK_GIT_AUTO_PUSH`, and `AI_AGENT_PLAYBOOK_EXECUTOR_PROVIDER`. Current-request deny flags and clear opt-out instructions apply after configuration and can only narrow authority.

Trusted target config files must be regular JSON files under the target playbook root. Malformed JSON, symlinked config files, and runtime paths outside `.ai-agent-playbook/runtime/` are reported as conflicts.

## Automation readiness and forge queue boundaries

`automation doctor` requires Git `2.39.0+` when the effective policy needs Git operations. On a detected GitHub read path, an installed GitHub CLI must be `2.80.0+`. Missing GitHub Projects scope is a warning and never triggers an authentication refresh. An installed Gitea `tea` below `0.14.2` is also a warning because the controller can use the documented REST fallback.

Doctor reports the user checkout's dirty state and whether unattended execution is isolated. A dirty user checkout is acceptable only with `git.unattendedWorkspace: "isolated-checkout"`: unattended work, including `--no-git`, uses a separate checkout created from a committed Git baseline, so dirty and untracked user files are excluded. A non-Git unattended target is rejected. A dirty non-isolated checkout is a conflict. Scheduler readiness reports only local executable availability or hosted provider/repository compatibility; it does not prove that a schedule is registered, Actions is enabled, a runner is healthy, credentials work, or a live remote write succeeds.

When remote reads are allowed, `automation start` discovers open non-pull-request issues with the configured ready label, excludes closed or paused issues, and merges them without replacing approved local tasks. Discovery runs both when a run is created and when the same non-terminal run is reused; newly eligible issues are appended idempotently under the run lease. Remote titles, bodies, and criteria are untrusted data; remote commands and paths are not adopted, and queued issues remain paused until a reviewed local execution mapping supplies trusted paths and verification argv. `--no-remote` and `--offline` skip this lookup entirely.

For a linked issue, a tick inspects remote state before claim and after executor work when the forge transport is available. A configured pause label, removal of the ready label, or issue closure pauses the task or run. Requirement drift before claim can be imported into the still-unclaimed task; drift after executor work pauses as `needs-reconcile` before verification or delivery. If remote inspection is unavailable, this guard cannot make a remote-state claim and the local policy determines whether execution may continue. `forge reconcile` previews by default and performs a mutation-blocked provider preflight so provider-confirmed no-ops are separated from executable changes; `--run-id <id> --apply` can record an eligible pre-claim import or reconciliation pause in the schema v2 ledger, but it never silently approves or resumes a run.

## Runtime indexes

Runtime indexes are generated evidence, not trusted memory. They belong under `.ai-agent-playbook/runtime/indexes/` when written, and they should be promoted into memory only through an explicit canon review.

`index build` can write the file inventory with `--apply`. `index search` is always read-only and scans local text on demand. `index symbol-outline` is a read-only preview in this batch: it returns function, class, component, method, and binding hints with file, line, language, confidence, and source pattern metadata, but does not create `.ai-agent-playbook/runtime/indexes/symbol-outline.json`.

The symbol outline uses lightweight local patterns for common JS/TS, Python, Java, Kotlin, C#, Go, PHP, Ruby, and Rust source files. It skips dependency/generated folders, large files, and `.ai-agent-playbook/runtime/`. Treat low-confidence entries as navigation hints, not canonical architecture.

`index dependency-inventory` is also read-only. It reports dependency manifests, adjacent lockfiles, package script names, Docker/Compose image hints, and GitHub Actions `uses:` entries without running package scripts, building containers, contacting registries, or fetching vulnerability databases. Missing adjacent lockfiles are warnings, not failures.

`index route-api-hints` previews route declarations, client API calls, SQL query targets, migrations, and data-object hints. It uses lightweight local patterns for common server frameworks and SQL syntax, includes file/line/confidence/source metadata, and does not claim the result is a complete API or data map.

Runtime artifact JSON must keep a stable evidence envelope: `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, and `conflicts`. Canon promotion refuses runtime sources that do not satisfy this envelope, so generated evidence cannot silently become trusted memory when its shape is stale or malformed.

`runtime capability-history` reads `.ai-agent-playbook/runtime/reports/capability-history.jsonl` as an optional append-only local signal. It summarizes capability status, latest duration, baseline, and drift without running benchmarks, contacting networks, or enabling telemetry. Entries should use portable evidence paths; non-portable paths are omitted from output and reported as warnings.

`runtime schema-check` validates target-relative JSON without writing files. It supports the generic runtime artifact envelope plus compact schemas for eval definitions, eval run reports, capability witnesses, evidence envelopes, repo graphs, and `.ai-agent-playbook/knowledge/sources.json`. Compact schema checks reject local absolute paths, credential-looking values, duplicate source ids, invalid enum values, non-portable artifact or graph paths, dangling graph edges, and oversized inline evidence, so generated reports and source registry entries stay reviewable before any canon or documentation promotion.

`graph preview` builds a read-only `runtime.repo-graph` report from current file inventory, symbol outline, dependency inventory, and route/API/data hints. It records compact nodes and source-backed edges for review, but it remains generated runtime evidence. Use canon or documentation promotion before moving stable facts into memory maps.

`writing naturalness-check` is also read-only. It reads one target-relative text file and reports Korean or English prose signals such as translationese, AI-writing phrases, inflated tone, repeated sentence rhythm, and English-term density. `writing naturalness-report` applies the same checks to a bounded Markdown/MDX/text folder so translation or documentation batches can be triaged before opening individual files. Both commands ignore fenced code, inline code, shell commands, URLs, HTML-only badge lines, and path examples before scoring prose. `--engine auto` combines the built-in JavaScript fallback with the optional Python engine when available; the JSON result reports `engines.used` and `engines.unavailable`. They never rewrite files, call a network service, judge authorship, or bypass detectors. Use the result as an editing checklist before changing README text, docs, translations, PR bodies, release notes, or public summaries.

## Workflow run records

`workflow run-preview` reads a target-local recipe first, falls back to the bundled recipe, parses the run contract, and returns generated evidence without writing files.

`workflow run-start` belongs to the scaffold tier, not project-write. It writes only under `.ai-agent-playbook/workflows/runs/` after an explicit `--apply`, creating a bounded run manifest, criteria checklist, evidence notes stub, and handoff stub. It rejects missing recipes, empty manifests, path traversal, project-source destinations, trusted memory destinations, and unsafe overwrites.

Run records are operational logs, not durable project truth. Promote only reviewed, stable facts into `memory/`, `contracts/`, maps, decisions, or runbooks through the canon/documentation flow.

## Resumable automation ledger

`plan new --automation` pairs human-readable Markdown with a `workflow.plan.v2` JSON sidecar. The sidecar carries stable task IDs, dependencies, priority, risk, acceptance criteria, argv verification commands, delivery group, and remote eligibility. `plan validate` reports both structural validity and whether an explicitly approved plan is ready to run.

Version suffixes in `schemaVersion`, persisted artifact kinds, `workflow.plan.v2`, and provider API names identify serialized compatibility contracts. They do not divide the implementation into parallel v1, v2, or v3 feature trees; source modules continue to be organized by responsibility. Older persisted contracts remain readable only where an explicit compatibility path is tested.

`automation start` creates a schema v2 run directory with `manifest.json`, `tasks.json`, append-only `ledger.jsonl`, derived `state.json`, `remote.json`, `lease.json`, `summary.md`, `handoff.md`, and `evidence/`. Legacy schema v1 runs are read-compatible and remain read-only; the compatibility path does not overwrite or silently upgrade them.

The task path is `planned -> ready -> claimed -> running -> verifying -> review -> completed`, with `paused`, `blocked`, and `cancelled` interruption states. Progress is completed tasks divided by total tasks and passed criteria divided by total criteria. Attempts, commits, generated code, executor claims, and elapsed time do not count as progress.

Each task keeps two attempt counters with different authority. `attempts` is the resettable retry-budget usage; `attemptSerial` is the monotonic count of claims reconstructed from the append-only ledger. `automation resume --reset-attempts` clears only the budget usage and last failure. It does not rewrite history or reduce `attemptSerial`, so later attempt, evidence, workspace, delivery, and recovery event IDs remain unique.

One controller writes the ledger. A local lease uses a 30-second heartbeat, two-minute expiry, and monotonically increasing fencing token. A tick claims at most one dependency-ready task, invokes the selected executor with a scrubbed environment, has the controller rerun declared verification, records evidence, performs permitted Git/forge delivery, and checkpoints before releasing the lease. The supervisor repeats these short ticks within configured budgets.

`automation start` is itself a write command and can coordinate remotely under the effective profile; it has no `--apply` preview gate. Use plan validation, forge previews, and `--no-remote` when a local-only run is intended. Hosted and OS schedules remain preview-first and require `automation schedule --apply`. Generated hosted workflows pin both start and tick to the exact package version read from release metadata. A differing workflow already present in the target remains untouched, so upgrading a previously copied workflow requires a reviewed pin update instead of an automatic overwrite.

## MCP tool surface

Start the local server with:

```powershell
npx ai-agent-playbook mcp
```

An MCP-capable AI app can register that command and then call tools such as `runtime_schema_check`, `operator_search`, `automation_status`, `automation_plan_validate`, `forge_status`, `forge_bootstrap_plan`, and `forge_sync_plan`. Forge plan tools require a target and use the same target-aware provider/capability inspection as their gated apply counterparts. Forge sync also requires reviewed roadmap/delivery-group coordination and does not infer task-per-issue mode. These default tools do not execute a task or mutate remote state.

`--enable-write-tools` adds the existing bounded playbook write tools. The independent `--enable-forge-write-tools` gate adds only `forge_bootstrap_apply` and `forge_sync_apply`; both require a call argument `apply: true`. Even with both gates, MCP does not expose push, automation tick/supervisor, merge, release, delete, force-push, arbitrary project source writes, AST rewrite/apply, or LSP rename.

## Skills lifecycle

`skills` commands manage installable skills without requiring the PowerShell wrappers.

- `skills check` is read-only and reports missing, managed, modified, adoptable, or conflicting installed skills.
- `skills lint` is read-only and reviews source `SKILL.md` files for trigger-focused descriptions, frontmatter shape, missing reference links, and shallow reference files before publishing. JSON output includes depth metrics so short trigger files can stay short while reusable procedures live in references.
- `skills install` and `skills update` are idempotent sync commands. `--dry-run` writes nothing. Without `--dry-run`, they create or refresh managed skills and write `.ai-agent-playbook-install.json` markers.
- `skills check` is read-only and exits non-zero when required installed skills are missing, locally modified, or blocked by unmanaged conflicts.
- `skills uninstall` removes only unmodified managed skills. `--dry-run` previews the removals.
- Managed skills are replaced only when their current hash still matches the marker, unless `--force-managed` is provided.
- Same-name unmanaged skills are adopted only when their content matches the source, unless `--force-unmanaged` is provided.
- Default roots are the user's `.codex/skills` and `.agents/skills`; legacy skills are also placed under `.agents/skills/legacys/`.

## Bootstrap behavior

- Copies `templates/project-playbook/` to `<target>/.ai-agent-playbook/`.
- Writes a thin `<target>/AGENTS.md` from `templates/agents/global/AGENTS.md`. This is a project-root bootstrap, not Codex's personal `~/.codex/AGENTS.md`.
- Includes `.ai-agent-playbook/policy/SKILLS.md` and `.ai-agent-playbook/policy/GIT.md` as part of the project playbook.
- Merges a stack profile into `AGENTS.md` when `--profile <name>` is provided.
- Appends `.ai-agent-playbook/` to `.gitignore` only when `--local-only` is provided.
- Writes `.ai-agent-playbook/.ai-agent-playbook-install.json` to mark files copied by this playbook. The marker stores only portable relative paths and content hashes.
- Refuses to overwrite existing files unless `--force` is provided.
- Preflights all planned writes before creating files. If a conflict is found, the command reports it without leaving a partial `.ai-agent-playbook/` tree behind.

Compatibility: new bootstrap output uses `.ai-agent-playbook/`. Legacy `ai-playbook/` folders are no longer active runtime roots; use `migrate path` to preview and apply the explicit folder migration before running project playbook commands. If both folders exist, runtime commands read `.ai-agent-playbook/` and diagnostics warn about the legacy folder.

## Path migration

`migrate path` helps projects move from the legacy `ai-playbook/` folder to `.ai-agent-playbook/`.

```powershell
npx ai-agent-playbook migrate path <target> --json
```

The default mode is a no-write preview. It reports the planned folder move, root/playbook reference updates from `ai-playbook/` to `.ai-agent-playbook/`, and whether `.gitignore` should add `.ai-agent-playbook/` while keeping the legacy ignore entry during the transition.

Use `--apply` only after reviewing the preview. Apply mode renames the folder, updates references in the root `AGENTS.md` and playbook markdown or JSON files, and appends `.ai-agent-playbook/` to `.gitignore` when needed. It does not call the network, install hooks, or edit unrelated project files.

If both `ai-playbook/` and `.ai-agent-playbook/` exist, the command reports a conflict and writes nothing.

## Managed manifest

`managed` commands inspect or maintain the project-level install marker at `.ai-agent-playbook/.ai-agent-playbook-install.json`.

```powershell
npx ai-agent-playbook managed catalog <target> --json
```

`managed check` is read-only and returns `{ schemaVersion, ok, target, manifestPath, summary, files, warnings, conflicts }`. Missing or malformed manifests fail the check. Missing or locally modified managed files are reported as conflicts so cleanup cannot silently remove project-specific edits.

`managed catalog` is read-only and returns `{ schemaVersion, ok, target, manifestPath, manifest, summary, files, warnings, conflicts }`. The summary groups managed files by kind and status so an operator can see which bootstrap, playbook, and guide files are still owned by the marker before deleting anything.

`managed adopt` is for older projects that already match the current templates but do not have a marker. Preview mode writes nothing. Apply mode records only files whose current content hash matches the source template hash.

`managed prune` is a targeted preview-first removal for one managed file. It accepts only portable relative paths, allows Windows-style separators in the CLI input, refuses unmanaged, missing, modified, or absolute paths, and writes only when `--apply` is provided. Apply mode removes the selected unmodified file and updates the manifest; it does not edit `.gitignore`.

`managed uninstall` is also preview-first. Apply mode removes only unmodified managed files. Modified files are preserved and reported as conflicts. The command does not edit `.gitignore`; it returns a manual cleanup warning when the manifest says the playbook was installed as local-only.

## Doctor checks

`doctor` checks for the minimum `.ai-agent-playbook/` layout, root `AGENTS.md`, whether root `AGENTS.md` points to the core playbook files, unexpected root `SKILLS.md` or `GIT.md`, local-only policy, unadapted core template prompts, worklog summary freshness, obsolete split style skills, and fixed local absolute paths. In default mode, warnings do not fail the command. In `--strict` mode, warnings fail.

Fresh bootstrap output can warn about `playbook adaptation` because `START_HERE.md`, `CURRENT.md`, and `questions.md` still contain template prompts. Treat that as a reminder to adapt the playbook after repo inspection, not as a bootstrap failure.

Use `--json` when a hook, wrapper, or automation needs stable machine-readable output. The JSON contract is versioned with `schemaVersion: "1"` and includes `summary` plus `checks[]` entries with `id`, `level`, `category`, `name`, `message`, and `paths`. The current text output remains the human default.

Worklog summary freshness checks are read-only. They warn when a month has detailed worklogs under `.ai-agent-playbook/workflows/worklogs/YYYY-MM/` but no `.ai-agent-playbook/workflows/worklogs/summaries/YYYY-MM.md`, or when the summary is older than a detailed entry in that month.

Use `doctor --reminder --json` when a wrapper or script needs a small non-blocking signal instead of the full doctor report. It returns `{ schemaVersion, ok, target, reminders }`. Reminder entries use `{ id, level, message, paths }`. The command does not write files and exits successfully after emitting the signal; callers should inspect `ok` and `reminders`.

## Guide sync

`guides sync` copies current guide templates from this repository to `<target>/.ai-agent-playbook/knowledge/references/guides/`.

- Default behavior keeps existing guide files and copies only missing guide files.
- Use `--dry-run` first to preview additions.
- Use `--check` to report missing guide files without writing anything. Add `--json` for automation.
- `--check --json` compares guide templates against the source guide manifest and reports `present`, `missing`, or `stale` for each guide. Entries include `sourceHash` and, when the target file exists, `targetHash`.
- Add `--diff` with `--check` to include the first differing line and source/target line counts for stale guides. This is still read-only.
- Stale guides do not fail the default check. They are review signals so local guide edits are not overwritten silently.
- Use `--force` only when you intentionally want to replace existing guide files with the current template versions.
- This command does not update `AGENTS.md`, `.ai-agent-playbook/policy/SKILLS.md`, `.ai-agent-playbook/policy/GIT.md`, `CURRENT.md`, plans, worklogs, or project-specific notes.

## Context output

`context` creates compact hook-ready project context from:

- `.ai-agent-playbook/START_HERE.md`
- `.ai-agent-playbook/CURRENT.md`
- `.ai-agent-playbook/policy/SKILLS.md`
- `.ai-agent-playbook/policy/GIT.md`

`CURRENT.md` is the place for current facts, active risks, decisions, and short project vocabulary. Larger structural facts, scan ranges, and duplicate or clone cues belong in maps. The context command does not read or re-inject root `AGENTS.md` by default. Use `--json` to return `{ schemaVersion, ok, target, sources, additionalContext, warnings }`. Use `--max-chars N` to cap injected context for hook environments.

When context is too broad, narrow before reading more. Use `operator context --path <file> --json` to preview path-scoped context, rules, maps, runbooks, decisions, contracts, and guides. Use `operator search` or `index search` to find relevant playbook notes before loading large files. Keep raw generated reports in `runtime/` and promote only concise reviewed facts into `memory/` or `knowledge/`.

Path-scoped context lives under `.ai-agent-playbook/memory/context/`. Context markdown may use frontmatter fields `id`, `globs`, `alwaysApply`, `freshness`, and `priority`, with body sections such as `When to read`, `Current facts`, `Do not assume`, and `Verification hints`.

`context list` and `context status` are read-only. `context status --path <file> --json` returns `{ schemaVersion, ok, target, path, summary, contexts, docMap, warnings, conflicts }` so an operator can see which context files apply to a path and whether `.ai-agent-playbook/memory/maps/doc-map.md` exists. `context init` is preview-first and writes starter context and documentation-map files only when `--dry-run` is omitted.

## Runs ledger

The original `run start/status/record/summarize` surface captures manually recorded in-progress state and evidence. It is different from the schema v2 automation controller and from `worklogs/`:

- `runs/` is for the current task: criteria, evidence, blockers, cleanup, and resumable status.
- `worklogs/` is for durable history after milestones, blockers, direction changes, or long debugging.

`run start` creates `.ai-agent-playbook/workflows/runs/<run-id>/` with `brief.md`, `criteria.json`, `ledger.jsonl`, `evidence/`, and `summary.md`. The ledger is append-only JSONL. `run record` appends note, criterion, evidence, blocker, or cleanup events and rejects local absolute paths or credential-looking messages. `run status` is read-only. `run summarize` is preview-first and renders the ledger into `summary.md`.

## Contracts

`contracts/` captures important business rules and invariants as markdown. Active contracts live under `.ai-agent-playbook/memory/contracts/active/`; drafts live under `.ai-agent-playbook/memory/contracts/pending/`. Contract frontmatter supports `id`, `status`, `appliesTo`, `risk`, `approvedAt`, and `freshness`.

`contracts list` and `contracts check` are read-only. `contracts check --path <file> --json` reports matching active and pending contracts, missing `appliesTo` paths, stale freshness dates, pending-only matches, empty `Required evidence` sections, and contract hash snapshot drift when `.ai-agent-playbook/memory/contracts/.hashes.json` exists. It does not run tests, judge correctness, block commits, approve rules, or edit files.

`contracts snapshot` is preview-first. By default it reports the contract, `appliesTo`, and Required evidence paths that would be hashed. `--apply` writes only `.ai-agent-playbook/memory/contracts/.hashes.json`, with portable relative paths and hashes. The snapshot is a freshness aid for operators; it is not an approval cache. `contracts init` is preview-first and writes only the starter folder structure.

## Operator diagnostics

The diagnostics commands are operator-triggered signals. They help a human or agent decide what to inspect next; they do not install hooks, run project commands, or call the network. The audit, check, search, preflight, delta, research, context, analyze, map, rules, diagnostics, TUI, and PNG image-diff commands are read-only. `operator gc` is preview-first and writes only when `--apply` is provided.

`operator check` is the combined human checkpoint:

```powershell
npx ai-agent-playbook operator check <target> --json
```

It aggregates `doctor`, `guides sync --check`, `diagnostics check`, and `rules check` into one report. `--path` is forwarded to rule matching. `--diff` includes the same first-difference guide details as `guides sync --check --diff`. JSON output returns `{ schemaVersion, ok, target, path, summary, checks, sections }`, where `sections` contains the original `doctor`, `guides`, `diagnostics`, and `rules` reports. Missing guide templates or doctor failures fail the combined check; stale guides and diagnostics warnings stay as warning-level operator signals.

`operator search` is a local read-only explorer:

```powershell
npx ai-agent-playbook operator search <target> --query "auth flow" --json
```

It scans text files under the target project and excludes common generated or dependency folders such as `.git`, `node_modules`, `dist`, `build`, `.next`, `.turbo`, and `coverage`. JSON output returns `{ schemaVersion, ok, target, query, path, summary, results, related }`. Results include relative path, category, score, match count, and snippets. No-match searches exit successfully with `summary.matches: 0`. When `--path` is provided, `related.rules` summarizes matching project rules for that file; `related.diagnostics` lists local verification command candidates without running them.

`operator research` is the explicit deep local research mode:

```powershell
npx ai-agent-playbook operator research <target> --query "auth flow risk" --path src/example.ts --max-results 50 --json
```

Use it when quick search is too shallow and the operator wants a broader evidence report. It expands the query into research axes, scans local text files, correlates source, tests, `.ai-agent-playbook/`, rules, plans, worklogs, diagnostics, and codebase map signals, and returns `gaps`, `nextSteps`, and a `reportMarkdown` summary. JSON output returns `{ schemaVersion, ok, target, query, path, mode, summary, axes, evidence, gaps, nextSteps, related, reportMarkdown }`. `mode` is always `{ localOnly: true, network: false, writes: false }` in this version. It does not require slash commands, does not call an AI model, does not browse the web, and does not create report files.

`operator context` previews path-scoped playbook context without injecting it:

```powershell
npx ai-agent-playbook operator context <target> --path src/example.ts --json
```

It reports the core context files that exist, `.ai-agent-playbook/memory/context/**/*.md` files whose `globs` or `alwaysApply` frontmatter applies to the path, matching project rules, `.ai-agent-playbook/memory/maps/doc-map.md`, and related maps, runbooks, decisions, or guides that mention the path or file name. JSON output returns `{ schemaVersion, ok, target, path, summary, coreSources, contexts, docMap, rules, related, warnings }`. This command does not write context files, run project commands, or install hooks.

`operator preflight` and `operator delta` provide an explicit before/after evidence gate without blocking work:

```powershell
npx ai-agent-playbook operator preflight <target> --intent "auth flow change" --path src/example.ts --json > preflight.json
npx ai-agent-playbook operator delta <target> --before preflight.json --json
```

Preflight returns candidate files, rule/context/contract signals, intent terms, and a portable snapshot of relative paths, hashes, sizes, and mtimes. It does not write the snapshot file; use shell redirection when you want to keep it. Delta compares that saved JSON with the current target and reports added, deleted, modified, out-of-scope, and playbook/rule/context changes. It does not judge correctness or approve completion.

`operator analyze` combines the current read-only operator signals:

```powershell
npx ai-agent-playbook operator analyze <target> --path src/example.ts --json
```

It returns diagnostics, codebase map, matching rules, optional path-scoped context, and optional analysis setup signals in one report. AST, LSP, and comment-quality tools are reported as local setup signals only. This command does not install tools, run language servers, run structural search, edit files, or call the network.

Use `--deep` when stronger local analysis is useful:

```powershell
npx ai-agent-playbook operator analyze <target> --deep --path src/example.ts --json
```

Deep mode adds local AST-grep structural search, exact normalized function-body clone cues, and TypeScript/JavaScript status, diagnostics, symbols, references, and definitions. Clone cues are review starting points only; they do not claim semantic equivalence. Deep mode is still read-only. It does not rename symbols, rewrite AST matches, run project commands, or call the network.

`operator map` summarizes the local codebase shape:

```powershell
npx ai-agent-playbook operator map <target> --json
```

It reads local project files and reports stack manifests, detected package manager, source language counts, framework dependencies, top-level structure, entrypoint candidates, module boundary directories, quality configs, test file samples, verification command candidates, TODO/debug/security signal snippets, and a compact summary. Common dependency and generated folders are excluded. JSON output returns `{ schemaVersion, ok, target, summary, stack, architecture, quality, concerns, warnings }`. It is read-only and does not create `.ai-agent-playbook/memory/maps/` files; use the report as evidence before deciding what to promote into durable project maps.

`operator audit` checks playbook drift without writing files:

```powershell
npx ai-agent-playbook operator audit <target> --json
```

It scans the project playbook for broken relative markdown links, context files whose `globs` no longer match any current project file, missing doc-map targets, contract `appliesTo` drift, duplicate playbook markdown content, simultaneous `.ai-agent-playbook/` and legacy `ai-playbook/` folders, and managed manifest drift. JSON output returns `{ schemaVersion, ok, target, summary, findings, sections, warnings }`. Broken internal links and malformed manifests are fail-level findings; orphan context, missing doc-map targets, contract drift, duplicate content, legacy path drift, and managed file drift are warning-level findings.

`operator gc` is a preview-first cleanup for obsolete managed playbook files:

```powershell
npx ai-agent-playbook operator gc <target> --json
npx ai-agent-playbook operator gc <target> --apply --json
```

Preview mode writes nothing. Apply mode only removes files listed in `.ai-agent-playbook/.ai-agent-playbook-install.json` when all of these are true: the original source template no longer exists in the current checkout, the target file is still under the active playbook directory, and the current target hash still matches the manifest `targetHash`. Modified files are reported as conflicts and preserved. JSON output returns `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`.

`rules check` discovers portable rule files and reports which rules apply to a path:

```powershell
npx ai-agent-playbook rules check <target> --path src/example.ts --json
```

Rule discovery intentionally excludes root `AGENTS.md`, because supported agents usually load it natively. Current rule sources are `.ai-agent-playbook/rules/**/*.md`, `.github/instructions/**/*.md`, `.cursor/rules/**/*.md`, `.claude/rules/**/*.md`, `.github/copilot-instructions.md`, and `CONTEXT.md`. Directory rules may use simple frontmatter such as `alwaysApply: true` or `globs: ["src/**/*.ts"]`. JSON output returns `{ schemaVersion, ok, target, path, summary, rules, warnings }`.

`diagnostics check` reads local project metadata and lists likely verification commands without executing them:

```powershell
npx ai-agent-playbook diagnostics check <target> --json
```

It currently detects common `package.json` scripts plus basic Python, Rust, and Go project markers. Package scripts are rendered with the detected package manager from lockfiles such as `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, or Bun lockfiles. JSON output includes `packageManager`. A missing command set is a warning, not a failure, because some projects keep verification in runbooks or external CI.

`qa tui-check` checks captured terminal output for width overflow, CJK wide-character columns, ANSI presence, and simple box-drawing alignment:

```powershell
npx ai-agent-playbook qa tui-check .\capture.txt --cols 100 --json
```

This command exits non-zero when overflow or border misalignment is found. It is meant for terminal UI, CLI table, log, report, and Korean/Japanese/Chinese text layout checks. Browser screenshot review still belongs in the target project's browser tooling or visual QA guide.

`qa image-diff` compares two PNG files without writing a diff image:

```powershell
npx ai-agent-playbook qa image-diff .\before.png .\after.png --threshold 0.01 --json
```

It returns dimensions, changed pixels, diff ratio, similarity score, and hotspot cells. It supports PNG only and does not capture browsers, manage baselines, call a visual oracle, or write files.

## Adapter config and readiness

`adapter config` renders copy-paste-safe local hook configuration for manual setup. It is read-only: it does not create settings files, install hooks, edit project files, or call the network.

```powershell
npx ai-agent-playbook adapter config <target> --adapter codex --json
```

Use `--json` to return `{ schemaVersion, ok, target, adapter, hookCommand, config, warnings }`. `hookCommand` and `config` use the current checkout path and do not include `<path-to-ai-agent-playbook>` placeholders. A missing `.ai-agent-playbook/` folder is reported as a warning, not as a config rendering failure.

`adapter check` is a read-only self-check before manually enabling an optional hook adapter.

```powershell
npx ai-agent-playbook adapter check <target> --adapter codex --json
```

The command verifies the target path, `.ai-agent-playbook/`, non-empty core context, adapter hook files, example settings, supported hook JSON for `SessionStart` and `PostCompact`, and quiet behavior for unsupported events or missing playbook context. It does not install hooks, write project files, call the network, or require a global command.

Use `--settings <path>` only after manually editing a local settings file. It adds checks for settings file existence, JSON parseability, and whether `SessionStart` and `PostCompact` point to the rendered local hook command. Use `--json` to return `{ schemaVersion, ok, target, adapter, summary, checks }`. Checks use the same `id`, `level`, `category`, `name`, `message`, and `paths` shape as `doctor`, so hook or setup automation can fail early without parsing human text.

## Adapter package shell

Adapter package shell entrypoints are optional local wrappers around the same hook, config, and check helpers. They are not installed automatically and do not change local settings.

```powershell
node .\adapters\codex\package.mjs config <target> --json
node .\adapters\codex\package.mjs check <target> --json
node .\adapters\codex\package.mjs hook
node .\adapters\claude-code\package.mjs config <target> --json
node .\adapters\claude-code\package.mjs check <target> --json
node .\adapters\claude-code\package.mjs hook
```

Use the main CLI as the stable default surface. The package shell is a convenience for adapter-local experiments and packaging smoke tests.

## Lifecycle reminder hooks

The adapter hook examples enable only context refresh events by default:

- `SessionStart`
- `PostCompact`

`UserPromptSubmit`, `PostToolUse`, and `Stop` are opt-in reminder events. Enable them only in a local hook configuration by setting `AI_AGENT_PLAYBOOK_HOOK_EVENTS` to a comma-separated list:

```powershell
$env:AI_AGENT_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit` emits a short guardrail reminder only when the prompt appears to involve commit, push, PR, merge, worklog, or doctor-style handoff work. `PostToolUse` emits a short reminder only for edit-like tool payloads where the hook can read changed file paths. Both stay silent when `.ai-agent-playbook/` is missing, when the event is not opted in, or when no relevant intent/path is found.

`Stop` emits a short end-of-session reminder only when explicitly opted in and the target has a playbook. It is intended as a final handoff nudge, not as a blocking or continuation mechanism.

These reminders are intentionally narrow. They do not run `doctor`, block tool calls, continue sessions, rewrite tool output, write files, or call the network.

## Scaffold rules

- Plans are created under `.ai-agent-playbook/workflows/plans/YYYY-MM-DD-<slug>.md`.
- Runs are created under `.ai-agent-playbook/workflows/runs/<run-id>/`.
- Contract starters are created under `.ai-agent-playbook/memory/contracts/`.
- Worklogs are created under `.ai-agent-playbook/workflows/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`.
- Monthly summaries are created under `.ai-agent-playbook/workflows/worklogs/summaries/YYYY-MM.md`.
- Existing files are not overwritten unless `--force` is provided.

## Design constraints

- Keep the Node CLI facade dependency-light; add JavaScript runtime dependencies only when a concrete read-only feature requires one, and prefer optional Python engines for heavier local language or analysis work.
- Keep commands deterministic and file-system focused.
- Do not encode project-specific product facts in the runtime.
- Keep reusable templates relative-path based.
- Treat local scratch and reference material as development-only input, never as target-project guidance.
- Do not require plugin hooks, slash commands, global installs, or network access for the default harness.
- Optional hook adapters should inject context or reminders only; they should not rewrite tool output or edit project files automatically.
