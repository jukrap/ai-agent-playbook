# Runtime Harness

`ai-playbook` is the executable surface for installing reusable skills and applying this repository to a target project. It does not call an AI model. It copies templates, checks project-memory health, and creates predictable context, run, contract, plan, and worklog files so agents stop inventing ad hoc markdown paths.

The MCP server is the AI-facing read-only tool surface. It lets an MCP-capable app call the same local diagnostics and analysis helpers without the user memorizing every CLI command. It is still local stdio, no-network, and no-write in this version.

This CLI and the project playbook are the default harness. Runtime hooks or plugins are optional extensions and should stay outside the default path until their behavior is explicit, local, and easy to disable. See `docs/runtime-roadmap.md` for the staged design.

Keep the install scopes separate:

- `npx ai-agent-playbook ...` runs the published package without adding it to the current project.
- `npm install -g ai-agent-playbook` installs the `ai-playbook` command globally.
- `npm install -D ai-agent-playbook` pins the CLI in one project but does not copy skills or create `.ai-playbook/`.
- `ai-playbook mcp` starts a local stdio MCP server for an AI app. It does not write project files by itself.
- `skills install` and `skills update` write only user-level skill copies.
- `bootstrap`, `guides sync`, and `managed` commands are the project-level playbook operations.

## Command surface

The detailed command reference lives in [Command guide](commands.md). Keep this file focused on runtime behavior and safety rules.

Use `npx ai-agent-playbook ...` for the published package, `ai-playbook ...` after a global install, or `node .\bin\ai-playbook.mjs ...` from a local checkout.

The short role split is:

- CLI: explicit human/operator commands, including preview-first writes.
- MCP: read-only AI tool calls for context, diagnostics, search, contracts, managed state, QA, AST search, exact function-body clone cues, and TypeScript/JavaScript analysis.
- Skills: reusable working guidance loaded by agent environments.
- `.ai-playbook/`: target-project memory, runs, contracts, guides, plans, and worklogs.
- Adapters: optional environment-specific hook/config rendering; never the default install path.

## Runtime indexes

Runtime indexes are generated evidence, not trusted memory. They belong under `.ai-playbook/runtime/indexes/` when written, and they should be promoted into memory only through an explicit canon review.

`index build` can write the file inventory with `--apply`. `index search` is always read-only and scans local text on demand. `index symbol-outline` is a read-only preview in this batch: it returns function, class, component, method, and binding hints with file, line, language, confidence, and source pattern metadata, but does not create `.ai-playbook/runtime/indexes/symbol-outline.json`.

The symbol outline uses lightweight local patterns for common JS/TS, Python, Java, Kotlin, C#, Go, PHP, Ruby, and Rust source files. It skips dependency/generated folders, large files, and `.ai-playbook/runtime/`. Treat low-confidence entries as navigation hints, not canonical architecture.

`index dependency-inventory` is also read-only. It reports dependency manifests, adjacent lockfiles, package script names, Docker/Compose image hints, and GitHub Actions `uses:` entries without running package scripts, building containers, contacting registries, or fetching vulnerability databases. Missing adjacent lockfiles are warnings, not failures.

## MCP tool surface

Start the local server with:

```powershell
npx ai-agent-playbook mcp
```

An MCP-capable AI app can register that command and then call tools such as `operator_search`, `operator_research`, `operator_analyze_deep`, `source_function_clones`, `ast_grep_search`, `lsp_symbols`, `contracts_check`, `managed_check`, and `qa_image_diff`.

The MCP server exposes only read-only tools. It does not expose bootstrap, skill install/update/uninstall, managed apply operations, contract snapshot apply, run record, AST rewrite/apply, LSP rename, automatic doctor execution, or blocking/continuation behavior.

## Skills lifecycle

`skills` commands manage installable skills without requiring the PowerShell wrappers.

