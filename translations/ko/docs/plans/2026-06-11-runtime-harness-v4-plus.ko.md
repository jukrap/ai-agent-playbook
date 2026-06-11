# Runtime Harness V4+ 구현 계획

> 권장 실행 방식: 새 구현 브랜치를 만들고, 각 phase 뒤 저장소 검증 체크리스트를 실행합니다.

**목표:** 현재의 document-first, opt-in, no-network, no-hidden-policy 경계를 유지하면서 runtime harness를 read-only adapter reminder 너머로 확장합니다.

**구조:** CLI와 `.ai-playbook/` 문서 하네스를 안정 core로 유지합니다. Runtime 자동화는 diagnostics, local configuration helper, 제한적 blocking/continuation 실험 순서로만 추가합니다. 각 runtime 동작은 이 계획에서 명시하지 않는 한 기본값으로 꺼져 있어야 합니다.

**기술 스택:** Dependency-free Node ESM, Node test runner, PowerShell 검증 스크립트, 영어 Markdown 원문과 한국어 번역.

---

## 현재 기준선

현재 저장소에는 아래가 있습니다.

- `bootstrap`, `doctor`, `guides sync`, `context`, `adapter check`, plan, worklog를 위한 deterministic CLI
- doctor, guide check, context, adapter readiness용 JSON schema version `1`
- shared context runner 위의 Codex와 Claude Code read-only hook wrapper
- 기본 hook event `SessionStart`, `PostCompact`
- `AI_PLAYBOOK_HOOK_EVENTS`를 통한 opt-in `UserPromptSubmit`, `PostToolUse` lifecycle reminder
- 지원 hook output, quiet path, 공백 경로, 비ASCII 경로, no-write behavior fixture test

다음 작업은 이 기준선을 runtime-first harness로 대체하면 안 됩니다. 먼저 document/CLI harness의 관측 가능성을 높이고, 그 다음 선택적 runtime 사용을 더 쉽게 검증하게 해야 합니다.

## 절대 지킬 경계

- Hook을 기본 installer에 넣지 않습니다.
- Hook에서 project file을 자동 편집하지 않습니다.
- Tool output을 다시 쓰지 않습니다.
- Hook이나 doctor check에서 network call을 하지 않습니다.
- Root `AGENTS.md`를 기본으로 다시 주입하지 않습니다.
- Public docs에 외부 harness 이름, 개인 경로, branch name, pull request number, credential, company name, internal URL을 넣지 않습니다.
- 새 public English markdown은 한국어 번역 파일과 함께 추가합니다.
- 모든 CLI output schema는 안정적이고 versioned 상태로 유지합니다.
- Blocking behavior보다 warning/reminder behavior를 우선합니다.

## V4: Diagnostics And Freshness Layer

V4는 더 강한 hook behavior를 추가하기 전에 core CLI를 강화해야 합니다.

### V4 목표

- Stale project playbook material을 local edit을 덮어쓰지 않고 보이게 합니다.
- Hook과 setup script가 작은 "remind해야 하는가?" signal을 안정적으로 물어볼 수 있게 합니다.
- Worklog와 guide template의 non-blocking freshness check를 추가합니다.
- 새 동작은 모두 read-only로 유지합니다.

### V4 범위

1. Guide manifest와 stale guide reporting.
2. Worklog summary freshness check.
3. Doctor reminder signal.
4. 문서와 project guide 업데이트.

### V4 Task 1: Guide Manifest 지원 추가

**파일:**

- 생성: `templates/project-playbook/guides/manifest.json`
- 수정: `src/harness.mjs`
- 수정: `test/cli.test.mjs`
- 수정: `docs/harness-runtime.md`
- 수정: `templates/project-playbook/guides/runtime-roadmap.md`
- 수정: `translations/ko/**` 아래 대응 번역

**설계:**

- Source template guide file에 대해 `schemaVersion`, guide `path`, stable content hash를 가진 manifest를 추가합니다.
- Manifest는 source template guide folder 안에 둬서 `guides sync --check`가 쓰기 없이 source와 target을 비교할 수 있게 합니다.
- `guides sync --check --json`의 guide entry를 `{ path, status }`에서 optional `sourceHash`, `targetHash`, `status`까지 포함하도록 확장합니다.
- 기존 `missing`, `present` status는 유지합니다.
- Target guide가 있지만 source guide hash와 다르면 `stale` status를 추가합니다.
- 명확한 migration policy가 생기기 전까지 stale guide가 기본 실패가 되지 않게 합니다. V4에서는 `summary.stale`만 보고하고 `ok`는 missing guide 기준으로만 둘지, 아니면 `--strict` flag를 추가할지 하나를 선택하고 테스트합니다.

