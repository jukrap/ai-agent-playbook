# MCP Permission Model

Harness OS MCP의 기본값은 read-only 분석과 catalog 접근입니다.

## Tiers

- `read`: search, state, catalog, layout status, analysis.
- `scaffold`: plan, worklog, run 같은 제한된 playbook 기록 생성.
- `managed-write`: `.ai-playbook` 내부 managed file 갱신.
- `project-write`: 프로젝트 source file 수정. 기본값에서는 비활성입니다.

## Current Default

기본 MCP server는 read-only tool, resource, prompt를 노출합니다. Tool은 read-only로 annotate되며 프로젝트 파일을 쓰지 않아야 합니다.

기본 read-only 추가 항목:

- `capability_catalog`
- `skill_catalog`
- `workflow_list`
- `playbook_layout`
- `index_status`
- `index_search`
- `symbol_outline`
- `dependency_inventory`
- `write_gate_preview`

## Write Gate

쓰기 가능 tool은 server opt-in과 `apply: true` 같은 명시적 호출 인자를 모두 요구해야 합니다. 적용 전에는 dry-run plan, target path 검증, audit trail을 만들어야 합니다.
