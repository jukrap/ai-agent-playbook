# Runtime Harness V7 Adapter Package Shell 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**목표:** Plugin을 설치하거나 사용자 설정을 변경하지 않고 hook, config, check command를 노출하는 선택적 adapter-local package shell entrypoint를 추가합니다.

**구조:** Core CLI와 문서 하네스를 기본 경로로 유지합니다. `adapters/shared/` 아래 shared adapter shell runner를 추가하고, Codex와 Claude Code entrypoint는 adapter name과 hook runner만 연결합니다. Shell은 기존 core helper를 호출하며, 기존 hook과 마찬가지로 file write를 피합니다.

**기술 스택:** Dependency-free Node ESM, Node test runner, 한국어 번역이 있는 Markdown 문서, PowerShell 검증 스크립트.

---

## 경계

- Shell을 `install.ps1`, `update.ps1`, `scripts/sync-skills.ps1`에 추가하지 않습니다.
- Local settings file을 쓰거나 global settings path를 추측하지 않습니다.
- V7에서 실제 plugin package를 만들지 않습니다.
- Dependency나 global command 요구를 추가하지 않습니다.
- Project policy를 adapter-only file로 옮기지 않습니다.
- Public docs에는 private path, branch name, pull request number, credential, company name, internal URL을 넣지 않습니다.

## Task 1: 실패하는 Adapter Shell 테스트 추가

**파일:**

- 생성: `test/adapter-shell.test.mjs`

**단계:**

1. Codex shell `config` command가 placeholder 없는 config를 렌더링하고 파일을 쓰지 않는지 테스트합니다.
2. Claude Code shell `check` command가 bootstrapped target에서 통과하는지 테스트합니다.
3. Codex shell `hook` command가 fixture payload를 읽고 valid hook JSON을 출력하는지 테스트합니다.
4. Unknown shell command가 이해하기 쉬운 message와 함께 실패하는지 테스트합니다.

**실행:**

```powershell
npm test
```

**예상:** Shell module이 아직 없으므로 테스트가 실패합니다.

## Task 2: Shared Shell Runner와 Entrypoint 구현

**파일:**

- 생성: `adapters/shared/package-shell.mjs`
- 생성: `adapters/codex/package.mjs`
- 생성: `adapters/claude-code/package.mjs`
- 수정: `package.json`

**단계:**

1. `hook`, `config`, `check`를 위한 dependency-free argument parser를 구현합니다.
2. `hook`은 stdin JSON을 읽고 adapter runner를 호출합니다.
3. `config`는 고정 adapter name으로 `renderAdapterConfig`를 호출합니다.
4. `check`는 고정 adapter name으로 `checkAdapterReadiness`를 호출합니다.
5. 새 shell module을 `npm run check`에 추가합니다.

**실행:**

```powershell
npm run check
npm test
```

**예상:** Shell 테스트와 기존 테스트가 모두 통과합니다.

## Task 3: 문서와 번역 갱신

**파일:**

- 수정: `docs/harness-runtime.md`
- 수정: `docs/runtime-roadmap.md`
- 수정: `adapters/codex/README.md`
- 수정: `adapters/claude-code/README.md`
- 수정: `translations/ko/` 아래 대응 파일

**단계:**

1. Shell이 optional이고 local이라는 점을 문서화합니다.
2. 안정 기본 호출은 `node .\bin\ai-playbook.mjs ...`로 유지합니다.
3. Package shell entrypoint는 자동 설치되지 않는다고 명시합니다.
4. English edit과 함께 한국어 번역을 갱신합니다.

**실행:**

```powershell
.\scripts\validate-translations.ps1
```

**예상:** Translation validation이 통과합니다.

## Task 4: 검증과 마무리

**실행:**

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

`docs/plans/2026-06-11-runtime-harness-v4-plus.md`의 public docs denylist와 local absolute path search도 실행합니다.

**예상:** 모든 check가 통과합니다. V7 파일만 stage하고 commit합니다.
