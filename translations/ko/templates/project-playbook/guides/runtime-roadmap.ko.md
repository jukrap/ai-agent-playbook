# Runtime Roadmap Guide

프로젝트에 이미 `.ai-playbook/`이 있고 문서 하네스만 유지할지, 선택적 runtime hook을 더할지 판단할 때 사용합니다.

기본 답은 문서 하네스 우선입니다. Runtime hook은 프로젝트가 자동 reminder나 context injection에서 이득을 보고, agent 환경이 해당 hook을 안정적으로 지원할 때만 유용합니다.

## 문서 하네스부터 안정화

Hook을 고려하기 전에 아래를 먼저 합니다.

- `doctor`를 실행하고 남은 warning을 기록합니다.
- `START_HERE.md`, `CURRENT.md`, `questions.md`를 조정해 template prompt가 남지 않게 합니다.
- `.ai-playbook/`을 commit할지 local-only로 둘지 결정합니다.
- Durable current fact를 `CURRENT.md`, maps, runbooks, decisions로 옮깁니다.
- Detailed history는 `worklogs/`에 두고 durable fact가 있으면 summary를 만듭니다.
- Source playbook checkout에서 `guides sync --dry-run`을 사용해 local edit을 덮어쓰지 않고 누락된 support guide를 확인합니다.
- Adapter나 automation이 read-only health signal을 필요로 하면 `guides sync --check --diff --json`, `migrate path --json`, `doctor --json`, `doctor --reminder --json`, `adapter check --json`을 사용합니다.
- Cleanup 전에는 `managed check`와 `managed catalog`를 사용하고, 선택 제거 전에는 `managed prune --json`, 전체 uninstall preview 전에는 `managed uninstall --json`을 사용합니다.
- 같은 관심사에 hook을 추가하기 전에 `operator check`, `operator search`, `operator context`, `operator analyze`, `operator map`, `operator audit`, `operator gc`, `rules check`, `diagnostics check`, `qa tui-check`를 operator-visible diagnostics로 먼저 사용합니다.

## Runtime 준비 체크리스트

아래가 모두 참일 때만 선택적 hook을 고려합니다.

- 프로젝트에 명확한 root agent entrypoint와 최신 `.ai-playbook/` 파일이 있습니다.
- 팀이 public docs와 local-only docs의 경계를 이해합니다.
- 대상 agent가 현재 환경에서 lifecycle hook을 지원합니다.
- 매일 쓰기 전에 hook output을 local fixture로 테스트할 수 있습니다.
- Source adapter가 이 대상 프로젝트에서 `adapter check`를 통과합니다.
- 선택적 reminder event는 기본값이 아니라 `AI_PLAYBOOK_HOOK_EVENTS` 같은 local 설정으로 명시적으로 켭니다.
- Hook을 configuration으로 비활성화할 수 있습니다.
- Native project instruction과 injected context가 서로 중복되지 않습니다.
- Hook이 project file을 자동으로 쓰지 않습니다.
- Hook이 자체 project-memory loader를 새로 만들지 않고 `context --json`을 사용할 수 있습니다.

## 적절한 Hook 책임

좋은 첫 hook 책임은 작습니다.

- Native context가 부족할 때 `START_HERE.md`, `CURRENT.md`, `SKILLS.md`, `GIT.md` 기반 compact project-memory context를 주입합니다.
- 편집된 file path를 관련 project guide나 rule file과 매칭합니다.
- Lifecycle event가 명시적으로 켜진 경우에만 commit, push, PR, merge, worklog, doctor-like prompt에 reminder를 냅니다.
- Handoff 전 `doctor` 실행을 상기하거나, 작은 local signal에는 `doctor --reminder --json`을 사용합니다.
- Blocking이나 continuation 없이 짧은 opt-in `Stop` handoff reminder를 제공합니다.
- Context compaction 뒤 deduplication state를 비웁니다.

피해야 할 hook:

- 파일을 덮어씁니다.
- 매 prompt마다 비싼 audit을 실행합니다.
- Global shell command에 의존합니다.
- Project policy를 저장소 밖에 숨깁니다.
- Planning, testing, debugging, review, verification discipline을 대체합니다.
- Operator가 명시적으로 실행할 수 있는 read-only CLI diagnostics를 중복합니다.

## 권장 migration 순서

1. `.ai-playbook/`을 안정화하고 `doctor`를 실행합니다.
2. 프로젝트가 아직 legacy `ai-playbook/`을 사용한다면 `migrate path --json`으로 preview하고, 폴더 이동, 참조 갱신, `.gitignore` 변경을 검토한 뒤에만 적용합니다.
3. `guides sync --dry-run`으로 누락 guide를 확인한 뒤, 검토한 `guides sync`를 실행합니다. Local edit을 덮어쓰기 전에는 `guides sync --check --diff --json`으로 stale guide를 검토합니다.
4. 복사된 playbook file 제거 또는 adopt 여부를 판단할 때 `managed check`를 실행합니다.
5. Hook을 켜기 전에 decision note에 hook intent를 문서화합니다.
6. Source playbook의 `adapter check` 명령을 선택한 adapter에 대해 실행합니다.
7. Local customization이 필요하면 hook input/output fixture test를 만듭니다.
8. Reminder 또는 context-injection behavior만 먼저 켭니다.
9. Opt-out 경로를 유지하고 남은 risk를 worklog에 기록합니다.

## Adapter 메모

Codex App과 Claude Code에서는 짧은 timeout을 가진 Node 기반 hook을 선호합니다. Hook program은 지원되는 JSON을 stdout에 쓰고, debug log는 stderr에 쓰며, Windows path를 안전하게 처리하고, 기본적으로 network call을 피해야 합니다.

Global `ai-playbook` 명령을 요구하지 않습니다. 안정 호출은 아래입니다.

```powershell
node .\bin\ai-playbook.mjs <command>
```

원본 playbook 저장소에는 read-only adapter 예시가 있습니다. 이를 프로젝트 필수 조건이 아니라 로컬 출발점으로 다룹니다.

이 예시 중 하나를 켜기 전에는 source checkout에서 대응하는 read-only check를 실행합니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter claude-code --json
```

추가 reminder event는 local hook 설정에서만 켭니다.

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

이 event는 관련 없는 prompt, missing playbook, unsupported payload, non-edit tool에서 조용히 빠져야 합니다. `Stop`은 handoff reminder일 뿐이며 block, continuation 요청, doctor 실행, file write, network call을 하지 않아야 합니다.

## 완료 기준

- 프로젝트가 hook 없이도 동작합니다.
- Hook은 hidden policy가 아니라 reminder 또는 context만 더합니다.
- 선택한 adapter가 local activation 전에 read-only self-check를 통과합니다.
- Guide check에 설명되지 않은 missing guide가 없고, stale guide를 검토했습니다.
- `doctor`에 설명되지 않은 failure가 없습니다.
- 남은 warning이 문서화되어 있습니다.
- 사람이 hook layer를 꺼도 project memory를 잃지 않습니다.
