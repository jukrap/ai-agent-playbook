# Runtime Harness V13 Operator Audit and GC 계획

Status: implemented
Date: 2026-06-13

## 목표

기본 document/CLI harness 경로는 유지하면서, project playbook을 operator가 명시적으로 감사하고 cleanup 후보를 preview할 수 있는 계층을 추가합니다.

## 범위

- `operator audit <target> [--json]`을 추가합니다.
- `operator gc <target> [--apply] [--json]`를 추가합니다.
- Audit은 read-only로 유지합니다.
- GC는 preview-first로 유지하고, apply mode도 수정되지 않은 obsolete managed playbook file에만 제한합니다.
- Blocking hook, continuation, automatic doctor execution, slash command, plugin packaging은 추가하지 않습니다.

## 설계

`operator audit`는 playbook drift를 보고합니다.

- playbook markdown file의 broken relative markdown link;
- `globs`가 현재 project file과 맞지 않는 context file;
- 중복 playbook markdown content;
- `.ai-agent-playbook/`과 legacy `ai-playbook/` 폴더의 동시 존재;
- managed manifest missing, malformed, missing file, modified file 상태.

`operator gc`는 `.ai-agent-playbook/.ai-agent-playbook-install.json`을 안전 경계로 사용합니다. `--apply`가 있고 아래 조건이 모두 참일 때만 file을 제거합니다.

- file이 managed manifest에 기록되어 있습니다.
- file이 active playbook directory 아래에 있습니다.
- manifest의 source template path가 현재 checkout에 더 이상 없습니다.
- 현재 target hash가 manifest의 `targetHash`와 여전히 일치합니다.

수정된 파일은 보존하고 conflict로 보고합니다. Preview mode는 파일을 쓰지 않습니다.

## Public Interface

```powershell
node .\bin\aapb.mjs operator audit <target> --json
node .\bin\aapb.mjs operator gc <target> --json
node .\bin\aapb.mjs operator gc <target> --apply --json
```

`operator audit --json`은 `{ schemaVersion, ok, target, summary, findings, sections, warnings }`를 반환합니다.

`operator gc --json`은 `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`를 반환합니다.

## 검증

- 구현 전에 실패 테스트를 추가합니다.
- `operator audit`가 broken link, orphan context, duplicate note, legacy path drift를 파일 쓰기 없이 보고하는지 확인합니다.
- `operator gc` preview가 파일을 쓰지 않는지 확인합니다.
- `operator gc --apply`가 obsolete unmodified managed file만 제거하고, edited file은 보존하며, managed manifest를 갱신하는지 확인합니다.
- Merge 전에 repository check와 installer/updater dry-run command를 실행합니다.
