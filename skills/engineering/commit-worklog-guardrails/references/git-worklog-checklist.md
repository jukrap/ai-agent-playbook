# Git and Worklog Checklist

Use this reference before staging files, writing a commit message, pushing, opening a PR, or recording a worklog.

## Before staging

```bash
git status --short --branch
git remote -v
git branch --show-current
```

Check unrelated dirty files, current branch, upstream, remotes, protected branches, and local-only policies.

## Staging

- Prefer explicit paths over `git add .` or `git add -A`.
- Stage only files related to the task.
- Never stage local-only docs, generated output, worklogs, prompt drafts, or reference assets unless the project explicitly tracks them.
- After staging, inspect both file names and summary:

```bash
git diff --cached --name-only
git diff --cached --stat
```

## Verification

- Use repository-defined scripts only.
- Common order when present: lint, tests, build.
- Never claim an unrun command passed.
- If a command fails, read the cause, fix only related files, rerun the same command, and report the real result.

## Commit message policy

Goal:

- Write one or more final commit messages from the current diff or staged diff, depending on the requested commit strategy.
- Make the intent and main result readable at a glance.
- If changes are logically separate, prefer separate commits when the user asked to commit or prepare commits.
- If the user asked for a single commit, or the repository convention favors one commit per task, put the primary logical change in the title and secondary changes in the body.

Output:

- Output only the final commit message or commit plan requested.
- Do not include explanations, alternatives, quotes, or code fences.
- Use only the structure needed: title, title plus body, title plus body plus verification, or title plus body plus verification plus footer.

Format:

```text
type(scope): summary
```

- Use Conventional Commit types: `feat`, `fix`, `design`, `style`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`.
- Use scope only when useful and consistent with the repository.
- Use the repository's language convention for the subject. If the team prefers Korean subjects, keep type/scope in English and write the subject in Korean.

Title rules:

- Keep it one line and do not end with a period.
- State the concrete result, not the process.
- Do not copy the branch name, chat title, or task title.
- Avoid vague titles such as `fix: update`, `chore: changes`, or `refactor: cleanup`.
- Do not use generic words alone, such as `work`, `process`, `fix`, `change`, or `improvement`.

Body rules:

- Omit the body for simple changes.
- Use one to four `- ` bullets when the title does not explain what changed, why it changed, impact, or caution.
- Keep bullets result-focused and grounded in the actual diff.
- Do not narrate implementation steps.

Verification rules:

- Include a `Verification` section only for checks actually run.
- List command names or manual scenarios briefly.
- Never mention unrun tests, browsers, devices, builds, deployments, or scenario checks.

Issue and footer rules:

- Include issue references only when the issue number is known.
- Prefer `Refs #123` or `Closes #123` unless the repository uses another convention.
- Do not duplicate the same issue in both title and footer.

Forbidden:

- Do not add agent, model, generated-by, co-authored-by, signed-off-by, or email signature lines unless explicitly required.
- Do not invent changes, tests, issue numbers, or verification results.

## Push

Before pushing:

```bash
git status --short --branch
git log --oneline --decorate -5
git remote -v
```

- Confirm the current branch and target remote.
- Confirm fork/origin/upstream relationships.
- Do not push protected, deployment, or shared branches without explicit instruction.
- Do not push local-only files or unverified work.

## PR body policy

- Follow the repository template when it exists.
- If there is no template, include summary, related issue, changes, risk, test/verification, rollback plan, and screenshots/video.
- Summarize what changed first, then why.
- Group changes by review concern rather than commit order.
- Choose `Low`, `Medium`, or `High` risk and add a reason based on actual impact.
- List only checks actually performed.
- Include rollback steps for shared behavior, configuration, or production-impacting changes.
- Include screenshots or videos only for UI changes.
- Do not paste raw diffs, commit logs, invented issue numbers, or unverified test results.

## Worklog trigger

Write a worklog for:

- milestone completion
- blocker or repeated failure
- large direction change
- long debugging with useful cause analysis
- deployment, native, printing, permission, or API contract changes

## Worklog language and shape

- Match the worklog language to the target system and team language.
- Use the localized Korean structure from `translations/ko/skills/engineering/commit-worklog-guardrails/references/git-worklog-checklist.ko.md` for Korean Jira projects or when the user asks in Korean.
- Use English section titles and English prose for English-first tickets, repositories, or stakeholders.
- Keep commands, package names, API names, and technical identifiers in their original form.

For a canonical Jira worklog example, see `examples/worklogs/jira-worklog-example.md` in the source repository. For Korean Jira wording, see `translations/ko/examples/worklogs/jira-worklog-example.ko.md`.

Writing principles:

- Do not simply list filenames, paths, or markdown document names.
- Explain the reason and result so another person can understand the work without separate materials.
- Prefer actual criteria and judgment over naming a person or external reference.
- Prioritize what was wrong and how it was organized over what was referenced.

Good worklogs preserve the decision path, confirmed cause, verification, and remaining risks. They are not file lists or long commit messages.
