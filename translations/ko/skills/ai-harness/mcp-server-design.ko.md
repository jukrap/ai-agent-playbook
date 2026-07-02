---
name: mcp-server-design
description: Use when designing or changing MCP tools, resources, prompts, permission tiers, write gates, cache/index surfaces, or agent harness integrations.
---

# MCP Server Design

MCP와 integration surface를 위한 primary AI harness skill입니다.

## Workflow

1. capability를 resource, prompt, read tool, scaffold tool, managed write, project write로 분류합니다.
2. read-only tool은 기본값으로 유지하고, write에는 explicit opt-in과 `apply` semantics를 요구합니다.
3. structured content, concise text summary, target path evidence, clear conflict를 반환합니다.
4. read-only tool이 쓰지 않고 write tool이 기본 비활성임을 증명하는 test를 추가합니다.