- `skills check` is read-only and reports missing, managed, modified, adoptable, or conflicting installed skills.
- `skills lint` is read-only and reviews source `SKILL.md` files for trigger-focused descriptions, frontmatter shape, and missing reference links before publishing.
- `skills install` and `skills update` are idempotent sync commands. `--dry-run` writes nothing. Without `--dry-run`, they create or refresh managed skills and write `.ai-agent-playbook-install.json` markers.
- `skills check` is read-only and exits non-zero when required installed skills are missing, locally modified, or blocked by unmanaged conflicts.
- `skills uninstall` removes only unmodified managed skills. `--dry-run` previews the removals.
- Managed skills are replaced only when their current hash still matches the marker, unless `--force-managed` is provided.
- Same-name unmanaged skills are adopted only when their content matches the source, unless `--force-unmanaged` is provided.
- Default roots are the user's `.codex/skills` and `.agents/skills`; legacy skills are also placed under `.agents/skills/legacys/`.

## Bootstrap behavior

- Copies `templates/project-playbook/` to `<target>/.ai-playbook/`.
- Writes a thin `<target>/AGENTS.md` from `templates/agents/global/AGENTS.md`. This is a project-root bootstrap, not Codex's personal `~/.codex/AGENTS.md`.
- Includes `.ai-playbook/SKILLS.md` and `.ai-playbook/GIT.md` as part of the project playbook.
- Merges a stack profile into `AGENTS.md` when `--profile <name>` is provided.
- Appends `.ai-playbook/` to `.gitignore` only when `--local-only` is provided.
- Writes `.ai-playbook/.ai-agent-playbook-install.json` to mark files copied by this playbook. The marker stores only portable relative paths and content hashes.
- Refuses to overwrite existing files unless `--force` is provided.
- Preflights all planned writes before creating files. If a conflict is found, the command reports it without leaving a partial `.ai-playbook/` tree behind.

Compatibility: new bootstrap output uses `.ai-playbook/`. Runtime commands still read and write an existing legacy `ai-playbook/` folder when `.ai-playbook/` is absent, so older projects can migrate gradually. If both folders exist, `.ai-playbook/` is preferred.

## Path migration

`migrate path` helps projects move from the legacy `ai-playbook/` folder to `.ai-playbook/`.

```powershell
npx ai-agent-playbook migrate path <target> --json
```

The default mode is a no-write preview. It reports the planned folder move, root/playbook reference updates from `ai-playbook/` to `.ai-playbook/`, and whether `.gitignore` should add `.ai-playbook/` while keeping the legacy ignore entry during the transition.

Use `--apply` only after reviewing the preview. Apply mode renames the folder, updates references in the root `AGENTS.md` and playbook markdown or JSON files, and appends `.ai-playbook/` to `.gitignore` when needed. It does not call the network, install hooks, or edit unrelated project files.

If both `ai-playbook/` and `.ai-playbook/` exist, the command reports a conflict and writes nothing.

## Managed manifest

`managed` commands inspect or maintain the project-level install marker at `.ai-playbook/.ai-agent-playbook-install.json`.

```powershell
npx ai-agent-playbook managed catalog <target> --json
```

`managed check` is read-only and returns `{ schemaVersion, ok, target, manifestPath, summary, files, warnings, conflicts }`. Missing or malformed manifests fail the check. Missing or locally modified managed files are reported as conflicts so cleanup cannot silently remove project-specific edits.

`managed catalog` is read-only and returns `{ schemaVersion, ok, target, manifestPath, manifest, summary, files, warnings, conflicts }`. The summary groups managed files by kind and status so an operator can see which bootstrap, playbook, and guide files are still owned by the marker before deleting anything.

`managed adopt` is for older projects that already match the current templates but do not have a marker. Preview mode writes nothing. Apply mode records only files whose current content hash matches the source template hash.

`managed prune` is a targeted preview-first removal for one managed file. It accepts only portable relative paths, allows Windows-style separators in the CLI input, refuses unmanaged, missing, modified, or absolute paths, and writes only when `--apply` is provided. Apply mode removes the selected unmodified file and updates the manifest; it does not edit `.gitignore`.

