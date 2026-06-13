# Claude Code 어댑터

Claude Code는 이 저장소를 두 계층에서 사용할 수 있습니다.

- project `AGENTS.md`와 `.ai-playbook/`에 있는 portable document harness;
- 같은 local CLI를 호출하는 선택적 Claude Code hook 또는 skill.

기본 경로는 여전히 문서와 CLI 하네스입니다. 프로젝트가 이 playbook을 사용하기 위해 Claude Code hook, plugin, user-level settings에 의존하면 안 됩니다.

## 런타임 CLI

Package publish 뒤에는 `npx ai-agent-playbook`, global install 뒤에는 `ai-playbook`, 로컬 checkout에서는 `node .\bin\ai-playbook.mjs`를 사용합니다. Adapter hook path를 settings에 보관할 때는 렌더링된 hook command가 안정적인 위치를 가리키도록 global install 또는 로컬 checkout을 권장합니다.

```powershell
npx ai-agent-playbook bootstrap <target-repo> --dry-run
npx ai-agent-playbook guides sync <target-repo> --check --diff --json
npx ai-agent-playbook migrate path <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --reminder --json
npx ai-agent-playbook context <target-repo> --json
npx ai-agent-playbook adapter config <target-repo> --adapter claude-code --json
npx ai-agent-playbook adapter check <target-repo> --adapter claude-code --json
npx ai-agent-playbook adapter check <target-repo> --adapter claude-code --settings <local-settings-path> --json
```

선택적 adapter-local package shell은 Claude Code adapter를 고정한 같은 hook, config, check 경로를 노출합니다.

```powershell
node .\adapters\claude-code\package.mjs config <target-repo> --json
node .\adapters\claude-code\package.mjs check <target-repo> --json
node .\adapters\claude-code\package.mjs hook
```

이 shell은 자동 설치되지 않고 settings를 쓰지 않으며 packaging 편의 기능일 뿐입니다. 기본 문서 하네스에는 main CLI를 우선 사용합니다.

`doctor --reminder --json`은 wrapper나 script가 작은 read-only local signal만 필요할 때 사용합니다. Hook 예시는 doctor를 자동 실행하지 않습니다.

Legacy `ai-playbook/` 프로젝트에서는 `migrate path --json`을 preview로만 먼저 사용합니다. 이 흐름은 hook 설정과 분리되어 있으며 Claude Code settings를 설치하거나 편집하지 않습니다.

`context`는 아래 project playbook 파일만 읽습니다.

- `.ai-playbook/START_HERE.md`
- `.ai-playbook/CURRENT.md`
- `.ai-playbook/SKILLS.md`
- `.ai-playbook/GIT.md`

기본적으로 root `AGENTS.md`를 다시 주입하지 않습니다.

## 선택적 context hook PoC

`hook.mjs`는 Claude Code hook 환경을 위한 read-only proof of concept입니다. Stdin에서 hook payload를 읽고, payload의 `cwd`를 대상 프로젝트로 사용하며, 아래 event에서 `hookSpecificOutput.additionalContext`를 출력합니다.

- `SessionStart`
- `PostCompact`

Hook은 스스로 설치되지 않고, project file을 편집하지 않고, tool output을 다시 쓰지 않고, network call을 하지 않습니다. `.ai-playbook/`이 없거나 지원되지 않거나 읽을 수 없으면 stdout 없이 성공 종료합니다.

기본적으로 hook은 `SessionStart`와 `PostCompact`만 처리합니다. 좁은 lifecycle reminder를 실험하려면 local에서 명시적으로 opt in합니다.

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit`은 commit, push, PR, merge, worklog, doctor 계열 intent에서만 reminder를 냅니다. `PostToolUse`는 edit-like tool payload에서 changed path를 읽을 수 있을 때만 reminder를 냅니다. `Stop`은 짧은 end-of-session handoff reminder만 냅니다. 관련 없는 prompt, missing playbook, unsupported payload에서는 조용히 빠지며, block, session continuation, doctor 실행, file write, network call을 하지 않습니다.

Hook을 local Claude Code 설정에 연결하기 전에 local config를 렌더링하고 검토합니다.

```powershell
node .\bin\ai-playbook.mjs adapter config <target-repo> --adapter claude-code --json
```

Renderer는 read-only입니다. 이 checkout의 absolute hook path를 사용한 hook command와 붙여 넣을 수 있는 config를 출력하며, settings file을 쓰거나 output에 placeholder path를 남기지 않습니다.

그 다음 adapter check를 실행합니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter claude-code --json
```

Failure가 있으면 hook을 켜기 전에 대상 프로젝트나 adapter checkout의 설정 문제로 보고 수정합니다. 이 check는 read-only이며 지원 hook JSON과 quiet unsupported path를 모두 확인합니다.

Local Claude Code settings file을 수동으로 편집한 뒤에는 settings file도 검증합니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter claude-code --settings <local-settings-path> --json
```

`settings.example.json`은 renderer만으로 충분하지 않을 때의 수동 참고용으로만 사용합니다. Timeout은 짧게 유지하고, troubleshooting 중에만 `AI_PLAYBOOK_DEBUG=1`로 debug output을 stderr에 남깁니다.

## Skills와 commands

Claude Code는 project, personal, plugin 위치에서 skill을 읽을 수 있습니다. 이 저장소는 아직 Claude Code 전용 skill wrapper를 설치하지 않습니다. 재사용 스킬은 `skills/` 아래에 유지하고, 이 adapter는 이후 전용 Claude Code packaging path가 추가되기 전까지 얇은 bridge로 둡니다.

## 원본 규칙

Project policy는 `.ai-playbook/`에 두고, 재사용 가능한 source content는 이 저장소에 둡니다. Claude Code hook과 skill은 선택적 runtime 편의 기능이며 project memory의 유일한 위치가 아닙니다.
