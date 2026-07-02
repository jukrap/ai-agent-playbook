# Harness OS

Harness OS is the v1 name for the expanded runtime, skill, MCP, and project-memory model in this repository.

The goal is not to make `.ai-playbook` larger for its own sake. The goal is to separate stable human knowledge, generated runtime output, reusable skills, workflow recipes, and integration surfaces so an agent can work across many software domains without relying on one stack-specific habit.

## Design Principles

- Capability-first taxonomy: classify skills by problem space and task ability before technology stack.
- Compatibility by default: keep existing skill names and v1 playbook paths usable while adding v2 structure.
- Local-first runtime: indexes, reports, graphs, snapshots, and cache live under `runtime/`.
- Explicit promotion: generated runtime output does not become trusted memory until reviewed and copied into `memory/`.
- Read-only MCP baseline: analysis tools are exposed by default; write tools require explicit opt-in design.
- Reference adoption: external material should be distilled into local capabilities without leaving noisy source references in everyday prompts.

## Main Surfaces

- `src/catalog`: capability, skill, and workflow catalogs.
- `src/layout`: `.ai-playbook` v1/v2 layout detection and migration.
- `src/runtime`: local caches and indexes.
- `src/mcp-tools.mjs`: MCP tools, resources, and prompts.
- `templates/project-playbook`: copyable project memory and runtime structure.
- `skills`: installable agent skills and references.

## Compatibility

Existing v1 playbooks continue to work. The v2 layout adds `policy/`, `memory/`, `workflows/`, `knowledge/`, `runtime/`, and `integrations/` while retaining the old top-level files and directories for at least one release line.

