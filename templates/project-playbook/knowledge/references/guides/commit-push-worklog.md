# Commit, Push, PR, and Worklog Guardrails

Use this guide when an agent handles commits, pushes, pull requests, or worklogs.

The goal is to keep scope clear, protect local-only files, preserve detailed worklogs, and prevent unverified completion claims.

## Before staging

```bash
git status --short --branch
git remote -v
git branch --show-current
git diff --cached --name-only
```

Check:

- current branch and whether it matches the task
- upstream and remote
- unrelated dirty files
- staged files
- local-only policy
- latest verification output

## Staging

- Prefer explicit paths over `git add .` or `git add -A`.
- Stage only files related to the logical unit.
- Do not stage local-only docs, reference material, generated output, prompt drafts, or unrelated dirty files unless the project explicitly tracks them.
- Inspect staged file names and staged diff before committing.

## Commit checkpoints

Ask whether to commit, or commit automatically only when the project explicitly opts in, after:

- a logical slice is complete and verified
- the diff touches many files
- the net diff is large enough to hide review intent
- mixed concerns appear in one work session, such as skills plus docs plus scripts
- a risky refactor or migration step has a clean rollback point

Prefer multiple commits when changes are logically separate. Do not split so aggressively that each commit loses useful context.

## Commit messages

Use Conventional Commits unless the repository proves another convention.

Write the subject and body in the user's, team's, or repository's primary language. Keep the Conventional Commit type and scope in English unless the repository proves another format.

Allowed types:

- `feat`
- `fix`
- `design`
- `style`
- `refactor`
- `perf`
- `test`
- `docs`
- `build`
- `ci`
- `chore`

Rules:

- Keep the title one line and concrete.
- Do not copy the branch name, chat title, or task title.
- Use a body only when it helps explain why, scope, risk, or verification.
- Include verification only for commands or manual checks actually run.
- Include issue references only when the issue number and repository convention are known.
- Do not add agent, model, generated-by, co-authored-by, signed-off-by, or email signature lines unless the repository explicitly requires them.

## PR body

Follow the repository PR template when it exists. If no template exists, include:

- Summary
- Related issue
- Changes
- Risk
- Test/verification
- Rollback plan
- Screenshots/video when UI changed

Rules:

- Write from the actual diff.
- Write prose in the user's, team's, or repository's primary language.
- Group changes by review concern, not commit order.
- Choose risk conservatively for auth, routing, persistence, shared components, build config, or data formats.
- List only checks actually performed.
- Do not invent issue numbers, deployment status, screenshots, or test results.

## Push

Before pushing:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- Confirm current branch, target remote, upstream, and protected-branch policy.
- Do not push protected, deployment, or shared branches without explicit instruction.
- Do not push local-only files or unverified work.

## Worklogs

Commit messages preserve concise context. Worklogs preserve deeper reasoning.

Write a worklog for:

- milestone completion
- blocker or repeated failure
- major direction change
- long debugging with useful cause analysis
- deployment, native, printing, permission, API contract, or data-shape changes

Worklog principles:

- Match the worklog language to the target system and team language.
- Keep commands, package names, API names, and technical identifiers in their original form.
- Explain the problem, decision path, evidence, verification, and remaining risk.
- Do not simply list files.
- Do not simplify worklogs into commit-message-sized summaries when the project uses them as durable context.
- Promote current facts into `.ai-playbook/CURRENT.md`, `memory/maps/`, `workflows/runbooks/`, or `memory/decisions/`.
