# Harness OS

Harness OS는 이 저장소의 런타임, 스킬, MCP, 프로젝트 메모리 모델을 확장한 v1 이름입니다.

목표는 `.ai-playbook`을 무작정 키우는 것이 아닙니다. 사람이 신뢰하는 지식, 도구가 만든 산출물, 재사용 스킬, 워크플로우 recipe, 통합 표면을 분리해 특정 스택 습관에 기대지 않고 여러 개발 영역을 다루는 것입니다.

## 설계 원칙

- capability 우선 taxonomy: 기술 스택보다 문제 공간과 작업 능력을 먼저 기준으로 둡니다.
- 기본 호환성: 기존 스킬 이름과 v1 playbook 경로를 유지하면서 v2 구조를 추가합니다.
- local-first runtime: index, report, graph, snapshot, cache는 `runtime/` 아래에 둡니다.
- 명시적 승격: runtime 산출물은 검토 후 `memory/`로 옮기기 전까지 신뢰 지식이 아닙니다.
- read-only MCP 기본값: 분석 도구를 기본 노출하고, 쓰기 도구는 명시적 opt-in 설계를 요구합니다.
- reference adoption: 외부 자료는 일상 프롬프트에 노이즈로 남기지 않고 로컬 capability로 정제합니다.

## 주요 표면

- `src/catalog`: capability, skill, workflow catalog.
- `src/layout`: `.ai-playbook` v1/v2 layout 감지와 migration.
- `src/runtime`: 로컬 cache와 index.
- `src/mcp-tools.mjs`: MCP tools, resources, prompts.
- `templates/project-playbook`: 프로젝트에 복사되는 memory/runtime 구조.
- `skills`: 설치 가능한 agent skill과 reference.

## 호환성

기존 v1 playbook은 계속 동작합니다. v2 layout은 `policy/`, `memory/`, `workflows/`, `knowledge/`, `runtime/`, `integrations/`를 추가하며, 기존 top-level 파일과 디렉터리는 최소 한 릴리스 라인 동안 유지합니다.

