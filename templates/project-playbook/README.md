# Project Playbook Template

Copy this folder into a target repository as `ai-playbook/`.

The folder is project memory for agents and maintainers. It keeps current truth, maps, runbooks, plans, decisions, and worklogs separate so a future session can resume without rereading the whole repository.

## Reading order

1. `START_HERE.md`: shortest resume guide for the next agent.
2. `CURRENT.md`: current baseline, active risks, and recent decisions.
3. `questions.md`: unresolved questions that can change implementation.
4. `maps/`: repository, runtime, route, API, data, or risk maps.
5. `runbooks/`: commands and operational procedures.
6. `plans/`: active implementation plans only.
7. `worklogs/`: detailed history and monthly summaries.

## Source of truth

When docs disagree, prefer:

1. Latest user instruction.
2. Actual code, configuration, and command output.
3. `AGENTS.md`, `SKILLS.md`, and `GIT.md`.
4. `ai-playbook/CURRENT.md`, maps, runbooks, and decisions.
5. Worklogs and archived notes.

Worklogs are history. Promote facts that remain current into `CURRENT.md`, `maps/`, `runbooks/`, or `decisions/`.

## Commit policy

Decide per project whether `ai-playbook/` is committed or local-only. If local-only, add it to `.gitignore` before writing project-specific notes.

Do not store credentials, private URLs, customer data, personal paths, raw logs with sensitive values, or machine-specific secrets here.

