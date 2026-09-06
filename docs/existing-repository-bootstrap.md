# Add AAPB to an existing repository

Start by inspecting the repository and its existing instructions. AAPB can read old records without rebuilding them. Bootstrap is only for a project that does not already have a playbook.

## Inspect before writing

```sh
ai-agent-playbook records status "<project>" --json
ai-agent-playbook records status "<project>" --view records --json
ai-agent-playbook bootstrap "<project>" --local-only --dry-run
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
ai-agent-playbook bootstrap "<project>" --local-only
```

For a new playbook, this creates CURRENT.md and two metadata files, plus the Git-local exclusion. Existing root instructions are preserved automatically. `--preserve-agents` remains accepted for compatibility but is no longer required. Old link/replace-root-policy modes are not supported by the 1.0 bootstrap.

If a playbook already exists, bootstrap reports preservation and performs no writes. In particular, rerunning with `--local-only` does not change existing tracking policy. Inspect Git tracking and project rules before making an existing directory local-only; an exclude entry cannot untrack already committed files.

## Choose sharing and ownership deliberately

Omit `--local-only` for records intended for commits. AAPB does not stage or commit them. Keep private execution output and personal paths in the project's approved local-only location.

The ownership marker covers only known managed files. User documents and root instructions are not disposable template output. Layout migration requires owned, unchanged metadata; do not rewrite hashes or invent ownership to bypass a conflict.

## Architecture and root instructions

Bootstrap does not choose or migrate source architecture. Keep accepted project boundaries and existing AGENTS.md; when instructions or architecture decisions need writing, adapt [the neutral project template](../templates/agents/AGENTS.md) and [architecture guidance](project-architecture.md). A stack dependency is not permission to apply an old profile or move source files.

## Update old records gradually

Keep historical decisions and evidence links. Add or update CURRENT.md using verified current facts, then link detail when useful. Do not automatically summarize old execution reports as today's status. Test the application with its own commands and record the actual scope.

Use [Record layout](structured-playbook-layout.md) for writing examples and [Lifecycle](lifecycle.md) for migration preview, apply, and rollback. To test migration safely, use a preserved copy as described in [Local demonstration](demo.md).

## Review instructions when upgrading from 0.5

Updating npm, installing skills, or migrating layout metadata does not rewrite existing project instructions. Old records can remain readable while active guidance still requests retired commands or unavailable skills. Record validation checks structure and ownership, not whether every instruction is current.

1. Back up the instructions you will edit and inspect their Git tracking and local-only rules. Read the actual entrypoint and the project rules that link to it.
2. Review active `AGENTS.md`, `CURRENT.md`, and, when present, `START_HERE.md` and `policy/SKILLS.md`. Follow links relevant to the upgrade. Search results in old worklogs are historical evidence, not a list of files to rewrite.
3. Update unsupported guidance using the mappings below. Preserve product decisions, architecture boundaries, approval requirements and project-specific verification commands.
4. Make CURRENT.md the current-state entrypoint through a reviewed file edit. Keep useful navigation and detailed guides. If dated history obscures the next action, move that history intact to a linked record; do not summarize it into newly verified facts.
5. Read the revised entrypoint and linked handoff from a fresh session. Check whether it identifies the changed scope, protected decisions, next action and untested work without the previous conversation.

| Active 0.5 guidance | Current approach |
| --- | --- |
| `operator context` or old catalog/index tools | Use `records read` / `records search` or corresponding MCP tools for records; read source files with ordinary project tools |
| `run start` or a required AAPB execution loop | Use the host's normal execution tools and write records at meaningful milestones |
| Old MCP resources, workflow prompts or write-enabling flags | Inspect the four advertised tools; edit records through files or supported explicit CLI operations |
| Retired skill names or a mandatory full skill sequence | Select current capabilities from the [skill catalog](skill-catalog.md); retain useful project contracts in project documents |
| Every map, plan and worklog must be read on entry | Start with current state and follow the references needed for this task |

Keep historical commands and evidence where they explain past work. Do not reinstall old skills to satisfy a stale policy, rewrite ownership hashes to hide `managed-modified` results, or replace project instructions wholesale with a template. [Lifecycle](lifecycle.md) covers deliberate old-runtime recovery.

Record verification and application verification remain separate. A successful read does not prove that a past implementation claim is still true. If a fresh session reports a host-tool failure or missing evidence, preserve those limits in the handoff rather than calling the entire workflow verified.
