# Runtime Harness

`ai-playbook` is the executable surface for applying this repository to a target project. It does not call an AI model. It copies templates, checks project-memory health, and creates predictable plan/worklog files so agents stop inventing ad hoc markdown paths.

This CLI and the project playbook are the default harness. Runtime hooks or plugins are optional extensions and should stay outside the default path until their behavior is explicit, local, and easy to disable. See `docs/runtime-roadmap.md` for the staged design.

## Command surface

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict] [--json]
node .\bin\ai-playbook.mjs doctor <target> --reminder [--json]
node .\bin\ai-playbook.mjs guides sync <target> [--dry-run] [--force]
node .\bin\ai-playbook.mjs guides sync <target> --check [--diff] [--json]
node .\bin\ai-playbook.mjs migrate path <target> [--apply] [--json]
node .\bin\ai-playbook.mjs managed check <target> [--json]
node .\bin\ai-playbook.mjs managed adopt <target> [--apply] [--json]
node .\bin\ai-playbook.mjs managed uninstall <target> [--apply] [--json]
node .\bin\ai-playbook.mjs context <target> [--json] [--max-chars N]
node .\bin\ai-playbook.mjs operator check <target> [--path <file>] [--diff] [--json]
node .\bin\ai-playbook.mjs operator search <target> --query <text> [--path <file>] [--max-results N] [--json]
node .\bin\ai-playbook.mjs rules check <target> [--path <file>] [--json]
node .\bin\ai-playbook.mjs diagnostics check <target> [--json]
node .\bin\ai-playbook.mjs qa tui-check <capture-file> [--cols N] [--json]
node .\bin\ai-playbook.mjs adapter config <target> --adapter codex|claude-code [--json]
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex|claude-code [--json] [--max-chars N] [--settings <path>]
node .\bin\ai-playbook.mjs plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
```

After publishing, the same CLI can be exposed through the package `bin` as `ai-playbook`.

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
node .\bin\ai-playbook.mjs migrate path <target> --json
node .\bin\ai-playbook.mjs migrate path <target> --apply --json
```

The default mode is a no-write preview. It reports the planned folder move, root/playbook reference updates from `ai-playbook/` to `.ai-playbook/`, and whether `.gitignore` should add `.ai-playbook/` while keeping the legacy ignore entry during the transition.

Use `--apply` only after reviewing the preview. Apply mode renames the folder, updates references in the root `AGENTS.md` and playbook markdown or JSON files, and appends `.ai-playbook/` to `.gitignore` when needed. It does not call the network, install hooks, or edit unrelated project files.

If both `ai-playbook/` and `.ai-playbook/` exist, the command reports a conflict and writes nothing.

## Managed manifest

`managed` commands inspect or maintain the project-level install marker at `.ai-playbook/.ai-agent-playbook-install.json`.

```powershell
node .\bin\ai-playbook.mjs managed check <target> --json
node .\bin\ai-playbook.mjs managed adopt <target> --json
node .\bin\ai-playbook.mjs managed adopt <target> --apply --json
node .\bin\ai-playbook.mjs managed uninstall <target> --json
node .\bin\ai-playbook.mjs managed uninstall <target> --apply --json
```

`managed check` is read-only and returns `{ schemaVersion, ok, target, manifestPath, summary, files, warnings, conflicts }`. Missing or malformed manifests fail the check. Missing or locally modified managed files are reported as conflicts so cleanup cannot silently remove project-specific edits.

`managed adopt` is for older projects that already match the current templates but do not have a marker. Preview mode writes nothing. Apply mode records only files whose current content hash matches the source template hash.

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

It does not read or re-inject root `AGENTS.md` by default. Use `--json` to return `{ schemaVersion, ok, target, sources, additionalContext, warnings }`. Use `--max-chars N` to cap injected context for hook environments.

## Operator diagnostics

The diagnostics commands are read-only operator signals. They help a human or agent decide what to inspect next; they do not install hooks, run project commands, write files, or call the network.

`operator check` is the combined human checkpoint:

```powershell
node .\bin\ai-playbook.mjs operator check <target> --json
node .\bin\ai-playbook.mjs operator check <target> --path src/example.ts --diff --json
```