**테스트:**

- Fresh bootstrap은 모든 guide를 `present`, `stale: 0`으로 보고합니다.
- Guide를 삭제하면 `missing`과 non-zero를 보고합니다.
- 기존 guide를 수정하면 쓰기 없이 `stale`을 보고합니다.
- `guides sync --check`는 local guide edit을 덮어쓰지 않습니다.
- 공백 경로와 비ASCII 경로가 계속 통과합니다.

### V4 Task 2: Worklog Summary Freshness Check 추가

**파일:**

- 수정: `src/harness.mjs`
- 수정: `test/cli.test.mjs`
- 수정: `docs/harness-runtime.md`
- 수정: `translations/ko/**` 아래 대응 번역

**설계:**

- Doctor check에 `freshness` category를 추가합니다.
- `.ai-playbook/worklogs/YYYY-MM/*.md` 파일은 있는데 대응하는 `.ai-playbook/worklogs/summaries/YYYY-MM.md`가 없는 month를 감지합니다.
- 같은 month의 summary file보다 최신 worklog entry가 있으면 감지합니다.
- 기본 doctor mode에서는 warn이며 fail이 아닙니다.
- `doctor --strict`에서는 기존 strict 정책처럼 warning도 실패로 처리합니다.
- V4에서는 worklog content를 parse하지 않고 filesystem shape와 timestamp만 사용합니다.

**테스트:**

- Worklog가 없으면 pass 또는 no-op check입니다.
- Summary 없는 worklog는 warning을 냅니다.
- Worklog보다 최신 summary는 pass입니다.
- Summary보다 최신 worklog가 있으면 warning을 냅니다.
- `doctor --json`에 stable check id와 paths가 포함됩니다.

### V4 Task 3: Doctor Reminder Signal 추가

**파일:**

- 수정: `src/harness.mjs`
- 수정: `src/cli.mjs`
- 수정: `adapters/shared/context-hook.mjs`
- 수정: `test/cli.test.mjs`
- 수정: `test/adapters.test.mjs`
- 수정: 관련 문서와 번역

**설계:**

- Hook에서 doctor를 자동 실행하기보다 CLI signal을 우선합니다.
- 현재 코드 확인 뒤 더 작은 구현을 선택합니다.
  - `doctor <target> --reminder --json`, 또는
  - `harness reminder <target> --json`
- JSON은 작게 유지합니다: `{ schemaVersion, ok, target, reminders[] }`.
- Reminder entry는 `{ id, level, message, paths }` 구조를 사용합니다.
- 가능하면 기존 lightweight fact를 재사용합니다: missing playbook, V4 Task 1의 stale guide, V4 Task 2의 worklog freshness, 비싼 scan 없이 알 수 있는 public-safety failure.
- Hook은 명시적으로 opt in된 경우에만 이 signal을 호출할 수 있고, 빠른 상태를 유지해야 합니다. 비싸지면 hook에서는 쓰지 않고 manual CLI command로만 둡니다.

**테스트:**

- Reminder JSON이 안정적입니다.
- Missing playbook은 setup reminder를 만듭니다.
- Fresh playbook은 reminder가 없거나 low-noise success object를 만듭니다.
- Hook path는 opt-in이 없으면 조용히 빠집니다.
- 파일을 쓰지 않습니다.

### V4 Task 4: 선택적 Stop Reminder Prototype

이 작업은 Task 1-3이 review된 뒤에만 진행합니다.

**파일:**

- 수정: `adapters/shared/context-hook.mjs`
- 수정: `test/adapters.test.mjs`
- 수정: adapter 문서와 번역

**설계:**

