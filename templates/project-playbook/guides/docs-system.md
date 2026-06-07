# Project Docs System

Use this guide when organizing project-specific agent docs.

## Document roles

- `AGENTS.md`: agent workflow, verification, git, and collaboration rules.
- `ai-playbook/SKILLS.md`: project-level skill selection policy.
- `ai-playbook/GIT.md`: short Git, commit, PR, and push policy.
- `README.md`: public setup and run guide for humans.
- `PROJECT_SPEC.md`: product goals, feature/screen scope, API/data policy when the project uses this file.
- `PLANS.md`: milestone order, completion criteria, and verification commands when the project uses this file.
- `FSD.md`: FSD or architecture boundary rules only when the project proves that architecture.
- `ai-playbook/`: agent-facing project memory, maps, runbooks, plans, decisions, and worklogs.

## Source of truth

1. Latest user instruction.
2. Actual code, configuration, and command output.
3. Root and nearest agent instruction files.
4. Current project memory in `ai-playbook/CURRENT.md`, maps, runbooks, and decisions.
5. Worklogs, old plans, handoffs, examples, and archived notes.

## Cleanup rules

- Keep root agent instructions focused on how to work.
- Keep current project truth in `ai-playbook/CURRENT.md`.
- Keep structural facts in `ai-playbook/maps/`.
- Keep repeated commands in `ai-playbook/runbooks/`.
- Keep live plans in `ai-playbook/plans/`.
- Keep detailed history in `ai-playbook/worklogs/`.
- Archive stale plans, prompts, and handoffs.

## Local-only policy

Decide whether `ai-playbook/` is committed or local-only. If local-only, add it to `.gitignore` before writing private project facts.

Before committing, inspect staged markdown files and avoid staging local-only notes, generated output, private references, or sensitive logs.
