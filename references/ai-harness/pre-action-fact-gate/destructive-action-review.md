# Destructive Action Review

Destructive actions need stronger evidence because rollback can be expensive or impossible. Treat deletes, recursive moves, overwrites, rewrites, schema/data changes, publish/deploy actions, and write-tool escalation as high-risk until proven otherwise.

## Before Proceeding

Require these facts:

- explicit user instruction for the destructive or applied action,
- resolved target list and target root,
- reason each target is in scope,
- dry-run or preview output when the tool supports it,
- backup, restore, rollback, or recreation path,
- known generated or managed-file status,
- related tests or validation commands, and
- expected post-check evidence.

## Path And Scope Safety

- Use project-relative target paths in notes and public docs.
- Verify resolved absolute paths stay inside the intended workspace or explicitly named target root before recursive delete or move operations.
- Do not pipe a generated file list from one shell into another shell for delete or move operations.
- Do not mix unrelated cleanup with feature, migration, or release work.
- Keep managed runtime output separate from trusted memory unless a promotion path is explicit.

## Write-Tier Escalation

- Read-only analysis stays default.
- Scaffold writes need previewed target paths and non-destructive outputs.
- Managed playbook writes need a manifest, dry-run result, and audit trail.
- Project writes need explicit opt-in and should not be exposed by MCP by default.
- Live deploy, publish, migration, and credential actions need project-defined runbooks or explicit user direction.

## Stop Conditions

Stop before action when:

- the instruction is ambiguous or does not authorize the destructive step,
- target paths are unbounded, computed without review, or outside the intended root,
- dry-run output conflicts with the stated intent,
- rollback depends on undeclared backups or external systems,
- generated evidence would be promoted as trusted memory without review, or
- the action would expose credentials, personal paths, private URLs, branch names, PR numbers, or raw private logs.
