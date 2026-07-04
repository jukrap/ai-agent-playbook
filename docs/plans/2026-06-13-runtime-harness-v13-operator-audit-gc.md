# Runtime Harness V13 Operator Audit and GC Plan

Status: implemented
Date: 2026-06-13

## Goal

Add an operator-triggered audit and cleanup preview layer for project playbooks without changing the default document/CLI harness path.

## Scope

- Add `operator audit <target> [--json]`.
- Add `operator gc <target> [--apply] [--json]`.
- Keep audit read-only.
- Keep GC preview-first and restrict apply mode to unmodified obsolete managed playbook files.
- Do not add blocking hooks, continuation, automatic doctor execution, slash commands, or plugin packaging.

## Design

`operator audit` reports playbook drift:

- broken relative markdown links in playbook markdown files;
- context files whose `globs` do not match any current project file;
- duplicate playbook markdown content;
- simultaneous `.ai-agent-playbook/` and legacy `ai-playbook/` folders;
- managed manifest missing, malformed, missing file, or modified file states.

`operator gc` uses `.ai-agent-playbook/.ai-agent-playbook-install.json` as the safety boundary. It removes a file only when `--apply` is provided and all of these are true:

- the file is listed in the managed manifest;
- the file is under the active playbook directory;
- the source template path in the manifest no longer exists in the current checkout;
- the current target hash still matches the manifest `targetHash`.

Modified files are preserved and reported as conflicts. Preview mode writes nothing.

## Public Interface

```powershell
node .\bin\aapb.mjs operator audit <target> --json
node .\bin\aapb.mjs operator gc <target> --json
node .\bin\aapb.mjs operator gc <target> --apply --json
```

`operator audit --json` returns `{ schemaVersion, ok, target, summary, findings, sections, warnings }`.

`operator gc --json` returns `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`.

## Verification

- Add failing tests before implementation.
- Verify `operator audit` reports broken links, orphan context, duplicate notes, and legacy path drift without writing files.
- Verify `operator gc` preview writes nothing.
- Verify `operator gc --apply` removes only obsolete unmodified managed files, preserves edited files, and updates the managed manifest.
- Run the repository checks and dry-run installer/updater commands before merge.
