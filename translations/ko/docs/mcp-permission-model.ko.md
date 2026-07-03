# MCP 권한 모델

Harness OS MCP의 기본값은 읽기 전용 분석과 catalog 접근입니다.

## 권한 단계

- `read`: 검색, 상태 확인, catalog, layout 상태, resource, prompt, 분석.
- `scaffold`: plan, worklog, run 같은 제한된 playbook 기록 생성.
- `managed-write`: `.ai-playbook` 내부 관리 파일 갱신.
- `project-write`: 프로젝트 소스 파일 수정. 기본값에서는 비활성입니다.

## 기본 동작

기본 MCP 서버는 읽기 전용 tool, resource, prompt를 노출합니다. Tool에는 read-only annotation이 붙으며 프로젝트 파일을 쓰지 않아야 합니다.

기본 prompt는 리뷰 작업을 필수 근거, 선택 근거, 중단 조건, 검증 기대치에 맞춰 안내합니다. Prompt 자체는 쓰기 권한을 열지 않고, 생성된 runtime hint를 memory로 승격하지 않습니다.

기본 resource는 AI 앱이 도구를 고르기 전에 읽을 수 있는 압축된 구조화 정보를 제공합니다.

- `ai-playbook://capabilities`: capability catalog와 coverage summary.
- `ai-playbook://skills`: skill taxonomy와 compatibility wrapper metadata.
- `ai-playbook://workflows`: bundled workflow recipe.
- `ai-playbook://adapters`: Codex, Codex App, Claude Code, MCP 설정 요약.
- `ai-playbook://adapter-readiness`: adapter check/config 명령, readiness check, no-write boundary.
- `ai-playbook://playbook-layout-v2`: `.ai-playbook` v2 layout 역할과 권장 읽기 순서.
- `ai-playbook://reference-adoption`: reference registry, ledger, status, promotion boundary 요약.
- `ai-playbook://mcp-permission-model`: 이 권한 모델의 structured JSON.

Gate와 graph review prompt에는 다음이 포함됩니다.

- `agent_orchestration_review`
- `repo_graph_review`
- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`

Scaffold-tier와 managed-write tool은 기본으로 노출하지 않습니다. AI 앱이 opt-in write tool을 봐야 할 때만 local server를 `ai-playbook mcp --enable-write-tools`로 시작합니다.

현재 opt-in write tool은 다음입니다.

- `workflow_run_start`: `.ai-playbook/workflows/runs/` 아래 workflow run file을 미리 보거나 생성합니다.
- `write_gate_advisory`: `.ai-playbook/runtime/reports/write-gate/` 아래 runtime advisory를 미리 보거나 저장합니다.
- `reference_ledger_update`: `.ai-playbook/knowledge/reference-adoption-ledger.md`에 누락된 row를 미리 보거나 추가합니다.
- `reference_ledger_decision`: 기존 reference adoption ledger row 하나의 decision을 미리 보거나 갱신합니다.
- `reference_source_registry_update`: `.ai-playbook/knowledge/sources.json`에 누락된 source entry를 미리 보거나 추가합니다.

쓰기 가능한 모든 tool은 tool-call `apply` boolean을 요구합니다. `apply: false`는 dry-run preview를 반환하고, `apply: true`는 기존 target path validation을 거쳐서만 씁니다.

기본 읽기 전용 tool 추가 항목은 다음입니다.

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
- `reference_adoption_status`
- `reference_source_registry_preview`
- `reference_source_registry_check`
- `reference_source_registry_update_preview`
- `reference_ledger_check`
- `reference_ledger_update_preview`
- `reference_ledger_decision_preview`

## Write Gate

쓰기 가능한 tool은 server opt-in과 `apply: true` 같은 명시적 호출 인자를 모두 요구해야 합니다. 적용 전에는 dry-run plan, target path 검증, audit trail을 만들어야 합니다.

MCP 계층은 여전히 bootstrap, install, update, uninstall, prune, snapshot apply, canon promotion, rename, rewrite, project source write 명령을 노출하지 않습니다.
