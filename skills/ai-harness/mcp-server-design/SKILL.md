---
name: mcp-server-design
description: Use when designing or changing MCP tools, resources, prompts, permission tiers, write gates, cache/index surfaces, or agent harness integrations.
---

# MCP Server Design

Use this as the primary AI harness skill for MCP and integration surfaces.

## Workflow

1. Classify the capability as resource, prompt, read tool, scaffold tool, managed write, or project write.
2. Keep read-only tools default; require explicit opt-in and `apply` semantics for writes.
3. Return structured content, concise text summaries, target path evidence, and clear conflicts.
4. Add tests that prove read-only tools do not write and write tools stay disabled by default.

## Reference

Read `references/runtime-boundaries-and-permissions.md` when MCP work includes a daemon, transport, session store, queue mode, tunnel/remote surface, scoped token, approval flow, or server-backed search/read bridge.
