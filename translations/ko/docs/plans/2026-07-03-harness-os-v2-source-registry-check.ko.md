# AI Agent Playbook v2 Source Registry Check Plan

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**목표:** Preview 또는 수동 채택 뒤 `.ai-agent-playbook/knowledge/sources.json`의 reference source metadata를 검증할 수 있는 read-only check를 추가합니다.

**아키텍처:** 기존 runtime source registry schema validator를 재사용한 뒤 duplicate id, stale freshness value, optional local reference path existence, representative file drift 같은 source-specific 운영 검사를 추가합니다. Check는 local-only, no-write로 유지합니다.

**기술 스택:** Dependency-free Node ESM catalog helper, 기존 CLI/MCP registration, runtime source registry schema, Node tests, Korean translation이 포함된 Markdown docs.

---

## 범위

이번 slice에서 추가합니다:

- `reference source-registry-check <target>` CLI command.
- `reference_source_registry_check` MCP read-only tool.
- Schema shape, duplicate source id, status/privacy/type summary, stale freshness, optional reference directory drift 검증.
- Command/MCP docs와 Korean translation.

이번 slice에서 하지 않습니다: `sources.json` 쓰기, preview output 적용, source를 memory로 promotion, network source 읽기, 등록된 relative path 존재 여부 확인을 넘어선 upstream raw content 검사.

## 작업

### Task 1: Check Model

- [x] 기본적으로 `.ai-agent-playbook/knowledge/sources.json`에서 source registry를 resolve합니다.
- [x] Target project 내부의 optional source registry path를 받습니다.
- [x] 기존 `runtime.source-registry` validator를 재사용합니다.
- [x] Source status, privacy tier, type을 집계합니다.
- [x] Duplicate id와 stale/malformed freshness value를 보고합니다.
- [x] `--reference-dir`가 제공되면 등록된 `referencePath`와 representative file을 내용 읽기 없이 확인합니다.

### Task 2: CLI And MCP

- [x] `reference source-registry-check <target> [--path <sources.json>] [--reference-dir <dir>] [--json]`를 추가합니다.
- [x] 기본 read-only MCP tool `reference_source_registry_check`를 추가합니다.
- [x] Command와 tool은 local-only, network-free, no-write로 유지합니다.

### Task 3: Tests

- [x] Valid registry check와 reference path drift에 대한 CLI test를 확장합니다.
- [x] Tool exposure와 read-only source registry check에 대한 MCP test를 확장합니다.

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
