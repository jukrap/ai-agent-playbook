# 프로젝트 스킬 정책

프로젝트에 이식 가능한 스킬 선택 기준이 필요할 때 사용합니다. 작게 유지하고 프로젝트에 맞게 조정한 뒤 project playbook을 커밋하거나 공유합니다.

## 기본 원칙

- 현재 작업에 명확히 필요한 최소 스킬만 사용합니다.
- 저장소, 최신 사용자 지시, 실제 코드가 일반 스킬 조언보다 우선합니다.
- 어떤 작업 규칙이 활성화됐는지 사용자가 볼 수 있게 선택한 스킬을 짧게 알립니다.
- 설치된 스킬이 있다고 해서 전부 불러오지 않습니다.

## 프로세스 스킬

외부 프로세스 스킬 묶음은 계획, 디버깅, TDD, 분류, 아키텍처 리뷰, 이슈 쪼개기, 인수인계에 유용할 수 있습니다. 이 프로젝트가 명시적으로 요구하지 않는 한 선택형 도우미로 다룹니다.

작업 방식 자체가 주제라면 프로세스 스킬을 먼저 쓰고, 그 다음 저장소를 제약하는 가장 작은 프로젝트 전용 스킬이나 문서를 사용합니다.

## 프로젝트 가드레일 스킬

반복되는 저장소 관심사에는 설치된 playbook 스킬을 사용합니다.

- `project-bootstrap`: 얇은 루트 에이전트 부트스트랩과 `.ai-playbook/` 설정.
- `repo-onboarding`: 낯설거나 오래된 저장소 진입.
- `project-doc-system`: `AGENTS.md`, `.ai-playbook/`, maps, runbooks, plans, worklogs 정리.
- `git-worklog-guardrails`: 스테이징, 커밋, 푸시, PR 본문, 작업 기록.
- `pre-action-fact-gate`: 영향이 큰 작업 전에 사실, 근거 위치, 쓰기 위험, 되돌림 경로를 확인할 때.
- `change-safety` 또는 `review-work-light`: 최근 구현 작업을 인수인계 전에 점검할 때.
- `cleanup-ai-slop`: 신뢰가 낮아 보이는 코드를 범위를 제한해 동작 보존 방식으로 정리할 때.

## 역량별 라우팅

스택명 스킬보다 작업 능력 중심 스킬을 먼저 고릅니다.

- 기반과 문서: `project-bootstrap`, `repo-onboarding`, `project-doc-system`, `documentation-artifact-package`, `adr-spec-handoff`.
- 전달과 품질 게이트: `git-worklog-guardrails`, `ci-quality-gate`, `ci-failure-triage`, `flaky-test-triage`, `eval-harness-design`, `capability-witness-history`.
- 아키텍처: `boundary-review`, `feature-slice-boundary`, `domain-model-change`, `monorepo-package-boundary`.
- 프론트엔드와 구현 디자인: `style-policy-selection`, `frontend-ui-polish`, `frontend-state-data-flow`, `frontend-accessibility-review`, `browser-dom-change`, `design-system-handoff`.
- 디자인 방향과 원본 인수인계: `design-brief-direction`, `brand-identity-system`, `design-reference-analysis`, `image-to-code-handoff`.
- 인터랙션과 3D 화면: `interactive-media-3d-review`를 쓰고, 렌더링 검증은 프론트엔드 품질 스킬과 함께 확인합니다.
- 백엔드와 연동: `backend-change-safety`, `api-contract-boundary`, `request-validation-error-contract`, `job-worker-reliability`, `server-rendered-change`, `connector-integration-change`.
- 데이터베이스와 데이터: `database-change-safety`, `schema-migration-plan`, `query-performance-review`, `data-integrity-constraints`, `data-pipeline-review`, `data-contract-lineage-review`.
- DevOps와 릴리스: `container-change-safety`, `deployment-release-check`, `package-publish-readiness`, `observability-incident-triage`.
- 보안과 컴플라이언스: `security-review`, `auth-access-control`, `dependency-supply-chain-review`, `license-notice-review`, `security-compliance-gate`.
- 모바일: `native-release-readiness`, `device-permission-qa`, `offline-sync-review`.
- AI 하네스: `mcp-server-design`, `agent-skill-authoring`, `skill-pack-governance`, `context-engineering-memory-design`, `runtime-index-cache-design`, `agent-orchestration-handoff`.
- 레거시 호환성: 먼저 `legacy-change-safety`를 사용하고, 스택 세부사항이 중요할 때만 `legacy-java-spring-mvc`, `legacy-php-lamp`, `legacy-dotnet-webforms`, `legacy-jquery-web`, `legacy-android-webview-hybrid` 같은 wrapper를 추가합니다.

## MCP를 사용할 수 있을 때

AI 앱에서 playbook MCP 서버를 사용할 수 있다면 수정 전에 read-only 탐색을 우선합니다.

- 리소스부터 읽습니다: `ai-playbook://capabilities`, `ai-playbook://skills`, `ai-playbook://workflows`, `ai-playbook://adapters`, `ai-playbook://playbook-layout-v2`, `ai-playbook://mcp-permission-model`.
- catalog와 layout 도구로 필요한 스킬, recipe, playbook 파일을 고릅니다.
- 큰 수정 전에는 `operator_check`, `operator_search`, `operator_preflight`, `write_gate_preview`, 도메인별 도구를 사용합니다.
- 쓰기 가능한 MCP 도구가 당연히 있다고 가정하지 않습니다. 해당 도구는 `mcp --enable-write-tools`와 명시적 tool-call `apply: true`가 모두 필요합니다.
- runtime report, index, screenshot, graph hint는 검토와 승격 전까지 신뢰된 memory로 취급하지 않습니다.

## 구조 증거

저장소 전체 구조에 관한 주장을 뒷받침할 기계적 근거가 필요할 때 저장소 감사 또는 구조 증거 도구가 도움이 될 수 있습니다. 설치되어 있고 스택에 맞을 때만 사용합니다.

- 첫 점검, 오래된 기준선, 큰 리팩터링, 사전 검토에는 전체 감사를 선호합니다.
- 최신 기준선 이후의 작은 국소 질문에는 빠른 후속 점검을 선호합니다.
- 스캔 범위와 최신성을 밝히지 않고 부재, 중복 구조, 죽은 export, 순환, 정리 개수를 단정하지 않습니다.
- 이 프로젝트가 설치하고 선택한 작업 흐름이 아니라면 작성 전/후 자동 게이트가 활성화됐다고 가정하지 않습니다.

## 호환성

다른 에이전트 런타임의 hook, slash command, plugin environment variable이 여기서 동작한다고 가정하지 않습니다. 다른 에이전트 기준으로 작성된 스킬이나 도구라면 의도를 지원되는 명령과 저장소 로컬 규칙으로 옮깁니다.

이 프로젝트가 나중에 runtime hook을 켜더라도 선택 사항으로 유지하고 문서화합니다. Hook은 reminder나 context를 주입할 수 있지만 durable rule은 여전히 `AGENTS.md`, `.ai-playbook/`, project docs에 있어야 합니다.

## Skill 대신 project docs에 써야 할 때

- `AGENTS.md`에는 루트 진입점만 두고, 상시 skill 정책은 이 파일에, 더 긴 프로젝트 지침은 `.ai-playbook/` 문서에 둡니다.
- 제품 범위는 제품/명세 문서에 둡니다.
- 마일스톤은 계획 문서에 둡니다.
- 프로젝트 메모리는 `.ai-playbook/` 아래에 둡니다.
- 프로젝트를 넘어 재사용되는 동작일 때만 스킬을 만들거나 설치합니다.
