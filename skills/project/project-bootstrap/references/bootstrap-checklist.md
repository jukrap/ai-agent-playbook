# Project Bootstrap Checklist

Use this checklist when creating root agent files or an `ai-playbook/` folder for a target project.

## Discovery

- Check branch, remotes, dirty files, staged files, and local-only policy.
- Inspect root docs, README, package/build files, lockfiles, scripts, and existing agent instructions.
- Search for existing project memory, plans, worklogs, ADRs, runbooks, and onboarding notes.
- Confirm package manager, runtime, verification commands, and project shape from files, not habit.

## Template selection

- Root working agreement: `templates/agents/global/AGENTS.md`.
- Skill policy: `templates/project-playbook/SKILLS.md`, copied as `ai-playbook/SKILLS.md`.
- Git policy: `templates/project-playbook/GIT.md`, copied as `ai-playbook/GIT.md`.
- Project memory: copy `templates/project-playbook/` as `ai-playbook/`.
- Stack profile: add the closest `templates/agents/profiles/**/AGENTS.md` only when the stack is confirmed.

## Minimum useful `ai-playbook/`

For most projects, start with:

- `README.md`
- `START_HERE.md`
- `CURRENT.md`
- `SKILLS.md`
- `GIT.md`
- `questions.md`
- `maps/README.md`
- `runbooks/README.md`
- `plans/README.md`
- `worklogs/README.md`

Add detailed maps, runbooks, decisions, and guides only when there is project evidence to fill them.

## Content rules

- `START_HERE.md`: what the next agent should read and do first.
- `CURRENT.md`: current truth, active risks, and decisions that still matter.
- `maps/`: structure and runtime facts with scan range and freshness.
- `runbooks/`: verified commands and cleanup steps.
- `plans/`: active execution plans only.
- `worklogs/`: detailed history plus monthly summaries.
- `archive/`: stale plans, prompts, and handoffs.

## Hygiene

- Do not commit personal absolute paths, private names, credentials, internal URLs, raw tokens, customer data, or machine-local assumptions.
- Use relative paths in reusable templates.
- If `ai-playbook/` is local-only, add it to `.gitignore` before writing private notes.
- If worklogs are committed, keep them scrubbed and useful for future maintainers.
