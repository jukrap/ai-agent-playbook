# MCP Permission Model

Harness OS MCP의 기본값은 read-only 분석과 catalog 접근입니다.

## Tiers

- `read`: search, state, catalog, layout status, analysis.
- `scaffold`: plan, worklog, run 같은 제한된 playbook 기록 생성.
- `managed-write`: `.ai-playbook` 내부 managed file 갱신.
- `project-write`: 프로젝트 source file 수정. 기본값에서는 비활성입니다.

## Current Default

기본 MCP server는 read-only tool, resource, prompt를 노출합니다. Tool은 read-only로 annotate되며 프로젝트 파일을 쓰지 않아야 합니다.

기본 prompt는 review 작업을 required evidence, optional evidence, stop condition, verification expectation에 맞춰 안내합니다. Prompt 자체는 쓰기 권한을 열지 않으며 generated runtime hint를 memory로 승격하지 않습니다.

Gate와 graph review prompt에는 다음이 포함됩니다.

- `agent_orchestration_review`
- `repo_graph_review`
- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`

Scaffold-tier와 managed-write tool은 기본으로 노출하지 않습니다. AI app이 opt-in write tool을 봐야 할 때만 local server를 `ai-playbook mcp --enable-write-tools`로 시작합니다.

현재 opt-in write tool:

- `workflow_run_start`: `.ai-playbook/workflows/runs/` 아래 workflow run file을 preview 또는 생성합니다.
- `write_gate_advisory`: `.ai-playbook/runtime/reports/write-gate/` 아래 runtime advisory를 preview 또는 저장합니다.

두 tool 모두 tool-call `apply` boolean을 요구합니다. `apply: false`는 dry-run preview를 반환하고, `apply: true`는 기존 target path validation을 거쳐서만 씁니다.

기본 read-only 추가 항목:

- `capability_catalog`
- `skill_catalog`
- `workflow_list`
- `workflow_run_preview`
- `playbook_layout`
- `index_status`
- `runtime_schema_check`
- `evidence_locator_check`
- `index_search`
- `symbol_outline`
- `dependency_inventory`
- `route_api_hints`
- `repo_graph_preview`
- `write_gate_preview`
- `reference_inventory`
- `reference_inspect`
- `reference_adoption_queue`
- `reference_capability_matrix`
- `reference_adoption_plan`
- `reference_source_registry_preview`
- `reference_source_registry_check`
- `reference_ledger_check`

## Write Gate

쓰기 가능 tool은 server opt-in과 `apply: true` 같은 명시적 호출 인자를 모두 요구해야 합니다. 적용 전에는 dry-run plan, target path 검증, audit trail을 만들어야 합니다.
