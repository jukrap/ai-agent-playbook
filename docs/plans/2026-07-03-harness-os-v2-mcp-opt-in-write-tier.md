# Harness OS v2 MCP Opt-In Write Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a narrow MCP write tier that remains hidden by default and can only write bounded playbook/runtime artifacts when both server opt-in and tool-call `apply` are present.

**Architecture:** Keep the default MCP server read-only. Add `--enable-write-tools` to the local MCP command, pass it into the server registration layer, and expose only scaffold/managed-write tools that already have preview-first runtime implementations.

**Tech Stack:** Dependency-free Node ESM CLI/MCP server, existing workflow/write-gate runtime helpers, Node MCP tests, Markdown docs with Korean translations.

---

## Scope

This slice exposes two opt-in tools:

- `workflow_run_start`: scaffold-tier creation under `.ai-playbook/workflows/runs/`.
- `write_gate_advisory`: managed-write runtime report creation under `.ai-playbook/runtime/reports/write-gate/`.

It does not expose project source rewriting, managed uninstall/prune, canon promotion, migrations, contracts snapshot writes, or package installation.

## Tasks

### Task 1: Server Option

- [x] Parse `ai-playbook mcp --enable-write-tools`.
- [x] Pass `enableWriteTools` into `runMcpServer` and `registerPlaybookMcpTools`.
- [x] Keep default `ai-playbook mcp` behavior unchanged.

### Task 2: Tool Registration

- [x] Register read-only tools with read-only annotations as before.
- [x] Register write-capable tools only when `enableWriteTools` is true.
- [x] Annotate write-capable tools with `readOnlyHint: false` and `destructiveHint: false`.
- [x] Require an `apply` boolean argument on each write-capable tool.
- [x] Preserve dry-run behavior when `apply` is false.

### Task 3: Tests

- [x] Extend default MCP tests to assert `workflow_run_start`, `write_gate_advisory`, and `canon_promote` are absent.
- [x] Add an opt-in MCP test that lists the two write tools.
- [x] Assert `apply: false` previews without writing files.
- [x] Assert `apply: true` writes only under the expected playbook runtime/run directories.

### Task 4: Docs

- [x] Update `docs/mcp-permission-model.md`.
- [x] Update `docs/commands.md`.
- [x] Update Korean translations.

### Task 5: Validate And Commit

- [x] Run `node --check src\cli.mjs`.
- [x] Run `node --check src\mcp-server.mjs`.
- [x] Run `node --check src\mcp-tools.mjs`.
- [x] Run `node --test --test-reporter=dot test\mcp.test.mjs`.
- [x] Run `npm run check`.
- [x] Run `.\scripts\validate-translations.ps1`.
- [x] Run `.\scripts\validate-public-docs.ps1`.
- [x] Run `git diff --check`.
- [x] Stage explicit files, inspect staged diff, and commit.
