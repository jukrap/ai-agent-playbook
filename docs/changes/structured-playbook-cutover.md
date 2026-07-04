# Structured Playbook Cutover

This is a historical change note for the layout and runtime reorganization that introduced the structured `.ai-agent-playbook/` surface.

The active guidance now lives in the dedicated documents for layout, capability taxonomy, runtime behavior, MCP permissions, and repository classification. Do not treat this note as the everyday source of truth.

## What changed

- `.ai-agent-playbook/` became the only active project playbook root.
- Legacy `ai-playbook/` folders moved behind the explicit `migrate path` command.
- Top-level playbook files were organized under `policy/`, `memory/`, `workflows/`, `knowledge/`, `runtime/`, and `integrations/`.
- Generated runtime output stayed separate from reviewed project memory.
- MCP resources and CLI layout reporting switched to structured layout language.

## Current sources of truth

- Layout and migration commands: `docs/structured-playbook-layout.md`.
- Capability and skill grouping: `docs/capability-taxonomy.md`.
- Runtime behavior and memory promotion: `docs/harness-runtime.md`.
- MCP permission boundaries: `docs/mcp-permission-model.md`.
- Repository content roles: `docs/classification.md`.
