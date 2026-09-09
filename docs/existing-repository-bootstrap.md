# Add AAPB to an existing repository

Start by inspecting the repository and its existing instructions. AAPB can read old records without rebuilding them. Bootstrap can create missing records or add explicitly selected guides, links, and exclusions while preserving existing content.

## Inspect before writing

```sh
ai-agent-playbook records status "<project>" --json
ai-agent-playbook records status "<project>" --view records --json
ai-agent-playbook bootstrap "<project>" --local-only --dry-run
```

Use `--local-only` as the compatibility alias for `--exclude local`, which writes Git's `info/exclude`. AAPB resolves the Git repository containing the setup root; the selected folder need not contain its own `.git` directory. Nested project folders and linked worktrees are supported, and worktrees may share the exclude file. Outside Git, an explicit local request permits creation and reports that exclusion was skipped; no Git repository is initialized. Read `AGENTS.md` and the entrypoint shown by status. Check dirty Git changes before deciding whether any document should be changed.

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

This explicit invocation uses minimal records and requests local exclusion. Use `--records standard` to add worklog and knowledge guides, `--lang en|ko` for new text, and `--agents link` to append a short records link without replacing instructions. `--agents preserve` is the default; `--preserve-agents` remains its compatible alias. The old replace-root-policy modes remain unsupported.

On a repeat run, existing documents, metadata, and membership are preserved. Missing standard guides and an explicitly selected AGENTS link may be added; explicit exclusion choices can move unchanged AAPB-owned rules. Inspect the proposed operations and returned backup. User ignore rules and already tracked files are preserved: an exclude entry cannot untrack committed files.

## Choose sharing and ownership deliberately

Choose `--exclude none` for records intended to be available for commits; existing user or global rules may still exclude them. AAPB does not stage or commit them. Keep private execution output and personal paths in the project's approved local-only location.

The ownership marker covers only known managed files. User documents and root instructions are not disposable template output. Layout migration requires owned, unchanged metadata; do not rewrite hashes or invent ownership to bypass a conflict.

## Choose exclusions and revisit setup

| Mode | Effect |
| --- | --- |
| `local` | Add the target record path to Git's `info/exclude`; linked worktrees can share it. Outside Git, the guide shows this choice disabled with a reason; explicit local arguments report a skipped exclusion and keep records usable. |
| `shared` | Add an ignore rule to `.gitignore`; sharing that rule requires your own commit. The records themselves are excluded. |
| `global` | Use the user's Git exclusion file; affects other repositories using it. Review that scope explicitly. |
| `none` | Add no rule; remove only unchanged AAPB-owned rules for this target during a managed transition. |

```sh
ai-agent-playbook bootstrap "<project>" --records standard --exclude shared --agents preserve --dry-run --json
ai-agent-playbook bootstrap "<project>" --records standard --exclude shared --agents preserve --json
```

No mode stages, untracks, or commits files. User rules and shared ignore precedence can still affect Git's result. Records above child repositories do not need exclusions added to every child. Preserve returned journals and use [bootstrap recovery](lifecycle.md) for exclusion or AGENTS-link changes.

Bare interactive bootstrap offers a guide; `--interactive` requests it explicitly. A new setup includes folder preparation: check the project or parent folder, prepare child repositories yourself for a workspace, then continue. AAPB creates the missing record folder after final apply; it does not move or clone repositories. Existing workspaces keep their registry and use `workspace add/remove` for membership changes.

Recommended and current settings have separate markers. Standard guides and local exclusion with Git, or no exclusion outside Git, are recommendations, not automatic selections. Choose a single item by number or arrow keys and Enter; Enter alone does not advance. Repository checkboxes use Space and Enter. `q` and key help are above the list; Esc or `b` goes back outside search input when available. At final review, Change a setting returns you to a field before another review. The outcome is readable text with the selected language and next action.

`--yes` keeps its existing defaults and saved settings without questions; explicit options take precedence. Explicit argument and non-interactive calls still use minimal/no-exclusion defaults unless overridden. `--json` never asks and retains structured output. See [Commands](commands.md) for search, number ranges, and controls, and [Workspaces](workspaces.md) for registered-member setup.

## Architecture and root instructions

Bootstrap does not choose or migrate source architecture. Keep accepted project boundaries and existing AGENTS.md; when instructions or architecture decisions need writing, adapt [the neutral project template](../templates/agents/AGENTS.md) and [architecture guidance](project-architecture.md). A stack dependency is not permission to apply an old profile or move source files.

## Update old records gradually

Keep historical decisions and evidence links. Add or update CURRENT.md using verified current facts, then link detail when useful. Do not automatically summarize old execution reports as today's status. Test the application with its own commands and record the actual scope.

Use [Durable records](durable-records.md) for milestone worklogs and current knowledge, [Record layout](structured-playbook-layout.md) for writing examples and [Lifecycle](lifecycle.md) for migration preview, apply, and rollback. To test migration safely, use a preserved copy as described in [Local demonstration](demo.md).

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
