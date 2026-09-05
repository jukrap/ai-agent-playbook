# Add AAPB to an existing repository

Start by inspecting the repository and its existing instructions. AAPB can read old records without rebuilding them. Bootstrap is only for a project that does not already have a playbook.

## Inspect before writing

```sh
aapb records status "<project>" --json
aapb records status "<project>" --view records --json
aapb bootstrap "<project>" --local-only --dry-run
```

Use `--local-only` only for a Git repository whose new records should remain local. Read `AGENTS.md` and the entrypoint shown by status. Check dirty Git changes before deciding whether any document should be changed.

| Existing state | Next step |
| --- | --- |
| No playbook | Review bootstrap preview, then create records |
| CURRENT.md and supporting records exist | Read them and update only the current task's facts |
| Old structured layout | Keep reading it; migration is optional |
| Multiple recognized playbook roots | Reconcile the ambiguity explicitly before using record operations |
| Modified/unowned layout metadata | Preserve it; migration may be refused while reading remains possible |

## Apply a new bootstrap

```sh
aapb bootstrap "<project>" --local-only
```

For a new playbook, this creates CURRENT.md and two metadata files, plus the Git-local exclusion. Existing root instructions are preserved automatically. `--preserve-agents` remains accepted for compatibility but is no longer required. Old link/replace-root-policy modes are not supported by the 1.0 bootstrap.

If a playbook already exists, bootstrap reports preservation and performs no writes. In particular, rerunning with `--local-only` does not change existing tracking policy. Inspect Git tracking and project rules before making an existing directory local-only; an exclude entry cannot untrack already committed files.

## Choose sharing and ownership deliberately

Omit `--local-only` for records intended for commits. AAPB does not stage or commit them. Keep private execution output and personal paths in the project's approved local-only location.

The ownership marker covers only known managed files. User documents and root instructions are not disposable template output. Layout migration requires owned, unchanged metadata; do not rewrite hashes or invent ownership to bypass a conflict.

## Update old records gradually

Keep historical decisions and evidence links. Add or update CURRENT.md using verified current facts, then link detail when useful. Do not automatically summarize old execution reports as today's status. Test the application with its own commands and record the actual scope.

Use [Record layout](structured-playbook-layout.md) for writing examples and [Lifecycle](lifecycle.md) for migration preview, apply, and rollback. To test migration safely, use a preserved copy as described in [Local demonstration](demo.md).
