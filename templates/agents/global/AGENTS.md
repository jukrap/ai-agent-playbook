# AGENTS.md
# AI Playbook Bootstrap

This file is the thin project-root entry point for agents. Keep durable project memory, policies, plans, and worklogs in `.ai-playbook/`.

## Start here

- Reply in the user's language by default.
- Inspect the repository structure, README, config, scripts, lockfiles, and current git state before choosing tooling.
- Look for lower-level `AGENTS.md` files before editing files in subdirectories.
- If `.ai-playbook/` exists, read these before planning:
  1. `.ai-playbook/START_HERE.md`
  2. `.ai-playbook/CURRENT.md`
  3. `.ai-playbook/questions.md`
  4. Relevant maps, runbooks, plans, decisions, or guides
  5. `.ai-playbook/policy/SKILLS.md` before selecting optional skills
  6. `.ai-playbook/policy/GIT.md` before staging, committing, pushing, or writing PR text
- If `.ai-playbook/` does not exist, work from the actual code and README first. Create or install a playbook only after the user or project asks for it.

## Working rules

- Prefer the latest user instruction, then actual code/config/output, then project docs.
- Do not assume framework, architecture, package manager, tests, lint, deployment, or branch workflow.
- Match existing project patterns before introducing new structure.
- Keep changes scoped to the request.
- Never revert unrelated user changes.
- Prefer `rg` for search.
- Do not guess API contracts, data fields, credentials, or external workflows.
- Verify completion claims with fresh command output or clearly state what was not verified.

## Git and local files

- Respect local-only policy in `.gitignore`, `.ai-playbook/policy/GIT.md`, and project docs.
- Keep root policy files minimal. Do not add root `SKILLS.md` or `GIT.md`; use `.ai-playbook/policy/SKILLS.md` and `.ai-playbook/policy/GIT.md`.
- Stage explicit related paths instead of `git add .`.
- Do not add agent, model, generated-by, co-author, or signature footers unless the repository explicitly requires them.

## Playbook ownership

- Treat `.ai-playbook/` as project memory, not as an excuse to ignore current code.
- Promote durable facts into `.ai-playbook/CURRENT.md`, maps, runbooks, or decisions.
- Keep detailed history in `.ai-playbook/workflows/worklogs/`.
- Archive stale plans and handoffs instead of leaving them in active guidance.
