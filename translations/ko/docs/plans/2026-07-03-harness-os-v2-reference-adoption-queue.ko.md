# AI Agent Playbook v2 Reference Adoption Queue 계획

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때는 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**Goal:** 큰 local reference collection을 compact하고 read-only인 adoption backlog로 바꿔, 앞으로도 reference를 계속 활용하면서 noisy source text를 prompt나 public docs에 복사하지 않게 합니다.

**Architecture:** 기존 `reference inventory` scanner 위에 scoring layer를 추가합니다. Signal을 priority, recommended capability area, representative file path, next adoption action으로 매핑합니다. 결과는 CLI와 MCP에서 read-only evidence로 노출합니다.

**Tech Stack:** Dependency-free Node ESM catalog helper, existing CLI/MCP registration, Node tests, Korean translations가 있는 Markdown docs.

---

## Scope

이 slice는 다음을 추가합니다.

- `reference adoption-queue <reference-dir>` CLI command.
- `reference_adoption_queue` MCP read-only tool.
- Priority, capability recommendation, signal highlight, representative file, next adoption action을 포함한 scored queue output.
- Command/MCP docs와 한국어 번역.

Upstream prose를 복사하거나, 새 skill을 자동 생성하거나, project memory를 쓰거나, embedding을 만들거나, reference를 trusted memory로 promote하지 않습니다.

## Tasks

### Task 1: Queue Model

- [x] 기존 reference inventory scan을 재사용합니다.
- [x] Skills, agents, MCP, commands, hooks, workflows, memory, indexes, connectors, security, compliance, docs, tests, package metadata를 점수화합니다.
- [x] Priority bucket과 recommended capability area를 반환합니다.
- [x] Raw source excerpt 대신 next adoption action을 반환합니다.

### Task 2: CLI And MCP

- [x] `reference adoption-queue <reference-dir> [--max-results N] [--json]`를 추가합니다.
- [x] 기본 read-only MCP tool `reference_adoption_queue`를 추가합니다.
- [x] Command와 tool을 local-only, network-free, no-write로 유지합니다.

### Task 3: Tests

- [x] CLI reference test를 queue scoring과 read-only behavior까지 확장합니다.
- [x] MCP test를 default tool exposure와 read-only tool call까지 확장합니다.

### Task 4: Docs

- [x] `docs/commands.md`를 업데이트합니다.
- [x] `docs/mcp-permission-model.md`를 업데이트합니다.
- [x] 한국어 번역을 업데이트합니다.

### Task 5: Validate And Commit

- [x] Syntax check를 실행합니다.
- [x] Targeted CLI/MCP test를 실행합니다.
- [x] Translation/public-doc validation을 실행합니다.
- [x] Targeted check가 통과하면 full test suite를 실행합니다.
- [x] 명시 파일만 stage하고 staged diff를 확인한 뒤 commit합니다.
