# Copyable templates

Templates become part of a project only after you review and adapt them. They are separate from user-installed skills. Bootstrap uses the minimal record template; it does not copy every template or replace existing instructions.

| Location | Purpose | How to use it |
| --- | --- | --- |
| [agents](agents/README.md) | Stack-neutral project instructions | Merge relevant rules with the project's existing AGENTS.md |
| [project-playbook/CURRENT.md](project-playbook/CURRENT.md) | Current objective, constraints, and evidence | Let bootstrap create it, or adapt the document manually |
| [codex-home](codex-home/README.md) | Optional personal defaults | Review separately from project rules and preserve existing preferences |

## Recommended application

Inspect the actual stack, existing policy, and current records first. For a new playbook, use `ai-agent-playbook bootstrap "<project>" --dry-run`, then apply without the flag. The CLI creates ownership metadata correctly and preserves root instructions.

If you copy only CURRENT.md manually, it remains a plain user document; copying text does not create verified management ownership. Do not manufacture hashes to enable migration. Add detailed decisions, contracts, and handoffs only when needed, using established project locations.

The root policy should identify applicable rules and relevant record entrypoints. Keep product requirements in project documents rather than replicating them in every policy. See [Architecture choices](../docs/project-architecture.md), [Record layout](../docs/structured-playbook-layout.md), [Existing repositories](../docs/existing-repository-bootstrap.md), and [example handoffs](../examples/handoffs/api-contract-handoff-example.md).
