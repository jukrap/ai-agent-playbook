# AI Agent Playbook v2 Reference Adoption Plan

## Status

AI Agent Playbook v1에서는 v2 playbook layout, capability taxonomy, workflow recipe, runtime file inventory, read-only MCP catalog/search tool, preview-only write gate를 추가했습니다.

첫 검수에서는 확장 전에 바로 고쳐야 할 문제가 두 가지 있었습니다.

- write gate가 `runtime`이라는 경로 조각을 모두 generated output으로 보고 `src/runtime/index.ts` 같은 일반 프로젝트 소스까지 막을 수 있었습니다.
- database primary skill의 전역 이름이 `change-safety`라 설치형 skill 환경에서 너무 넓고 기존 compatibility skill과 충돌할 수 있었습니다.

## Reference Sweep

local reference collection은 원문을 그대로 복사할 수 있는 규모가 아니므로, 인덱싱과 단계별 채택이 필요합니다. 첫 sweep에서는 top-level project shape, package/config file, README/AGENTS/SKILL surface, reference-heavy skill 예시를 중심으로 확인했습니다.

반복적으로 쓸 만한 패턴은 다음과 같습니다.

- trigger skill은 짧게 유지하고 깊은 절차는 reference file로 라우팅합니다.
- 일부 도구는 code change를 pre-write advisory artifact와 post-write delta check가 있는 transaction으로 다룹니다.
- repository fact system은 generated report와 promoted canonical fact를 분리하고, 이후 promoted fact의 drift를 확인합니다.
- graph/index system은 report 생성 전에 extraction schema, confidence label, security validation을 명시합니다.
- connector-heavy system은 generic search/read workflow와 source-specific reference file을 분리합니다.
- 성숙한 harness는 command, hook, agent, skill, MCP tool, validation을 하나의 coordinated surface로 다룹니다.
- security-focused reference는 prompt-defense와 input-sanitization baseline을 specialized agent 전반에 반복 적용합니다.

채택 규칙은 원문 브랜드나 잡음이 아니라 pattern과 contract를 가져오는 것입니다. 특정 reference가 reusable feature로 이어지면 그 결정은 local plan, reference note, validator 중 하나에 기록합니다.

## Direction

AI Agent Playbook v2는 "layout plus catalog"에서 "evidence-backed operating system"으로 가야 합니다.

- 구조적 주장은 scan range나 근거 artifact를 함께 가져야 합니다.
- runtime report는 기본적으로 generated/local 산출물로 둡니다.
- 사람이 신뢰하는 memory는 검토된 artifact에서 명시적으로 승격합니다.
- MCP는 기본 read-only를 유지하고, write surface는 명시적 enablement, dry-run data, target validation, audit record를 요구합니다.
- category path가 installer에서 평탄화되더라도 skill name 자체가 전역적으로 의미 있어야 합니다.
- reference pack은 stack보다 capability와 problem type을 우선하고, stack detail은 profile에 둡니다.

## Workstreams

### 1. Reference Adoption Ledger

local reference 분석용 compact local ledger를 만듭니다.

- project id, domain, useful surface, adoption candidate, rejected noise, risk note
- 개인 절대 경로 금지
- 큰 upstream excerpt 원문 복사 금지
- status는 `new`, `reviewed`, `adopted`, `rejected`, `deferred`로 명확히 구분

Acceptance:

- validator가 public docs 안의 개인 경로와 oversized excerpt를 거부합니다.
- ledger를 capability category별로 요약할 수 있습니다.

### 2. Transaction Write Gate v2

현재 preview-only write gate를 transaction model로 확장합니다.

- invocation id, intent, scan range, candidates, blockers, warnings가 있는 pre-write advisory
- 움직이는 latest pointer가 아니라 matching advisory를 읽는 post-write check
- unexpected new file, changed generated output, detectable unsafe cast/escape hatch 변화 확인
- `.ai-agent-playbook/runtime/reports` 아래 machine-readable artifact manifest

Acceptance:

- pre-write는 read-only이고 안정적입니다.
- matching advisory가 없으면 post-write는 clean으로 꾸미지 않고 `unknown`을 보고합니다.
- generated runtime file 차단은 playbook runtime path에만 적용됩니다.

