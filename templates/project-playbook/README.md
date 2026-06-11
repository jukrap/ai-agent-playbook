# Project Playbook Template

Copy this folder into a target repository as `.ai-playbook/`.

The folder is project memory for agents and maintainers. It keeps current truth, maps, runbooks, plans, decisions, and worklogs separate so a future session can resume without rereading the whole repository.

Preferred setup from this repository:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only
node .\bin\ai-playbook.mjs guides sync <target-repo> --dry-run
node .\bin\ai-playbook.mjs doctor <target-repo>
```

## Reading order

1. `START_HERE.md`: shortest resume guide for the next agent.
2. `CURRENT.md`: current baseline, active risks, and recent decisions.
3. `questions.md`: unresolved questions that can change implementation.
4. `maps/`: repository, runtime, route, API, data, or risk maps.
5. `runbooks/`: commands and operational procedures.
6. `plans/`: active implementation plans only.
7. `worklogs/`: detailed history and monthly summaries.
8. `guides/`: reusable support guides, including `harness-migration.md` for projects that already have agent docs or another harness and `runtime-roadmap.md` for optional hook-layer decisions.

## Source of truth

When docs disagree, prefer:

1. Latest user instruction.
2. Actual code, configuration, and command output.
3. Root `AGENTS.md`, `.ai-playbook/SKILLS.md`, and `.ai-playbook/GIT.md`.
4. `.ai-playbook/CURRENT.md`, maps, runbooks, and decisions.
5. Worklogs and archived notes.

Worklogs are history. Promote facts that remain current into `CURRENT.md`, `maps/`, `runbooks/`, or `decisions/`.

## Maintenance rule

Keep the top-level files stable:

- `START_HERE.md`: current resume pointer only.
- `CURRENT.md`: durable current facts only.
- `questions.md`: unresolved decision-changing questions only.

Put larger material in the matching subfolder. Use `maps/` for structure, `runbooks/` for commands, `decisions/` for durable choices, `plans/` for active execution, and `worklogs/` for detailed history.

`doctor` warns while core files still contain template prompts. After first repo inspection, replace the placeholder bullets in `START_HERE.md`, `CURRENT.md`, and `questions.md` with project-specific current facts or state clearly that no active task or open question exists.

Do not add runtime hooks before this document harness works on its own. If the project later chooses hooks, document the decision and keep the hook layer optional.

## Commit policy

Decide per project whether `.ai-playbook/` is committed or local-only. If local-only, add it to `.gitignore` before writing project-specific notes.

Do not store credentials, private URLs, customer data, personal paths, raw logs with sensitive values, or machine-specific secrets here.
