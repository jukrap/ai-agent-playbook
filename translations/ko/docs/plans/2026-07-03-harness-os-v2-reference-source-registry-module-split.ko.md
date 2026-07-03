# Harness OS v2 Reference Source Registry Module Split Plan

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**목표:** 커진 reference adoption module에서 source registry preview/check 동작을 분리해 reference inventory, adoption queue, ledger validation, source registry operation의 경계를 더 명확히 합니다.

**아키텍처:** `src/catalog/reference-adoption.mjs`는 local reference inventory, adoption queue scoring, adoption ledger check에 집중합니다. `buildReferenceSourceRegistryPreview`와 `checkReferenceSourceRegistry`는 queue builder와 runtime schema validator를 가져오는 새 `src/catalog/reference-source-registry.mjs` module로 이동합니다. Public facade export와 CLI/MCP behavior는 유지합니다.

**기술 스택:** Dependency-free Node ESM module, 기존 CLI/MCP registration, Node tests, package syntax check, Korean translation이 포함된 Markdown docs.

---

## 범위

이번 slice는 구조만 바꿉니다:

- `src/catalog/reference-source-registry.mjs`를 추가합니다.
- Source registry preview/check helper를 `reference-adoption.mjs`에서 이동합니다.
- CLI와 MCP command/tool 이름은 바꾸지 않습니다.
- 새 module을 `package.json` check coverage에 추가합니다.
- 이 plan과 Korean translation을 추가합니다.

이번 slice에서 command output shape, adoption queue scoring, source registry schema, MCP permission tier, reference content scanning behavior는 바꾸지 않습니다.

## 작업

### Task 1: Plan And Review

- [x] 구조 변경 전에 최근 reference/source-registry test가 통과했는지 확인합니다.
- [x] 동작 변경 없이 옮길 function과 helper를 식별합니다.

### Task 2: Module Split

- [x] `src/catalog/reference-source-registry.mjs`를 만듭니다.
- [x] `buildReferenceSourceRegistryPreview`, `checkReferenceSourceRegistry`, source registry helper function을 이동합니다.
- [x] `reference-adoption.mjs`에서 source-registry 전용 import와 constant를 제거합니다.
- [x] `src/harness.mjs` public facade export를 유지합니다.

### Task 3: Tooling And Tests

- [x] 새 module을 `npm run check`에 추가합니다.
- [x] 변경 module에 대한 targeted syntax check를 실행합니다.
- [x] Targeted CLI/MCP/module-boundary test를 실행합니다.
- [x] Commit 전 full validation을 실행합니다.

### Task 4: Commit

- [x] 명시적으로 file만 stage합니다.
- [x] Staged diff와 whitespace를 확인합니다.
- [x] 기존 feature branch에 commit, push합니다.