It aggregates `doctor`, `guides sync --check`, `diagnostics check`, and `rules check` into one report. `--path` is forwarded to rule matching. `--diff` includes the same first-difference guide details as `guides sync --check --diff`. JSON output returns `{ schemaVersion, ok, target, path, summary, checks, sections }`, where `sections` contains the original `doctor`, `guides`, `diagnostics`, and `rules` reports. Missing guide templates or doctor failures fail the combined check; stale guides and diagnostics warnings stay as warning-level operator signals.

`operator search` is a local read-only explorer:

```powershell
node .\bin\ai-playbook.mjs operator search <target> --query "auth flow" --json
node .\bin\ai-playbook.mjs operator search <target> --query "auth flow" --path src/example.ts --max-results 20 --json
```

It scans text files under the target project and excludes common generated or dependency folders such as `.git`, `node_modules`, `dist`, `build`, `.next`, `.turbo`, and `coverage`. JSON output returns `{ schemaVersion, ok, target, query, path, summary, results, related }`. Results include relative path, category, score, match count, and snippets. No-match searches exit successfully with `summary.matches: 0`. When `--path` is provided, `related.rules` summarizes matching project rules for that file; `related.diagnostics` lists local verification command candidates without running them.

`rules check` discovers portable rule files and reports which rules apply to a path:

```powershell
node .\bin\ai-playbook.mjs rules check <target> --json
node .\bin\ai-playbook.mjs rules check <target> --path src/example.ts --json
```

Rule discovery intentionally excludes root `AGENTS.md`, because supported agents usually load it natively. Current rule sources are `.ai-playbook/rules/**/*.md`, `.github/instructions/**/*.md`, `.cursor/rules/**/*.md`, `.claude/rules/**/*.md`, `.github/copilot-instructions.md`, and `CONTEXT.md`. Directory rules may use simple frontmatter such as `alwaysApply: true` or `globs: ["src/**/*.ts"]`. JSON output returns `{ schemaVersion, ok, target, path, summary, rules, warnings }`.

`diagnostics check` reads local project metadata and lists likely verification commands without executing them:

```powershell
node .\bin\ai-playbook.mjs diagnostics check <target> --json
```

It currently detects common `package.json` scripts plus basic Python, Rust, and Go project markers. Package scripts are rendered with the detected package manager from lockfiles such as `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, or Bun lockfiles. JSON output includes `packageManager`. A missing command set is a warning, not a failure, because some projects keep verification in runbooks or external CI.

`qa tui-check` checks captured terminal output for width overflow, CJK wide-character columns, ANSI presence, and simple box-drawing alignment:

```powershell
node .\bin\ai-playbook.mjs qa tui-check .\capture.txt --cols 100 --json
```

This command exits non-zero when overflow or border misalignment is found. It is meant for terminal UI, CLI table, log, report, and Korean/Japanese/Chinese text layout checks. Browser screenshot review still belongs in the target project's browser tooling or visual QA guide.

## Adapter config and readiness

`adapter config` renders copy-paste-safe local hook configuration for manual setup. It is read-only: it does not create settings files, install hooks, edit project files, or call the network.

```powershell
node .\bin\ai-playbook.mjs adapter config <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter config <target> --adapter claude-code --json
```

Use `--json` to return `{ schemaVersion, ok, target, adapter, hookCommand, config, warnings }`. `hookCommand` and `config` use the current checkout path and do not include `<path-to-ai-agent-playbook>` placeholders. A missing `.ai-playbook/` folder is reported as a warning, not as a config rendering failure.

`adapter check` is a read-only self-check before manually enabling an optional hook adapter.

```powershell
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter claude-code --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --settings <local-settings-path> --json
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
- Worklogs are created under `.ai-playbook/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`.
- Monthly summaries are created under `.ai-playbook/worklogs/summaries/YYYY-MM.md`.
- Existing files are not overwritten unless `--force` is provided.

## Design constraints

- Keep the CLI dependency-free unless a concrete feature requires a dependency.
- Keep commands deterministic and file-system focused.
- Do not encode project-specific product facts in the runtime.
- Keep reusable templates relative-path based.
- Treat `_reference/` and `_work/` as local development material, never target-project input.
- Do not require plugin hooks, slash commands, global installs, or network access for the default harness.
- Optional hook adapters should inject context or reminders only; they should not rewrite tool output or edit project files automatically.
