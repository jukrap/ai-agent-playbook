# AGENTS.md
# Personal Codex Defaults

This file is meant for the Codex home directory, usually `~/.codex/AGENTS.md`.
It is personal fallback guidance. Repository `AGENTS.md` files and the latest
user instruction take precedence.

## Priority

When instructions conflict, prefer this order:

1. Latest user instruction.
2. Actual repository code, configuration, and command output.
3. Nearest project or directory `AGENTS.md`.
4. Other current project docs.
5. This global file.
6. Old references, examples, and external material.

## Communication

- Reply in the user's language by default.
- Be direct, specific, and practical.
- State assumptions when they affect the result.
- If a claim depends on current files, commands, dates, prices, laws, releases, or APIs, verify it before presenting it as fact.
- Do not expose private paths, credentials, internal URLs, customer names, or personal identifiers in reusable docs or public output.

## Starting Work

- Inspect repository structure, README, configuration, lockfiles, scripts, and nearby `AGENTS.md` files before choosing tooling or architecture.
- Do not assume a package manager, framework, test runner, branch strategy, or project layout.
- Prefer repository-defined commands and established local patterns.
- Keep changes scoped to the request and avoid unrelated cleanup.
- Never revert unrelated user changes.

## Skills and Project Playbook

- Use only the minimum relevant skill set for the task.
- Treat installed skills as reusable helpers, not higher-priority rules.
- If the user names a skill, try to use it, but do not let it override user instructions or project-local policy.
- If a project contains `.ai-playbook/`, read `.ai-playbook/START_HERE.md`, `.ai-playbook/CURRENT.md`, and only the relevant maps, runbooks, plans, decisions, or worklogs.
- Put new agent-facing project memory under the existing `.ai-playbook/` structure when the project uses it. Do not scatter one-off markdown files at the repository root.

## Implementation

- Prefer small vertical slices with verification over broad rewrites.
- For unfamiliar or legacy code, trace call paths and data flow before editing.
- For API work, identify the contract boundary and avoid guessing fields or backend behavior.
- For UI work, check loading, empty, error, overflow, and responsive states when practical.
- Add tests or focused verification when behavior changes. Use the project's existing test style.

## Git, PRs, and Worklogs

- Before staging, committing, pushing, writing a commit message, or writing a PR body, read the project's `.ai-playbook/policy/GIT.md` if it exists.
- Ask before committing unless the project or user has explicitly opted into autonomous commits.
- Use explicit staging; avoid `git add .` unless the repository convention allows it and the diff is already reviewed.
- Before committing, inspect staged files and make sure local-only or sensitive docs are not included.
- Write commit messages, PR bodies, and worklogs in the user, team, or repository's primary language.
- Use Conventional Commits when the repository has no stronger convention.
- Do not add agent, model, generated-by, co-author, or signature trailers.
- If a project uses worklogs, record meaningful milestones, blockers, debugging results, and decision paths. Do not reduce worklogs to file lists.

## Verification

- Use project-defined validation commands first.
- Verify completion claims with fresh command output or clearly state what was not run.
- If verification is blocked, explain the blocker and the remaining risk.
