# 구조화 플레이북 레이아웃

구조화된 `.ai-playbook` 레이아웃은 오래 유지할 프로젝트 기억과 도구가 생성한 런타임 산출물, 통합 설정을 분리합니다.

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

## 문맥 선택

에이전트는 기본적으로 `.ai-playbook/`의 모든 파일을 읽지 않습니다. 먼저 `START_HERE.md`, `CURRENT.md`, `questions.md`를 보고, `operator context --path <file> --json`으로 관련 `memory/context/`, map, contract, runbook, decision, guide, plan을 고릅니다. 그래도 필요한 파일이 불분명하면 큰 메모를 읽기 전에 `operator search` 또는 `index search`를 사용합니다.

생성된 근거는 `runtime/`, 작업 중 근거는 `workflows/runs/`, 오래 남길 이력은 `workflows/worklogs/`에 둡니다. 검토된 사실만 `memory/` 또는 `knowledge/`로 승격합니다.

## Canon Facts

Runtime evidence는 canon fact 후보를 만들 수 있지만 그 자체로 신뢰된 memory가 되지는 않습니다. 검토한 fact JSON만 명시적 promotion 단계 뒤 `memory/` 아래에 두고, `canon check`로 source report와 현재 file 기준 drift를 확인합니다. Check는 파일을 쓰지 않고 `verified`, `missing`, `stale`, `changed`, `unverified` 상태를 보고합니다.

## Workflow Runs

`workflows/recipes/` 아래 recipe는 반복 가능한 절차를 설명합니다. `workflow run-preview`는 target-local recipe를 먼저 읽고 없으면 bundled template으로 fallback한 뒤, inputs, outputs, skills, tools, stop conditions, verification을 포함한 read-only run manifest를 반환합니다. 이 명령은 `workflows/runs/` 아래 파일을 만들지 않습니다.

미래 run 생성은 scaffold tier에 속합니다. Run-start 구현은 `workflows/runs/` 아래에만 쓸 수 있고, source나 memory를 편집하지 않고 새롭고 제한된 run artifact를 만들어야 하며, 명시적 승격 전까지 generated evidence와 durable fact를 분리해야 합니다.

## Migration

먼저 preview mode로 layout migration을 확인합니다.

```bash
ai-playbook migrate layout <target> --to structured --json
```

작업 목록을 검토한 뒤 적용합니다.

```bash
ai-playbook migrate layout <target> --to structured --apply
```

마이그레이션은 구조화 디렉터리를 만들고, 알려진 구 레이아웃 파일을 충돌 없이 활성 위치로 옮긴 뒤 이전 위치를 `archive/legacy-layout/` 아래에 보관합니다.