- `AI_PLAYBOOK_HOOK_EVENTS`를 통해 `Stop` event를 opt in으로 추가합니다.
- Non-blocking으로 유지합니다.
- Continuation을 요청하지 않습니다.
- Doctor를 자동 실행하지 않습니다.
- 대상에 `.ai-playbook/`이 있을 때만 짧은 reminder를 출력합니다.
- Event가 너무 자주 발생한다면 cooldown 또는 deterministic quiet path를 사용합니다. State file 없이 믿을 만한 cooldown을 만들 수 없다면 아직 `Stop`을 추가하지 않습니다.

**테스트:**

- `Stop`은 기본값에서 조용합니다.
- `Stop`은 명시적으로 opt in된 경우에만 출력합니다.
- Missing playbook은 조용합니다.
- Output은 valid hook JSON입니다.
- 파일을 쓰지 않습니다.

## V5: Local Adapter Configuration Layer

V5는 사용자가 hook을 수동으로 실제 활성화하면서 반복적인 설정 실수를 겪을 때만 가치가 있습니다.

### V5 목표

- 사용자 설정을 자동 변경하지 않고 manual adapter setup을 쉽게 만듭니다.
- 생성 config를 눈으로 검토할 수 있게 유지합니다.
- Core policy를 특정 adapter로 옮기지 않고 Codex와 Claude Code를 지원합니다.

### V5 범위

1. Read-only config rendering command 추가.
2. 사용자가 명시한 local settings path 검증.
3. Copy-paste-safe setup flow로 adapter 문서 개선.

### 제안 CLI

```powershell
node .\bin\ai-playbook.mjs adapter config <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter config <target> --adapter claude-code --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --settings <local-settings-path> --json
```

### V5 경계

- 기본 command는 config를 출력만 하고 쓰지 않습니다.
- Write mode가 필요해지면 explicit flag, dry-run, user-provided local settings path confinement이 필요합니다.
- Global settings path를 추측하지 않습니다.
- Global command를 요구하지 않습니다.
- Plugin을 자동 설치하지 않습니다.

### V5 테스트

- Target과 repo root가 알려졌을 때 placeholder 없는 local path로 config JSON을 출력합니다.
- Settings validation은 missing file, malformed JSON, matching hook command를 처리합니다.
- Windows, 공백, 비ASCII 경로를 다룹니다.
- 향후 explicit write flag가 추가되기 전까지 쓰기가 발생하지 않습니다.

## V6: Opt-in Stop Reminder Checkpoint

V6는 blocking보다 작게 유지합니다. V4와 V5 뒤의 안전한 다음 runtime 단계는 control flow를 바꾸지 않고 end-of-session handoff를 돕는 opt-in `Stop` reminder입니다.

### V6 목표

- Blocking이나 continuation 없이 마지막 handoff 알림을 추가합니다.
- Reminder를 opt-in, quiet by default, no-network, no-write로 유지합니다.
- 더 강한 runtime behavior를 검토하기 전에 end-of-session reminder가 시끄러워지지 않는지 확인합니다.

### V6 범위

1. `Stop`을 `AI_PLAYBOOK_HOOK_EVENTS`의 optional reminder event로 추가합니다.
2. 대상에 playbook이 있을 때만 짧은 handoff reminder를 출력합니다.
3. V6에는 blocking, continuation, automatic doctor execution을 넣지 않습니다.

### V6 경계

- 기본값은 off입니다.
- Block, continue, doctor 실행을 하지 않습니다.
- File write, tool output rewrite, network call을 하지 않습니다.
- Missing 또는 malformed payload는 조용히 빠집니다.
- Missing playbook context는 조용히 빠집니다.

### V6 테스트

- `Stop`은 기본값에서 조용합니다.
- `Stop`은 명시적으로 opt in된 경우에만 출력합니다.
- Missing playbook은 조용합니다.
- Output은 valid hook JSON입니다.
- 파일을 쓰지 않습니다.

### 이후 Blocking 후보

Controlled blocking은 이후 실험으로 남깁니다. 아래 후보는 더 강한 runtime contract와 loop prevention이 필요합니다.

- Public-safety failure: staged 또는 edited public doc에 local absolute path가 들어감.
- Project에 hook이 명시적으로 설정되어 있는데 required project playbook file이 빠짐.
- Commit 또는 PR intent가 있고 required verification이 실행되지 않았다는 signal이 명시적이고 신뢰 가능한 경우.

## V7: Plugin Or Package Shell

