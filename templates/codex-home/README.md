# Personal Codex instruction template

[AGENTS.md](AGENTS.md) supplies defaults for communication, authorized work, tools, continuity, verification, and Git delivery across projects. It is separate from a project's root instructions and architecture.

The usual personal location is `~/.codex/AGENTS.md`; a custom Codex home changes that location. Check the installed host's configuration before applying it. The copy in this package is a template, not the file your running host necessarily uses.

## Review and adopt

Compare the template with current personal instructions and merge the preferences you want. Preserve the user's language, explicit approval conditions, and existing custom rules. Package installation, skill installation, and project bootstrap do not install or overwrite the personal file.

Review the source changes before applying them to the host. Keep model and reasoning choices, numeric settings, permissions, and unrelated configuration intact. A copied instruction is not proof that the active host has loaded or exercised it.

The template has sections so useful defaults remain understandable. Its length is not governed by the brevity target for skill entrypoints. Add a personal rule when it addresses a repeated need; remove a rule when it duplicates host behavior, conflicts with current intent, or no longer applies.

## What belongs here?

| Personal defaults | Project-owned detail |
| --- | --- |
| Language, tone, and evidence in explanations | Product terminology and acceptance requirements |
| Working within authorization and preserving edits | Deployment permissions and repository-specific Git procedures |
| Selecting useful tools and recording progress | Frameworks, package managers, commands, and record locations |
| Honest verification and delivery reports | Architecture, public imports, data ownership, and temporary exceptions |

Keep product architecture in the project so another project is not forced to inherit it. See [project instructions](../agents/README.md) and [architecture decisions](../../docs/project-architecture.md).

Example repositories may have special dependency, tool, or Git restrictions. Carry those into their own project instructions only when applicable; do not turn them into personal defaults for every project.

## Records and delegation

Use the project's existing entrypoint and read supporting records only when relevant. CURRENT.md carries the active objective and next action. Topic knowledge carries current rules and contracts with sources and uncertainty. Worklogs retain detailed milestone evidence; monthly folders organize logs without requiring a monthly summary. Existing layouts and local-only records remain valid, including in projects without Git.

A workspace's common records and its selected code repository serve different purposes. Confirm explicit membership and the target repository before code or Git operations. Finding an ancestor record folder does not make every descendant a member.

The main task normally writes its own records. A long, independent draft can be delegated with a bounded fact packet and short relevant history, then reviewed before incorporation. Model-specific details belong in [Codex model use](../../adapters/codex/model-use.md): Astra or Sol can handle the main task, including the user's Sol `xhigh` or `max` choice. Delegation does not authorize changing that choice or bypassing existing approvals.

## Changes from the earlier template

Communication, privacy, scope, uncertainty, verification, and delivery remain explicit. The old fixed reading chain and references to generated policy files are not required. Current code is evidence of existing behavior; it does not outrank an accepted project requirement merely because the implementation differs.

The template does not set model, context/output budgets, plugin activation, experimental features, a scheduler, or wait defaults. [Codex setup](../../adapters/codex/README.md) explains skills and optional MCP separately; the model-use reference distinguishes host-specific capabilities from AAPB instructions.
