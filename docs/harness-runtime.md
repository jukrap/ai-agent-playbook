# Runtime Harness

`ai-playbook` is the executable surface for applying this repository to a target project. It does not call an AI model. It copies templates, checks project-memory health, and creates predictable plan/worklog files so agents stop inventing ad hoc markdown paths.

This CLI and the project playbook are the default harness. Runtime hooks or plugins are optional extensions and should stay outside the default path until their behavior is explicit, local, and easy to disable. See `docs/runtime-roadmap.md` for the staged design.

## Command surface

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict]
node .\bin\ai-playbook.mjs guides sync <target> [--dry-run] [--force]
node .\bin\ai-playbook.mjs plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
```

After publishing, the same CLI can be exposed through the package `bin` as `ai-playbook`.

## Bootstrap behavior

- Copies `templates/project-playbook/` to `<target>/ai-playbook/`.
- Writes a thin `<target>/AGENTS.md` from `templates/agents/global/AGENTS.md`. This is a project-root bootstrap, not Codex's personal `~/.codex/AGENTS.md`.
- Includes `ai-playbook/SKILLS.md` and `ai-playbook/GIT.md` as part of the project playbook.
- Merges a stack profile into `AGENTS.md` when `--profile <name>` is provided.
- Appends `ai-playbook/` to `.gitignore` only when `--local-only` is provided.
- Refuses to overwrite existing files unless `--force` is provided.

## Doctor checks

`doctor` checks for the minimum `ai-playbook/` layout, root `AGENTS.md`, whether root `AGENTS.md` points to the core playbook files, unexpected root `SKILLS.md` or `GIT.md`, local-only policy, unadapted core template prompts, obsolete split style skills, and fixed local absolute paths. In default mode, warnings do not fail the command. In `--strict` mode, warnings fail.

Fresh bootstrap output can warn about `playbook adaptation` because `START_HERE.md`, `CURRENT.md`, and `questions.md` still contain template prompts. Treat that as a reminder to adapt the playbook after repo inspection, not as a bootstrap failure.

Future `doctor` work should keep check ids, severity, and actionable messages stable enough for humans first and later automation. Machine-readable output belongs behind an explicit option such as `--json`; the current text output remains the human default.

## Guide sync

`guides sync` copies current guide templates from this repository to `<target>/ai-playbook/guides/`.

- Default behavior keeps existing guide files and copies only missing guide files.
- Use `--dry-run` first to preview additions.
- Use `--force` only when you intentionally want to replace existing guide files with the current template versions.
- This command does not update `AGENTS.md`, `ai-playbook/SKILLS.md`, `ai-playbook/GIT.md`, `CURRENT.md`, plans, worklogs, or project-specific notes.

## Scaffold rules

- Plans are created under `ai-playbook/plans/YYYY-MM-DD-<slug>.md`.
- Worklogs are created under `ai-playbook/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`.
- Monthly summaries are created under `ai-playbook/worklogs/summaries/YYYY-MM.md`.
- Existing files are not overwritten unless `--force` is provided.

## Design constraints

- Keep the CLI dependency-free unless a concrete feature requires a dependency.
- Keep commands deterministic and file-system focused.
- Do not encode project-specific product facts in the runtime.
- Keep reusable templates relative-path based.
- Treat `_reference/` and `_work/` as local development material, never target-project input.
- Do not require plugin hooks, slash commands, global installs, or network access for the default harness.
- If a future hook layer is added, it should inject context or reminders only; it should not rewrite tool output or edit project files automatically.
