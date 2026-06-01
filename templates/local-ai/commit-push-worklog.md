# Commit, Push, PR, and Worklog Guardrails

Use this guide when an agent handles commits, pushes, pull requests, or worklogs. The goal is to keep scope clear, protect local-only files, and prevent unverified completion claims.

## Before work or staging

```bash
git status --short --branch
git remote -v
git branch --show-current
```

Check:

- Whether the current branch matches the task.
- Which upstream and remotes exist.
- Which remote is safe to push to and which remotes are protected.
- Whether dirty files mix user changes with agent changes.
- Whether local-only docs or generated outputs are already staged.

## Staging

- Do not default to `git add .` or `git add -A`.
- Stage only files related to the task.
- Always inspect staged files afterward.

```bash
git diff --cached --name-only
git diff --cached --stat
```

Common local-only candidates:

- `docs/**`
- `design-docs/**`
- `_reference/**`
- `.local-ai/**`
- internal root-level `*.md`
- temporary prompts, handoffs, worklogs, analysis logs
- build output, coverage, visualizer output

`README.md` can be an exception when the project treats it as public documentation.

## Verification

Prefer project-defined commands. If commands are unknown, read config first.

Common order when present:

```bash
pnpm lint
pnpm test:run
pnpm build
```

If verification fails:

- Read the failure cause and fix only related files.
- Run the same verification again.
- Do not hide failures.
- Do not mention unrun verification in commit messages, PRs, or final replies.

## Commit messages

Goal:

- Write one or more final commit messages from the current diff or staged diff, depending on the requested commit strategy.
- Make the intent and main result readable at a glance.
- If changes are logically separate, prefer separate commits when the user asked to commit or prepare commits.
- If the user asked for a single commit, or the repository convention favors one commit per task, put the primary logical change in the title and secondary changes in the body.

Output contract:

- Output only the final commit message or commit plan requested.
- Do not include explanations, alternatives, quotes, or code fences.
- Use only as much structure as needed: title, title plus body, title plus body plus verification, or title plus body plus verification plus footer.

Default format:

```text
type(scope): structured summary
```

Use repository convention first. If no convention is proven, match the user's or team's working language for the subject and body. Keep Conventional Commit type and scope in English unless the repository proves another format.

Common types:

- `feat`: user-facing feature
- `fix`: bug fix
- `design`: UI/UX, screen structure, or visual change
- `style`: formatting, ordering, comments, or non-runtime code style
- `refactor`: behavior-preserving refactor
- `perf`: performance improvement
- `test`: test addition or change
- `docs`: documentation change
- `build`: build or package configuration
- `ci`: CI/CD configuration
- `chore`: maintenance

Title rules:

- Keep the title one line.
- Do not end the title with a period.
- Make the concrete result clear.
- Write the subject in the user's, team's, or repository's primary language.
- Do not copy the branch name, chat title, or task title as the commit title.
- Avoid vague titles such as `fix: update`, `chore: changes`, or `refactor: cleanup`.
- Do not use generic words alone, such as `work`, `process`, `fix`, `change`, or `improvement`.
- Use uppercase abbreviations such as UI, API, PR, HMR, MSW, SDK, JDK, and WebView only when useful.

Body rules:

- Omit the body when the change is simple.
- Add two to six `- ` bullets when the change has useful future context. One bullet is fine for narrow changes.
- Preserve what changed, why it matters, impact, and caution when those details are visible in the diff.
- Keep bullets result-focused.
- Do not narrate implementation steps.
- Do not invent details that are not in the diff.

Verification rules:

- Add a `Verification` section only when checks were actually run.
- List commands or manual checks briefly.
- Never claim a browser, device, test, lint, build, or deployment check that was not performed.

Issue rules:

- Include issue references only when the issue number is known.
- Prefer footer forms such as `Refs #123` or `Closes #123` unless the repository uses another convention.
- Do not duplicate the same issue in both title and footer.

Forbidden:

