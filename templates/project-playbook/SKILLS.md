# Project Skill Policy

Use this file when a project wants portable guidance for selecting agent skills. Keep it small and adapt it to the project before committing or sharing the project playbook.

## Default rule

- Use the fewest skills that clearly apply to the current task.
- Let the repository, current user instruction, and actual code override generic skill advice.
- Announce selected skills briefly so the user can see which working rules are active.
- Do not load every installed skill just because it exists.

## Process skills

External process skill packs can be useful for planning, debugging, TDD, triage, architecture review, issue slicing, and handoff work. Treat them as optional helpers unless this project explicitly requires them.

Use process skills before project guardrail skills when the task is about how to work, then use the smallest project-specific skill or doc that constrains the repository.

## Project guardrail skills

Use installed playbook skills for recurring repository concerns:

- `project-bootstrap`: setting up root agent policies and `ai-playbook/`.
- `repo-onboarding`: entering an unfamiliar or stale repository.
- `project-doc-system`: organizing `AGENTS.md`, `ai-playbook/`, maps, runbooks, plans, and worklogs.
- `api-contract-boundary`: changing or reviewing API integration.
- `ui-style-policy`: selecting or documenting UI styling policy.
- `style-quality-review`: reviewing visible UI style without redesigning.
- `commit-worklog-guardrails`: staging, committing, pushing, PR bodies, or worklogs.
- `legacy-*`: changing legacy systems with hidden coupling or compatibility constraints.

## Structural evidence

Repository audit or structural evidence tools can help when a repository-wide structural claim needs machine evidence. Use them only when installed and appropriate for the stack.

- Prefer a full audit for first checkups, stale baselines, major refactors, or due diligence.
- Prefer quick follow-up checks after a fresh baseline for small localized questions.
- Do not claim absence, duplicate structure, dead exports, cycles, or cleanup counts without stating scan range and freshness.
- Do not assume automatic before-write or after-write gates are active unless this project has installed and chosen that workflow.

## Compatibility

Do not assume another agent runtime's hooks, slash commands, or plugin environment variables work here. If a skill or tool was written for another agent, translate its intent into supported commands and repository-local rules.

## When to write project docs instead of a skill

- Put standing repository instructions in `AGENTS.md`, this file, or other project docs.
- Put product scope in product/spec docs.
- Put milestones in planning docs.
- Put project memory under `ai-playbook/`.
- Create or install a skill only when the behavior is reusable across projects.
