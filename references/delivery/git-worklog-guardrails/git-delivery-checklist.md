# Git Delivery Checklist

Use this before staging files, committing, pushing, preparing PR text, or writing a worklog.

## Preflight

- Check current branch, upstream, remotes, dirty files, staged files, and ignored local-only folders.
- Read repository commit and PR instructions when present.
- Confirm which changes are yours and which are unrelated user changes.
- Confirm verification commands from repository scripts or docs.
- Confirm whether push or PR creation was explicitly requested.

## Staging

- Stage explicit task-related paths.
- Do not stage local-only workspaces, generated scratch output, reference audit notes, credentials, or private environment files.
- Inspect staged names and staged summary before committing.
- If unrelated edits exist in touched files, review the diff carefully and stage only the intended hunks when practical.

## Commit message

- Use the repository's commit convention.
- Base the title on the main result, not the branch name or chat title.
- Include a body when the diff spans multiple concerns or future readers need scope/risk context.
- Include verification only for commands actually run.
- Do not add agent, model, generated-by, co-author, or signature trailers.

## Push and PR

- Push only the intended branch to the intended remote.
- Do not push protected or shared branches unless explicitly instructed.
- Write PR text from actual diff and actual verification.
- Include rollback notes for shared behavior, configuration, packaging, or operational changes.
- Include screenshots only for real UI changes that were checked.

## Worklog

Write a worklog when the change closes a milestone, resolves a blocker, changes direction, documents long debugging, or leaves operational risk. Keep durable facts in playbook memory or project docs rather than only in commit messages.