`managed uninstall` is also preview-first. Apply mode removes only unmodified managed files. Modified files are preserved and reported as conflicts. The command does not edit `.gitignore`; it returns a manual cleanup warning when the manifest says the playbook was installed as local-only.

## Doctor checks

`doctor` checks for the minimum `.ai-playbook/` layout, root `AGENTS.md`, whether root `AGENTS.md` points to the core playbook files, unexpected root `SKILLS.md` or `GIT.md`, local-only policy, unadapted core template prompts, worklog summary freshness, obsolete split style skills, and fixed local absolute paths. In default mode, warnings do not fail the command. In `--strict` mode, warnings fail.

Fresh bootstrap output can warn about `playbook adaptation` because `START_HERE.md`, `CURRENT.md`, and `questions.md` still contain template prompts. Treat that as a reminder to adapt the playbook after repo inspection, not as a bootstrap failure.

Use `--json` when a hook, wrapper, or automation needs stable machine-readable output. The JSON contract is versioned with `schemaVersion: "1"` and includes `summary` plus `checks[]` entries with `id`, `level`, `category`, `name`, `message`, and `paths`. The current text output remains the human default.

Worklog summary freshness checks are read-only. They warn when a month has detailed worklogs under `.ai-playbook/worklogs/YYYY-MM/` but no `.ai-playbook/worklogs/summaries/YYYY-MM.md`, or when the summary is older than a detailed entry in that month.

Use `doctor --reminder --json` when a wrapper or script needs a small non-blocking signal instead of the full doctor report. It returns `{ schemaVersion, ok, target, reminders }`. Reminder entries use `{ id, level, message, paths }`. The command does not write files and exits successfully after emitting the signal; callers should inspect `ok` and `reminders`.

## Guide sync

`guides sync` copies current guide templates from this repository to `<target>/.ai-playbook/guides/`.

- Default behavior keeps existing guide files and copies only missing guide files.
- Use `--dry-run` first to preview additions.
- Use `--check` to report missing guide files without writing anything. Add `--json` for automation.
- `--check --json` compares guide templates against the source guide manifest and reports `present`, `missing`, or `stale` for each guide. Entries include `sourceHash` and, when the target file exists, `targetHash`.
- Add `--diff` with `--check` to include the first differing line and source/target line counts for stale guides. This is still read-only.
- Stale guides do not fail the default check. They are review signals so local guide edits are not overwritten silently.
- Use `--force` only when you intentionally want to replace existing guide files with the current template versions.
- This command does not update `AGENTS.md`, `.ai-playbook/SKILLS.md`, `.ai-playbook/GIT.md`, `CURRENT.md`, plans, worklogs, or project-specific notes.

## Context output

`context` creates compact hook-ready project context from:

- `.ai-playbook/START_HERE.md`
- `.ai-playbook/CURRENT.md`
- `.ai-playbook/SKILLS.md`
- `.ai-playbook/GIT.md`

`CURRENT.md` is the place for current facts, active risks, decisions, and short project vocabulary. Larger structural facts, scan ranges, and duplicate or clone cues belong in maps. The context command does not read or re-inject root `AGENTS.md` by default. Use `--json` to return `{ schemaVersion, ok, target, sources, additionalContext, warnings }`. Use `--max-chars N` to cap injected context for hook environments.

Path-scoped context lives under `.ai-playbook/context/`. Context markdown may use frontmatter fields `id`, `globs`, `alwaysApply`, `freshness`, and `priority`, with body sections such as `When to read`, `Current facts`, `Do not assume`, and `Verification hints`.

`context list` and `context status` are read-only. `context status --path <file> --json` returns `{ schemaVersion, ok, target, path, summary, contexts, docMap, warnings, conflicts }` so an operator can see which context files apply to a path and whether `.ai-playbook/maps/doc-map.md` exists. `context init` is preview-first and writes starter context and documentation-map files only when `--dry-run` is omitted.

