# Worker Contract

A worker contract makes delegated work reviewable. It should be small enough that another agent can execute it without inheriting the full conversation.

## Required Fields

- `taskId`: stable short id for the worker assignment.
- `goal`: one concrete outcome, not a broad mission.
- `scope`: files, directories, docs, APIs, screens, datasets, or commands the worker may inspect.
- `allowedWrites`: exact paths or `none`. Default to `none` for research, review, and evidence gathering.
- `requiredReads`: project docs, skills, recipes, maps, contracts, or source areas that must be read before claims.
- `tools`: allowed CLI, MCP, browser, test, search, or local analysis tools.
- `outputs`: expected report, patch, test, evidence envelope, review finding, or handoff note.
- `evidence`: locator format, scan range, command output summary, screenshot path, report path, or source registry item.
- `stopConditions`: missing evidence, conflicting instructions, unsafe write, private data risk, unclear owner, or exceeded budget.
- `budget`: context, time, token, command, or retry budget when relevant.

## Scope Rules

- Prefer one worker per independently reviewable question or patch.
- Give each worker a bounded read set before giving write permission.
- Do not assign two write workers to the same files unless one is explicitly a reviewer.
- Use project-relative paths. Avoid personal absolute paths, private URLs, branch names, PR numbers, credentials, and raw external excerpts in public handoffs.
- Keep reference adoption abstract: record which capability pattern was adopted, not noisy source project labels.

## Output Contract

Each worker output should state:

- what was inspected,
- what changed or what was found,
- evidence locators and scan ranges,
- verification commands actually run,
- skipped checks and why,
- risks or unresolved assumptions, and
- whether the output is ready, blocked, advisory-only, or needs review.

## Stop Conditions

Stop and reconcile before continuing when:

- the worker needs a broader scope than assigned,
- write work would cross an ownership boundary,
- evidence is not reopenable,
- generated summaries conflict with source files,
- verification cannot be run but the result would be treated as pass, or
- multiple workers report conflicting facts.
