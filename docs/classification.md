# Where content belongs

AAPB separates reusable instructions, project files, executable behavior, and human guidance because they have different readers and lifecycles.

| Location | Content | How it is used |
| --- | --- | --- |
| `skills/<category>/<name>/SKILL.md` | Short task triggers and applicable constraints | Discovered and selected by the agent host |
| A skill's `references/` | Detail needed by that selected skill | Travels with the skill, read when useful |
| Root `references/` | Optional historical domain examples and contracts | Consulted explicitly; not a second skill catalog |
| `templates/agents/` | Copyable project instructions | Reviewed and adapted into a project's existing policy |
| `templates/project-playbook/` | Minimal current-state template and metadata | Used by bootstrap; detail added as needed |
| `examples/` | Completed or reusable examples | Read for format and intent, not as current project facts |
| `docs/`, README, CONTEXT | Human onboarding, usage, architecture, and maintenance | Navigated by reader purpose |
| `adapters/` | Agent-host setup and integration boundaries | Used for the selected host |
| `src/`, `bin/` | Executable CLI/MCP behavior | Tested code, not prose instructions |
| `translations/ko/` | Korean reading copies | Human use; not installed as duplicate skills |

## When adding or moving material

Put a project-specific fact in that project's records, not in a reusable skill. Put a required output format in an artifact reference, and put an executable invariant in code and a meaningful test. A long beginner walkthrough belongs in human documentation even if the matching skill entrypoint is short.

Keep English/Korean functional coverage together. Preserve README branding, language selection, and intentional localized explanations. Do not infer that shorter runtime instructions authorize removing human navigation or examples.

Use [Maintenance](maintenance.md) before structural changes. [Reference adoption](reference-adoption.md) explains how to preserve sourced examples without turning them into mandatory instructions.