## Runs ledger

`runs/` captures in-progress execution state and evidence. It is different from `worklogs/`:

- `runs/` is for the current task: criteria, evidence, blockers, cleanup, and resumable status.
- `worklogs/` is for durable history after milestones, blockers, direction changes, or long debugging.

`run start` creates `.ai-playbook/runs/<run-id>/` with `brief.md`, `criteria.json`, `ledger.jsonl`, `evidence/`, and `summary.md`. The ledger is append-only JSONL. `run record` appends note, criterion, evidence, blocker, or cleanup events and rejects local absolute paths or credential-looking messages. `run status` is read-only. `run summarize` is preview-first and renders the ledger into `summary.md`.

## Contracts

`contracts/` captures important business rules and invariants as markdown. Active contracts live under `.ai-playbook/contracts/active/`; drafts live under `.ai-playbook/contracts/pending/`. Contract frontmatter supports `id`, `status`, `appliesTo`, `risk`, `approvedAt`, and `freshness`.

`contracts list` and `contracts check` are read-only. `contracts check --path <file> --json` reports matching active and pending contracts, missing `appliesTo` paths, stale freshness dates, pending-only matches, empty `Required evidence` sections, and contract hash snapshot drift when `.ai-playbook/contracts/.hashes.json` exists. It does not run tests, judge correctness, block commits, approve rules, or edit files.

`contracts snapshot` is preview-first. By default it reports the contract, `appliesTo`, and Required evidence paths that would be hashed. `--apply` writes only `.ai-playbook/contracts/.hashes.json`, with portable relative paths and hashes. The snapshot is a freshness aid for operators; it is not an approval cache. `contracts init` is preview-first and writes only the starter folder structure.

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

Use it when quick search is too shallow and the operator wants a broader evidence report. It expands the query into research axes, scans local text files, correlates source, tests, `.ai-playbook/`, rules, plans, worklogs, diagnostics, and codebase map signals, and returns `gaps`, `nextSteps`, and a `reportMarkdown` summary. JSON output returns `{ schemaVersion, ok, target, query, path, mode, summary, axes, evidence, gaps, nextSteps, related, reportMarkdown }`. `mode` is always `{ localOnly: true, network: false, writes: false }` in this version. It does not require slash commands, does not call an AI model, does not browse the web, and does not create report files.

`operator context` previews path-scoped playbook context without injecting it:

```powershell
npx ai-agent-playbook operator context <target> --path src/example.ts --json
```

It reports the core context files that exist, `.ai-playbook/context/**/*.md` files whose `globs` or `alwaysApply` frontmatter applies to the path, matching project rules, `.ai-playbook/maps/doc-map.md`, and related maps, runbooks, decisions, or guides that mention the path or file name. JSON output returns `{ schemaVersion, ok, target, path, summary, coreSources, contexts, docMap, rules, related, warnings }`. This command does not write context files, run project commands, or install hooks.

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

It reads local project files and reports stack manifests, detected package manager, source language counts, framework dependencies, top-level structure, entrypoint candidates, module boundary directories, quality configs, test file samples, verification command candidates, TODO/debug/security signal snippets, and a compact summary. Common dependency and generated folders are excluded. JSON output returns `{ schemaVersion, ok, target, summary, stack, architecture, quality, concerns, warnings }`. It is read-only and does not create `.ai-playbook/maps/` files; use the report as evidence before deciding what to promote into durable project maps.

`operator audit` checks playbook drift without writing files:

```powershell
npx ai-agent-playbook operator audit <target> --json
```

It scans the project playbook for broken relative markdown links, context files whose `globs` no longer match any current project file, missing doc-map targets, contract `appliesTo` drift, duplicate playbook markdown content, simultaneous `.ai-playbook/` and legacy `ai-playbook/` folders, and managed manifest drift. JSON output returns `{ schemaVersion, ok, target, summary, findings, sections, warnings }`. Broken internal links and malformed manifests are fail-level findings; orphan context, missing doc-map targets, contract drift, duplicate content, legacy path drift, and managed file drift are warning-level findings.

