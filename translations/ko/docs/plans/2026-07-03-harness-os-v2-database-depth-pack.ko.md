# Harness OS v2 Database Depth Pack 계획

> **구현자용:** Architecture boundary pack 이후 이어서 진행합니다. 이 계획은 현재 카탈로그에서 약한 축인 database를 다룹니다. 현재 database에는 넓은 change-safety skill 하나와 migration recipe 하나만 있지만, 레퍼런스 인벤토리에는 migration order, credential handling, read-only estimate, reporting query, connector sync, reconciliation에 관한 더 풍부한 패턴이 있습니다.

**목표:** 특정 DBMS, ORM, migration tool, reporting platform, warehouse를 1차 taxonomy 축으로 만들지 않고 schema migration planning, query performance review, data integrity constraints를 위한 capability-first database 지침을 추가합니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 dry-run first execution, env/file credential indirection, connector/job status check, destructive-operation confirmation, SQL field verification, reporting query pitfall, reconciliation evidence 패턴이 반복됩니다. 이 패턴을 로컬 스킬과 reference로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, credential, branch name, PR number, 긴 발췌문은 public docs에 복사하지 않습니다.

## 기준 상태

- Architecture boundary pack 이후 스킬 카탈로그는 60개 스킬을 포함합니다.
- `database` 카테고리에는 현재 `database/database-change-safety` 하나만 있습니다.
- 기존 `database-migration` recipe는 유용하지만 production-style schema, lock, backfill, query-plan, reconciliation 작업을 다루기에는 얇습니다.
- Data migration 지침은 `data/data-migration-integrity`에 있지만, 운영 database 작업에는 schema, SQL, constraint 중심 스킬이 별도로 필요합니다.

## 레퍼런스에서 채택할 규칙

- **쓰기 전 읽기:** Write 제안 전 inventory, schema inspection, migration dry-run, explain plan, sample query, estimated impact를 우선합니다.
- **Generated output과 trusted memory를 분리합니다:** Query report, runtime index hint, connector status, dry-run output은 검토 전까지 evidence candidate입니다.
- **Credential을 보호합니다:** Env/file indirection을 사용하고 plaintext secret을 reusable docs, temp config, worklog, report에 넣지 않습니다.
- **Database change를 분류합니다:** Additive compatible change, backfill, constraint, index change, destructive change, reporting-only query change는 서로 다른 deployment와 rollback path를 가집니다.
- **Destructive operation을 확인합니다:** Drop, delete, truncate, reindex/full re-embed, irreversible migration은 명시 확인, rollback note, evidence capture가 필요합니다.
- **Rendered consumer를 검증합니다:** Migration이 성공해도 reporting query, dashboard, export, API DTO, background job은 schema 또는 SQL 변경으로 깨질 수 있습니다.

## Workstream A: Schema Migration Planning

### Task A1: Schema Migration Plan Skill

**Skill:** `database/schema-migration-plan`

**References:**

- `migration-order-and-rollback.md`
- `lock-and-deployment-window.md`

**Coverage:**

- Table, column, index, foreign key, default, nullability, constraint, enum change, stored procedure, trigger, view, seed change.
- Expand/contract migration, dual-write/read compatibility, backfill ordering, lock scope, deployment window, rollback note, post-deploy check.
- ORM, migration tool, direct SQL script, legacy schema file, manual DBA-reviewed deployment flow와의 compatibility.

## Workstream B: Query Performance Review

### Task B1: Query Performance Review Skill

**Skill:** `database/query-performance-review`

**References:**

- `query-plan-and-index-checks.md`
- `reporting-query-cost-controls.md`

**Coverage:**

- Slow query, reporting SQL, dashboard query, API list/detail query, export, aggregate, join, sort/pagination, full scan, N+1 query pattern, index selection.
- Explain plan evidence, representative parameter, row count, cardinality, query timeout/cost limit, cache behavior, rendered consumer check.
- Production metric을 지어내거나 live destructive command를 실행하지 않는 안전한 performance iteration.

## Workstream C: Data Integrity Constraints

### Task C1: Data Integrity Constraints Skill

**Skill:** `database/data-integrity-constraints`

**References:**

- `constraint-trigger-procedure-checks.md`
- `reconciliation-and-backfill-checks.md`

**Coverage:**

- Unique, foreign key, check, not-null, exclusion, generated-column, trigger, stored procedure, scheduled repair, application-level invariant 변경.
- Duplicate detection, orphan detection, repair script, reconciliation query, idempotent backfill, partial rollout, rollback constraint.
- Database-enforced invariant와 application-only validation의 분리.

## Workstream D: Workflow And MCP Follow-Up

### Task D1: Database Migration Recipe Expansion

**Candidate recipe update:** `database-migration`

**Acceptance:**

- Inputs에 volume, lock budget, compatibility window, rollback path, backfill plan, owner, dependent service, reporting consumer를 포함합니다.
- Stop conditions는 unknown data shape, unknown lock impact, missing rollback, unbounded backfill, unreviewed destructive change를 다룹니다.
- Verification은 dry-run, explain/estimate, before/after query, application compatibility, rendered report/export check, post-deploy monitoring을 포함합니다.

### Task D2: Database Change Review Prompt

**Candidate prompt:** `database_change_review`

**Acceptance for a later slice:**

- Prompt는 read-only로 유지하고 `workflow_run_preview`, `operator_search`, `operator_map`, `route_api_hints`, `write_gate_preview`, existing index/search tools로 라우팅합니다.
- Prompt는 write 추천 전 schema, query, migration, integrity, rollback, consumer evidence를 요구합니다.

## Workstream E: Docs, Tests, And Catalog

**Acceptance:**

- README skill list와 category summary에 새 database skill을 반영합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`에 database depth map을 문서화합니다.
- 한국어 번역을 같은 변경에서 갱신합니다.
- Skill count 기대값을 60에서 63으로 갱신합니다.
- Catalog는 warning-free 상태를 유지하고 wrapper check는 계속 통과합니다.

## Workstream F: 검증

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
2. `schema-migration-plan`, `query-performance-review`, `data-integrity-constraints` 스킬과 reference, 번역을 추가합니다.
3. Catalog docs와 skill-count test를 갱신한 뒤 database skill pack을 커밋합니다.
4. `database-migration` workflow recipe와 smoke coverage를 확장합니다.
5. `database_change_review` MCP prompt와 prompt contract test를 추가합니다.
6. 전체 검증을 다시 실행하고 다음 약한 표면을 선택합니다. 우선순위 후보는 AI-harness extension governance 또는 더 깊은 runtime index/report promotion입니다.

## 비목표

- Postgres-first, MySQL-first, Oracle-first, Mongo-first, warehouse-first skill 같은 DBMS-specific primary taxonomy는 만들지 않습니다.
- MCP를 통한 live database mutation은 추가하지 않습니다.
- Reusable docs 안에 secret collection이나 credential storage를 넣지 않습니다.
- Production migration, reindex, truncate, delete, drop 자동 실행은 추가하지 않습니다.
