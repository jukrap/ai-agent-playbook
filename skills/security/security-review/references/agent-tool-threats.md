# Agent Tool Threats

Use this reference when an application, harness, workflow, or repository includes AI agents, MCP servers, tool calls, project-local settings, memory, retrieval, or automated external communication.

## Core Threat Model

Agent risk rises sharply when these three capabilities meet in one runtime:

- Private data: secrets, source code, customer data, internal docs, local files, tokens, account state, or memory.
- Untrusted content: web pages, emails, PDFs, screenshots, OCR text, issue comments, PR diffs, dependency metadata, tool output, or model-generated text.
- External communication or action: network requests, chat replies, commits, shell commands, browser automation, ticket updates, MCP tools, or file writes.

If all three are present, treat prompt injection as a data-exfiltration and action-abuse risk rather than a harmless instruction-following bug.

## Surfaces To Inspect

- Project-local agent config: hooks, settings, tool allowlists, environment overrides, MCP declarations, and adapter config committed with the repo.
- Tool descriptions and schemas: hostile or over-broad instructions, hidden side effects, credential prompts, and mismatched read/write behavior.
- Tool output: instructions embedded in search results, logs, docs, package metadata, OCR, comments, and generated reports.
- Memory and retrieval: untrusted text promoted into long-term memory, source registry, vector index, cache, or decision docs.
- Automation permissions: auto-approve, background tasks, scheduled agents, CI bots, GitHub comments, issue assignment, and PR review flows.
- Secret paths: environment variables, config files, CLI args, shell history, logs, browser bundles, screenshots, and debug dumps.

## Guardrails

- Separate read, scaffold, managed-write, and project-write tools. Expose write tools only with explicit opt-in, target path validation, dry-run preview, apply flag, and audit log.
- Treat project-local agent config as untrusted until the repository is trusted. Do not run hooks, shell setup, or MCP servers before trust is established.
- Keep untrusted content out of system prompts, tool descriptions, and long-term memory. When it must be used, label it as data and strip instructions.
- Require explicit human approval before combining untrusted content with secret-bearing tools or external communication.
- Redact secrets at collection time, not only before final output.
- Keep memory promotion explicit: runtime reports and retrieved text should not become durable project knowledge without review.

## Review Checks

- Can untrusted content cause a tool call, shell command, network request, commit, or message send?
- Can a repo-controlled file alter agent endpoints, model provider URL, hooks, tool allowlists, or environment variables?
- Can a tool read more filesystem, network, credential, or workspace state than the task needs?
- Can a malicious MCP server hide instructions in its tool description, schema, resource content, or normal-looking result?
- Can a generated report or cache later be trusted as memory without provenance and review?
- Is there a logged approval trail for high-risk writes and external actions?

## Verification

- Add fixture tests with malicious text in comments, docs, tool output, or retrieved content when the harness has parser/adapter code.
- Validate default MCP/tool mode is read-only and write tools are hidden or disabled unless opt-in flags are present.
- Check public docs and generated examples for personal paths, credentials, provider keys, internal URLs, and over-broad setup commands.
- Confirm logs redact secrets and do not persist raw untrusted prompts that include private context.
- For CI or bot flows, verify lower-trust users cannot cause privileged agent execution without human approval.
