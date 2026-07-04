# Git, Commit, and PR Policy

Use this file as a portable project-level Git policy inside `.ai-agent-playbook/`. Keep repository-specific branch names, remotes, issue numbers, and protected-branch rules out of this template until a project adapts it.

This is the short policy. It does not replace detailed commit, PR, and worklog guidance such as `knowledge/references/guides/commit-push-worklog.md` when a project needs durable context for future readers.

## Before staging

Check the current branch, remotes, upstream, dirty files, and staged files.

```bash
git status --short --branch
git remote -v
git branch --show-current
git diff --cached --name-only
```

- Do not revert unrelated user changes.
- Do not stage local-only docs, reference material, generated output, or unrelated dirty files.
- Prefer explicit staging over `git add .` or `git add -A`.
- Inspect staged names and staged diff before committing.

## Commit checkpoints

Ask whether to commit, or commit automatically only when the project explicitly opts in, after:

- a verified logical slice is complete
- many files are touched
- the diff is large enough to hide review intent
- mixed concerns appear in one session
- a risky refactor or migration step reaches a clean rollback point

## Commit messages

Use Conventional Commits unless the repository proves another convention.

Write the commit subject and body in the user's, team's, or repository's primary language. Keep the Conventional Commit type and scope in English unless the repository proves another format.

Format:

```text
type(scope): summary
```

Allowed types:

- `feat`: user-facing feature
- `fix`: bug fix
- `design`: UI/UX, screen structure, or visual changes
- `style`: formatting, ordering, comments, or non-runtime code style
- `refactor`: behavior-preserving refactor
- `perf`: performance improvement
- `test`: test addition or change
- `docs`: documentation change
- `build`: build or dependency configuration
- `ci`: CI/CD configuration
- `chore`: maintenance

Rules:

- Keep the title one line and omit the final period.
- Make the concrete result clear.
- Do not copy the branch name, chat title, or task title.
- Avoid vague titles such as `fix: update`, `chore: changes`, or `refactor: cleanup`.
- Omit the body for simple changes.
- Use short `- ` bullets only when they explain what changed, why it matters, impact, or caution.
- Include a verification section only for commands or manual checks actually run.
- Include issue references only when the issue number and repository convention are known.
- Do not include agent, model, generated-by, co-authored-by, signed-off-by, or email signature lines unless the repository explicitly requires them.

## PR body

Follow the repository PR template when it exists. If no template exists, use:

```md
## Summary
- Summarize what changed and why in one to three bullets.

## Related Issue
- None

## Changes
- Group major changes by review concern.

## Risk
- Low/Medium/High
- Reason: describe the actual impact.

## Test/Verification
- List only checks actually performed.

## Rollback Plan
- State the simplest rollback path.

## Screenshots/Video
- None when there is no UI change.
```

Rules:

- Write from the actual diff, not from memory.
- Write PR prose in the user's, team's, or repository's primary language unless the repository template proves another convention.
- Group changes by review concern such as UI, state, API, types, docs, or configuration.
- Choose risk conservatively for auth, routing, persistence, shared components, build config, or data formats.
- Do not mark unrun checks as complete.
- Do not invent issue numbers, staging status, deployment status, screenshots, or test results.

## Push

Before pushing:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- Confirm branch and remote.
- Confirm upstream and protected branch policy.
- Do not push protected, deployment, or shared branches without explicit instruction.