`operator gc` is a preview-first cleanup for obsolete managed playbook files:

```powershell
npx ai-agent-playbook operator gc <target> --json
npx ai-agent-playbook operator gc <target> --apply --json
```

Preview mode writes nothing. Apply mode only removes files listed in `.ai-playbook/.ai-agent-playbook-install.json` when all of these are true: the original source template no longer exists in the current checkout, the target file is still under the active playbook directory, and the current target hash still matches the manifest `targetHash`. Modified files are reported as conflicts and preserved. JSON output returns `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`.

`rules check` discovers portable rule files and reports which rules apply to a path:

```powershell
npx ai-agent-playbook rules check <target> --path src/example.ts --json
```

Rule discovery intentionally excludes root `AGENTS.md`, because supported agents usually load it natively. Current rule sources are `.ai-playbook/rules/**/*.md`, `.github/instructions/**/*.md`, `.cursor/rules/**/*.md`, `.claude/rules/**/*.md`, `.github/copilot-instructions.md`, and `CONTEXT.md`. Directory rules may use simple frontmatter such as `alwaysApply: true` or `globs: ["src/**/*.ts"]`. JSON output returns `{ schemaVersion, ok, target, path, summary, rules, warnings }`.

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

Use `--json` to return `{ schemaVersion, ok, target, adapter, hookCommand, config, warnings }`. `hookCommand` and `config` use the current checkout path and do not include `<path-to-ai-agent-playbook>` placeholders. A missing `.ai-playbook/` folder is reported as a warning, not as a config rendering failure.

`adapter check` is a read-only self-check before manually enabling an optional hook adapter.

```powershell
npx ai-agent-playbook adapter check <target> --adapter codex --json
```

The command verifies the target path, `.ai-playbook/`, non-empty core context, adapter hook files, example settings, supported hook JSON for `SessionStart` and `PostCompact`, and quiet behavior for unsupported events or missing playbook context. It does not install hooks, write project files, call the network, or require a global command.

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

`UserPromptSubmit`, `PostToolUse`, and `Stop` are opt-in reminder events. Enable them only in a local hook configuration by setting `AI_PLAYBOOK_HOOK_EVENTS` to a comma-separated list:

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit` emits a short guardrail reminder only when the prompt appears to involve commit, push, PR, merge, worklog, or doctor-style handoff work. `PostToolUse` emits a short reminder only for edit-like tool payloads where the hook can read changed file paths. Both stay silent when `.ai-playbook/` is missing, when the event is not opted in, or when no relevant intent/path is found.

`Stop` emits a short end-of-session reminder only when explicitly opted in and the target has a playbook. It is intended as a final handoff nudge, not as a blocking or continuation mechanism.

These reminders are intentionally narrow. They do not run `doctor`, block tool calls, continue sessions, rewrite tool output, write files, or call the network.

## Scaffold rules

- Plans are created under `.ai-playbook/plans/YYYY-MM-DD-<slug>.md`.
- Runs are created under `.ai-playbook/runs/<run-id>/`.
- Contract starters are created under `.ai-playbook/contracts/`.
- Worklogs are created under `.ai-playbook/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`.
- Monthly summaries are created under `.ai-playbook/worklogs/summaries/YYYY-MM.md`.
- Existing files are not overwritten unless `--force` is provided.

## Design constraints

- Keep the CLI dependency-light; add runtime dependencies only when a concrete read-only feature requires one.
- Keep commands deterministic and file-system focused.
- Do not encode project-specific product facts in the runtime.
- Keep reusable templates relative-path based.
- Treat local scratch and reference material as development-only input, never as target-project guidance.
- Do not require plugin hooks, slash commands, global installs, or network access for the default harness.
- Optional hook adapters should inject context or reminders only; they should not rewrite tool output or edit project files automatically.