### 3. Canon Promotion and Drift

generated fact를 trusted memory로 승격하는 명시 경로를 추가합니다.

- runtime index/report에서 draft fact 생성
- 사람 또는 명시 command를 통해 `memory/maps`, `memory/contracts`, `knowledge/references`로 승격
- promoted memory와 fresh runtime report를 비교하는 drift check
- promotion note는 `memory/decisions`에 기록

Acceptance:

- runtime report는 memory로 자동 복사되지 않습니다.
- drift output은 missing, stale, changed, unverified source를 분리해 보여줍니다.

### 4. Index and Graph v2

runtime index를 file inventory 이상으로 확장합니다.

- doc/source registry
- skill/capability registry snapshot
- symbol/function outline
- route/API/data map hint
- duplicate/clone cue
- dependency and ownership graph draft

Acceptance:

- 각 index에는 schema version과 confidence/source field가 있습니다.
- graph/report artifact는 승격 전까지 `runtime/` 아래에 머뭅니다.
- 기본값에서 embedding provider를 요구하지 않습니다.

### 5. Capability Pack Expansion

stack-first taxonomy로 되돌아가지 않으면서 넓은 개발 영역을 추가합니다.

- backend reviewer/resolver: Java, Kotlin, Go, Python, Node, .NET, PHP
- frontend/design: visual QA, accessibility, design token, state/data flow
- database/data: migration safety, query performance, BI/reporting, ETL
- devops: container, deployment, CI, observability, release
- security: threat modeling, dependency/CVE review, secrets, authz
- mobile: Expo/RN, native, WebView, release QA
- documentation/project management: spec, ADR, handoff, onboarding
- 3D/media/tooling: Three.js, canvas, presentation/report package

Acceptance:

- 각 primary skill은 전역적으로 의미 있는 이름을 가집니다.
- stack-specific material은 `references/stacks` 또는 동등한 profile에 둡니다.
- compatibility wrapper는 짧게 유지하고 primary skill로 라우팅합니다.

### 6. MCP v2 Surface

MCP를 resource, prompt, tool 전체로 확장합니다.

- resource: catalog, layout, index status, workflow recipe, recent report
- prompt: onboarding, pre-write, post-write, canon promotion, security audit
- tool: read-only search/status 우선, opt-in scaffold/write는 그 다음

Acceptance:

- write tool은 명시적으로 enable하지 않으면 숨기거나 비활성화합니다.
- write-capable tool은 항상 `apply: true`, target validation, dry-run operation, audit output을 요구합니다.

### 7. Workflow Runs

workflow execution을 눈에 보이게 만듭니다.

- recipe id, inputs, selected skills, commands, artifacts, blockers, verification을 담은 run manifest
- 긴 작업과 재개 세션을 위한 handoff file
- run summary는 검토 후에만 worklog로 승격

Acceptance:

- 전체 대화를 읽지 않아도 workflow run을 inspect할 수 있습니다.
- worklog는 completed fact와 open risk를 구분합니다.

## First Implementation Batch

1. v1 review fix를 유지하고 test로 보호합니다.
2. reference-adoption ledger template과 validator를 추가합니다.
3. local reference collection directory를 위한 `reference inventory` CLI preview command를 추가합니다.
4. project write를 켜지 않고 write-gate preview artifact에 transaction id를 추가합니다.
5. canon draft/check 문서와 작은 runtime-to-memory promotion recipe를 추가합니다.
6. language/backend/database/security review용 다음 primary skill pack을 추가하고 compatibility가 필요한 경우에만 wrapper를 둡니다.
7. 새 read-only artifact를 노출하도록 MCP resource/prompt를 확장합니다.

## Verification

각 batch 이후 필수 확인:

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- 변경된 CLI/MCP/validator 동작의 targeted test

## Non-goals For This Batch

- 기본 network indexing 없음.
- 기본 embedding provider 없음.
- MCP를 통한 자동 project code edit 없음.
- 큰 upstream reference 원문을 public docs에 그대로 복사하지 않음.
- public docs에 개인 절대 경로, credential, internal URL, branch name, PR number를 넣지 않음.