- Do not include agent, model, generated-by, co-authored-by, signed-off-by, or email signature lines unless the repository explicitly requires them.
- Do not mention unverified tests or changes outside the diff.

Examples:

```text
docs(contributing): add lf policy and hook checks
```

```text
fix(auth): prevent relogin failure after logout

- Exclude login requests from token refresh handling.
- Call server session cleanup before clearing local state.
```

```text
refactor(table): split data-table responsibilities

Verification
- pnpm lint
- pnpm test:run
```

## Push

Before pushing:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- Confirm the current branch.
- Confirm fork/origin/upstream relationships.
- If `upstream` is the source repository, confirm that pushing there is intended.
- Do not push protected, deployment, or shared branches without explicit user instruction.

## PR body

Goal:

- Write the PR body from the actual diff.
- Make purpose, scope, risk, verification, and rollback easy for reviewers to scan.

Output contract:

- Follow the repository PR template when it exists.
- If there is no template, use the default structure below.
- Remove placeholders.
- Use `None` only where there is genuinely nothing to report.
- Do not paste raw diffs or commit logs.

Summary rules:

- Summarize what changed first, then why.
- Use one to three bullets or one to three short sentences.
- Avoid broad background unless it changes review context.

Change rules:

- Group changes by review concern, such as UI, state, API, types, configuration, or documentation.
- Mention review-sensitive areas in `Changes` or `Risk`.
- Do not list trivial implementation details.

Risk rules:

- Choose one of `Low`, `Medium`, or `High`.
- Add one reason line based on real impact.
- Treat auth, routing, persistence, shared components, build config, and data formats conservatively.
- Avoid unsupported claims such as "no risk" or "fully solved".

Verification rules:

- List only checks actually performed.
- Do not check off staging, browser, device, lint, type-check, or scenario validation unless it was done.
- Keep command names and manual scenario names concrete.

Rollback rules:

- State the simplest rollback path when the change can affect shared behavior, configuration, or production operations.
- Use `None` only when rollback does not need special handling.

Media rules:

- Include screenshots or video only for UI changes.
- Use `None` for non-UI changes.

Forbidden:

- Do not mention agent, model, generated-by, auto-generated, or co-authored signatures.
- Do not invent issue numbers, tests, risk analysis, or deployment status.
- Do not fill the template mechanically with meaningless text.

Default structure:

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

## Worklogs

Commit messages may preserve concise context, but worklogs carry deeper reasoning. Write a worklog for:

- milestone completion
- blockers or repeated failures
- major direction changes
- long debugging where the cause or judgment should be preserved
- deployment, backend contract, printing, native, or permission changes with broad impact

Language:

- Match the worklog language to the target system and team language.
- If the user speaks Korean or the worklog is for a Korean Jira project, use the localized Korean structure from `translations/ko/templates/local-ai/commit-push-worklog.ko.md`.
- If the ticket, repository, or stakeholder context is English-first, use English section titles and English prose.
- Keep commands, package names, API names, and technical identifiers in their original form.

Recommended English structure:

```md
## Title

`Short result-focused title`

## Summary
- State the result in one to three bullets.

## Background
- Explain why the work was needed.

## Observed Problem
- Describe symptoms and reproduction conditions.

## Cause
- Include only causes actually confirmed.

## Changes
- Describe what changed, result-first.

## Verification
- List commands and screens/scenarios checked.

## Remaining Work
- Note remaining risks or follow-up work.
```

For a canonical Jira worklog example, see `examples/worklogs/jira-worklog-example.md`. For Korean Jira wording, see `translations/ko/examples/worklogs/jira-worklog-example.ko.md`.

Writing principles:

- Do not simply list filenames, paths, or markdown document names.
- Explain the reason and result so another person can understand the work without separate materials.
- Prefer actual criteria and judgment over naming a person or external reference.
- Prioritize what was wrong and how it was organized over what was referenced.

A good worklog preserves reasoning more than file lists. The next agent should be able to recover context quickly.
