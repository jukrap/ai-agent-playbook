# AI Agent Playbook v2 Reference Source Registry Preview Plan

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**목표:** Local reference adoption queue를 안전한 no-write `knowledge/sources.json` 후보로 연결해, 외부 harness material을 upstream prose 복사나 local path 유출 없이 source metadata로 추적할 수 있게 합니다.

**아키텍처:** `reference adoption-queue` scoring을 재사용합니다. 선택된 queue item을 relative locator, privacy boundary, freshness, promotion policy, caveat, representative candidate file을 가진 compact source registry entry로 변환합니다. Preview는 CLI와 MCP를 통해 read-only evidence로 노출합니다.

**기술 스택:** Dependency-free Node ESM catalog helper, 기존 CLI/MCP registration, runtime source registry schema, Node tests, Korean translation이 포함된 Markdown docs.

---

## 범위

이번 slice에서 추가합니다:

- `reference source-registry-preview <reference-dir>` CLI command.
- `reference_source_registry_preview` MCP read-only tool.
- 기존 `runtime.source-registry` validator와 호환되는 source registry candidate output.
- 20개가 넘는 local reference collection이 조용히 잘리지 않도록 `reference inventory` 기본 scan을 보정합니다.
- Command/MCP docs와 Korean translation.

이번 slice에서 하지 않습니다: `.ai-agent-playbook/knowledge/sources.json` 쓰기, reference를 memory로 promotion, upstream raw text 복사, network source 읽기, embedding 생성.

## 작업

### Task 1: Inventory Default Guard

- [x] `reference inventory` 기본 scan을 catalog 기본 project cap과 맞춥니다.
- [x] 20개 초과 top-level reference project에 대한 regression coverage를 추가합니다.

### Task 2: Source Registry Preview Model

- [x] Adoption queue item에서 source registry candidate entry를 만듭니다.
- [x] Entry locator는 scanned reference root 기준 relative path로 유지합니다.
- [x] Privacy, credential boundary, freshness, promotion policy, caveat, capability hint, representative file을 포함합니다.
- [x] 생성된 registry shape를 기존 source registry schema로 검증합니다.

### Task 3: CLI And MCP

- [x] `reference source-registry-preview <reference-dir> [--max-results N] [--json]`를 추가합니다.
- [x] 기본 read-only MCP tool `reference_source_registry_preview`를 추가합니다.
- [x] Command와 tool은 local-only, network-free, no-write로 유지합니다.

### Task 4: Docs

- [x] `docs/commands.md`를 갱신합니다.
- [x] `docs/mcp-permission-model.md`를 갱신합니다.
- [x] Korean translation을 갱신합니다.

### Task 5: Validate And Commit

- [x] Syntax check를 실행합니다.
- [x] Targeted CLI/MCP/runtime schema test를 실행합니다.
- [x] Translation과 public-doc validation을 실행합니다.
- [x] Targeted check가 통과하면 full test suite를 실행합니다.
- [x] 명시적으로 file을 stage하고 staged diff 확인 후 commit, push합니다.
