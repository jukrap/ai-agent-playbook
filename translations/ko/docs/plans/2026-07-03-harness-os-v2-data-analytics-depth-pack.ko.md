# AI Agent Playbook v2 Data Analytics Depth Pack 계획

> **구현자용:** AI harness governance prompt slice 이후 이어서 진행합니다. 현재 `data` 카테고리는 유용한 범용 스킬을 갖고 있지만 modern analytics, ingestion, quality, lineage, retrieval-heavy system을 다루기에는 아직 얕습니다.

**목표:** Generic pipeline/report review를 넘어 data contract와 lineage, data quality observability, analytics instrumentation/experiment, retrieval/knowledge ingestion pipeline을 위한 first-class capability skill로 data 지침을 확장합니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 workflow-node data contract, credential indirection, SQL agent, document loader, structured output parser, vector/retrieval store, data quality test, visual/report QA, generated evidence ledger 패턴이 반복됩니다. 이를 로컬 capability와 validation rule로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## 기준 상태

- 계획 시작 시점의 skill catalog는 66개 스킬을 포함했습니다.
- `data` category에는 `data-pipeline-review`, `analytics-reporting-review`, `data-migration-integrity` 3개 스킬이 있습니다.
- `database` category는 이제 schema, query performance, constraint integrity를 다룹니다. Data skill은 이 database 책임을 중복하지 않아야 합니다.
- 기존 workflow에는 `data-integrity-review`가 있지만 contract, lineage, observability, instrumentation, experiment, retrieval pipeline을 아직 구분하지 않습니다.
- MCP prompt에는 `data_integrity_review`가 있습니다. Data pipeline, analytics instrumentation, retrieval/knowledge ingestion review를 first-class brief로 라우팅하지는 않습니다.

## 레퍼런스에서 채택할 규칙

- **Storage와 data product behavior를 분리합니다:** Database schema safety는 dataset grain, lineage, freshness, metric ownership, consumer contract safety와 다릅니다.
- **Data grain을 명시합니다:** 모든 dataset, metric, report, event, document chunk, vector record에는 grain, owner, source, freshness, caveat rule이 필요합니다.
- **Credential은 indirect하게 유지합니다:** Data source, warehouse, API, BI tool, vector store, document loader는 secret이나 private URL이 아니라 configuration 또는 environment name으로 참조합니다.
- **Generated evidence는 provisional로 다룹니다:** Sample row, query output, index summary, retrieval match는 decision을 뒷받침할 수 있지만 검토 없이 trusted memory가 되지 않습니다.
- **Bounded check를 선호합니다:** Quality check는 scope, sample size, reconciliation window, null/duplicate/orphan rule, freshness threshold를 명시해야 합니다.
- **Default network provider를 피합니다:** Embedding, vector, warehouse, BI provider integration은 opt-in으로 유지하고 privacy, cost, invalidation rule을 문서화합니다.

## Workstream A: Data Contract And Lineage

### Task A1: Data Contract Lineage Review Skill

**Candidate skill:** `data/data-contract-lineage-review`

**References:**

- `dataset-contract-checks.md`
- `lineage-and-consumer-impact.md`

**Coverage:**

- Dataset grain, owner, source of truth, freshness target, schema shape, partition/window, consumer list, caveat, retention.
- Event schema, warehouse table, mart, export file, BI dataset, workflow-node payload, API-ingested record.
- Producer에서 transformation, consumer까지 이어지는 lineage와 report/dashboard/export/API consumer 영향.

**Acceptance:**

- Skill은 contract와 lineage 작업을 generic pipeline review에서 분리해 라우팅합니다.
- Reference는 owner/grain/freshness/consumer checklist와 stale-contract handling을 포함합니다.
- Docs와 translation은 새 스킬을 `data` map에 포함합니다.

## Workstream B: Data Quality Observability

### Task B1: Data Quality Observability Skill

**Candidate skill:** `data/data-quality-observability`

**References:**

- `quality-check-design.md`
- `freshness-anomaly-and-alerts.md`

**Coverage:**

- Null, duplicate, orphan, range, enum, referential, volume, distribution, freshness, completeness, drift check.
- Batch job, stream, import/export, dashboard source, warehouse quality signal.
- Alert threshold, owner handoff, known caveat, quarantine/repair path, incident worklog.

**Acceptance:**

- Skill은 warehouse check를 직접 실행한다고 가장하지 않고 요청/검증해야 할 evidence를 정의합니다.
- Reference는 source check, transformation check, consumer check, alert check를 분리합니다.
- `data-integrity-review` recipe는 quality-heavy work에 이 skill을 가리킬 수 있습니다.

