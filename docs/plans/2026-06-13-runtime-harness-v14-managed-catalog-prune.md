# Runtime Harness V14 Managed Catalog and Prune

**Goal:** Improve managed playbook ownership review and selected deletion without increasing runtime automation.

**Architecture:** Keep the document and CLI harness as the default path. Managed catalog is read-only. Managed prune is preview-first and removes only one explicitly selected unmodified managed file when `--apply` is provided.

## Scope

- Add `managed catalog <target> [--json]`.
- Add `managed prune <target> --path <managed-path> [--apply] [--json]`.
- Keep `managed check`, `managed adopt`, `managed uninstall`, and operator diagnostics behavior compatible.
- Do not add hooks, slash commands, automatic doctor execution, continuation, or blocking feedback.

## Behavior

`managed catalog` reports the managed marker and file inventory:

- manifest metadata without absolute paths;
- managed file status for each entry;
- summary by kind and status;
- conflicts for modified or missing managed files.

`managed prune` is a targeted removal path:

- preview mode writes nothing;
- path input must be a portable relative managed path, while Windows separators are normalized;
- unmanaged, missing, modified, absolute, or parent-traversal paths fail;
- apply mode removes only the selected unmodified file and updates the manifest;
- `.gitignore` cleanup remains manual.

## Public Interface

```powershell
node .\bin\ai-playbook.mjs managed catalog <target> --json
node .\bin\ai-playbook.mjs managed prune <target> --path .ai-playbook/guides/runtime-harness.md --json
node .\bin\ai-playbook.mjs managed prune <target> --path .ai-playbook/guides/runtime-harness.md --apply --json
```

`managed catalog --json` returns `{ schemaVersion, ok, target, manifestPath, manifest, summary, files, warnings, conflicts }`.

`managed prune --json` returns `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`.

## Tests

- Verify `managed catalog` reports kind and status summaries without writing files.
- Verify `managed prune` preview writes nothing.
- Verify `managed prune --apply` removes only the selected unchanged managed file and updates the manifest.
- Verify modified, missing, unmanaged, absolute, and Windows-style path inputs are handled safely.
- Keep the full existing test suite passing.

## Follow-up

- Use real project smoke checks to see whether catalog output makes managed cleanup decisions clear enough.
- Do not promote cleanup into automatic hooks. Keep cleanup operator-triggered and reviewable.
