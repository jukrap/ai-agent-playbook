# Project Skill Policy

Use this file when a project wants portable guidance for selecting agent skills. Keep it small and adapt it to the project before committing it.

## Default rule

- Use the fewest skills that clearly apply to the current task.
- Let the repository, current user instruction, and actual code override generic skill advice.
- Announce selected skills briefly so the user can see which working rules are active.
- Do not load every installed skill just because it exists.

## Process skills

External process skill packs can be useful for planning, debugging, TDD, triage, architecture review, issue slicing, and handoff work. Treat them as optional helpers unless this project explicitly requires them.

Use process skills before project guardrail skills when the task is about how to work, then use the smallest project-specific skill or doc that constrains the repository.

## Portable process patterns

Prefer these small working patterns when they fit the task:

- Planning: inspect discoverable repository facts first, then ask only the questions that can materially change the plan.
- Debugging: reproduce or narrow the feedback loop before proposing a fix; keep hypotheses falsifiable and verify the regression path.
- TDD and slicing: work one behavior or vertical tracer bullet at a time instead of broad horizontal edits.
- Prototyping: make prototypes disposable and tied to one uncertainty; delete them or fold the result into the real implementation.
- Issue and PRD shaping: create independently verifiable vertical slices with clear acceptance criteria and minimal stale file-path detail.
- Architecture review: use current evidence and domain terms; propose small deepening steps instead of broad rewrites.
- Handoff: record current state, verification, remaining risk, and the next likely command; keep sensitive or local-only notes out of public docs.

## Project guardrail skills

Use installed playbook skills for recurring repository concerns:

- `repo-onboarding`: entering an unfamiliar or stale repository.
- `project-doc-system`: organizing `AGENTS.md`, specs, plans, worklogs, or local docs.
- `api-contract-boundary`: changing or reviewing API integration.
- `style-quality-review`: reviewing visible UI style without redesigning.
- `commit-worklog-guardrails`: staging, committing, pushing, PR bodies, or worklogs.
- `legacy-*`: changing legacy systems with hidden coupling or compatibility constraints.

## Optional structural evidence tools

Repository audit or structural evidence tools can help when a repository-wide structural claim needs machine evidence. Use them only when installed and appropriate for the stack.

- Prefer a full audit for first checkups, stale baselines, major refactors, or due diligence.
- Prefer quick follow-up checks after a fresh baseline for small localized questions.
- Do not claim absence, duplicate structure, dead exports, cycles, or cleanup counts without stating the scan range and freshness.
- Do not assume automatic before-write or after-write gates are active unless this project has installed and chosen that workflow.

## Codex compatibility

Do not assume Claude Code-only hooks, slash commands, or environment variables such as `CLAUDE_PLUGIN_ROOT` work in Codex. If a skill or tool was written for another agent, translate its intent into Codex-supported commands and repository-local rules.

## When to write project docs instead of a skill

- Put standing repository instructions in `AGENTS.md`, this file, or other project docs.
- Put product scope in `PROJECT_SPEC.md`.
- Put milestones in `PLANS.md`.
- Put long local support docs under a project-local folder such as `.local-ai`, `docs/ai`, or `docs/plans`.
- Create or install a skill only when the behavior is reusable across projects.
