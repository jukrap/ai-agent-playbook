# Hosted Runtime Version Alignment 0.5.10

Version 0.5.10 prevents hosted automation from silently running an older AAPB release than the package that generated or shipped the workflow.

## What changed

- GitHub Actions and Gitea Actions generators derive their exact `ai-agent-playbook` package pin from `package.json` through one runtime version module.
- Copyable hosted workflow templates ship with the same release pin, and tests inspect every start and tick command for version drift.
- Forge REST requests use the same package metadata in their `User-Agent` instead of a stale hard-coded value.

## Upgrade and safety

- Schedule generation remains preview-first and does not activate automation by itself.
- A differing workflow already copied into a project is still preserved. Upgrade its two AAPB package pins only after reviewing the generated preview or the current release template; the scheduler will not overwrite that file automatically.
- Existing run ledgers, plans, checkpoints, permissions, repository variables, and kill-switch settings require no migration.
- External Actions continue to use full commit-SHA pins. This change affects only the AAPB npm package specifier used by the start and tick commands.

## Verification focus

- Generated GitHub and Gitea workflows use the current package version for both `automation start` and `automation tick`.
- English and Korean copyable workflows carry the same release pin.
- Forge requests report the current package version without changing caller-provided headers.
