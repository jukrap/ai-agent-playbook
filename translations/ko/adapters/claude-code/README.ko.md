# Claude Code 어댑터

Claude Code는 이 저장소를 두 계층에서 사용할 수 있습니다.

- project `AGENTS.md`와 `ai-playbook/`에 있는 portable document harness;
- 같은 local CLI를 호출하는 선택적 Claude Code hook 또는 skill.

기본 경로는 여전히 문서와 CLI 하네스입니다. 프로젝트가 이 playbook을 사용하기 위해 Claude Code hook, plugin, user-level settings에 의존하면 안 됩니다.

## 런타임 CLI

이 저장소 checkout에서 CLI를 실행합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs guides sync <target-repo> --check
node .\bin\ai-playbook.mjs doctor <target-repo> --json
node .\bin\ai-playbook.mjs context <target-repo> --json
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter claude-code --json
```

`context`는 아래 project playbook 파일만 읽습니다.

- `ai-playbook/START_HERE.md`
- `ai-playbook/CURRENT.md`
- `ai-playbook/SKILLS.md`
- `ai-playbook/GIT.md`

기본적으로 root `AGENTS.md`를 다시 주입하지 않습니다.

## 선택적 context hook PoC

`hook.mjs`는 Claude Code hook 환경을 위한 read-only proof of concept입니다. Stdin에서 hook payload를 읽고, payload의 `cwd`를 대상 프로젝트로 사용하며, 아래 event에서 `hookSpecificOutput.additionalContext`를 출력합니다.

- `SessionStart`
- `PostCompact`

Hook은 스스로 설치되지 않고, project file을 편집하지 않고, tool output을 다시 쓰지 않고, network call을 하지 않습니다. `ai-playbook/`이 없거나 지원되지 않거나 읽을 수 없으면 stdout 없이 성공 종료합니다.

Hook을 local Claude Code 설정에 연결하기 전에 아래를 실행합니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter claude-code --json
```

Failure가 있으면 hook을 켜기 전에 대상 프로젝트나 adapter checkout의 설정 문제로 보고 수정합니다. 이 check는 read-only이며 지원 hook JSON과 quiet unsupported path를 모두 확인합니다.

`settings.example.json`은 수동 설정 출발점으로만 사용합니다. Local Claude Code settings file에서 `<path-to-ai-agent-playbook>`을 이 checkout 경로로 바꿉니다. Timeout은 짧게 유지하고, troubleshooting 중에만 `AI_PLAYBOOK_DEBUG=1`로 debug output을 stderr에 남깁니다.

## Skills와 commands

Claude Code는 project, personal, plugin 위치에서 skill을 읽을 수 있습니다. 이 저장소는 아직 Claude Code 전용 skill wrapper를 설치하지 않습니다. 재사용 스킬은 `skills/` 아래에 유지하고, 이 adapter는 이후 전용 Claude Code packaging path가 추가되기 전까지 얇은 bridge로 둡니다.

## 원본 규칙

Project policy는 `ai-playbook/`에 두고, 재사용 가능한 source content는 이 저장소에 둡니다. Claude Code hook과 skill은 선택적 runtime 편의 기능이며 project memory의 유일한 위치가 아닙니다.
