# Runtime Harness V12 Operator Map + Context Preview

**목표:** 사람이나 agent가 더 많은 context를 읽거나 작업을 계획하기 전에 무엇을 확인할지 판단할 수 있도록 명시 실행형 read-only operator 명령 두 개를 추가합니다.

**구조:** `operator context`는 context를 주입하거나 파일을 쓰지 않고 path-scoped playbook context, matching rule, 관련 map/runbook을 미리 보여줍니다. `operator map`은 durable map 문서를 만들지 않고 local file에서 stack, architecture, quality, concern signal을 요약합니다.

## 범위

- `operator context <target> --path <file> [--json]`을 추가합니다.
- `operator map <target> [--json]`을 추가합니다.
- 두 명령 모두 dependency-free, local-only, no-network, no-write로 유지합니다.
- Path-scoped context matching에는 기존 rule frontmatter parsing을 재사용합니다.
- 기존 `operator check` 동작은 바꾸지 않습니다.
- Runtime 문서, 설치 문서, 대상 프로젝트 guide, roadmap 문서, 테스트, 한국어 번역을 갱신합니다.

## 비목표

- Hook 설치 또는 자동 context injection은 하지 않습니다.
- Slash command나 plugin packaging은 넣지 않습니다.
- Background analysis refresh는 넣지 않습니다.
- `.ai-agent-playbook/maps/` output을 생성하지 않습니다.
- Blocking feedback, continuation, 자동 doctor 실행은 넣지 않습니다.

## 인터페이스

```powershell
node .\bin\aapb.mjs operator context <target> --path src/example.ts --json
node .\bin\aapb.mjs operator map <target> --json
```

`operator context --json`은 다음 구조를 반환합니다.

```json
{
  "schemaVersion": "1",
  "ok": true,
  "target": "<absolute target>",
  "path": "src/example.ts",
  "summary": {},
  "coreSources": [],
  "contexts": [],
  "rules": {},
  "related": [],
  "warnings": []
}
```

`operator map --json`은 다음 구조를 반환합니다.

```json
{
  "schemaVersion": "1",
  "ok": true,
  "target": "<absolute target>",
  "summary": {},
  "stack": {},
  "architecture": {},
  "quality": {},
  "concerns": {},
  "warnings": []
}
```

## 테스트

- 두 새 명령 모두 실패 테스트를 먼저 추가합니다.
- Path normalization, 공백, 비ASCII fixture path를 포함합니다.
- `operator context`가 matching/non-matching `.ai-agent-playbook/context` file, matching rule, 관련 map/runbook을 보고하는지 확인합니다.
- `operator map`이 package manager, framework, language count, entrypoint, module boundary, test file, config, command, TODO/debug/security signal, ignored dependency directory를 보고하는지 확인합니다.
- 실행 전후 file list를 비교해 두 명령이 no-write임을 확인합니다.
- 전체 CLI test suite와 repository validation command를 실행합니다.

## 후속 후보

- 실제 프로젝트에서 `operator map`이 유용하다고 확인되면 read-only quality debt audit 명령을 추가합니다.
- 사용자가 ownership과 삭제 preview를 더 명확히 보길 원하면 managed catalog와 uninstall UX를 개선합니다.
