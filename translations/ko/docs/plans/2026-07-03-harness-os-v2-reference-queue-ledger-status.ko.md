# Harness OS v2 Reference Queue Ledger Status Plan

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**목표:** `reference adoption-queue`가 reference adoption ledger에서 이미 reviewed, adopted, deferred, rejected로 판단한 entry와 새 후보를 구분할 수 있게 합니다.

**아키텍처:** 기존 ledger parser를 확장해 reference id 기준 compact row detail을 노출합니다. Adoption queue builder, CLI, MCP tool에 optional ledger path를 추가합니다. Ledger가 있으면 queue item에 `ledgerStatus`, `ledgerCapability`, `ledgerDecisionDate`를 붙이고 summary에는 status count를 포함합니다. Ledger가 없을 때 기본 queue behavior는 유지합니다.

**기술 스택:** Dependency-free Node ESM catalog helper, 기존 CLI/MCP registration, Node tests, Korean translation이 포함된 Markdown docs.

---

## 범위

이번 slice에서 추가합니다:

- `reference adoption-queue`의 optional `--ledger <ledger.md>` 지원.
- `reference_adoption_queue` MCP tool의 optional `ledgerPath` argument.
- Adoption ledger 기반 queue item annotation.
- Queue item의 ledger status summary count.
- Test, command docs, Korean translation.

이번 slice에서 ledger 쓰기, 기본 queue item filtering, reference contents 복사, scoring weight 변경, basic queue 사용 시 ledger 요구는 하지 않습니다.

## 작업

### Task 1: Ledger Detail Model

- [x] Ledger row parsing을 확장해 reference id, status, capability, decision date를 반환합니다.
- [x] Normalized reference id 기준 compact ledger index를 만듭니다.
- [x] 기존 `reference ledger-check` behavior와 output shape를 유지합니다.

### Task 2: Queue Annotation

- [x] `buildReferenceAdoptionQueue`에 optional ledger support를 추가합니다.
- [x] Matching ledger entry가 있을 때 queue item을 annotate합니다.
- [x] Queue summary에 ledger status count를 반환합니다.
- [x] Ledger가 없을 때 output compatibility를 유지합니다.

### Task 3: CLI And MCP

- [x] CLI command에 `--ledger <ledger.md>`를 추가합니다.
- [x] MCP tool schema에 optional `ledgerPath`를 추가합니다.
- [x] 모든 path는 read-only, local로 유지합니다.

### Task 4: Tests And Docs

- [x] Annotated queue output에 대한 CLI test를 확장합니다.
- [x] Optional ledger annotation에 대한 MCP test를 확장합니다.
- [x] `docs/commands.md`와 Korean translation을 갱신합니다.

### Task 5: Validate And Commit

- [x] Syntax check를 실행합니다.
- [x] Targeted CLI/MCP test를 실행합니다.
- [x] Commit 전 full validation을 실행합니다.
- [x] 명시적으로 file을 stage하고 staged diff 확인 후 commit, push합니다.
