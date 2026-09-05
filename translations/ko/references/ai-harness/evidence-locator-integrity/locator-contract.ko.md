# Evidence Locator Contract

Evidence는 다른 agent나 reviewer가 generated summary에 의존하지 않고 source를 다시 열어볼 수 있을 때 유용합니다. Claim을 증명하는 가장 작은 locator를 사용하고, reusable docs에는 machine-local detail을 넣지 않습니다.

## Required Fields

Durable evidence note는 명시적으로 또는 알려진 runtime schema를 통해 다음 field를 가져야 합니다.

- `locatorType`: `path-range`, `symbol`, `runtime-artifact`, `source-registry`, `command-output`, `url`, `issue`, `database-query`, `manual-observation` 중 하나.
- `locator`: 다시 열 수 있는 target-relative path, source id, command id, query id, URL, issue id, observation id.
- `scanRange`: 검색하거나 확인한 범위와 중요한 제외 항목.
- `freshness`: timestamp, commit, run id, source version, 또는 증명할 수 없을 때 `unknown`.
- `sourceBoundary`: local file, runtime report, registry source, external source, data source, manual observation boundary.
- `confidence`: directness와 completeness 기준의 `high`, `medium`, `low`.
- `caveats`: known gap, truncation, stale cache, generated summary, missing permission, unavailable source.

## Locator Shapes

| Locator type | Use for | Minimum locator |
| --- | --- | --- |
| `path-range` | Source, docs, templates, config, tests | target-relative path와 line 또는 section range |
| `symbol` | Function, class, component, route handler, exported binding | target-relative path, symbol name, 가능하면 line |
| `runtime-artifact` | Generated report, index, graph, eval, witness record | target-relative runtime path와 artifact `kind` |
| `source-registry` | Declared knowledge source 또는 external boundary | source registry id와 해당 source 내부 locator |
| `command-output` | Test, lint, build, query, dry-run evidence | command summary, cwd label, exit code, timestamp, retained transcript path |
| `url` | Public docs 또는 web reference | URL, access date, excerpt boundary, 필요 시 source owner |
| `issue` | Ticket, incident, PR, review thread | source id, issue id, status, access boundary |
| `database-query` | Sampled row, reconciliation, report check | source id, query id, schema/table scope, sample 또는 aggregate boundary |
| `manual-observation` | Browser/device/manual QA | observation id, environment, timestamp, steps, captured artifact path |

## Safety Rules

- Local absolute path 대신 `src/auth/session.ts` 같은 target-relative path를 사용합니다.
- Bulky evidence는 runtime artifact로 저장하고 inline excerpt는 작고 관련 있는 범위로 제한합니다.
- Token value, cookie value, private key, password, bearer header 대신 credential reference 또는 source id를 저장합니다.
- Generated report는 evidence candidate입니다. Source range를 다시 열 수 없으면 durable truth로 인용하지 않습니다.
- External source는 source boundary와 freshness를 함께 적습니다. Upstream branding, private path, internal URL, long excerpt를 reusable docs에 복사하지 않습니다.

## Confidence

- `high`: exact source 또는 artifact로 직접 연결되는 locator가 있고 scan range가 bounded이며 결정에 충분히 fresh합니다.
- `medium`: direct evidence는 있지만 scan range, freshness, source boundary에 caveat가 있습니다.
- `low`: generated summary, partial search, stale source, inaccessible source, replayable artifact 없는 manual observation입니다.
