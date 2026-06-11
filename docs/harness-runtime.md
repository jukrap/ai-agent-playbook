# Runtime Harness

`ai-playbook` is the executable surface for applying this repository to a target project. It does not call an AI model. It copies templates, checks project-memory health, and creates predictable plan/worklog files so agents stop inventing ad hoc markdown paths.

This CLI and the project playbook are the default harness. Runtime hooks or plugins are optional extensions and should stay outside the default path until their behavior is explicit, local, and easy to disable. See `docs/runtime-roadmap.md` for the staged design.

## Command surface

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict] [--json]
node .\bin\ai-playbook.mjs doctor <target> --reminder [--json]
node .\bin\ai-playbook.mjs guides sync <target> [--dry-run] [--force]
node .\bin\ai-playbook.mjs guides sync <target> --check [--json]
node .\bin\ai-playbook.mjs context <target> [--json] [--max-chars N]
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex|claude-code [--json] [--max-chars N]
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
- Refuses to overwrite existing files unless `--force` is provided.

Compatibility: new bootstrap output uses `.ai-playbook/`. Runtime commands still read and write an existing legacy `ai-playbook/` folder when `.ai-playbook/` is absent, so older projects can migrate gradually. If both folders exist, `.ai-playbook/` is preferred.

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

## Adapter readiness

`adapter check` is a read-only self-check before manually enabling an optional hook adapter.

```powershell
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter claude-code --json
```

The command verifies the target path, `.ai-playbook/`, non-empty core context, adapter hook files, example settings, supported hook JSON for `SessionStart` and `PostCompact`, and quiet behavior for unsupported events or missing playbook context. It does not install hooks, write project files, call the network, or require a global command.

Use `--json` to return `{ schemaVersion, ok, target, adapter, summary, checks }`. Checks use the same `id`, `level`, `category`, `name`, `message`, and `paths` shape as `doctor`, so hook or setup automation can fail early without parsing human text.

## Lifecycle reminder hooks

The adapter hook examples enable only context refresh events by default:

- `SessionStart`
- `PostCompact`

`UserPromptSubmit` and `PostToolUse` are opt-in reminder events. Enable them only in a local hook configuration by setting `AI_PLAYBOOK_HOOK_EVENTS` to a comma-separated list:

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse'
```

`UserPromptSubmit` emits a short guardrail reminder only when the prompt appears to involve commit, push, PR, merge, worklog, or doctor-style handoff work. `PostToolUse` emits a short reminder only for edit-like tool payloads where the hook can read changed file paths. Both stay silent when `.ai-playbook/` is missing, when the event is not opted in, or when no relevant intent/path is found.

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
