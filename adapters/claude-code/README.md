# Claude Code and other agent hosts

AAPB records are plain Markdown/JSON, and its skill formats are kept separate from host-specific configuration. Use the host's currently supported instruction and skill locations; do not assume every host loads `.agents/skills` automatically.

## Start with files

Read the project's existing instructions and CURRENT.md, then follow relevant links. Use normal file editing for current state, decisions, and handoffs. Run application checks with the project's tools and record the actual result.

To create records when absent, preview `ai-agent-playbook bootstrap "<project>" --dry-run`. Existing project instructions and records remain in place. [First 10 minutes](../../docs/quick-start.md) covers a complete practice run.

## Select guidance and connect tools

Choose entries from [Skill catalog](../../docs/skill-catalog.md). If the host uses a different supported skill root, select it explicitly with `--agents-root` and inspect the preview. Preserve other content and confirm loading in a fresh host session. The CLI's normal default remains `.agents/skills`.

An optional MCP connection can run the same project-bound Node server described in [MCP setup](../../docs/mcp-permission-model.md). Expect four read-only record tools; configuration does not grant file or shell write access.

## Retired hook example

The old package context hook and shell wrappers are retired. `settings.example.json` now contains an inactive empty hooks object and no removed script command. Merge settings deliberately; do not replace an existing host configuration with this empty example. Native file, execution, and scheduling features remain the host's responsibility.

A successful SDK or another-host test does not prove this host's current discovery and tool behavior. Record its actual installed version, catalog, and calls when testing an integration.
