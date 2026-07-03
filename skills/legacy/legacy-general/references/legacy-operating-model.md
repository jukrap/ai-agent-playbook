# Legacy Operating Model

Use this when a legacy repository has unclear runtime flow, weak docs, or mixed operating practices.

## Establish the active system

1. Identify the command, server, scheduler, browser, or manual process that runs the feature.
2. Identify the files loaded by that path.
3. Identify whether source files are transformed, copied, generated, or deployed directly.
4. Identify the configuration source for the current environment.
5. Identify who or what consumes the changed output.

## Documentation triage

- Treat actual code and command output as stronger evidence than old docs.
- Treat the newest worklog or runbook as stronger evidence than a stale README when both exist.
- Treat deployment descriptors, scheduler config, and support scripts as part of the application.
- Keep uncertain docs marked as uncertain instead of deleting or rewriting them during unrelated work.

## Change strategy

- Match local patterns before introducing a new architecture style.
- Keep new behavior near the existing behavior it extends.
- Add explicit guards around compatibility-sensitive changes.
- Prefer small characterization tests or captured manual scenarios before refactoring.
- Split modernization into a separate plan after the requested fix is safe.

## Verification strategy

- Use project commands if they exist.
- If tests are weak, verify through the smallest real workflow that exercises the changed behavior.
- Include at least one adjacent existing workflow for regression confidence.
- Record unavailable environments, old browsers, devices, printers, databases, or partner systems as blockers or residual risk.

## Avoid

- Deleting code because search finds no direct import.
- Renaming fields, selectors, files, or procedures for readability during functional work.
- Adding hidden fallbacks that make incomplete backend or data work look finished.
- Moving files before checking deployment or packaging rules.
