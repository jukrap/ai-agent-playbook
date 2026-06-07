# Runtime Harness

`ai-playbook` is the executable surface for applying this repository to a target project. It does not call an AI model. It copies templates, checks project-memory health, and creates predictable plan/worklog files so agents stop inventing ad hoc markdown paths.

## Command surface

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--with-skills] [--with-git] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict]
node .\bin\ai-playbook.mjs guides sync <target> [--dry-run] [--force]
node .\bin\ai-playbook.mjs plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
```

After publishing, the same CLI can be exposed through the package `bin` as `ai-playbook`.

## Bootstrap behavior

- Copies `templates/project-playbook/` to `<target>/ai-playbook/`.
- Writes `<target>/AGENTS.md` from `templates/agents/global/AGENTS.md`.
- Adds `SKILLS.md` with `--with-skills` and `GIT.md` with `--with-git`.
- Merges a stack profile into `AGENTS.md` when `--profile <name>` is provided.
- Appends `ai-playbook/` to `.gitignore` only when `--local-only` is provided.
- Refuses to overwrite existing files unless `--force` is provided.

## Doctor checks

`doctor` checks for the minimum `ai-playbook/` layout, root `AGENTS.md`, local-only policy, obsolete split style skills, and fixed local absolute paths. In default mode, warnings do not fail the command. In `--strict` mode, warnings fail.

## Guide sync

`guides sync` copies current guide templates from this repository to `<target>/ai-playbook/guides/`.

- Default behavior keeps existing guide files and copies only missing guide files.
- Use `--dry-run` first to preview additions.
- Use `--force` only when you intentionally want to replace existing guide files with the current template versions.
- This command does not update `AGENTS.md`, `SKILLS.md`, `GIT.md`, `CURRENT.md`, plans, worklogs, or project-specific notes.

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
