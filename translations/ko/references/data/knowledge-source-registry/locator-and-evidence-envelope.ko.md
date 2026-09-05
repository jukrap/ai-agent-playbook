# Locator And Evidence Envelope

Knowledge work는 search, locate, browse, promote 순서로 진행해야 합니다. Search hit은 exact evidence를 다시 열고 확인하기 전까지 fact가 아닙니다.

## Locator Types

| Locator | Use for | Required fields |
| --- | --- | --- |
| `path-range` | Repository file, markdown, source doc | path, start line 또는 section, optional end line |
| `url` | Web doc 또는 hosted artifact | URL, access date, title, optional fragment |
| `primary-key` | Database 또는 structured record | source id, table/object, key field |
| `row-id` | Query result sample 또는 report | query id, row id, source grain |
| `thread-id` | Chat, incident, ticket thread | system, thread id, message range |
| `object-id` | Object store, file, binary | bucket/container, object id, version/hash |
| `artifact-path` | Runtime report, index, screenshot | project-relative runtime path, schema kind, generated time |
| `query-id` | Saved query 또는 dashboard panel | query id, parameter, result freshness |

## Evidence Envelope

Evidence note에는 다음을 포함합니다.

- `sourceId`: registry source id.
- `locator`: evidence를 다시 열 수 있는 exact locator.
- `query`: 사용한 search term 또는 structured query.
- `scanRange`: 검색한 것과 제외한 것.
- `freshness`: last checked time, snapshot, commit, stale caveat.
- `evidenceType`: direct quote, paraphrase, structured field, generated report, metric, screenshot, manual observation.
- `summary`: 짧은 factual summary.
- `caveats`: partial permission, stale index, missing row, sampling, ambiguous ownership.
- `promotionStatus`: runtime-only, candidate, promoted, rejected, expired.

## Search-Locate-Browse

1. 가장 작은 관련 source range를 먼저 검색합니다.
2. Search hit을 사용하기 전에 exact locator나 range를 다시 엽니다.
3. Absence claim에는 scan range를 기록합니다.
4. Generated summary와 raw hit은 provisional로 둡니다.
5. Reviewed fact만 `memory/`, `knowledge/references/`, contract, map, decision으로 promote합니다.

## Stop Conditions

다음 상황에서는 멈추거나 confidence를 낮춥니다.

- Source owner가 없습니다.
- Credential boundary가 불명확합니다.
- Source range가 unbounded입니다.
- Search는 되지만 browse/reopen은 되지 않습니다.
- Freshness를 확인할 수 없습니다.
- Locator shape가 exact evidence로 돌아갈 수 없습니다.
- Private payload가 commit될 수 있습니다.
- Generated evidence가 검토 없이 durable memory로 취급됩니다.
