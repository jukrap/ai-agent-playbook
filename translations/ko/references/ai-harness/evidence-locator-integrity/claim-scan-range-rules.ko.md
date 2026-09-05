# Claim Scan Range Rules

Claim이 강할수록 scan range도 명시적이어야 합니다. 모호한 검색으로 넓은 claim을 하기보다 좁지만 증명된 statement를 선호합니다.

## Claim Types

| Claim | Required evidence |
| --- | --- |
| Code behavior | Exact source locator와 필요한 경우 related test, route, caller, contract |
| Structure or architecture | File inventory, package/workspace evidence, import/export search, relevant architecture docs |
| Absence 또는 "no usages found" | Search term, tool, included root, excluded root, skipped generated folder, timestamp |
| Risk or blast radius | Caller/importer, public API, config, schema, data path, deployment 또는 package surface |
| Runtime report result | Runtime artifact path, `kind`, scan range, source index, truncation status, schema validation status |
| Source registry fact | Source id, owner/status/freshness, locator type, credential boundary, promotion policy |
| Command result | Command, exit code, environment/cwd label, timestamp, relevant output summary 또는 transcript path |
| Data result | Source id, query id, table/dataset grain, sample 또는 aggregate boundary, freshness, caveats |
| Manual QA observation | Environment, steps, screen/device/browser, timestamp, captured artifact, known non-replayed paths |

## Absence Claims

"no references", "not used", "no route", "no migration", "no tests" 같은 claim에는 다음을 포함합니다.

- 사용한 tool: `rg`, language server, AST search, package graph, runtime index, database metadata 또는 다른 source.
- Search term과 pattern.
- Included root와 excluded path.
- Scanned file type 또는 language.
- 의도적으로 skipped된 generated, vendored, archived, runtime folder.
- Timestamp 또는 source revision.
- Dynamic dispatch, reflection, config-driven loading, database trigger, external system 가능성이 있을 때 residual risk.

Scan range가 불완전하면 "unused" 대신 "`src/`와 `test/`에서 direct text match 없음"처럼 bounded claim을 말합니다.

## Unsafe Evidence Anti-Patterns

- 단일 text search로 project-wide absence를 주장합니다.
- Source path, source id, scan range 없는 generated summary를 인용합니다.
- Local absolute path, private endpoint, branch name, PR number, credential을 reusable docs에 복사합니다.
- Stale runtime index, old worklog, cached analysis를 current fact로 취급합니다.
- Reviewed promotion step 없이 generated graph/index/report output을 memory로 승격합니다.
- Evidence를 식별하는 데 필요한 것보다 많은 source text를 인용합니다.

## Promotion Rule

Runtime evidence는 memory 또는 documentation update를 뒷받침할 수 있지만 그 자체가 durable memory는 아닙니다. Promotion 전에는 locator, scan range, freshness, caveat, existing canon 또는 project memory와의 conflict를 확인합니다.
