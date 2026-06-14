# Review Work Light Checklist

## Review angles

- Behavior regressions in changed flows.
- Missing tests for new branches, failure states, migrations, or public contracts.
- API payload, DTO, adapter, schema, or persistence mismatches.
- UI overflow, loading, empty, error, disabled, focus, and responsive states.
- Local-only files, generated artifacts, personal paths, branch names, credentials, or internal URLs.
- Exact clone or duplicate-code cues that were acted on without checking callers, behavior, and tests.
- Unrelated refactors mixed into the requested change.
- Comments or docs that contradict the new behavior.
- Project vocabulary, maps, or decisions that now contradict the changed code.
- Verification commands that were skipped despite touching shared code.

## Severity

- **High:** likely runtime failure, data loss, security risk, broken public contract, or destructive operation.
- **Medium:** plausible regression, missing migration, weak test coverage around risky behavior, or confusing state.
- **Low:** maintainability, naming, minor docs drift, or polish issues.

## Output

- Findings first, ordered by severity.
- Include file and line references when available.
- Keep summaries brief and secondary.
- If no issues are found, say that clearly and mention remaining coverage gaps or residual risk.

## Boundaries

- Do not rewrite code during review unless the user asks for fixes.
- Do not treat stylistic preference as a bug unless it conflicts with repository policy.
- Do not invent test results. Mention only checks that actually ran.
