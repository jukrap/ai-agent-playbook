# MCP 권한 모델

플레이북 MCP 서버의 기본값은 읽기 전용 분석과 목록 접근입니다.

## 권한 단계

- `read`: 검색, 상태 확인, 목록, 배치 상태, 자료, 지시문, 분석.
- `scaffold`: 계획, 작업 기록, 실행 기록 같은 제한된 플레이북 기록 생성.
- `managed-write`: `.ai-agent-playbook` 내부 관리 파일 갱신.
- `project-write`: 프로젝트 소스 파일 수정. 기본값에서는 비활성입니다.

## 기본 동작

기본 MCP 서버는 읽기 전용 도구, 자료, 지시문을 노출합니다. 도구에는 읽기 전용 표시가 붙으며 프로젝트 파일을 쓰지 않아야 합니다.

기본 지시문은 검토 작업을 필수 근거, 선택 근거, 중단 조건, 검증 기대치에 맞춰 안내합니다. 지시문 자체는 쓰기 권한을 열지 않고, 생성된 실행 단서를 장기 기억으로 승격하지 않습니다.

읽기 전용 도구는 도구 스키마가 선택지를 제공할 때 선택형 로컬 엔진을 호출할 수 있습니다. 예를 들어 `writing_naturalness_check`와 `writing_naturalness_report`는 `engine: "auto" | "js" | "python"`을 받습니다. Python 경로도 대상 프로젝트 안의 상대 경로 글 파일만 읽고 JSON 결과를 반환할 뿐, 파일을 쓰거나 네트워크를 호출하지 않습니다.

기본 자료는 AI 앱이 도구를 고르기 전에 읽을 수 있는 압축된 구조화 정보를 제공합니다.

- `ai-agent-playbook://capabilities`: 능력 목록과 적용 범위 요약.
- `ai-agent-playbook://skills`: 스킬 분류와 호환 래퍼 정보.
- `ai-agent-playbook://workflows`: 함께 제공하는 작업 흐름 절차.
- `ai-agent-playbook://adapters`: Codex, Codex App, Claude Code, MCP 설정 요약.
- `ai-agent-playbook://adapter-readiness`: 어댑터 점검/설정 명령, 준비 상태 점검, 쓰기 금지 경계.
- `ai-agent-playbook://agent-usage-guide`: 자료, 지시문, 읽기 전용 도구를 고르는 짧은 사용 순서 안내.
- `ai-agent-playbook://playbook-layout`: 구조화된 `.ai-agent-playbook` 배치 역할과 권장 읽기 순서.
- `ai-agent-playbook://reference-adoption`: 참고 자료 목록, 채택 기록, 상태, 승격 경계 요약.
- `ai-agent-playbook://mcp-permission-model`: 이 권한 모델의 구조화된 JSON.

Gate와 graph review prompt에는 다음이 포함됩니다.

- `agent_orchestration_review`
- `repo_graph_review`
- `ci_quality_gate_review`
- `release_deployment_gate_review`
- `security_compliance_gate_review`

Scaffold 단계와 관리 파일 쓰기 도구는 기본으로 노출하지 않습니다. AI 앱이 명시적으로 켜는 쓰기 도구를 봐야 할 때만 로컬 서버를 `aapb mcp --enable-write-tools`로 시작합니다.

현재 명시적으로 켜는 쓰기 도구는 다음입니다.

- `workflow_run_start`: `.ai-agent-playbook/workflows/runs/` 아래 실행 기록 파일을 미리 보거나 생성합니다.
- `write_gate_advisory`: `.ai-agent-playbook/runtime/reports/write-gate/` 아래 쓰기 전 점검 조언을 미리 보거나 저장합니다.
- `reference_ledger_update`: `.ai-agent-playbook/knowledge/reference-adoption-ledger.md`에 누락된 행을 미리 보거나 추가합니다.
- `reference_ledger_decision`: 기존 참고 자료 채택 기록 행 하나의 결정을 미리 보거나 갱신합니다.
- `reference_source_registry_update`: `.ai-agent-playbook/knowledge/sources.json`에 누락된 자료 출처 항목을 미리 보거나 추가합니다.

쓰기 가능한 모든 도구는 도구 호출 인자 `apply` 값을 요구합니다. `apply: false`는 미리 보기만 반환하고, `apply: true`는 기존 대상 경로 검증을 거쳐서만 씁니다.

기본 읽기 전용 도구 추가 항목은 다음입니다.

- `capability_catalog`
- `skill_catalog`
- `workflow_list`
- `workflow_run_preview`
- `playbook_layout`
- `index_status`
- `runtime_schema_check`
- `evidence_locator_check`
- `writing_naturalness_check`
- `writing_naturalness_report`
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
