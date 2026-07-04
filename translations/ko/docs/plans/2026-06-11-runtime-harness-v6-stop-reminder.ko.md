# Runtime Harness V6 Stop Reminder 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**목표:** Blocking, continuation, automatic doctor execution, file write 없이 좁은 opt-in `Stop` lifecycle reminder를 추가합니다.

**구조:** 문서와 CLI 하네스를 안정 core로 유지합니다. Shared adapter hook event allowlist를 확장해 `Stop`이 명시적으로 켜진 경우에만 다른 reminder와 같은 hook JSON shape를 출력하게 합니다. 현재 runtime contract에는 이 low-noise reminder를 위해 blocking이나 continuation이 필요하지 않으므로 두 기능은 보류합니다.

**기술 스택:** Dependency-free Node ESM, Node test runner, 한국어 번역이 있는 Markdown 문서, PowerShell 검증 스크립트.

---

## 경계

- `Stop`은 기본값에서 꺼져 있습니다.
- `Stop`은 `AI_AGENT_PLAYBOOK_HOOK_EVENTS`를 통해서만 켭니다.
- 대상에 `.ai-agent-playbook/` 또는 호환 legacy playbook이 없으면 `Stop`은 아무것도 출력하지 않습니다.
- `Stop`은 `doctor`를 실행하지 않고, hook을 block하지 않고, continuation을 요청하지 않고, file을 쓰지 않고, tool output을 다시 쓰지 않고, network call을 하지 않습니다.
- Public docs에는 private path, branch name, pull request number, credential, company name, internal URL을 넣지 않습니다.

## Task 1: 실패하는 Stop Reminder 테스트 추가

**파일:**

- 수정: `test/adapters.test.mjs`

**단계:**

1. `AI_AGENT_PLAYBOOK_HOOK_EVENTS`가 없으면 `Stop`이 조용한지 테스트합니다.
2. 대상에 playbook이 있고 `AI_AGENT_PLAYBOOK_HOOK_EVENTS=Stop`이면 `Stop`이 valid hook JSON을 출력하는지 테스트합니다.
3. Playbook이 없는 대상은 조용한지 테스트합니다.
4. 실행 전후 file list를 비교해 file write가 없는지 확인합니다.

**실행:**

```powershell
npm test
```

**예상:** 아직 `Stop`이 지원되지 않으므로 새 Stop 테스트가 실패합니다.

## Task 2: Minimal Stop Reminder 구현

**파일:**

- 수정: `adapters/shared/context-hook.mjs`

**단계:**

1. Optional reminder event에 `Stop`을 추가합니다.
2. `Stop`을 전용 reminder 함수로 보냅니다.
3. `hasPlaybook(target)`이 true일 때만 짧은 hook JSON reminder를 반환합니다.
4. 메시지는 generic하게 유지합니다. 필요하면 수동으로 `doctor`를 실행하고, durable handoff fact는 worklog/current docs에 기록하라고 안내합니다.

**실행:**

```powershell
npm test
```

**예상:** Stop 테스트와 기존 hook 테스트가 모두 통과합니다.

## Task 3: 문서와 번역 갱신

**파일:**

- 수정: `docs/harness-runtime.md`
- 수정: `docs/runtime-roadmap.md`
- 수정: `adapters/codex/README.md`
- 수정: `adapters/claude-code/README.md`
- 수정: `translations/ko/` 아래 대응 파일

**단계:**

1. `Stop`은 opt-in only라고 문서화합니다.
2. Blocking이나 continuation이 아니라 reminder라고 명시합니다.
3. `UserPromptSubmit`과 `PostToolUse` 설명은 유지합니다.
4. English source edit과 함께 한국어 번역을 갱신합니다.

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

**예상:** 모든 check가 통과합니다. V6 파일만 stage하고 commit합니다.
