# AI Agent Playbook v2 MCP Opt-In Write Tier 구현 계획

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때는 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**Goal:** 기본으로는 숨겨져 있고, server opt-in과 tool-call `apply`가 모두 있을 때만 제한된 playbook/runtime artifact를 쓸 수 있는 좁은 MCP write tier를 추가합니다.

**Architecture:** 기본 MCP server는 read-only로 유지합니다. Local MCP command에 `--enable-write-tools`를 추가하고 server registration layer로 전달한 뒤, 이미 preview-first runtime implementation을 가진 scaffold/managed-write tool만 노출합니다.

**Tech Stack:** Dependency-free Node ESM CLI/MCP server, existing workflow/write-gate runtime helpers, Node MCP tests, Korean translations가 있는 Markdown docs.

---

## Scope

이 slice는 두 가지 opt-in tool만 노출합니다.

- `workflow_run_start`: `.ai-agent-playbook/workflows/runs/` 아래 scaffold-tier 생성.
- `write_gate_advisory`: `.ai-agent-playbook/runtime/reports/write-gate/` 아래 managed-write runtime report 생성.

Project source rewriting, managed uninstall/prune, canon promotion, migration, contracts snapshot write, package installation은 노출하지 않습니다.

## Tasks

### Task 1: Server Option

- [x] `aapb mcp --enable-write-tools`를 parse합니다.
- [x] `enableWriteTools`를 `runMcpServer`와 `registerPlaybookMcpTools`로 전달합니다.
- [x] 기본 `aapb mcp` 동작은 바꾸지 않습니다.

### Task 2: Tool Registration

- [x] 기존처럼 read-only tool은 read-only annotation으로 등록합니다.
- [x] Write-capable tool은 `enableWriteTools`가 true일 때만 등록합니다.
- [x] Write-capable tool에는 `readOnlyHint: false`, `destructiveHint: false`를 annotate합니다.
- [x] 각 write-capable tool에 `apply` boolean argument를 요구합니다.
- [x] `apply`가 false면 dry-run behavior를 유지합니다.

### Task 3: Tests

- [x] 기본 MCP test에서 `workflow_run_start`, `write_gate_advisory`, `canon_promote`가 없는지 확인합니다.
- [x] Opt-in MCP test를 추가해 두 write tool이 list되는지 확인합니다.
- [x] `apply: false`는 file을 쓰지 않고 preview하는지 확인합니다.
- [x] `apply: true`는 예상 playbook runtime/run directory 아래에만 쓰는지 확인합니다.

### Task 4: Docs

- [x] `docs/mcp-permission-model.md`를 업데이트합니다.
- [x] `docs/commands.md`를 업데이트합니다.
- [x] 한국어 번역을 업데이트합니다.

### Task 5: Validate And Commit

- [x] `node --check src\cli.mjs`를 실행합니다.
- [x] `node --check src\mcp-server.mjs`를 실행합니다.
- [x] `node --check src\mcp-tools.mjs`를 실행합니다.
- [x] `node --test --test-reporter=dot test\mcp.test.mjs`를 실행합니다.
- [x] `npm run check`를 실행합니다.
- [x] `.\scripts\validate-translations.ps1`를 실행합니다.
- [x] `.\scripts\validate-public-docs.ps1`를 실행합니다.
- [x] `git diff --check`를 실행합니다.
- [x] 명시 파일만 stage하고 staged diff를 확인한 뒤 commit합니다.
