# Playbook Layout v2

`.ai-playbook` v2는 오래 유지할 프로젝트 메모리와 도구가 생성한 runtime 산출물, 통합 설정을 분리합니다.

```text
.ai-playbook/
  README.md
  START_HERE.md
  CURRENT.md
  questions.md
  manifest.json
  config.json
  config.local.json
  policy/
  memory/
  workflows/
  knowledge/
  runtime/
  integrations/
  archive/
```

## 디렉터리 역할

- `policy/`: agent 규칙, git 정책, 안전 메모, 범위별 규칙.
- `memory/`: 안정적인 context, map, decision, contract, glossary.
- `workflows/`: recipe, runbook, plan, run, worklog, handoff.
- `knowledge/`: source registry, 채택한 reference, research note.
- `runtime/`: 생성된 cache, index, graph, report, snapshot, 임시 파일.
- `integrations/`: MCP, adapter, hook, command 설정.
- `archive/`: 더 이상 쓰지 않는 로컬 메모.

`config.json`과 `config.local.json`은 선택 사항입니다. `config preview`는 두 파일이 있을 때 읽습니다. `config.local.json`은 특정 장비의 local override용이므로 프로젝트가 의도적으로 다르게 정하지 않는 한 local-only로 둡니다.

## Canon Facts

Runtime evidence는 canon fact 후보를 만들 수 있지만 그 자체로 신뢰된 memory가 되지는 않습니다. 검토한 fact JSON만 명시적 promotion 단계 뒤 `memory/` 아래에 두고, `canon check`로 source report와 현재 file 기준 drift를 확인합니다. Check는 파일을 쓰지 않고 `verified`, `missing`, `stale`, `changed`, `unverified` 상태를 보고합니다.

## Workflow Runs

`workflows/recipes/` 아래 recipe는 반복 가능한 절차를 설명합니다. `workflow run-preview`는 target-local recipe를 먼저 읽고 없으면 bundled template으로 fallback한 뒤, inputs, outputs, skills, tools, stop conditions, verification을 포함한 read-only run manifest를 반환합니다. 이 명령은 `workflows/runs/` 아래 파일을 만들지 않습니다. 미래 apply-mode run 생성은 scaffold tier에 속합니다.

## Migration

먼저 preview mode로 layout migration을 확인합니다.

```bash
ai-playbook migrate layout <target> --to v2 --json
```

작업 목록을 검토한 뒤 적용합니다.

```bash
ai-playbook migrate layout <target> --to v2 --apply
```

Migration은 v2 디렉터리를 만들고 알려진 v1 파일을 v2 위치로 복사합니다. v1 파일은 삭제하거나 이동하지 않습니다.