V7은 선택 사항입니다. Local adapter setup이 충분히 자주 쓰여 package shell이 실제 마찰을 줄일 때만 진행합니다.

### V7 목표

- 같은 core command를 얇은 runtime-specific shell 뒤에 포장합니다.
- Project rule은 plugin-only file이 아니라 `AGENTS.md`와 `.ai-playbook/`에 둡니다.
- Adapter-specific file은 `adapters/` 또는 명확히 experimental package에 둡니다.

### V7 범위

- Codex plugin proof of concept.
- Claude Code command 또는 skill wrapper proof of concept.
- Packaged command smoke test.
- Package가 선택 사항임을 문서화.

### V7 경계

- Plugin을 기본 install script에 넣지 않습니다.
- 명시적 동의 없이 사용자 설정을 바꾸지 않습니다.
- Public docs가 특정 agent runtime에 의존하지 않게 합니다.
- Project docs에서 파생됐다는 점이 명확하지 않으면 source policy를 generated plugin file에 중복하지 않습니다.

## 아직 권장하지 않는 것

실제 사용에서 필요성이 보이기 전까지 아래는 피합니다.

- 모든 session start에서 automatic doctor 실행
- Hook에서 automatic file rewrite
- Networked telemetry
- Central service dependency
- Runtime-only project policy
- Broad prompt rewriting
- Default blocking hooks

## 각 Phase 검증

각 phase 뒤 저장소 검증을 실행합니다.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

Public document hygiene도 확인합니다.

```powershell
rg -n "<external-harness-denylist-pattern>" README.md docs templates skills translations\ko adapters -g "*.md" -g "*.json"
rg -n '[A-Za-z]:\\' README.md docs templates skills translations\ko adapters -g "*.md" -g "*.json"
```

두 검색 모두 public default reference를 반환하지 않아야 합니다.

## 다음 채팅방용 권장 프롬프트

```text
현재 저장소 `ai-agent-playbook`에서 Runtime Harness V4 작업을 이어서 진행해줘.

먼저 현재 branch/status/remotes를 확인하고 아래를 읽어줘.
- AGENTS.md
- docs/maintenance.md
- docs/harness-runtime.md
- docs/runtime-roadmap.md
- docs/plans/2026-06-11-runtime-harness-v4-plus.md
- translations/ko/docs/plans/2026-06-11-runtime-harness-v4-plus.ko.md
- adapters/codex/README.md
- adapters/claude-code/README.md
- adapters/shared/context-hook.mjs
- src/harness.mjs
- src/cli.mjs
- src/adapter-readiness.mjs
- test/cli.test.mjs
- test/adapters.test.mjs

목표:
- V4 diagnostics and freshness를 먼저 구현한다.
- Blocking hook이나 automatic doctor execution으로 바로 가지 않는다.
- Document/CLI harness를 기본 경로로 유지한다.
- Runtime hook은 opt-in, read-only by default, no-network, 관련 signal이 강할 때만 quiet하지 않게 유지한다.

권장 V4 순서:
1. 최신 main 기준 새 구현 branch를 만든다.
2. `guides sync --check --json`에 guide manifest와 stale guide reporting을 추가한다.
3. `doctor --json`에 worklog summary freshness warning을 추가한다.
4. 싸고 read-only로 유지할 수 있을 때만 작은 doctor reminder signal을 추가한다.
5. 앞의 세 task가 통과하고 low-noise인 것이 확인된 뒤에만 `Stop` reminder를 검토한다.

필수 테스트:
- 기존 테스트는 계속 통과해야 한다.
- missing/present/stale guide fixture test를 추가한다.
- worklog summary freshness fixture test를 추가한다.
- 새 output field가 있으면 JSON schema assertion을 추가한다.
- 모든 check command가 no-write임을 확인한다.
- 필요한 곳에는 Windows path, 공백 path, 비ASCII path case를 포함한다.

필수 검증:
- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- 계획 문서의 public docs external harness denylist와 local path search

경계:
- Public docs에 외부 harness 이름, 개인 경로, branch name, PR number, credential, company name, internal URL을 넣지 않는다.
- English source edit과 함께 Korean translation을 갱신한다.
- 설치된 local skill copy를 source처럼 편집하지 않는다.
- 명시적으로 stage하고 unrelated change를 revert하지 않는다.
```
