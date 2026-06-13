# Runtime Harness V19 Operator Research

## Goal

Add an explicit deep local research command without turning the harness into an automatic agent loop.

## Scope

- Add `operator research <target> --query <text> [--path <file>] [--max-results N] [--json]`.
- Keep the command read-only, local-only, and no-network.
- Reuse existing operator signals: local text search, diagnostics, codebase map, rules, and path-scoped context.
- Return evidence, gaps, next steps, and markdown summary text.
- Keep slash commands, plugin packaging, automatic hooks, continuation, and web research out of scope.

## Behavior

- The command expands the query into research axes and searches local files.
- It correlates source, tests, playbook notes, rules, plans, worklogs, diagnostics, and map signals.
- It reports no-match cases as successful results with explicit gaps.
- It does not write report files. Operators can copy or save `reportMarkdown` if they want a durable note.

## Verification

- Add fixture tests for source/test/playbook/rule/worklog evidence.
- Confirm no-match output is successful and includes gaps plus next steps.
- Confirm ignored folders stay ignored and the command writes no files.
- Update runtime and installation docs with matching Korean translations.
