# AI Agent Playbook v2 Reference Ledger Init Plan

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**목표:** Local reference adoption queue에서 reference adoption ledger를 만드는 preview-first scaffold command를 추가해, 외부 harness와 skill reference를 raw reference content 복사 없이 추적할 수 있게 합니다.

**아키텍처:** `buildReferenceAdoptionQueue`와 기존 ledger schema를 재사용합니다. Queue에 오른 reference candidate를 `new` row로 담은 Markdown ledger를 만들고, 기본 대상은 `.ai-playbook/knowledge/reference-adoption-ledger.md`입니다. Overwrite는 거부하며 `--apply`가 있을 때만 씁니다.

**기술 스택:** Dependency-free Node ESM catalog helper, 기존 CLI routing, Node tests, Korean translation이 포함된 Markdown docs.

---

## 범위

이번 slice에서 추가합니다:

- `reference ledger-init <target> --reference-dir <dir>` CLI command.
- Planned ledger path, operation, generated row count를 담는 dry-run result.
- Target repository 내부의 missing ledger만 쓰는 `--apply` 지원.
- No-write preview, apply, overwrite refusal, ledger-check compatibility test.
- Command docs와 Korean translation.

이번 slice에서 기존 ledger update, decision merge, source registry write, reference fact의 memory promotion, project-write MCP tool 추가는 하지 않습니다.

## 작업

### Task 1: Ledger Scaffold Model

- [x] Reference adoption catalog에 ledger initialization helper를 추가합니다.
- [x] Queue scoring을 재사용하고 queued project를 compact `new` ledger row로 변환합니다.
- [x] 생성 content에 absolute path와 raw excerpt가 들어가지 않게 합니다.

### Task 2: Safety And Apply Semantics

- [x] 기존 target-contained path rule로 ledger path를 해석합니다.
- [x] 기존 ledger overwrite를 거부합니다.
- [x] Preview mode는 read-only로 유지하고 `--apply`일 때만 씁니다.

### Task 3: CLI And Docs

- [x] `reference ledger-init <target> --reference-dir <dir> [--apply] [--json]`를 추가합니다.
- [x] `docs/commands.md`와 Korean translation을 갱신합니다.
- [x] Public harness facade에서 helper를 export합니다.

### Task 4: Tests

- [x] Dry-run no-write behavior에 대한 CLI test를 추가합니다.
- [x] Apply, overwrite refusal, `ledger-check` compatibility에 대한 CLI test를 추가합니다.
- [x] Custom `--path` path safety coverage를 추가합니다.

### Task 5: Validate And Commit

- [x] Syntax check를 실행합니다.
- [x] Targeted CLI test를 실행합니다.
- [x] Commit 전 full validation을 실행합니다.
- [x] 명시적으로 file을 stage하고 staged diff 확인 후 commit, push합니다.
