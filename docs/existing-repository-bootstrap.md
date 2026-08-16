# Existing Repository Bootstrap

Bootstrap treats an existing root `AGENTS.md` as user-owned unless the operator explicitly selects an ownership mode. A conflict without a mode stops before any file is written.

## Choose an ownership mode

```powershell
# Recommended when the repository already has product-specific instructions
aapb bootstrap <target> --local-only --preserve-agents

# Add and manage only a short playbook reading-order block
aapb bootstrap <target> --local-only --link-agents

# Intentionally replace the complete root policy
aapb bootstrap <target> --replace-agents --force
```

- `--preserve-agents` keeps `AGENTS.md` byte-for-byte and installs only the project playbook.
- `--link-agents` adds or updates one marker-owned reading-order block outside user content.
- `--replace-agents --force` replaces the complete file and manages its full hash.
- `--force` alone never replaces an existing root policy.

The modes are mutually exclusive. An existing `AGENTS.md` combined with `--profile` requires manual integration because a generated profile can conflict with product-specific rules.

## Preflight and concurrent edits

Use `--json` to review planned writes, preserved files, conflicts, warnings, and suggested next commands. Bootstrap snapshots protected files during preflight and checks them again immediately before writing. If `AGENTS.md` or `.gitignore` changed in between, the entire operation stops without partial installation.

Bootstrap also stops when either protected path is a symbolic link whose ownership cannot be safely established, or when a managed marker block is malformed. It does not follow a link and overwrite a file outside the target repository.

## `.gitignore` behavior

Local-only bootstrap preserves the existing `.gitignore` content and adds `.ai-agent-playbook/` only when no equivalent pattern exists. It retains UTF-8 BOM state, CRLF or LF line endings, ordering, comments, and the existing last-newline choice. It does not sort, normalize, or replace the file.

`--local-only` continues to mean that project playbook memory is excluded from Git. It does not disable Git or Forge behavior for the rest of the project.

## Managed lifecycle

The installation manifest records root-policy ownership:

- `preserved`: `AGENTS.md` is not a managed file.
- `linked`: only the marker block is managed.
- `generated` or `replaced`: the complete file hash is managed.

`managed check` compares only the owned surface. `managed uninstall` removes only the managed link block in linked mode and leaves surrounding user content intact. Doctor accepts an explicit preserve mode as healthy and does not repeatedly warn that the root policy is unmanaged. Existing manifests without the ownership fields remain readable.

Before applying bootstrap to an important repository, keep the working tree reviewable and run a JSON or dry-run preview. Do not use replacement mode merely to avoid a merge decision.