## Workstream C: Analytics Instrumentation And Experiments

### Task C1: Analytics Instrumentation Review Skill

**Candidate skill:** `data/analytics-instrumentation-review`

**References:**

- `event-tracking-plan.md`
- `funnel-cohort-experiment-checks.md`

**Coverage:**

- Tracking plan, event name, property, identity stitching, session/device/user/account grain, funnel, cohort, A/B test, attribution, sampling, consent, privacy caveat.
- Client/server event boundary, retry/dedup behavior, offline/mobile event handling, dashboard downstream consumer.

**Acceptance:**

- Skill은 frontend state/data flow와 backend connector work와 분리됩니다.
- Reference는 event ownership, naming convention, sample payload, privacy review, downstream metric impact를 요구합니다.
- 향후 MCP prompt는 instrumentation review를 route/API hint, operator search, data-integrity review로 라우팅할 수 있습니다.

## Workstream D: Retrieval And Knowledge Ingestion

### Task D1: Knowledge Retrieval Pipeline Review Skill

**Candidate skill:** `data/knowledge-retrieval-pipeline-review`

**References:**

- `document-ingestion-and-chunking.md`
- `retrieval-evaluation-and-safety.md`

**Coverage:**

- Document loader, parsing, chunking, metadata, deduplication, source freshness, access control, embedding/vector store boundary, retrieval evaluation, citation handoff.
- Data freshness, permission, retrieval quality가 중요한 RAG 또는 search-backed feature.

**Acceptance:**

- Skill은 embedding/vector provider가 optional이며 harness 기본값에서는 disabled라고 명시합니다.
- Reference는 source provenance, access control, invalidation, evaluation set, hallucination/citation check, stale-index handling을 요구합니다.
- Generated index가 관련되면 runtime/cache guidance는 `runtime-index-cache-design`으로 연결합니다.

## Workstream E: Workflow And MCP Follow-Up

### Task E1: Data Integrity Recipe Expansion

**Candidate recipe update:** `data-integrity-review`

**Acceptance:**

- Inputs에 dataset grain, contract owner, lineage scope, freshness target, quality dimension, event/retrieval scope when relevant, consumer list를 포함합니다.
- Skills는 구현된 새 data contract, quality observability, instrumentation, retrieval pipeline skill을 포함합니다.
- Verification은 source count, sampled row, quality check, reconciliation query, lineage/consumer impact, event payload sample, retrieval evaluation, freshness caveat를 포함합니다.

### Task E2: Data Pipeline Review Prompt

**Candidate prompt:** `data_pipeline_review`

**Acceptance:**

- Prompt는 read-only로 유지합니다.
- Prompt는 `workflow_run_preview` recipe `data-integrity-review`, `operator_search`, `operator_map`, `route_api_hints`, `dependency_inventory`, `index_status`, `canon_check`, `write_gate_preview`로 라우팅합니다.
- Prompt는 작업이 contract/lineage review, quality observability review, reporting review, migration integrity review, instrumentation review, retrieval ingestion review 중 무엇인지 묻습니다.

## Workstream F: Docs, Tests, And Catalog

**Acceptance:**

- README skill list와 category summary에 새 data skill을 반영합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`에 data depth map을 문서화합니다.
- 한국어 번역을 같은 변경에서 갱신합니다.
- 네 스킬을 한 번에 구현한다면 skill count 기대값을 66에서 70으로 갱신합니다.
- Catalog는 warning-free 상태를 유지합니다.

## Workstream G: 검증

각 구현 단위 뒤에 실행합니다.

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## 제안 순서

1. 이 계획을 추가하고 커밋합니다.
2. 모든 downstream data workflow를 받쳐주는 `data-contract-lineage-review`와 `data-quality-observability`를 먼저 추가합니다.
3. `analytics-instrumentation-review`와 `knowledge-retrieval-pipeline-review`를 reference와 translation과 함께 추가합니다.
4. README, classification, taxonomy docs, skill-count test를 갱신합니다.
5. `data-integrity-review` recipe와 smoke coverage를 확장합니다.
6. `data_pipeline_review` MCP prompt와 prompt contract test를 추가합니다.
7. 전체 검증을 다시 실행하고 다음 표면이 documentation artifacts, project-management workflows, managed-write tier implementation 중 무엇인지 결정합니다.

## 비목표

- 기본 warehouse, BI, embedding, vector, network provider integration은 추가하지 않습니다.
- Secret, private connection string, raw query output, private source path를 public docs에 넣지 않습니다.
- Sampled/generated data evidence를 durable memory로 자동 승격하지 않습니다.
- Database schema migration과 SQL performance skill을 대체하지 않습니다.
